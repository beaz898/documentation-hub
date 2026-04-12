import { callLLMJson } from './gemini-client';
import type { CandidateDocument, RerankedCandidate } from './types';

/**
 * Etapa 2 — Rerank con LLM.
 * Recibe candidatos brutos de Pinecone y el LLM decide cuáles merece analizar en profundidad.
 * Filtra ruido temático (docs del mismo dominio que no se solapan realmente).
 */

interface RerankResponse {
  selected: Array<{
    documentId: string;
    confidence: 'alta' | 'media' | 'baja';
    reason: string;
  }>;
}

export async function rerankCandidates(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: CandidateDocument[];
}): Promise<RerankedCandidate[]> {
  const { newDocumentName, newDocumentSample, candidates } = args;

  if (candidates.length === 0) return [];

  const candidatesBlock = candidates.map((c, i) => {
    const fragsText = c.fragments.map(f => `  · "${f.text.slice(0, 300).replace(/\s+/g, ' ')}"`).join('\n');
    return `[${i + 1}] Documento: "${c.documentName}" (fuente: ${c.source})\nFragmentos similares encontrados:\n${fragsText}`;
  }).join('\n\n');

  const prompt = `Eres un auditor de documentación corporativa. Tu tarea es decidir cuáles de estos documentos candidatos merecen un análisis profundo contra un documento nuevo.

DOCUMENTO NUEVO: "${newDocumentName}"
Muestra del documento nuevo:
"""
${newDocumentSample.slice(0, 3000)}
"""

DOCUMENTOS CANDIDATOS (recuperados por similitud de embeddings):
${candidatesBlock}

INSTRUCCIONES:
- Un candidato merece análisis profundo SOLO si hay probabilidad real de que contenga contenido solapado, duplicado o contradictorio con el nuevo.
- Compartir un tema general (ambos hablan de "RRHH", "técnica", "ventas") NO es suficiente. Debe haber indicios de contenido concreto coincidente.
- Sé estricto. Es preferible descartar un candidato dudoso que inflar la lista con ruido.
- Máximo 6 seleccionados. Si ninguno merece análisis, devuelve selected: [].

Responde EXCLUSIVAMENTE con este JSON, sin texto adicional:
{
  "selected": [
    {
      "documentId": "<id exacto del documento, lo extraes de la muestra mental>",
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
    return selected.slice(0, 10);
  } catch (err) {
    console.warn('[rerank] LLM failed, falling back to top-3 by embedding score:', err);
    return candidates.slice(0, 3).map(c => ({
      documentId: c.documentId,
      documentName: c.documentName,
      source: c.source,
      fragments: c.fragments,
      rerankReason: 'Fallback: rerank LLM falló, seleccionado por score de embedding',
      rerankConfidence: 'baja',
    }));
  }
}
