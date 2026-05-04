import { callLLMJson } from './llm-client';
import type { CandidateDocument, RerankedCandidate, PipelineOptions } from './types';

/**
 * Etapa 2 — Rerank con LLM.
 * Recibe candidatos brutos de Pinecone y el LLM decide cuáles merece analizar.
 * Filtra ruido temático (docs del mismo dominio que no se solapan realmente).
 *
 * Modo rápido: máximo 6 seleccionados.
 * Modo exhaustivo: máximo 10 seleccionados — suficiente para cubrir todos los
 *   solapamientos y contradicciones reales. Un documento nuevo raramente tiene
 *   relación significativa con más de 10 documentos del corpus.
 *   Si hay más, se detectarán en reanálisis sucesivos.
 */

interface RerankResponse {
  selected: Array<{
    documentId: string;
    confidence: 'alta' | 'media' | 'baja';
    reason: string;
  }>;
}

/** Límite de seleccionados en modo rápido. */
const MAX_SELECTED_QUICK = 6;

/** Límite de seleccionados en modo exhaustivo. */
const MAX_SELECTED_EXHAUSTIVE = 10;

export async function rerankCandidates(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: CandidateDocument[];
  options?: PipelineOptions;
}): Promise<RerankedCandidate[]> {
  const { newDocumentName, newDocumentSample, candidates, options } = args;
  const isExhaustive = options?.exhaustive === true;
  const maxSelected = isExhaustive ? MAX_SELECTED_EXHAUSTIVE : MAX_SELECTED_QUICK;

  if (candidates.length === 0) return [];

  const candidatesBlock = candidates.map((c, i) => {
    const fragsText = c.fragments.map(f => `  · "${f.text.slice(0, 300).replace(/\s+/g, ' ')}"`).join('\n');
    return `[${i + 1}] Documento: "${c.documentName}" (fuente: ${c.source})\nFragmentos similares encontrados:\n${fragsText}`;
  }).join('\n\n');

  // Instrucción de límite
  const limitInstruction = isExhaustive
    ? `- Selecciona los que merezcan análisis, hasta un máximo de ${MAX_SELECTED_EXHAUSTIVE}. Prioriza los que tengan mayor probabilidad de solapamiento o contradicción. Es preferible incluir un candidato dudoso que perder una posible contradicción.`
    : `- Máximo ${MAX_SELECTED_QUICK} seleccionados. Si ninguno merece análisis, devuelve selected: [].`;

  // Criterio de filtrado: exhaustivo es más permisivo.
  const filterCriteria = isExhaustive
    ? '- Un candidato merece análisis si hay CUALQUIER probabilidad de que contenga contenido solapado, duplicado o contradictorio con el nuevo. En caso de duda, INCLUIR.'
    : '- Un candidato merece análisis profundo SOLO si hay probabilidad real de que contenga contenido solapado, duplicado o contradictorio con el nuevo.\n- Sé estricto. Es preferible descartar un candidato dudoso que inflar la lista con ruido.';

  const prompt = `Eres un auditor de documentación corporativa. Tu tarea es decidir cuáles de estos documentos candidatos merecen un análisis profundo contra un documento nuevo.

DOCUMENTO NUEVO: "${newDocumentName}"
Muestra del documento nuevo:
"""
${newDocumentSample.slice(0, 3000)}
"""

DOCUMENTOS CANDIDATOS (recuperados por similitud de embeddings):
${candidatesBlock}

INSTRUCCIONES:
${filterCriteria}
- Compartir un tema general (ambos hablan de "RRHH", "técnica", "ventas") NO es suficiente. Debe haber indicios de contenido concreto coincidente.
${limitInstruction}

Responde EXCLUSIVAMENTE con este JSON, sin texto adicional:
{
  "selected": [
    {
      "documentId": "<id exacto del documento>",
      "confidence": "alta" | "media" | "baja",
      "reason": "<una frase breve justificando por qué merece análisis profundo>"
    }
  ]
}

IMPORTANTE: el campo documentId debe ser el documentId real que te paso a continuación, no el nombre. Aquí va el mapeo número → documentId:
${candidates.map((c, i) => `[${i + 1}] → ${c.documentId}`).join('\n')}`;

  try {
    const response = await callLLMJson<RerankResponse>(prompt, { maxOutputTokens: 2048, temperature: 0.1 });

    const selected: RerankedCandidate[] = [];
    for (const sel of response.selected || []) {
      const candidate = candidates.find(c => c.documentId === sel.documentId);
      if (!candidate) continue;
      selected.push({
        documentId: candidate.documentId,
        documentName: candidate.documentName,
        source: candidate.source,
        fragments: candidate.fragments,
        rerankReason: sel.reason || '',
        rerankConfidence: sel.confidence || 'media',
      });
    }

    return selected.slice(0, maxSelected);
  } catch (err) {
    console.warn('[rerank] LLM failed, falling back to top candidates by embedding score:', err);
    // Fallback: en exhaustivo top 5, en rápido top 3
    const fallbackCount = isExhaustive ? 5 : 3;
    const fallbackCandidates = candidates.slice(0, fallbackCount);
    return fallbackCandidates.map(c => ({
      documentId: c.documentId,
      documentName: c.documentName,
      source: c.source,
      fragments: c.fragments,
      rerankReason: 'Fallback: rerank LLM falló, seleccionado por score de embedding',
      rerankConfidence: 'baja',
    }));
  }
}
