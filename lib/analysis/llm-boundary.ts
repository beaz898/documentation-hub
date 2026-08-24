import { createHash } from 'crypto';
import type { DocumentJudgment, DiscardedFindings } from './types';

/**
 * Frontera LLM→pipeline (F-39, de Fable).
 *
 * REGLA: ningún dato de un LLM entra al pipeline sin pasar por su función de
 * frontera, y lo que la frontera descarta se cuenta. No es un principio
 * abstracto: `JudgeResponse.contradictions[].topic` está declarado `string` en
 * judge.ts, no `string | undefined` — pero ese tipo describe lo que el PROMPT
 * pide, no lo que el modelo GARANTIZA. `callLLMJson<T>()` (lib/llm/anthropic-client.ts)
 * hace `JSON.parse(...) as T`: un cast borrado en tiempo de compilación, cero
 * comprobación en tiempo de ejecución. Cuando el modelo omite un campo, el
 * tipo sigue afirmando que está — hasta que algo lo usa.
 *
 * HISTORIA que motiva este fichero: `contradictions` era, de los dos arrays
 * de la respuesta del juez, el único sin saneado por elemento —
 * `overlappingContent` sí tiene un `.map()` que defaultea `description`,
 * `evidence` y `evidenceInNewDoc` campo a campo; `contradictions` solo tenía
 * `response.contradictions || []`, que protege el ARRAY pero no sus
 * elementos. Consecuencia medida: 7 puntos del pipeline que lanzan
 * (`.slice()`, `.trim()`, `.toLowerCase()` sobre `c.topic` cuando llega
 * `undefined`) y varios más que propagan la palabra literal "undefined" como
 * texto — incluido el prompt de verifyFindings, que llegaría a preguntarle a
 * otro LLM sobre un hallazgo titulado "undefined".
 *
 * PATRÓN, generalizado desde `toOutcome` (verify-findings.ts): no confiar en
 * el tipo declarado de una respuesta de modelo — tratarla como `unknown`,
 * comprobar cada campo en tiempo de ejecución, y ante un valor ausente o mal
 * formado, producir un resultado seguro CONTADO en vez de dejar pasar el dato
 * sin marca o lanzar una excepción que tira el juicio completo del candidato.
 *
 * ASIMETRÍA DELIBERADA entre campos, y es a propósito:
 *   - Sin citas (`newDocSays`/`existingDocSays` ausentes, no-string o vacías
 *     tras recortar) el elemento SE DESCARTA ENTERO. Un hallazgo sin citas no
 *     es un hallazgo degradado — es uno que no existe. Dejarlo pasar con una
 *     cita vacía lo mataría más tarde en fixQuotesInJudgment como
 *     `citaNoVerificable`, un motivo FALSO: no es que la cita no se pudiera
 *     verificar contra el documento, es que nunca hubo cita que verificar.
 *   - Sin `topic`, el elemento SOBREVIVE con `topic: ''`. La cadena vacía es
 *     precisamente lo que dispara el respaldo de plantilla que ya existe en
 *     la cascada (pipeline.ts, `c.topic?.trim() ? c.topic : buildStructuralTopic(...)`,
 *     commit 51e2111b) — la frontera no necesita saber nada de esa plantilla,
 *     solo dejar el campo en el estado que el siguiente consumidor ya sabe
 *     interpretar.
 *   - `severity` inválido: se omite el campo (es opcional en el tipo de
 *     destino) en vez de inventar un valor.
 *
 * Funciones puras: sin llamadas a modelo, sin base de datos, sin efectos.
 */

/** Recuento de motivos de la frontera, con prefijo propio para distinguirlos
 *  de `descartado.*`/`a_juicio.*` (cascada) y `descartado.*` (verify-findings)
 *  al leerlos en `judgment.discarded`. */
const REASON_PREFIX = 'frontera';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanea `contradictions` tal como llega en el JSON del juez, sin fiarse de
 * `JudgeResponse` — `raw` es `unknown` a propósito: ese es justo el punto,
 * decidir aquí qué es válido en vez de heredar la confianza del cast.
 *
 * Ramas, en orden:
 *   1. `raw` no es un array → `[]` + `frontera.contradicciones_no_es_array`.
 *      No basta con `|| []`: el modelo podría devolver un objeto o un string,
 *      y ambos son "truthy" — `||` no los habría atrapado.
 *   2. Cada elemento que no sea un objeto plano (null, array, string, número,
 *      undefined) → se descarta, `frontera.elemento_no_objeto`.
 *   3. `newDocSays` o `existingDocSays` ausentes, no-string, o vacíos tras
 *      `.trim()` → el elemento entero se descarta, `frontera.cita_ausente`.
 *   4. `topic` ausente o no-string → NO se descarta: se rellena con `''` y se
 *      cuenta `frontera.topic_ausente`.
 *   5. `severity` que no sea exactamente `'contradiction'` o
 *      `'minor_inconsistency'` (incluida su ausencia) → se omite el campo del
 *      objeto de salida y se cuenta `frontera.severity_invalida`.
 *
 * No lanza con ninguna entrada — cada comprobación es un type-guard antes de
 * acceder a la propiedad, nunca un acceso que asuma la forma.
 */
export function sanitizeJudgeContradictions(raw: unknown): {
  contradictions: DocumentJudgment['contradictions'];
  discarded: DiscardedFindings;
} {
  const discarded: DiscardedFindings = {};
  const bump = (reason: string): void => {
    const key = `${REASON_PREFIX}.${reason}`;
    discarded[key] = (discarded[key] ?? 0) + 1;
  };

  if (!Array.isArray(raw)) {
    bump('contradicciones_no_es_array');
    return { contradictions: [], discarded };
  }

  const contradictions: DocumentJudgment['contradictions'] = [];

  for (const item of raw) {
    if (!isPlainObject(item)) {
      bump('elemento_no_objeto');
      continue;
    }

    const newDocSays = item.newDocSays;
    const existingDocSays = item.existingDocSays;
    if (!isNonBlankString(newDocSays) || !isNonBlankString(existingDocSays)) {
      bump('cita_ausente');
      continue;
    }

    const topicRaw = item.topic;
    const hasTopic = typeof topicRaw === 'string';
    if (!hasTopic) bump('topic_ausente');

    const severityRaw = item.severity;
    const validSeverity = severityRaw === 'contradiction' || severityRaw === 'minor_inconsistency';
    if (!validSeverity) bump('severity_invalida');

    contradictions.push({
      topic: hasTopic ? topicRaw : '',
      newDocSays,
      existingDocSays,
      ...(validSeverity ? { severity: severityRaw as 'contradiction' | 'minor_inconsistency' } : {}),
    });
  }

  return { contradictions, discarded };
}

/**
 * Hash corto (8 hex) de un par de citas — el identificador que sobrevive a un
 * retitulado. F-38: `topic` no vale como identificador porque una etapa puede
 * reescribirlo (y lo hacía: costó día y medio de diagnóstico rastrear un
 * hallazgo por su nombre y no encontrarlo). Las citas identifican el
 * hallazgo, y cuando cambian —en verifyQuote, judge.ts, al sustituirse por el
 * texto real del chunk— es una sustitución de FORMA, no un retitulado de
 * CONTENIDO: por eso el hash se calcula siempre sobre las citas tal como las
 * emitió el juez, antes de esa sustitución, nunca después.
 *
 * Extiende el patrón de `generateContentHash` (hash-check.ts): mismo
 * `createHash('sha256')`, recortado a 8 caracteres — sobra para distinguir
 * entre los pocos hallazgos de una sola ejecución, y un hash largo en cada
 * línea de log sería ruido.
 *
 * Normaliza igual que `hash-check.ts` (minúsculas, espacios colapsados) para
 * que el mismo hallazgo dé el mismo hash entre ejecuciones si el texto no
 * cambió. Normalización propia, no importada de `hash-check.ts` ni de
 * `judge.ts`: judge.ts ya importa de este fichero
 * (`sanitizeJudgeContradictions`), e importar `normalize()` de judge.ts aquí
 * crearía un ciclo.
 */
export function hashCitationPair(newDocSays: string, existingDocSays: string): string {
  const normalizeForHash = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const combined = `${normalizeForHash(newDocSays)}|${normalizeForHash(existingDocSays)}`;
  return createHash('sha256').update(combined, 'utf8').digest('hex').slice(0, 8);
}
