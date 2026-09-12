import { NextRequest, NextResponse } from 'next/server';
import { tieneOriginalEnLaNube } from '@/lib/documents/origen-en-la-nube';
import { analisisMasRecientePorDocumento, bloquesDeLaFila, type FilaDeAnalisis } from '@/lib/documents/analisis-del-documento';
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
 * Match de contadores: por `document_id` (B.212, 12/09/2026), preguntandole el
 * criterio a `lib/documents/analisis-del-documento.ts`. Antes era por
 * `document_name`, y el nombre colisiona: la bandeja enseñaba el analisis de
 * otro fichero. Filtrado por org_id.
 *
 * ⚠️ CONSECUENCIA QUE SE ACEPTA ENTERA: los analisis de subida nacen con
 * `document_id = null` y NO se ven aqui hasta que la indexacion los ADOPTA
 * (`ingest`, que les escribe el id del documento recien nacido). Un documento
 * sin analisis propio llega sin bloque, la fila se cierra y el boton de añadir
 * al corpus se apaga con su motivo. **Eso es lo correcto, no una regresion**: es
 * una funcionalidad que se paga, y sin analisis no hay nada que revisar.
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
  'org_id, document_id, document_name, analysis, contradictions_found, contradictions_confirmed, ' +
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
    .select('id, name, source, provider_file_id, folder_path, folder_id, analysis_status, created_at')
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

  // ══════════════════════════════════════════════════════════════════════════
  // 2) Una sola consulta de analisis para todo el lote — POR ID (B.212).
  //
  // ⚠️ HASTA EL 12/09/2026 ESTO EMPAREJABA POR `document_name`, y el nombre no
  // identifica: colisiona. La bandeja enseñaba, con sus contradicciones y sus
  // recuentos, el analisis de OTRO fichero. Medido en produccion el 11/09: once
  // filas sobre tres documentos, la mas reciente del 10/09.
  //
  // ⚠️ Y EL CRITERIO NO SE ESCRIBE AQUI: se le PREGUNTA a
  // `analisis-del-documento.ts`, que existe desde B.112 y decia en su primera
  // linea que la bandeja emparejaba por nombre. El criterio estaba escrito y
  // probado; su unico consumidor era el borrado, y la pantalla que lo necesitaba
  // nunca le pregunto. Esto es la otra mitad de aquel commit, no una pieza nueva.
  //
  // ⚠️ LO QUE ESTO NO ARREGLA, dicho aqui para que no se lea como resuelto: que
  // el analisis sea del documento no lo hace RECIENTE. Ver la cabecera de
  // `analisisMasRecientePorDocumento`.
  // ══════════════════════════════════════════════════════════════════════════
  const documentIds = documents.map((d) => d.id as string);
  const { data: analyses, error: analysesError } = await supabase
    .from('analysis_results')
    .select(ANALYSIS_SUMMARY_COLUMNS)
    .eq('org_id', orgId)
    .in('document_id', documentIds)
    .order('created_at', { ascending: false });

  if (analysesError) {
    console.error('[review-list] analisis:', analysesError.message);
    return NextResponse.json({ error: 'Error al leer los analisis' }, { status: 500 });
  }

  const analisisPorDocumento = analisisMasRecientePorDocumento(
    orgId,
    documentIds,
    (analyses ?? []) as unknown as (AnalysisSummaryRow & FilaDeAnalisis)[],
  );

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
    const hasStaged = stagedGenById.has(doc.id);
    // Puntero del staged: si existe y apunta a un analisis cargado, esa version YA
    // se analizo y el portero la freno -> mostramos SUS contadores exactos. Si el
    // puntero es null, el staged esta pendiente de analisis.
    const stagedPtr = hasStaged ? (stagedPtrById.get(doc.id) ?? null) : null;
    // ⚠️ LOS DOS BLOQUES SALEN DE FUENTES DISTINTAS, y quién sale de dónde lo
    // decide `bloquesDeLaFila` y no esta línea: lo propio por `document_id`, el
    // del staged por su PUNTERO exacto. Fundirlos devolvería «el más reciente de
    // los dos», que en un documento con versión en vuelo es una moneda al aire.
    const { propio: a, staged: stagedRow } = bloquesDeLaFila(
      doc.id as string,
      analisisPorDocumento,
      stagedPtr,
      stagedAnalysisById,
    );
    return {
      id: doc.id,
      name: doc.name,
      source: doc.source,
      // ⚠️ B.202 — LA PREGUNTA CONTESTADA, NO EL DATO CRUDO. El cliente no
      // vuelve a derivar «¿tiene original en la nube?» a partir de `source`
      // ni de nada: la contesta `tieneOriginalEnLaNube`, la MISMA línea que
      // usa el veto de `index-text`. Si el botón y el veto preguntaran cada
      // uno por su cuenta, acabarían discrepando.
      tiene_original_en_la_nube: tieneOriginalEnLaNube(doc),
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
