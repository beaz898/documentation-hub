import { callLLMJson } from './gemini-client';
import type { RerankedCandidate, DocumentJudgment } from './types';

/**
 * Etapa 3 — Juicio individual por documento.
 * Una llamada al LLM por cada candidato finalista, en paralelo.
 * El LLM recibe fragmentos reales de ambos documentos y emite un veredicto con evidencia concreta.
 */

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
  }>;
  uniqueToNewDoc: string[];
}

async function judgeSingleDocument(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidate: RerankedCandidate;
}): Promise<DocumentJudgment> {
  const { newDocumentName, newDocumentSample, candidate } = args;

  const existingFragsBlock = candidate.fragments
    .map((f, i) => `[Fragmento ${i + 1} de "${candidate.documentName}"]\n${f.text}`)
    .join('\n\n');

  const prompt = `Eres un auditor de documentación. Tu tarea es comparar CONTENIDO CONCRETO entre dos documentos y emitir un juicio preciso, no una impresión general.

DOCUMENTO NUEVO: "${newDocumentName}"
"""
${newDocumentSample.slice(0, 4000)}
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

Responde EXCLUSIVAMENTE con este JSON:
{
  "overlapPercent": <número 0-100>,
  "verdict": "duplicado_exacto" | "reformulacion" | "solapamiento_parcial" | "tema_similar" | "sin_relacion",
  "contradictions": [
    { "topic": "<tema concreto>", "newDocSays": "<lo que dice el nuevo>", "existingDocSays": "<lo que dice el existente>" }
  ],
  "overlappingContent": [
    { "description": "<qué se solapa>", "evidence": "<cita literal del fragmento que lo prueba>" }
  ],
  "uniqueToNewDoc": ["<aspecto 1 que solo aporta el nuevo>", "<aspecto 2>"]
}`;

  try {
    const response = await callLLMJson<JudgeResponse>(prompt, { maxOutputTokens: 3072, temperature: 0.1 });
    return {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: Math.max(0, Math.min(100, Math.round(response.overlapPercent || 0))),
      verdict: response.verdict || 'sin_relacion',
      contradictions: response.contradictions || [],
      overlappingContent: response.overlappingContent || [],
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
      overlappingContent: [{ description: 'No se pudo emitir juicio (error del LLM)', evidence: '' }],
      uniqueToNewDoc: [],
    };
  }
}

/** Lanza los juicios en paralelo. Con free tier puede chocar con rate limits. */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
}): Promise<DocumentJudgment[]> {
  if (args.candidates.length === 0) return [];
  const promises = args.candidates.map(candidate =>
    judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentSample: args.newDocumentSample,
      candidate,
    })
  );
  return Promise.all(promises);
}
