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
  buildCorpusFilter,
} from '@/lib/pinecone/vectors';
import { TOP_K_POR_CONSULTA } from '@/lib/analysis/retrieval';
import { medirElCanario, canarioNoMedido, elOrdenSeSostiene } from '@/lib/analysis/canario';
import { generateEmbeddingsConSello } from '@/lib/embeddings';
import { runInBatches } from '@/lib/run-in-batches';
import { reparteVacio, type ClaseDePar } from '@/lib/analysis/clase-de-trozo';
import {
  matchesContables,
  acumularVecinos,
  resumirVecindario,
  distribucionDeScores,
  topKPedido,
  poblacionPedida,
  tramoPedido,
  acumularParejaDelMinimo,
  parejaMenorDeDos,
  muestraDeTexto,
  TOPK_MAXIMO_DEL_SERVICIO,
  type Vecino,
  type FilaDeVecindario,
  type ContadoresDelCenso,
  type ParejaDelMinimo,
} from '@/lib/analysis/vecindario';

/**
 * GET /api/admin/vecindario — B.243.
 *
 * «¿Qué documento de los míos toca a más documentos?» Por cada documento de la
 * organización cuenta contra cuántos OTROS tiene al menos un trozo por encima
 * del umbral, con los dos umbrales a la vez.
 *
 * SOLO LEE. No escribe en Supabase, no toca Pinecone más que para consultar, y
 * NO CONSUME NI UN CRÉDITO: los vectores del corpus ya están calculados —
 * `fetchVectors` los devuelve con sus `values`— así que el censo no embebe nada.
 *
 * ⚠️ CON UNA EXCEPCIÓN, Y SÓLO CUANDO SE PIDE — 23/09/2026: `?canario=1` hace DOS
 * llamadas al servicio de embeddings, de tres textos cortos cada una (F-114 P3).
 * Sigue sin consumir créditos —esa contabilidad es nuestra y esto no pasa por
 * ella— pero **sí cuenta para el límite de tokens por minuto del proveedor**. Por
 * omisión no se mide y la respuesta lo dice con su motivo.
 *
 * ⚠️ SE CONSULTA SIN FILTRO DE CORPUS, Y ES DELIBERADO. `CORPUS_ACTIVO` sólo ve
 * los `analizado`, y hoy casi todo el corpus piloto está `pendiente`: con filtro
 * este censo devolvería ceros con toda la pinta de un resultado. Un cero que el
 * propio filtro fabrica es una pantalla apagada, no una medición.
 *
 * Parámetros:
 *   ?documentId=<uuid>  censa un solo documento (para trocear el trabajo si el
 *                       corpus no cabe en el presupuesto de tiempo).
 *   ?topK=N             F-113. Por encima del fondo, el mínimo devuelto es el
 *                       SUELO real; por debajo, es el puesto N. Tope del
 *                       servicio: TOPK_MAXIMO_DEL_SERVICIO.
 *   ?poblacion=real     F-113. Filtro de corpus + exclusión del propio DENTRO
 *                       de la consulta: la población que el análisis alcanza.
 *   ?desde=N&cuantos=M  F-114. Un TRAMO de la lista de documentos, ordenada por
 *                       id. Para partir la matriz completa cuando no cabe en
 *                       `maxDuration`. Los histogramas se suman, los mínimos se
 *                       toman por el menor y los percentiles se RECALCULAN del
 *                       histograma sumado — nunca se promedian.
 *   ?canario=1          F-114 P3. Mide el CANARIO: dos parejas de textos fijos,
 *                       embebidos al vuelo como 'passage' y nunca indexados. Su
 *                       parecido sólo puede moverse si se movió el MODELO, así
 *                       que es lo que atribuye la causa cuando el termómetro da
 *                       un salto. Se mide DOS VECES seguidas, y la diferencia es
 *                       el ruido propio del servicio.
 *
 * ⚠️ NINGUNO DE LOS CINCO CAMBIA EL COMPORTAMIENTO POR OMISIÓN, y todos se
 * declaran en la respuesta: un censo que no dice con qué topK, qué población y
 * qué tramo se midió no se puede releer ni combinar.
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

    // F-113 — LOS DOS PARAMETROS DE LA MEDICION DEL SUELO. Sin ellos, el censo se
    // comporta EXACTAMENTE como antes: el topK del pipeline y sin filtro de
    // corpus. El parseo vive en vecindario.ts, con su caso decisivo.
    const topK = topKPedido(req.nextUrl.searchParams.get('topK'), TOP_K_POR_CONSULTA);
    const poblacion = poblacionPedida(req.nextUrl.searchParams.get('poblacion'));

    // ══ F-114 P3 — EL CANARIO, y es lo ÚNICO de este censo que embebe ══
    //
    // ⚠️ SE PIDE, NO VIENE POR OMISIÓN, y es por lo mismo que los otros cuatro
    // parámetros: ninguno cambia el comportamiento por omisión. Además, la matriz
    // completa se pide en NUEVE tramos, y medir el canario en cada uno serían
    // dieciocho llamadas al servicio de embeddings para un dato que es el mismo:
    // los textos del canario son FIJOS y no dependen del tramo.
    //
    // ⚠️ LA CLAVE `canario` VIAJA SIEMPRE, con su motivo cuando no se midió. Un
    // censo que no la llevara no se distinguiría de uno que la midió y no
    // encontró nada — que es la regla del cero, y por eso `canarioNoMedido`.
    //
    // ⚠️ ESTO ROMPE, Y SOLO CUANDO SE PIDE, LA PROMESA DE LA CABECERA de que el
    // censo no embebe nada: con `?canario=1` hay DOS llamadas al servicio de
    // embeddings, de tres textos cortos cada una. No consume créditos del cliente
    // —los créditos son nuestra contabilidad y esto no pasa por ella— pero sí
    // cuenta para el límite de tokens por minuto del proveedor, y se dice.
    const canarioPedido = req.nextUrl.searchParams.get('canario') === '1';

    // F-114 — ORDEN ESTABLE, Y NO ES COSMETICO: los tramos (?desde=&cuantos=) solo
    // son una particion si la lista no cambia entre dos llamadas. Sin `order`,
    // Postgres no garantiza el orden, y «0-10» mas «10-20» podrian solaparse y
    // dejar huecos sin que nadie lo notara.
    let consulta = supabase
      .from('documents')
      .select('id, name, analysis_status, active_generation')
      .eq('org_id', orgId)
      .order('id');
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

    // F-114 — el TRAMO. Se calcula con la lista ya leida, porque su tope depende
    // de cuantos documentos hay. Sin parametros, es la pasada entera de siempre.
    const tramo = tramoPedido(
      req.nextUrl.searchParams.get('desde'),
      req.nextUrl.searchParams.get('cuantos'),
      documentos.length,
    );
    const delTramo = documentos.slice(tramo.desde, tramo.desde + tramo.cuantos);

    const contadores = censoVacio();
    const filas: FilaDeVecindario[] = [];
    // F-114 — la pareja del minimo del CORPUS. Se acumula en streaming: guardar
    // las 680x680 observaciones para ordenarlas al final serian cientos de megas
    // de texto en memoria dentro de una funcion de Vercel.
    let parejaDelCorpus: ParejaDelMinimo | null = null;
    // F-111 — el agregado del corpus. Va aparte y no se deriva sumando las filas:
    // los percentiles de una union no son la union de los percentiles.
    const scoresDelCorpus: number[] = [];

    for (const doc of delTramo) {
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
          scoreMax: 0,
          detalle: [],
          porClase: reparteVacio(),
          // Sin vectores no hay fragmentos que distribuir: n=0 y los extremos
          // AUSENTES, que no es lo mismo que cero.
          distribucion: distribucionDeScores([]),
          // Sin vectores no hubo ni una observacion: AUSENTE, no una pareja vacia.
          parejaDelMinimo: null,
        });
        continue;
      }

      const presupuesto = MAX_CONSULTAS - contadores.consultas_realizadas;
      const aConsultar = ids.slice(0, Math.max(0, presupuesto));
      contadores.consultas_omitidas_por_tope += ids.length - aConsultar.length;

      const mejores = new Map<string, Vecino>();
      // F-111 — LOS SCORES EN CRUDO, NO EL MÁXIMO. `mejores` colapsa cada vecino
      // a su mejor fragmento, que es la pregunta de B.243; esto guarda TODOS los
      // scores contables porque el umbral de la recuperación compara fragmento a
      // fragmento (`retrieval.ts:498`) y ése es el operando que nadie había
      // medido. Cero consultas extra: los scores ya vienen en estas respuestas.
      const scoresDelDocumento: number[] = [];
      // F-114 — la pareja del mínimo DE ESTE DOCUMENTO, por el mismo pliegue.
      let parejaDelDocumento: ParejaDelMinimo | null = null;

      for (let i = 0; i < aConsultar.length; i += LOTE_DE_FETCH) {
        const trozo = aConsultar.slice(i, i + LOTE_DE_FETCH);
        const registros = await fetchVectors(orgId, trozo);
        const vectores = trozo
          .map(id => registros[id])
          .filter(r => r !== undefined && Array.isArray(r.values) && r.values.length > 0);

        // F-113 — EL FILTRO SÓLO EN LA BÚSQUEDA, NUNCA EN LOS VECTORES DE CONSULTA.
        // Los de consulta se obtienen por ID: `listVectorIdsByPrefix` por prefijo
        // (`lib/pinecone/vectors.ts:273-278`) y `fetchVectors` por id (`:230-237`),
        // y ninguno pasa filtro de metadata. Así que `?poblacion=real` NO puede
        // dejar a un documento sin con qué preguntar: lo que filtra es CONTRA QUÉ
        // se pregunta.
        //   · 'todos' — sin filtro: el censo de B.243, y el comportamiento por omisión.
        //   · 'real'  — la población que el análisis alcanza de verdad: el filtro
        //     IMPORTADO de vectors.ts más la exclusión del propio DENTRO de la
        //     consulta, que es lo que devuelve los huecos del topK a los ajenos.
        const filtroDeLaBusqueda = poblacion === 'real'
          ? { $and: [buildCorpusFilter(), { documentId: { $ne: documentId } }] }
          : undefined;

        const resultados = await runInBatches(
          vectores,
          v => queryVectors(orgId, {
            vector: v.values,
            topK: topK.valor,
            includeMetadata: true,
            ...(filtroDeLaBusqueda ? { filter: filtroDeLaBusqueda } : {}),
          // ⚠️ UNA CONSULTA QUE FALLA NO ES UN VECINDARIO VACÍO. Con un topK alto
          // el motivo más probable es el tope de 4MB por respuesta del servicio.
          // Se CUENTA y el censo se marca incompleto: devolver lista vacía sin
          // contarlo sería fabricar el cero que esta medición viene a comprobar.
          }).catch((err: unknown) => {
            contadores.consultas_fallidas += 1;
            const motivo = err instanceof Error ? err.message : String(err);
            console.warn(`[vecindario] CONSULTA FALLIDA | org=${orgId} | doc=${documentId} | topK=${topK.valor} | ${motivo}`);
            return [];
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
          const { contables, deGeneracionMuerta, sinFilaViva } = matchesContables(matches, documentId, activas);
          contadores.fragmentos_de_generacion_muerta += deGeneracionMuerta;
          contadores.fragmentos_sin_fila_viva += sinFilaViva;
          // F-114 — LA PAREJA DEL MÍNIMO. Los dos lados salen de datos que ya
          // están en la mano: el vector de consulta se bajó con `fetchVectors`
          // (lleva su id y su metadata) y el devuelto viene en el match. No
          // cuesta ni una consulta más, y es lo que convierte «el suelo es
          // 0,696» en un caso que se puede abrir y sembrar.
          const propio = vectores[idx];
          const ladoConsulta = {
            vectorId: propio.id,
            documentId,
            documentName,
            chunkIndex: typeof propio.metadata?.chunkIndex === 'number' ? propio.metadata.chunkIndex : null,
            texto: muestraDeTexto(propio.metadata?.text ?? ''),
          };
          for (const c of contables) {
            scoresDelDocumento.push(c.score);
            parejaDelDocumento = acumularParejaDelMinimo(parejaDelDocumento, {
              score: c.score,
              consulta: ladoConsulta,
              devuelto: {
                vectorId: c.vectorId,
                documentId: c.documentId,
                documentName: c.documentName,
                chunkIndex: c.chunkIndex,
                texto: muestraDeTexto(c.texto),
              },
            });
          }
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
        distribucion: distribucionDeScores(scoresDelDocumento),
        parejaDelMinimo: parejaDelDocumento,
      });
      for (const sc of scoresDelDocumento) scoresDelCorpus.push(sc);
      parejaDelCorpus = parejaMenorDeDos(parejaDelCorpus, parejaDelDocumento);
    }

    // ⚠️ SE ORDENA POR VECINOS Y LUEGO POR EL PARECIDO MÁXIMO. Hasta el
    // 23/09/2026 el primer criterio era `vecinos_045`, que contaba los vecinos por
    // encima de 0,45: esa columna se fue con el umbral. Sin corte, «cuántos
    // vecinos» ya no distingue casi nada —todos los documentos son vecinos de
    // todos— así que el desempate por `scoreMax` es el que de verdad ordena.
    filas.sort((a, b) => b.vecinos - a.vecinos || b.scoreMax - a.scoreMax);

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

    if (contadores.fragmentos_sin_fila_viva > 0) {
      // ⚠️ F-115 — EL CENSO ESTÁ MIDIENDO CONTAMINACIÓN. La matriz completa del
      // 21/09 contó +6 scores de un documento borrado en 3 de 41 documentos, y
      // nada lo dijo. Esta línea es lo que lo habría dicho.
      console.warn(`[vecindario] FRAGMENTOS SIN FILA VIVA en el índice | org=${orgId} | fragmentos=${contadores.fragmentos_sin_fila_viva}`);
    }
    if (contadores.fragmentos_de_generacion_muerta > 0) {
      console.warn(`[vecindario] GENERACIONES MUERTAS en el índice | org=${orgId} | fragmentos=${contadores.fragmentos_de_generacion_muerta}`);
    }
    if (contadores.consultas_fallidas > 0) {
      console.warn(`[vecindario] CENSO CON HUECOS | org=${orgId} | consultas_fallidas=${contadores.consultas_fallidas} de ${contadores.consultas_realizadas}`);
    }
    if (contadores.consultas_omitidas_por_tope > 0) {
      console.warn(`[vecindario] CENSO TRUNCADO | org=${orgId} | omitidas=${contadores.consultas_omitidas_por_tope} de tope ${MAX_CONSULTAS}`);
    }

    // ⚠️ AL FINAL Y NO AL PRINCIPIO: si el servicio de embeddings estuviera
    // caído, medir primero retrasaría 680 consultas que no lo necesitan. Y no
    // puede tumbar el censo — `medirElCanario` no lanza.
    const canario = canarioPedido
      ? await medirElCanario(generateEmbeddingsConSello)
      : canarioNoMedido('no se pidió: añade ?canario=1 para medirlo');
    if (canario.motivo === null) {
      const alta = canario.parejas.find(p => p.clave === 'alta');
      const baja = canario.parejas.find(p => p.clave === 'baja');
      console.log(
        `[vecindario] CANARIO | alta=${alta?.primera ?? 'null'} (ruido ${alta?.ruido ?? 'null'}) | ` +
        `baja=${baja?.primera ?? 'null'} (ruido ${baja?.ruido ?? 'null'}) | ` +
        `modelo servido=${canario.modelo.servido ?? 'no declarado'} dim=${canario.modelo.dimension_servida ?? 'null'}`,
      );
      if (elOrdenSeSostiene(canario) === false) {
        // ⚠️ Si esto suena, el instrumento está mal y sus cifras no se pueden
        // interpretar: dos formas de decir lo mismo tienen que parecerse MÁS que
        // dos temas sin relación.
        console.error(`[vecindario] CANARIO DEL REVÉS: la pareja baja se parece más que la alta | org=${orgId}`);
      }
      if (canario.dimension_inesperada) {
        console.error(`[vecindario] CANARIO con dimensión inesperada: ${canario.modelo.dimension_servida} | org=${orgId}`);
      }
    }

    return NextResponse.json({
      documentos: filas.length,
      // ⚠️ F-114 P3 — EL CANARIO. Textos fijos, embebidos al vuelo como
      // 'passage' y NUNCA indexados: su parecido sólo puede moverse si se movió
      // el MODELO, así que es lo que atribuye la causa cuando el termómetro da un
      // salto. Se mide dos veces seguidas y trae su `ruido`, que es el número del
      // que saldrá la tolerancia de alarma (C7).
      canario,
      topK: TOP_K_POR_CONSULTA,
      // F-113 — CON QUÉ SE MIDIÓ, en la respuesta y no sólo en la URL: un censo
      // que no dice su población ni su topK no se puede releer, y el mínimo
      // significa dos cosas distintas según el topK (el suelo real si supera al
      // fondo, o el puesto N si no lo supera).
      poblacion,
      topKUsado: topK.valor,
      /** true si el `?topK=` pedido superaba el tope del servicio y se recortó. */
      topKAcotadoPorElServicio: topK.acotado,
      /** true si el `?topK=` pedido no era un entero ≥ 1 y se ignoró. */
      topKIgnorado: topK.ignorado,
      topKMaximoDelServicio: TOPK_MAXIMO_DEL_SERVICIO,
      topeDeConsultas: MAX_CONSULTAS,
      // ⚠️ EL CENSO ESTÁ COMPLETO SI Y SOLO SI ESTO ES CERO. Va en la respuesta
      // y no sólo en el registro, porque quien lee la tabla es quien tiene que
      // saber si le falta un trozo.
      // F-113 — y también si alguna consulta FALLÓ. Una consulta que no volvió
      // deja un hueco en la distribución, y un censo con huecos no es completo
      // aunque no se haya truncado por tope.
      completo: contadores.consultas_omitidas_por_tope === 0 && contadores.consultas_fallidas === 0,
      contadores,
      // B.246 — de qué clase son los pares de trozos que producen las
      // vecindades. `resumen_x_resumen` alto significa que el parecido de este
      // corpus es de ENVOLTORIO: dos resúmenes de tabla comparten ~52
      // caracteres de frase hecha antes del primer dato propio.
      vecindadesTotales,
      porClaseTotal,
      // ⚠️ F-111 — EL RANGO DEL OPERANDO QUE EL UMBRAL JUZGA DE VERDAD, agregado
      // sobre TODOS los fragmentos del corpus. Y va aparte de `filas` porque no
      // se puede derivar de ellas: los percentiles de una unión no son la unión
      // de los percentiles. Es el número que faltaba — el suelo de ~0,79 del que
      // se habla es del MÁXIMO por documento (`scoreMax`), no de esto.
      distribucionDelCorpus: distribucionDeScores(scoresDelCorpus),
      // ⚠️ F-114 — QUE DOS FRAGMENTOS DAN EL MINIMO. Un suelo sin su pareja es una
      // cifra que no se puede examinar ni sembrar. `chunkIndex` viaja porque
      // `chunkType` NO esta en la metadata de Pinecone: se busca en
      // `document_chunks` con el documentId y ese indice.
      parejaDelMinimoDelCorpus: parejaDelCorpus,
      // ⚠️ EL TRAMO, declarado: sin esto no se sabe si la respuesta es la matriz
      // entera o un trozo, y dos trozos se combinarian mal en silencio.
      tramo: {
        desde: tramo.desde,
        cuantos: tramo.cuantos,
        aplicado: tramo.aplicado,
        ignorado: tramo.ignorado,
        documentos_en_la_organizacion: documentos.length,
        orden: 'id ascendente',
      },
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
    fragmentos_sin_fila_viva: 0,
    fragmentos_de_generacion_muerta: 0,
    documentos_sin_vectores: 0,
    consultas_omitidas_por_tope: 0,
    consultas_realizadas: 0,
    consultas_fallidas: 0,
  };
}
