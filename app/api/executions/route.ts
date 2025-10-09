import { NextRequest, NextResponse } from 'next/server';
import { N8nExecution, ChatSession, GroupedExecutionsResponse, LeadData } from '@/app/types/n8n';

// Fonction pour extraire le session ID, l'input du chat et la réponse IA depuis les runData
function extractSessionData(execution: N8nExecution): { sessionId: string | null, chatInput: string | null, aiResponse: string | null, leadUsed: boolean, leadData: LeadData | null } {
  try {
    const runData = execution.data?.resultData?.runData as Record<string, unknown[]> | undefined;
    if (!runData) return { sessionId: null, chatInput: null, aiResponse: null, leadUsed: false, leadData: null };

    let sessionId = null;
    let chatInput = null;
    let aiResponse = null;
    let leadUsed = false;
    let leadData: LeadData | null = null;

    // Détecter si le node "lead" existe dans runData (c'est un node séparé, pas un tool)
    if (runData['lead']) {
      leadUsed = true;
      // Extraire les données du node lead
      const leadNode = runData['lead'];
      if (Array.isArray(leadNode) && leadNode[0]) {
        const leadExecution = leadNode[0] as Record<string, unknown>;

        // Les données du lead sont dans inputOverride, pas dans data
        const inputOverride = leadExecution?.inputOverride as Record<string, unknown>;
        const leadToolInput = inputOverride?.ai_tool as unknown[][];

        if (leadToolInput?.[0]?.[0]) {
          const leadInput = leadToolInput[0][0] as Record<string, unknown>;
          const leadJson = leadInput.json as Record<string, unknown>;

          // Le message contient souvent toutes les infos formatées
          const message = leadJson?.Message as string || leadJson?.message as string;
          const to = leadJson?.To as string;

          // Extraire les champs principaux et exclure ceux qu'on a déjà mappés
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { To: _To, Message: _Message, email, mail, subject, sujet, Subject, body, content, name, nom, phone, telephone, tel, ...otherFields } = leadJson;

          // Extraire toutes les données du lead
          leadData = {
            email: to || email as string || mail as string,
            subject: subject as string || sujet as string || Subject as string,
            message: message || body as string || content as string,
            name: name as string || nom as string,
            phone: phone as string || telephone as string || tel as string,
            ...otherFields // Inclure uniquement les autres champs non mappés
          };
        }
      }
    }

    // Chercher dans le node "When chat message received" pour sessionId et chatInput
    const chatTriggerNode = runData['When chat message received'];
    if (chatTriggerNode && Array.isArray(chatTriggerNode) && chatTriggerNode[0]) {
      const nodeExecution = chatTriggerNode[0] as Record<string, unknown>;
      const data = nodeExecution?.data as Record<string, unknown>;
      const main = data?.main as unknown[][];
      if (main?.[0]?.[0]) {
        const triggerData = main[0][0] as Record<string, unknown>;
        const json = triggerData.json as Record<string, unknown>;
        sessionId = (json?.sessionId as string) || null;
        chatInput = (json?.chatInput as string) || null;
      }
    }

    // Priorité 1 : Chercher dans le node "ai-agent" pour la réponse IA et les tools
    const agentNode = runData['ai-agent'];
    if (agentNode && Array.isArray(agentNode) && agentNode[0]) {
      const nodeExecution = agentNode[0] as Record<string, unknown>;
      const data = nodeExecution?.data as Record<string, unknown>;
      const main = data?.main as unknown[][];
      if (main?.[0]?.[0]) {
        const agentData = main[0][0] as Record<string, unknown>;
        const json = agentData.json as Record<string, unknown>;
        aiResponse = (json?.output as string) || null;
      }
    }

    // Priorité 2 : Chercher dans le node "gpt" si ai-agent n'a pas de réponse
    if (!aiResponse) {
      const gptNode = runData['gpt'];
      if (gptNode && Array.isArray(gptNode)) {
        // Parcourir toutes les exécutions du node gpt pour trouver celle avec une réponse
        for (let i = gptNode.length - 1; i >= 0; i--) {
          const execution = gptNode[i] as Record<string, unknown>;
          const data = execution?.data as Record<string, unknown>;
          const main = data?.ai_languageModel as unknown[][];
          if (main?.[0]?.[0]) {
            const gptData = main[0][0] as Record<string, unknown>;
            const json = gptData.json as Record<string, unknown>;
            const response = json?.response as Record<string, unknown>;
            const generations = response?.generations as unknown[][];
            if (generations?.[0]?.[0]) {
              const generation = generations[0][0] as Record<string, unknown>;
              const text = (generation?.text as string) || '';
              if (text && text.trim().length > 0) {
                aiResponse = text;
                break;
              }
            }
          }
        }
      }
    }

    // Priorité 3 : Chercher dans le node "claude" si gpt n'a pas de réponse
    if (!aiResponse) {
      const claudeNode = runData['claude'];
      if (claudeNode && Array.isArray(claudeNode)) {
        // Parcourir toutes les exécutions du node claude pour trouver celle avec une réponse
        for (let i = claudeNode.length - 1; i >= 0; i--) {
          const execution = claudeNode[i] as Record<string, unknown>;
          const data = execution?.data as Record<string, unknown>;
          const main = data?.ai_languageModel as unknown[][];
          if (main?.[0]?.[0]) {
            const claudeData = main[0][0] as Record<string, unknown>;
            const json = claudeData.json as Record<string, unknown>;
            const response = json?.response as Record<string, unknown>;
            const generations = response?.generations as unknown[][];
            if (generations?.[0]?.[0]) {
              const generation = generations[0][0] as Record<string, unknown>;
              const text = (generation?.text as string) || '';
              if (text && text.trim().length > 0) {
                aiResponse = text;
                break;
              }
            }
          }
        }
      }
    }

    return { sessionId, chatInput, aiResponse, leadUsed, leadData };
  } catch (error) {
    console.error('Error extracting session data:', error);
    return { sessionId: null, chatInput: null, aiResponse: null, leadUsed: false, leadData: null };
  }
}

// Fonction pour regrouper les exécutions par session et construire les conversations
function groupExecutionsBySession(executions: N8nExecution[]): GroupedExecutionsResponse {
  const sessionsMap = new Map<string, ChatSession>();
  const ungroupedExecutions: N8nExecution[] = [];

  executions.forEach(execution => {
    if (execution.sessionId) {
      if (!sessionsMap.has(execution.sessionId)) {
        sessionsMap.set(execution.sessionId, {
          sessionId: execution.sessionId,
          executions: [],
          conversation: [],
          lastActivity: execution.startedAt,
          totalExecutions: 0,
          status: 'inactive'
        });
      }

      const session = sessionsMap.get(execution.sessionId)!;
      session.executions.push(execution);
      session.totalExecutions++;

      // Ajouter les messages à la conversation
      if (execution.chatInput) {
        session.conversation.push({
          type: 'user',
          content: execution.chatInput,
          timestamp: execution.startedAt,
          executionId: execution.id
        });
      }

      if (execution.aiResponse) {
        session.conversation.push({
          type: 'ai',
          content: execution.aiResponse,
          timestamp: execution.stoppedAt || execution.startedAt,
          executionId: execution.id
        });
      }

      // Mettre à jour la dernière activité
      if (new Date(execution.startedAt) > new Date(session.lastActivity)) {
        session.lastActivity = execution.startedAt;
      }

      // Déterminer le statut de la session
      if (execution.status === 'running' || execution.status === 'waiting') {
        session.status = 'active';
      }
    } else {
      ungroupedExecutions.push(execution);
    }
  });

  // Trier les sessions par dernière activité (plus récente en premier)
  const sessions = Array.from(sessionsMap.values()).sort((a, b) =>
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  // Trier les exécutions et conversations de chaque session par date
  sessions.forEach(session => {
    session.executions.sort((a, b) =>
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    session.conversation.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculer hasLeadTool et leadExecutions
    const leadExecutions = session.executions.filter(exec => exec.leadUsed === true);
    session.hasLeadTool = leadExecutions.length > 0;
    session.leadExecutions = leadExecutions.length > 0 ? leadExecutions : undefined;
  });

  return {
    sessions,
    ungroupedExecutions,
    totalExecutions: executions.length
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workflowId = searchParams.get('workflowId') || process.env.N8N_WORKFLOW_ID;
  const status = searchParams.get('status');
  const limit = searchParams.get('limit') || '50';
  const cursor = searchParams.get('cursor');

  const apiKey = process.env.N8N_API_KEY;
  const apiUrl = process.env.N8N_API_URL || 'https://dev-conexia.app.n8n.cloud/api/v1';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'n8n API key not configured' },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflowId', workflowId);
    if (status && status !== 'all') params.append('status', status);
    params.append('limit', limit);
    params.append('includeData', 'true'); // Nécessaire pour accéder aux runData
    if (cursor) params.append('cursor', cursor);

    const response = await fetch(`${apiUrl}/executions?${params.toString()}`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n API error:', response.status, errorText);
      return NextResponse.json(
        { error: `n8n API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Enrichir chaque exécution avec sessionId, chatInput, aiResponse, leadUsed et leadData
    const enrichedExecutions: N8nExecution[] = data.data.map((execution: N8nExecution) => {
      const { sessionId, chatInput, aiResponse, leadUsed, leadData } = extractSessionData(execution);
      return {
        ...execution,
        sessionId,
        chatInput,
        aiResponse,
        leadUsed,
        leadData
      };
    });

    // Grouper les exécutions par session
    const groupedData = groupExecutionsBySession(enrichedExecutions);

    return NextResponse.json(groupedData);
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}