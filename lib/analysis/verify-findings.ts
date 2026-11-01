import { recordStageFailure } from './stage-failures';
import { callLLMJson } from './llm-client';
import { runInBatches } from '@/lib/run-in-batches';
import type { StoredChunk } from '@/lib/read-chunks';
import type { DiscardedFindings } from './types';
import type { ConflictoNormativo } from './conflicto-normativo';
import { PREGUNTA_DEL_CUMPLIMIENTO, pistaDeConflictoNormativo } from './rama-de-las-reglas';

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
  /** B.322: el trozo (o los trozos) donde está la cita, enteros. Vacío si no se
   *  sabe; entonces se pinta como antes, la cita con sus vecinos. Lo construye
   *  `contextoDeLaCita` (contexto-de-la-cita.ts). */
  newTrozos: string[];
  existingTrozos: string[];
  /** F-51: orden real de columnas de la tabla de newChunk/existingChunk (si
   *  son filas de tabla), resuelto por quien construye este objeto —
   *  describeSide no tiene el docChunks completo para llamar a
   *  getOrderedColumns por sí solo. null si no aplica (no es fila de tabla)
   *  o no se pudo determinar. */
  newColumnOrder: string[] | null;
  existingColumnOrder: string[] | null;
  /** 3.4, fase 3: si el juez lo marcó como conflicto normativo. Desde el 02/11/2026 (F-130, paso 2) es una PISTA en el
   *  bloque del hallazgo y nada más: el hallazgo recibe las mismas dos preguntas que los demás. Sigue sirviendo para la
   *  severidad de un confirmado y para el desglose de los descartes por especie. */
  conflictoNormativo?: ConflictoNormativo;
}

/** El veredicto de un hallazgo. Desde el 02/11/2026 no lo escribe el modelo: lo saca `veredictoDeLasDosRespuestas` de
 *  sus dos respuestas. `cumplibles_a_la_vez` (3.4, fase 3) descarta, como `mismo_dato_sin_oposicion`, y se cuenta con su
 *  propio nombre, `descartado.cumplibles_a_la_vez`. */
export type FindingVerdict = 'confirmado' | 'mismo_dato_sin_oposicion' | 'sin_relacion' | 'cumplibles_a_la_vez';

/** Las respuestas de las dos preguntas (F-130, paso 2). Las dos son obligatorias. */
export const RESPUESTAS_DEL_DATO = ['opuestos', 'mismo_dato_sin_oposicion', 'otro_dato'] as const;
export const RESPUESTAS_DEL_CUMPLIMIENTO = ['no_cumplibles', 'cumplibles', 'no_mandan'] as const;
export type RespuestaDelDato = (typeof RESPUESTAS_DEL_DATO)[number];
export type RespuestaDelCumplimiento = (typeof RESPUESTAS_DEL_CUMPLIMIENTO)[number];

/**
 * EL VEREDICTO SALE DE LAS DOS RESPUESTAS, Y SE DECIDE AQUÍ Y SÓLO AQUÍ (F-130, paso 2, 02/11/2026). Un hallazgo se
 * confirma si CUALQUIERA de las dos preguntas encuentra el conflicto: valores opuestos del mismo dato, o dos cosas que
 * no se pueden cumplir a la vez. Si no, los descartes conservan sus nombres de siempre, para que las consultas que los
 * leen (`descartado.<veredicto>`) sigan leyendo lo mismo:
 *   · mismo dato sin oposición → `mismo_dato_sin_oposicion`, conteste lo que conteste la 2;
 *   · otro dato, pero las dos se pueden cumplir → `cumplibles_a_la_vez`;
 *   · otro dato, y ninguna manda → `sin_relacion`.
 * `soloPorCumplimiento`: confirmado por la pregunta 2 sin que la 1 viera oposición. Es lo que la ruta por marca no
 * dejaba pasar sin la marca del juez.
 */
export function veredictoDeLasDosRespuestas(dato: RespuestaDelDato, cumplimiento: RespuestaDelCumplimiento):
  { verdict: FindingVerdict; soloPorCumplimiento: boolean } {
  if (dato === 'opuestos') return { verdict: 'confirmado', soloPorCumplimiento: false };
  if (cumplimiento === 'no_cumplibles') return { verdict: 'confirmado', soloPorCumplimiento: true };
  if (dato === 'mismo_dato_sin_oposicion') return { verdict: 'mismo_dato_sin_oposicion', soloPorCumplimiento: false };
  if (cumplimiento === 'cumplibles') return { verdict: 'cumplibles_a_la_vez', soloPorCumplimiento: false };
  return { verdict: 'sin_relacion', soloPorCumplimiento: false };
}

/** Resultado de un hallazgo, en el MISMO orden que el array de entrada — el
 *  emparejamiento con FindingToVerify es por posición, no por ningún id. */
export interface VerifiedFinding {
  verdict: FindingVerdict;
  /** Solo presente cuando verdict === 'confirmado': para los otros dos
   *  veredictos el hallazgo se descarta y la severity original deja de
   *  importar. */
  severity?: 'contradiction' | 'minor_inconsistency';
  /** Sólo en un confirmado por la pregunta 2 sin oposición en la 1 (`veredictoDeLasDosRespuestas`). Lo cuenta la
   *  cascada como `verificador.confirmados_solo_por_cumplimiento`. */
  soloPorCumplimiento?: true;
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

/** Lo que el modelo contesta de cada hallazgo: las dos respuestas y, si la 1 es «opuestos», la severidad. */
interface RespuestaDelModelo {
  index: number;
  dato?: string;
  cumplimiento?: string;
  severity?: string;
}

interface VerifyResponse {
  results: RespuestaDelModelo[];
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
function describeSide(quote: string, chunk: StoredChunk | null, neighbours: FindingNeighbours, columnOrder: string[] | null, trozos: string[]): string {
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
  // B.322: el trozo entero donde está la cita, entre sus vecinos, y la cita
  // señalada aparte. Sin trozo, como antes.
  if (trozos.length > 0) return `${prev}${trozos.join('\n')}${next}\nCita señalada: "${quote}"`;
  return `${prev}"${quote}"${next}`;
}

export function buildFindingBlock(finding: FindingToVerify, index: number): string {
  const newSide = describeSide(finding.newDocSays, finding.newChunk, finding.newNeighbours, finding.newColumnOrder, finding.newTrozos);
  const existingSide = describeSide(finding.existingDocSays, finding.existingChunk, finding.existingNeighbours, finding.existingColumnOrder, finding.existingTrozos);
  // la pista del juez, sólo en el hallazgo que la trae; sin ella, el bloque es el de siempre
  const marca = finding.conflictoNormativo ? `\n${pistaDeConflictoNormativo(finding.conflictoNormativo)}` : '';
  return `[${index}] Tema: ${finding.topic}${marca}
DOCUMENTO NUEVO:
${newSide}

DOCUMENTO EXISTENTE ("${finding.existingDocumentName}"):
${existingSide}`;
}

/**
 * El prompt en sí. Corto a propósito (F-34: "si te sale largo, es señal de
 * que estás replicando al juez") — no repite las reglas del juez porque no
 * juzga documentos enteros, juzga si dos citas ya elegidas se oponen.
 * ⚠️ DOS PREGUNTAS OBLIGATORIAS A TODO HALLAZGO desde el 02/11/2026 (F-130, paso 2): la del dato, que es la de siempre
 * con sus mismas reglas, y la del cumplimiento (rama-de-las-reglas.ts). Es UN prompt para todos los lotes: la marca
 * del juez ya no elige pregunta, va como pista en el bloque. El modelo contesta las dos por separado y el veredicto lo
 * saca el código (`veredictoDeLasDosRespuestas`). Antes el prompt decía «decide UNA SOLA cosa» y la rama, más abajo,
 * le quitaba esa pregunta a los marcados: las dos instrucciones se contradecían (Fable, F-130, 29/10).
 */
function buildPrompt(batch: FindingToVerify[]): string {
  const block = batch.map((f, i) => buildFindingBlock(f, i + 1)).join('\n\n---\n\n');
  return `Eres un verificador. Un primer auditor ha señalado ${batch.length} posibles hallazgos entre dos documentos. A CADA UNO le haces DOS preguntas, y LAS DOS SON OBLIGATORIAS: contestar a una no te exime de contestar a la otra, ni cuando la primera encuentre el conflicto ni cuando no. No busques nada fuera de lo que se te muestra; no evalúes el resto del documento.

HALLAZGOS:
${block}

Si un hallazgo trae una PISTA DEL PRIMER AUDITOR, es sólo eso, una pista: no contesta ninguna de las dos preguntas por ti.

PREGUNTA 1 · EL DATO: ¿SE OPONEN LAS DOS CITAS SOBRE EL MISMO DATO CONCRETO?

RESPUESTAS de la pregunta 1, en el campo "dato":
- "opuestos": las dos citas hablan del mismo dato concreto y dicen cosas incompatibles.
- "mismo_dato_sin_oposicion": hablan del mismo dato concreto, pero no son incompatibles (una amplía, matiza, o coincide con la otra).
- "otro_dato": no hablan del mismo dato concreto, aunque compartan tema, entidad o vocabulario.

SI LAS DOS CITAS HABLAN DEL MISMO DATO CONCRETO, lo que separa "opuestos" de "mismo_dato_sin_oposicion" es una sola cosa: si le asignan VALORES DISTINTOS. El dato es la pregunta que las dos responden (quién ocupa un cargo, qué precio tiene un servicio, con qué frecuencia se hace algo); el valor es la respuesta que da cada una.

- Se oponen: "la responsable del área es Ana Ruiz" frente a "el responsable del área es Beatriz Soler". Mismo dato —quién es el responsable—, dos valores. Que una cita sea más larga, más específica o esté redactada de otro modo no cambia esto.
- No se oponen: "la responsable del área es Ana Ruiz" frente a "la responsable del área coordina las auditorías". La segunda no da otro valor al mismo dato: habla de otro dato. Y una cita que CALLA sobre un dato no le está dando un valor distinto.

Negar es una forma de asignar valor: "es Beatriz Soler, no Ana Ruiz" responde a la misma pregunta que "es Ana Ruiz", y responde distinto.

Y una cita puede JUSTIFICAR su propio valor: dar el motivo técnico por el que ese criterio es el correcto, o señalar con qué otra cosa se complementa. Eso no anula la oposición si el valor sigue siendo distinto: la justificación habla del valor, no lo sustituye. La justificación es del autor del documento; la decisión de si se oponen es tuya.

Si un lado es una fila de tabla, compara SOLO columnas que también aparezcan citadas o mencionadas en el otro lado. Una columna que solo existe en un lado no es un dato compartido: no la uses para decidir.

Si la respuesta a la pregunta 1 es "opuestos", añade además severity: "contradiction" si son incompatibles sin matices, "minor_inconsistency" si la oposición es de enfoque, grado o énfasis.

${PREGUNTA_DEL_CUMPLIMIENTO}

Debes responder los ${batch.length} índices, del 1 al ${batch.length}, y en cada uno LAS DOS respuestas.

Responde EXCLUSIVAMENTE con este JSON:
{
  "results": [
    { "index": 1, "dato": "opuestos", "cumplimiento": "cumplibles", "severity": "contradiction" },
    { "index": 2, "dato": "otro_dato", "cumplimiento": "no_mandan" }
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

const esRespuestaDelDato = (v: unknown): v is RespuestaDelDato =>
  typeof v === 'string' && (RESPUESTAS_DEL_DATO as readonly string[]).includes(v);
const esRespuestaDelCumplimiento = (v: unknown): v is RespuestaDelCumplimiento =>
  typeof v === 'string' && (RESPUESTAS_DEL_CUMPLIMIENTO as readonly string[]).includes(v);

function toOutcome(finding: FindingToVerify, raw: RespuestaDelModelo | undefined): BatchOutcome {
  const degraded = isDegraded(finding);

  // LAS DOS RESPUESTAS SON OBLIGATORIAS: si falta una, o no es una de las suyas, el hallazgo no tiene veredicto y no se
  // aprueba por silencio (sale como 'sin_relacion', contado como descartado.sin_veredicto, igual que antes).
  if (!raw || !esRespuestaDelDato(raw.dato) || !esRespuestaDelCumplimiento(raw.cumplimiento)) {
    return { finding: { verdict: 'sin_relacion' }, discardKey: 'descartado.sin_veredicto', degraded };
  }

  const { verdict, soloPorCumplimiento } = veredictoDeLasDosRespuestas(raw.dato, raw.cumplimiento);
  if (verdict === 'confirmado') {
    // un conflicto que no se puede cumplir llega al usuario como hallazgo de verdad, no como inconsistencia menor: lo
    // marcara el juez (3.4) o lo encontrara sólo la pregunta 2 (02/11). La severidad del modelo sólo cuenta en la 1.
    const severity = finding.conflictoNormativo || soloPorCumplimiento || raw.severity === 'contradiction' ? 'contradiction' : 'minor_inconsistency';
    return { finding: { verdict, severity, ...(soloPorCumplimiento ? { soloPorCumplimiento: true as const } : {}) }, discardKey: null, degraded };
  }

  return { finding: { verdict }, discardKey: `descartado.${verdict}`, degraded };
}

async function verifyBatch(batch: FindingToVerify[]): Promise<BatchOutcome[]> {
  try {
    const response = await callLLMJson<VerifyResponse>(buildPrompt(batch), {
      maxOutputTokens: 2048,
      temperature: 0.1,
      model: 'haiku',
      etiqueta: { etapa: 'verificador' },
    });

    const byIndex = new Map<number, RespuestaDelModelo>();
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

  // UN SOLO REPARTO, EN EL ORDEN DE ENTRADA (02/11/2026, F-130 paso 2). Hasta ese día los marcados iban en su propio
  // lote, porque el prompt de los marcados llevaba la rama y el de los demás no (3.4, 26/10). Con las dos preguntas a
  // todos, el prompt es el mismo para cualquier lote y la marca ya no elige lote: ver buildPrompt.
  const lotes: number[][] = [];
  for (let i = 0; i < findings.length; i += MAX_PER_CALL) lotes.push(findings.slice(i, i + MAX_PER_CALL).map((_, k) => i + k));
  const batches: FindingToVerify[][] = lotes.map(lote => lote.map(i => findings[i]));

  const batchResults = await runInBatches(
    batches,
    batch => verifyBatch(batch),
    { batchSize: VERIFY_CONCURRENCY },
  );

  // los resultados vuelven a su POSICIÓN de entrada: el emparejamiento con FindingToVerify es por posición
  const results: VerifiedFinding[] = new Array(findings.length);
  const counts: DiscardedFindings = {};
  batchResults.forEach((outcomes, b) => {
    outcomes.forEach((outcome, k) => {
      const i = lotes[b][k];
      results[i] = outcome.finding;
      if (outcome.discardKey) bump(counts, outcome.discardKey);
      // 3.4: los descartes DESGLOSADOS POR ESPECIE (contador de medición). Sólo para los marcados, con una clave más
      // larga al lado de la de siempre: sin marcas, los contadores son los de antes. runInBatches conserva el orden.
      const especie = findings[i].conflictoNormativo;
      if (outcome.discardKey && especie) bump(counts, `${outcome.discardKey}.${especie}`);
      if (outcome.degraded) bump(counts, 'degradado.verificado_sin_estructura');
    });
  });

  return { results, counts };
}
