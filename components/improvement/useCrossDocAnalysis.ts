'use client';

import { useState, useCallback, useRef } from 'react';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';

/**
 * Genera una huella estable para un problema.
 * Dos problemas con la misma huella se consideran el mismo problema.
 */
function problemFingerprint(p: Problem): string {
  const type = p.type;
  const relDoc = (p.relatedDoc || '').toLowerCase().trim();

  if (p.textRef) {
    const textRefNorm = p.textRef
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?""''«»()[\]{}]/g, '')
      .trim();
    return `${type}|${relDoc}|${textRefNorm.slice(0, 80)}`;
  }

  const descNorm = (p.description || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?""''«»()[\]{}]/g, '')
    .trim();
  return `${type}|${relDoc}|${descNorm.slice(0, 80)}`;
}

/**
 * Genera huella para una discrepancia descartada por Sonnet.
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

function mergeProblems(
  existing: Problem[],
  incoming: Problem[],
): { merged: Problem[]; kept: number; added: number; removed: number } {
  const existingByFp = new Map<string, Problem>();
  for (const p of existing) {
    const fp = problemFingerprint(p);
    existingByFp.set(fp, p);
  }

  const merged: Problem[] = [];
  let kept = 0;
  let added = 0;
  const matchedFps = new Set<string>();

  for (const newP of incoming) {
    const fp = problemFingerprint(newP);
    const existingP = existingByFp.get(fp);

    if (existingP) {
      merged.push({ ...newP, id: existingP.id });
      matchedFps.add(fp);
      kept++;
    } else {
      merged.push(newP);
      added++;
    }
  }

  let removed = 0;
  for (const [fp] of existingByFp) {
    if (!matchedFps.has(fp)) removed++;
  }

  return { merged, kept, added, removed };
}

export interface ReanalyzeResult {
  delta: { kept: number; added: number; removed: number };
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

  const crossDocProblemsRef = useRef(crossDocProblems);
  crossDocProblemsRef.current = crossDocProblems;

  /**
   * Huellas de contradicciones que Sonnet descartó como "posible".
   * Se acumulan entre reanálisis para no re-verificar lo que ya se rechazó.
   * La huella es la combinación texto + documento del corpus, así que si
   * el usuario edita el texto o se compara con otro documento, se re-verifica.
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
        const authHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        };

        const crossRes = await fetch('/api/analyze-v2', {
          method: 'POST',
          headers: authHeaders,
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
        const incomingCrossProblems = problemsFromAnalysis(analysis);

        // Recoger huellas de las "posibles" que Sonnet descartó en esta pasada
        // para no re-verificarlas en el siguiente reanálisis.
        if (analysis.discrepancies) {
          for (const d of analysis.discrepancies) {
            if (d.confidence === 'posible') {
              const fp = makeDiscrepancyFingerprint(d.newDocSays, d.existingDocument);
              dismissedFingerprintsRef.current.add(fp);
            }
          }
        }

        const currentProblems = crossDocProblemsRef.current;
        const result = mergeProblems(currentProblems, incomingCrossProblems);
        const delta = { kept: result.kept, added: result.added, removed: result.removed };

        setCrossDocProblems(result.merged);

        return { delta };
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
   * Si estaba activo → lo marca como dismissed y guarda huella.
   * Si estaba dismissed → lo reactiva y elimina huella.
   */
  const dismissProblem = useCallback((p: Problem) => {
    const isDismissing = !p.dismissed;

    if (p.textRef && p.relatedDoc) {
      const fp = makeDiscrepancyFingerprint(p.textRef, p.relatedDoc);
      if (isDismissing) {
        dismissedFingerprintsRef.current.add(fp);
      } else {
        dismissedFingerprintsRef.current.delete(fp);
      }
    }

    setCrossDocProblems(prev =>
      prev.map(cp => cp.id === p.id ? { ...cp, dismissed: isDismissing } : cp)
    );
  }, []);

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, lastError, dismissProblem };
}
