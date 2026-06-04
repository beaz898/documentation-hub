import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

interface EscalateInput {
  reason: string;
  escalation_type?: 'undocumented';
}

const executeTyped: ToolExecutorTyped<EscalateInput> = async (
  input,
  _context: ToolContext
): Promise<ToolExecutionResult> => {
  if (!input.reason || input.reason.trim().length === 0) {
    return { kind: 'error', error: 'invalid_input', details: 'reason no puede estar vacío' };
  }

  const isUndocumented = input.escalation_type === 'undocumented';

  return {
    kind: 'pause',
    pending_request: {
      type:            'escalation',
      reason:          input.reason.trim(),
      escalation_type: input.escalation_type,
      options:         isUndocumented
        ? ['expert_judgment', 'mark_gap', 'search_again']
        : ['stop', 'ask_more', 'improvise'],
    },
  };
};

export const escalateTool: ToolBundle = {
  definition: {
    name: 'escalate',
    description:
      'Pausa la tarea porque la documentación disponible no cubre el caso y necesitas instrucciones ' +
      'del usuario antes de continuar. ' +
      'Explica en reason qué información falta o qué ambigüedad no puedes resolver con el corpus. ' +
      'El usuario podrá elegir entre detener la tarea, proporcionar más contexto o autorizar que improvises.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Explicación clara de por qué la documentación no es suficiente.',
        },
        escalation_type: {
          type: 'string',
          enum: ['undocumented'],
          description:
            "Usa 'undocumented' cuando el usuario pregunte por un procedimiento, política o norma " +
            "propia de su empresa que razonablemente debería estar documentada, y no la encuentres " +
            "en el corpus. Omite este campo para escalaciones genéricas por falta de información.",
        },
      },
      required: ['reason'],
    },
  },
  execute: (input, ctx) => executeTyped(input as EscalateInput, ctx),
};
