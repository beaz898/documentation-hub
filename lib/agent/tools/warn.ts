import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

interface WarnInput {
  message: string;
}

const executeTyped: ToolExecutorTyped<WarnInput> = async (
  input,
  _context: ToolContext
): Promise<ToolExecutionResult> => {
  if (!input.message || input.message.trim().length === 0) {
    return { kind: 'error', error: 'invalid_input', details: 'message no puede estar vacío' };
  }

  return { kind: 'data', output: { acknowledged: true } };
};

export const warnTool: ToolBundle = {
  definition: {
    name: 'warn',
    description:
      'Registra un aviso o alerta sobre la tarea sin pausarla: incertidumbre en la documentación, ' +
      'posible ambigüedad, dato no verificado o riesgo menor. ' +
      'La tarea continúa después de warn. El aviso queda registrado en el historial para el usuario.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Descripción del aviso o riesgo detectado.',
        },
      },
      required: ['message'],
    },
  },
  execute: (input, ctx) => executeTyped(input as WarnInput, ctx),
};
