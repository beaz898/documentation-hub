import { generateQueryEmbedding } from '@/lib/embeddings';
import { queryVectors } from '@/lib/pinecone/vectors';
import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

const TOP_K = 6;
const MIN_SCORE = 0.3;
const MAX_FRAGMENT_CHARS = 400;

interface SearchDocsInput {
  query: string;
}

interface SearchResult {
  doc_id: string;
  doc_name: string;
  chunk_id: number;
  score: number;
  fragment: string;
}

const executeTyped: ToolExecutorTyped<SearchDocsInput> = async (
  input,
  context: ToolContext
): Promise<ToolExecutionResult> => {
  if (!input.query || input.query.trim().length === 0) {
    return { kind: 'error', error: 'invalid_input', details: 'query no puede estar vacío' };
  }

  try {
    const vector = await generateQueryEmbedding(input.query.trim());
    const matches = await queryVectors(context.orgId, { vector, topK: TOP_K, includeMetadata: true });
    const results: SearchResult[] = matches
      .filter(m => (m.score ?? 0) >= MIN_SCORE)
      .map(m => {
        const meta = (m.metadata ?? {}) as Record<string, unknown>;
        const rawText = typeof meta.text === 'string' ? meta.text : '';
        return {
          doc_id:   typeof meta.documentId   === 'string' ? meta.documentId   : '',
          doc_name: typeof meta.documentName === 'string' ? meta.documentName : '',
          chunk_id: typeof meta.chunkIndex   === 'number' ? meta.chunkIndex   : 0,
          score:    Math.round((m.score ?? 0) * 1000) / 1000,
          fragment: rawText.slice(0, MAX_FRAGMENT_CHARS),
        };
      })
      .filter(r => r.doc_id !== '');

    const output: Record<string, unknown> = { results };
    if (results.length === 0) {
      output.note = 'No se encontraron fragmentos relevantes para esta consulta en el corpus.';
    }

    return { kind: 'data', output };
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err);
    return { kind: 'error', error: 'retrieval_failed', details };
  }
};

export const searchDocsTool: ToolBundle = {
  definition: {
    name: 'search_docs',
    description:
      'Busca fragmentos relevantes en el corpus interno de la organización usando búsqueda semántica. ' +
      'DEBES usar search_docs antes de redactar cualquier respuesta o contenido. ' +
      'Devuelve hasta 6 fragmentos con su puntuación de relevancia, nombre de documento y chunk_id. ' +
      'Usa los doc_id devueltos como citations en finalize.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Consulta en lenguaje natural para buscar en la documentación.',
        },
      },
      required: ['query'],
    },
  },
  execute: (input, ctx) => executeTyped(input as SearchDocsInput, ctx),
};
