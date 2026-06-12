import type { SupabaseClient } from '@supabase/supabase-js';
import type { Citation, PendingRequest } from '@/lib/agent/types';
import type { OrgRole } from '@/lib/org';

export interface ToolContext {
  supabase: SupabaseClient;
  orgId:    string;
  userId:   string;
  taskId:   string;
  role:     OrgRole;
}

export type ToolExecutionResult =
  | { kind: 'data'; output: Record<string, unknown> }
  | { kind: 'pause'; pending_request: PendingRequest }
  | { kind: 'final'; output: string; citations: Citation[] }
  | { kind: 'error'; error: string; details?: string };

export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// El runner recibe el input de Anthropic como unknown — este es el tipo del ejecutor en el registro.
export type ToolExecutor = (
  input: unknown,
  context: ToolContext
) => Promise<ToolExecutionResult>;

// Versión tipada para implementar herramientas individuales con seguridad de tipos.
export type ToolExecutorTyped<TInput> = (
  input: TInput,
  context: ToolContext
) => Promise<ToolExecutionResult>;

export interface ToolBundle {
  definition: AnthropicToolDefinition;
  execute: ToolExecutor;
}
