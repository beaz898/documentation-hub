import { normalize } from './normalize';
import { despegarPunteroDeFila } from './table-structure';

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
 * ⚠️ `normalize()` Y `normalizarConPosiciones` CAMBIAN JUNTAS, O NO CAMBIAN.
 * Esta segunda repite los pasos de la primera, en su orden, para llevar el mapa
 * de posiciones; si una cambia y la otra no, la cita y el texto vuelven a
 * limpiarse distinto —el fallo de arriba— y la prueba de equivalencia de
 * `coincidencia-de-cita.test.ts` se pone roja. Así se cambió el 02/10/2026
 * (puesto 0 de B.313): quitar los signos ANTES de colapsar, en las dos.
 * `normalize()` la usan además el retrieval, las reglas de hallazgos, la
 * alineación de celdas y el examen (`discriminantes.mjs`, `marcador.mjs`):
 * tocarla mueve la línea de base del arnés, y su riesgo latente está en B.317.
 *
 * ⚠️ PARTIDO EL 12/10/2026 (fase 3.1, commit 0), sin cambiar comportamiento: la
 * sección de B.299 (i) —QUÉ pajar se usa, `comprobadorDeLado`— vive en
 * `pajar-de-la-cita.ts`. Aquí queda CÓMO se busca una cita en un pajar.
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
 * (`lib/analysis/normalize-core.mjs`): minúsculas → fuera la puntuación → cada
 * tirada de espacios a uno → recortar los extremos. Y para cada carácter del
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

  // 2 · Fuera la puntuación, ANTES de colapsar: es el orden de `normalize()`
  //     desde el 02/10/2026, y por eso «a — b» ya no deja un espacio doble.
  const paso2 = paso1.filter(x => !esPuntuacion(x.c));

  // 3 · Cada tirada de espacios, a un solo espacio (el de su primera posición).
  const paso3: Array<{ c: string; pos: number }> = [];
  let enEspacio = false;
  for (const x of paso2) {
    if (/\s/.test(x.c)) {
      if (!enEspacio) paso3.push({ c: ' ', pos: x.pos });
      enEspacio = true;
    } else {
      paso3.push(x);
      enEspacio = false;
    }
  }

  // 4 · Recortar los espacios de los extremos.
  let inicio = 0;
  let fin = paso3.length;
  while (inicio < fin && paso3[inicio].c === ' ') inicio++;
  while (fin > inicio && paso3[fin - 1].c === ' ') fin--;
  const final = paso3.slice(inicio, fin);

  return { texto: final.map(x => x.c).join(''), posiciones: final.map(x => x.pos) };
}

/** Por qué vía casó una cita, o en qué punto se quedó si no casó. Los de fallo
 *  van de menos a más avanzado: es el orden en que se elige el «más lejos».
 *  ⚠️ `cabeza_y_cola` es un FALLO desde el 02/10/2026 (B.318, puesto 1): la
 *  cabeza y la cola casan, en orden y cerca, pero el medio no se comprobó. Antes
 *  aceptaba; ahora sólo describe —«habría pasado por la tolerancia»—, y es el
 *  fallo más avanzado. Las vías que aceptan son `literal` y `normalizada`, más
 *  los segmentos de fila de `verifyQuote`. */
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
  literal: 9, normalizada: 9,
  vacia_o_corta: 0, sin_coincidencia: 1, sin_cabeza: 1, cabeza_sin_cola: 2, cola_demasiado_lejos: 3, cabeza_y_cola: 4,
};

/** ¿Es la cita lo bastante larga para buscarla? El mínimo de la puerta, en UN
 *  sitio: lo pregunta también el repliegue de la glosa (glosa-de-cita.ts). */
export function citaUtilizable(needle: string): boolean {
  return needle.length >= 10 && normalize(needle).length >= 8;
}

/** La búsqueda entera: el recorte del original (o null) y la vía o el fallo. */
function buscarCita(haystack: string, needle: string): { recorte: string | null; paso: PasoDeLaCita } {
  if (!needle || needle.length < 10) return { recorte: null, paso: 'vacia_o_corta' };

  if (haystack.indexOf(needle) !== -1) return { recorte: needle, paso: 'literal' };

  if (!citaUtilizable(needle)) return { recorte: null, paso: 'vacia_o_corta' };
  const normNeedle = normalize(needle);

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
  // B.318: era un sello de goma —valida contra la PRIMERA aparición de la
  // cabeza, sea o no la del pasaje, y deja el medio sin mirar—. Deja de aceptar:
  // no hay recorte. Sigue DESCRIBIENDO por dónde se habría colado.
  if (fin - inicio < needle.length * 3) return { recorte: null, paso: 'cabeza_y_cola' };
  return { recorte: null, paso: 'cola_demasiado_lejos' };
}

/**
 * El recorte del original donde está la cita, o null. DOS vías, en orden:
 * literal; y normalizada (con LA MISMA normalización a los dos lados). La
 * tercera, la cabeza y la cola, dejó de aceptar el 02/10/2026 (B.318): hoy sólo
 * dice, en el diagnóstico, que una cita se habría colado por ahí.
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
export function describirDescarte(pajares: string[], quote: string | undefined): string {
  return enTexto(datosDelDescarte(pajares, quote));
}

/** La vía por la que pasó una cita, o el paso en que se rindió la que falló.
 *  `segmentos_de_fila` es la vía de tablas de `verifyQuote`.
 *  `recompuesta` (F-125, 13/10/2026) es la del tramo literal más largo
 *  (`repliegue-de-tramo.ts`): sólo la pone quien SABE que la cita pasó por ahí,
 *  porque recalcularla no puede verlo. No está en `PasoDeLaCita`: no es un paso
 *  de `buscarCita`, y `AVANCE_DEL_FALLO` no la ordena. */
export type ViaDeLaCita = PasoDeLaCita | 'segmentos_de_fila' | 'recompuesta';
/** Lo mismo que los registros escriben, como DATO (B.313: se guarda lo descartado). */
export interface DatosDeLaCita { longitud: number; paso: ViaDeLaCita }

const enTexto = (d: DatosDeLaCita): string => `longitud=${d.longitud}, paso=${d.paso}`;

export function datosDelDescarte(pajares: string[], quote: string | undefined): DatosDeLaCita {
  if (!quote) return { longitud: 0, paso: 'vacia_o_corta' };
  const { texto: cita } = despegarPunteroDeFila(quote);
  let masLejos: PasoDeLaCita = 'vacia_o_corta';
  for (const pajar of pajares) {
    const { paso } = buscarCita(pajar, cita);
    if (AVANCE_DEL_FALLO[paso] > AVANCE_DEL_FALLO[masLejos]) masLejos = paso;
  }
  return { longitud: cita.length, paso: masLejos };
}

/** B.313: por qué vía PASÓ una cita, y su longitud. Mismos pajares y mismo
 *  orden que la decisión (`verifyQuote` prueba los trozos en orden, y el
 *  comprobador contiguo el texto antes que las filas), con la misma búsqueda:
 *  el primer pajar donde casa da la vía. Si no casa en ninguno, pasó por la
 *  vía de segmentos de fila de `verifyQuote`, que aquí no se repite. */
export function datosDelAcierto(pajares: string[], quote: string | undefined, via?: ViaDeLaCita): DatosDeLaCita {
  const { texto: cita } = despegarPunteroDeFila(quote ?? '');
  // F-125: si quien llama SABE por dónde pasó (el tramo), lo dice y no se
  // recalcula; recalcular con la cita del juez daría `segmentos_de_fila`, que es
  // falso. Sin `via`, exactamente lo de siempre.
  if (via) return { longitud: cita.length, paso: via };
  for (const pajar of pajares) {
    const { recorte, paso } = buscarCita(pajar, cita);
    if (recorte !== null) return { longitud: cita.length, paso };
  }
  return { longitud: cita.length, paso: 'segmentos_de_fila' };
}

export function describirAcierto(pajares: string[], quote: string | undefined, via?: ViaDeLaCita): string {
  return enTexto(datosDelAcierto(pajares, quote, via));
}
