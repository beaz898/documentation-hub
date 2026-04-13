import { useState, useCallback } from 'react';
import type { Problem } from './problems';

type StyleApiProblem = {
  type: Problem['type'];
  title: string;
  description: string;
  textRef: string;
};

interface UseStyleAnalysisArgs {
  initialText: string;
  fileName: string;
  accessToken: string | null;
}

function mapStyleProblems(raw: StyleApiProblem[]): Problem[] {
  return raw.map((p, i) => ({
    id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    type: p.type,
    title: p.title,
    description: p.description,
    textRef: p.textRef,
    relatedDoc: undefined,
    proposal: undefined,
  }));
}

export function useStyleAnalysis({ initialText, fileName, accessToken }: UseStyleAnalysisArgs) {
  const [styleProblems, setStyleProblems] = useState<Problem[]>([]);
  const [styleLoading, setStyleLoading] = useState(false);

  void initialText;
  void fileName;

  const reanalyzeStyle = useCallback(
    async (currentText: string, currentFileName: string): Promise<Problem[]> => {
      if (!accessToken) {
        console.warn('[useStyleAnalysis] no access token available');
        return [];
      }
      setStyleLoading(true);
      try {
        const res = await fetch('/api/analyze-style', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text: currentText, fileName: currentFileName }),
        });
        if (!res.ok) {
          console.warn('[useStyleAnalysis] HTTP error', res.status);
          return [];
        }
        const data = await res.json();
        if (data?.styleError) {
          console.warn('[useStyleAnalysis] styleError flag from backend');
          return [];
        }
        const mapped = mapStyleProblems(data?.problems || []);
        setStyleProblems(mapped);
        return mapped;
      } catch (err) {
        console.warn('[useStyleAnalysis] fetch failed', err);
        return [];
      } finally {
        setStyleLoading(false);
      }
    },
    [accessToken]
  );

  return { styleProblems, styleLoading, reanalyzeStyle, setStyleProblems };
}
