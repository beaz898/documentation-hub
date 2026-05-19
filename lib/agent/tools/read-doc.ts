import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

const MAX_CONTENT_CHARS = 50_000;

interface ReadDocInput {
  doc_id: string;
}

const executeTyped: ToolExecutorTyped<ReadDocInput> = async (
  input,
  context: ToolContext
): Promise<ToolExecutionResult> => {
  if (!input.doc_id || input.doc_id.trim().length === 0) {
    return { kind: 'error', error: 'invalid_input', details: 'doc_id no puede estar vacío' };
  }

  try {
    const { data: doc, error } = await context.supabase
      .from('documents')
      .select('id, name, full_text, org_id')
      .eq('id', input.doc_id)
      .eq('org_id', context.orgId)
      .single();

    if (error || !doc) {
      return { kind: 'error', error: 'no_access', details: 'Documento no encontrado o sin acceso.' };
    }

    const rawText: string = doc.full_text ?? '';
    const originalLength = rawText.length;

    if (originalLength === 0) {
      return {
        kind: 'data',
        output: {
          doc_id: doc.id,
          doc_name: doc.name,
          content: '',
          truncated: false,
          original_length: 0,
          note: 'Este documento no tiene texto extraído. Usa search_docs para buscar fragmentos.',
        },
      };
    }

    const truncated = originalLength > MAX_CONTENT_CHARS;
    const content = truncated ? rawText.slice(0, MAX_CONTENT_CHARS) : rawText;

    return {
      kind: 'data',
      output: { doc_id: doc.id, doc_name: doc.name, content, truncated, original_length: originalLength },
    };
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err);
    return { kind: 'error', error: 'read_failed', details };
  }
};

export const readDocTool: ToolBundle = {
  definition: {
    name: 'read_doc',
    description:
      'Lee el contenido completo de un documento del corpus. ' +
      'Úsalo después de search_docs cuando necesites contexto completo más allá de los fragmentos. ' +
      'El doc_id debe ser uno devuelto por search_docs. ' +
      'Si el documento supera 50.000 caracteres, el contenido se trunca y truncated=true.',
    input_schema: {
      type: 'object',
      properties: {
        doc_id: {
          type: 'string',
          description: 'ID del documento a leer, devuelto previamente por search_docs.',
        },
      },
      required: ['doc_id'],
    },
  },
  execute: (input, ctx) => executeTyped(input as ReadDocInput, ctx),
};
