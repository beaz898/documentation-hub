import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildAllVectorIds,
  deleteVectorsByFilter,
  deleteVectorsByIds,
  listVectorIdsByPrefix,
} from '@/lib/pinecone/vectors';
import { deleteDocumentChunksBelowGeneration } from '@/lib/persist-chunks';
import type { DocumentoExistente, PlanDeReemplazo } from '@/lib/documents/plan-de-reemplazo';
import { vectoresARetirar, versionAnterior } from '@/lib/documents/plan-de-reemplazo';

/**
 * LO QUE SE RETIRA DESPUÉS DE QUE LA VERSIÓN NUEVA YA SE SIRVA (frente 3, paso 1).
 *
 * ⚠️ NADA DE AQUÍ ABORTA LA PETICIÓN, y no es descuido: esta función se llama
 * cuando la fila de `documents` YA sirve la generación nueva, así que a partir de
 * aquí un fallo deja BASURA y nunca deja al usuario sin documento. Ése es el
 * sesgo de fallo que el reemplazo por generaciones vino a instalar, y por eso
 * todo lo de dentro registra y sigue en vez de cortar.
 *
 * Vive aparte de `app/api/ingest/route.ts` porque la ruta se pasaba de 400
 * líneas al traerse el orden nuevo, no porque tenga otro llamador: hoy tiene uno.
 */
export async function retirarLoViejo(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    /** El id REUTILIZADO: el mismo del documento que se acaba de versionar. */
    documentId: string;
    /** La generación recién subida. Lo que se retira es todo lo ANTERIOR a ella. */
    generation: number;
    plan: PlanDeReemplazo;
    colisiones: DocumentoExistente[];
  },
): Promise<void> {
  const { orgId, documentId, generation, plan, colisiones } = params;

  const anterior = versionAnterior(plan, colisiones);
  if (anterior) {
    // Los vectores de las generaciones < N, por DOS VÍAS (B.73) y en este orden:
    // primero LO QUE HAY —listar por prefijo y clasificar por el id, que es donde
    // vive la generación—, y si la lista no contesta, LO QUE LA FILA DECÍA. La
    // lista cubre más: alcanza generaciones que `chunk_count` no contaba y restos
    // de un reemplazo anterior que muriera a mitad.
    let viejos: string[];
    try {
      const todos = await listVectorIdsByPrefix(orgId, documentId);
      // Cuáles de ésos son viejos NO se decide aquí: lo decide
      // `vectoresARetirar`, que es donde está escrito por qué la comparación es
      // estrictamente menor y donde se puede poner a prueba.
      viejos = vectoresARetirar(todos, generation);
    } catch (err) {
      console.warn(`[INGEST] no se pudieron listar los vectores del documento; se cae a los IDs derivados de la fila vieja | doc=${documentId} |`, err);
      viejos = buildAllVectorIds(anterior.documentId, anterior.chunkCount, anterior.generacion);
    }

    if (viejos.length > 0) {
      try {
        await deleteVectorsByIds(orgId, viejos);
      } catch (err) {
        // Quedan vectores de una generación que la fila ya no sirve. El chat
        // puede recuperarlos y mezclarlos con los nuevos — molesto, y NO es el
        // fantasma de B.152: LA FILA EXISTE, así que el documento se ve, se puede
        // borrar, y borrarlo se los lleva por delante (filtro por documentId,
        // todas las generaciones).
        console.warn(`[INGEST] vectores viejos sin retirar | doc=${documentId} | gen<${generation} | n=${viejos.length} |`, err);
      }
    }

    // Los chunks tipados de las generaciones viejas. Como en el swap: la fila de
    // `documents` NO se borra, así que la cascada de la FK no cubre este caso.
    // No fatal — `document_chunks` todavía no lo lee nadie (F-20 P2).
    await deleteDocumentChunksBelowGeneration(supabase, { orgId, documentId, belowGeneration: generation });
  }

  // LOS HOMÓNIMOS QUE NO SE VERSIONAN. Se borran ENTEROS, fila incluida, que es
  // lo que este camino hacía con TODOS los homónimos; lo único que cambia es
  // CUÁNDO — aquí, fuera de la ventana peligrosa.
  if (plan.tipo !== 'reemplazo') return;

  for (const sobrante of plan.sobrantes) {
    let filterOk = false;
    let idsOk = false;
    try {
      await deleteVectorsByFilter(orgId, { documentId: { $eq: sobrante.documentId } });
      filterOk = true;
    } catch (err) {
      console.warn(`[INGEST] fallo borrado por filtro | homónimo=${sobrante.documentId} |`, err);
    }
    const ids = buildAllVectorIds(sobrante.documentId, sobrante.chunkCount, sobrante.generacion);
    if (ids.length > 0) {
      try {
        await deleteVectorsByIds(orgId, ids);
        idsOk = true;
      } catch (err) {
        console.warn(`[INGEST] fallo borrado por IDs | homónimo=${sobrante.documentId} | gen=${sobrante.generacion} |`, err);
      }
    }
    if (filterOk || idsOk) {
      await supabase.from('documents').delete().eq('id', sobrante.documentId).eq('org_id', orgId);
    } else {
      // La fila SOBREVIVE a propósito: sin ella no queda referencia para localizar
      // sus vectores, y eso es exactamente el fantasma de B.152. Un homónimo de
      // más es visible y el usuario puede borrarlo; un fantasma no. Se elige lo
      // visible.
      console.error(`[INGEST] homónimo NO borrado: sus vectores siguen en el índice | homónimo=${sobrante.documentId}`);
    }
  }
}
