import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds, buildVectorId } from '@/lib/pinecone/vectors';
import { deleteDocument } from '@/lib/delete-document';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkSegments, stripSegmentationMarkers, EXTRACTOR_VERSION, extractSegments, joinSegments, produceTablas } from '@/lib/chunking';
import { puedeUsarLaEstructura } from '@/lib/analysis/estructura-del-modal';
import { queHacerConLaEstructura } from '@/lib/documents/estructura-al-guardar';
import { tieneOriginalEnLaNube } from '@/lib/documents/origen-en-la-nube';
import { lecturaDelDocumento } from '@/lib/documents/lectura-dual';
import type { ExtractedSegment } from '@/lib/chunking';
import { saveDocumentChunks } from '@/lib/persist-chunks';
import { randomUUID } from 'crypto';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { checkUploadLock } from '@/lib/upload-lock';
import { getStagedForDocument } from '@/lib/document-staged';
import { huellaDeDescarte, registrarDescartes } from '@/lib/analysis/descartes';

export const maxDuration = 300;

/**
 * Indexes plain text directly (without going through Storage or file extraction).
 * Used by the improvement modal to save a corrected version.
 *
 * Body:
 *  - text: string - full corrected text
 *  - name: string - final document name shown in the sidebar
 *  - originalStoragePath?: string - if present, the original uploaded file will be removed from Storage
 *  - replaceExistingId?: string - if present, the existing document with that id will be deleted first
 *                                 (use this when the user chose "replace" in the prompt)
 *  - sizeBytes?: number
 *  - dismissedFindings?: Array<{ existingDocumentId, newDocSays, existingDocSays }>
 *      F-86 paso 3: los "No es error" marcados durante la revisión de un
 *      documento que aún no existía. Coordenadas, no huellas: la huella la
 *      calcula el servidor cuando ya tiene los dos ids.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    // Resolver organización
    const orgR = await resolverOrg(supabase, user.id);
    if (!orgR.resuelta) return respuestaDeOrgNoResuelta(orgR);
    const org = orgR.org;
    const orgId = org.orgId;

    // Candado (B.64): indexar desde "mejorar con IA" escribe en el corpus.
    // Si otro usuario tiene el candado, se rechaza con 423 visible.
    const lockCheck = await checkUploadLock(supabase, orgId, user.id);
    if (lockCheck.locked) {
      return NextResponse.json(
        { error: `El corpus está bloqueado por ${lockCheck.lockedByEmail || 'otro usuario'}. Espera a que termine.`, errorType: 'upload_locked' },
        { status: 423 }
      );
    }

    const body = await req.json();
    const { text, name, originalStoragePath, replaceExistingId, sizeBytes, dismissedFindings } = body;
    /**
     * ⚠️ EL NOMBRE ORIGINAL, Y NO `name` — B.201. El cliente compone
     * `"<nombre> (corregido dd/mm/aaaa)"`, así que en `name` la extensión ya
     * NO es la última y `produceTablas` devolvería `false` sobre él. Decidir
     * con `name` daría una guarda que no se dispara jamás.
     */
    const nombreOriginal: unknown = body.fileName;
    const aplanarConfirmado = body.aplanarConfirmado === true;

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente para indexar (mínimo 50 caracteres)' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nombre de documento requerido' }, { status: 400 });
    }

    const documentId = randomUUID();

    // d-2b (F-9): si el documento a reemplazar tiene una version nueva en vuelo
    // (document_staged), NO se puede re-indexar por esta via. Esta ruta borra la
    // fila documents del viejo, y como document_staged tiene ON DELETE CASCADE,
    // ese borrado destruiria la version staged (sin swap, sin aviso, sin rastro).
    // Ademas crearia una tercera identidad del documento (activa, staged y este
    // texto). La via correcta con version en vuelo es analizarla desde la bandeja
    // (analisis rapido), que al completar dispara el swap. Se veta ANTES de tocar
    // Pinecone o Supabase.
    if (typeof replaceExistingId === 'string') {
      const staged = await getStagedForDocument(supabase, replaceExistingId, orgId);
      if (staged) {
        return NextResponse.json(
          {
            error:
              'Este documento tiene una versión nueva pendiente de análisis. Analízala desde la bandeja de revisión antes de mejorarlo; una vez activada, podrás mejorar y reindexar con normalidad.',
            errorType: 'staged_pending',
          },
          { status: 409 },
        );
      }
    }

    /** A quién hay que retirar CUANDO EL NUEVO YA ESTÉ EN PIE. Se apunta aquí
     *  y se ejecuta al final: ése es todo el cambio de B.222 ventana 2. */
    let viejoParaRetirar: string | null = null;

    // Si el usuario eligió «reemplazar», aquí se VALIDA el viejo; se retira al final.
    if (replaceExistingId) {
      console.log(`[INDEX-TEXT] Replacing existing document id=${replaceExistingId}`);
      const { data: oldDoc } = await supabase
        .from('documents')
        .select('id, chunk_count, source, provider_file_id')
        .eq('id', replaceExistingId)
        .eq('org_id', orgId)
        .single();

      if (oldDoc) {
        // ⚠️ B.202 — VETO POR «¿HAY ORIGINAL QUE PUEDA PISARLO?», no por marca.
        // Un documento con original en la nube NO se re-indexa desde aquí: la
        // nube es su fuente de verdad. Re-indexarlo por esta vía lo convertiría
        // en 'manual' y le quitaría el `provider_file_id`, con lo que el
        // siguiente sync no lo reconocería y reimportaría el original SIN
        // CORREGIR — un duplicado huérfano. La corrección de un documento de la
        // nube vuelve POR la nube: se copia el texto corregido, se sube, y el
        // sync lo procesa como versión nueva.
        //
        // ⚠️ ANULA A PROPÓSITO LA RAZÓN DECLARADA DE F-15, que usaba una lista
        // explícita de proveedores «para que un proveedor futuro no quede vetado
        // sin revisión» — o sea, fallaba ABIERTA. El criterio vive ahora en
        // `tieneOriginalEnLaNube` y falla CERRADA: un proveedor nuevo trae su
        // identificador desde el primer documento y queda protegido el día uno.
        // Es lo mismo que ya se aprendió en la reparación: el origen no decide,
        // decide si algo puede pisarlo.
        //
        // Y ES LA MISMA LÍNEA QUE MIRA EL CLIENTE para no pintar el botón: dos
        // criterios para una pregunta es cómo el botón y el veto acaban
        // discrepando.
        if (tieneOriginalEnLaNube(oldDoc)) {
          return NextResponse.json(
            {
              error:
                'Este documento tiene su original en la nube, así que no puede guardarse desde aquí: la próxima sincronización lo sobrescribiría con la versión sin corregir. Copia el texto corregido y súbelo a tu nube; se procesará en la siguiente sincronización.',
              errorType: 'drive_origin',
            },
            { status: 409 },
          );
        }

        // ⚠️ AQUÍ YA NO SE BORRA NADA — 14/09/2026, B.222 ventana 2.
        //
        // ═══════════════════════════════════════════════════════════════
        // SE CONSTRUYE ANTES DE DESTRUIR. Hasta hoy el viejo se borraba AQUÍ,
        // ~140 líneas antes de generar los embeddings y subir los vectores. Si
        // algo fallaba en medio —la API de embeddings, la red, el límite de
        // Pinecone— EL VIEJO YA NO ESTABA Y EL NUEVO NO LLEGABA: el usuario se
        // quedaba sin ninguna de las dos versiones, y no hay vuelta atrás.
        //
        // La casa ya tenía este patrón escrito, con estas palabras, en otro
        // sitio: `app/api/drive/sync/route.ts:313` dice «Construir antes de
        // destruir: subir los vectores nuevos primero». El reemplazo del modal
        // hacía lo contrario y nadie cruzó las dos mitades. Ahora están juntas.
        //
        // ⚠️ Y LO QUE ESTO ARREGLA DE PROPINA, QUE NO ES PROPINA: la «Fuente 2»
        // de recuperación de estructura (más abajo) lee los segmentos del
        // documento que se reemplaza. Con el borrado aquí, LEÍA UNA FILA QUE
        // ACABABA DE BORRAR — código muerto desde que se escribió. Resultado:
        // reemplazar una hoja de cálculo desde la bandeja SIEMPRE perdía la
        // estructura y SIEMPRE preguntaba si aplanar, incluso con el texto
        // intacto y la estructura ahí. Mover el borrado la resucita.
        //
        // EL FALLO NUEVO, declarado: si el borrado falla DESPUÉS de indexar el
        // nuevo, quedan DOS documentos con el mismo nombre. Visible en la
        // lista, detectable, y con la versión nueva ya a salvo — que es
        // exactamente el residuo que se prefiere.
        //
        // ⚠️ NO HAY COMPROBACIÓN DE COLISIÓN QUE ESTORBE, y B.222 decía que sí:
        // la comprobación vive en el `else` de «no estoy reemplazando», así que
        // en este camino no corre. Se dijo sin mirar y aquí queda corregido.
        // ═══════════════════════════════════════════════════════════════
        viejoParaRetirar = replaceExistingId;
      }
    } else {
      // If NOT replacing, still check for name collision and bump the name if necessary.
      // This matches the current ingest behavior of replace-by-name, but here we only
      // want to avoid collisions since the user explicitly said "keep both".
      const { data: nameCollisions } = await supabase
        .from('documents')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', name);

      if (nameCollisions && nameCollisions.length > 0) {
        // ⚠️ B.219 — EL SERVIDOR DICE QUÉ HA PASADO, NO QUÉ HACER (14/09/2026).
        //
        // Este mensaje decía «Intenta de nuevo con otro nombre o usa la opción
        // "Reemplazar"». Las dos salidas eran INALCANZABLES desde la pantalla
        // que lo recibía: no hay campo de nombre en el modal de Mejora, y el
        // diálogo de reemplazo no salía para este caso (B.218). Un endpoint
        // puede decir con autoridad qué ha pasado; en cuanto propone qué hacer
        // está describiendo una interfaz que no ve, y como era el día que
        // alguien escribió la cadena.
        //
        // Ahora va el HECHO y un `errorType` legible por máquina. Quién tiene
        // botón que ofrecer lo sabe el cliente, y es quien compone la salida.
        //
        // ⚠️ Y EL COMENTARIO QUE HABÍA AQUÍ ERA FALSO POR PARTIDA DOBLE: decía
        // «shouldn't normally happen» del caso que resultó ser EL NORMAL —el
        // segundo guardado del mismo día— y prometía «we append a numeric
        // counter», que no existe en ninguna línea. Se retira.
        return NextResponse.json(
          {
            error: `Ya existe un documento con el nombre "${name}".`,
            errorType: 'name_collision',
            nombre: name,
          },
          { status: 409 }
        );
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // B.201 — LA ESTRUCTURA AL GUARDAR. Hasta el 09/09 esto era, siempre y sin
    // condición, `[{ type: 'text', text }]`: guardar una hoja corregida la
    // devolvía al corpus COMO PROSA, marcada al día y analizada, y nada volvía
    // a ofrecer repararla. Nunca llegó a pasar —los 40 documentos salieron
    // limpios— pero el botón de guardar no miraba el tipo de fichero.
    // ══════════════════════════════════════════════════════════════════
    let estructuraOriginal: ExtractedSegment[] | null = null;

    // Fuente 1 — EL FICHERO, cuando la subida aún tiene su temporal (camino del
    // chat). Es la misma recuperación que B.175 hace en `analyze-v2`.
    if (typeof originalStoragePath === 'string' && originalStoragePath.length > 0 && typeof nombreOriginal === 'string') {
      try {
        const { data: fileData } = await supabase.storage.from('documents').download(originalStoragePath);
        if (fileData) {
          estructuraOriginal = await extractSegments(Buffer.from(await fileData.arrayBuffer()), nombreOriginal);
        }
      } catch (err) {
        console.warn('[INDEX-TEXT] no se pudo leer el original para conservar la estructura:', err);
      }
    }

    // Fuente 2 — LOS SEGMENTOS GUARDADOS del documento que se reemplaza (camino
    // de la bandeja: ahí no hay fichero, `ingest` lo borró al indexar).
    if (!estructuraOriginal && typeof replaceExistingId === 'string') {
      const { data: previo } = await supabase
        .from('documents')
        .select('segments, full_text')
        .eq('id', replaceExistingId)
        .eq('org_id', orgId)
        .maybeSingle();
      if (previo) {
        const lectura = lecturaDelDocumento(previo);
        if (lectura.origen === 'segmentos') estructuraOriginal = lectura.segmentos;
      }
    }

    const decision = queHacerConLaEstructura({
      produceTablas: produceTablas(typeof nombreOriginal === 'string' ? nombreOriginal : null),
      hayEstructuraRecuperable: estructuraOriginal !== null,
      textoIntacto: estructuraOriginal !== null && puedeUsarLaEstructura(text, joinSegments(estructuraOriginal)),
      aplanarConfirmado,
    });

    // ⚠️ NO SE APLANA POR CUENTA PROPIA. Si el texto se editó, el servidor no
    // puede saber si los cambios respetan la estructura: decide el usuario, y
    // para eso tiene que saber QUÉ pierde. El cliente reenvía con
    // `aplanarConfirmado`.
    if (decision === 'preguntar') {
      return NextResponse.json({
        error: 'Guardar este documento como texto le quitará las filas y columnas.',
        motivo: 'aplanaria_una_tabla',
      }, { status: 409 });
    }

    console.log(`[INDEX-TEXT] estructura | "${name}" | decision=${decision} | recuperada=${estructuraOriginal !== null}`);

    const segments: ExtractedSegment[] = decision === 'conservar' && estructuraOriginal
      ? estructuraOriginal
      : [{ type: 'text', text }];
    const chunks = chunkSegments(segments, documentId, name, orgId);
    console.log(`[INDEX-TEXT] ${name}: ${chunks.length} chunks from ${text.length} chars`);

    // Embed
    const embeddings = await generateEmbeddings(chunks.map(c => c.text));

    // Upsert vectors
    const vectors = chunks.map((chunk, i) => ({
      id: buildVectorId(documentId, 1, i),
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        orgId: chunk.metadata.orgId,
        analysisStatus: 'analizado',
        generation: 1,
      },
    }));

    await upsertVectors(orgId, vectors);

    // content_hash = "que texto ES este documento" (identidad, para detectar
    // duplicados exactos en hash-check y para el portero por hash de Fase C).
    // NO confundir con analyzed_content_hash = "que texto SE ANALIZO por ultima
    // vez" (verificacion). Son campos primos, nunca el mismo: fusionarlos haria
    // que un documento se declare analizado por el mero hecho de indexarse.
    const contentHash = generateContentHash(stripSegmentationMarkers(text));

    // Save to Supabase
    //
    // ⚠️ ESTE `insert` NO COMPROBABA SU ERROR, y hasta hoy eso era una fea
    // pero no un peligro: el viejo ya estaba borrado, así que un insert fallido
    // dejaba al usuario sin nada hiciéramos lo que hiciéramos. Al construir
    // antes de destruir SE VUELVE CRÍTICO: si el insert falla en silencio y
    // luego retiramos el viejo, nos quedamos con CERO documentos, que es peor
    // que lo de ayer. La comprobación no es un extra de este cambio: es parte
    // de él.
    const { error: insertError } = await supabase.from('documents').insert({
      id: documentId,
      name,
      size_bytes: sizeBytes || Buffer.byteLength(text, 'utf-8'),
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
      // Esta ruta la usa el modal de mejora: el texto ya fue revisado y corregido
      // por el usuario, así que nace analizado (no va a la bandeja de revisión).
      analysis_status: 'analizado',
      content_hash: contentHash,
      full_text: stripSegmentationMarkers(text),
      // F-105 paso 0 — ESCRITURA DUAL. Los segmentos se guardan ADEMÁS del
      // texto plano: sin ellos la reparación es solo-prosa, porque de
      // `full_text` no salen celdas. El texto plano NO se retira todavía —
      // los documentos ya indexados no tienen segmentos y la lectura acepta
      // las dos formas durante la ventana (`lib/documents/lectura-dual.ts`).
      segments,
      extractor_version: EXTRACTOR_VERSION,
    });

    if (insertError) {
      // El nuevo no llegó. NO se retira el viejo: el usuario conserva lo que
      // tenía, que es justamente lo que ayer no podía pasar.
      console.error(`[INDEX-TEXT] insert de documents fallo | doc=${documentId} | ${insertError.message}`);
      return NextResponse.json(
        { error: 'No se pudo guardar el documento. Inténtalo de nuevo.' },
        { status: 500 },
      );
    }

    // ── AHORA SÍ: SE RETIRA EL VIEJO ─────────────────────────────────
    //
    // El nuevo tiene fila y vectores, así que ya es un documento completo. A
    // partir de aquí, cualquier fallo deja DOS documentos vivos con el mismo
    // nombre — visible en la lista y reparable a mano— en vez de ninguno.
    //
    // ⚠️ Y SI FALLA, NO SE DEVUELVE 500. Devolver error diría que no se guardó
    // nada, y se guardó: el usuario iría a buscar su versión nueva y la
    // encontraría, con lo que el mensaje sería lo único falso de la operación.
    // Se devuelve éxito CON AVISO, que es lo que de verdad pasó.
    let avisoDeRetirada: string | null = null;
    if (viejoParaRetirar) {
      const delResult = await deleteDocument(supabase, {
        orgId,
        documentId: viejoParaRetirar,
        reason: 'user_excluded',
        excludedBy: user.id,
        actorUserId: user.id,
      });
      if (!delResult.ok) {
        console.error(`[INDEX-TEXT] no se pudo retirar el anterior | viejo=${viejoParaRetirar} | nuevo=${documentId} | ${delResult.error ?? 'sin detalle'}`);
        avisoDeRetirada =
          'Se guardó la versión corregida, pero no se pudo retirar la anterior: ' +
          'verás las dos en tu corpus. Borra la antigua desde la lista de documentos.';
      }
    }

    // ── LA ENTRADA POR INDEXACIÓN (F-86 paso 3, F-87 P2) ──────────────
    //
    // AQUÍ Y NO ANTES: es la primera línea del sistema en la que el documento
    // en revisión TIENE id. Hasta este punto su identidad estaba «pendiente de
    // nacer» (F-87 P2), y por eso sus descartes viajaron como COORDENADAS —las
    // dos citas y el id del documento del corpus—, que el cliente sí tiene sin
    // necesitar ningún id propio. Con los dos ids en la mano, el servidor
    // calcula las huellas y las persiste.
    //
    // DESPUÉS del insert de documents y ANTES de los chunks, por el mismo
    // criterio que la línea de abajo: la fila del documento ya existe, así que
    // un fallo aquí no puede tumbar una indexación que ya funcionó. Se loguea.
    if (Array.isArray(dismissedFindings) && dismissedFindings.length > 0) {
      const huellas: string[] = [];
      for (const d of dismissedFindings) {
        if (!d || typeof d !== 'object') continue;
        const { origen, existingDocumentId, newDocSays, existingDocSays } = d as Record<string, unknown>;
        // ⚠️ NADA TABULAR POR AQUÍ (F-94, ficha B). Esta entrada solo sabe
        // construir huellas de PROSA a partir de citas, y una fila de tabla
        // trae en `newDocSays` el texto de la fila: dejarla pasar le fabricaría
        // una identidad de prosa sobre valores de celda, que es la identidad
        // accidental que la ficha B vino a matar.
        // HOY NO LLEGA NINGUNA —el camino pre-indexado no lleva huella, así que
        // `mostrarAccionesDeFila` no pinta su botón—, y esta línea existe para
        // que siga sin llegar el día que aquello cambie. Un hallazgo tabular de
        // este camino NO TIENE MEMORIA, y es lo correcto: le falta identidad,
        // no le sobra una prestada.
        if (origen === 'diff_tabular') continue;
        if (
          typeof existingDocumentId !== 'string' ||
          typeof newDocSays !== 'string' ||
          typeof existingDocSays !== 'string'
        ) continue;
        const huella = huellaDeDescarte({
          documentoEnRevision: documentId,
          coordenadas: { existingDocumentId, newDocSays, existingDocSays },
        });
        if (huella) huellas.push(huella);
      }
      const res = await registrarDescartes(supabase, {
        orgId, userId: user.id, huellas, especie: 'prosa',
      });
      console.log(
        `[INDEX-TEXT] descartes | recibidos=${dismissedFindings.length} | ` +
        `identificados=${huellas.length} | persistidos=${res.ok ? res.insertadas : 'FALLO'}`
      );
    }

    // Chunks tipados (F-20 Paso 2), al final: la fila de documents ya existe
    // y un fallo aquí no debe tumbar una indexación que ya funcionó.
    await saveDocumentChunks(supabase, { orgId, documentId, generation: 1, chunks });

    // Clean up the original uploaded file from Storage if provided
    if (originalStoragePath) {
      try {
        await supabase.storage.from('documents').remove([originalStoragePath]);
      } catch (err) {
        console.error('[INDEX-TEXT] Failed to remove original storage file:', err);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        name,
        chunks: chunks.length,
      },
      // Presente SOLO si el anterior no se pudo retirar. El cliente lo enseña:
      // un aviso que nadie pinta es lo mismo que no haberlo detectado.
      ...(avisoDeRetirada ? { aviso: avisoDeRetirada } : {}),
    });
  } catch (error: unknown) {
    console.error('Error in /api/index-text:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
