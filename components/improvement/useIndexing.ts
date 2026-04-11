'use client';

import { useCallback, useState } from 'react';

export interface ExistingDocForIndexing {
  id: string;
  name: string;
}

interface UseIndexingParams {
  fileName: string;
  storagePath: string;
  accessToken: string;
  existingDocWithSameName?: ExistingDocForIndexing | null;
  onIndexed: (docName: string, wasReplaced: boolean) => void;
}

export function useIndexing({
  fileName,
  storagePath,
  accessToken,
  existingDocWithSameName,
  onIndexed,
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
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: currentText,
            name: finalName,
            originalStoragePath: storagePath,
            replaceExistingId: replaceExisting ? existingDocWithSameName?.id : undefined,
            sizeBytes: new Blob([currentText]).size,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Error' }));
          alert(`Error al indexar: ${err.error || 'desconocido'}`);
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
    [fileName, storagePath, accessToken, existingDocWithSameName, onIndexed]
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
