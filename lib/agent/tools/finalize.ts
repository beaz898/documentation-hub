import type { Citation } from '@/lib/agent/types';
import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

interface FinalizeInput {
  output: string;
  citations: Citation[];
}

const executeTyped: ToolExecutorTyped<FinalizeInput> = async (
  input,
  _context: ToolContext
): Promise<ToolExecutionResult> => {
  if (!input.output || input.output.trim().length === 0) {
    return { kind: 'error', error: 'invalid_input', details: 'output no puede estar vacío' };
  }

  if (!Array.isArray(input.citations)) {
    return { kind: 'error', error: 'invalid_input', details: 'citations debe ser un array' };
  }

  return {
    kind: 'final',
    output: input.output.trim(),
    citations: input.citations,
  };
};

export const finalizeTool: ToolBundle = {
  definition: {
    name: 'finalize',
    description:
      'Entrega el resultado final de la tarea. Llama a finalize SOLO cuando tengas una respuesta ' +
      'completa y verificada con el corpus. ' +
      'citations debe contener ÚNICAMENTE doc_id reales devueltos por search_docs o read_doc, ' +
      'nunca identificadores inventados. ' +
      'Después de finalize la tarea se cierra y no se pueden invocar más herramientas.',
    input_schema: {
      type: 'object',
      properties: {
        output: {
          type: 'string',
          description: 'Respuesta o contenido final elaborado para el usuario.',
        },
        citations: {
          type: 'array',
          description: 'Documentos del corpus usados como fuente. Solo doc_ids reales.',
          items: {
            type: 'object',
            properties: {
              doc_id:   { type: 'string' },
              doc_name: { type: 'string' },
              chunk_id: { type: 'number' },
              fragment: { type: 'string' },
            },
            required: ['doc_id', 'doc_name'],
          },
        },
      },
      required: ['output', 'citations'],
    },
  },
  execute: (input, ctx) => executeTyped(input as FinalizeInput, ctx),
};
