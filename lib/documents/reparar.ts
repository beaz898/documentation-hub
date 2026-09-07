import type { SupabaseClient } from '@supabase/supabase-js';
import { EXTRACTOR_VERSION, chunkSegments, stripSegmentationMarkers } from '@/lib/chunking';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { generateEmbeddings } from '@/lib/embeddings';
import { upsertVectors, buildVectorId } from '@/lib/pinecone/vectors';
import { saveDocumentChunks } from '@/lib/persist-chunks';
import { getDocumentChunks, getActiveGeneration } from '@/lib/read-chunks';
import { getStagedForDocument } from '@/lib/document-staged';
import { swapDocumentVectors } from '@/lib/document-swap';
import { planDeReindexado, esReparacionCompleta } from './plan-de-reindexado';
import type { MotivoDeRechazo } from './plan-de-reindexado';
import { lecturaDelDocumento, textoDelDocumento, tieneSegmentosPersistidos } from './lectura-dual';

/**
 * REPARAR UN DOCUMENTO — el trabajo, separado de la ruta que lo pide (07/09/2026).
 *
 * ⚠️ POR QUÉ SE EXTRAJO. Hasta hoy esto vivía dentro del `POST` de
 * `/api/admin/reindexar`, y ahí era **irrepetible por definición**: una petición,
 * un documento. El lote necesita llamarlo N veces, y las dos alternativas a
 * sacarlo eran peores — que el servidor se llame a sí mismo por HTTP (reenvío de
 * sesión, arranques en frío, y cada llamada anidada con SUS 300 s dentro de los
 * 300 s de fuera), o copiar el cuerpo, que es la segunda implementación del
 * mismo criterio que esta casa prohíbe.
 *
 * ⚠️ EL FALLO VA EN EL TIPO DE RETORNO, no en una excepción, y no es estilo: si
 * la firma no puede decir «rechazado» o «falló», el vecino acaba
 * representándolo. Aquí hay cuatro finales distintos —reparado, rechazado, no
 * implementado, roto— y el lote necesita distinguirlos para saber cuál gasta
 * plaza y cuál no. Un `throw` los aplastaría todos contra el mismo `catch`.
 *
 * ⚠️ LO QUE NO CAMBIA AL EXTRAERSE, y es lo que hay que vigilar: la ruta de un
 * solo documento tiene que seguir respondiendo EXACTAMENTE igual —mismos
 * códigos, mismos campos, mismo aviso—. El bucle de consola de
 * `Prueba_De_La_Reparacion.md` §4 depende de esa forma.
 */

export type MotivoDeFallo =
  | 'fallo_lectura'
  | 'fallo_marcador'
  | 'fallo_conmutacion'
  | 'fallo';

export type ResultadoDeReparacion =
  | {
      ok: true;
      via: 'retrocear';
      generacion: { antes: number; ahora: number };
      trozos: { antes: number; ahora: number };
      reparacionCompleta: boolean;
      ms: number;
    }
  | { ok: false; clase: 'no_encontrado' }
  | { ok: false; clase: 'rechazado'; motivo: MotivoDeRechazo }
  | { ok: false; clase: 'no_implementado'; via: 'reprocesar' }
  | { ok: false; clase: 'fallo'; motivo: MotivoDeFallo; detalle?: string; ms: number };

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type Cliente = SupabaseClient<any, 'public', any>;

export async function repararDocumento(
  supabase: Cliente,
  { orgId, documentId }: { orgId: string; documentId: string },
): Promise<ResultadoDeReparacion> {
  // ⚠️ EL RELOJ ES POR DOCUMENTO, no por petición: en un lote, la cifra que hace
  // falta es cuánto cuesta UNO. Nadie la tiene todavía — no se ha completado
  // ninguna reparación en producción— y sale gratis, restando aquí.
  const arrancado = Date.now();

  // ⚠️ UNA SOLA RED, Y EMPIEZA ANTES DE LA PRIMERA LECTURA. Hasta el 07/09 el
  // `try` se abría después del plan, así que un fallo de red en las lecturas de
  // arriba salía como EXCEPCIÓN. Con una petición por documento eso daba un 500 y
  // se acabó; en un lote de ocho, **habría tumbado los siete siguientes** — que
  // es justo lo que el lote no puede hacer. Un documento malo no bloquea a los
  // demás porque aquí no sale ninguna excepción, no porque el bucle la atrape.
  try {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, name, org_id, source, provider_file_id, extractor_version, active_generation, analysis_status, full_text, segments, size_bytes')
      .eq('id', documentId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (docError) {
      console.error('[reindexar] error leyendo el documento:', docError.message);
      return { ok: false, clase: 'fallo', motivo: 'fallo_lectura', detalle: docError.message, ms: Date.now() - arrancado };
    }
    if (!doc) return { ok: false, clase: 'no_encontrado' };

    const generacionActiva = await getActiveGeneration(supabase, { orgId, documentId });
    const chunksActuales = await getDocumentChunks(supabase, {
      orgId, documentId, generation: generacionActiva,
    });
    const staged = await getStagedForDocument(supabase, documentId, orgId);

    const plan = planDeReindexado(
      {
        fila: {
          extractorVersion: doc.extractor_version,
          source: doc.source,
          providerFileId: doc.provider_file_id,
        },
        nombre: doc.name,
        tieneChunksTabulares: chunksActuales.some(c => c.chunkType !== 'text'),
        tieneSegmentos: tieneSegmentosPersistidos(doc),
        hayStagedVivo: staged !== null,
        fullText: doc.full_text,
      },
      EXTRACTOR_VERSION,
    );

    if (plan.via === 'rechazado') {
      console.log(`[reindexar] rechazado.${plan.motivo} | doc=${documentId} | "${doc.name}"`);
      return { ok: false, clase: 'rechazado', motivo: plan.motivo };
    }

    if (plan.via === 'reprocesar') {
      console.log(`[reindexar] reprocesar_no_implementado | doc=${documentId} | "${doc.name}"`);
      return { ok: false, clase: 'no_implementado', via: 'reprocesar' };
    }

    // ── retrocear ────────────────────────────────────────────────────────────
    const generacionNueva = generacionActiva + 1;

    // ⚠️ SE LEE CON EL LECTOR DUAL, NO SE FABRICA PROSA. Hasta el 07/09 aquí se
    // construía `[{type:'text', text: full_text}]` a mano, y eso hacía la
    // reparación SOLO-PROSA por definición: daba igual lo que el documento
    // fuera, salía texto.
    //
    // Con `lecturaDelDocumento`, un documento que ya tiene sus segmentos se
    // re-trocea desde SU ESTRUCTURA REAL —celdas incluidas—, y uno que no los
    // tiene se sigue reconstruyendo desde el texto, exactamente como antes.
    //
    // Y ES LO QUE HACE LA REPARACIÓN «ENRIQUECEDORA» (F-105 P2): lo que se lea
    // aquí se vuelve a escribir abajo, así que un documento sin segmentos sale
    // de esta pasada CON ellos, y desde entonces es reparable desde casa.
    const { segmentos: segments } = lecturaDelDocumento(doc);
    const texto = textoDelDocumento(doc);
    const chunks = chunkSegments(segments, documentId, doc.name, orgId);

    const embeddings = await generateEmbeddings(chunks.map(c => c.text));

    // La generación NUEVA. La activa sigue siendo la vieja y sigue sirviendo.
    await upsertVectors(orgId, chunks.map((chunk, i) => ({
      id: buildVectorId(documentId, generacionNueva, i),
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        orgId: chunk.metadata.orgId,
        // ⚠️ SE CONSERVA EL ESTADO, no se pone 'analizado': reindexar no opina
        // sobre el contenido, y promover un documento a analizado por haberlo
        // troceado otra vez sería exactamente el fallo que esta casa separó en
        // `content_hash` vs `analyzed_content_hash`.
        analysisStatus: doc.analysis_status,
        generation: generacionNueva,
      },
    })));

    await saveDocumentChunks(supabase, {
      orgId, documentId, generation: generacionNueva, chunks,
    });

    // El marcador. A partir de aquí el swap es re-invocable: si algo muere, se
    // vuelve a llamar y termina.
    const { error: stagedError } = await supabase.from('document_staged').insert({
      document_id: documentId,
      org_id: orgId,
      generation: generacionNueva,
      full_text: stripSegmentationMarkers(texto),
      content_hash: generateContentHash(stripSegmentationMarkers(texto)),
      // ⚠️ LO QUE CONVIERTE ESTA REPARACIÓN EN UNA MIGRACIÓN: los segmentos que
      // se han usado para trocear se guardan. Un documento que entró sin ellos
      // sale con ellos, y la siguiente reparación ya lee su estructura.
      segments,
      chunk_count: chunks.length,
      size_bytes: doc.size_bytes ?? 0,
    });
    if (stagedError) {
      // Sin marcador no se puede conmutar de forma reparable. Se aborta ANTES de
      // tocar nada de lo que sirve: queda una generación nueva huérfana, que es
      // basura invisible y no un documento roto.
      console.error(`[reindexar] no se pudo escribir el marcador | doc=${documentId} | ${stagedError.message}`);
      return { ok: false, clase: 'fallo', motivo: 'fallo_marcador', ms: Date.now() - arrancado };
    }

    const swap = await swapDocumentVectors(supabase, orgId, documentId, 'mismo_contenido_retroceado');
    if (!swap.ok || !swap.swapped) {
      console.error(`[reindexar] fallo_conmutacion | doc=${documentId} | ${swap.error ?? 'sin detalle'}`);
      return {
        ok: false, clase: 'fallo', motivo: 'fallo_conmutacion',
        detalle: 'La versión vieja sigue sirviendo. Se puede reintentar.',
        ms: Date.now() - arrancado,
      };
    }

    const ms = Date.now() - arrancado;
    console.log(
      `[reindexar] OK | doc=${documentId} | "${doc.name}" | gen ${generacionActiva}→${generacionNueva} | ` +
      `${chunksActuales.length}→${chunks.length} trozos | completa=${esReparacionCompleta(plan)} | ` +
      `${ms} ms | ${chunks.length} embeddings`,
    );

    return {
      ok: true,
      via: 'retrocear',
      generacion: { antes: generacionActiva, ahora: generacionNueva },
      trozos: { antes: chunksActuales.length, ahora: chunks.length },
      reparacionCompleta: esReparacionCompleta(plan),
      ms,
    };
  } catch (err) {
    const detalle = err instanceof Error ? err.message : 'desconocido';
    console.error(`[reindexar] fallo | doc=${documentId} | ${detalle}`);
    return { ok: false, clase: 'fallo', motivo: 'fallo', detalle, ms: Date.now() - arrancado };
  }
}
