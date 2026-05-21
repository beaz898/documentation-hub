import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AgentStep,
  AgentTask,
  AgentTaskStatus,
  Citation,
  ConfirmationMode,
  PendingRequest,
  ThinkStep,
  ToolCallStep,
  ToolResultStep,
} from './types';
import { buildSystemPrompt } from './system-prompt';
import {
  appendStep,
  updateStatus,
  setPendingRequest,
  setResult,
  accumulateTokens,
  consumeCreditsFromTokens,
} from './persist';
import {
  callAgentLLM,
  type AgentMessage,
  type AssistantContent,
  type ToolResultContent,
} from './llm-call';
import { getToolDefinitions, getToolExecutor } from './tools/index';
import { shouldConfirm } from './should-confirm';
import { tokensToCredits, reconcileCredits } from './credit-calc';
import { adjustCredits } from '@/lib/credits';
import type { ToolName } from './types';

const MAX_ITERATIONS = 15;

// ---------------------------------------------------------------------------
// Build Anthropic messages from recorded steps
// ---------------------------------------------------------------------------

function buildMessages(goal: string, steps: AgentStep[]): AgentMessage[] {
  const messages: AgentMessage[] = [{ role: 'user', content: goal }];
  let i = 0;

  while (i < steps.length) {
    const step = steps[i];

    if (step.type === 'think' || step.type === 'tool_call') {
      // Collect consecutive think/tool_call steps into one assistant message
      const content: AssistantContent = [];
      let j = i;

      while (j < steps.length && (steps[j].type === 'think' || steps[j].type === 'tool_call')) {
        const s = steps[j];
        if (s.type === 'think') {
          content.push({ type: 'text', text: (s as ThinkStep).content });
        } else {
          const tc = s as ToolCallStep;
          content.push({ type: 'tool_use', id: tc.tool_use_id, name: tc.tool_name, input: tc.input });
        }
        j++;
      }

      messages.push({ role: 'assistant', content });

      // Collect following tool_result steps into one user message
      const toolResults: ToolResultContent[] = [];
      while (j < steps.length && steps[j].type === 'tool_result') {
        const tr = steps[j] as ToolResultStep;
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tr.tool_use_id,
          content: JSON.stringify(tr.output),
          is_error: tr.is_error,
        });
        j++;
      }
      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      i = j;
    } else if (step.type === 'user_message') {
      messages.push({ role: 'user', content: step.content });
      i++;
    } else {
      // Skip meta-steps: confirmation_request, confirmation_response, escalation, warning, final_output
      i++;
    }
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Runner context
// ---------------------------------------------------------------------------

interface RunnerContext {
  supabase: SupabaseClient;
  task: AgentTask;
  orgId: string;
  userId: string;
  mode: ConfirmationMode;
  isImprovising: boolean;
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export interface RunnerInput {
  supabase: SupabaseClient;
  taskId: string;
  /** Provided when resuming after ask_user or escalate */
  resumeInput?: string;
  /** Provided when resuming after confirmation request */
  confirmationResponse?: 'approve' | 'reject' | 'modify';
  confirmationModification?: string;
}

export interface RunnerOutput {
  status: AgentTaskStatus;
  /** Set when status === 'completed' */
  result?: { output: string; citations: Citation[] };
  /** Set when status === 'awaiting_user' or 'awaiting_confirmation' */
  pendingRequest?: PendingRequest;
  error?: string;
}

export async function runAgent(input: RunnerInput): Promise<RunnerOutput> {
  const { supabase, taskId, resumeInput, confirmationResponse, confirmationModification } = input;

  // Load task
  const { data: taskRow, error: fetchErr } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (fetchErr || !taskRow) {
    return { status: 'failed', error: 'task_not_found' };
  }

  const task = taskRow as AgentTask;
  const ctx: RunnerContext = {
    supabase,
    task,
    orgId: task.org_id,
    userId: task.user_id,
    mode: task.confirmation_mode,
    isImprovising: false,
  };

  // Mark as running
  await updateStatus(supabase, taskId, 'running');

  // Handle resume: inject user response into steps
  if (resumeInput && task.pending_request) {
    const pr = task.pending_request;
    if (pr.type === 'user_input' || pr.type === 'escalation') {
      const userStep: AgentStep = {
        type: 'user_message',
        content: resumeInput,
        timestamp: new Date().toISOString(),
      };
      await appendStep(supabase, taskId, userStep);
      if (pr.type === 'escalation') {
        // Record user choice
        const escalationStep: AgentStep = {
          type: 'escalation',
          reason: pr.reason,
          user_choice: resumeInput as 'stop' | 'ask_more' | 'improvise',
          timestamp: new Date().toISOString(),
        };
        await appendStep(supabase, taskId, escalationStep);
        if (resumeInput === 'stop') {
          await updateStatus(supabase, taskId, 'cancelled');
          return { status: 'cancelled' };
        }
        if (resumeInput === 'improvise') {
          ctx.isImprovising = true;
        }
      }
    }
    // Clear pending request
    await supabase.from('agent_tasks').update({ pending_request: null }).eq('id', taskId);
  }

  if (confirmationResponse && task.pending_request?.type === 'confirmation') {
    const pr = task.pending_request;
    const respStep: AgentStep = {
      type: 'confirmation_response',
      response: confirmationResponse,
      modification: confirmationModification,
      timestamp: new Date().toISOString(),
    };
    await appendStep(supabase, taskId, respStep);
    await supabase.from('agent_tasks').update({ pending_request: null }).eq('id', taskId);

    if (confirmationResponse === 'reject') {
      await updateStatus(supabase, taskId, 'cancelled');
      return { status: 'cancelled' };
    }
  }

  // Reload steps after potential mutations above
  const { data: refreshed } = await supabase
    .from('agent_tasks')
    .select('steps, total_tokens_input, total_tokens_output')
    .eq('id', taskId)
    .single();

  const steps: AgentStep[] = Array.isArray(refreshed?.steps) ? refreshed.steps : [];
  let totalInputTokens: number  = refreshed?.total_tokens_input  ?? 0;
  let totalOutputTokens: number = refreshed?.total_tokens_output ?? 0;

  const systemPrompt = buildSystemPrompt(ctx.mode);
  const toolDefs = getToolDefinitions();
  const toolCtx = { supabase, orgId: ctx.orgId, userId: ctx.userId, taskId };

  // ReAct loop
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const currentSteps = await loadSteps(supabase, taskId);

    // Tareas creadas antes de que se persistiera tool_use_id no se pueden reanudar
    const hasLegacySteps = currentSteps.some(
      s => s.type === 'tool_result' && !(s as ToolResultStep).tool_use_id
    );
    if (hasLegacySteps) {
      const legacyMsg = 'Tarea creada con versión anterior del runner. Lanza una nueva tarea.';
      await updateStatus(supabase, taskId, 'failed', { error_message: legacyMsg });
      return { status: 'failed', error: legacyMsg };
    }

    const messages = buildMessages(task.goal, currentSteps);

    let llmResponse;
    try {
      llmResponse = await callAgentLLM(systemPrompt, messages, toolDefs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await updateStatus(supabase, taskId, 'failed', { error_message: msg });
      return { status: 'failed', error: msg };
    }

    // Accumulate tokens
    const { input_tokens, output_tokens } = llmResponse.usage;
    totalInputTokens  += input_tokens;
    totalOutputTokens += output_tokens;
    await accumulateTokens(supabase, taskId, input_tokens, output_tokens);

    // Process content blocks
    const textBlocks  = llmResponse.content.filter(b => b.type === 'text');
    const toolBlocks  = llmResponse.content.filter(b => b.type === 'tool_use');

    // Record think step if there is text
    for (const block of textBlocks) {
      if (block.type !== 'text') continue;
      const thinkStep: ThinkStep = {
        type: 'think',
        content: block.text,
        timestamp: new Date().toISOString(),
        tokens_input: input_tokens,
        tokens_output: output_tokens,
      };
      await appendStep(supabase, taskId, thinkStep);
    }

    // If no tool calls, the model is done but forgot to call finalize
    if (toolBlocks.length === 0) {
      const finalText = textBlocks.find(b => b.type === 'text')?.text ?? '';
      await setResult(supabase, taskId, finalText, []);
      const creditsReal0 = tokensToCredits(totalInputTokens, totalOutputTokens);
      const refund0 = reconcileCredits(task.credits_estimated, creditsReal0);
      await consumeCreditsFromTokens(supabase, ctx.orgId, taskId, creditsReal0);
      if (refund0 > 0) {
        await adjustCredits(supabase, ctx.orgId, refund0, `agent_task_underrun:${taskId}`);
      }
      return { status: 'completed', result: { output: finalText, citations: [] } };
    }

    // Process each tool call
    for (const block of toolBlocks) {
      if (block.type !== 'tool_use') continue;

      const toolName = block.name as ToolName;
      const toolInput = block.input;
      const toolUseId = block.id;

      // Check if confirmation needed
      const needsConfirm = shouldConfirm({
        mode: ctx.mode,
        tool_name: toolName,
        is_improvising: ctx.isImprovising,
        is_over_estimate: false, // TODO Paso 6: check against estimate
        has_external_effect: false,
      });

      if (needsConfirm) {
        const confirmStep: AgentStep = {
          type: 'confirmation_request',
          pending_action: `Llamar a ${toolName} con: ${JSON.stringify(toolInput)}`,
          timestamp: new Date().toISOString(),
        };
        await appendStep(supabase, taskId, confirmStep);

        // Record the tool_call step so history rebuilds correctly on resume
        const tcStep: ToolCallStep & { tool_use_id: string } = {
          type: 'tool_call',
          tool_name: toolName,
          input: toolInput,
          tool_use_id: toolUseId,
          timestamp: new Date().toISOString(),
        };
        await appendStep(supabase, taskId, tcStep as AgentStep);

        const pendingReq: PendingRequest = {
          type: 'confirmation',
          pending_action: `Llamar a ${toolName}`,
          reason: toolName === 'finalize' ? 'finalize' : 'tool_call',
        };
        await setPendingRequest(supabase, taskId, pendingReq, 'awaiting_confirmation');
        return { status: 'awaiting_confirmation', pendingRequest: pendingReq };
      }

      // Record tool_call step
      const tcStep: ToolCallStep = {
        type: 'tool_call',
        tool_name: toolName,
        tool_use_id: toolUseId,
        input: toolInput,
        timestamp: new Date().toISOString(),
      };
      await appendStep(supabase, taskId, tcStep);

      // Execute tool
      const executor = getToolExecutor(toolName);
      const result = await executor(toolInput, toolCtx);

      // Record result step
      const trStep: ToolResultStep = {
        type: 'tool_result',
        tool_name: toolName,
        tool_use_id: toolUseId,
        output: result.kind === 'error'
          ? { error: result.error, details: result.details }
          : result.kind === 'final'
            ? { output: result.output, citations: result.citations }
            : result.kind === 'pause'
              ? { pause: true, pending_request: result.pending_request }
              : result.output,
        is_error: result.kind === 'error',
        timestamp: new Date().toISOString(),
      };
      await appendStep(supabase, taskId, trStep);

      // Handle result kinds
      if (result.kind === 'final') {
        await setResult(supabase, taskId, result.output, result.citations);
        const creditsReal = tokensToCredits(totalInputTokens, totalOutputTokens);
        const refund = reconcileCredits(task.credits_estimated, creditsReal);
        await consumeCreditsFromTokens(supabase, ctx.orgId, taskId, creditsReal);
        if (refund > 0) {
          await adjustCredits(supabase, ctx.orgId, refund, `agent_task_underrun:${taskId}`);
        }
        return {
          status: 'completed',
          result: { output: result.output, citations: result.citations },
        };
      }

      if (result.kind === 'pause') {
        const pr = result.pending_request;
        const pauseStatus: AgentTaskStatus =
          pr.type === 'user_input' ? 'awaiting_user' : 'awaiting_user';

        // Record meta-step
        if (pr.type === 'escalation') {
          const escStep: AgentStep = {
            type: 'escalation',
            reason: pr.reason,
            timestamp: new Date().toISOString(),
          };
          await appendStep(supabase, taskId, escStep);
        }

        await setPendingRequest(supabase, taskId, pr, pauseStatus);
        return { status: pauseStatus, pendingRequest: pr };
      }

      if (result.kind === 'error') {
        // Non-fatal: the model sees the error in tool_result and can recover
        // If we hit repeated errors, the iteration cap will stop us
        continue;
      }

      // kind === 'data': warn tool just acknowledges, others return data
      if (toolName === 'warn') {
        const warnStep: AgentStep = {
          type: 'warning',
          message: (toolInput as { message?: string }).message ?? '',
          timestamp: new Date().toISOString(),
        };
        await appendStep(supabase, taskId, warnStep);
      }
    }
  }

  // Exceeded MAX_ITERATIONS
  const msg = `Límite de iteraciones alcanzado (${MAX_ITERATIONS})`;
  await updateStatus(supabase, taskId, 'failed', { error_message: msg });
  return { status: 'failed', error: msg };
}

async function loadSteps(supabase: SupabaseClient, taskId: string): Promise<AgentStep[]> {
  const { data } = await supabase
    .from('agent_tasks')
    .select('steps')
    .eq('id', taskId)
    .single();
  return Array.isArray(data?.steps) ? (data.steps as AgentStep[]) : [];
}
