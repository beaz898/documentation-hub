'use client';

import { useState, useCallback } from 'react';
import type { ReviewDocument } from './useReviewList';
import { useJobPolling, describeJobPhase } from '@/hooks/chat/useJobPolling';

export interface ReviewAnalysisError {
  documentId: string;
  documentName: string;
  message: string;
  // true = no se analizo porque habia otro analisis en curso en la organizacion
  // (veto de concurrencia F-13/F-14, 409 'analysis_in_progress'). NO es un fallo:
  // el documento sigue intacto y basta reintentar cuando el otro termine. Se cuenta
  // aparte para no llamar "error" a una cola funcionando.
  blocked?: boolean;
}

export interface ReviewAnalysisSummary {
  analyzed: number;
  failed: number;
  blocked: number;
  /** F-71 paso 2: exhaustivos que terminaron con etapas caidas
   *  ('completed_with_errors'). NO son fallos: el analisis existe, es
   *  utilizable y sus creditos se devolvieron. Se cuentan aparte por el mismo
   *  criterio que `blocked` — no llamar "error" a algo que no lo es. */
  incomplete: number;
  errors: ReviewAnalysisError[];
}

interface Progress {
  current: number;
  total: number;
  currentName: string;
  /** F-71 paso 2: solo en exhaustivo. Un exhaustivo tarda minutos, y
   *  "Analizando 2 de 3" durante seis minutos parece un cuelgue. */
  phase?: string;
}

/**
 * Lanza el analisis de UN documento.
 *
 * En rapido devuelve null: el efecto ya ocurrio en el servidor y la bandeja se
 * refresca al terminar la tanda. En exhaustivo devuelve el jobId, porque ahi el
 * analisis todavia no ha pasado — solo esta encolado.
 */
async function analyzeOneDocument(
  doc: ReviewDocument,
  batchDocumentIds: string[],
  exhaustive: boolean,
): Promise<string | null> {
  // 1) Leer el texto del documento.
  const textRes = await fetch(`/api/documents/${doc.id}/text`, {
    credentials: 'include',
  });
  if (!textRes.ok) {
    const data = await textRes.json().catch(() => ({}));
    throw new Error(data.error || `No se pudo leer el texto (${textRes.status})`);
  }
  const textData = await textRes.json();
  const text: string = textData.text;
  if (!text || typeof text !== 'string') {
    throw new Error('El documento no tiene texto para analizar.');
  }

  // 2) Analizar, pasando el documentId (rellena la columna del analisis) y
  // los ids de los OTROS documentos de la tanda, para que se comparen entre
  // sí aunque ninguno esté aún validado.
  const analyzeRes = await fetch('/api/analyze-v2', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: doc.name,
      text,
      documentId: doc.id,
      batchDocumentIds,
      ...(exhaustive ? { exhaustive: true } : {}),
    }),
  });
  if (!analyzeRes.ok) {
    const data = await analyzeRes.json().catch(() => ({}));
    const err = new Error(data.error || `Error al analizar (${analyzeRes.status})`);
    // Marcar el veto de concurrencia para que el bucle lo cuente aparte.
    if (data.errorType === 'analysis_in_progress') {
      (err as Error & { blocked?: boolean }).blocked = true;
    }
    throw err;
  }

  if (!exhaustive) return null;

  const data = await analyzeRes.json().catch(() => ({}));
  if (!data?.jobId) {
    throw new Error('El analisis exhaustivo se encolo pero no devolvio un identificador de trabajo.');
  }
  return data.jobId as string;
}

export function useReviewAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [summary, setSummary] = useState<ReviewAnalysisSummary | null>(null);
  const { pollJob } = useJobPolling();

  const analyze = useCallback(
    async (
      documents: ReviewDocument[],
      options?: { exhaustive?: boolean },
    ): Promise<ReviewAnalysisSummary> => {
      const exhaustive = options?.exhaustive === true;
      setAnalyzing(true);
      setSummary(null);
      const errors: ReviewAnalysisError[] = [];
      let analyzed = 0;
      let incomplete = 0;

      // EN SERIE, y en exhaustivo forzosamente: el semaforo de concurrencia es
      // POR ORGANIZACION (F-13/F-14), asi que encolar el siguiente antes de que
      // el anterior termine solo produciria un 409. Encolar → esperar → encolar.
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setProgress({ current: i + 1, total: documents.length, currentName: doc.name });
        try {
          const batchDocumentIds = documents.filter(d => d.id !== doc.id).map(d => d.id);
          const jobId = await analyzeOneDocument(doc, batchDocumentIds, exhaustive);

          if (jobId) {
            const job = await pollJob(jobId, (status, elapsed) => {
              setProgress({
                current: i + 1,
                total: documents.length,
                currentName: doc.name,
                phase: describeJobPhase(status, elapsed),
              });
            });
            if (job.status === 'failed') {
              throw new Error(job.errorMessage || 'El analisis exhaustivo fallo.');
            }
            // 'completed_with_errors' cuenta como analizado Y como incompleto:
            // el resultado existe y esta guardado, solo que no se pudo
            // comprobar todo (F-71). No es un fallo de la tanda.
            if (job.status === 'completed_with_errors') incomplete++;
          }

          analyzed++;
        } catch (err) {
          const blocked = Boolean((err as Error & { blocked?: boolean })?.blocked);
          errors.push({
            documentId: doc.id,
            documentName: doc.name,
            message: err instanceof Error ? err.message : 'Error desconocido',
            blocked,
          });
          // La tanda NO se para: un 403 por plan, un 409 por staged o un fallo
          // de un documento no deben impedir que se analicen los demas.
        }
      }

      const blockedCount = errors.filter((e) => e.blocked).length;
      const result: ReviewAnalysisSummary = {
        analyzed,
        failed: errors.length - blockedCount,
        blocked: blockedCount,
        incomplete,
        errors,
      };
      setSummary(result);
      setProgress(null);
      setAnalyzing(false);
      return result;
    },
    [pollJob],
  );

  const clearSummary = useCallback(() => setSummary(null), []);

  return { analyze, analyzing, progress, summary, clearSummary };
}
