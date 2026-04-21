import { callLLMJson } from './llm-client';
import type { DiscrepancyConfidence } from './types';

/**
 * Fase 5 — Doble verificación LLM.
 *
 * Cada contradicción detectada por Haiku (pipeline v2 + verificación atómica)
 * se pasa a Sonnet para una segunda opinión.
 *
 * - Ambos coinciden → alta confianza.
 * - Solo Haiku la detectó, Sonnet no confirma → "posible contradicción".
 * - Nunca se descarta: en el peor caso baja de confianza, no desaparece.
 *
 * Esto reduce falsos positivos sin perder detección.
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

interface VerifyResponse {
  isContradiction: boolean;
  reason: string;
}

/** Tamaño del lote de verificaciones paralelas. */
const VERIFY_BATCH_SIZE = 5;

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

  for (let batchStart = 0; batchStart < discrepancies.length; batchStart += VERIFY_BATCH_SIZE) {
    const batch = discrepancies.slice(batchStart, batchStart + VERIFY_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(d => verifySingleContradiction(d))
    );
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

async function verifySingleContradiction(discrepancy: Discrepancy): Promise<DoubleCheckedDiscrepancy> {
  const prompt = `Eres un verificador de contradicciones en documentación corporativa. Un primer auditor ha detectado una posible contradicción entre dos documentos. Tu tarea es confirmar o desmentir.

POSIBLE CONTRADICCIÓN DETECTADA:
- Tema: ${discrepancy.topic}
- Documento nuevo dice: "${discrepancy.newDocSays}"
- Documento existente ("${discrepancy.existingDocument}") dice: "${discrepancy.existingDocSays}"

INSTRUCCIONES:
- Marca isContradiction=true SOLO si ambas afirmaciones se refieren al MISMO dato concreto y dicen cosas incompatibles.
- Diferencias de redacción o nivel de detalle NO son contradicciones.
- Si una afirmación es más general y la otra más específica pero compatibles, NO es contradicción.
- Si no puedes determinar si se refieren al mismo dato, marca isContradiction=false.

Responde EXCLUSIVAMENTE con este JSON:
{
  "isContradiction": true | false,
  "reason": "<una frase explicando tu veredicto>"
}`;

  try {
    const response = await callLLMJson<VerifyResponse>(prompt, {
      maxOutputTokens: 256,
      temperature: 0.1,
      model: 'sonnet',
    });

    return {
      topic: discrepancy.topic,
      newDocSays: discrepancy.newDocSays,
      existingDocSays: discrepancy.existingDocSays,
      existingDocument: discrepancy.existingDocument,
      confidence: response.isContradiction ? 'alta' : 'posible',
    };
  } catch (err) {
    console.warn(`[double-check] Sonnet falló para "${discrepancy.topic}":`, err);
    // Si Sonnet falla, no descartamos: la dejamos como "posible"
    return {
      topic: discrepancy.topic,
      newDocSays: discrepancy.newDocSays,
      existingDocSays: discrepancy.existingDocSays,
      existingDocument: discrepancy.existingDocument,
      confidence: 'posible',
    };
  }
}
