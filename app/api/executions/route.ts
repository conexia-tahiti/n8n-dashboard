import { NextRequest, NextResponse } from 'next/server';
import { N8nExecution, ChatSession, GroupedExecutionsResponse } from '@/app/types/n8n';

// Fonction pour extraire le session ID, l'input du chat et la réponse IA depuis les runData
function extractSessionData(execution: N8nExecution): { sessionId: string | null, chatInput: string | null, aiResponse: string | null } {
  try {
    const runData = execution.data?.resultData?.runData as Record<string, unknown[]> | undefined;
    if (!runData) return { sessionId: null, chatInput: null, aiResponse: null };

    let sessionId = null;
    let chatInput = null;
    let aiResponse = null;

    // Chercher dans le node "chat"
    const chatNode = runData.chat;
    if (chatNode && Array.isArray(chatNode) && chatNode[0]) {
      const nodeExecution = chatNode[0] as Record<string, unknown>;
      const data = nodeExecution?.data as Record<string, unknown>;
      const main = data?.main as unknown[][];
      if (main?.[0]?.[0]) {
        const chatData = main[0][0] as Record<string, unknown>;
        const json = chatData.json as Record<string, unknown>;
        sessionId = (json?.sessionId as string) || null;
        chatInput = (json?.chatInput as string) || null;
      }
    }

    // Chercher dans le node "lm-diffusion-agent"
    const agentNode = runData['lm-diffusion-agent'];
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

    return { sessionId, chatInput, aiResponse };
  } catch (error) {
    console.error('Error extracting session data:', error);
    return { sessionId: null, chatInput: null, aiResponse: null };
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

    // Enrichir chaque exécution avec sessionId, chatInput et aiResponse
    const enrichedExecutions: N8nExecution[] = data.data.map((execution: N8nExecution) => {
      const { sessionId, chatInput, aiResponse } = extractSessionData(execution);
      return {
        ...execution,
        sessionId,
        chatInput,
        aiResponse
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