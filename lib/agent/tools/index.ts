import type { ToolName } from '@/lib/agent/types';
import type { AnthropicToolDefinition, ToolBundle, ToolExecutor } from './types';
import { searchDocsTool } from './search-docs';
import { readDocTool } from './read-doc';
import { askUserTool } from './ask-user';
import { escalateTool } from './escalate';
import { warnTool } from './warn';
import { finalizeTool } from './finalize';

export const TOOLS: Record<ToolName, ToolBundle> = {
  search_docs: searchDocsTool,
  read_doc:    readDocTool,
  ask_user:    askUserTool,
  escalate:    escalateTool,
  warn:        warnTool,
  finalize:    finalizeTool,
};

export function getToolDefinitions(): AnthropicToolDefinition[] {
  return Object.values(TOOLS).map(t => t.definition);
}

export function getToolExecutor(name: ToolName): ToolExecutor {
  return TOOLS[name].execute;
}
