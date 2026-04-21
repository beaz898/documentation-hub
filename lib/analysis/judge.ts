import { callLLMJson } from './llm-client';
import type { RerankedCandidate, DocumentJudgment, PipelineOptions } from './types';

/**
 * Etapa 3 — Juicio individual por documento.
 *
 * Modo rápido: secuencial con pausa, documento nuevo truncado a 4000 chars.
 * Modo exhaustivo: paralelo, documento nuevo COMPLETO (Haiku 4.5 tiene 200K de contexto,
 *   los documentos de PYME caben enteros sin problema).
 */

/** Límite de texto del doc nuevo en modo rápido (ahorra tokens). */
const NEW_DOC_LIMIT_QUICK = 4000;

/** Pausa entre juicios secuenciales (solo modo rápido). */
const SEQUENTIAL_DELAY_MS = 1200;

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
6. Cita evidencia literal cuando identifiques solapamiento o contradicción.
7. Busca contradicciones en TODO el documento nuevo, no solo en las primeras líneas. Revisa cada afirmación concreta.

Responde EXCLUSIVAMENTE con este JSON:
{
  "overlapPercent": <número 0-100>,
  "verdict": "duplicado_exacto" | "reformulacion" | "solapamiento_parcial" | "tema_similar" | "sin_relacion",
  "contradictions": [
    { "topic": "<tema concreto>", "newDocSays": "<cita literal del documento NUEVO>", "existingDocSays": "<cita literal del documento EXISTENTE>" }
  ],
  "overlappingContent": [
    { "description": "<qué se solapa>", "evidence": "<cita literal del documento EXISTENTE>", "evidenceInNewDoc": "<cita literal del documento NUEVO que dice lo mismo o similar>" }
  ],
  "uniqueToNewDoc": ["<aspecto 1 que solo aporta el nuevo>", "<aspecto 2>"]
}

REGLAS PARA evidenceInNewDoc:
- DEBE ser una copia LITERAL carácter por carácter de un substring del DOCUMENTO NUEVO (el texto entre las primeras comillas triples).
- NO parafrasees. NO normalices espacios. Copia exactamente lo que aparece en el documento nuevo.
- Si no puedes encontrar un fragmento literal equivalente en el documento nuevo, deja evidenceInNewDoc como cadena vacía "".`;

  try {
    const response = await callLLMJson<JudgeResponse>(prompt, { maxOutputTokens: 8192, temperature: 0.1 });
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
 * Modo rápido: secuencial con pausa, doc nuevo truncado.
 * Modo exhaustivo: paralelo, doc nuevo completo.
 */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
  options?: PipelineOptions;
}): Promise<DocumentJudgment[]> {
  if (args.candidates.length === 0) return [];

  const isExhaustive = args.options?.exhaustive === true;

  // Texto del documento nuevo: completo en exhaustivo, truncado en rápido
  const newDocumentText = isExhaustive
    ? args.newDocumentSample
    : args.newDocumentSample.slice(0, NEW_DOC_LIMIT_QUICK);

  if (isExhaustive) {
    // Paralelo: todas las llamadas a la vez, sin límite, sin pausa
    return Promise.all(
      args.candidates.map(candidate =>
        judgeSingleDocument({
          newDocumentName: args.newDocumentName,
          newDocumentText,
          candidate,
        })
      )
    );
  }

  // Secuencial con pausa (modo rápido)
  const results: DocumentJudgment[] = [];
  for (let i = 0; i < args.candidates.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, SEQUENTIAL_DELAY_MS));
    const judgment = await judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentText,
      candidate: args.candidates[i],
    });
    results.push(judgment);
  }
  return results;
}
