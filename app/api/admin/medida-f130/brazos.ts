/**
 * LOS TRES BRAZOS DEL CONTRASTE DE d4 (arquitecto, 11/11/2026). TEMPORAL como toda la carpeta. Qué trozos entran en cada uno:
 *   · `documentos` (d4):   todos — los documentos enteros · grande · con competencia;
 *   · `competencia` (d4b): el trozo de D más los trozos de A, B y C de ese lado · mediano · con competencia;
 *   · `neutros` (d4c):     el trozo de D más trozos SIN NINGUNA MARCA de A, B, C ni D, en el orden del documento, hasta igualar el
 *                          tamaño de d4b de ese lado ±5 % · mediano · sin competencia.
 * d4 contra d4b aísla el pajar con la competencia fija; d4b contra d4c, la competencia con el tamaño fijo.
 * ⚠️ LA CELDA QUE FALTA, grande sin competencia, NO EXISTE NI SE PUEDE CONSTRUIR: los documentos enteros llevan A, B y C dentro.
 * ⚠️ LO QUE LOS BRAZOS NO IGUALAN, dicho antes de medir (comprobado sobre los .docx el 11/11):
 *   1. el trozo de D de NOR-10 (el 4) lleva la frase de A del §2.4 («responsabilidad última»): d4c no está libre de A del todo;
 *      le falta la otra mitad (CLI-12 §3.1), así que A como se sembró no se puede formar, pero media A está;
 *   2. el trozo de A de CLI-12 (el 3) lleva el PRINCIPIO del §3.1 («separar la responsabilidad…»), que es la otra ancla posible
 *      de D: en d4 y d4b, D puede ir contra §3.5 o contra §3.1; en d4c, sólo contra §3.5. Sesga CONTRA encontrar que d4c > d4b.
 * Pura, para que tenga prueba: la ruta (`producto-ruta.ts`) le pasa los trozos leídos de la base y la medida del tamaño.
 */

/** Las marcas de los cuatro casos, normalizadas (minúsculas, sin tildes, espacios colapsados): las frases sembradas de
 *  `SQL_34_06` y `SQL_34_13`, más las palabras de cada caso. Un trozo con UNA SOLA de ellas no es neutro. */
export const MARCAS_DE_LOS_CASOS: Record<'A' | 'B' | 'C' | 'D', readonly string[]> = {
  A: ['responsable ultimo', 'responsabilidad ultima', 'no es delegable', 'retirar del servicio', 'retirada de servicio', 'no el director clinico', 'autoridad jerarquica'],
  B: ['control biologico', 'semanal', 'mensual', 'geobacillus'],
  C: ['caducidad', '6 meses', '12 meses', 'reesteriliz', 'valido durante', 'mantiene su esterilidad'],
  D: ['puede recaer', 'separacion de funciones', 'misma persona', 'separar la responsabilidad', 'nunca por el director clinico', 'sustitucion temporal'],
};

/** Las frases que localizan los trozos de A, B y C de cada lado (la siembra; el trozo que la contiene es el del caso). */
export const FRASES_DE_ABC = {
  'NOR-10': { A: 'El responsable último del cumplimiento de este protocolo', B: 'El control biológico del autoclave se realiza semanalmente', C: 'mantiene su esterilidad durante un máximo de 6 meses' },
  'CLI-12': { A: 'El responsable último de la esterilización del instrumental', B: 'El control biológico del autoclave se realiza con periodicidad mensual', C: 'se considera válido durante un periodo máximo de 12 meses' },
} as const;

export type Brazo = 'documentos' | 'competencia' | 'neutros';
export const TOLERANCIA_DE_TAMANO = 0.05;

const normalizar = (s: string) => s.replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

/** Las marcas que lleva un texto, como «caso:marca». */
export function marcasDe(texto: string): string[] {
  const t = normalizar(texto);
  return (Object.entries(MARCAS_DE_LOS_CASOS) as Array<[string, readonly string[]]>).flatMap(([caso, ms]) => ms.filter(m => t.includes(m)).map(m => `${caso}:${m}`));
}

type Trozo = { chunkIndex: number; chunkType: string; text: string };
export type TrozosDelBrazo =
  | { ok: true; indices: number[]; tamano: number; tamanoDeCompetencia: number; trozosDeABC: Record<'A' | 'B' | 'C', number> }
  | { ok: false; motivo: string };

/**
 * Los trozos de un lado para un brazo. `medir` da el tamaño de un conjunto de trozos tal como se entregaría. NEGATIVAS: una frase
 * de A, B o C sin trozo; un trozo de A, B o C sin ninguna marca de su caso; un neutro con una marca; d4c fuera de ±5 % de d4b.
 */
export function trozosDelBrazo<T extends Trozo>(brazo: Brazo, lado: { codigo: string; todos: T[]; trozoD: number }, medir: (ts: T[]) => number): TrozosDelBrazo {
  const { codigo, todos, trozoD } = lado;
  const frases = (FRASES_DE_ABC as Record<string, Record<'A' | 'B' | 'C', string> | undefined>)[codigo];
  if (!frases) return { ok: false, motivo: `${codigo}: no tiene frases de A, B y C` };
  const de = (ids: number[]) => todos.filter(c => ids.includes(c.chunkIndex));
  const abc = {} as Record<'A' | 'B' | 'C', number>;
  for (const caso of ['A', 'B', 'C'] as const) {
    const frase = frases[caso];
    const t = todos.find(c => c.text.includes(frase));
    if (!t) return { ok: false, motivo: `${codigo}: ningún trozo contiene la frase de ${caso} («${frase}»)` };
    if (!marcasDe(t.text).some(m => m.startsWith(`${caso}:`))) return { ok: false, motivo: `${codigo}: el trozo ${t.chunkIndex}, el de ${caso}, no lleva ninguna marca de ${caso}` };
    abc[caso] = t.chunkIndex;
  }
  const competencia = [...new Set([trozoD, abc.A, abc.B, abc.C])].sort((a, b) => a - b);
  const tamanoDeCompetencia = medir(de(competencia));
  if (brazo === 'documentos') return { ok: true, indices: todos.map(c => c.chunkIndex), tamano: medir(todos), tamanoDeCompetencia, trozosDeABC: abc };
  if (brazo === 'competencia') return { ok: true, indices: competencia, tamano: tamanoDeCompetencia, tamanoDeCompetencia, trozosDeABC: abc };

  const neutros: number[] = [];
  for (const c of todos) {
    if (c.chunkIndex === trozoD || c.chunkType !== 'text' || marcasDe(c.text).length > 0) continue;
    if (medir(de([trozoD, ...neutros])) >= tamanoDeCompetencia * (1 - TOLERANCIA_DE_TAMANO)) break;
    if (medir(de([trozoD, ...neutros, c.chunkIndex])) <= tamanoDeCompetencia * (1 + TOLERANCIA_DE_TAMANO)) neutros.push(c.chunkIndex);
  }
  const indices = [trozoD, ...neutros].sort((a, b) => a - b);
  const tamano = medir(de(indices));
  if (Math.abs(tamano / tamanoDeCompetencia - 1) > TOLERANCIA_DE_TAMANO) {
    return { ok: false, motivo: `${codigo}: con los neutros disponibles, d4c mide ${tamano} y d4b ${tamanoDeCompetencia}: fuera de ±${TOLERANCIA_DE_TAMANO * 100} %` };
  }
  const conMarca = de(neutros).find(c => marcasDe(c.text).length > 0);
  if (conMarca) return { ok: false, motivo: `${codigo}: el neutro ${conMarca.chunkIndex} lleva ${marcasDe(conMarca.text).join(', ')}` };
  return { ok: true, indices, tamano, tamanoDeCompetencia, trozosDeABC: abc };
}
