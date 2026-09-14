'use client';

import { useCallback, useState } from 'react';
import { uploadLockMessage } from '@/lib/upload-lock-message';
import { nombreDeLaCopiaCorregida } from '@/lib/documents/nombre-corregido';

export interface ExistingDocForIndexing {
  id: string;
  name: string;
}

/** F-86 paso 3: lo que el servidor necesita para construir la identidad de un
 *  descarte. Coordenadas, nunca la huella. */
export interface CoordenadasDeDescarte {
  existingDocumentId: string;
  newDocSays: string;
  existingDocSays: string;
}

interface UseIndexingParams {
  fileName: string;
  storagePath?: string;
  existingDocWithSameName?: ExistingDocForIndexing | null;
  onIndexed: (docName: string, wasReplaced: boolean) => void;
  /** F-86 paso 3: los «No es error» marcados durante la revisión de un
   *  documento que todavía no existía. Se resuelve al pulsar indexar, no antes:
   *  el usuario puede seguir marcando y desmarcando hasta ese momento. */
  dismissedFindings?: () => CoordenadasDeDescarte[];
}

export function useIndexing({
  fileName,
  storagePath,
  existingDocWithSameName,
  onIndexed,
  dismissedFindings,
}: UseIndexingParams) {
  const [indexing, setIndexing] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  /**
   * ⚠️ B.201 — lo que quedó pendiente de confirmar. Guarda el texto y el modo
   * porque el reintento tiene que mandar EXACTAMENTE lo mismo: si se releyera
   * el texto del editor al confirmar, el usuario estaría aceptando un aviso
   * sobre un contenido y guardando otro.
   */
  const [pendienteDeAplanar, setPendienteDeAplanar] =
    useState<{ texto: string; reemplazar: boolean } | null>(null);

  const doIndex = useCallback(
    async (currentText: string, replaceExisting: boolean, aplanarConfirmado = false) => {
      setShowReplaceDialog(false);
      setIndexing(true);
      try {
        // ⚠️ B.218 — EL NOMBRE SE PREGUNTA, NO SE COMPONE AQUÍ. Hasta el
        // 14/09/2026 esta función lo componía y `useDocuments` buscaba el
        // homónimo por su cuenta: dos cálculos que se creían el mismo, y el
        // diálogo de reemplazo acababa preguntando por un nombre distinto del
        // que iba a chocar.
        //
        // ⚠️ Y AL REEMPLAZAR SE USA EL NOMBRE DEL DOCUMENTO QUE SE REEMPLAZA, no
        // el del fichero. Antes eran lo mismo siempre —sólo se podía reemplazar
        // el original— y desde la decisión (c) ya no: reemplazar la copia
        // corregida con `fileName` la habría RENOMBRADO al original por el
        // camino.
        const finalName = replaceExisting
          ? (existingDocWithSameName?.name ?? fileName)
          : nombreDeLaCopiaCorregida(fileName, new Date());

        const res = await fetch('/api/index-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            text: currentText,
            name: finalName,
            ...(storagePath ? { originalStoragePath: storagePath } : {}),
            replaceExistingId: replaceExisting ? existingDocWithSameName?.id : undefined,
            sizeBytes: new Blob([currentText]).size,
            // ⚠️ B.201: el nombre ORIGINAL, aparte del final. El servidor
            // decide con éste si el documento producía tablas, porque en
            // `name` la extensión ya no es la última.
            fileName,
            ...(aplanarConfirmado ? { aplanarConfirmado: true } : {}),
            // F-86 paso 3, LA ENTRADA POR INDEXACIÓN: aquí es donde el
            // documento nace y su identidad con él, así que aquí es donde sus
            // descartes pueden dejar de ser estado de pantalla.
            ...(dismissedFindings ? { dismissedFindings: dismissedFindings() } : {}),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Error' }));

          // ⚠️ B.201 — EL SERVIDOR NO APLANA SOLO. Si guardar este texto le
          // quitaría las filas y columnas al documento, contesta 409 y aquí se
          // le pregunta al usuario. No es fricción: es la única vez que puede
          // saber qué deja de funcionar, y por eso NO se recuerda la respuesta
          // — cada documento es distinto.
          if (res.status === 409 && err.motivo === 'aplanaria_una_tabla') {
            setPendienteDeAplanar({ texto: currentText, reemplazar: replaceExisting });
            return;
          }

          // ⚠️ B.219 — LA SALIDA LA NOMBRA QUIEN TIENE LA PANTALLA. El servidor
          // manda el hecho («ya existe un documento con ese nombre») y el
          // `errorType`; el texto de QUÉ HACER se compone aquí, que es el único
          // sitio que sabe qué botones hay. Antes lo proponía el servidor y
          // ofrecía dos salidas que esta pantalla no tiene: no hay campo de
          // nombre, y el diálogo de reemplazo no salía para este caso.
          //
          // Las dos que sí existen desde aquí, y por ese orden: volver a pulsar
          // Guardar —que ahora SÍ ofrece reemplazar la copia corregida (B.218)—
          // o borrar la anterior desde el corpus.
          if (res.status === 409 && err.errorType === 'name_collision') {
            alert(
              `${err.error}\n\n` +
              'Las copias corregidas del mismo día comparten nombre, así que ya hay una de hoy.\n\n' +
              'Vuelve a pulsar Guardar y elige «Reemplazar» para sustituirla, ' +
              'o bórrala desde el corpus si quieres conservar las dos.'
            );
            return;
          }

          // ⚠️ B.202 — EL 409 POR ORIGEN EN LA NUBE YA NO ES UN alert SUELTO.
          // La interfaz no ofrece guardar para esos documentos (el botón se
          // sustituye por la explicación y el botón de copiar), así que llegar
          // aquí significa que el estado del cliente iba retrasado. Se dice lo
          // mismo que dice la pantalla, palabra por palabra: un aviso que manda
          // hacer algo tiene que coincidir con lo que la interfaz ofrece.
          const lockMsg = uploadLockMessage(res.status, err);
          alert(lockMsg ?? `Error al indexar: ${err.error || 'desconocido'}`);
          return;
        }

        const data = await res.json();

        // ⚠️ B.222 — EL ÉXITO CON AVISO EXISTE, Y HAY QUE PINTARLO. Desde que
        // el servidor construye antes de destruir, un reemplazo puede guardar
        // la versión nueva y NO conseguir retirar la anterior. Eso es un éxito
        // —el documento está a salvo— pero el usuario va a ver dos documentos
        // con el mismo nombre, y si nadie se lo dice parecerá un fallo suyo.
        if (typeof data?.aviso === 'string' && data.aviso.length > 0) {
          alert(data.aviso);
        }

        onIndexed(data?.document?.name || finalName, replaceExisting);
      } catch {
        alert('Error de conexión al indexar.');
      } finally {
        setIndexing(false);
      }
    },
    [fileName, storagePath, existingDocWithSameName, onIndexed, dismissedFindings]
  );

  const handleIndexClick = useCallback(() => {
    if (existingDocWithSameName) {
      setShowReplaceDialog(true);
    } else {
      // El texto actual lo pasará el componente que llame a doIndex desde el diálogo o aquí.
      // Para mantener la API simple, exponemos doIndex y el componente lo invoca con su `text` actual.
    }
  }, [existingDocWithSameName]);

  // El consumidor llamará así desde el ImprovementModal adelgazado:
  //   onClick={() => existingDocWithSameName ? setShowReplaceDialog(true) : doIndex(text, false)}
  // y desde el ReplaceDialog:
  //   onKeepBoth={() => doIndex(text, false)}
  //   onReplace={() => doIndex(text, true)}
  //   onCancel={() => setShowReplaceDialog(false)}

  return {
    indexing,
    showReplaceDialog,
    pendienteDeAplanar,
    cancelarAplanado: () => setPendienteDeAplanar(null),
    setShowReplaceDialog,
    doIndex,
    handleIndexClick,
  };
}
