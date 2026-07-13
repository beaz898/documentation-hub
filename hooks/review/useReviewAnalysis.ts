'use client';

import { useState, useCallback } from 'react';
import type { ReviewDocument } from './useReviewList';

export interface ReviewAnalysisError {
  documentId: string;
  documentName: string;
  message: string;
}

export interface ReviewAnalysisSummary {
  analyzed: number;
  failed: number;
  errors: ReviewAnalysisError[];
}

interface Progress {
  current: number;
  total: number;
  currentName: string;
}

async function analyzeOneDocument(doc: ReviewDocument): Promise<void> {
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

  // 2) Analizar, pasando el documentId (rellena la columna del analisis).
  const analyzeRes = await fetch('/api/analyze-v2', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: doc.name,
      text,
      documentId: doc.id,
    }),
  });
  if (!analyzeRes.ok) {
    const data = await analyzeRes.json().catch(() => ({}));
    throw new Error(data.error || `Error al analizar (${analyzeRes.status})`);
  }
}

export function useReviewAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [summary, setSummary] = useState<ReviewAnalysisSummary | null>(null);

  const analyze = useCallback(
    async (documents: ReviewDocument[]): Promise<ReviewAnalysisSummary> => {
      setAnalyzing(true);
      setSummary(null);
      const errors: ReviewAnalysisError[] = [];
      let analyzed = 0;

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setProgress({ current: i + 1, total: documents.length, currentName: doc.name });
        try {
          await analyzeOneDocument(doc);
          analyzed++;
        } catch (err) {
          errors.push({
            documentId: doc.id,
            documentName: doc.name,
            message: err instanceof Error ? err.message : 'Error desconocido',
          });
        }
      }

      const result: ReviewAnalysisSummary = { analyzed, failed: errors.length, errors };
      setSummary(result);
      setProgress(null);
      setAnalyzing(false);
      return result;
    },
    [],
  );

  const clearSummary = useCallback(() => setSummary(null), []);

  return { analyze, analyzing, progress, summary, clearSummary };
}
