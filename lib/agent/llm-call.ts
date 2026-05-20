import type { AnthropicToolDefinition } from './tools/types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const AGENT_MODEL = 'claude-sonnet-4-6';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 8000, 30000];

// Content blocks returned by the API
export type TextBlock = { type: 'text'; text: string };
export type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
export type ContentBlock = TextBlock | ToolUseBlock;

export interface AgentLLMResponse {
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | string;
  content: ContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
}

// Message types for the conversation
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
export type UserContent = string | ToolResultContent[];

export type AgentMessage =
  | { role: 'user';      content: UserContent }
  | { role: 'assistant'; content: AssistantContent | string };

export async function callAgentLLM(
  systemPrompt: string,
  messages: AgentMessage[],
  tools: AnthropicToolDefinition[]
): Promise<AgentLLMResponse> {
  const payload = {
    model: AGENT_MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: systemPrompt,
    tools,
    messages,
  };

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };

  let lastError = 'unknown';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        // Non-recoverable: bail immediately
        if (res.status !== 429 && res.status !== 529 && res.status < 500) break;
        continue;
      }

      const data = await res.json() as {
        stop_reason: string;
        content: ContentBlock[];
        usage: { input_tokens: number; output_tokens: number };
      };

      return {
        stop_reason: data.stop_reason ?? 'end_turn',
        content: Array.isArray(data.content) ? data.content : [],
        usage: {
          input_tokens:  data.usage?.input_tokens  ?? 0,
          output_tokens: data.usage?.output_tokens ?? 0,
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`[llm-call] Agent LLM failed after retries: ${lastError}`);
}
