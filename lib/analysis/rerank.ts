import { recordStageFailure } from './stage-failures';
import { callLLMJson } from './llm-client';
import { ordenarParaCortar, normalizarConfianza, contarSinConfianza } from './orden-del-rerank';
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
const MAX_SELECTED_EXHAUSTIVE = 25;

export async function rerankCandidates(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: CandidateDocument[];
  options?: PipelineOptions;
}): Promise<{ seleccionados: RerankedCandidate[]; sinConfianza: number }> {
  const { newDocumentName, newDocumentSample, candidates, options } = args;
  const isExhaustive = options?.exhaustive === true;
  const maxSelected = isExhaustive ? MAX_SELECTED_EXHAUSTIVE : MAX_SELECTED_QUICK;

  if (candidates.length === 0) return { seleccionados: [], sinConfianza: 0 };

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
        // ⚠️ YA NO ES `|| 'media'`. Ver orden-del-rerank.ts: convertir la
        // ausencia en el nivel intermedio era inventarse la valoración que
        // falta, y encima con un valor que ya significaba otra cosa.
        rerankConfidence: normalizarConfianza(sel.confidence),
      });
    }

    // ⚠️ SE ORDENA ANTES DE CORTAR. Hasta el 16/09/2026 esto era
    // `selected.slice(0, maxSelected)` sobre el orden en que el modelo los
    // enumeró: el corte podía tirar una `alta` y quedarse una `baja`, y además
    // no era reproducible — el orden lo decidía la salida del modelo.
    const ordenados = ordenarParaCortar(selected);
    return {
      seleccionados: ordenados.slice(0, maxSelected),
      // Se cuenta sobre TODOS los que llegaron, no sobre los que sobreviven al
      // corte: lo que se quiere saber es si la señal existe, no si sobrevivió.
      sinConfianza: contarSinConfianza(selected),
    };
  } catch (err) {
    console.warn('[rerank] LLM failed, falling back to top candidates by embedding score:', err);
    recordStageFailure('rerank', err);
    // Fallback: en exhaustivo top 5, en rápido top 3
    const fallbackCount = isExhaustive ? 5 : 3;
    const fallbackCandidates = candidates.slice(0, fallbackCount);
    // ⚠️ EL FALLBACK NO PASA POR `ordenarParaCortar`, Y ES CORRECTO: aquí no
    // hay ninguna confianza que ordenar —el modelo no contestó— y
    // `candidates` ya viene del retrieval. Lo que sí se declara es que todos
    // salen `baja`: es una valoración que NADIE hizo, así que se marca como
    // el nivel más bajo y no como `sin_declarar`, que significaría «el modelo
    // no lo dijo» cuando aquí el modelo ni siquiera llegó a hablar.
    return {
      seleccionados: fallbackCandidates.map(c => ({
        documentId: c.documentId,
        documentName: c.documentName,
        source: c.source,
        fragments: c.fragments,
        rerankReason: 'Fallback: rerank LLM falló, seleccionado por score de embedding',
        rerankConfidence: 'baja' as const,
      })),
      // Cero, y no «todos»: `sin_declarar` cuenta al modelo que no valoró. Aquí
      // no hubo modelo, y eso ya lo cuenta `averia` por la vía de stage-failures.
      sinConfianza: 0,
    };
  }
}
