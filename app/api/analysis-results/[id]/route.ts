import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

interface AnalysisRow {
  id: string;
  document_id: string | null;
  document_name: string;
  analysis_type: 'quick' | 'exhaustive' | 'style';
  analysis: unknown | null;
  contradictions_found: number;
  contradictions_confirmed: number;
  minor_inconsistencies_found: number;
  duplicates_found: number;
  overlaps_found: number;
  style_problems_found: number;
  recommendation: 'INDEXAR' | 'REVISAR' | 'NO_INDEXAR' | null;
  involved_documents: string[] | null;
  created_at: string;
}

const ANALYSIS_COLUMNS =
  'id, document_id, document_name, analysis_type, analysis, ' +
  'contradictions_found, contradictions_confirmed, minor_inconsistencies_found, ' +
  'duplicates_found, overlaps_found, style_problems_found, ' +
  'recommendation, involved_documents, created_at';

/**
 * GET /api/analysis-results/[id]
 * Devuelve UN analisis por su id EXACTO (no "el mas reciente por document_id"),
 * filtrado por org_id. Lo usa el modal de decision de la bandeja para mostrar los
 * hallazgos de la version staged concreta que freno el portero (la fila apuntada
 * por document_staged.analysis_result_id, F-12) — no un analisis cualquiera del
 * documento. Misma forma de respuesta que /api/documents/[id]/analysis para que el
 * modal la consuma igual.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  // Lectura por id exacto, acotada a la org (aislamiento).
  const { data: result, error } = await supabase
    .from('analysis_results')
    .select(ANALYSIS_COLUMNS)
    .eq('org_id', org.orgId)
    .eq('id', id)
    .maybeSingle<AnalysisRow>();

  if (error) {
    console.error('[analysis-results/id] lectura:', error.message);
    return NextResponse.json({ error: 'Error al leer el analisis' }, { status: 500 });
  }

  if (!result) {
    return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    analysisResultId: result.id,
    documentId: result.document_id,
    documentName: result.document_name,
    analysisType: result.analysis_type,
    analysis: result.analysis ?? null,
    counts: {
      contradictions: result.contradictions_found,
      contradictionsConfirmed: result.contradictions_confirmed,
      minorInconsistencies: result.minor_inconsistencies_found,
      duplicates: result.duplicates_found,
      overlaps: result.overlaps_found,
      styleProblems: result.style_problems_found,
    },
    recommendation: result.recommendation,
    involvedDocuments: result.involved_documents ?? null,
    analyzedAt: result.created_at,
  });
}
