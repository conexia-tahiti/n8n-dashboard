export interface LeadData {
  email?: string;
  subject?: string;
  message?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown; // Pour d'autres champs personnalisés
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook' | 'internal' | 'retry' | 'integrated' | 'cli';
  retryOf?: string | null;
  retrySuccessId?: string | null;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowName?: string;
  status: 'success' | 'error' | 'waiting' | 'running' | 'canceled' | 'crashed' | 'new';
  sessionId?: string | null;
  chatInput?: string;
  aiResponse?: string;
  leadUsed?: boolean;
  leadData?: LeadData;
  data?: {
    resultData?: {
      error?: unknown;
      runData?: unknown;
    };
  };
  waitTill?: string | null;
}

export interface N8nExecutionsResponse {
  data: N8nExecution[];
  nextCursor?: string;
}

export interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  executionId: string;
}

export interface ChatSession {
  sessionId: string;
  executions: N8nExecution[];
  conversation: ConversationMessage[];
  lastActivity: string;
  totalExecutions: number;
  status: 'active' | 'inactive';
  hasLeadTool?: boolean;
  leadExecutions?: N8nExecution[];
}

export interface GroupedExecutionsResponse {
  sessions: ChatSession[];
  ungroupedExecutions: N8nExecution[];
  totalExecutions: number;
}

export interface ConversationAnalysis {
  sessionId: string;
  categories: string[];
  subjects: string[];
  analyzedAt: string;
}

export interface AnalyzeConversationRequest {
  sessionId: string;
  messages: ConversationMessage[];
}

export interface AnalyzeConversationResponse {
  success: boolean;
  analysis?: ConversationAnalysis;
  error?: string;
}