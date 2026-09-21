import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import {
  listVectorIdsByPrefix,
  fetchVectors,
  parseVectorId,
  contarVectoresDelNamespace,
} from '@/lib/pinecone/vectors';
import { repartoPorGeneracion, elRepartoDeGeneracionesCuadra } from '@/lib/pinecone/reparto-por-generacion';

/**
 * QUÉ VECTORES TIENE UN documentId, PREGUNTÁNDOLE A PINECONE — F-114 (21/09/2026).
 *
 * GET /api/admin/vectores-de-un-documento?documentId=<uuid>
 *
 * SOLO LEE. No escribe en Supabase, no escribe en Pinecone, no borra nada y no
 * consume ni un crédito: son un `listPaginated`, unos `fetch` por lotes y un
 * `describeIndexStats`. Solo-admin, y únicamente sobre el namespace de la
 * organización del usuario autenticado.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ POR QUÉ EXISTE, Y ES UNA INVERSIÓN DEL ORDEN DE LAS PREGUNTAS.
 *
 * Las once herramientas de administración que había **le piden permiso a la base
 * antes de mirar en Pinecone**: `diagnose-vectors` resuelve nombres contra
 * `documents` y sin fila devuelve una lista vacía; `vecindario` itera
 * `documents`; `estado-del-corpus` y `duplicates` parten de `documents`; y el
 * `POST` de `cleanup-orphans` recorre `documents`. **Un vector cuyo documento ya
 * no tiene fila es invisible para todas ellas.**
 *
 * La única que no depende de la fila —el `GET` de `cleanup-orphans`— enumera con
 * una consulta de SIMILITUD (un vector ficticio y `topK: 10000`), así que lo que
 * devuelve es «cuántos encontró», no «cuántos hay», y su respuesta no tiene
 * ningún campo que diga si la enumeración fue completa.
 *
 * Aquí el orden se invierte: **se mira primero y se pregunta después.** El
 * `documentId` se toma tal cual, se lista por PREFIJO DE ID —exhaustivo y
 * paginado— y la base se consulta sólo para INFORMAR de si hay fila, nunca para
 * decidir si merece la pena mirar.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y LA GENERACIÓN SE LEE DEL ID, NO SE CONSTRUYE (B.73). `listVectorIdsByPrefix`
 * descubre los ids que existen y `parseVectorId` saca su generación del propio
 * nombre. Ninguna línea de aquí supone «generación 1», que es el fallo por el que
 * `diagnose-vectors` reportaba `existe:false` sobre vectores que sí estaban — y
 * que en este caso es peor, porque sin fila no hay `active_generation` que leer.
 */

export const maxDuration = 300;

/** Lotes del `fetch`. El mismo tamaño que usa el censo de vecindario: pedir
 *  cientos de vectores con su metadata en una sola llamada es lo que roza el
 *  tope de tamaño de respuesta del servicio. */
const LOTE_DE_FETCH = 100;

/** Forma con la que se pide la fila, para no repetir la lista de columnas. */
const COLUMNAS_DE_LA_FILA = 'id, name, analysis_status, chunk_count, active_generation';

export async function GET(req: NextRequest) {
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

  const documentId = req.nextUrl.searchParams.get('documentId')?.trim() ?? '';
  if (documentId === '') {
    return NextResponse.json(
      { error: 'Parámetro documentId requerido.' },
      { status: 400 },
    );
  }

  try {
    // ── 1 · PINECONE PRIMERO, y sin preguntar a nadie si mirar ───────────
    // `listVectorIdsByPrefix` es TODO O EXCEPCIÓN: si una página se agota sin
    // éxito lanza, y nunca devuelve «lo que llevaba». Por eso `truncada` puede
    // declararse `false` sin mentir — no hay un camino que devuelva una lista
    // parcial.
    const ids = await listVectorIdsByPrefix(orgId, documentId);

    const vectores: Array<{
      vectorId: string;
      generation: number | null;
      chunkIndex: number | null;
      analysisStatus: string | null;
      documentName: string | null;
      generacionEnLaMetadata: number | null;
    }> = [];

    for (let i = 0; i < ids.length; i += LOTE_DE_FETCH) {
      const trozo = ids.slice(i, i + LOTE_DE_FETCH);
      const registros = await fetchVectors(orgId, trozo);
      for (const id of trozo) {
        const partes = parseVectorId(id);
        const meta = registros[id]?.metadata;
        vectores.push({
          vectorId: id,
          generation: partes?.generation ?? null,
          chunkIndex: partes?.chunkIndex ?? null,
          analysisStatus: typeof meta?.analysisStatus === 'string' ? meta.analysisStatus : null,
          documentName: typeof meta?.documentName === 'string' ? meta.documentName : null,
          // ⚠️ LA MISMA CIFRA POR LA OTRA VÍA, y va aparte a propósito: la de
          // arriba sale del ID y ésta de la METADATA. Si difieren, el vector lo
          // escribió un camino que no las mantuvo de acuerdo — y eso no se puede
          // ver con una sola de las dos delante.
          generacionEnLaMetadata: typeof meta?.generation === 'number' ? meta.generation : null,
        });
      }
    }

    const reparto = repartoPorGeneracion(ids);

    // ── 2 · LA BASE, SÓLO PARA INFORMAR ─────────────────────────────────
    // ⚠️ Si esta lectura falla NO se cae la herramienta: lo que se vino a ver
    // está en Pinecone, y perderlo por no poder leer la fila sería exactamente
    // la dependencia que esta ruta existe para romper.
    let existeFilaEnLaBase: boolean | null = null;
    let filaEnLaBase: Record<string, unknown> | null = null;
    let filaMotivo: string | null = null;

    const { data: fila, error: errFila } = await supabase
      .from('documents')
      .select(COLUMNAS_DE_LA_FILA)
      .eq('org_id', orgId)
      .eq('id', documentId)
      .maybeSingle();

    if (errFila) {
      filaMotivo = `no se pudo leer la fila: ${errFila.message}`;
    } else {
      existeFilaEnLaBase = fila !== null;
      filaEnLaBase = fila as Record<string, unknown> | null;
    }

    // ── 3 · LOS DOS TOTALES, PARA PODER RESTARLOS ───────────────────────
    // El del namespace lo CUENTA Pinecone (no lo busca); el documentado sale de
    // sumar `chunk_count` de las filas de la organización. Su diferencia es lo
    // que sobra en el índice, y es la única forma de verla sin similitud.
    const cuenta = await contarVectoresDelNamespace(orgId);

    let vectoresDocumentadosEnLaBase: number | null = null;
    let documentadosMotivo: string | null = null;
    const { data: filas, error: errFilas } = await supabase
      .from('documents')
      .select('chunk_count')
      .eq('org_id', orgId);
    if (errFilas) {
      documentadosMotivo = `no se pudo sumar chunk_count: ${errFilas.message}`;
    } else {
      vectoresDocumentadosEnLaBase = (filas ?? [])
        .reduce((suma, f) => suma + ((f.chunk_count as number | null) ?? 0), 0);
    }

    return NextResponse.json({
      documentId,
      existeFilaEnLaBase,
      filaEnLaBase,
      // Sólo presente si la lectura de la fila falló: `existeFilaEnLaBase` queda
      // en `null` y este campo dice por qué. Ausencia de dato no es dato.
      filaMotivo,

      vectoresEncontrados: ids.length,
      porGeneracion: reparto.porGeneracion,
      // ⚠️ ESPERADO VACÍO. Un id que `parseVectorId` no sabe descomponer.
      idsAnomalos: reparto.anomalos,
      // El reparto suma lo listado. Si esto fuera `false`, el desglose por
      // generación no se podría leer como completo.
      repartoCuadra: elRepartoDeGeneracionesCuadra(ids, reparto),
      vectores,

      // ⚠️ CÓMO SE ENUMERÓ, en la respuesta y no sólo en el código: es lo que
      // `cleanup-orphans` no dice, y por lo que su «0 huérfanos» no se puede
      // leer como una medición del índice.
      enumeracion: 'prefijo de id (listPaginated, exhaustiva y paginada; todo o excepción)',
      truncada: false,

      totalDelNamespaceSegunPinecone: cuenta.delNamespace,
      totalDelIndiceEntero: cuenta.delIndiceEntero,
      dimensionDelIndice: cuenta.dimension,
      vectoresDocumentadosEnLaBase,
      documentadosMotivo,
    });
  } catch (error: unknown) {
    console.error('[vectores-de-un-documento] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 },
    );
  }
}
