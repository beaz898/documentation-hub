import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

const ALLOWED_SOURCES = ['manual', 'google_drive', 'onedrive'] as const;
type DocSource = typeof ALLOWED_SOURCES[number];

interface ListDocsInput {
  folder_path?: string;
  source?: DocSource;
}

// Campos expuestos al agente — lista cerrada, nunca SELECT *.
// Si se añaden columnas a la tabla en el futuro, NO aparecen aquí a menos que
// se actualice explícitamente esta constante.
const DOC_FIELDS =
  'id, name, created_at, size_bytes, chunk_count, status, source, folder_path, source_modified_at';

const MAX_DOCS = 200;

const executeTyped: ToolExecutorTyped<ListDocsInput> = async (
  input,
  context: ToolContext,
): Promise<ToolExecutionResult> => {
  // Gate de admin — defensa en profundidad (la definición tampoco se ofrece a members)
  if (context.role !== 'admin') {
    return {
      kind: 'error',
      error: 'not_authorized',
      details: 'list_docs solo está disponible para administradores.',
    };
  }

  // Validar source si se pasa
  if (input.source && !(ALLOWED_SOURCES as readonly string[]).includes(input.source)) {
    return {
      kind: 'error',
      error: 'invalid_input',
      details: `source debe ser uno de: ${ALLOWED_SOURCES.join(', ')}`,
    };
  }

  let query = context.supabase
    .from('documents')
    .select(DOC_FIELDS)
    .eq('org_id', context.orgId)
    .order('created_at', { ascending: false })
    .limit(MAX_DOCS);

  if (input.folder_path) {
    query = query.eq('folder_path', input.folder_path);
  }
  if (input.source) {
    query = query.eq('source', input.source);
  }

  const { data, error } = await query;

  if (error) {
    return { kind: 'error', error: 'db_error', details: error.message };
  }

  const docs = data ?? [];
  const output: Record<string, unknown> = { documents: docs, total: docs.length };
  if (docs.length === 0) {
    output.note = 'No se encontraron documentos con los filtros indicados.';
  }

  return { kind: 'data', output };
};

export const listDocsTool: ToolBundle = {
  definition: {
    name: 'list_docs',
    description:
      'Lista los metadatos de los documentos del corpus: nombre, fecha de subida, tamaño, ' +
      'número de fragmentos, origen y carpeta. Útil para responder qué documentos hay en la ' +
      'organización, cuándo se subió un documento concreto, o cuáles vienen de Drive. ' +
      'No devuelve el contenido de los documentos — para eso usa read_doc. ' +
      'Solo disponible para administradores. ' +
      'Al presentar los resultados al usuario, NO uses tabla por defecto: resume en prosa ' +
      'o lista de nombres legible. Usa tabla únicamente si el usuario pide explícitamente ' +
      'comparar columnas o el caso lo requiere con claridad.',
    input_schema: {
      type: 'object',
      properties: {
        folder_path: {
          type: 'string',
          description: 'Opcional. Filtrar por carpeta exacta (ej. "Contratos/2024").',
        },
        source: {
          type: 'string',
          enum: ['manual', 'google_drive', 'onedrive'],
          description: 'Opcional. Filtrar por origen del documento.',
        },
      },
      required: [],
    },
  },
  execute: (input, ctx) => executeTyped(input as ListDocsInput, ctx),
};
