import { callLLMJson } from './llm-client';
import { runInBatches } from '@/lib/run-in-batches';
import { sanitizeJudgeContradictions, hashCitationPair } from './llm-boundary';
import { getOrderedColumns, groupChunksByTable, renderTableBlock, alignQuoteToCells } from './table-structure';
import { normalize } from './normalize';
import type { RerankedCandidate, DocumentJudgment, PipelineOptions, DiscardedFindings, DocumentFragment } from './types';
import type { StoredChunk } from '@/lib/read-chunks';

// F-61: normalize se extrajo a su propio fichero (ver normalize.ts) para
// evitar un ciclo con table-structure.ts. Se re-exporta aquí para que
// retrieval.ts y finding-rules.ts (`import { normalize } from './judge'`)
// no tengan que cambiar su import.
export { normalize };

/**
 * Etapa 3 — Juicio individual por documento.
 *
 * Los dos modos juzgan en paralelo por lotes de JUDGE_CONCURRENCY, sin pausa
 * entre rondas (F-31 P2): la pausa fija de 1200ms del modo rápido y los
 * 500ms del exhaustivo eran ambos residuo, no una protección medida. La red
 * de seguridad real ya existe un nivel más abajo — callAnthropicRaw reintenta
 * con backoff progresivo ante 429/529 (lib/llm/anthropic-client.ts), y el
 * rate-limiter propio (lib/llm/rate-limiter.ts) trackea uso contra el 80% del
 * Tier 2 de Anthropic y avisa por log si se satura. Si en producción aparecen
 * 429 reales, la pausa se reintroduce ahí — con el dato delante, no antes.
 * Modo rápido: documento truncado a NEW_DOC_LIMIT_QUICK. Modo exhaustivo:
 * documento completo.
 *
 * Post-procesamiento: las citas del LLM se verifican contra el texto real
 * del documento y se corrigen con match fuzzy si no coinciden exactamente.
 */

/** Límite de texto del doc nuevo en modo rápido (ahorra tokens). */
const NEW_DOC_LIMIT_QUICK = 6000;

/** Concurrencia de juicios en paralelo, en los dos modos (F-31 P2). */
const JUDGE_CONCURRENCY = 5;

/** Patrones que delatan que el LLM narró en vez de copiar la cita literal
 *  (p. ej. "El fragmento [2] muestra que..." o menciones a "el corpus"/
 *  "el documento nuevo" dentro del propio texto citado). */
const NARRATION_PATTERNS: RegExp[] = [
  /fragmento\s*\[\d+\]/i,
  /\bel corpus\b/i,
  /\bel documento nuevo\b/i,
];

function containsNarration(text: string | undefined): boolean {
  if (!text) return false;
  return NARRATION_PATTERNS.some(pattern => pattern.test(text));
}

interface JudgeResponse {
  overlapPercent: number;
  verdict: 'duplicado_exacto' | 'reformulacion' | 'solapamiento_parcial' | 'tema_similar' | 'sin_relacion';
  contradictions: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    severity: 'contradiction' | 'minor_inconsistency';
  }>;
  overlappingContent: Array<{
    description: string;
    evidence: string;
    evidenceInNewDoc: string;
  }>;
  uniqueToNewDoc: string[];
}

// ============================================================
// Post-procesamiento: corregir citas del LLM contra el texto real
// ============================================================

function findBestMatch(haystack: string, needle: string): string | null {
  if (!needle || needle.length < 10) return null;

  const exactIdx = haystack.indexOf(needle);
  if (exactIdx !== -1) return needle;

  const normNeedle = normalize(needle);
  if (normNeedle.length < 8) return null;

  const mapping: number[] = [];
  let normHaystack = '';
  for (let i = 0; i < haystack.length; i++) {
    const ch = haystack[i];
    const isSpace = /\s/.test(ch);
    // Misma clase que normalize(): debe coincidir carácter a carácter o el
    // mapping de índices haystack-normalizado -> haystack-original se desincroniza.
    const isPunct = /[.,;:!?"""''«»()[\]{}\-—–…*_#`~]/.test(ch);
    if (isPunct) continue;
    if (isSpace) {
      if (normHaystack.length > 0 && !normHaystack.endsWith(' ')) {
        normHaystack += ' ';
        mapping.push(i);
      }
    } else {
      normHaystack += ch.toLowerCase();
      mapping.push(i);
    }
  }

  const normIdx = normHaystack.indexOf(normNeedle);
  if (normIdx !== -1 && mapping[normIdx] !== undefined) {
    const startOrig = mapping[normIdx];
    const endNormIdx = normIdx + normNeedle.length - 1;
    const endOrig = (mapping[endNormIdx] ?? startOrig) + 1;
    return haystack.slice(startOrig, endOrig);
  }

  if (normNeedle.length >= 25) {
    const headLen = Math.min(20, Math.floor(normNeedle.length * 0.4));
    const tailLen = Math.min(20, Math.floor(normNeedle.length * 0.4));
    const head = normNeedle.slice(0, headLen);
    const tail = normNeedle.slice(-tailLen);

    const headIdx = normHaystack.indexOf(head);
    if (headIdx !== -1) {
      const tailIdx = normHaystack.indexOf(tail, headIdx + head.length);
      if (tailIdx !== -1) {
        const startOrig = mapping[headIdx];
        const endOrig = (mapping[tailIdx + tail.length - 1] ?? startOrig) + 1;
        if (endOrig - startOrig < needle.length * 3) {
          return haystack.slice(startOrig, endOrig);
        }
      }
    }
  }

  return null;
}

/**
 * Trocea una cita por "|" para verificarla segmento a segmento (F-30). El
 * modelo cita las columnas comparables y omite las intermedias, así que la
 * cadena literal de la cita entera no existe en el chunk aunque cada dato sea
 * correcto: "estos N trozos aparecen, en cualquier posición, dentro de la
 * misma fila" es un predicado distinto al de contigüidad que resuelve
 * findBestMatch, y hace falta trocear para comprobarlo trozo a trozo.
 *
 * Sin suelo de longitud por segmento: el que existía (10 caracteres) era
 * defensa contra falsos emparejamientos en un haystack del tamaño del
 * documento entero. Ahora cada segmento se verifica dentro de un único chunk
 * — una fila —, así que esa defensa ya no hace falta aquí; el suelo real que
 * queda es el de findBestMatch (needle.length < 10), que no se toca. Un
 * segmento por debajo de eso (p. ej. "Sábado: L", 9 caracteres) sigue sin
 * poder verificarse — límite heredado, no nuevo.
 */
function splitTabularSegments(quote: string): string[] | null {
  if (!quote.includes('|')) return null;
  const segments = quote.split('|').map(s => s.trim()).filter(Boolean);
  if (segments.length < 2) return null;
  return segments;
}

/** Por debajo de esto, un segmento es un valor suelto sin sustancia propia
 *  ("M", "L", un dígito) y casa con casi cualquier fila por casualidad —
 *  medido: las 10 filas de OPE-02 contienen una "m" en algún sitio. El par
 *  "Columna: valor" más corto real medido en el corpus (los tres .xlsx de
 *  muestra) es "Lunes: M", de 8 caracteres — este suelo se queda muy por
 *  debajo para no rozar ningún caso real. */
const MIN_SEGMENT_LENGTH = 3;

/**
 * Coincidencia puramente booleana de un segmento dentro del texto de un chunk
 * (F-30-bis): normalize().includes(), sin el suelo de 10 caracteres de
 * findBestMatch. Existe porque la vía por segmentos de verifyQuote nunca usa
 * el recorte que devuelve findBestMatch —se descarta; lo que se persiste es
 * el chunk entero—, así que ahí solo hace falta un sí/no, no una extracción
 * de posición. Sin el suelo de 10 porque protege algo que aquí no existe:
 * estaba pensado para un haystack del tamaño del documento entero, y un
 * segmento corto y genérico ahí sí puede colisionar por casualidad. Dentro de
 * UNA fila (~150-300 caracteres) la superficie de colisión es mínima, y el
 * segmento real nunca es un valor suelto: siempre viene emparejado con su
 * nombre de columna ("Lunes: M", no "M"). Medido en OPE-02 (el cuadro de
 * turnos, el documento del acierto de control): 33 de sus 100 pares
 * "Columna: valor" miden menos de 10 caracteres — todos los días de la
 * semana. No es una columna residual, es el patrón dominante de esa tabla.
 * Sí conserva MIN_SEGMENT_LENGTH: un segmento de 1-2 caracteres no es un dato
 * verificable, es ruido — y medido, "M" suelto casa con el 100% de las filas
 * de OPE-02 (contienen la letra en algún sitio), justo el falso positivo que
 * un segmento con su nombre de columna nunca produce.
 */
function chunkContainsSegment(chunkText: string, segment: string): boolean {
  if (segment.length < MIN_SEGMENT_LENGTH) return false;
  return normalize(chunkText).includes(normalize(segment));
}

/**
 * Verifica una cita contra la lista de chunks de un documento — los chunks
 * SON el haystack (F-27): es el mismo contenido que full_text, pero ya
 * dividido en las unidades que decidió el extractor (una fila de tabla, una
 * sección de prosa), así que devolver DE QUÉ CHUNK salió la cita es gratis en
 * vez de exigir una búsqueda aparte.
 *
 * Dos pasadas sobre los chunks:
 * 1. Match directo (findBestMatch) en cada uno — el predicado de contigüidad,
 *    correcto para prosa y para una cita de fila que sí copia columnas
 *    consecutivas.
 * 2. Si ninguno casa así, la vía por segmentos (F-30): el disparador es
 *    `chunk.chunkType === 'table_row'` — la naturaleza del CHUNK (dato), no la
 *    forma de la cita (texto). Una cita de prosa que contenga "|" por
 *    casualidad nunca entra aquí, porque su chunk no es table_row. Dentro de
 *    un chunk table_row, cada segmento de la cita se verifica por separado
 *    contra el texto del chunk con findBestMatch O, si esa falla,
 *    chunkContainsSegment (F-30-bis) — NUNCA al revés: findBestMatch cubre
 *    todo lo que chunkContainsSegment cubre y además su rama de aproximación
 *    por cabeza/cola para segmentos largos con alguna diferencia interna, así
 *    que probarlo primero no pierde nada; chunkContainsSegment solo rescata
 *    los segmentos que findBestMatch rechaza de entrada por su suelo de 10
 *    caracteres.
 *
 *    F-61, DOS FASES DENTRO DE ESTA VÍA — localizar y comprobar:
 *    a) LOCALIZAR: la exigencia de que casen TODOS los segmentos pasa a
 *       aplicarse solo a los TESTABLES (los que llegan a MIN_SEGMENT_LENGTH).
 *       Con el formato barato (7cb7038d) una cita de fila son valores sueltos
 *       y muchos miden uno o dos caracteres ("T", "MT", "L", "8"): bajo la
 *       regla anterior ninguno pasaba el suelo, `matchedCount` nunca llegaba a
 *       `segments.length`, y la cita entera moría como citaNoVerificable
 *       aunque fuera literal. Un segmento de una letra no tiene evidencia
 *       suficiente para decidir QUÉ FILA es, así que ni se le pide que lo
 *       haga. Si NINGÚN segmento es testable, no se acepta ningún chunk:
 *       aceptar sin evidencia sería la permisividad que el control negativo
 *       existe para descartar.
 *    b) COMPROBAR: localizada la fila, `alignQuoteToCells` (table-structure.ts)
 *       exige que TODOS los valores de la cita —también los cortos— coincidan
 *       exactamente con las celdas de esa fila, por posición y sin suelos.
 *       Es la contrapartida de (a): lo que la localización deja de exigir, la
 *       alineación lo comprueba contra el dato real. Sin este paso, (a) sola
 *       sería más permisiva que hoy.
 *    Con varios chunks candidatos (filas casi idénticas), gana el que localice
 *    más segmentos testables y, a igualdad, el primero — importa porque el
 *    `chunk` devuelto es de donde la capa determinista sacará la columna
 *    citada, y no debe salir de una mezcla entre filas.
 *
 *    `text` NO cambia: se sigue devolviendo `best.text`, el chunk entero. Esa
 *    sustitución es la segunda mitad de este frente y espera al harness de
 *    tasas — es lo único que cambiaría lo que el juez y el verificador LEEN
 *    después, y por tanto lo único capaz de mover la detección.
 *
 * FALLBACK: solo si la lista de chunks viene VACÍA (documento indexado antes
 * de F-20, o sin chunks por cualquier otro motivo) se verifica contra
 * fallbackText, con chunk: null, solo por match directo — ese camino es para
 * corpus ya migrado por completo y lo retira el paso 6 entero, así que no
 * conserva una vía por segmentos propia.
 */
function verifyQuote(
  chunks: StoredChunk[],
  fallbackText: string | null,
  quote: string | undefined,
): { text: string; chunk: StoredChunk | null; porCeldas: boolean } | null {
  if (!quote) return null;

  if (chunks.length === 0) {
    if (!fallbackText) return null;
    const direct = findBestMatch(fallbackText, quote);
    return direct ? { text: direct, chunk: null, porCeldas: false } : null;
  }

  for (const chunk of chunks) {
    const direct = findBestMatch(chunk.text, quote);
    if (direct) return { text: direct, chunk, porCeldas: false };
  }

  const segments = splitTabularSegments(quote);
  if (segments) {
    // (a) LOCALIZAR — solo los segmentos testables deciden qué fila es.
    const testable = segments.filter(s => s.length >= MIN_SEGMENT_LENGTH);
    if (testable.length > 0) {
      let best: StoredChunk | null = null;
      let bestMatchedCount = -1;
      for (const chunk of chunks) {
        if (chunk.chunkType !== 'table_row') continue;
        const matchedCount = testable.filter(segment =>
          findBestMatch(chunk.text, segment) !== null || chunkContainsSegment(chunk.text, segment)
        ).length;
        if (matchedCount === testable.length && matchedCount > bestMatchedCount) {
          best = chunk;
          bestMatchedCount = matchedCount;
        }
      }
      // (b) COMPROBAR — todos los valores contra las celdas de esa fila. El
      // array de columnas que devuelve se DESCARTA a propósito: aquí solo se
      // usa como puerta (null = rechaza). Ver alignQuoteToCells.
      if (best && best.tableId) {
        const aligned = alignQuoteToCells(quote, best.cells, getOrderedColumns(best.tableId, chunks));
        if (aligned) {
          return { text: best.text, chunk: best, porCeldas: testable.length < segments.length };
        }
      }
    }
  }

  return null;
}

/** Lado(s) que fallaron la verificación, comprobados de forma independiente
 *  (F-27 3.1): antes, si fallaban los dos, solo se reportaba el primero. */
function describeFailedSide(newFailed: boolean, existingFailed: boolean): 'nuevo' | 'existente' | 'ambos' {
  if (newFailed && existingFailed) return 'ambos';
  return newFailed ? 'nuevo' : 'existente';
}

/**
 * Chunks localizados por verifyQuote para cada hallazgo que sobrevivió a
 * fixQuotesInJudgment, en el MISMO orden e índice que
 * DocumentJudgment.contradictions/overlappingContent (F-35). Es EVIDENCIA de
 * verificación, no contenido del hallazgo: no entra en DocumentJudgment (que
 * se persiste entero en analysis_results) porque no le debe nada al jsonb —
 * existe para que la cascada del verificador (finding-rules.ts +
 * verify-findings.ts) decida, y muere en cuanto la cascada termina.
 * null en un lado cuando verifyQuote no pudo asociar chunk (fallback de texto
 * plano, documento sin persistir en F-20).
 *
 * `hash` (F-38): el identificador que sobrevive a un retitulado — arrastra el
 * mismo hash que ya calculó fixQuotesInJudgment sobre las citas CRUDAS, antes
 * de que este mismo bloque las sustituya por el texto del chunk. Viaja aquí en
 * vez de recalcularse en la cascada porque en la cascada esas citas crudas ya
 * no existen (judgment.contradictions, en ese punto, ya está sustituido).
 */
export interface JudgmentEvidence {
  contradictions: Array<{ hash: string; newChunk: StoredChunk | null; existingChunk: StoredChunk | null }>;
  overlaps: Array<{ hash: string; newChunk: StoredChunk | null; existingChunk: StoredChunk | null }>;
}

/**
 * ¿Esta cita es literalmente el texto (o un fragmento de él) de una línea de
 * contexto del candidato (F-44)? Solo para CONTAR el motivo del descarte con
 * precisión — nunca se registra como haystack de verifyQuote: meter en el
 * verificador texto que no existe en el corpus real desandaría F-27 (los
 * chunks SON el haystack). El hallazgo se descarta igual, tenga esta forma o
 * no; esto solo decide con qué nombre.
 */
function isContextCitation(quote: string | undefined, contextTexts: string[]): boolean {
  if (!quote) return false;
  const normQuote = normalize(quote);
  if (!normQuote) return false;
  return contextTexts.some(text => normalize(text).includes(normQuote));
}

function fixQuotesInJudgment(
  judgment: DocumentJudgment,
  newDocumentChunks: StoredChunk[],
  newDocumentFallbackText: string | null,
  existingDocumentChunks: StoredChunk[],
  existingDocumentFallbackText: string | null,
  // F-44: texto literal de las líneas de contexto del CANDIDATO (retrieval.ts,
  // fragmentos con isContext) — solo existen del lado existente, nunca del
  // lado analizado (ese no pasa por el reparto de retrieval). Sirve solo
  // para distinguir el MOTIVO del descarte si el juez cita una pese a la
  // marca — no participa en verifyQuote.
  existingContextTexts: string[] = [],
): { judgment: DocumentJudgment; evidence: JudgmentEvidence } {
  let narracionEnCita = 0;
  let citaNoVerificable = 0;
  let citaDeContexto = 0;
  // F-61: instrumentación permanente — cuánto trabajo hace cada fase de la
  // vía por segmentos. Por LADO verificado (hasta dos por hallazgo), no por
  // hallazgo: "cuánto trabajo hace cada fase" es una pregunta sobre el
  // mecanismo, no sobre el hallazgo. por_localizacion: la cita se resolvió
  // sin necesitar la fase nueva (vía directa, o todos sus segmentos eran
  // testables). por_celdas: la cita traía al menos un valor demasiado corto
  // para localizar, y solo la comprobación contra celdas pudo confirmarlo —
  // es el trabajo que antes no existía y que rescata "T"/"MT"/"8".
  let verificadoPorLocalizacion = 0;
  let verificadoPorCeldas = 0;

  const fixedContradictions: DocumentJudgment['contradictions'] = [];
  const contradictionEvidence: JudgmentEvidence['contradictions'] = [];
  for (const c of judgment.contradictions) {
    // Hash sobre las citas de ENTRADA, antes de que verifyQuote (más abajo)
    // las sustituya por el texto real del chunk — es el mismo identificador
    // que el log crudo de judgeSingleDocument calculó para este hallazgo.
    const hash = hashCitationPair(c.newDocSays, c.existingDocSays);

    if (containsNarration(c.newDocSays) || containsNarration(c.existingDocSays)) {
      console.warn(
        `[judge] Contradicción descartada en "${judgment.documentName}" [${hash}] (narración en la cita): ` +
        `nuevo="${(c.newDocSays || '').slice(0, 200)}" existente="${(c.existingDocSays || '').slice(0, 200)}"`
      );
      narracionEnCita++;
      continue;
    }

    const matchNew = verifyQuote(newDocumentChunks, newDocumentFallbackText, c.newDocSays);
    const matchExisting = verifyQuote(existingDocumentChunks, existingDocumentFallbackText, c.existingDocSays);

    if (matchNew && matchExisting) {
      fixedContradictions.push({ ...c, newDocSays: matchNew.text, existingDocSays: matchExisting.text });
      contradictionEvidence.push({ hash, newChunk: matchNew.chunk, existingChunk: matchExisting.chunk });
      if (matchNew.porCeldas) verificadoPorCeldas++; else verificadoPorLocalizacion++;
      if (matchExisting.porCeldas) verificadoPorCeldas++; else verificadoPorLocalizacion++;
    } else if (!matchExisting && isContextCitation(c.existingDocSays, existingContextTexts)) {
      // F-44: citó la línea de contexto pese a la marca de "no citar". Se
      // descarta igual (no hay chunk real que verifique esto), pero con un
      // motivo propio en vez de mezclarlo con una cita genuinamente inventada.
      console.warn(
        `[judge] Contradicción descartada en "${judgment.documentName}" [${hash}] (cita de línea de contexto, no citable): ` +
        `"${(c.existingDocSays || '').slice(0, 200)}"`
      );
      citaDeContexto++;
    } else {
      const failedSide = describeFailedSide(!matchNew, !matchExisting);
      const failedText = failedSide === 'ambos'
        ? `nuevo="${(c.newDocSays || '').slice(0, 200)}" existente="${(c.existingDocSays || '').slice(0, 200)}"`
        : `"${((failedSide === 'nuevo' ? c.newDocSays : c.existingDocSays) || '').slice(0, 200)}"`;
      console.warn(
        `[judge] Contradicción descartada en "${judgment.documentName}" [${hash}] (cita no verificable, lado=${failedSide}): ${failedText}`
      );
      citaNoVerificable++;
    }
  }

  const fixedOverlaps: DocumentJudgment['overlappingContent'] = [];
  const overlapEvidence: JudgmentEvidence['overlaps'] = [];
  for (const o of judgment.overlappingContent) {
    // Mismo criterio que en el bucle de contradicciones: hash sobre las citas
    // de ENTRADA, antes de verifyQuote.
    const hash = hashCitationPair(o.evidenceInNewDoc || '', o.evidence);

    if (containsNarration(o.evidenceInNewDoc) || containsNarration(o.evidence)) {
      console.warn(
        `[judge] Solapamiento descartado en "${judgment.documentName}" [${hash}] (narración en la cita): ` +
        `nuevo="${(o.evidenceInNewDoc || '').slice(0, 200)}" existente="${(o.evidence || '').slice(0, 200)}"`
      );
      narracionEnCita++;
      continue;
    }

    const matchNew = verifyQuote(newDocumentChunks, newDocumentFallbackText, o.evidenceInNewDoc);
    const matchExisting = verifyQuote(existingDocumentChunks, existingDocumentFallbackText, o.evidence);

    if (matchNew && matchExisting) {
      fixedOverlaps.push({ ...o, evidenceInNewDoc: matchNew.text, evidence: matchExisting.text });
      overlapEvidence.push({ hash, newChunk: matchNew.chunk, existingChunk: matchExisting.chunk });
      if (matchNew.porCeldas) verificadoPorCeldas++; else verificadoPorLocalizacion++;
      if (matchExisting.porCeldas) verificadoPorCeldas++; else verificadoPorLocalizacion++;
    } else if (!matchExisting && isContextCitation(o.evidence, existingContextTexts)) {
      console.warn(
        `[judge] Solapamiento descartado en "${judgment.documentName}" [${hash}] (cita de línea de contexto, no citable): ` +
        `"${(o.evidence || '').slice(0, 200)}"`
      );
      citaDeContexto++;
    } else {
      const failedSide = describeFailedSide(!matchNew, !matchExisting);
      const failedText = failedSide === 'ambos'
        ? `nuevo="${(o.evidenceInNewDoc || '').slice(0, 200)}" existente="${(o.evidence || '').slice(0, 200)}"`
        : `"${((failedSide === 'nuevo' ? o.evidenceInNewDoc : o.evidence) || '').slice(0, 200)}"`;
      console.warn(
        `[judge] Solapamiento descartado en "${judgment.documentName}" [${hash}] (cita no verificable, lado=${failedSide}): ${failedText}`
      );
      citaNoVerificable++;
    }
  }

  const discardedCount = narracionEnCita + citaNoVerificable + citaDeContexto;

  if (discardedCount > 0) {
    console.warn(`[judge] Descartados ${discardedCount} hallazgos no verificables en "${judgment.documentName}"`);
  }

  // Fusión, no sustitución (F-39): judgment.discarded puede traer ya los
  // motivos de la frontera LLM→pipeline (sanitizeJudgeContradictions, antes
  // de esta función) — machacarlo aquí los perdería en cuanto esta función
  // también tuviera algo que contar para el mismo candidato.
  const discarded: DiscardedFindings = { ...(judgment.discarded ?? {}) };
  if (narracionEnCita > 0) discarded.narracionEnCita = (discarded.narracionEnCita ?? 0) + narracionEnCita;
  if (citaNoVerificable > 0) discarded.citaNoVerificable = (discarded.citaNoVerificable ?? 0) + citaNoVerificable;
  if (citaDeContexto > 0) discarded.citaDeContexto = (discarded.citaDeContexto ?? 0) + citaDeContexto;
  // F-61: mismo campo que los descartes de arriba (DiscardedFindings ya es,
  // de facto, "recuento por motivo", no solo descartes — ver
  // 'confirmado.por_estructura' en pipeline.ts). 'verificado.*' en vez de
  // 'descartado.*' dice, con el propio nombre, que estas dos no son un fallo.
  if (verificadoPorLocalizacion > 0) discarded['verificado.por_localizacion'] = (discarded['verificado.por_localizacion'] ?? 0) + verificadoPorLocalizacion;
  if (verificadoPorCeldas > 0) discarded['verificado.por_celdas'] = (discarded['verificado.por_celdas'] ?? 0) + verificadoPorCeldas;

  return {
    judgment: {
      ...judgment,
      contradictions: fixedContradictions,
      overlappingContent: fixedOverlaps,
      ...(Object.keys(discarded).length > 0 ? { discarded } : {}),
    },
    evidence: { contradictions: contradictionEvidence, overlaps: overlapEvidence },
  };
}

// ============================================================
// Juicio individual
// ============================================================

/**
 * Etiqueta de procedencia de un fragmento. Sin contexto persistido (documentos
 * indexados antes de F-20) se comporta exactamente como antes: solo el número
 * de fragmento y el nombre del documento.
 *
 * Para filas de tabla añade hoja y fila, y las columnas con su valor. Es lo que
 * permite al juez saber que dos filas hablan de la misma entidad sin que eso
 * signifique que se contradigan, y es la base de las citas estructuradas del
 * paso 5.
 */
function describeFragment(fragment: DocumentFragment, position: number, documentName: string): string {
  // F-44: la línea de contexto que colapsa filas idénticas (retrieval.ts) no
  // tiene `context` — no describe una fila real de document_chunks — así que
  // caería al genérico de abajo sin este chequeo, perdiendo justo la marca
  // que le dice al juez que no la cite. `isContext` es la señal explícita
  // (ver DocumentFragment en types.ts) que la distingue de un fragmento sin
  // contexto por documento antiguo (F-20), que sí es una fila real citable.
  if (fragment.isContext) {
    return `[Fragmento ${position} de "${documentName}" — RESUMEN DE COINCIDENCIAS, NO CITAR LITERALMENTE]`;
  }

  const ctx = fragment.context;
  if (!ctx) return `[Fragmento ${position} de "${documentName}"]`;

  // F-53: la rama 'table_row' que vivía aquí desaparece — buildExistingFragsBlock
  // agrupa toda fila de tabla en el bloque de su tabla (formato barato) antes
  // de que describeFragment vea nada; esta función ya solo describe lo que
  // queda SUELTO: table_summary de una tabla sin filas incluidas (nivel 3),
  // la línea de contexto de arriba, y el genérico. Un fragmento con
  // ctx.chunkType==='table_row' que llegara aquí sería un error de
  // enrutamiento en el llamador, no un caso a degradar en silencio — por eso
  // no hay rama 'table_row': si faltara, el genérico de abajo lo etiquetaría
  // mal y de forma visible, no lo escondería.

  if (ctx.chunkType === 'table_summary') {
    const sheet = ctx.sheetName ? ` de la hoja "${ctx.sheetName}"` : '';
    return `[Fragmento ${position} de "${documentName}" — RESUMEN DE TABLA${sheet}]`;
  }

  return `[Fragmento ${position} de "${documentName}"]`;
}

/**
 * F-53: el bloque del documento existente, en formato barato — cabecera de
 * tabla una vez, filas numeradas debajo, sin repetir nombre de documento ni
 * columnas por fila. Reemplaza el `.map(describeFragment)` de siempre.
 *
 * Agrupa por tableId en orden de PRIMERA aparición (no reordena
 * `candidate.fragments`: solo decide qué bloques salen y en qué orden salen
 * los bloques, que es el de su primer fragmento). Una fila de tabla NUNCA
 * llega a describeFragment — se agrupa aquí. Un table_summary cuya tabla YA
 * tiene filas en este bloque se OMITE (su información vive en la cabecera
 * del grupo); esto asume que las filas de una tabla preceden a su resumen
 * dentro de `fragments`, cierto por construcción en retrieval.ts
 * (`assembleTable` siempre devuelve `[...filas, resumen]`, nunca al revés) —
 * si esa función cambiara ese orden, este bloque duplicaría el resumen en
 * vez de perderlo, un fallo visible, no silencioso. Un table_summary de una
 * tabla SIN filas en este candidato (nivel 3) sí llega a describeFragment,
 * sin cambios.
 */
function buildExistingFragsBlock(
  fragments: DocumentFragment[],
  documentName: string,
  docChunks: StoredChunk[],
  columnOrderByTable: Map<string, string[]>,
): string {
  const rowsByTable = new Map<string, DocumentFragment[]>();
  const blocks: Array<{ kind: 'table'; tableId: string } | { kind: 'standalone'; fragment: DocumentFragment }> = [];

  for (const f of fragments) {
    const ctx = f.context;
    if (!f.isContext && ctx?.chunkType === 'table_row' && ctx.tableId) {
      if (!rowsByTable.has(ctx.tableId)) {
        rowsByTable.set(ctx.tableId, []);
        blocks.push({ kind: 'table', tableId: ctx.tableId });
      }
      rowsByTable.get(ctx.tableId)!.push(f);
      continue;
    }
    if (!f.isContext && ctx?.chunkType === 'table_summary' && ctx.tableId && rowsByTable.has(ctx.tableId)) {
      continue;
    }
    blocks.push({ kind: 'standalone', fragment: f });
  }

  let position = 0;
  const parts: string[] = [];
  for (const block of blocks) {
    position++;
    if (block.kind === 'standalone') {
      parts.push(`${describeFragment(block.fragment, position, documentName)}\n${block.fragment.text}`);
      continue;
    }
    const rows = rowsByTable.get(block.tableId)!;
    const columns = columnOrderByTable.get(block.tableId) ?? [];
    const sheetName = rows[0].context?.sheetName ?? null;
    const totalRows = docChunks.filter(c => c.tableId === block.tableId && c.chunkType === 'table_row').length;
    const rowData = rows.map(f => ({ rowIndex: f.context?.rowIndex ?? null, cells: f.context?.cells ?? null }));
    parts.push(renderTableBlock(sheetName, block.tableId, documentName, columns, totalRows, rowData));
  }
  return parts.join('\n\n');
}

async function judgeSingleDocument(args: {
  newDocumentName: string;
  newDocumentText: string;
  newDocumentFallbackText: string;
  newDocumentChunks: StoredChunk[];
  candidate: RerankedCandidate;
  chunksByDocument?: Map<string, StoredChunk[]>;
  fallbackTexts?: Map<string, string>;
}): Promise<{ judgment: DocumentJudgment; evidence: JudgmentEvidence }> {
  const { newDocumentName, newDocumentText, candidate, chunksByDocument } = args;

  // Diagnóstico (F-36-bis): qué fragmentos recibe el juez por candidato, para
  // distinguir "no lo ve teniéndolo delante" (inestabilidad, B.82) de "no
  // llegó entre los fragmentos" (recuperación). Mismo `context` que usa
  // describeFragment más abajo — sin consulta nueva, sin recorrer nada que no
  // esté ya en memoria.
  const fragmentTypeCounts: Record<'text' | 'table_summary' | 'table_row', number> = {
    text: 0,
    table_summary: 0,
    table_row: 0,
  };
  const tableRowIndexes: number[] = [];
  let fragmentsSinContexto = 0;
  // F-44: la línea agregada tampoco tiene `context` (no es una fila real),
  // pero no es lo mismo que "sin_contexto" — ese motivo significa "documento
  // sin persistir en F-20, fila real igual citable". Mezclarlos habría hecho
  // parecer, en el diagnóstico, que faltan filas de un documento antiguo
  // cuando en realidad es la línea de contexto haciendo su trabajo.
  let fragmentsDeContexto = 0;
  for (const f of candidate.fragments) {
    if (f.isContext) {
      fragmentsDeContexto++;
      continue;
    }
    const type = f.context?.chunkType;
    if (!type) {
      fragmentsSinContexto++;
      continue;
    }
    fragmentTypeCounts[type]++;
    if (type === 'table_row' && f.context?.rowIndex !== null && f.context?.rowIndex !== undefined) {
      tableRowIndexes.push(f.context.rowIndex);
    }
  }
  const fragmentTypesLog = (['text', 'table_summary', 'table_row'] as const)
    .map(t => `${t}: ${fragmentTypeCounts[t]}`)
    .join(', ');
  const sinContextoLog = fragmentsSinContexto > 0 ? `, sin_contexto: ${fragmentsSinContexto}` : '';
  const deContextoLog = fragmentsDeContexto > 0 ? `, contexto_no_citable: ${fragmentsDeContexto}` : '';
  const filasLog = tableRowIndexes.length > 0 ? ` filas: [${tableRowIndexes.join(', ')}]` : '';
  console.log(
    `[judge] "${candidate.documentName}": ${candidate.fragments.length} fragmentos ` +
    `(${fragmentTypesLog}${sinContextoLog}${deContextoLog})${filasLog}`
  );

  // F-51: orden de columnas, UNA VEZ por tabla distinta entre los fragmentos
  // de este candidato — no una vez por fragmento, para no recalcular ni
  // volver a loggear orden_no_parseable N veces por las N filas de la misma
  // tabla. chunksByDocument ya trae column_order (lib/read-chunks.ts).
  const candidateChunks = chunksByDocument?.get(candidate.documentId) ?? [];
  const columnOrderByTable = new Map<string, string[]>();
  for (const f of candidate.fragments) {
    const tableId = f.context?.tableId;
    if (tableId && !columnOrderByTable.has(tableId)) {
      columnOrderByTable.set(tableId, getOrderedColumns(tableId, candidateChunks));
    }
  }

  const existingFragsBlock = buildExistingFragsBlock(candidate.fragments, candidate.documentName, candidateChunks, columnOrderByTable);

  const prompt = `Eres un auditor de documentación. Tu tarea es comparar CONTENIDO CONCRETO entre dos documentos y emitir un juicio preciso, no una impresión general.

DOCUMENTO NUEVO: "${newDocumentName}"
"""
${newDocumentText}
"""

DOCUMENTO EXISTENTE: "${candidate.documentName}" (fuente: ${candidate.source})
"""
${existingFragsBlock}
"""

REGLA PRINCIPAL, POR ENCIMA DE TODAS LAS DEMAS:
Antes de emitir cualquier hallazgo, verifica que los dos textos hablan del
MISMO DATO CONCRETO. Si hablan de datos distintos, no hay nada que comparar y
NO emites hallazgo, aunque ambos textos pertenezcan al mismo ámbito.

CUANDO LOS DOS TEXTOS SON FILAS DE TABLAS (formato "Columna: valor | Columna: valor"):
Compara SOLO los valores de columnas que aparezcan en AMBOS textos, emparejando
por el nombre de la columna. Una columna que solo aparece en uno de los dos
textos NO es comparable: no existe el dato equivalente en el otro lado, así que
no puede haber contradicción sobre ella. Que ambas filas se refieran a la misma
entidad (la misma persona, el mismo cliente, el mismo producto) permite
compararlas, pero NO es por sí solo un hallazgo: la contradicción exige que una
misma columna tenga valores incompatibles en los dos textos.
Si las dos filas no comparten ninguna columna con valores distintos, NO emitas
hallazgo.

Después, si hablan del mismo dato: si puedes imaginar un contexto razonable en
el que ambas afirmaciones sean verdaderas a la vez, NO es contradicción.
Comprueba entonces si es una inconsistencia menor. Si tampoco lo es, NO EMITAS
NADA sobre ese punto.
Que dos documentos no tengan ninguna contradicción entre sí es un resultado
NORMAL y frecuente. Devolver las listas vacías es una respuesta correcta y
esperada, no un fallo. NO fuerces hallazgos para justificar el análisis.

INSTRUCCIONES CRÍTICAS:
1. "Solapamiento" significa contenido que se repite, aunque esté redactado con palabras distintas. NO significa compartir tema general.
2. "Contradicción" significa que ambos documentos afirman cosas INCOMPATIBLES sobre el mismo dato concreto. Es decir: es IMPOSIBLE que ambas afirmaciones sean verdaderas a la vez.
3. "Inconsistencia menor" significa que ambos documentos hablan del mismo tema con enfoques, matices o énfasis diferentes, pero no son estrictamente incompatibles.
4. El porcentaje de solapamiento debe reflejar CUÁNTO del documento nuevo ya está en el existente, no la similitud temática.
5. Si los documentos hablan del mismo tema pero con contenido distinto, veredicto = "tema_similar", overlapPercent < 20.
6. Si los documentos NO comparten contenido concreto —solo el ámbito general, o hablan de datos distintos—, veredicto = "sin_relacion", overlapPercent = 0, y las listas de contradicciones y solapamientos VACÍAS. Es una respuesta válida y frecuente.
7. Solo marca "duplicado_exacto" si el contenido es prácticamente idéntico (>85% del nuevo ya está en el existente).
8. Revisa TODO el documento nuevo, no solo las primeras líneas. Revisarlo entero no implica que tengas que encontrar algo.

EJEMPLOS DE LO QUE SÍ ES CONTRADICCIÓN:
- "El plazo de entrega es 30 días" vs "El plazo de entrega es 15 días"
- "El presupuesto aprobado es 100.000€" vs "El presupuesto aprobado es 200.000€"
- "La política prohíbe el teletrabajo" vs "Se permite el teletrabajo 3 días por semana"
- "El responsable del proyecto es Ana García" vs "El responsable del proyecto es Luis Pérez"

EJEMPLOS DE LO QUE NO ES CONTRADICCIÓN (usar inconsistencia menor si aplica):
- "La transformación digital es un proceso tecnológico" vs "La tecnología es solo el habilitador" → perspectivas diferentes, ambas pueden ser verdaderas
- "Es importante formar al equipo" vs "Es fundamental formar al equipo" → diferencia de énfasis, no de dato
- "El proyecto tiene 3 fases" vs "El proyecto tiene 3 fases principales y 2 secundarias" → la segunda amplía la primera, no la contradice
- "Se recomienda usar Python" vs "Se recomienda usar TypeScript" → pueden ser recomendaciones para contextos diferentes
- Afirmaciones genéricas vs específicas que son compatibles entre sí
- "Horas semana: 8" vs "Fecha evaluación: 2026-06-11" → son datos DISTINTOS (una jornada y una fecha). No hay nada que comparar: no se emite hallazgo.
- "Empleado: Laura Núñez | Puesto: Higienista" vs "Tratamiento: Tartrectomía | Profesional: Higienista" → CONCUERDAN. Que coincidan no es un hallazgo.
- "Total horas equipo/semana: 256" vs "las horas por encima de la jornada deben estar autorizadas previamente" → un total y una norma de autorización no son el mismo dato: no se contradicen.
- Dos tablas de temas distintos comparten a las mismas personas: que una tenga datos que la otra no tiene NO es contradicción — son complementarios (una fecha de evaluación y unas horas semanales no se comparan). Pero si la MISMA columna aparece en ambas con valores distintos para la misma persona — el mismo Puesto con dos valores — eso SÍ se reporta, aunque las tablas traten de temas distintos: puede haber razón legítima (contextos distintos) o error, y quien decide es el usuario, no tú.

TIPOS DE DISCREPANCIA QUE CUENTAN COMO HALLAZGO (solo si superan la regla principal):
- CONTRADICCIÓN DIRECTA: "El plazo es 30 días" vs "El plazo es 15 días".
- OMISIÓN SIGNIFICATIVA: el documento nuevo menciona una lista o conjunto INCOMPLETO respecto al existente. Ejemplo: "Los principios son Confidencialidad e Integridad" cuando el existente dice "Los principios son Confidencialidad, Integridad y Disponibilidad". Falta un elemento clave.
- DISTORSIÓN CONCEPTUAL: el documento nuevo redefine un concepto usando términos similares pero incorrectos. Ejemplo: "Automatización cognitiva (machine learning)" cuando el existente define el concepto como "Automatización inteligente (uso de IA con capacidad de adaptación)". Los términos suenan parecidos pero el significado es diferente.
- SUSTITUCIÓN DE TÉRMINOS: el documento nuevo reemplaza un término técnico por otro diferente. Ejemplo: "Visualización" en lugar de "Análisis" en un ciclo de fases.
- EXAGERACIÓN O ABSOLUTISMO: el documento nuevo convierte un matiz en afirmación absoluta. Ejemplo: "eliminación completa de errores" cuando el existente dice "disminución de errores". O "Todo proceso debe automatizarse" cuando el existente dice "No todo debe automatizarse".
- DEGRADACIÓN DE IMPORTANCIA: el documento nuevo presenta como secundario o prescindible algo que el existente presenta como fundamental o al mismo nivel que otros elementos.

PRESTA ESPECIAL ATENCIÓN A:
- Listas y enumeraciones: compara número de elementos. Si el nuevo tiene menos elementos que el existente en la misma lista, es una OMISIÓN.
- Definiciones: compara los términos exactos. Si el nuevo usa palabras diferentes para definir el mismo concepto, verifica que el significado sea realmente equivalente.
- Cuantificadores: "todo", "siempre", "nunca", "completamente", "solo", "únicamente" son señales de posible exageración respecto al existente.

REGLA DE ORO: Si puedes imaginar un contexto razonable en el que ambas afirmaciones sean verdaderas simultáneamente, NO es contradicción. Puede ser inconsistencia menor.

REGLAS DE FORMATO:
- En newDocSays y evidenceInNewDoc: copia LITERALMENTE un fragmento del DOCUMENTO NUEVO.
- En existingDocSays y evidence: copia literalmente un fragmento del DOCUMENTO EXISTENTE.
- Máximo 1 frase por cita. NO copies párrafos enteros.
- Las citas deben ser TEXTO COPIADO tal cual del documento, sin comentarios, sin explicaciones y sin referirse a los fragmentos por su número. Prohibido escribir cosas como "El fragmento [2] muestra que...", "El corpus especifica que...", "Este documento no menciona...".
- Si no puedes copiar una frase literal que sustente el hallazgo, no emitas ese hallazgo.
- En description: describe QUÉ contenido concreto comparten los dos documentos, en una frase. No vale describir características genéricas que compartirían casi todos los documentos de la empresa (mismo autor, misma plantilla, ambos citan normativa, ambos tienen sección de referencias). Si lo único en común es de ese tipo, NO emitas el solapamiento.
- Una REMISIÓN no es solapamiento ni contradicción. Si el documento nuevo se limita a remitir a otro documento ("ver CLI-03", "conforme a NOR-01", "según el protocolo X") sin afirmar contenido propio sobre ese tema, no emitas hallazgo con ese documento por esa remisión.
- Máximo 10 contradicciones, 5 inconsistencias menores y 5 solapamientos.
- El campo "severity" es obligatorio en cada contradicción: "contradiction" si son incompatibles, "minor_inconsistency" si son diferencias de enfoque o matiz.

Responde con este JSON (sin bloques de código, sin texto adicional):
{
  "overlapPercent": 25,
  "verdict": "tema_similar",
  "contradictions": [
    { "topic": "tema", "newDocSays": "cita literal del nuevo", "existingDocSays": "cita literal del existente", "severity": "contradiction" },
    { "topic": "tema", "newDocSays": "cita literal del nuevo", "existingDocSays": "cita literal del existente", "severity": "minor_inconsistency" }
  ],
  "overlappingContent": [
    { "description": "qué contenido concreto comparten (no rasgos genéricos)", "evidence": "cita literal del existente", "evidenceInNewDoc": "cita literal del nuevo" }
  ],
  "uniqueToNewDoc": ["aspecto 1", "aspecto 2"]
}`;

  try {
    const response = await callLLMJson<JudgeResponse>(prompt, { maxOutputTokens: 4096, temperature: 0.1 });

    // Frontera LLM→pipeline (F-39): contradictions es el único de los dos
    // arrays de la respuesta sin saneado por elemento — overlappingContent ya
    // lo tiene, dos líneas más abajo, con el .map() de siempre.
    const { contradictions, discarded: boundaryDiscarded } = sanitizeJudgeContradictions(response.contradictions);

    const rawJudgment: DocumentJudgment = {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: Math.max(0, Math.min(100, Math.round(response.overlapPercent || 0))),
      verdict: response.verdict || 'sin_relacion',
      contradictions,
      overlappingContent: (response.overlappingContent || []).map(o => ({
        description: o.description || '',
        evidence: o.evidence || '',
        evidenceInNewDoc: o.evidenceInNewDoc || '',
      })),
      uniqueToNewDoc: response.uniqueToNewDoc || [],
      ...(Object.keys(boundaryDiscarded).length > 0 ? { discarded: boundaryDiscarded } : {}),
    };

    // Log crudo (F-38/F-39): lo que el juez emitió ANTES de la verificación de
    // citas — el número que hoy no existe en ningún sitio (la línea
    // "Judge: N juicios emitidos" cuenta documentos, no hallazgos; la línea
    // "Verificador: N hallazgos" de la cascada cuenta lo que sobrevivió a esta
    // misma verificación). Sin esto, "0 hallazgos" no distingue "el juez no
    // emitió nada" de "el juez emitió y las citas los mataron". El hash se
    // calcula aquí, sobre `rawJudgment.contradictions` — las citas tal como
    // las devolvió el juez (ya saneadas por la frontera, pero sin pasar
    // todavía por verifyQuote) — porque es el único punto en el que ese texto
    // crudo sigue disponible sin ambigüedad.
    console.log(
      `[judge] RAW analizado="${newDocumentName}" candidato="${candidate.documentName}": ` +
      `overlap=${rawJudgment.overlapPercent}%, ${rawJudgment.contradictions.length} contradicciones, ` +
      `${rawJudgment.overlappingContent.length} solapamientos`
    );
    for (const c of rawJudgment.contradictions) {
      const hash = hashCitationPair(c.newDocSays, c.existingDocSays);
      console.log(`[judge] RAW analizado="${newDocumentName}" candidato="${candidate.documentName}" · [${hash}] "${c.topic.slice(0, 60)}"`);
    }

    const existingChunks = args.chunksByDocument?.get(candidate.documentId) ?? [];
    const existingFallbackText = args.fallbackTexts?.get(candidate.documentId) ?? null;
    // F-44: texto de las líneas de contexto ya está en candidate.fragments —
    // sin consulta nueva, es el mismo array que ya se recorrió para
    // existingFragsBlock más arriba.
    const existingContextTexts = candidate.fragments.filter(f => f.isContext).map(f => f.text);

    return fixQuotesInJudgment(
      rawJudgment,
      args.newDocumentChunks,
      args.newDocumentFallbackText,
      existingChunks,
      existingFallbackText,
      existingContextTexts,
    );
  } catch (err) {
    console.warn(`[judge] Failed for "${candidate.documentName}":`, err);
    return {
      judgment: {
        documentId: candidate.documentId,
        documentName: candidate.documentName,
        source: candidate.source,
        overlapPercent: 0,
        verdict: 'sin_relacion',
        contradictions: [],
        overlappingContent: [{ description: 'No se pudo emitir juicio (error del LLM)', evidence: '', evidenceInNewDoc: '' }],
        uniqueToNewDoc: [],
      },
      // Un elemento de evidencia vacío por cada entrada de overlappingContent
      // (aquí, la única: el marcador de error), para mantener el emparejamiento
      // por índice — este "hallazgo" no tiene cita real que verificar, así que
      // no hay nada que hashear: '????????' deja constancia visible de que es
      // el marcador de fallo del LLM, no un hash real ni un emparejamiento roto.
      evidence: { contradictions: [], overlaps: [{ hash: '????????', newChunk: null, existingChunk: null }] },
    };
  }
}

/**
 * F-53: el lado ANALIZADO, en el mismo formato barato que el candidato — sin
 * esto, el commit habría corregido un solo lado de la asimetría de
 * presentación que motiva todo el paso 5 (F-47). Recorre los chunks en orden
 * de documento (chunkIndex), no agrupados de antemano: una tabla se renderiza
 * ENTERA (todas sus filas, no una selección) la primera vez que aparece
 * cualquiera de sus chunks, y las tablas siguientes se saltan (`rendered`).
 * Un chunk de prosa se muestra tal cual, sin etiqueta — es la continuación
 * natural del texto corrido de siempre; la simetría que importa aquí es la de
 * las TABLAS, no la de envolver cada párrafo en un `[Fragmento N]` que hoy no
 * existe en este lado y que este commit no añade (fuera de alcance, ver
 * mensaje de commit).
 */
function buildAnalyzedDocumentText(chunks: StoredChunk[], documentName: string): string {
  const groups = groupChunksByTable(chunks);
  const groupByTableId = new Map(groups.map(g => [g.tableId, g]));
  const rendered = new Set<string>();
  const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);

  const pieces: string[] = [];
  for (const c of sorted) {
    if (c.chunkType === 'table_row' || c.chunkType === 'table_summary') {
      if (!c.tableId || rendered.has(c.tableId)) continue;
      const group = groupByTableId.get(c.tableId);
      if (!group) continue; // table_summary sin filas propias: no debería darse (F-44), degrada omitiéndolo, no inventando filas.
      rendered.add(c.tableId);
      pieces.push(renderTableBlock(group.sheetName, group.tableId, documentName, group.columns, group.totalRows, group.rows));
      continue;
    }
    pieces.push(c.text);
  }
  return pieces.join('\n\n');
}

/** Judgments y su evidencia de verificación, emparejados por POSICIÓN con
 *  `candidates` — evidences[i] corresponde a judgments[i] (F-35). */
export interface JudgeAllResult {
  judgments: DocumentJudgment[];
  evidences: JudgmentEvidence[];
}

/**
 * Lanza juicios para todos los candidatos: JUDGE_CONCURRENCY en paralelo, sin
 * pausa entre rondas, en los dos modos (F-31 P2). Documento truncado en
 * rápido, completo en exhaustivo — ver constantes arriba.
 */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
  options?: PipelineOptions;
  newDocumentChunks?: StoredChunk[];
  chunksByDocument?: Map<string, StoredChunk[]>;
  fallbackTexts?: Map<string, string>;
}): Promise<JudgeAllResult> {
  if (args.candidates.length === 0) return { judgments: [], evidences: [] };

  const isExhaustive = args.options?.exhaustive === true;

  // F-53: el texto del documento analizado sale de sus chunks, en el mismo
  // formato barato que el candidato — no de args.newDocumentSample (texto
  // plano). FALLBACK, declarado y contado: si no hay chunks (documento
  // indexado antes de F-20 llegado por la bandeja o el camino de mejora, sin
  // storagePath en esa petición — ver mensaje de commit, es una limitación
  // real, no una omisión), se usa args.newDocumentSample tal cual, como
  // siempre. No hay tercera vía: trocear "al vuelo" exigiría el fichero
  // original, que esos dos caminos no tienen.
  const hasChunks = (args.newDocumentChunks?.length ?? 0) > 0;
  if (!hasChunks) {
    console.warn(`[judge] "${args.newDocumentName}": sin newDocumentChunks — documento analizado en texto plano (fallback_sin_chunks)`);
  }
  const fullDocumentText = hasChunks
    ? buildAnalyzedDocumentText(args.newDocumentChunks!, args.newDocumentName)
    : args.newDocumentSample;

  // Modo rápido: truncar para ahorrar tokens (solo el texto del PROMPT).
  // Modo exhaustivo: documento completo.
  // El fallback de verificación (newDocumentFallbackText) usa SIEMPRE
  // args.newDocumentSample sin truncar: el LLM no pudo citar más allá de lo
  // que vio en el prompt, pero recortar también el haystack de verificación
  // no aporta nada y solo arriesga rechazar una cita real. Cuando no hay
  // chunks, newDocumentFallbackText y el prompt son EL MISMO texto plano —
  // consistente con el caso de chunks, donde también son dos vistas del
  // mismo documento.
  if (!isExhaustive && fullDocumentText.length > NEW_DOC_LIMIT_QUICK) {
    // F-53: antes pasaba en silencio (slice puro). El formato barato reduce
    // cuánto ocurre esto (medido: RRHH-06 deja de necesitarlo), pero no lo
    // elimina — OPE-06 lo sigue necesitando, y ahora queda dicho.
    console.warn(`[judge] "${args.newDocumentName}": documento analizado truncado a ${NEW_DOC_LIMIT_QUICK} de ${fullDocumentText.length} caracteres`);
  }
  const newDocumentText = isExhaustive
    ? fullDocumentText
    : fullDocumentText.slice(0, NEW_DOC_LIMIT_QUICK);

  const results = await runInBatches(
    args.candidates,
    candidate => judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentText,
      newDocumentFallbackText: args.newDocumentSample,
      newDocumentChunks: args.newDocumentChunks ?? [],
      candidate,
      chunksByDocument: args.chunksByDocument,
      fallbackTexts: args.fallbackTexts,
    }),
    { batchSize: JUDGE_CONCURRENCY },
  );

  return {
    judgments: results.map(r => r.judgment),
    evidences: results.map(r => r.evidence),
  };
}
