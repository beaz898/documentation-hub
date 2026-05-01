'use client';

import { useState, useCallback, useRef } from 'react';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';

interface StyleApiProblem {
  type: 'ortografia' | 'ambiguedad' | 'sugerencia';
  title: string;
  description: string;
  textRef?: string;
}

function mapStyleProblems(raw: StyleApiProblem[]): Problem[] {
  return raw.map((p, i) => ({
    id: `cross-style-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    type: p.type,
    title: p.title,
    description: p.description,
    textRef: p.textRef,
  }));
}

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
  styleProblems: Problem[];
  delta: { kept: number; added: number; removed: number };
  /** True si no se reanalizo porque el texto no cambio */
  skipped: boolean;
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

  // Guardar el texto del último análisis para detectar si cambió
  const lastAnalyzedTextRef = useRef<string | null>(null);

  const reanalyzeAll = useCallback(
    async (currentText: string, fileName: string): Promise<ReanalyzeResult | null> => {
      if (!accessToken) {
        console.warn('[useCrossDocAnalysis] no access token available');
        setLastError('No se pudo reanalizar: sesión no disponible.');
        return null;
      }

      // Si el texto no cambió desde el último análisis, no reanalizar
      if (lastAnalyzedTextRef.current !== null && lastAnalyzedTextRef.current === currentText) {
        return {
          styleProblems: [],
          delta: { kept: crossDocProblems.length, added: 0, removed: 0 },
          skipped: true,
        };
      }

      setReanalyzingAll(true);
      setLastError(null);
      try {
        const authHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        };

        const [crossRes, styleRes] = await Promise.all([
          fetch('/api/analyze-v2', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ text: currentText, fileName, exhaustive: true }),
          }),
          fetch('/api/analyze-style', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ text: currentText, fileName }),
          }),
        ]);

        if (!crossRes.ok) {
          throw new Error(`cross-doc HTTP ${crossRes.status}`);
        }

        const crossData = await crossRes.json();
        const incomingCrossProblems = problemsFromAnalysis(crossData?.analysis || crossData || {});

        // Fusión inteligente
        let delta = { kept: 0, added: 0, removed: 0 };
        setCrossDocProblems(prev => {
          const result = mergeProblems(prev, incomingCrossProblems);
          delta = { kept: result.kept, added: result.added, removed: result.removed };
          return result.merged;
        });

        // Guardar el texto analizado
        lastAnalyzedTextRef.current = currentText;

        let newStyleProblems: Problem[] = [];
        if (styleRes.ok) {
          const styleData = await styleRes.json();
          if (!styleData?.styleError) {
            newStyleProblems = mapStyleProblems(styleData?.problems || []);
          }
        } else {
          console.warn('[useCrossDocAnalysis] style HTTP error', styleRes.status);
        }

        return { styleProblems: newStyleProblems, delta, skipped: false };
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
