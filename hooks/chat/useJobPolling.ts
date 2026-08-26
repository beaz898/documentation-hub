'use client';

import { useCallback, useRef } from 'react';

/** Resultado devuelto por el endpoint /api/analysis-jobs/[id] */
interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  documentName: string;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Frase de progreso para una espera de job, por tramos de tiempo (F-71 paso 2).
 *
 * Extraída de useCrossDocAnalysis, que la tenía en línea: la bandeja necesita
 * exactamente la misma —es el mismo pipeline el que corre detrás— y duplicarla
 * habría dejado dos listas de frases que se irían separando. Función pura, sin
 * estado ni React: el llamador decide dónde la pinta.
 *
 * 'pending' NO es "analizando": el job está encolado y el worker aún no lo ha
 * tocado, cosa que pasa cuando otro análisis de la misma organización está en
 * curso. Decir "analizando" ahí sería mentir.
 */
export function describeJobPhase(
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed',
  elapsedMs: number,
): string {
  if (status === 'pending') return 'En cola: hay otro análisis en curso. Empezará en cuanto termine.';
  const seconds = Math.floor(elapsedMs / 1000);
  if (seconds < 15) return 'Analizando fragmentos...';
  if (seconds < 40) return 'Comparando contra el corpus...';
  if (seconds < 70) return 'Verificando contradicciones...';
  return 'Generando informe...';
}

/** Intervalo de polling en ms. */
const POLL_INTERVAL = 5000;

/** Tiempo máximo de espera en ms (10 minutos). */
const MAX_WAIT = 600_000;

/**
 * Hook para hacer polling al estado de un analysis job.
 *
 * Devuelve `pollJob`, una función que recibe el jobId y devuelve una
 * promesa que se resuelve cuando el job termina (completed o failed).
 *
 * Mientras espera, llama a `onProgress` para actualizar el estado en la UI.
 */
export function useJobPolling() {
  const abortRef = useRef(false);

  const pollJob = useCallback(async (
    jobId: string,
    onProgress?: (status: JobStatus['status'], elapsed: number) => void,
  ): Promise<JobStatus> => {
    abortRef.current = false;
    const start = Date.now();

    while (!abortRef.current) {
      const elapsed = Date.now() - start;
      if (elapsed > MAX_WAIT) {
        throw new Error('El análisis ha superado el tiempo máximo de espera.');
      }

      try {
        const res = await fetch(`/api/analysis-jobs/${jobId}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Error consultando el estado del análisis (HTTP ${res.status})`);
        }

        const job: JobStatus = await res.json();

        // F-71: incompleto cuenta como terminado — trae resultado utilizable.
        if (job.status === 'completed' || job.status === 'completed_with_errors') {
          return job;
        }

        if (job.status === 'failed') {
          throw new Error(job.errorMessage || 'El análisis falló sin mensaje de error.');
        }

        // Notificar progreso
        onProgress?.(job.status, elapsed);
      } catch (err) {
        // Si es un error de red transitorio, seguir intentando
        const message = err instanceof Error ? err.message : '';
        if (message.includes('tiempo máximo') || message.includes('falló')) {
          throw err;
        }
        console.warn('[useJobPolling] Error transitorio, reintentando:', message);
      }

      // Esperar antes del siguiente poll
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }

    throw new Error('Polling cancelado.');
  }, []);

  const cancelPolling = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { pollJob, cancelPolling };
}
