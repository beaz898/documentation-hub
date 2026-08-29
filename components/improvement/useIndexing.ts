'use client';

import { useCallback, useState } from 'react';
import { uploadLockMessage } from '@/lib/upload-lock-message';

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

  const doIndex = useCallback(
    async (currentText: string, replaceExisting: boolean) => {
      setShowReplaceDialog(false);
      setIndexing(true);
      try {
        const today = new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const finalName = replaceExisting
          ? fileName
          : `${fileName} (corregido ${today})`;

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
            // F-86 paso 3, LA ENTRADA POR INDEXACIÓN: aquí es donde el
            // documento nace y su identidad con él, así que aquí es donde sus
            // descartes pueden dejar de ser estado de pantalla.
            ...(dismissedFindings ? { dismissedFindings: dismissedFindings() } : {}),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Error' }));
          const lockMsg = uploadLockMessage(res.status, err);
          alert(lockMsg ?? `Error al indexar: ${err.error || 'desconocido'}`);
          return;
        }

        const data = await res.json();
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
    setShowReplaceDialog,
    doIndex,
    handleIndexClick,
  };
}
