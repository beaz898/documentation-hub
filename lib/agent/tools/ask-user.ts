import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

interface AskUserInput {
  question: string;
}

const executeTyped: ToolExecutorTyped<AskUserInput> = async (
  input,
  _context: ToolContext
): Promise<ToolExecutionResult> => {
  if (!input.question || input.question.trim().length === 0) {
    return { kind: 'error', error: 'invalid_input', details: 'question no puede estar vacía' };
  }

  return {
    kind: 'pause',
    pending_request: { type: 'user_input', question: input.question.trim() },
  };
};

export const askUserTool: ToolBundle = {
  definition: {
    name: 'ask_user',
    description:
      'Pausa la tarea para pedir un dato concreto al usuario: un nombre, fecha, destinatario u otro ' +
      'detalle específico necesario para completar el trabajo. ' +
      'Úsalo SOLO para solicitar información que el usuario puede proporcionar directamente. ' +
      'NO lo uses cuando la documentación no cubre el caso; para eso usa escalate.',
    input_schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Pregunta concreta y específica al usuario.',
        },
      },
      required: ['question'],
    },
  },
  execute: (input, ctx) => executeTyped(input as AskUserInput, ctx),
};
