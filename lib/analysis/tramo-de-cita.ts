import { normalizarConPosiciones, type TextoNormalizado } from './coincidencia-de-cita';

/**
 * LA CITA ANCLADA POR SU TRAMO LITERAL MÁS LARGO (F-125, fase 3.1; 13/10/2026).
 *
 * La puerta de hoy localiza una cita por sus 20 primeros caracteres
 * normalizados (`coincidencia-de-cita.ts`, `buscarCita`), que son el trozo
 * menos informativo. Este módulo la ancla por el tramo literal MÁS LARGO que
 * comparte con el pajar y decide si el resto de la cita es otro tramo literal
 * del mismo pajar: una cita «recompuesta» de dos trozos verdaderos. El caso que
 * lo pide es LUGAR (NOR-11 ↔ CLI-13): el juez junta dos frases literales de
 * NOR-11 en orden inverso, y la puerta lo tira 6 de 6.
 *
 * ⚠️ HOY NO LO IMPORTA NADIE. Sólo el algoritmo: qué se publica y quién lo
 * verifica es del commit que lo conecte.
 *
 * LAS SEIS INVARIANTES, y las seis tienen prueba (`tramo-de-cita.test.ts`):
 *   1. COBERTURA TOTAL, SIN HUECOS NI SOLAPE: el ancla y el resto cubren la cita
 *      normalizada entera. Se cumple POR CONSTRUCCIÓN: el resto ES el
 *      complemento del ancla —lo que queda a su izquierda o a su derecha—, así
 *      que no hay un carácter que pueda quedar fuera; lo que decide es si ese
 *      complemento entero está literal en el pajar. Los espacios de la junta no
 *      son contenido y no cuentan.
 *   2. ANCLA ≥ 40 caracteres normalizados Y ≥ 50 % de la cita normalizada: el
 *      mayor de los dos.
 *   3. RESTO ≥ 40 caracteres normalizados, o vacío. Un resto de pura
 *      puntuación queda vacío al normalizar.
 *   4. COMO MUCHO DOS TRAMOS: si el ancla cae en medio y quedan restos a los dos
 *      lados, es `empalme_multiple`.
 *   5. DETERMINISMO: el mismo par (cita, pajar) da siempre la misma salida. Sin
 *      `Intl.Segmenter`, sin azar y sin dependencias.
 *   6. LAS POSICIONES DEVUELTAS SON SOBRE EL ORIGINAL, vía
 *      `normalizarConPosiciones`: `pajar.slice(desde, hasta)` es el texto del
 *      tramo tal como está en el documento.
 *
 * EL COSTE: el índice de un pajar (un `Map` de cada trozo de 40 caracteres a
 * sus posiciones) se construye UNA vez y lo reutilizan todas las citas de la
 * pareja. Cada alineación (cita, pajar) se extiende una sola vez. Y cada trozo
 * guarda como mucho `TOPE_DE_POSICIONES` posiciones, para que una tabla que
 * repite la misma línea no lo vuelva cuadrático.
 * ⚠️ EL TOPE FALLA CERRADO: en un texto patológicamente repetido puede dejar
 * sin ver un ancla, y entonces la salida es `sin_tramo_literal` —el camino de
 * fallo de hoy—, nunca una cita aceptada de más.
 */

/** El tramo mínimo, en caracteres normalizados, del ancla y del resto. */
export const TRAMO_MINIMO = 40;
/** Cuántas posiciones guarda el índice por cada trozo de `TRAMO_MINIMO`. */
export const TOPE_DE_POSICIONES = 32;

/** El pajar preparado: se construye una vez y sirve para todas sus citas. */
export interface IndiceDePajar {
  original: string;
  normalizado: TextoNormalizado;
  trozos: Map<string, number[]>;
}

/** Un tramo de la cita, localizado en el pajar. Las posiciones `desde` y
 *  `hasta` son sobre el ORIGINAL del pajar (invariante 6); `texto` es ese
 *  corte. `enLaCita` dice qué parte de la cita normalizada cubre. */
export interface TramoLocalizado {
  desde: number;
  hasta: number;
  texto: string;
  enLaCita: { desde: number; hasta: number };
}

export type SalidaDelTramo =
  | {
      tipo: 'recompuesta';
      ancla: TramoLocalizado;
      resto: TramoLocalizado;
      /** De inicio a inicio, en el original del pajar. */
      distancia: number;
      /** Caracteres del original entre el final de un tramo y el principio
       *  del otro; 0 si se tocan o se solapan. */
      hueco: number;
      /** ¿Va el resto, en el pajar, en el orden contrario al de la cita? */
      ordenInverso: boolean;
    }
  | { tipo: 'resto_insuficiente'; ancla: TramoLocalizado; longitudDelResto: number }
  | { tipo: 'resto_no_literal'; ancla: TramoLocalizado; longitudDelResto: number }
  | { tipo: 'empalme_multiple'; ancla: TramoLocalizado }
  | { tipo: 'sin_tramo_literal'; longitudDelMasLargo: number }
  /** El ancla cubre la cita entera: no es de este módulo, es el camino
   *  `normalizada` de la puerta de hoy, que va antes. */
  | { tipo: 'cita_entera'; ancla: TramoLocalizado };

/** El índice de un pajar. */
export function indiceDePajar(pajar: string): IndiceDePajar {
  const normalizado = normalizarConPosiciones(pajar);
  const t = normalizado.texto;
  const trozos = new Map<string, number[]>();
  for (let p = 0; p + TRAMO_MINIMO <= t.length; p++) {
    const clave = t.slice(p, p + TRAMO_MINIMO);
    const lista = trozos.get(clave);
    if (!lista) trozos.set(clave, [p]);
    else if (lista.length < TOPE_DE_POSICIONES) lista.push(p);
  }
  return { original: pajar, normalizado, trozos };
}

/** El ancla mínima para una cita normalizada de esta longitud (invariante 2). */
export function anclaMinima(longitudDeLaCita: number): number {
  return Math.max(TRAMO_MINIMO, Math.ceil(longitudDeLaCita / 2));
}

/** El tramo común más largo entre la cita y el pajar, normalizados. En
 *  empate, el primero de la cita y, dentro de él, el primero del pajar. */
function tramoMasLargo(cita: string, indice: IndiceDePajar): { i: number; p: number; largo: number } | null {
  const pajar = indice.normalizado.texto;
  // Por cada diagonal (p - i), hasta dónde de la cita llega ya lo extendido.
  const extendido = new Map<number, number>();
  let mejor: { i: number; p: number; largo: number } | null = null;
  for (let i = 0; i + TRAMO_MINIMO <= cita.length; i++) {
    const posiciones = indice.trozos.get(cita.slice(i, i + TRAMO_MINIMO));
    if (!posiciones) continue;
    for (const p of posiciones) {
      const diagonal = p - i;
      if ((extendido.get(diagonal) ?? -1) > i) continue;
      let a = i;
      let b = p;
      while (a > 0 && b > 0 && cita[a - 1] === pajar[b - 1]) { a--; b--; }
      let fin = i + TRAMO_MINIMO;
      while (fin < cita.length && fin - i + p < pajar.length && cita[fin] === pajar[fin - i + p]) fin++;
      extendido.set(diagonal, fin);
      if (!mejor || fin - a > mejor.largo) mejor = { i: a, p: b, largo: fin - a };
    }
  }
  return mejor;
}

/** Un corte [desde, hasta) del pajar normalizado, llevado al original, sin
 *  los espacios de los bordes. */
function alOriginal(indice: IndiceDePajar, desde: number, hasta: number, enLaCita: { desde: number; hasta: number }): TramoLocalizado {
  const t = indice.normalizado.texto;
  let d = desde;
  let h = hasta;
  while (d < h && t[d] === ' ') d++;
  while (h > d && t[h - 1] === ' ') h--;
  const pos = indice.normalizado.posiciones;
  const o0 = pos[d];
  const o1 = pos[h - 1] + 1;
  return { desde: o0, hasta: o1, texto: indice.original.slice(o0, o1), enLaCita };
}

/** La cita anclada por su tramo literal más largo en el pajar. */
export function localizarPorTramo(indice: IndiceDePajar, quote: string): SalidaDelTramo {
  const cita = normalizarConPosiciones(quote).texto;
  const t = tramoMasLargo(cita, indice);
  if (!t || t.largo < anclaMinima(cita.length)) return { tipo: 'sin_tramo_literal', longitudDelMasLargo: t?.largo ?? 0 };

  const ancla = alOriginal(indice, t.p, t.p + t.largo, { desde: t.i, hasta: t.i + t.largo });
  // Invariante 1: el resto es el COMPLEMENTO del ancla en la cita.
  const izquierda = cita.slice(0, t.i).trim();
  const derecha = cita.slice(t.i + t.largo).trim();
  if (izquierda && derecha) return { tipo: 'empalme_multiple', ancla };
  const resto = izquierda || derecha;
  if (!resto) return { tipo: 'cita_entera', ancla };

  const pajar = indice.normalizado.texto;
  const r = pajar.indexOf(resto);
  if (r === -1) return { tipo: 'resto_no_literal', ancla, longitudDelResto: resto.length };
  if (resto.length < TRAMO_MINIMO) return { tipo: 'resto_insuficiente', ancla, longitudDelResto: resto.length };

  const restoEnLaCita = izquierda
    ? { desde: cita.indexOf(resto), hasta: cita.indexOf(resto) + resto.length }
    : { desde: cita.lastIndexOf(resto), hasta: cita.lastIndexOf(resto) + resto.length };
  const tramoDelResto = alOriginal(indice, r, r + resto.length, restoEnLaCita);
  const primero = Math.min(ancla.desde, tramoDelResto.desde);
  const finDelPrimero = primero === ancla.desde ? ancla.hasta : tramoDelResto.hasta;
  const segundo = Math.max(ancla.desde, tramoDelResto.desde);
  return {
    tipo: 'recompuesta',
    ancla,
    resto: tramoDelResto,
    distancia: Math.abs(ancla.desde - tramoDelResto.desde),
    hueco: Math.max(0, segundo - finDelPrimero),
    // El resto de la IZQUIERDA de la cita tendría que ir antes en el pajar.
    ordenInverso: izquierda ? tramoDelResto.desde > ancla.desde : tramoDelResto.desde < ancla.desde,
  };
}
