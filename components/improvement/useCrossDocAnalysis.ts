'use client';

import { useState, useCallback } from 'react';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';

interface StyleApiProblem {
  type: 'ortografia' | 'ambiguedad' | 'sugerencia';
  title: string;
  description: string;
  textRef?: string;
}

function mapStyleProblems(raw: StyleApiProblem[]): Problem[] {
  return raw.map((p, i) => ({
    id: `style-${Date.now()}-${i}`,
    type: p.type,
    title: p.title,
    description: p.description,
    textRef: p.textRef,
  }));
}

export function useCrossDocAnalysis(initialAnalysis: RawAnalysis) {
  const [crossDocProblems, setCrossDocProblems] = useState<Problem[]>(
    () => problemsFromAnalysis(initialAnalysis)
  );
  const [reanalyzingAll, setReanalyzingAll] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Reanalyzes both cross-doc and style in parallel.
   * Returns the new style problems so the caller can push them into useStyleAnalysis.
   */
  const reanalyzeAll = useCallback(
    async (currentText: string, fileName: string): Promise<{ styleProblems: Problem[] } | null> => {
      setReanalyzingAll(true);
      setLastError(null);
      try {
        const [crossRes, styleRes] = await Promise.all([
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentText, fileName }),
          }),
          fetch('/api/analyze-style', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentText, fileName }),
          }),
        ]);

        if (!crossRes.ok) {
          throw new Error(`cross-doc HTTP ${crossRes.status}`);
        }

        const crossData = await crossRes.json();
        const newCrossProblems = problemsFromAnalysis(crossData?.analysis || crossData || {});
        setCrossDocProblems(newCrossProblems);

        let newStyleProblems: Problem[] = [];
        if (styleRes.ok) {
          const styleData = await styleRes.json();
          if (!styleData?.styleError) {
            newStyleProblems = mapStyleProblems(styleData?.problems || []);
          }
        } else {
          console.warn('[useCrossDocAnalysis] style HTTP error', styleRes.status);
        }

        return { styleProblems: newStyleProblems };
      } catch (err) {
        console.warn('[useCrossDocAnalysis] reanalyzeAll failed', err);
        setLastError('No se pudo reanalizar, prueba de nuevo en unos segundos.');
        return null;
      } finally {
        setReanalyzingAll(false);
      }
    },
    []
  );

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, lastError };
}
