import { callLLMJson } from './llm-client';
import type { RerankedCandidate, DocumentJudgment, PipelineOptions } from './types';

/**
 * Etapa 3 — Juicio individual por documento.
 *
 * Ambos modos (rápido y exhaustivo) reciben el documento nuevo COMPLETO
 * para no perder solapamientos ni contradicciones en la parte final.
 *
 * Modo rápido: secuencial con pausa larga (1200ms).
 * Modo exhaustivo: secuencial con pausa corta (500ms).
 *
 * Ambos son secuenciales para evitar ráfagas de llamadas LLM
 * que provocan 429 de Anthropic.
 */

/** Pausa entre juicios secuenciales en modo rápido. */
const SEQUENTIAL_DELAY_QUICK_MS = 1200;

/** Pausa entre juicios secuenciales en modo exhaustivo. */
const SEQUENTIAL_DELAY_EXHAUSTIVE_MS = 500;

interface JudgeResponse {
  overlapPercent: number;
  verdict: 'duplicado_exacto' | 'reformulacion' | 'solapamiento_parcial' | 'tema_similar' | 'sin_relacion';
  contradictions: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
  }>;
  overlappingContent: Array<{
    description: string;
    evidence: string;
    evidenceInNewDoc: string;
  }>;
  uniqueToNewDoc: string[];
}

async function judgeSingleDocument(args: {
  newDocumentName: string;
  newDocumentText: string;
  candidate: RerankedCandidate;
}): Promise<DocumentJudgment> {
  const { newDocumentName, newDocumentText, candidate } = args;

  const existingFragsBlock = candidate.fragments
    .map((f, i) => `[Fragmento ${i + 1} de "${candidate.documentName}"]\n${f.text}`)
    .join('\n\n');

  const prompt = `Eres un auditor de documentación. Tu tarea es comparar CONTENIDO CONCRETO entre dos documentos y emitir un juicio preciso, no una impresión general.

DOCUMENTO NUEVO: "${newDocumentName}"
"""
${newDocumentText}
"""

DOCUMENTO EXISTENTE: "${candidate.documentName}" (fuente: ${candidate.source})
"""
${existingFragsBlock}
"""

INSTRUCCIONES CRÍTICAS:
1. "Solapamiento" significa contenido que se repite, aunque esté redactado con palabras distintas. NO significa compartir tema general.
2. "Contradicción" significa que ambos documentos afirman algo distinto sobre el mismo dato concreto (cifras, plazos, políticas, definiciones).
3. El porcentaje de solapamiento debe reflejar CUÁNTO del documento nuevo ya está en el existente, no la similitud temática.
4. Si los documentos hablan del mismo tema pero con contenido distinto, veredicto = "tema_similar", overlapPercent < 20.
5. Solo marca "duplicado_exacto" si el contenido es prácticamente idéntico (>85% del nuevo ya está en el existente).
6. Busca contradicciones en TODO el documento nuevo, no solo en las primeras líneas. Revisa cada afirmación concreta.

REGLAS DE FORMATO:
- Las citas en newDocSays, existingDocSays, evidence y evidenceInNewDoc deben ser CORTAS: máximo 1 frase.
- NO copies párrafos enteros. Extrae solo la frase clave que contiene el dato.
- Máximo 10 contradicciones y 5 solapamientos. Si hay más, incluye los más importantes.

Responde con este JSON (sin bloques de código, sin texto adicional):
{
  "overlapPercent": 25,
  "verdict": "tema_similar",
  "contradictions": [
    { "topic": "tema", "newDocSays": "frase corta", "existingDocSays": "frase corta" }
  ],
  "overlappingContent": [
    { "description": "qué se solapa", "evidence": "frase corta del existente", "evidenceInNewDoc": "frase corta del nuevo" }
  ],
  "uniqueToNewDoc": ["aspecto 1", "aspecto 2"]
}`;

  try {
    const response = await callLLMJson<JudgeResponse>(prompt, { maxOutputTokens: 4096, temperature: 0.1 });
    return {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: Math.max(0, Math.min(100, Math.round(response.overlapPercent || 0))),
      verdict: response.verdict || 'sin_relacion',
      contradictions: response.contradictions || [],
      overlappingContent: (response.overlappingContent || []).map(o => ({
        description: o.description || '',
        evidence: o.evidence || '',
        evidenceInNewDoc: o.evidenceInNewDoc || '',
      })),
      uniqueToNewDoc: response.uniqueToNewDoc || [],
    };
  } catch (err) {
    console.warn(`[judge] Failed for "${candidate.documentName}":`, err);
    return {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: 0,
      verdict: 'sin_relacion',
      contradictions: [],
      overlappingContent: [{ description: 'No se pudo emitir juicio (error del LLM)', evidence: '', evidenceInNewDoc: '' }],
      uniqueToNewDoc: [],
    };
  }
}

/**
 * Lanza juicios para todos los candidatos.
 *
 * Ambos modos son secuenciales para evitar saturar la API.
 * Modo rápido: pausa de 1200ms.
 * Modo exhaustivo: pausa de 500ms.
 *
 * El documento nuevo se envía COMPLETO en ambos modos para no
 * perder solapamientos ni contradicciones en ninguna parte del texto.
 */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
  options?: PipelineOptions;
}): Promise<DocumentJudgment[]> {
  if (args.candidates.length === 0) return [];

  const isExhaustive = args.options?.exhaustive === true;
  const delayMs = isExhaustive ? SEQUENTIAL_DELAY_EXHAUSTIVE_MS : SEQUENTIAL_DELAY_QUICK_MS;

  // Documento nuevo COMPLETO en ambos modos
  const newDocumentText = args.newDocumentSample;

  const results: DocumentJudgment[] = [];
  for (let i = 0; i < args.candidates.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delayMs));
    const judgment = await judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentText,
      candidate: args.candidates[i],
    });
    results.push(judgment);
  }
  return results;
}
