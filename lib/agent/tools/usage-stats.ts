import type { ToolBundle, ToolContext, ToolExecutionResult, ToolExecutorTyped } from './types';

interface UsageStatsInput {
  doc_name?: string;
  days?: number;
}

const DEFAULT_DAYS    = 30;
const MAX_DAYS        = 90;
const MAX_CHAT_ROWS   = 5000;
const MAX_ANALYSIS_ROWS = 2000;
const MAX_DOCS        = 500;

// Campos de analysis_results — sin texto de usuario
const ANALYSIS_FIELDS =
  'document_name, contradictions_found, contradictions_confirmed, ' +
  'duplicates_found, overlaps_found, style_problems_found, recommendation, created_at';

// Campos de chat_queries — NUNCA el campo `question` (datos sensibles de usuario)
const CHAT_FIELDS = 'documents_used, created_at';

type QualityEntry = {
  analyses: number;
  contradictions: number;
  contradictions_confirmed: number;
  duplicates: number;
  overlaps: number;
  style: number;
  last_recommendation: string | null;
  last_analyzed_at: string | null;
};

const executeTyped: ToolExecutorTyped<UsageStatsInput> = async (
  input,
  context: ToolContext,
): Promise<ToolExecutionResult> => {
  if (context.role !== 'admin') {
    return {
      kind: 'error',
      error: 'not_authorized',
      details: 'usage_stats solo está disponible para administradores.',
    };
  }

  const days  = Math.min(Math.max(1, input.days ?? DEFAULT_DAYS), MAX_DAYS);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { orgId } = context;

  const [analysisRes, chatRes, docsRes] = await Promise.all([
    context.supabase
      .from('analysis_results')
      .select(ANALYSIS_FIELDS)
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_ANALYSIS_ROWS),
    context.supabase
      .from('chat_queries')
      .select(CHAT_FIELDS)
      .eq('org_id', orgId)
      .gte('created_at', since)
      .limit(MAX_CHAT_ROWS),
    context.supabase
      .from('documents')
      .select('id, name')
      .eq('org_id', orgId)
      .limit(MAX_DOCS),
  ]);

  if (analysisRes.error) return { kind: 'error', error: 'db_error', details: analysisRes.error.message };
  if (chatRes.error)     return { kind: 'error', error: 'db_error', details: chatRes.error.message };

  type AnalysisRow = {
    document_name: string;
    contradictions_found: number;
    contradictions_confirmed: number;
    duplicates_found: number;
    overlaps_found: number;
    style_problems_found: number;
    recommendation: string | null;
    created_at: string;
  };
  type ChatRow = { documents_used: unknown; created_at: string };

  const analysisRows = (analysisRes.data ?? []) as unknown as AnalysisRow[];
  const chatRows     = (chatRes.data ?? []) as unknown as ChatRow[];
  const allDocs      = (docsRes.data ?? []) as Array<{ id: string; name: string }>;

  // ── Calidad por documento ────────────────────────────────────────────────────
  // Filas ordenadas DESC → primera por documento = análisis más reciente

  const qualityMap: Record<string, QualityEntry> = {};

  for (const r of analysisRows) {
    const name = r.document_name;
    if (!qualityMap[name]) {
      qualityMap[name] = {
        analyses: 0, contradictions: 0, contradictions_confirmed: 0,
        duplicates: 0, overlaps: 0, style: 0,
        last_recommendation: null, last_analyzed_at: null,
      };
    }
    const q = qualityMap[name];
    q.analyses++;
    q.contradictions           += r.contradictions_found           ?? 0;
    q.contradictions_confirmed += r.contradictions_confirmed       ?? 0;
    q.duplicates               += r.duplicates_found               ?? 0;
    q.overlaps                 += r.overlaps_found                 ?? 0;
    q.style                    += r.style_problems_found           ?? 0;
    if (!q.last_recommendation) {
      q.last_recommendation = r.recommendation ?? null;
      q.last_analyzed_at    = r.created_at     ?? null;
    }
  }

  // ── Uso en chat por documento ────────────────────────────────────────────────
  // chat_queries filtrado por org_id; documents_used referencia solo docs de esa org

  const chatAppearances: Record<string, number> = {};
  const coverageByDocId: Record<string, { chunks: Set<number>; totalChunks: number }> = {};

  for (const q of chatRows) {
    const docs = (q.documents_used) as Array<{
      documentId?: string;
      documentName?: string;
      chunks?: number[];
      totalChunks?: number;
    }> | null;
    if (!Array.isArray(docs)) continue;

    for (const d of docs) {
      if (d.documentName) {
        chatAppearances[d.documentName] = (chatAppearances[d.documentName] ?? 0) + 1;
      }
      if (
        d.documentId &&
        Array.isArray(d.chunks) &&
        typeof d.totalChunks === 'number' &&
        d.totalChunks > 0
      ) {
        if (!coverageByDocId[d.documentId]) {
          coverageByDocId[d.documentId] = { chunks: new Set(), totalChunks: d.totalChunks };
        }
        for (const c of d.chunks) coverageByDocId[d.documentId].chunks.add(c);
        if (d.totalChunks > coverageByDocId[d.documentId].totalChunks) {
          coverageByDocId[d.documentId].totalChunks = d.totalChunks;
        }
      }
    }
  }

  // coverage% por documentId (ambas fuentes ya filtradas por org_id)
  const coveragePctById: Record<string, number> = {};
  for (const [id, cv] of Object.entries(coverageByDocId)) {
    coveragePctById[id] = Math.round((cv.chunks.size / cv.totalChunks) * 100);
  }

  // índice name→id desde la tabla documents (filtrada por org_id)
  const nameToId: Record<string, string> = {};
  for (const d of allDocs) nameToId[d.name] = d.id;

  // ── Stats por documento ──────────────────────────────────────────────────────

  const knownNames = new Set([
    ...allDocs.map(d => d.name),
    ...Object.keys(qualityMap),
    ...Object.keys(chatAppearances),
  ]);

  const docFilter  = input.doc_name?.toLowerCase();
  const targetNames = docFilter
    ? [...knownNames].filter(n => n.toLowerCase().includes(docFilter))
    : [...knownNames];

  const documents = targetNames
    .map(name => {
      const q      = qualityMap[name];
      const docId  = nameToId[name];
      const coveragePct = docId != null ? (coveragePctById[docId] ?? null) : null;
      return {
        name,
        chat_appearances:         chatAppearances[name] ?? 0,
        coverage_pct:             coveragePct,
        analyses_count:           q?.analyses ?? 0,
        contradictions:           q?.contradictions ?? 0,
        contradictions_confirmed: q?.contradictions_confirmed ?? 0,
        duplicates:               q?.duplicates ?? 0,
        overlaps:                 q?.overlaps ?? 0,
        style_problems:           q?.style ?? 0,
        last_recommendation:      q?.last_recommendation ?? null,
        last_analyzed_at:         q?.last_analyzed_at ?? null,
      };
    })
    .sort((a, b) => b.chat_appearances - a.chat_appearances);

  const usedDocNames   = new Set(Object.keys(chatAppearances));
  const docs_never_used = allDocs
    .map(d => d.name)
    .filter(name => !usedDocNames.has(name));

  const output: Record<string, unknown> = {
    period_days:        days,
    total_chat_queries: chatRows.length,
    documents,
  };

  // docs_never_used solo tiene sentido sobre el corpus completo, no sobre filtro puntual
  if (!docFilter) {
    output.docs_never_used = docs_never_used;
  }

  return { kind: 'data', output };
};

export const usageStatsTool: ToolBundle = {
  definition: {
    name: 'usage_stats',
    description:
      'Consulta estadísticas de uso del corpus: cuántas veces aparece cada documento en ' +
      'respuestas de chat, cobertura de recuperación (% de fragmentos recuperados), ' +
      'problemas de calidad detectados y documentos que nunca se han consultado. ' +
      'Útil para "¿qué documentos se usan más?", "¿qué docs tienen problemas?", ' +
      '"¿hay documentos que nadie consulta?". ' +
      'No devuelve texto de preguntas ni datos por usuario: solo métricas agregadas ' +
      'por documento. Solo disponible para administradores. ' +
      'Al presentar los resultados al usuario, NO uses tabla por defecto: resume en prosa ' +
      'los puntos más relevantes. Usa tabla solo si el usuario pide explícitamente ' +
      'comparar columnas o el caso lo requiere con claridad.',
    input_schema: {
      type: 'object',
      properties: {
        doc_name: {
          type: 'string',
          description: 'Opcional. Filtrar por nombre de documento (coincidencia parcial, no sensible a mayúsculas).',
        },
        days: {
          type: 'number',
          description: 'Período en días (1–90). Por defecto 30.',
        },
      },
      required: [],
    },
  },
  execute: (input, ctx) => executeTyped(input as UsageStatsInput, ctx),
};
