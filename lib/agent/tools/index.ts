import type { ToolName } from '@/lib/agent/types';
import type { AnthropicToolDefinition, ToolBundle, ToolExecutor } from './types';
import { searchDocsTool } from './search-docs';
import { readDocTool }    from './read-doc';
import { askUserTool }    from './ask-user';
import { escalateTool }   from './escalate';
import { warnTool }       from './warn';
import { finalizeTool }   from './finalize';
import { listDocsTool }    from './list-docs';
import { usageStatsTool } from './usage-stats';

export const TOOLS: Record<ToolName, ToolBundle> = {
  search_docs:  searchDocsTool,
  read_doc:     readDocTool,
  ask_user:     askUserTool,
  escalate:     escalateTool,
  warn:         warnTool,
  finalize:     finalizeTool,
  list_docs:    listDocsTool,
  usage_stats:  usageStatsTool,
};

// Para members, las herramientas admin no se incluyen en las definiciones enviadas al LLM.
// El LLM nunca puede llamar una tool que no está en su lista de definiciones.
// El gate interno de cada tool es defensa en profundidad adicional.
const ADMIN_ONLY_TOOLS = new Set(['list_docs', 'usage_stats']);

export function getToolDefinitions(role: 'admin' | 'member' = 'member'): AnthropicToolDefinition[] {
  return Object.values(TOOLS)
    .filter(t => role === 'admin' || !ADMIN_ONLY_TOOLS.has(t.definition.name))
    .map(t => t.definition);
}

export function getToolExecutor(name: ToolName): ToolExecutor {
  return TOOLS[name].execute;
}
