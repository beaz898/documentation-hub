import type { SupabaseClient } from '@supabase/supabase-js';
import {
  listVectorIdsByPrefix,
  parseVectorId,
  updateVectorMetadata,
  deleteVectorsByIds,
} from '@/lib/pinecone/vectors';
import { EXTRACTOR_VERSION } from '@/lib/chunking';
import { deleteDocumentChunksBelowGeneration } from '@/lib/persist-chunks';
import { camposDePromocion } from '@/lib/documents/promocion';
import type { MotivoDeConmutacion } from '@/lib/documents/promocion';

/**
 * Promueve la generación "staged" (ya validada) de un documento a ACTIVA, de forma
 * idempotente y re-ejecutable (C.4c, diseño F-3). Orquesta Pinecone + Supabase, por
 * eso vive aparte de la capa pura de Pinecone (mismo criterio que delete-document.ts).
 *
 * MARCADOR DE SWAP EN CURSO: la fila de document_staged. Existe = swap incompleto (en
 * cualquier pata); no existe = swap completado o nada que promover. Su borrado es LO
 * ÚLTIMO (P4), para que un swap muerto a medias sea reparable re-invocando esta función
 * (lo hará el detector multi-generación de cleanup en C.4e).
 *
 * ORDEN de las 4 patas (sesgo de fallo: si muere a medias, sobra basura invisible,
 * nunca falta la versión servida ni el documento se apaga — D6):
 *   P1: flip metadata de la generación NUEVA a 'analizado' (Pinecone).
 *   P2: UPDATE atómico de la fila documents desde staged (Supabase), incl.
 *       active_generation=N. SIN borrar staged aquí.
 *   P3: borrar vectores de generaciones < N (Pinecone). No necesita staged.
 *   P4: borrar la fila document_staged (el marcador). Lo último.
 * Corte secuencial: si una pata falla, se ABORTA sin avanzar (las siguientes asumen
 * que las anteriores tuvieron éxito). El staged persiste → reparable.
 */
export interface SwapResult {
  ok: boolean;
  swapped: boolean;      // true si se completaron las 4 patas
  noop: boolean;         // true si no había staged (nada que promover)
  error?: string;
}

export async function swapDocumentVectors(
  supabase: SupabaseClient,
  orgId: string,
  documentId: string,
  motivo: MotivoDeConmutacion,
): Promise<SwapResult> {
  const result: SwapResult = { ok: false, swapped: false, noop: false };

  // 0. Leer el marcador (staged). Ausente → no-op verdadero (swap ya hecho o nada que promover).
  const { data: staged, error: stagedError } = await supabase
    .from('document_staged')
    .select('document_id, org_id, generation, full_text, content_hash, chunk_count, size_bytes, source_modified_at, segments')
    .eq('document_id', documentId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (stagedError) {
    result.error = `No se pudo leer document_staged: ${stagedError.message}`;
    return result;
  }
  if (!staged) {
    result.ok = true;
    result.noop = true;
    return result;
  }

  const newGeneration = staged.generation;

  // Listar TODOS los vectores del documento (todas las generaciones) una vez.
  let allIds: string[];
  try {
    allIds = await listVectorIdsByPrefix(orgId, documentId);
  } catch (err) {
    result.error = `No se pudieron listar los vectores del documento: ${String(err)}`;
    return result;
  }

  // Clasificar por generación (parseVectorId; null = anomalía, se ignora, no se toca).
  const newGenIds: string[] = [];
  const oldGenIds: string[] = [];
  for (const id of allIds) {
    const parsed = parseVectorId(id);
    if (parsed === null) {
      console.warn(`[swapDocumentVectors] ID anómalo ignorado: ${id} | doc=${documentId}`);
      continue;
    }
    if (parsed.generation === newGeneration) newGenIds.push(id);
    else if (parsed.generation < newGeneration) oldGenIds.push(id);
    // generation > newGeneration: no debería existir; se deja intacto por seguridad.
  }

  // ── P1: flip metadata de la generación NUEVA a 'analizado'. Corte si falla.
  try {
    for (const id of newGenIds) {
      await updateVectorMetadata(orgId, id, { analysisStatus: 'analizado' });
    }
  } catch (err) {
    result.error = `P1 (flip metadata gN) falló: ${String(err)}`;
    return result;
  }

  // ── P2: UPDATE atómico de la fila documents desde staged. Corte si falla.
  const { error: updateError } = await supabase
    .from('documents')
    // ⚠️ QUÉ SE ESCRIBE AQUÍ DEPENDE DEL MOTIVO, y vive en `promocion.ts`.
    //
    // Hasta el 06/09/2026 esta llamada escribía SIEMPRE `analysis_status:
    // 'analizado'`, `analyzed_content_hash` y el reseteo de `reviewed_at/by`.
    // Era correcto para los dos llamantes que había —análisis desde la bandeja
    // y marcado humano—, porque los dos significan «este contenido acaba de
    // validarse»: promover y devolver a revisión es justo lo que toca.
    //
    // El reindexado es el tercero y rompe la suposición: el contenido es EL
    // MISMO y solo cambia el troceado. Con lo de antes, reparar un documento
    // `pendiente` lo habría metido en el corpus SIN QUE NADIE LO REVISARA, y a
    // uno ya revisado le habría borrado la procedencia. Sin error y sin traza.
    //
    // Los cuatro campos condicionales son AFIRMACIONES SOBRE EL CONTENIDO, y un
    // retroceado no ha mirado el contenido: solo lo ha cortado.
    .update(camposDePromocion(staged, newGeneration, EXTRACTOR_VERSION, motivo))
    .eq('id', documentId)
    .eq('org_id', orgId);

  if (updateError) {
    result.error = `P2 (UPDATE documents desde staged) falló: ${updateError.message}`;
    return result;
  }

  // ── P3: borrar vectores de generaciones < N. Corte si falla.
  if (oldGenIds.length > 0) {
    try {
      await deleteVectorsByIds(orgId, oldGenIds);
    } catch (err) {
      result.error = `P3 (borrado de generaciones viejas) falló: ${String(err)}`;
      return result;
    }
  }

  // ── P3 (chunks): borrar document_chunks de generaciones < N. Es el único
  // de los seis caminos de borrado del corpus donde la fila de `documents`
  // NO se borra (solo se actualiza), así que la cascada de la FK no cubre
  // este caso — hace falta este borrado explícito. NO fatal: document_chunks
  // todavía no lo lee nadie (F-20 Paso 2), así que un fallo aquí se registra
  // y el swap sigue — nunca debe impedir que la generación nueva se active.
  await deleteDocumentChunksBelowGeneration(supabase, { orgId, documentId, belowGeneration: newGeneration });

  // ── P4: borrar el marcador (document_staged). Lo último.
  const { error: delStagedError } = await supabase
    .from('document_staged')
    .delete()
    .eq('document_id', documentId)
    .eq('org_id', orgId);

  if (delStagedError) {
    result.error = `P4 (borrado del marcador staged) falló: ${delStagedError.message}`;
    return result;
  }

  result.ok = true;
  result.swapped = true;
  return result;
}
