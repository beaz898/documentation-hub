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
 * Genera una "huella" de un problema para compararlo con otros.
 * Dos problemas con la misma huella se consideran el mismo problema.
 * Se basa en tipo + documento relacionado + contenido normalizado.
 */
function problemFingerprint(p: Problem): string {
  const type = p.type;
  const relDoc = (p.relatedDoc || '').toLowerCase().trim();
  // Normalizar el contenido: quitar espacios extra, minúsculas, quitar puntuación
  const descNorm = (p.description || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?""''()[\]{}]/g, '')
    .trim();
  // Para contradicciones, usar el textRef (lo que dice el documento nuevo) como clave principal
  const textRefNorm = (p.textRef || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return `${type}|${relDoc}|${textRefNorm || descNorm.slice(0, 100)}`;
}

/**
 * Compara dos conjuntos de problemas de forma inteligente.
 * 
 * En vez de sobrescribir, identifica:
 * - Problemas que siguen existiendo (mantiene el ID original)
 * - Problemas genuinamente nuevos (nuevo ID)
 * - Problemas que desaparecieron (se consideran resueltos solo si ya no aparecen)
 * 
 * Devuelve el array fusionado de problemas.
 */
function mergeProblems(
  existing: Problem[],
  incoming: Problem[],
): Problem[] {
  // Crear mapa de huellas de los existentes
  const existingByFingerprint = new Map<string, Problem>();
  for (const p of existing) {
    existingByFingerprint.set(problemFingerprint(p), p);
  }

  // Crear mapa de huellas de los nuevos
  const incomingByFingerprint = new Map<string, Problem>();
  for (const p of incoming) {
    incomingByFingerprint.set(problemFingerprint(p), p);
  }

  const merged: Problem[] = [];
  const usedExistingFingerprints = new Set<string>();

  // Paso 1: para cada problema nuevo, buscar si ya existía
  for (const [fp, newProblem] of incomingByFingerprint) {
    const existingProblem = existingByFingerprint.get(fp);
    if (existingProblem) {
      // El problema ya existía → mantener el ID original y los datos actualizados
      merged.push({
        ...newProblem,
        id: existingProblem.id, // mantener ID para que la UI no lo trate como nuevo
      });
      usedExistingFingerprints.add(fp);
    } else {
      // Problema genuinamente nuevo
      merged.push(newProblem);
    }
  }

  // Los problemas existentes que no aparecen en incoming se consideran resueltos
  // y no se incluyen en el resultado

  return merged;
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
  // Guardar referencia al texto con el que se hizo el último análisis
  const lastAnalyzedTextRef = useRef<string>('');

  /**
   * Reanalyzes both cross-doc and style in parallel.
   * Uses intelligent comparison to merge results instead of overwriting.
   * Returns the new style problems so the caller can push them into useStyleAnalysis.
   */
  const reanalyzeAll = useCallback(
    async (currentText: string, fileName: string): Promise<{ styleProblems: Problem[] } | null> => {
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

        // Comparación inteligente: fusionar en vez de sobrescribir
        setCrossDocProblems(prev => {
          const merged = mergeProblems(prev, incomingCrossProblems);
          return merged;
        });

        // Guardar referencia del texto analizado
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

        return { styleProblems: newStyleProblems };
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

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, lastError };
}
