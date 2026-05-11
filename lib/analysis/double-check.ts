import { callLLMJson } from './llm-client';
import type { DiscrepancyConfidence } from './types';

/**
 * Fase 5 — Doble verificación LLM (progresiva).
 *
 * Las contradicciones detectadas por Haiku se verifican con Sonnet
 * en lotes progresivos. Se detiene cuando se alcanzan suficientes
 * confirmadas, ahorrando coste en las restantes.
 *
 * - Ambos coinciden → alta confianza.
 * - Solo Haiku la detectó, Sonnet no confirma → "posible".
 * - Nunca se descarta: en el peor caso baja de confianza.
 */

/** Contradicción con confianza asignada tras doble verificación. */
export interface DoubleCheckedDiscrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  confidence: DiscrepancyConfidence;
  severity?: 'contradiction' | 'minor_inconsistency';
}

interface Discrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  confidence?: DiscrepancyConfidence;
  severity?: 'contradiction' | 'minor_inconsistency';
}

interface BatchVerifyResponse {
  results: Array<{
    index: number;
    isContradiction: boolean;
    severity: 'contradiction' | 'minor_inconsistency' | 'none';
    reason: string;
  }>;
}

/** Tamaño de cada lote enviado a Sonnet. */
const FIRST_BATCH_SIZE = 15;

/** Tamaño del segundo lote (backup). */
const SECOND_BATCH_SIZE = 10;

/** Pausa entre lotes para evitar 429. */
const DELAY_BETWEEN_BATCHES_MS = 1000;

/**
 * Verifica contradicciones con Sonnet de forma progresiva.
 *
 * @param discrepancies - Candidatas a verificar (hasta 30).
 * @param targetConfirmed - Número objetivo de confirmadas. Si se alcanza
 *   con el primer lote, no se envía el segundo. 0 = verificar todas.
 * @param excludeFingerprints - Huellas de contradicciones ya descartadas
 *   en reanálisis anteriores. Se saltan sin enviar a Sonnet.
 */
export async function doubleCheckContradictions(
  discrepancies: Discrepancy[],
  targetConfirmed: number = 0,
  excludeFingerprints: Set<string> = new Set(),
): Promise<DoubleCheckedDiscrepancy[]> {
  if (discrepancies.length === 0) return [];

  const t0 = Date.now();

  // Separar candidatas nuevas de las ya descartadas anteriormente
  const newCandidates: Discrepancy[] = [];
  const skippedAsAlreadyDismissed: DoubleCheckedDiscrepancy[] = [];

  for (const d of discrepancies) {
    const fp = makeDiscrepancyFingerprint(d);
    if (excludeFingerprints.has(fp)) {
      // Ya fue descartada antes → marcar como posible sin gastar Sonnet
      skippedAsAlreadyDismissed.push({
        topic: d.topic,
        newDocSays: d.newDocSays,
        existingDocSays: d.existingDocSays,
        existingDocument: d.existingDocument,
        confidence: 'posible',
      });
    } else {
      newCandidates.push(d);
    }
  }

  if (newCandidates.length === 0) {
    console.log(`[double-check] Todas las ${discrepancies.length} candidatas ya fueron descartadas anteriormente (${Date.now() - t0}ms)`);
    return skippedAsAlreadyDismissed;
  }

  // Verificación progresiva: primer lote de 20, segundo de 10 si hace falta
  const allResults: DoubleCheckedDiscrepancy[] = [];
  let confirmedSoFar = 0;

  // Primer lote
  const firstBatch = newCandidates.slice(0, FIRST_BATCH_SIZE);
  const firstResults = await verifyBatch(firstBatch);
  allResults.push(...firstResults);
  confirmedSoFar = firstResults.filter(r => r.confidence === 'alta').length;

  console.log(`[double-check] Lote 1: ${firstBatch.length} verificadas, ${confirmedSoFar} confirmadas`);

  if (targetConfirmed === 0) {
    // Modo exhaustivo: verificar TODAS las candidatas restantes en lotes sucesivos
    let offset = FIRST_BATCH_SIZE;
    while (offset < newCandidates.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
      const batch = newCandidates.slice(offset, offset + FIRST_BATCH_SIZE);
      const results = await verifyBatch(batch);
      allResults.push(...results);
      const batchConfirmed = results.filter(r => r.confidence === 'alta').length;
      confirmedSoFar += batchConfirmed;
      console.log(`[double-check] Lote adicional (${offset}–${offset + batch.length}): ${batch.length} verificadas, ${batchConfirmed} confirmadas`);
      offset += FIRST_BATCH_SIZE;
    }
  } else {
    // Modo rápido: segundo lote solo si no se alcanzó el objetivo
    const needsMore = confirmedSoFar < targetConfirmed;
    const hasMore = newCandidates.length > FIRST_BATCH_SIZE;

    if (needsMore && hasMore) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
      const secondBatch = newCandidates.slice(FIRST_BATCH_SIZE, FIRST_BATCH_SIZE + SECOND_BATCH_SIZE);
      const secondResults = await verifyBatch(secondBatch);
      allResults.push(...secondResults);
      const newConfirmed = secondResults.filter(r => r.confidence === 'alta').length;
      confirmedSoFar += newConfirmed;
      console.log(`[double-check] Lote 2: ${secondBatch.length} verificadas, ${newConfirmed} confirmadas (total: ${confirmedSoFar})`);
    }
  }

  // Combinar resultados verificados + los descartados anteriormente
  const finalResults = [...allResults, ...skippedAsAlreadyDismissed];

  const totalConfirmed = finalResults.filter(r => r.confidence === 'alta').length;
  const totalPossible = finalResults.filter(r => r.confidence === 'posible').length;
  console.log(`[double-check] ${finalResults.length} totales: ${totalConfirmed} confirmadas, ${totalPossible} posibles (${skippedAsAlreadyDismissed.length} saltadas por memoria) (${Date.now() - t0}ms)`);

  return finalResults;
}

/**
 * Genera huella para una discrepancia.
 * Combina el texto del documento nuevo + nombre del documento del corpus.
 * Si el texto cambia o se compara con otro documento, es una huella diferente.
 */
export function makeDiscrepancyFingerprint(d: { newDocSays: string; existingDocument: string }): string {
  const textNorm = d.newDocSays
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?""''«»()[\]{}]/g, '')
    .trim()
    .slice(0, 80);
  const docNorm = d.existingDocument.toLowerCase().trim();
  return `${docNorm}|${textNorm}`;
}

// ============================================================
// Internos
// ============================================================

async function verifyBatch(batch: Discrepancy[]): Promise<DoubleCheckedDiscrepancy[]> {
  const contradictionsBlock = batch
    .map((d, i) => `[${i + 1}] Tema: ${d.topic}
   Documento nuevo dice: "${d.newDocSays}"
   Documento existente ("${d.existingDocument}") dice: "${d.existingDocSays}"`)
    .join('\n\n');

  const prompt = `Eres un verificador de contradicciones en documentación corporativa. Un primer auditor ha detectado ${batch.length} posibles contradicciones entre documentos. Tu tarea es confirmar o desmentir CADA UNA con criterio estricto.

POSIBLES CONTRADICCIONES:
${contradictionsBlock}

INSTRUCCIONES:
- Marca isContradiction=true SOLO si es IMPOSIBLE que ambas afirmaciones sean verdaderas a la vez. Deben referirse al MISMO dato concreto (cifra, plazo, política, responsable, definición) y decir cosas incompatibles.
- EN CASO DE DUDA, marca isContradiction=false. Es preferible dejar pasar una contradicción dudosa que marcar un falso positivo.
- Si una es más general y la otra más específica pero compatibles, NO es contradicción.
- Diferencias de redacción, énfasis o perspectiva NO son contradicciones.
- Si ambas pueden ser verdaderas en contextos diferentes, NO es contradicción.
- Para las que NO son contradicción, indica si es una "inconsistencia menor" (diferencia de enfoque o matiz que el usuario podría querer revisar) con el campo severity.
- Debes evaluar TODAS las contradicciones listadas, del 1 al ${batch.length}.

Responde EXCLUSIVAMENTE con este JSON:
{
  "results": [
    { "index": 1, "isContradiction": true, "severity": "contradiction", "reason": "frase corta" },
    { "index": 2, "isContradiction": false, "severity": "minor_inconsistency", "reason": "frase corta" },
    { "index": 3, "isContradiction": false, "severity": "none", "reason": "frase corta" }
  ]
}`;

  try {
    const response = await callLLMJson<BatchVerifyResponse>(prompt, {
      maxOutputTokens: 4096,
      temperature: 0.1,
      model: 'sonnet',
    });

    const resultMap = new Map<number, { isContradiction: boolean; severity?: string }>();
    for (const r of response.results || []) {
      if (typeof r.index === 'number' && typeof r.isContradiction === 'boolean') {
        resultMap.set(r.index, { isContradiction: r.isContradiction, severity: r.severity });
      }
    }

    return batch.map((d, i) => {
      const result = resultMap.get(i + 1);
      const isContradiction = result?.isContradiction ?? false;
      const sev = result?.severity;
      return {
        topic: d.topic,
        newDocSays: d.newDocSays,
        existingDocSays: d.existingDocSays,
        existingDocument: d.existingDocument,
        confidence: (isContradiction ? 'alta' : 'posible') as DiscrepancyConfidence,
        ...(sev && sev !== 'none' ? { severity: sev as 'contradiction' | 'minor_inconsistency' } : {}),
      };
    });
  } catch (err) {
    console.warn(`[double-check] Sonnet falló para lote de ${batch.length} contradicciones:`, err);
    return batch.map(d => ({
      topic: d.topic,
      newDocSays: d.newDocSays,
      existingDocSays: d.existingDocSays,
      existingDocument: d.existingDocument,
      confidence: 'posible' as DiscrepancyConfidence,
      severity: d.severity,
    }));
  }
}
