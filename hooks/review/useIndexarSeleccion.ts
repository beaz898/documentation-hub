'use client';

import { useState, useCallback } from 'react';
import type { ReviewDocument } from './useReviewList';

/**
 * INDEXAR VARIOS DOCUMENTOS DE UNA TANDA — el botón de lote de la bandeja.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ EL BUCLE VA EN EL CLIENTE, Y NO POR COMODIDAD. `mark-analyzed` no declara
 * `maxDuration` y hace UNA llamada a Pinecone POR CHUNK, en serie: OPE-06 tiene
 * 114. Un endpoint de lote que recorriera veinte documentos multiplicaría eso
 * por veinte dentro de un solo límite de plataforma, y al agotarse cortaría por
 * la mitad — sin respuesta, sin saber cuáles se hicieron.
 *
 * Una petición por documento pone cada uno en su propio presupuesto de tiempo.
 * No es gestionar el límite: es no acercarse a él.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ NO CUESTA CRÉDITOS. `mark-analyzed` no llama a `consumeCredits`: mueve
 * metadata de vectores ya pagados en la indexación. Por eso este botón no lleva
 * precio en la etiqueta y los otros dos de la barra sí — el criterio de
 * `coste-visible.ts` es «lo que el usuario no adivinaría», y aquí no hay nada
 * que adivinar.
 *
 * ⚠️ Y CADA DOCUMENTO ES ATÓMICO POR SÍ SOLO, que es lo que hace seguro parar a
 * medias: `mark-analyzed` escribe Pinecone PRIMERO y aborta sin tocar Supabase
 * si falla, así que un documento caído se queda 'pendiente' —coherente— y basta
 * reintentarlo. Cerrar la pestaña a mitad de tanda deja unos hechos y otros por
 * hacer; ninguno a medias.
 *
 * ⚠️ POR QUÉ NO REUTILIZA `recorrerElLote` (el de la reparación): aquél termina
 * cuando el SERVIDOR dice `hay_mas: false` —una sola ruta que decide cuándo
 * parar— y aquí la lista se conoce entera de antemano y cada elemento es su
 * propia petición. Comparten la forma (acumular, seguir tras un fallo, resumir
 * al final) y no el criterio de parada. Fundirlos metería dos preguntas en una
 * función.
 *
 * Lo que sí se copia a propósito es la forma de `useReviewAnalysis`: mismo
 * `progress`, mismo «la tanda no se para», mismo resumen. Que las dos tandas de
 * esta pantalla se vean igual no es casualidad, es lo que hace que el usuario no
 * tenga que aprender dos veces.
 */

export interface ErrorDeIndexado {
  documentId: string;
  documentName: string;
  message: string;
}

export interface ResumenDeIndexado {
  indexados: number;
  fallidos: number;
  errores: ErrorDeIndexado[];
}

interface Progreso {
  current: number;
  total: number;
  currentName: string;
}

export function useIndexarSeleccion() {
  const [indexando, setIndexando] = useState(false);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [resumen, setResumen] = useState<ResumenDeIndexado | null>(null);

  const indexar = useCallback(
    async (documentos: ReviewDocument[]): Promise<ResumenDeIndexado> => {
      setIndexando(true);
      setResumen(null);
      const errores: ErrorDeIndexado[] = [];
      let indexados = 0;

      // EN SERIE: cada `mark-analyzed` hace una ristra de escrituras a Pinecone,
      // y lanzarlas todas a la vez sería pedirle a la cuota lo mismo que la
      // indexación ya aprendió a no pedirle (`lib/embeddings.ts`).
      for (let i = 0; i < documentos.length; i++) {
        const doc = documentos[i];
        setProgreso({ current: i + 1, total: documentos.length, currentName: doc.name });
        try {
          const res = await fetch(`/api/documents/${doc.id}/mark-analyzed`, {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Error ${res.status}`);
          }
          indexados++;
        } catch (err) {
          errores.push({
            documentId: doc.id,
            documentName: doc.name,
            message: err instanceof Error ? err.message : 'Error desconocido',
          });
          // ⚠️ LA TANDA NO SE PARA. Un documento sin vectores (422) o un fallo
          // de Pinecone (502) no tienen por qué impedir que los otros
          // diecinueve entren. El que falló sigue en la bandeja, que es
          // exactamente donde el usuario lo va a volver a encontrar.
        }
      }

      const resultado: ResumenDeIndexado = {
        indexados,
        fallidos: errores.length,
        errores,
      };
      setResumen(resultado);
      setProgreso(null);
      setIndexando(false);
      return resultado;
    },
    [],
  );

  const limpiarResumen = useCallback(() => setResumen(null), []);

  return { indexar, indexando, progreso, resumen, limpiarResumen };
}
