import { recordStageFailure } from './stage-failures';
import { callLLMJson } from './llm-client';
import type { DiscrepancyConfidence, ConfirmedBy, ComparedValue, DiscardedFindings } from './types';

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

/**
 * Por qué Sonnet aquí y Haiku en el juez (F-34): no es que Sonnet verifique
 * mejor, es que responde a otra pregunta. El verificador de hallazgos —el que
 * corre en los dos modos, antes de la síntesis— es un FILTRO DE VOLUMEN en el
 * camino barato: descarta hallazgos malformados mirando dos citas aisladas, y
 * eso Haiku lo hace bien porque el fallo del juez es de POSTURA (le muestran
 * 6.000 caracteres y le piden buscar), no de capacidad. Este double-check es
 * un SELLO DE CALIDAD en el camino caro: la última palabra sobre hallazgos que
 * ya pasaron todo lo demás, y su valor está en que un modelo distinto y
 * superior confirme antes de dar máxima confianza.
 * Filtro barato, sello caro.
 */

/** Contradicción con confianza asignada tras doble verificación. */
export interface DoubleCheckedDiscrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  confidence: DiscrepancyConfidence;
  severity?: 'contradiction' | 'minor_inconsistency';
  confirmedBy?: ConfirmedBy;
  /** F-69: se arrastra tal cual. Sonnet decide CONFIANZA y SEVERIDAD, no qué
   *  columna difiere — eso lo estableció la capa determinista mucho antes y
   *  no se revisa aquí. Sin esta línea el campo moriría en el modo exhaustivo,
   *  que es justo el único donde la ficha detallada se pinta. */
  columns?: string[];
  /** F-70: los valores enfrentados y las dos filas completas, arrastrados sin
   *  tocar. Sonnet decide confianza y severidad; qué vale cada celda es un
   *  hecho medido por la capa determinista mucho antes, no un veredicto suyo. */
  comparedValues?: ComparedValue[];
  newDocRow?: string;
  existingDocRow?: string;
}

interface Discrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  confidence?: DiscrepancyConfidence;
  severity?: 'contradiction' | 'minor_inconsistency';
  confirmedBy?: ConfirmedBy;
  columns?: string[];
  comparedValues?: ComparedValue[];
  newDocRow?: string;
  existingDocRow?: string;
}

/**
 * F-71 paso 1: el resultado deja de ser el array pelado. La regla que este
 * paso hace cierta — «un hallazgo sale publicado o sale contado, ninguna
 * tercera puerta» — necesita que lo que se pierde aquí dentro salga con él.
 * Mismo patrón que VerifyFindingsResult (verify-findings.ts:110-115): las
 * claves son compatibles con DiscardedFindings y el llamador las funde.
 */
export interface DoubleCheckResult {
  results: DoubleCheckedDiscrepancy[];
  counts: DiscardedFindings;
  /** Las que se saltaron por tener huella en excludeFingerprints. Van aparte
   *  —aunque estén también dentro de `results`— porque el llamador necesita
   *  distinguirlas al calcular el resto: ya tienen su motivo propio
   *  (`exhaustivo.huella_ya_descartada`) y contarlas otra vez como «sin
   *  destino» sería contarlas dos veces y mentir sobre lo que pasó. */
  alreadyDismissed: DoubleCheckedDiscrepancy[];
}

function bump(counts: DiscardedFindings, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
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
): Promise<DoubleCheckResult> {
  if (discrepancies.length === 0) return { results: [], counts: {}, alreadyDismissed: [] };

  const t0 = Date.now();
  // F-71 paso 1: recuento de todo lo que se pierde o se degrada aquí dentro.
  // Sale por el return en vez de por AsyncLocalStorage porque esta función
  // tiene UN llamador (pipeline.ts) y el patrón de `counts` en el resultado ya
  // existe en el proyecto — ver VerifyFindingsResult en verify-findings.ts.
  const counts: DiscardedFindings = {};

  // Separar candidatas nuevas de las ya descartadas anteriormente
  const newCandidates: Discrepancy[] = [];
  const skippedAsAlreadyDismissed: DoubleCheckedDiscrepancy[] = [];

  for (const d of discrepancies) {
    const fp = makeDiscrepancyFingerprint(d);
    if (excludeFingerprints.has(fp)) {
      // Ya fue descartada antes → marcar como posible sin gastar Sonnet.
      //
      // F-71 paso 1 [3]: la lista cerrada de cinco campos que había aquí —la
      // CUARTA de este fichero, no contada en d384a315— tiraba severity,
      // confirmedBy, columns, comparedValues y las dos filas. Se abre, pero
      // NO del todo, y la excepción no es obvia:
      //
      //   `severity: undefined` A PROPÓSITO. Un hallazgo con huella en
      //   excludeFingerprints ya recibió el veredicto del USUARIO ("No es
      //   error"). Conservar columns, comparedValues y las filas es recuperar
      //   datos verificados que no deciden nada. Conservar `severity` sería
      //   devolverle al sistema la capacidad de REPUBLICARLO por otra sección:
      //   con severity 'minor_inconsistency' pasaría el segundo filtro de
      //   pipeline.ts y reaparecería en minorInconsistencies. Eso contradice
      //   F-67 —la legitimidad de una divergencia la decide el usuario, no el
      //   sistema, y el "No es error" de la bandeja es la otra mitad de esa
      //   regla—. El sistema no reabre lo que el usuario cerró.
      skippedAsAlreadyDismissed.push({ ...d, confidence: 'posible', severity: undefined });
      bump(counts, 'exhaustivo.huella_ya_descartada');
      console.log(`[double-check] · huella ya descartada: "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
    } else {
      newCandidates.push(d);
    }
  }

  if (newCandidates.length === 0) {
    console.log(`[double-check] Todas las ${discrepancies.length} candidatas ya fueron descartadas anteriormente (${Date.now() - t0}ms)`);
    return { results: skippedAsAlreadyDismissed, counts, alreadyDismissed: skippedAsAlreadyDismissed };
  }

  // Verificación progresiva: primer lote de 20, segundo de 10 si hace falta
  const allResults: DoubleCheckedDiscrepancy[] = [];
  let confirmedSoFar = 0;

  // Primer lote
  const firstBatch = newCandidates.slice(0, FIRST_BATCH_SIZE);
  const firstResults = await verifyBatch(firstBatch, counts);
  allResults.push(...firstResults);
  confirmedSoFar = firstResults.filter(r => r.confidence === 'alta').length;

  console.log(`[double-check] Lote 1: ${firstBatch.length} verificadas, ${confirmedSoFar} confirmadas`);

  if (targetConfirmed === 0) {
    // Modo exhaustivo: verificar TODAS las candidatas restantes en lotes sucesivos
    let offset = FIRST_BATCH_SIZE;
    while (offset < newCandidates.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
      const batch = newCandidates.slice(offset, offset + FIRST_BATCH_SIZE);
      const results = await verifyBatch(batch, counts);
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
      const secondResults = await verifyBatch(secondBatch, counts);
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

  return { results: finalResults, counts, alreadyDismissed: skippedAsAlreadyDismissed };
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

async function verifyBatch(batch: Discrepancy[], counts: DiscardedFindings): Promise<DoubleCheckedDiscrepancy[]> {
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
TIPOS QUE SÍ SON CONTRADICCIÓN (marca isContradiction=true):
- Listas con diferente número de elementos sobre el mismo concepto (omisión de elementos clave).
- Definiciones que usan términos técnicamente diferentes para el mismo concepto (sustitución de términos).
- Afirmaciones absolutas ("todo", "siempre", "completamente") cuando el original usa matices ("algunos", "puede", "tiende a").
- Degradar algo que el original presenta como fundamental a "secundario" o "menor".
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
      // F-71 paso 1 [4]: Sonnet puede no devolver un índice. Antes eso caía en
      // el `?? false` de abajo sin dejar rastro: la candidata salía 'posible' y
      // SIN severity, la combinación que no entra en ninguno de los dos filtros
      // finales. Se sigue tratando igual — no se cambia la decisión — pero se
      // cuenta y se dice cuál fue.
      if (result === undefined) {
        bump(counts, 'exhaustivo.indice_omitido_por_sonnet');
        console.warn(`[double-check] · Sonnet omitió el índice ${i + 1}: "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
      }
      const isContradiction = result?.isContradiction ?? false;
      const sev = result?.severity;
      return {
        topic: d.topic,
        newDocSays: d.newDocSays,
        existingDocSays: d.existingDocSays,
        existingDocument: d.existingDocument,
        confidence: (isContradiction ? 'alta' : 'posible') as DiscrepancyConfidence,
        ...(sev && sev !== 'none' ? { severity: sev as 'contradiction' | 'minor_inconsistency' } : {}),
        ...(isContradiction ? { confirmedBy: 'double_check' as ConfirmedBy } : {}),
        ...(d.columns ? { columns: d.columns } : {}),
        ...(d.comparedValues ? { comparedValues: d.comparedValues } : {}),
        ...(d.newDocRow !== undefined ? { newDocRow: d.newDocRow } : {}),
        ...(d.existingDocRow !== undefined ? { existingDocRow: d.existingDocRow } : {}),
      };
    });
  } catch (err) {
    console.warn(`[double-check] Sonnet falló para lote de ${batch.length} contradicciones:`, err);
    recordStageFailure('double-check', err);
    // F-71 paso 1 [5]: además del stageFailure (que ya dispara el reembolso),
    // una entrada por candidata del lote — el stageFailure dice que la etapa
    // cayó, este contador dice a cuántos hallazgos les costó su veredicto.
    for (const d of batch) {
      bump(counts, 'exhaustivo.lote_sin_veredicto');
      console.warn(`[double-check] · sin veredicto por fallo del lote: "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
    }
    return batch.map(d => ({
      topic: d.topic,
      newDocSays: d.newDocSays,
      existingDocSays: d.existingDocSays,
      existingDocument: d.existingDocument,
      confidence: 'posible' as DiscrepancyConfidence,
      severity: d.severity,
      ...(d.columns ? { columns: d.columns } : {}),
      ...(d.comparedValues ? { comparedValues: d.comparedValues } : {}),
      ...(d.newDocRow !== undefined ? { newDocRow: d.newDocRow } : {}),
      ...(d.existingDocRow !== undefined ? { existingDocRow: d.existingDocRow } : {}),
    }));
  }
}
