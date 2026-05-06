'use client';

import { useState, useCallback, useRef } from 'react';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';

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

export interface ReanalyzeResult {
  activeCount: number;
  dismissedCount: number;
  totalCount: number;
}

export function useCrossDocAnalysis(
  initialAnalysis: RawAnalysis,
  accessToken: string | null,
) {
  const [crossDocProblems, setCrossDocProblems] = useState<Problem[]>(
    () => problemsFromAnalysis(initialAnalysis)
  );
  const [reanalyzingAll, setReanalyzingAll] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Huellas de problemas que el usuario marcó como "no es un error".
   * Se acumulan durante toda la sesión del modal de mejora.
   * Se envían al backend para que el double-check no los re-verifique.
   */
  const dismissedFingerprintsRef = useRef<Set<string>>(new Set());

  const reanalyzeAll = useCallback(
    async (currentText: string, fileName: string): Promise<ReanalyzeResult | null> => {
      if (!accessToken) {
        console.warn('[useCrossDocAnalysis] no access token available');
        setLastError('No se pudo reanalizar: sesión no disponible.');
        return null;
      }

      setReanalyzingAll(true);
      setLastError(null);
      try {
        const crossRes = await fetch('/api/analyze-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: currentText,
            fileName,
            exhaustive: true,
            excludeFingerprints: Array.from(dismissedFingerprintsRef.current),
          }),
        });

        if (!crossRes.ok) {
          throw new Error(`cross-doc HTTP ${crossRes.status}`);
        }

        const crossData = await crossRes.json();
        const analysis = crossData?.analysis || crossData || {};

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

        setCrossDocProblems(withDismissed);

        return { activeCount, dismissedCount, totalCount: withDismissed.length };
      } catch (err) {
        console.warn('[useCrossDocAnalysis] reanalyzeAll failed', err);
        setLastError('No se pudo reanalizar, prueba de nuevo en unos segundos.');
        return null;
      } finally {
        setReanalyzingAll(false);
      }
    },
    [accessToken]
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

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, lastError, dismissProblem };
}
