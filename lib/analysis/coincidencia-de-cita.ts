import type { StoredChunk } from '@/lib/read-chunks';
import type { LecturaDeLaPareja } from './types';
import type { VerifiedQuote } from './judge';
import { normalize } from './normalize';
import { despegarPunteroDeFila, groupChunksByTable, renderTableRow } from './table-structure';

/**
 * ¿ESTÁ ESTA CITA EN ESTE TEXTO? — sacado de `judge.ts` el 01/10/2026 (B.299,
 * causa ii), que va por 1.365 líneas contra una regla de 400 (B.296).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ EL DIAGNÓSTICO DE FONDO, y por qué este fichero existe: **los dos lados de
 * una comparación que tiene que casar se limpiaban con dos funciones distintas,
 * y ninguna de las dos era la de la otra.** La cita pasaba por `normalize()`
 * —que colapsa los espacios ANTES de quitar la puntuación— y el texto del trozo
 * por un bucle propio de `findBestMatch` —que quitaba la puntuación ANTES de
 * colapsar—. Con un signo suelto entre espacios, «a — b» quedaba `a  b` en la
 * cita y `a b` en el trozo: **el texto no casaba consigo mismo.** No era un
 * ajuste fino.
 *
 * LA CURA: una sola normalización para los dos lados, la de `normalize()`.
 * El lado del texto necesita además saber DE DÓNDE sale cada carácter, para
 * devolver el recorte original, y eso es `normalizarConPosiciones`: la MISMA
 * transformación, con el mapa de posiciones.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ `normalize()` NO SE TOCA. La usan el retrieval, las reglas de hallazgos,
 * las claves y el diff de tablas, y el examen (`lib/examen/discriminantes.mjs`,
 * `marcador.mjs`, `comparador-tabular.mjs`): cambiarla movería la línea de base
 * del arnés. Lo que se cambia es el lado que NO la usaba.
 */

/** Un texto normalizado, y para cada carácter suyo la posición en el original. */
export interface TextoNormalizado {
  texto: string;
  posiciones: number[];
}

/** ¿Quita `normalize()` este carácter? Se le PREGUNTA a ella —un criterio se
 *  implementa una vez—: un carácter que no es espacio y que `normalize()`
 *  convierte en la cadena vacía es puntuación para ella. */
const esPuntuacion = (() => {
  const memoria = new Map<string, boolean>();
  return (c: string): boolean => {
    let r = memoria.get(c);
    if (r === undefined) {
      r = !/\s/.test(c) && normalize(c) === '';
      memoria.set(c, r);
    }
    return r;
  };
})();

/**
 * La MISMA transformación que `normalize()`, paso por paso y en su orden
 * (`lib/analysis/normalize-core.mjs`): minúsculas → cada tirada de espacios a
 * uno → fuera la puntuación → recortar los extremos. Y para cada carácter del
 * resultado, de qué posición del original sale.
 *
 * La prueba de que es la misma está en `coincidencia-de-cita.test.ts`:
 * `normalizarConPosiciones(s).texto === normalize(s)` sobre una batería que
 * incluye los casos que la versión anterior rompía.
 */
export function normalizarConPosiciones(original: string): TextoNormalizado {
  // 1 · Minúsculas, sobre la cadena ENTERA como `normalize()` (la sigma final
  //     griega depende del contexto). Si cambia la longitud —un carácter cuya
  //     minúscula ocupa dos unidades, como la «İ» turca—, se baja carácter a
  //     carácter para no perder el mapa.
  const bajo = original.toLowerCase();
  const paso1: Array<{ c: string; pos: number }> = [];
  if (bajo.length === original.length) {
    for (let i = 0; i < bajo.length; i++) paso1.push({ c: bajo[i], pos: i });
  } else {
    let i = 0;
    for (const punto of original) {
      for (const c of punto.toLowerCase()) paso1.push({ c, pos: i });
      i += punto.length;
    }
  }

  // 2 · Cada tirada de espacios, a un solo espacio (el de su primera posición).
  const paso2: Array<{ c: string; pos: number }> = [];
  let enEspacio = false;
  for (const x of paso1) {
    if (/\s/.test(x.c)) {
      if (!enEspacio) paso2.push({ c: ' ', pos: x.pos });
      enEspacio = true;
    } else {
      paso2.push(x);
      enEspacio = false;
    }
  }

  // 3 · Fuera la puntuación, DESPUÉS de colapsar: es el orden de `normalize()`,
  //     y por eso «a — b» deja dos espacios aquí igual que allí.
  const paso3 = paso2.filter(x => !esPuntuacion(x.c));

  // 4 · Recortar los espacios de los extremos.
  let inicio = 0;
  let fin = paso3.length;
  while (inicio < fin && paso3[inicio].c === ' ') inicio++;
  while (fin > inicio && paso3[fin - 1].c === ' ') fin--;
  const final = paso3.slice(inicio, fin);

  return { texto: final.map(x => x.c).join(''), posiciones: final.map(x => x.pos) };
}

/** Por qué vía casó una cita, o en qué punto se quedó si no casó. Los de fallo
 *  van de menos a más avanzado: es el orden en que se elige el «más lejos». */
export type PasoDeLaCita =
  | 'literal'
  | 'normalizada'
  | 'cabeza_y_cola'
  | 'vacia_o_corta'
  | 'sin_coincidencia'
  | 'sin_cabeza'
  | 'cabeza_sin_cola'
  | 'cola_demasiado_lejos';

const AVANCE_DEL_FALLO: Record<PasoDeLaCita, number> = {
  literal: 9, normalizada: 9, cabeza_y_cola: 9,
  vacia_o_corta: 0, sin_coincidencia: 1, sin_cabeza: 1, cabeza_sin_cola: 2, cola_demasiado_lejos: 3,
};

/** La búsqueda entera: el recorte del original (o null) y la vía o el fallo. */
function buscarCita(haystack: string, needle: string): { recorte: string | null; paso: PasoDeLaCita } {
  if (!needle || needle.length < 10) return { recorte: null, paso: 'vacia_o_corta' };

  if (haystack.indexOf(needle) !== -1) return { recorte: needle, paso: 'literal' };

  const normNeedle = normalize(needle);
  if (normNeedle.length < 8) return { recorte: null, paso: 'vacia_o_corta' };

  const { texto: normHaystack, posiciones } = normalizarConPosiciones(haystack);

  const normIdx = normHaystack.indexOf(normNeedle);
  if (normIdx !== -1 && posiciones[normIdx] !== undefined) {
    const inicio = posiciones[normIdx];
    const fin = (posiciones[normIdx + normNeedle.length - 1] ?? inicio) + 1;
    return { recorte: haystack.slice(inicio, fin), paso: 'normalizada' };
  }

  if (normNeedle.length < 25) return { recorte: null, paso: 'sin_coincidencia' };

  const headLen = Math.min(20, Math.floor(normNeedle.length * 0.4));
  const tailLen = Math.min(20, Math.floor(normNeedle.length * 0.4));
  const head = normNeedle.slice(0, headLen);
  const tail = normNeedle.slice(-tailLen);

  const headIdx = normHaystack.indexOf(head);
  if (headIdx === -1) return { recorte: null, paso: 'sin_cabeza' };
  const tailIdx = normHaystack.indexOf(tail, headIdx + head.length);
  if (tailIdx === -1) return { recorte: null, paso: 'cabeza_sin_cola' };

  const inicio = posiciones[headIdx];
  const fin = (posiciones[tailIdx + tail.length - 1] ?? inicio) + 1;
  if (fin - inicio < needle.length * 3) {
    return { recorte: haystack.slice(inicio, fin), paso: 'cabeza_y_cola' };
  }
  return { recorte: null, paso: 'cola_demasiado_lejos' };
}

/**
 * El recorte del original donde está la cita, o null. Tres vías, en orden:
 * literal; normalizada (con LA MISMA normalización a los dos lados); y, con 25
 * caracteres normalizados o más, la cabeza y la cola —hasta 20 cada una— en
 * orden y a menos de tres veces la longitud de la cita.
 *
 * Mismo contrato que tenía dentro de `judge.ts`: sólo cambia la normalización
 * del lado del texto, que ahora es la de la cita.
 */
export function findBestMatch(haystack: string, needle: string): string | null {
  return buscarCita(haystack, needle).recorte;
}

/**
 * Para el log de un descarte por cita no verificable (B.299): la longitud de la
 * cita y el paso más avanzado al que llegó en cualquiera de los pajares que se
 * probaron. Convierte la «tercera causa» en algo contable.
 *
 * Sólo describe la vía CONTIGUA —la de `findBestMatch`—; la de segmentos de
 * tabla tiene su propio predicado y aquí no se repite. No escribe texto del
 * cliente: sólo números y el nombre del paso. Qué pajares son lo decide quien
 * llama (`comprobadorDeLado`), que es quien sabe cuáles usó.
 */
/** B.313: por qué vía PASÓ una cita, y su longitud. Mismos pajares y mismo
 *  orden que la decisión (`verifyQuote` prueba los trozos en orden, y el
 *  comprobador contiguo el texto antes que las filas), con la misma búsqueda:
 *  el primer pajar donde casa da la vía. Si no casa en ninguno, pasó por la
 *  vía de segmentos de fila de `verifyQuote`, que aquí no se repite. */
export function describirAcierto(pajares: string[], quote: string | undefined): string {
  const { texto: cita } = despegarPunteroDeFila(quote ?? '');
  let via: PasoDeLaCita | 'segmentos_de_fila' = 'segmentos_de_fila';
  for (const pajar of pajares) {
    const { recorte, paso } = buscarCita(pajar, cita);
    if (recorte !== null) { via = paso; break; }
  }
  return `longitud=${cita.length}, paso=${via}`;
}

export function describirDescarte(pajares: string[], quote: string | undefined): string {
  if (!quote) return 'longitud=0, paso=vacia_o_corta';
  const { texto: cita } = despegarPunteroDeFila(quote);
  let masLejos: PasoDeLaCita = 'vacia_o_corta';
  for (const pajar of pajares) {
    const { paso } = buscarCita(pajar, cita);
    if (AVANCE_DEL_FALLO[paso] > AVANCE_DEL_FALLO[masLejos]) masLejos = paso;
  }
  return `longitud=${cita.length}, paso=${masLejos}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// B.299, CAUSA (i) — EL PAJAR ES LO QUE LEYÓ EL JUEZ (01/10/2026)
// ═══════════════════════════════════════════════════════════════════════════
//
// La pregunta que contesta la comprobación es «¿citó el juez fielmente lo que
// se le dio?». Su pajar es el texto ENTREGADO a ese lado en esa pareja, no el
// documento ni todos sus trozos: verificar contra lo que el juez nunca vio da
// por buena una cita real que no se sigue de lo leído (la especie de F-22 y
// F-116). La otra pregunta, «¿existe la frase en el documento del cliente?»,
// es la de B.310, y el día que el troceado no pegue títulos las dos serán la
// misma.
//
// ⚠️ A PRUEBA DE FALLO: si de un lado no se tiene lo entregado, NO se decide en
// silencio —ni verificar todo ni tirar todo—: se cae al camino de antes (todos
// los trozos, o el texto completo) y el log dice con qué pajar se comprobó.

/** Con qué pajar se comprobó una cita. Va en el log de cada descarte. */
export type PajarDeLaCita =
  /** El texto entregado al juez, como UNA cadena: el lado se le dio contiguo. */
  | 'entregado_texto'
  /** Los trozos entregados al juez, UNO A UNO: el candidato por relevancia. */
  | 'entregado_piezas'
  /** A prueba de fallo, sin lo entregado: el camino de antes, por trozos. */
  | 'todos_los_trozos'
  /** A prueba de fallo, sin lo entregado y sin trozos: el texto completo. */
  | 'texto_completo'
  /** No había nada contra lo que comprobar. */
  | 'sin_pajar';

/**
 * Lo que se le entregó al juez de UN lado.
 * - `texto`: el texto exacto del prompt, si el lado se entregó CONTIGUO (el
 *   analizado siempre; el candidato cuando va entero). `null` si se entregó
 *   por piezas.
 * - `trozos`: en un lado contiguo, las filas de tabla que quedaron VISIBLES
 *   (una tabla se comprueba por fila: el pajar de una fila es la fila). En un
 *   lado por piezas, los trozos que el juez recibió.
 */
export interface LoEntregado {
  texto: string | null;
  trozos: StoredChunk[];
}

/** La verificación de siempre (`verifyQuote`). Se recibe, no se importa: el
 *  juez importa este fichero, y al revés sería un ciclo. */
export type VerificarCita = (
  chunks: StoredChunk[],
  fallbackText: string | null,
  quote: string | undefined,
) => VerifiedQuote | null;

/** Lo que el juez usa para comprobar las citas de UN lado. */
export interface ComprobadorDeLado {
  comprobar(quote: string | undefined): VerifiedQuote | null;
  /** Longitud, paso y pajar: lo que va en el log de un descarte. */
  describir(quote: string | undefined): string;
  /** Lo mismo para una cita que PASÓ (B.313): el denominador del registro. */
  describirAcierto(quote: string | undefined): string;
}

/** Las filas de tabla cuya línea, pintada con LA MISMA función que el juez lee
 *  (`renderTableRow` con las columnas de `groupChunksByTable`, como
 *  `buildAnalyzedDocumentText`), aparece entera en el texto entregado. Una fila
 *  partida por el corte no cuenta. */
function filasVisibles(chunks: StoredChunk[], texto: string): StoredChunk[] {
  const visibles: StoredChunk[] = [];
  for (const g of groupChunksByTable(chunks)) {
    for (const fila of g.rows) {
      if (texto.includes(renderTableRow(fila.rowIndex, fila.cells, g.columns))) visibles.push(fila);
    }
  }
  return visibles;
}

/** ¿Se le entregó el candidato ENTERO y renderizado (contiguo), y no por su
 *  bloque de relevancia? Se decide con la lectura que ya se guarda (B.295):
 *  régimen nuevo, sin dejar nada fuera y con todo mostrado. Ante la duda, NO:
 *  por piezas es lo más estricto. */
export function candidatoEntregadoEntero(l: LecturaDeLaPareja): boolean {
  return (l.regimen === 'pareja_entera' || l.regimen === 'corte_honesto')
    && l.candidato.dejoFuera === false
    && l.candidato.caracteres !== null
    && l.candidato.mostrados === l.candidato.caracteres;
}

/** Lo entregado a cada lado de una pareja, con lo que `leerLaPareja` ya
 *  calculó para el prompt. `null` en un lado = no se sabe: camino de antes. */
export function loEntregadoDeLaPareja(a: {
  pareja: { textoAnalizado: string; bloqueCandidato: string; representados: number[]; lectura: LecturaDeLaPareja };
  analizadoChunks: StoredChunk[];
  candidatoChunks: StoredChunk[];
}): { nuevo: LoEntregado | null; existente: LoEntregado | null } {
  const { pareja } = a;
  const nuevo: LoEntregado | null = pareja.textoAnalizado
    ? { texto: pareja.textoAnalizado, trozos: filasVisibles(a.analizadoChunks, pareja.textoAnalizado) }
    : null;
  let existente: LoEntregado | null = null;
  if (a.candidatoChunks.length > 0) {
    if (candidatoEntregadoEntero(pareja.lectura)) {
      existente = { texto: pareja.bloqueCandidato, trozos: filasVisibles(a.candidatoChunks, pareja.bloqueCandidato) };
    } else if (pareja.representados.length > 0) {
      const enviados = new Set(pareja.representados);
      existente = { texto: null, trozos: a.candidatoChunks.filter(c => enviados.has(c.chunkIndex)) };
    }
  }
  return { nuevo, existente };
}

/**
 * El comprobador de UN lado.
 * - Sin lo entregado (`null`): el camino de antes, idéntico.
 * - Entregado por piezas: `verificar` sólo con esos trozos, uno a uno. Una cita
 *   que cruce dos piezas falla, y por el motivo correcto: esa frase no existe.
 * - Entregado contiguo: la EXISTENCIA se decide en el texto entregado; el trozo
 *   de evidencia y las columnas se buscan después entre todos los trozos (si
 *   no aparece, `chunk: null`, como ya hace el respaldo). Si la cita no está en
 *   el texto, se prueba por fila con las filas visibles.
 */
export function comprobadorDeLado(
  verificar: VerificarCita,
  entregado: LoEntregado | null,
  chunks: StoredChunk[],
  fallbackText: string | null,
): ComprobadorDeLado {
  const pajar: PajarDeLaCita = entregado
    ? (entregado.texto !== null ? 'entregado_texto' : 'entregado_piezas')
    : (chunks.length > 0 ? 'todos_los_trozos' : fallbackText ? 'texto_completo' : 'sin_pajar');

  const comprobar = (quote: string | undefined): VerifiedQuote | null => {
    if (!entregado) return verificar(chunks, fallbackText, quote);
    if (entregado.texto === null) return verificar(entregado.trozos, null, quote);
    if (!quote) return null;
    const { texto: cita } = despegarPunteroDeFila(quote);
    if (findBestMatch(entregado.texto, cita) !== null) {
      return verificar(chunks, null, quote) ?? { text: cita, chunk: null, columns: null, porCeldas: false };
    }
    return entregado.trozos.length > 0 ? verificar(entregado.trozos, null, quote) : null;
  };

  const describirCon = (describe: (pajares: string[], quote: string | undefined) => string) => (quote: string | undefined): string => {
    const pajares = !entregado
      ? (chunks.length > 0 ? chunks.map(c => c.text) : fallbackText ? [fallbackText] : [])
      : [...(entregado.texto !== null ? [entregado.texto] : []), ...entregado.trozos.map(c => c.text)];
    const cuantos = entregado
      ? (entregado.texto !== null ? `${entregado.trozos.length} filas visibles` : `${entregado.trozos.length} trozos`)
      : (chunks.length > 0 ? `${chunks.length} trozos` : '');
    return `${describe(pajares, quote)}, pajar=${pajar}${cuantos ? ` (${cuantos})` : ''}`;
  };

  return { comprobar, describir: describirCon(describirDescarte), describirAcierto: describirCon(describirAcierto) };
}
