import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * GET /api/documents/review-list
 * Lista los documentos de la organizacion con analysis_status != 'analizado',
 * para la bandeja de revision. Ligero: adjunta los CONTADORES del ultimo
 * analisis de cada documento (si existe), pero NO el objeto analysis pesado
 * (ese se carga al abrir un documento via /api/documents/[id]/analysis).
 *
 * Match de contadores: por document_name (los analisis de subida tienen
 * document_id = null), quedandose con el mas reciente. Filtrado por org_id.
 */

interface AnalysisSummaryRow {
  document_name: string;
  analysis: unknown | null;
  contradictions_found: number;
  contradictions_confirmed: number;
  minor_inconsistencies_found: number;
  duplicates_found: number;
  overlaps_found: number;
  style_problems_found: number;
  recommendation: 'INDEXAR' | 'REVISAR' | 'NO_INDEXAR' | null;
  created_at: string;
}

const ANALYSIS_SUMMARY_COLUMNS =
  'document_name, analysis, contradictions_found, contradictions_confirmed, ' +
  'minor_inconsistencies_found, duplicates_found, overlaps_found, ' +
  'style_problems_found, recommendation, created_at';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const org = await resolveOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json(
      { error: 'No perteneces a ninguna organizacion.' },
      { status: 403 },
    );
  }
  const orgId = org.orgId;

  // 1) Documentos no-analizados de la org (columnas crudas, como /api/documents).
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, name, source, folder_path, folder_id, analysis_status, created_at')
    .eq('org_id', orgId)
    .neq('analysis_status', 'analizado')
    .order('folder_path', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (docsError) {
    console.error('[review-list] documentos:', docsError.message);
    return NextResponse.json({ error: 'Error al leer los documentos' }, { status: 500 });
  }

  const documents = docs ?? [];

  // Sin documentos pendientes: respuesta vacia limpia.
  if (documents.length === 0) {
    return NextResponse.json({ documents: [] });
  }

  // 2) Una sola consulta de analisis para todo el lote (por nombre).
  const names = [...new Set(documents.map((d) => d.name))];
  const { data: analyses, error: analysesError } = await supabase
    .from('analysis_results')
    .select(ANALYSIS_SUMMARY_COLUMNS)
    .eq('org_id', orgId)
    .in('document_name', names)
    .order('created_at', { ascending: false });

  if (analysesError) {
    console.error('[review-list] analisis:', analysesError.message);
    return NextResponse.json({ error: 'Error al leer los analisis' }, { status: 500 });
  }

  // Mapa nombre -> analisis mas reciente (la consulta viene ordenada desc,
  // asi que el primero que se ve de cada nombre es el mas nuevo).
  const latestByName = new Map<string, AnalysisSummaryRow>();
  for (const row of ((analyses ?? []) as unknown as AnalysisSummaryRow[])) {
    if (!latestByName.has(row.document_name)) {
      latestByName.set(row.document_name, row);
    }
  }

  // 3) Cruce en memoria: cada documento con su bloque de analisis (o null).
  const result = documents.map((doc) => {
    const a = latestByName.get(doc.name);
    return {
      id: doc.id,
      name: doc.name,
      source: doc.source,
      folder_path: doc.folder_path,
      folder_id: doc.folder_id,
      analysis_status: doc.analysis_status,
      created_at: doc.created_at,
      lastAnalysis: a
        ? {
            hasDetail: a.analysis !== null,
            recommendation: a.recommendation,
            analyzedAt: a.created_at,
            counts: {
              contradictions: a.contradictions_found,
              contradictionsConfirmed: a.contradictions_confirmed,
              minorInconsistencies: a.minor_inconsistencies_found,
              duplicates: a.duplicates_found,
              overlaps: a.overlaps_found,
              styleProblems: a.style_problems_found,
            },
          }
        : null,
    };
  });

  return NextResponse.json({ documents: result });
}
