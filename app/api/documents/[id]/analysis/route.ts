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
 * GET /api/documents/[id]/analysis
 * Devuelve el ultimo analisis guardado de un documento de la organizacion
 * del usuario, leido de analysis_results. No recalcula ni gasta creditos.
 *
 * Match:
 *   1. Por document_id = id (preciso; analisis lanzados desde la bandeja).
 *   2. Si no hay, por document_name (respaldo para analisis de subida, que
 *      nacen con document_id = null).
 * Ambas consultas filtran por org_id -> aislamiento entre organizaciones.
 *
 * Si el documento no tiene analisis guardado, responde 200 con analysis: null
 * (estado normal en la bandeja, no un error).
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

  // Validar que el documento existe y es de la org. De paso, su nombre para
  // el match de respaldo.
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, name')
    .eq('id', id)
    .eq('org_id', org.orgId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  // 1) Match preciso por document_id.
  const { data: byId, error: byIdError } = await supabase
    .from('analysis_results')
    .select(ANALYSIS_COLUMNS)
    .eq('org_id', org.orgId)
    .eq('document_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<AnalysisRow>();

  if (byIdError) {
    console.error('[documents/analysis] match por id:', byIdError.message);
    return NextResponse.json({ error: 'Error al leer el analisis' }, { status: 500 });
  }

  let result = byId;

  // 2) Respaldo por nombre (solo si no hubo match por id).
  if (!result) {
    const { data: byName, error: byNameError } = await supabase
      .from('analysis_results')
      .select(ANALYSIS_COLUMNS)
      .eq('org_id', org.orgId)
      .eq('document_name', doc.name)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<AnalysisRow>();

    if (byNameError) {
      console.error('[documents/analysis] match por nombre:', byNameError.message);
      return NextResponse.json({ error: 'Error al leer el analisis' }, { status: 500 });
    }

    result = byName;
  }

  // Sin analisis guardado: estado normal en la bandeja, no error.
  if (!result) {
    return NextResponse.json({
      documentId: doc.id,
      documentName: doc.name,
      analysis: null,
      counts: null,
      analyzedAt: null,
    });
  }

  return NextResponse.json({
    documentId: doc.id,
    documentName: doc.name,
    analysisResultId: result.id,
    matchedBy: result.document_id === id ? 'id' : 'name',
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
