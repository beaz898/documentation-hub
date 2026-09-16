import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import {
  listVectorIdsByPrefix,
  fetchVectors,
  queryVectors,
  parseVectorId,
} from '@/lib/pinecone/vectors';
import { TOP_K_POR_CONSULTA } from '@/lib/analysis/retrieval';
import { runInBatches } from '@/lib/run-in-batches';
import { reparteVacio, type ClaseDePar } from '@/lib/analysis/clase-de-trozo';
import {
  matchesContables,
  acumularVecinos,
  resumirVecindario,
  UMBRALES_DEL_CENSO,
  type Vecino,
  type FilaDeVecindario,
  type ContadoresDelCenso,
} from '@/lib/analysis/vecindario';

/**
 * GET /api/admin/vecindario — B.243.
 *
 * «¿Qué documento de los míos toca a más documentos?» Por cada documento de la
 * organización cuenta contra cuántos OTROS tiene al menos un trozo por encima
 * del umbral, con los dos umbrales a la vez.
 *
 * SOLO LEE. No escribe en Supabase, no toca Pinecone más que para consultar, y
 * NO CONSUME NI UN CRÉDITO: los vectores ya están calculados: `fetchVectors` los
 * devuelve con sus `values`, así que no se embebe nada ni interviene ningún
 * modelo.
 *
 * ⚠️ SE CONSULTA SIN FILTRO DE CORPUS, Y ES DELIBERADO. `CORPUS_ACTIVO` sólo ve
 * los `analizado`, y hoy casi todo el corpus piloto está `pendiente`: con filtro
 * este censo devolvería ceros con toda la pinta de un resultado. Un cero que el
 * propio filtro fabrica es una pantalla apagada, no una medición.
 *
 * Parámetros:
 *   ?documentId=<uuid>  censa un solo documento (para trocear el trabajo si el
 *                       corpus no cabe en el presupuesto de tiempo).
 */

export const maxDuration = 300;

/** Tope de consultas del censo, y su motivo: `maxDuration` son 300 s y cada
 *  consulta a Pinecone ronda las décimas. Es un LÍMITE DECLARADO, así que lleva
 *  su contador (`consultas_omitidas_por_tope`): sin él, un censo truncado se
 *  leería como un censo completo con pocos vecinos — que es justo la conclusión
 *  contraria a la verdadera. */
const MAX_CONSULTAS = 1500;

/** Lotes contra Pinecone. Mismo orden de magnitud que `QUERY_BATCH_SIZE` del
 *  retrieval: aquí se paraleliza contra Pinecone, no contra un LLM con cuota. */
const LOTE_DE_CONSULTAS = 5;
/** `fetch` por lotes para no pedir cientos de vectores en una sola llamada. */
const LOTE_DE_FETCH = 100;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgR = await resolverOrg(supabase, user.id);
    if (!orgR.resuelta) return respuestaDeOrgNoResuelta(orgR);
    const org = orgR.org;
    if (org.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden usar esta herramienta.' },
        { status: 403 },
      );
    }
    const orgId = org.orgId;

    const soloEste = req.nextUrl.searchParams.get('documentId');

    let consulta = supabase
      .from('documents')
      .select('id, name, analysis_status, active_generation')
      .eq('org_id', orgId);
    if (soloEste) consulta = consulta.eq('id', soloEste);

    const { data: documentos, error: errDocs } = await consulta;
    if (errDocs) {
      // ⚠️ NO SE DEGRADA A LISTA VACÍA. Un listado que no llegó no significa
      // «no hay documentos»: eso es B.138 con otro disfraz.
      console.error(`[vecindario] no se pudo leer la lista de documentos | org=${orgId} | ${errDocs.message}`);
      return NextResponse.json(
        { error: 'No se ha podido leer la lista de documentos. Vuelve a intentarlo.' },
        { status: 503, headers: { 'Retry-After': '5' } },
      );
    }
    if (!documentos || documentos.length === 0) {
      return NextResponse.json({
        documentos: 0,
        umbrales: UMBRALES_DEL_CENSO,
        contadores: censoVacio(),
        filas: [],
      });
    }

    // El mapa de generaciones activas, para TODOS los documentos de la org —
    // no sólo los censados: un vecino puede ser cualquiera, y sin su generación
    // activa no se sabe si el fragmento que lo trajo sigue vivo.
    const { data: todas, error: errGen } = await supabase
      .from('documents')
      .select('id, active_generation')
      .eq('org_id', orgId);
    if (errGen) {
      console.error(`[vecindario] no se pudieron leer las generaciones activas | org=${orgId} | ${errGen.message}`);
      return NextResponse.json(
        { error: 'No se han podido leer las generaciones activas. Vuelve a intentarlo.' },
        { status: 503, headers: { 'Retry-After': '5' } },
      );
    }
    const activas = new Map<string, number>();
    for (const f of todas ?? []) {
      activas.set(f.id as string, (f.active_generation as number | null) ?? 1);
    }

    const contadores = censoVacio();
    const filas: FilaDeVecindario[] = [];

    for (const doc of documentos) {
      const documentId = doc.id as string;
      const documentName = (doc.name as string | null) ?? documentId;

      const idsTodos = await listVectorIdsByPrefix(orgId, documentId);
      // La generación se PREGUNTA al mapa, igual que en el retrieval — aquí a
      // través del id, que es de donde se puede leer sin bajar el vector.
      const activaDelDoc = activas.get(documentId) ?? 1;
      const ids = idsTodos.filter(id => {
        const partes = parseVectorId(id);
        return partes !== null && partes.generation === activaDelDoc;
      });

      if (ids.length === 0) {
        contadores.documentos_sin_vectores += 1;
        filas.push({
          documentId,
          documentName,
          analysisStatus: (doc.analysis_status as string | null) ?? null,
          consultas: 0,
          vecinos: 0,
          vecinos_045: 0,
          scoreMax: 0,
          detalle: [],
          porClase: reparteVacio(),
        });
        continue;
      }

      const presupuesto = MAX_CONSULTAS - contadores.consultas_realizadas;
      const aConsultar = ids.slice(0, Math.max(0, presupuesto));
      contadores.consultas_omitidas_por_tope += ids.length - aConsultar.length;

      const mejores = new Map<string, Vecino>();

      for (let i = 0; i < aConsultar.length; i += LOTE_DE_FETCH) {
        const trozo = aConsultar.slice(i, i + LOTE_DE_FETCH);
        const registros = await fetchVectors(orgId, trozo);
        const vectores = trozo
          .map(id => registros[id])
          .filter(r => r !== undefined && Array.isArray(r.values) && r.values.length > 0);

        const resultados = await runInBatches(
          vectores,
          v => queryVectors(orgId, {
            vector: v.values,
            topK: TOP_K_POR_CONSULTA,
            includeMetadata: true,
            // SIN `filter`: ver la cabecera. Con CORPUS_ACTIVO esto daría ceros.
          }),
          { batchSize: LOTE_DE_CONSULTAS },
        );
        contadores.consultas_realizadas += vectores.length;

        // ⚠️ EL ÍNDICE IMPORTA: `runInBatches` conserva el orden, así que
        // `resultados[i]` son los matches de `vectores[i]`. Hace falta porque la
        // clase del par (B.246) no se puede saber mirando sólo un lado — el
        // texto del trozo CON EL QUE SE PREGUNTÓ es la otra mitad, y ya viene en
        // la metadata del vector bajado: no cuesta ni una consulta más.
        resultados.forEach((matches, idx) => {
          const { contables, deGeneracionMuerta } = matchesContables(matches, documentId, activas);
          contadores.fragmentos_de_generacion_muerta += deGeneracionMuerta;
          acumularVecinos(mejores, contables, vectores[idx].metadata?.text ?? '');
        });
      }

      const resumen = resumirVecindario(mejores);
      filas.push({
        documentId,
        documentName,
        analysisStatus: (doc.analysis_status as string | null) ?? null,
        consultas: aConsultar.length,
        ...resumen,
      });
    }

    filas.sort((a, b) => b.vecinos_045 - a.vecinos_045 || b.vecinos - a.vecinos);

    // ⚠️ EL AGREGADO, Y NO SÓLO EL DESGLOSE POR FILA. Es la regla de F-102: todo
    // registro por-unidad imprime además su total, o no imprime cifras. La
    // pregunta de B.246 —«¿cuántos de los vecinos de este corpus son cruces de
    // FORMATO?»— no se contesta fila a fila: se contesta sumando.
    const porClaseTotal = reparteVacio();
    let vecindadesTotales = 0;
    for (const f of filas) {
      for (const clase of Object.keys(porClaseTotal) as ClaseDePar[]) {
        porClaseTotal[clase] += f.porClase[clase];
        vecindadesTotales += f.porClase[clase];
      }
    }

    if (contadores.fragmentos_de_generacion_muerta > 0) {
      console.warn(`[vecindario] GENERACIONES MUERTAS en el índice | org=${orgId} | fragmentos=${contadores.fragmentos_de_generacion_muerta}`);
    }
    if (contadores.consultas_omitidas_por_tope > 0) {
      console.warn(`[vecindario] CENSO TRUNCADO | org=${orgId} | omitidas=${contadores.consultas_omitidas_por_tope} de tope ${MAX_CONSULTAS}`);
    }

    return NextResponse.json({
      documentos: filas.length,
      umbrales: UMBRALES_DEL_CENSO,
      topK: TOP_K_POR_CONSULTA,
      topeDeConsultas: MAX_CONSULTAS,
      // ⚠️ EL CENSO ESTÁ COMPLETO SI Y SOLO SI ESTO ES CERO. Va en la respuesta
      // y no sólo en el registro, porque quien lee la tabla es quien tiene que
      // saber si le falta un trozo.
      completo: contadores.consultas_omitidas_por_tope === 0,
      contadores,
      // B.246 — de qué clase son los pares de trozos que producen las
      // vecindades. `resumen_x_resumen` alto significa que el parecido de este
      // corpus es de ENVOLTORIO: dos resúmenes de tabla comparten ~52
      // caracteres de frase hecha antes del primer dato propio.
      vecindadesTotales,
      porClaseTotal,
      filas,
    });
  } catch (error: unknown) {
    console.error('Error in /api/admin/vecindario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

function censoVacio(): ContadoresDelCenso {
  // Todos a cero EXPLÍCITO: un contador ausente no se distingue de «no se miró».
  return {
    fragmentos_de_generacion_muerta: 0,
    documentos_sin_vectores: 0,
    consultas_omitidas_por_tope: 0,
    consultas_realizadas: 0,
  };
}
