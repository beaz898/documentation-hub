// Tipos compartidos entre lib/llm/anthropic-client.ts y sus consumidores.

// ── Bloques de sistema (prompt caching) ───────────────────────────────────────

export interface SystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

// ── Análisis / RAG ─────────────────────────────────────────────────────────────

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
}

export interface LLMResponseWithUsage {
  text: string;
  usage: LLMUsage;
}

// ── Bloques de contenido del agente ───────────────────────────────────────────

export type TextBlock    = { type: 'text'; text: string };
export type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
export type ContentBlock = TextBlock | ToolUseBlock;

// ── Respuesta del agente ───────────────────────────────────────────────────────

export interface AgentLLMResponse {
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | string;
  content: ContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
}

// ── Tipos de mensajes del agente ───────────────────────────────────────────────

export type SimpleMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ToolResultContent = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

export type AssistantContent = ContentBlock[];
export type UserContent      = string | ToolResultContent[];

export type AgentMessage =
  | { role: 'user';      content: UserContent }
  | { role: 'assistant'; content: AssistantContent | string };
