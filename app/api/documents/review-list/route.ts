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

  // 0) Versiones staged pendientes de la org (nueva version en vuelo, C.4d-2a).
  //    staged implica que la fila del documento esta en 'analizado' (invariante F-7);
  //    por eso el filtro de abajo las ocultaria y hay que incluirlas a mano.
  const { data: stagedRows, error: stagedError } = await supabase
    .from('document_staged')
    .select('document_id, generation, analysis_result_id')
    .eq('org_id', orgId);

  if (stagedError) {
    console.error('[review-list] staged:', stagedError.message);
    return NextResponse.json(
      { error: 'Error al leer las versiones pendientes' },
      { status: 500 },
    );
  }

  const stagedGenById = new Map<string, number>();
  // document_id del staged -> id del analisis que lo freno (puntero F-12), o null
  // si el staged aun no se ha analizado (o el sync lo reseteo). Distingue en la
  // bandeja "pendiente de analisis" de "con hallazgos, requiere decision".
  const stagedPtrById = new Map<string, string | null>();
  for (const row of stagedRows ?? []) {
    stagedGenById.set(row.document_id as string, row.generation as number);
    stagedPtrById.set(row.document_id as string, (row.analysis_result_id as string | null) ?? null);
  }
  const stagedIds = [...stagedGenById.keys()];

  // 1) Documentos por revisar: no-analizados O con una version staged pendiente.
  const docsBase = supabase
    .from('documents')
    .select('id, name, source, folder_path, folder_id, analysis_status, created_at')
    .eq('org_id', orgId);

  const docsFiltered =
    stagedIds.length > 0
      ? docsBase.or(`analysis_status.neq.analizado,id.in.(${stagedIds.join(',')})`)
      : docsBase.neq('analysis_status', 'analizado');

  const { data: docs, error: docsError } = await docsFiltered
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

  // 1.5) Analisis apuntados por los staged (F-12): traidos por su id EXACTO, no por
  //      nombre/fecha. Estos son los que gobiernan la entrada del portero en la
  //      bandeja ("con hallazgos, requiere decision"), asi que su precision importa.
  const stagedPtrIds = [...stagedPtrById.values()].filter((v): v is string => v !== null);
  const stagedAnalysisById = new Map<string, AnalysisSummaryRow>();
  if (stagedPtrIds.length > 0) {
    const { data: ptrAnalyses, error: ptrError } = await supabase
      .from('analysis_results')
      .select(`id, ${ANALYSIS_SUMMARY_COLUMNS}`)
      .eq('org_id', orgId)
      .in('id', stagedPtrIds);
    if (ptrError) {
      console.error('[review-list] analisis apuntados:', ptrError.message);
      return NextResponse.json({ error: 'Error al leer los analisis' }, { status: 500 });
    }
    for (const row of ((ptrAnalyses ?? []) as unknown as (AnalysisSummaryRow & { id: string })[])) {
      stagedAnalysisById.set(row.id, row);
    }
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

  // Construye el bloque de contadores desde una fila de analisis (mismo shape para
  // el analisis normal y para el apuntado por el staged).
  const buildAnalysisBlock = (a: AnalysisSummaryRow) => ({
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
  });

  // 3) Cruce en memoria: cada documento con su bloque de analisis (o null).
  const result = documents.map((doc) => {
    const a = latestByName.get(doc.name);
    const hasStaged = stagedGenById.has(doc.id);
    // Puntero del staged: si existe y apunta a un analisis cargado, esa version YA
    // se analizo y el portero la freno -> mostramos SUS contadores exactos. Si el
    // puntero es null, el staged esta pendiente de analisis.
    const stagedPtr = hasStaged ? (stagedPtrById.get(doc.id) ?? null) : null;
    const stagedRow = stagedPtr ? stagedAnalysisById.get(stagedPtr) : undefined;
    return {
      id: doc.id,
      name: doc.name,
      source: doc.source,
      folder_path: doc.folder_path,
      folder_id: doc.folder_id,
      analysis_status: doc.analysis_status,
      created_at: doc.created_at,
      stagedPending: hasStaged,
      stagedGeneration: stagedGenById.get(doc.id) ?? null,
      // F-12: el staged con puntero ya fue analizado (portero freno). Sin puntero,
      // esta pendiente. La fila usa esto para elegir la etiqueta (Commit 6d).
      stagedAnalyzed: hasStaged ? stagedRow != null : false,
      stagedAnalysis: stagedRow ? buildAnalysisBlock(stagedRow) : null,
      stagedAnalysisResultId: stagedPtr,
      lastAnalysis: a ? buildAnalysisBlock(a) : null,
    };
  });

  return NextResponse.json({ documents: result });
}
