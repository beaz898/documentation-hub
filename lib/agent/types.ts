// Modos de actuación del agente
export type ConfirmationMode = 'step_by_step' | 'milestones' | 'autonomous';

// Estados de una tarea
export type AgentTaskStatus =
  | 'pending'
  | 'running'
  | 'awaiting_user'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Tipos de paso registrados en agent_tasks.steps
export type AgentStepType =
  | 'think'                  // Razonamiento interno del modelo
  | 'tool_call'              // El modelo invoca una herramienta
  | 'tool_result'            // Resultado devuelto por la herramienta
  | 'user_message'           // Respuesta del usuario a ask_user o escalate
  | 'confirmation_request'   // El runner pide aprobación al usuario
  | 'confirmation_response'  // El usuario aprueba/rechaza/modifica
  | 'escalation'             // Resultado de tool escalate
  | 'warning'                // Resultado de tool warn
  | 'final_output';          // Resultado de tool finalize

// Nombres de herramientas disponibles en Fase A
export type ToolName =
  | 'search_docs'
  | 'read_doc'
  | 'ask_user'
  | 'escalate'
  | 'warn'
  | 'finalize';

// Estructura base de un paso
export interface AgentStepBase {
  type: AgentStepType;
  timestamp: string;          // ISO 8601
  tokens_input?: number;
  tokens_output?: number;
  latency_ms?: number;
}

// Variantes específicas (todas extienden AgentStepBase)
export interface ThinkStep extends AgentStepBase {
  type: 'think';
  content: string;
}

export interface ToolCallStep extends AgentStepBase {
  type: 'tool_call';
  tool_name: ToolName;
  tool_use_id: string;
  input: Record<string, unknown>;
}

export interface ToolResultStep extends AgentStepBase {
  type: 'tool_result';
  tool_name: ToolName;
  tool_use_id: string;
  output: Record<string, unknown>;
  is_error?: boolean;
}

export interface UserMessageStep extends AgentStepBase {
  type: 'user_message';
  content: string;
}

export interface ConfirmationRequestStep extends AgentStepBase {
  type: 'confirmation_request';
  pending_action: string;     // Descripción legible de qué se va a hacer
  preview?: string;           // Preview del output (caso finalize)
}

export interface ConfirmationResponseStep extends AgentStepBase {
  type: 'confirmation_response';
  response: 'approve' | 'reject' | 'modify';
  modification?: string;
}

export interface EscalationStep extends AgentStepBase {
  type: 'escalation';
  reason: string;
  escalation_type?: 'undocumented';
  user_choice?: 'stop' | 'ask_more' | 'improvise' | 'expert_judgment' | 'mark_gap' | 'search_again';
}

export interface WarningStep extends AgentStepBase {
  type: 'warning';
  message: string;
}

export interface FinalOutputStep extends AgentStepBase {
  type: 'final_output';
  output: string;
  citations: Citation[];
}

// Unión discriminada
export type AgentStep =
  | ThinkStep
  | ToolCallStep
  | ToolResultStep
  | UserMessageStep
  | ConfirmationRequestStep
  | ConfirmationResponseStep
  | EscalationStep
  | WarningStep
  | FinalOutputStep;

// Cita verificable (doc_id real devuelto por search_docs)
export interface Citation {
  doc_id: string;
  doc_name: string;
  chunk_id?: number;
  fragment?: string;     // Fragmento corto del documento
}

// Estructura de pending_request (qué espera el agente del usuario)
export type PendingRequest =
  | {
      type: 'user_input';
      question: string;
    }
  | {
      type: 'escalation';
      reason: string;
      options: Array<'stop' | 'ask_more' | 'improvise' | 'expert_judgment' | 'mark_gap' | 'search_again'>;
      escalation_type?: 'undocumented';
    }
  | {
      type: 'confirmation';
      pending_action: string;
      preview?: string;
      reason: 'finalize' | 'tool_call' | 'over_estimate' | 'external_effect' | 'improvise';
    };

// Fila completa de agent_tasks (lo que se devuelve al frontend)
export interface AgentTask {
  id: string;
  org_id: string;
  user_id: string;
  goal: string;
  confirmation_mode: ConfirmationMode;
  status: AgentTaskStatus;
  steps: AgentStep[];
  result: { output: string; citations: Citation[] } | null;
  pending_request: PendingRequest | null;
  credits_estimated: number;
  credits_consumed: number;
  model: string;
  total_tokens_input: number;
  total_tokens_output: number;
  step_count: number;
  error_message: string | null;
  error_step_index: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// Preferencias por usuario (memberships.preferences)
export interface UserPreferences {
  agent_default_mode?: ConfirmationMode;
  locale?: 'es' | 'en';
}

// ── Modelo de conversación continua (nuevo) ────────────────────────────────

// Estado de la conversación (a nivel de hilo)
export type ConversationStatus =
  | 'idle'                    // Sin turno activo; el usuario puede escribir
  | 'running'                 // El worker está procesando un turno
  | 'awaiting_user'           // El agente espera respuesta del usuario
  | 'awaiting_confirmation';  // El agente espera aprobación del usuario

// Estado de un mensaje assistant individual
export type MessageStatus =
  | 'running'
  | 'awaiting_user'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed';

// Fila de agent_conversations
export interface AgentConversation {
  id: string;
  org_id: string;
  user_id: string;
  title: string | null;
  confirmation_mode: ConfirmationMode;
  status: ConversationStatus;
  pending_request: PendingRequest | null;
  total_credits_used: number;
  total_tokens_input: number;
  total_tokens_output: number;
  turn_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

// Fila de agent_messages
export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  steps: AgentStep[];
  status: MessageStatus;
  error_message: string | null;
  tokens_input: number;
  tokens_output: number;
  credits_estimated: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
}
