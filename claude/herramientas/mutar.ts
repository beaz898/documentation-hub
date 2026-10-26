/**
 * EL GENERADOR DE MUTANTES, COMO FICHERO DEL REPOSITORIO (arquitecto, 26/10/2026).
 *
 * Hasta hoy cada medición improvisaba su generador en la carpeta temporal, y siete veces en una semana se editó con
 * `node -e` y escapes del shell. La guarda del ancla lo paró siempre, pero una regla que se rompe siete veces no es
 * una regla: la salida es que no haya ningún generador que escribir. Desde hoy, una medición escribe sólo su
 * DEFINICIÓN (qué fichero, qué arnés, cuántos tests y la lista de mutantes, en un `.ts` junto a su arnés) y la lanza:
 *
 *   node claude/herramientas/mutar-cli.mts claude/arneses/<carpeta>/mutantes-<nombre>.ts
 *
 * Lo que hace, y por qué cada paso:
 *   1. comprueba TODAS las anclas antes de escribir nada: cada una tiene que aparecer exactamente una vez (si no, el
 *      mutante caería en otro sitio o en ninguno), y el cambio no puede contener al ancla (una mutación que contiene al
 *      original no se distingue de una que no se aplicó; protocolo, «la cuarta»);
 *   2. adapta los saltos de línea del ancla y del cambio a los del fichero (CRLF rompió el patrón cuatro veces);
 *   3. aplica cada mutante sobre el ORIGINAL, corre el arnés y clasifica: ROJO sólo si hay fallos y se cargaron
 *      todos los tests (un rojo con tests sin cargar no cuenta; un «skipped» tampoco);
 *   4. restaura los bytes originales en un `finally`, pase lo que pase, y compara la huella de antes y la de después.
 *
 * El núcleo no toca el disco ni lanza procesos: recibe `leer`, `escribir` y `correr`, para poder probarlo en la suite
 * sin lanzar vitest. La CLI (`mutar-cli.mts`) le pasa los de verdad.
 */
import { createHash } from 'node:crypto';

export interface Mutante {
  /** Qué rompe, en una frase: es lo que sale en el informe. */
  nombre: string;
  /** El texto original, que tiene que aparecer exactamente una vez. Con saltos de línea en «\n». */
  ancla: string;
  /** Lo que lo sustituye. No puede contener al ancla. */
  cambio: string;
}

export interface Definicion {
  /** El fichero que se muta, relativo a la raíz del repositorio. */
  fichero: string;
  /** El arnés que tiene que ponerse rojo, como se le pasa a vitest. */
  arnes: string;
  /** El proyecto de vitest del arnés: 'arneses' para los SQL, 'suite' para el código. */
  proyecto: 'arneses' | 'suite';
  /** Cuántos tests tiene el arnés: un rojo sólo cuenta si se cargaron todos. */
  tests: number;
  mutantes: Mutante[];
}

export interface Resultado {
  nombre: string;
  rojo: boolean;
  /** La línea «Tests …» de vitest, o por qué no la hay. */
  linea: string;
}

export interface Informe {
  resultados: Resultado[];
  huellaAntes: string;
  huellaDespues: string;
}

export interface Dependencias {
  leer: (fichero: string) => string;
  escribir: (fichero: string, texto: string) => void;
  /** Corre el arnés y devuelve su salida entera, haya fallado o no. */
  correr: (def: Definicion) => string;
}

const huella = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 16);

const conSaltosDe = (texto: string, original: string): string =>
  original.includes('\r\n') ? texto.split('\r\n').join('\n').split('\n').join('\r\n') : texto;

const vecesQueAparece = (texto: string, trozo: string): number => texto.split(trozo).length - 1;

/** Los problemas de las anclas, uno por línea. Vacío = se puede mutar. Se mira TODO antes de escribir nada. */
export function problemasDeLasAnclas(original: string, mutantes: Mutante[]): string[] {
  const problemas: string[] = [];
  if (mutantes.length === 0) problemas.push('la definición no tiene ningún mutante');
  for (const m of mutantes) {
    const ancla = conSaltosDe(m.ancla, original);
    const cambio = conSaltosDe(m.cambio, original);
    const k = vecesQueAparece(original, ancla);
    if (k !== 1) problemas.push('«' + m.nombre + '»: el ancla aparece ' + k + ' veces, y tiene que aparecer una');
    if (ancla.length > 0 && cambio.includes(ancla)) problemas.push('«' + m.nombre + '»: el cambio contiene al ancla, y no se distinguiría de no aplicarlo');
  }
  return problemas;
}

/** El fichero con UN mutante aplicado sobre el original. */
export function aplicar(original: string, m: Mutante): string {
  return original.split(conSaltosDe(m.ancla, original)).join(conSaltosDe(m.cambio, original));
}

/** ROJO si y sólo si vitest dice que falló algo, se cargaron los `tests` y no se saltó ninguno. */
export function clasificar(salida: string, tests: number): { rojo: boolean; linea: string } {
  const t = /Tests\s+(.*)/.exec(salida);
  if (!t) return { rojo: false, linea: '(sin línea de Tests: el arnés no llegó a correr)' };
  const linea = t[1].trim();
  const total = /\((\d+)\)\s*$/.exec(linea);
  const cargados = total !== null && Number(total[1]) === tests;
  const rojo = /\bfailed\b/.test(linea) && cargados && !/\bskipped\b/.test(linea);
  return { rojo, linea };
}

export function mutar(def: Definicion, d: Dependencias): Informe {
  const original = d.leer(def.fichero);
  const problemas = problemasDeLasAnclas(original, def.mutantes);
  if (problemas.length > 0) throw new Error('NO SE MUTA NADA:\n  ' + problemas.join('\n  '));
  const huellaAntes = huella(original);
  const resultados: Resultado[] = [];
  try {
    for (const m of def.mutantes) {
      d.escribir(def.fichero, aplicar(original, m));
      const { rojo, linea } = clasificar(d.correr(def), def.tests);
      resultados.push({ nombre: m.nombre, rojo, linea });
    }
  } finally {
    d.escribir(def.fichero, original);
  }
  return { resultados, huellaAntes, huellaDespues: huella(d.leer(def.fichero)) };
}
