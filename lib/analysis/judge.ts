import { callLLMJson } from './llm-client';
import { runInBatches } from '@/lib/run-in-batches';
import type { RerankedCandidate, DocumentJudgment, PipelineOptions, DiscardedFindings, DocumentFragment } from './types';

/**
 * Etapa 3 — Juicio individual por documento.
 *
 * Modo rápido: secuencial con pausa (1200ms), documento truncado a 6000 chars.
 * Modo exhaustivo: 2 en paralelo con pausa entre rondas (500ms),
 *   documento completo.
 *
 * Post-procesamiento: las citas del LLM se verifican contra el texto real
 * del documento y se corrigen con match fuzzy si no coinciden exactamente.
 */

/** Límite de texto del doc nuevo en modo rápido (ahorra tokens). */
const NEW_DOC_LIMIT_QUICK = 6000;

/** Pausa entre juicios secuenciales en modo rápido. */
const SEQUENTIAL_DELAY_QUICK_MS = 1200;

/** Concurrencia en modo exhaustivo. */
const EXHAUSTIVE_CONCURRENCY = 5;

/** Pausa entre rondas en modo exhaustivo. */
const EXHAUSTIVE_ROUND_DELAY_MS = 500;

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

/**
 * Normaliza para comparación fuzzy. La clase de caracteres ignorados incluye
 * el marcado Markdown (* _ # ` ~) junto a la puntuación: el LLM cita el
 * texto VISIBLE del documento ("24 HORAS"), no el marcado que lo envuelve
 * en la fuente ("**24 HORAS**"), así que ambos deben normalizar igual para
 * que la comparación coincida.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"""''«»()[\]{}\-—–…*_#`~]/g, '')
    .trim();
}

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

/** Prefijo con el que la extracción de hojas de cálculo abre cada fila. */
const SPREADSHEET_ROW_PREFIX = /^\[Hoja "/;

/**
 * Trocea una cita por "|" para verificarla segmento a segmento.
 * No exige que la propia cita lleve el prefijo de hoja: el modelo trata ese
 * prefijo como una etiqueta técnica de límite de fragmento, no como contenido
 * que copiar, así que casi nunca lo reproduce. La garantía de seguridad no
 * está aquí — está en findRowContainingSegments, que solo acepta como fila
 * válida un bloque del documento que SÍ empiece por el prefijo de hoja. Eso
 * basta para que "compartir bloque" siga significando "mismo registro",
 * quedando fuera tanto la prosa como el formato Markdown antiguo.
 */
function splitTabularSegments(quote: string): string[] | null {
  if (!quote.includes('|')) return null;
  const segments = quote.split('|').map(s => s.trim()).filter(Boolean);
  if (segments.length < 2) return null;
  if (segments.some(s => s.length < 10)) return null;
  return segments;
}

/**
 * Verifica una cita que enumera columnas de una fila de tabla.
 * El modelo cita las columnas comparables y omite las intermedias, así que la
 * cadena literal no existe aunque el contenido sea correcto. Se verifica cada
 * segmento por separado y se exige que TODOS estén en la MISMA fila del
 * documento (un bloque entre líneas en blanco). Es más estricto que aceptar
 * la cita entera por aproximación: cada columna se comprueba una a una y no
 * se admiten segmentos repartidos entre filas distintas.
 * Devuelve la fila real completa, que es la cita honesta.
 */
function findRowContainingSegments(haystack: string, segments: string[]): string | null {
  for (const row of haystack.split(/\n\s*\n/)) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    // Única barrera real: el bloque candidato tiene que ser una fila
    // generada por nuestra extracción de hojas de cálculo. Solo entonces
    // "todos los segmentos están en este bloque" implica "todos pertenecen
    // al mismo registro" — en un párrafo de prosa, dos frases sin relación
    // pueden convivir en el mismo bloque, y en el formato Markdown antiguo
    // un bloque podía agrupar varias filas distintas. Ninguno de los dos
    // empieza por este prefijo (verificado contra su código real), así que
    // basta para dejarlos fuera sin tener que reconocer su formato exacto.
    if (!SPREADSHEET_ROW_PREFIX.test(trimmed)) continue;
    if (segments.every(segment => findBestMatch(trimmed, segment) !== null)) {
      // El prefijo de hoja es fontanería del extractor, no contenido del
      // documento: se usa para validar la fila, pero no debe aparecer dentro
      // de una cita que lee el usuario.
      return trimmed.replace(/^\[Hoja "[^"]*"\]\s*/, '');
    }
  }
  return null;
}

function verifyQuote(haystack: string, quote: string | undefined): string | null {
  if (!quote) return null;
  const direct = findBestMatch(haystack, quote);
  if (direct) return direct;
  const segments = splitTabularSegments(quote);
  if (!segments) return null;
  return findRowContainingSegments(haystack, segments);
}

function fixQuotesInJudgment(
  judgment: DocumentJudgment,
  newDocumentText: string,
  existingDocumentText: string,
  existingTextSource: 'completo' | 'fragmentos',
): DocumentJudgment {
  let narracionEnCita = 0;
  let citaNoVerificable = 0;

  const fixedContradictions: DocumentJudgment['contradictions'] = [];
  for (const c of judgment.contradictions) {
    if (containsNarration(c.newDocSays) || containsNarration(c.existingDocSays)) {
      console.warn(`[judge] Contradicción descartada en "${judgment.documentName}" (narración en la cita)`);
      narracionEnCita++;
      continue;
    }

    const matchNew = verifyQuote(newDocumentText, c.newDocSays);
    const matchExisting = verifyQuote(existingDocumentText, c.existingDocSays);

    if (matchNew && matchExisting) {
      fixedContradictions.push({ ...c, newDocSays: matchNew, existingDocSays: matchExisting });
    } else {
      const failedSide = !matchNew ? 'newDocSays' : 'existingDocSays';
      const failedText = !matchNew ? c.newDocSays : c.existingDocSays;
      const sourceNote = failedSide === 'existingDocSays' ? `, verificado contra ${existingTextSource}` : '';
      console.warn(
        `[judge] Contradicción descartada en "${judgment.documentName}" (cita no verificable, lado=${failedSide}${sourceNote}): "${(failedText || '').slice(0, 60)}"`
      );
      citaNoVerificable++;
    }
  }

  const fixedOverlaps: DocumentJudgment['overlappingContent'] = [];
  for (const o of judgment.overlappingContent) {
    if (containsNarration(o.evidenceInNewDoc) || containsNarration(o.evidence)) {
      console.warn(`[judge] Solapamiento descartado en "${judgment.documentName}" (narración en la cita)`);
      narracionEnCita++;
      continue;
    }

    const matchNew = verifyQuote(newDocumentText, o.evidenceInNewDoc);
    const matchExisting = verifyQuote(existingDocumentText, o.evidence);

    if (matchNew && matchExisting) {
      fixedOverlaps.push({ ...o, evidenceInNewDoc: matchNew, evidence: matchExisting });
    } else {
      const failedSide = !matchNew ? 'evidenceInNewDoc' : 'evidence';
      const failedText = !matchNew ? o.evidenceInNewDoc : o.evidence;
      const sourceNote = failedSide === 'evidence' ? `, verificado contra ${existingTextSource}` : '';
      console.warn(
        `[judge] Solapamiento descartado en "${judgment.documentName}" (cita no verificable, lado=${failedSide}${sourceNote}): "${(failedText || '').slice(0, 60)}"`
      );
      citaNoVerificable++;
    }
  }

  const discardedCount = narracionEnCita + citaNoVerificable;

  if (discardedCount > 0) {
    console.warn(`[judge] Descartados ${discardedCount} hallazgos no verificables en "${judgment.documentName}"`);
  }

  const discarded: DiscardedFindings = {};
  if (narracionEnCita > 0) discarded.narracionEnCita = narracionEnCita;
  if (citaNoVerificable > 0) discarded.citaNoVerificable = citaNoVerificable;

  return {
    ...judgment,
    contradictions: fixedContradictions,
    overlappingContent: fixedOverlaps,
    ...(Object.keys(discarded).length > 0 ? { discarded } : {}),
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
  const ctx = fragment.context;
  if (!ctx) return `[Fragmento ${position} de "${documentName}"]`;

  if (ctx.chunkType === 'table_row') {
    const sheet = ctx.sheetName ? ` hoja "${ctx.sheetName}"` : '';
    const row = ctx.rowIndex !== null ? `, fila ${ctx.rowIndex + 1}` : '';
    const columns = ctx.cells ? Object.keys(ctx.cells).join(', ') : '';
    const columnsPart = columns ? `. Columnas: ${columns}` : '';
    return `[Fragmento ${position} de "${documentName}" — FILA DE TABLA:${sheet}${row}${columnsPart}]`;
  }

  if (ctx.chunkType === 'table_summary') {
    const sheet = ctx.sheetName ? ` de la hoja "${ctx.sheetName}"` : '';
    return `[Fragmento ${position} de "${documentName}" — RESUMEN DE TABLA${sheet}]`;
  }

  return `[Fragmento ${position} de "${documentName}"]`;
}

async function judgeSingleDocument(args: {
  newDocumentName: string;
  newDocumentText: string;
  candidate: RerankedCandidate;
  fullTexts?: Map<string, string>;
}): Promise<DocumentJudgment> {
  const { newDocumentName, newDocumentText, candidate, fullTexts } = args;

  const existingFragsBlock = candidate.fragments
    .map((f, i) => `${describeFragment(f, i + 1, candidate.documentName)}\n${f.text}`)
    .join('\n\n');

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
- El mismo empleado con datos distintos en dos tablas de temas distintos (turnos y evaluaciones) no es contradicción: son datos complementarios sobre la misma persona.

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
    const rawJudgment: DocumentJudgment = {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: Math.max(0, Math.min(100, Math.round(response.overlapPercent || 0))),
      verdict: response.verdict || 'sin_relacion',
      contradictions: response.contradictions || [],
      overlappingContent: (response.overlappingContent || []).map(o => ({
        description: o.description || '',
        evidence: o.evidence || '',
        evidenceInNewDoc: o.evidenceInNewDoc || '',
      })),
      uniqueToNewDoc: response.uniqueToNewDoc || [],
    };

    const fullText = fullTexts?.get(candidate.documentId);
    let existingDocumentText: string;
    let existingTextSource: 'completo' | 'fragmentos';
    if (fullText) {
      existingDocumentText = fullText;
      existingTextSource = 'completo';
    } else {
      existingDocumentText = candidate.fragments.map(f => f.text).join('\n\n');
      existingTextSource = 'fragmentos';
      console.warn(`[judge] Sin full_text para "${candidate.documentName}", usando fragmentos recuperados como fallback`);
    }

    return fixQuotesInJudgment(rawJudgment, newDocumentText, existingDocumentText, existingTextSource);
  } catch (err) {
    console.warn(`[judge] Failed for "${candidate.documentName}":`, err);
    return {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: 0,
      verdict: 'sin_relacion',
      contradictions: [],
      overlappingContent: [{ description: 'No se pudo emitir juicio (error del LLM)', evidence: '', evidenceInNewDoc: '' }],
      uniqueToNewDoc: [],
    };
  }
}

/**
 * Lanza juicios para todos los candidatos.
 *
 * Modo rápido: secuencial con pausa de 1200ms, documento truncado.
 * Modo exhaustivo: 5 en paralelo con pausa de 500ms entre rondas,
 *   documento completo.
 */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
  options?: PipelineOptions;
  fullTexts?: Map<string, string>;
}): Promise<DocumentJudgment[]> {
  if (args.candidates.length === 0) return [];

  const isExhaustive = args.options?.exhaustive === true;

  // Modo rápido: truncar para ahorrar tokens
  // Modo exhaustivo: documento completo
  const newDocumentText = isExhaustive
    ? args.newDocumentSample
    : args.newDocumentSample.slice(0, NEW_DOC_LIMIT_QUICK);

  if (isExhaustive) {
    // Paralelo controlado: EXHAUSTIVE_CONCURRENCY a la vez con pausa entre rondas
    return runInBatches(
      args.candidates,
      candidate => judgeSingleDocument({
        newDocumentName: args.newDocumentName,
        newDocumentText,
        candidate,
        fullTexts: args.fullTexts,
      }),
      { batchSize: EXHAUSTIVE_CONCURRENCY, delayMs: EXHAUSTIVE_ROUND_DELAY_MS },
    );
  }

  // Secuencial con pausa (modo rápido)
  const results: DocumentJudgment[] = [];
  for (let i = 0; i < args.candidates.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, SEQUENTIAL_DELAY_QUICK_MS));
    const judgment = await judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentText,
      candidate: args.candidates[i],
      fullTexts: args.fullTexts,
    });
    results.push(judgment);
  }
  return results;
}
