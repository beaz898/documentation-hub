'use client';

import { useState, useCallback, useRef } from 'react';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';
import { describeJobPhase } from '@/hooks/chat/useJobPolling';

/**
 * Genera huella para una discrepancia/duplicidad descartada.
 * Combina texto del documento nuevo + nombre del documento del corpus.
 * Debe coincidir con makeDiscrepancyFingerprint en double-check.ts.
 */
function makeDiscrepancyFingerprint(newDocSays: string, existingDocument: string): string {
  const textNorm = newDocSays
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?""''«»()[\]{}]/g, '')
    .trim()
    .slice(0, 80);
  const docNorm = existingDocument.toLowerCase().trim();
  return `${docNorm}|${textNorm}`;
}

/**
 * Marca problemas como dismissed si su huella está en la memoria de descartados.
 */
function applyDismissedState(problems: Problem[], dismissed: Set<string>): Problem[] {
  if (dismissed.size === 0) return problems;
  return problems.map(p => {
    if (p.textRef && p.relatedDoc) {
      const fp = makeDiscrepancyFingerprint(p.textRef, p.relatedDoc);
      if (dismissed.has(fp)) {
        return { ...p, dismissed: true };
      }
    }
    return p;
  });
}

/** Intervalo de polling en ms. */
const POLL_INTERVAL = 5000;

/** Tiempo máximo de espera en ms (10 minutos). */
const MAX_POLL_WAIT = 600_000;

export interface ReanalyzeResult {
  activeCount: number;
  dismissedCount: number;
  totalCount: number;
}

export function useCrossDocAnalysis(
  initialAnalysis: RawAnalysis,
) {
  const [crossDocProblems, setCrossDocProblems] = useState<Problem[]>(
    () => problemsFromAnalysis(initialAnalysis)
  );
  // F-71: el aviso de análisis incompleto. Arranca con lo que traiga el
  // análisis inicial y se reemplaza en cada reanálisis, igual que los problemas.
  const [stageFailureCount, setStageFailureCount] = useState<number>(
    () => initialAnalysis.stageFailures?.length ?? 0
  );
  // F-74 P2: el alcance declarado, mismo ciclo de vida que stageFailureCount.
  const [selectionLimits, setSelectionLimits] = useState<RawAnalysis['selectionLimits']>(
    () => initialAnalysis.selectionLimits
  );
  const [reanalyzingAll, setReanalyzingAll] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [reanalyzePhase, setReanalyzePhase] = useState<string | null>(null);

  /**
   * Huellas de problemas que el usuario marcó como "no es un error".
   * Se acumulan durante toda la sesión del modal de mejora.
   * Se envían al backend para que el double-check no los re-verifique.
   */
  const dismissedFingerprintsRef = useRef<Set<string>>(new Set());

  const reanalyzeAll = useCallback(
    async (currentText: string, fileName: string, documentId?: string | null): Promise<ReanalyzeResult | null> => {
      setReanalyzingAll(true);
      setLastError(null);
      setReanalyzePhase('Enviando reanálisis...');

      try {
        const crossRes = await fetch('/api/analyze-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            text: currentText,
            fileName,
            exhaustive: true,
            excludeFingerprints: Array.from(dismissedFingerprintsRef.current),
            documentId: documentId ?? undefined,
          }),
        });

        if (!crossRes.ok) {
          const errData = await crossRes.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errData.error || `HTTP ${crossRes.status}`);
        }

        const crossData = await crossRes.json();

        let analysis: RawAnalysis;

        if (crossData.async && crossData.jobId) {
          // ── Reanálisis asíncrono: polling hasta que termine ──────
          setReanalyzePhase('Reanálisis en curso...');

          // F-71 paso 2: las frases por tramos salen ahora de describeJobPhase
          // (hooks/chat/useJobPolling.ts). Mismo texto, un solo sitio — la
          // bandeja necesita las mismas y dos copias se habrían separado.
          const job = await pollJobUntilDone(crossData.jobId, (status, elapsed) => {
            setReanalyzePhase(describeJobPhase(status, elapsed));
          });

          const result = job.result as Record<string, unknown> | null;
          if (!result) {
            throw new Error('El reanálisis terminó pero no devolvió resultados.');
          }
          analysis = result as unknown as RawAnalysis;
        } else {
          // Respuesta síncrona (fallback)
          analysis = crossData?.analysis || crossData || {};
        }

        setReanalyzePhase(null);

        // Recoger huellas de "posibles" descartadas por Sonnet
        if (analysis.discrepancies) {
          for (const d of analysis.discrepancies) {
            if (d.confidence === 'posible' && d.newDocSays && d.existingDocument) {
              const fp = makeDiscrepancyFingerprint(d.newDocSays, d.existingDocument);
              dismissedFingerprintsRef.current.add(fp);
            }
          }
        }

        // Generar lista nueva de problemas (reemplazo completo, sin merge)
        const newProblems = problemsFromAnalysis(analysis);

        // Marcar como dismissed los que están en la memoria
        const withDismissed = applyDismissedState(newProblems, dismissedFingerprintsRef.current);

        const activeCount = withDismissed.filter(p => !p.dismissed).length;
        const dismissedCount = withDismissed.filter(p => p.dismissed).length;

        setStageFailureCount(analysis.stageFailures?.length ?? 0);
        setSelectionLimits(analysis.selectionLimits);
        setCrossDocProblems(withDismissed);

        return { activeCount, dismissedCount, totalCount: withDismissed.length };
      } catch (err) {
        console.warn('[useCrossDocAnalysis] reanalyzeAll failed', err);
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setLastError(`No se pudo reanalizar: ${message}`);
        setReanalyzePhase(null);
        return null;
      } finally {
        setReanalyzingAll(false);
      }
    },
    []
  );

  /**
   * Toggle de "no es un error" en un problema.
   * Añade o quita su huella de la memoria de descartados.
   */
  const dismissProblem = useCallback((problemId: string, textRef?: string, relatedDoc?: string) => {
    let isDismissing = false;

    setCrossDocProblems(prev => {
      const target = prev.find(p => p.id === problemId);
      if (!target) return prev;

      isDismissing = !target.dismissed;

      // Actualizar memoria de descartados
      if (textRef && relatedDoc) {
        const fp = makeDiscrepancyFingerprint(textRef, relatedDoc);
        if (isDismissing) {
          dismissedFingerprintsRef.current.add(fp);
        } else {
          dismissedFingerprintsRef.current.delete(fp);
        }
      }

      return prev.map(p => p.id === problemId ? { ...p, dismissed: isDismissing } : p);
    });

    return isDismissing;
  }, []);

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, reanalyzePhase, lastError, dismissProblem, stageFailureCount, selectionLimits };
}

// ============================================================
// Polling interno (no usa el hook porque estamos dentro de un hook)
// ============================================================

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  result: Record<string, unknown> | null;
  errorMessage: string | null;
}

async function pollJobUntilDone(
  jobId: string,
  onProgress?: (status: JobStatus['status'], elapsed: number) => void,
): Promise<JobStatus> {
  const start = Date.now();

  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed > MAX_POLL_WAIT) {
      throw new Error('El reanálisis ha superado el tiempo máximo de espera.');
    }

    try {
      const res = await fetch(`/api/analysis-jobs/${jobId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Error consultando estado (HTTP ${res.status})`);
      }

      const job: JobStatus = await res.json();

      // F-71: incompleto también termina el polling; el aviso va en el result.
      if (job.status === 'completed' || job.status === 'completed_with_errors') return job;
      if (job.status === 'failed') {
        throw new Error(job.errorMessage || 'El reanálisis falló.');
      }

      onProgress?.(job.status, elapsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('tiempo máximo') || message.includes('falló')) throw err;
      console.warn('[useCrossDocAnalysis] Error transitorio en polling:', message);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}
