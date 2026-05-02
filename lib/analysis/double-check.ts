import { callLLMJson } from './llm-client';
import type { DiscrepancyConfidence } from './types';

/**
 * Fase 5 — Doble verificación LLM.
 *
 * Las contradicciones detectadas por Haiku (pipeline v2 + verificación atómica)
 * se pasan a Sonnet para una segunda opinión.
 *
 * - Ambos coinciden → alta confianza.
 * - Solo Haiku la detectó, Sonnet no confirma → "posible contradicción".
 * - Nunca se descarta: en el peor caso baja de confianza, no desaparece.
 *
 * OPTIMIZACIÓN (mayo 2026): en vez de una llamada a Sonnet por contradicción,
 * se envían lotes de hasta BATCH_SIZE contradicciones en una sola llamada.
 * Esto reduce de ~50 llamadas a 3-4, ahorrando tiempo y coste.
 */

/** Contradicción con confianza asignada tras doble verificación. */
export interface DoubleCheckedDiscrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  confidence: DiscrepancyConfidence;
}

interface Discrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  confidence?: DiscrepancyConfidence;
}

interface BatchVerifyResponse {
  results: Array<{
    index: number;
    isContradiction: boolean;
    reason: string;
  }>;
}

/**
 * Máximo de contradicciones por lote enviado a Sonnet.
 * 15 es un buen equilibrio: caben sobradamente en el contexto de Sonnet
 * y el JSON de respuesta no se trunca.
 */
const BATCH_SIZE = 15;

/** Pausa entre lotes para evitar 429. */
const DELAY_BETWEEN_BATCHES_MS = 1000;

/**
 * Verifica todas las contradicciones con un segundo modelo (Sonnet).
 * Las contradicciones confirmadas obtienen confianza 'alta',
 * las no confirmadas obtienen 'posible'. Ninguna se descarta.
 */
export async function doubleCheckContradictions(
  discrepancies: Discrepancy[],
): Promise<DoubleCheckedDiscrepancy[]> {
  if (discrepancies.length === 0) return [];

  const t0 = Date.now();
  const results: DoubleCheckedDiscrepancy[] = [];

  // Procesar en lotes de BATCH_SIZE
  for (let batchStart = 0; batchStart < discrepancies.length; batchStart += BATCH_SIZE) {
    // Pausa entre lotes (no antes del primero)
    if (batchStart > 0) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }

    const batch = discrepancies.slice(batchStart, batchStart + BATCH_SIZE);
    const batchResults = await verifyBatch(batch, batchStart);
    results.push(...batchResults);
  }

  const confirmed = results.filter(r => r.confidence === 'alta').length;
  const possible = results.filter(r => r.confidence === 'posible').length;
  console.log(`[double-check] ${discrepancies.length} contradicciones verificadas: ${confirmed} confirmadas, ${possible} posibles (${Date.now() - t0}ms)`);

  return results;
}

// ============================================================
// Internos
// ============================================================

/**
 * Verifica un lote de contradicciones en una sola llamada a Sonnet.
 * Si la llamada falla, todas las contradicciones del lote quedan como "posible".
 */
async function verifyBatch(
  batch: Discrepancy[],
  globalOffset: number,
): Promise<DoubleCheckedDiscrepancy[]> {
  // Construir el bloque de contradicciones numeradas
  const contradictionsBlock = batch
    .map((d, i) => `[${i + 1}] Tema: ${d.topic}
   Documento nuevo dice: "${d.newDocSays}"
   Documento existente ("${d.existingDocument}") dice: "${d.existingDocSays}"`)
    .join('\n\n');

  const prompt = `Eres un verificador de contradicciones en documentación corporativa. Un primer auditor ha detectado ${batch.length} posibles contradicciones entre documentos. Tu tarea es confirmar o desmentir CADA UNA.

POSIBLES CONTRADICCIONES:
${contradictionsBlock}

INSTRUCCIONES:
- Para cada contradicción, marca isContradiction=true SOLO si ambas afirmaciones se refieren al MISMO dato concreto y dicen cosas incompatibles.
- Diferencias de redacción o nivel de detalle NO son contradicciones.
- Si una afirmación es más general y la otra más específica pero compatibles, NO es contradicción.
- Si no puedes determinar si se refieren al mismo dato, marca isContradiction=false.
- Debes evaluar TODAS las contradicciones listadas, del 1 al ${batch.length}.

Responde EXCLUSIVAMENTE con este JSON:
{
  "results": [
    { "index": 1, "isContradiction": true, "reason": "<una frase corta>" },
    { "index": 2, "isContradiction": false, "reason": "<una frase corta>" }
  ]
}`;

  try {
    const response = await callLLMJson<BatchVerifyResponse>(prompt, {
      maxOutputTokens: 4096,
      temperature: 0.1,
      model: 'sonnet',
    });

    // Construir un mapa de resultados por índice (1-based)
    const resultMap = new Map<number, boolean>();
    for (const r of response.results || []) {
      if (typeof r.index === 'number' && typeof r.isContradiction === 'boolean') {
        resultMap.set(r.index, r.isContradiction);
      }
    }

    // Asignar confianza a cada contradicción del lote
    return batch.map((d, i) => {
      const confirmed = resultMap.get(i + 1);
      return {
        topic: d.topic,
        newDocSays: d.newDocSays,
        existingDocSays: d.existingDocSays,
        existingDocument: d.existingDocument,
        // Si Sonnet confirma → alta; si niega o no respondió → posible (nunca se descarta)
        confidence: (confirmed === true ? 'alta' : 'posible') as DiscrepancyConfidence,
      };
    });
  } catch (err) {
    console.warn(`[double-check] Sonnet falló para lote de ${batch.length} contradicciones:`, err);
    // Si Sonnet falla, no descartamos: todas quedan como "posible"
    return batch.map(d => ({
      topic: d.topic,
      newDocSays: d.newDocSays,
      existingDocSays: d.existingDocSays,
      existingDocument: d.existingDocument,
      confidence: 'posible' as DiscrepancyConfidence,
    }));
  }
}
