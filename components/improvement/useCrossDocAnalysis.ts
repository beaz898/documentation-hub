'use client';

import { useState, useCallback } from 'react';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';

/**
 * Genera una huella estable para un problema.
 * Dos problemas con la misma huella se consideran el mismo problema.
 * Se basa en: tipo + documento relacionado + textRef normalizado.
 * 
 * Evitamos usar title/description porque Claude los redacta de forma
 * ligeramente diferente en cada ejecución. En cambio, textRef es una
 * cita directa del documento que no varía.
 */
function problemFingerprint(p: Problem): string {
  const type = p.type;
  const relDoc = (p.relatedDoc || '').toLowerCase().trim();

  // Para contradicciones y solapamientos, textRef es la cita del documento nuevo.
  // Es el dato más estable porque viene del documento, no del LLM.
  if (p.textRef) {
    const textRefNorm = p.textRef
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?""''«»()[\]{}]/g, '')
      .trim();
    return `${type}|${relDoc}|${textRefNorm.slice(0, 80)}`;
  }

  // Fallback para problemas sin textRef (duplicados generales)
  const descNorm = (p.description || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?""''«»()[\]{}]/g, '')
    .trim();
  return `${type}|${relDoc}|${descNorm.slice(0, 80)}`;
}

/**
 * Fusiona problemas existentes con los nuevos de forma inteligente.
 * 
 * - Si un problema ya existía (misma huella): mantiene el ID original.
 * - Si es genuinamente nuevo (huella no vista): lo añade con su ID nuevo.
 * - Si un problema anterior no aparece: se elimina (resuelto).
 * 
 * Devuelve { merged, kept, added, removed } para reportar al usuario.
 */
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

        // Solo análisis contra corpus (sin estilo).
        // El estilo se analiza aparte con el botón "Reanalizar estilo".
        const crossRes = await fetch('/api/analyze-v2', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ text: currentText, fileName, exhaustive: true }),
        });

        if (!crossRes.ok) {
          throw new Error(`cross-doc HTTP ${crossRes.status}`);
        }

        const crossData = await crossRes.json();
        const incomingCrossProblems = problemsFromAnalysis(crossData?.analysis || crossData || {});

        // Fusión inteligente — calcular fuera del setter para evitar
        // problemas de timing con el estado asíncrono de React
        let delta = { kept: 0, added: 0, removed: 0 };
        setCrossDocProblems(prev => {
          const result = mergeProblems(prev, incomingCrossProblems);
          delta = { kept: result.kept, added: result.added, removed: result.removed };
          return result.merged;
        });

        // Esperar a que React procese el setter para que delta tenga los valores correctos
        await new Promise(r => setTimeout(r, 0));

        return { delta };
      } catch (err) {
        console.warn('[useCrossDocAnalysis] reanalyzeAll failed', err);
        setLastError('No se pudo reanalizar, prueba de nuevo en unos segundos.');
        return null;
      } finally {
        setReanalyzingAll(false);
      }
    },
    [accessToken, crossDocProblems.length]
  );

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, lastError };
}
