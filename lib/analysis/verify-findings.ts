import { recordStageFailure } from './stage-failures';
import { callLLMJson } from './llm-client';
import { runInBatches } from '@/lib/run-in-batches';
import type { StoredChunk } from '@/lib/read-chunks';
import type { DiscardedFindings } from './types';

/**
 * Verificador de hallazgos — la llamada corta (F-22/F-23/F-34).
 *
 * INERTE: nadie llama a verifyFindings todavía. Enchufarlo (los dos puntos de
 * F-24 P2: entre juez y síntesis en runCorePipeline, y sobre el camino atómico
 * antes de fusionar en mergedDiscrepancies) es un commit posterior.
 *
 * POR QUÉ EXISTE (F-22): "una única pasada de generación no puede vigilarse a
 * sí misma". Al juez se le muestran hasta 6.000 caracteres del documento nuevo
 * y se le pide BUSCAR solapamientos y contradicciones — en esa postura, buscar
 * gana, y de ahí los siete falsos positivos documentados en
 * claude/Consulta_Fable_F22_Juez.md. Esta llamada invierte la postura: dos
 * citas ya localizadas, un título, contexto vecino, y una sola pregunta —
 * "¿se oponen sobre el mismo dato?". Nada que invite a encontrar.
 *
 * MODELO: Haiku, no Sonnet (F-34). El fallo del juez es de postura, no de
 * capacidad — ver el comentario de lib/analysis/double-check.ts, que es la
 * pieza hermana con la postura contraria (sello de calidad en el camino caro,
 * de la misma manera que esta es un filtro de volumen en el barato).
 *
 * POR LOTES, no un hallazgo por llamada: lo que F-22 protegía era el
 * aislamiento POR HALLAZGO (cada uno se juzga con sus propias dos citas y su
 * propio contexto, sin ver los demás), no el aislamiento por llamada — un lote
 * lo conserva mientras cada elemento lleve su propio contexto y el prompt exija
 * veredicto elemento a elemento, igual que hace double-check.ts hoy.
 *
 * DEGRADACIÓN SEGURA: si el modelo devuelve menos veredictos de los que se le
 * pidieron, los huérfanos NUNCA se aprueban por silencio — salen con veredicto
 * 'sin_relacion' (el más conservador de los tres) y se cuentan aparte
 * (descartado.sin_veredicto), para poder distinguir "el modelo dijo que no
 * están relacionados" de "el modelo no contestó". Mismo mecanismo que
 * doubleCheckContradictions, adaptado a tres veredictos en vez de dos.
 *
 * CONTEO POR MOTIVO (F-34 P4): las claves llevan prefijo para poder fusionarse
 * sin colisión con lo que cuenten otras capas —
 *   descartado.*  → el hallazgo muere aquí (verdict !== 'confirmado', o sin
 *                   respuesta del modelo).
 *   degradado.*   → se verificó igualmente, pero a uno de los dos lados le
 *                   faltaba el chunk (documento sin persistir en F-20, o
 *                   verifyQuote cayó al fallback de texto plano): sin chunk no
 *                   hay ni celdas ni vecinos que mostrar, así que la
 *                   verificación se hizo solo con la cita pelada.
 * Los motivos "a_juicio.*" (columna_indeterminada, chunk_no_localizado) NO se
 * generan aquí: describen por qué la capa determinista (finding-rules.ts) no
 * pudo decidir y reenvió el hallazgo a esta llamada — es responsabilidad de
 * quien la invoque (el futuro punto de enganche), no de esta función, que no
 * conoce ni llama a applyDeterministicRules. Por el mismo motivo tampoco se
 * generan aquí descartado.sin_columna_comun ni descartado.sin_dato_comun: son
 * motivos de la capa determinista, no de esta.
 *
 * Sin suelo de tamaño de lote por caracteres: MAX_PER_CALL es un tope por
 * CANTIDAD (15, como double-check), no por bytes de prompt. Un lote de 15 con
 * filas anchas y mucho contexto vecino puede pesar más que uno de 15 líneas de
 * prosa corta — dividir también por tamaño real de prompt queda para cuando
 * haya datos de producción con los que calibrar un umbral, no antes.
 */

/** Contexto textual inmediato de una cita: el chunk anterior y posterior en el
 *  mismo documento y generación (mismo dato que FragmentContext.previousText/
 *  nextText, con nombres propios porque este fichero no depende de
 *  fragment-context.ts). null si no hay vecino (extremo del documento) o si no
 *  hay chunk del que partir. */
export interface FindingNeighbours {
  previous: string | null;
  next: string | null;
}

/** Un hallazgo del juez, ya con su chunk localizado (paso 2a) y sus vecinos
 *  cargados, listo para verificar. newChunk/existingChunk son null cuando
 *  verifyQuote no pudo asociar un chunk (documento sin persistir en F-20, o
 *  camino de fallback por texto plano) — la verificación sigue siendo posible
 *  sobre la cita sola, pero queda contada como degradada. */
export interface FindingToVerify {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocumentName: string;
  newChunk: StoredChunk | null;
  existingChunk: StoredChunk | null;
  newNeighbours: FindingNeighbours;
  existingNeighbours: FindingNeighbours;
  /** F-51: orden real de columnas de la tabla de newChunk/existingChunk (si
   *  son filas de tabla), resuelto por quien construye este objeto —
   *  describeSide no tiene el docChunks completo para llamar a
   *  getOrderedColumns por sí solo. null si no aplica (no es fila de tabla)
   *  o no se pudo determinar. */
  newColumnOrder: string[] | null;
  existingColumnOrder: string[] | null;
}

export type FindingVerdict = 'confirmado' | 'mismo_dato_sin_oposicion' | 'sin_relacion';

/** Resultado de un hallazgo, en el MISMO orden que el array de entrada — el
 *  emparejamiento con FindingToVerify es por posición, no por ningún id. */
export interface VerifiedFinding {
  verdict: FindingVerdict;
  /** Solo presente cuando verdict === 'confirmado': para los otros dos
   *  veredictos el hallazgo se descarta y la severity original deja de
   *  importar. */
  severity?: 'contradiction' | 'minor_inconsistency';
}

export interface VerifyFindingsResult {
  results: VerifiedFinding[];
  /** Compatible con DiscardedFindings tal cual: mismo Record<string, number>,
   *  para que quien enchufe esto pueda fusionarlo sin transformación con lo
   *  que ya cuenta judgment.discarded. */
  counts: DiscardedFindings;
}

/** Tope de hallazgos por llamada — igual que FIRST_BATCH_SIZE en double-check.ts. */
const MAX_PER_CALL = 15;

/** Llamadas en paralelo — igual criterio que JUDGE_CONCURRENCY (F-31 P2): sin
 *  pausa por defecto, backoff ante 429 vive un nivel más abajo en
 *  callAnthropicRaw. */
const VERIFY_CONCURRENCY = 5;

const VALID_VERDICTS: FindingVerdict[] = ['confirmado', 'mismo_dato_sin_oposicion', 'sin_relacion'];

interface VerifyResponse {
  results: Array<{
    index: number;
    verdict?: string;
    severity?: string;
  }>;
}

function bump(counts: DiscardedFindings, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

/**
 * Describe un lado del hallazgo para el prompt. Si el chunk es una fila de
 * tabla con celdas, muestra la ESTRUCTURA (hoja, fila, TODAS las columnas) en
 * vez de la cita como frase suelta — F-25: es lo que distingue "44 horas
 * frente a un convenio de 40" de "44 horas en una columna que resulta ser un
 * total mensual". La cita original queda señalada aparte, para que el modelo
 * sepa qué valor concreto disparó el hallazgo dentro de la fila completa.
 * Si no hay chunk, o el chunk no es una fila con celdas, se muestra la cita
 * con su contexto vecino (prosa) — o sola, si tampoco hay vecinos.
 */
function describeSide(quote: string, chunk: StoredChunk | null, neighbours: FindingNeighbours, columnOrder: string[] | null): string {
  if (chunk && chunk.chunkType === 'table_row' && chunk.cells) {
    const sheet = chunk.sheetName ? ` de la hoja "${chunk.sheetName}"` : '';
    const row = chunk.rowIndex !== null ? `, fila ${chunk.rowIndex + 1}` : '';
    // F-51: orden real, no Object.entries(cells) — ver table-structure.ts.
    const cells = chunk.cells;
    const orderedKeys = columnOrder && columnOrder.length > 0
      ? columnOrder.filter(c => cells[c] !== undefined)
      : Object.keys(cells);
    const allCells = orderedKeys.map(k => `${k}: ${cells[k]}`).join(' | ');
    return `Fila de tabla${sheet}${row}. Todas sus columnas: ${allCells}\nValor que señaló el auditor: "${quote}"`;
  }
  const prev = neighbours.previous ? `(...) ${neighbours.previous}\n` : '';
  const next = neighbours.next ? `\n${neighbours.next} (...)` : '';
  return `${prev}"${quote}"${next}`;
}

function buildFindingBlock(finding: FindingToVerify, index: number): string {
  const newSide = describeSide(finding.newDocSays, finding.newChunk, finding.newNeighbours, finding.newColumnOrder);
  const existingSide = describeSide(finding.existingDocSays, finding.existingChunk, finding.existingNeighbours, finding.existingColumnOrder);
  return `[${index}] Tema: ${finding.topic}
DOCUMENTO NUEVO:
${newSide}

DOCUMENTO EXISTENTE ("${finding.existingDocumentName}"):
${existingSide}`;
}

/**
 * El prompt en sí. Corto a propósito (F-34: "si te sale largo, es señal de
 * que estás replicando al juez") — no repite las reglas del juez porque no
 * juzga documentos enteros, juzga si dos citas ya elegidas se oponen.
 */
function buildPrompt(batch: FindingToVerify[]): string {
  const block = batch.map((f, i) => buildFindingBlock(f, i + 1)).join('\n\n---\n\n');
  return `Eres un verificador. Un primer auditor ha señalado ${batch.length} posibles hallazgos entre dos documentos. Para cada uno, decide UNA SOLA cosa: si las dos citas se oponen sobre el MISMO dato concreto. No busques nada fuera de lo que se te muestra; no evalúes el resto del documento.

HALLAZGOS:
${block}

VEREDICTOS POSIBLES:
- "confirmado": las dos citas hablan del mismo dato concreto y dicen cosas incompatibles.
- "mismo_dato_sin_oposicion": hablan del mismo dato concreto, pero no son incompatibles (una amplía, matiza, o coincide con la otra).
- "sin_relacion": no hablan del mismo dato concreto, aunque compartan tema, entidad o vocabulario.

Si un lado es una fila de tabla, compara SOLO columnas que también aparezcan citadas o mencionadas en el otro lado. Una columna que solo existe en un lado no es un dato compartido: no la uses para decidir.

Para "confirmado", añade además severity: "contradiction" si son incompatibles sin matices, "minor_inconsistency" si la oposición es de enfoque, grado o énfasis.

Debes responder los ${batch.length} índices, del 1 al ${batch.length}.

Responde EXCLUSIVAMENTE con este JSON:
{
  "results": [
    { "index": 1, "verdict": "confirmado", "severity": "contradiction" },
    { "index": 2, "verdict": "sin_relacion" }
  ]
}`;
}

interface BatchOutcome {
  finding: VerifiedFinding;
  discardKey: string | null;
  degraded: boolean;
}

function isMissingChunk(chunk: StoredChunk | null): boolean {
  return chunk === null;
}

function isDegraded(finding: FindingToVerify): boolean {
  return isMissingChunk(finding.newChunk) || isMissingChunk(finding.existingChunk);
}

function toOutcome(finding: FindingToVerify, raw: { verdict?: string; severity?: string } | undefined): BatchOutcome {
  const degraded = isDegraded(finding);

  if (!raw || !raw.verdict || !VALID_VERDICTS.includes(raw.verdict as FindingVerdict)) {
    return { finding: { verdict: 'sin_relacion' }, discardKey: 'descartado.sin_veredicto', degraded };
  }

  const verdict = raw.verdict as FindingVerdict;
  if (verdict === 'confirmado') {
    const severity = raw.severity === 'contradiction' ? 'contradiction' : 'minor_inconsistency';
    return { finding: { verdict, severity }, discardKey: null, degraded };
  }

  return { finding: { verdict }, discardKey: `descartado.${verdict}`, degraded };
}

async function verifyBatch(batch: FindingToVerify[]): Promise<BatchOutcome[]> {
  try {
    const response = await callLLMJson<VerifyResponse>(buildPrompt(batch), {
      maxOutputTokens: 2048,
      temperature: 0.1,
      model: 'haiku',
    });

    const byIndex = new Map<number, { verdict?: string; severity?: string }>();
    for (const r of response.results || []) {
      if (typeof r.index === 'number') byIndex.set(r.index, r);
    }

    return batch.map((finding, i) => toOutcome(finding, byIndex.get(i + 1)));
  } catch (err) {
    console.warn(`[verify-findings] Falló lote de ${batch.length} hallazgos:`, err);
    recordStageFailure('verify-findings', err);
    return batch.map(finding => toOutcome(finding, undefined));
  }
}

/**
 * Verifica una lista de hallazgos con la llamada corta, en lotes de hasta
 * MAX_PER_CALL, en paralelo (runInBatches). Nota para quien la enchufe: pásale
 * los hallazgos de UN candidato a la vez (F-34 — "un lote por documento
 * candidato, no un lote global del análisis"); esta función no agrupa por
 * documento, procesa el array que se le da.
 */
export async function verifyFindings(findings: FindingToVerify[]): Promise<VerifyFindingsResult> {
  if (findings.length === 0) return { results: [], counts: {} };

  const batches: FindingToVerify[][] = [];
  for (let i = 0; i < findings.length; i += MAX_PER_CALL) {
    batches.push(findings.slice(i, i + MAX_PER_CALL));
  }

  const batchResults = await runInBatches(
    batches,
    batch => verifyBatch(batch),
    { batchSize: VERIFY_CONCURRENCY },
  );

  const results: VerifiedFinding[] = [];
  const counts: DiscardedFindings = {};
  for (const outcomes of batchResults) {
    for (const outcome of outcomes) {
      results.push(outcome.finding);
      if (outcome.discardKey) bump(counts, outcome.discardKey);
      if (outcome.degraded) bump(counts, 'degradado.verificado_sin_estructura');
    }
  }

  return { results, counts };
}
