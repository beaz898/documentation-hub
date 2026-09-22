import { generateQueryEmbedding } from '@/lib/embeddings';
import { queryVectors } from '@/lib/pinecone/vectors';
import {
  documentosVivos,
  repartoPorFilaViva,
  idsParaElRegistro,
  MENSAJE_VERIFICACION_NO_DISPONIBLE,
} from '@/lib/documents/vivos';
import { documentIdsDeLosMatches } from '@/lib/analysis/criba-de-matches';
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

    // ══ ¿EXISTEN? ANTES DE DEVOLVER NADA — F-115 (22/09/2026) ══
    //
    // ⚠️ ESTA HERRAMIENTA NO TENÍA NINGUNA GUARDA, y es la que menos podía
    // tenerla: no hacía una sola consulta a Supabase, así que devolvía
    // `doc_name` y `fragment` de lo que el índice dijera. Un documento borrado
    // llegaba al modelo con su nombre y su texto, y de ahí a una cita en
    // `finalize`.
    //
    // ⚠️ Y SI NO SE PUEDE VERIFICAR, NO SE INVENTA: esta herramienta tiene canal
    // de error propio, así que no lanza — devuelve `kind:'error'`, que es lo que
    // el runner sabe leer. El modelo recibe que la búsqueda no se pudo hacer, no
    // una lista vacía que confundiría con «no hay nada».
    const existencia = await documentosVivos(context.supabase, {
      orgId: context.orgId,
      ids: documentIdsDeLosMatches(matches),
    });
    if (existencia.estado === 'no_leido') {
      console.error(`[search_docs] verificación no disponible | org=${context.orgId} | ${existencia.motivo}`);
      return {
        kind: 'error',
        error: 'verificacion_no_disponible',
        details: MENSAJE_VERIFICACION_NO_DISPONIBLE,
      };
    }

    const conDocumentId = matches
      .map(m => ({ documentId: m.metadata ? String(m.metadata.documentId ?? '') : '', match: m }))
      .filter(x => x.documentId !== '');
    const { vivos, sinFila } = repartoPorFilaViva(conDocumentId, existencia.generaciones);
    if (sinFila.length > 0) {
      const documentos = [...new Set(sinFila.map(x => x.documentId))];
      console.warn(
        `[search_docs] SIN FILA VIVA — ${sinFila.length} fragmento(s) descartados | org=${context.orgId} | ` +
        `docs=${documentos.join(',')} | vectores=${idsParaElRegistro(sinFila.map(x => x.match.id)).join(',')}`,
      );
    }

    const results: SearchResult[] = vivos
      .map(x => x.match)
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
