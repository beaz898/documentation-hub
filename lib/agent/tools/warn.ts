import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

interface WarnInput {
  message: string;
  kind?: 'improvised';
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
        kind: {
          type: 'string',
          enum: ['improvised'],
          description:
            "Usa 'improvised' cuando el aviso sea que estás usando conocimiento general " +
            "fuera del corpus de la empresa. Omite para avisos genéricos (ambigüedad, " +
            "riesgo menor, dato no verificado, etc.).",
        },
      },
      required: ['message'],
    },
  },
  execute: (input, ctx) => executeTyped(input as WarnInput, ctx),
};
