'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Problem } from './problems';

interface UseStyleAnalysisArgs {
  initialText: string;
  fileName: string;
  onInitialProblemsLoaded?: (count: number) => void;
}

interface StyleApiProblem {
  type: 'ortografia' | 'ambiguedad' | 'sugerencia';
  title: string;
  description: string;
  textRef?: string;
}

function mapStyleProblems(raw: StyleApiProblem[]): Problem[] {
  return raw.map((p, i) => ({
    id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    type: p.type,
    title: p.title,
    description: p.description,
    textRef: p.textRef,
  }));
}

export function useStyleAnalysis({
  initialText,
  fileName,
  onInitialProblemsLoaded,
}: UseStyleAnalysisArgs) {
  const [styleProblems, setStyleProblems] = useState<Problem[]>([]);
  const [styleLoading, setStyleLoading] = useState(false);
  const didInitRef = useRef(false);

  // Initial style analysis — runs exactly once on mount.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    let cancelled = false;
    setStyleLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/analyze-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: initialText, fileName }),
        });
        if (!res.ok) {
          console.warn('[useStyleAnalysis] /api/analyze-style HTTP error', res.status);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.styleError) {
          console.warn('[useStyleAnalysis] styleError flag from backend');
          return;
        }
        const mapped = mapStyleProblems(data?.problems || []);
        if (mapped.length > 0) {
          setStyleProblems(mapped);
          onInitialProblemsLoaded?.(mapped.length);
        }
      } catch (err) {
        console.warn('[useStyleAnalysis] initial fetch failed', err);
      } finally {
        if (!cancelled) setStyleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reanalyzeStyle = useCallback(
    async (currentText: string) => {
      setStyleLoading(true);
      try {
        const res = await fetch('/api/analyze-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentText, fileName }),
        });
        if (!res.ok) {
          console.warn('[useStyleAnalysis] reanalyze HTTP error', res.status);
          return;
        }
        const data = await res.json();
        if (data?.styleError) {
          console.warn('[useStyleAnalysis] styleError on reanalyze');
          return;
        }
        const mapped = mapStyleProblems(data?.problems || []);
        setStyleProblems(mapped);
      } catch (err) {
        console.warn('[useStyleAnalysis] reanalyze failed', err);
      } finally {
        setStyleLoading(false);
      }
    },
    [fileName]
  );

  return { styleProblems, styleLoading, reanalyzeStyle, setStyleProblems };
}
