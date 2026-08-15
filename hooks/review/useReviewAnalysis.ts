'use client';

import { useState, useCallback } from 'react';
import type { ReviewDocument } from './useReviewList';

export interface ReviewAnalysisError {
  documentId: string;
  documentName: string;
  message: string;
  // true = no se analizo porque habia otro analisis en curso en la organizacion
  // (veto de concurrencia F-13/F-14, 409 'analysis_in_progress'). NO es un fallo:
  // el documento sigue intacto y basta reintentar cuando el otro termine. Se cuenta
  // aparte para no llamar "error" a una cola funcionando.
  blocked?: boolean;
}

export interface ReviewAnalysisSummary {
  analyzed: number;
  failed: number;
  blocked: number;
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
    const err = new Error(data.error || `Error al analizar (${analyzeRes.status})`);
    // Marcar el veto de concurrencia para que el bucle lo cuente aparte.
    if (data.errorType === 'analysis_in_progress') {
      (err as Error & { blocked?: boolean }).blocked = true;
    }
    throw err;
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
          const blocked = Boolean((err as Error & { blocked?: boolean })?.blocked);
          errors.push({
            documentId: doc.id,
            documentName: doc.name,
            message: err instanceof Error ? err.message : 'Error desconocido',
            blocked,
          });
        }
      }

      const blockedCount = errors.filter((e) => e.blocked).length;
      const result: ReviewAnalysisSummary = {
        analyzed,
        failed: errors.length - blockedCount,
        blocked: blockedCount,
        errors,
      };
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
