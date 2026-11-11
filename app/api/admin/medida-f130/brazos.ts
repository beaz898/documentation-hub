/**
 * LOS DOS BRAZOS DEL CONTRASTE DEL PAJAR (arquitecto, 11/11/2026). TEMPORAL como toda la carpeta. Qué trozos entran en cada uno:
 *   · `documentos` (d4):   todos — los documentos enteros · ~122.000 caracteres · competencia completa · las dos vías de D;
 *   · `competencia` (d4b): el trozo de D más los trozos de A, B y C de ese lado · ~8.600 · competencia completa · las dos vías.
 * d4 contra d4b aísla el PAJAR con todo lo demás igual.
 * ⚠️ HECHO DEL CORPUS QUE CONDICIONA TODO LO QUE SE PUEDA MEDIR (comprobado sobre los .docx el 11/11): A Y D COMPARTEN TROZO EN EL
 * LADO DE CLI-12. El trozo 3 lleva la frase de A del §3.1 y el PRINCIPIO del §3.1 («separar la responsabilidad…»), que es la vía
 * por la que sale D: en d3, 6 de 7 sólo por §3.1, 1 por las dos, 0 sólo por §3.5 (`Predicciones…:7948`); en la línea base, las 3
 * D publicadas citan el §3.1 (`Estado…:458`). ASÍ QUE «D SIN A» NO ES CONSTRUIBLE: quitar A le quita a D su ancla. No es un defecto
 * del diseño; es cómo se sembró el corpus. Y en NOR-10, el trozo de D (el 4) lleva además la frase de A del §2.4.
 * ⚠️ POR ESO SE RETIRÓ d4c (11/11): D con trozos neutros sin competencia quitaba el trozo 3 y con él la única vía que funciona; un
 * cero no habría distinguido «sin competencia» de «sin ancla». Si el contraste del pajar sale nulo, la competencia se mide con un
 * brazo que SÍ se puede interpretar, D + A sin B ni C, que conserva el §3.1. No está escrito.
 * ⚠️ LA CELDA QUE FALTA, grande sin competencia, NO EXISTE NI SE PUEDE CONSTRUIR: los documentos enteros llevan A, B y C dentro.
 * Pura, para que tenga prueba: la ruta (`producto-ruta.ts`) le pasa los trozos leídos de la base y la medida del tamaño.
 */

/** Las marcas de los cuatro casos, normalizadas (minúsculas, sin tildes, espacios colapsados): las frases sembradas de
 *  `SQL_34_06` y `SQL_34_13`, más las palabras de cada caso. El ensayo las enseña por trozo entregado. */
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

export type Brazo = 'documentos' | 'competencia';

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
 * Los trozos de un lado para un brazo. `medir` da el tamaño de un conjunto de trozos tal como se entregaría. NEGATIVAS: un documento
 * sin frases de A, B y C; una frase sin trozo; un trozo de A, B o C sin ninguna marca de su caso. Se comprueban también en d4, para
 * que los dos brazos se nieguen por lo mismo.
 */
export function trozosDelBrazo<T extends Trozo>(brazo: Brazo, lado: { codigo: string; todos: T[]; trozoD: number }, medir: (ts: T[]) => number): TrozosDelBrazo {
  const { codigo, todos, trozoD } = lado;
  const frases = (FRASES_DE_ABC as Record<string, Record<'A' | 'B' | 'C', string> | undefined>)[codigo];
  if (!frases) return { ok: false, motivo: `${codigo}: no tiene frases de A, B y C` };
  const abc = {} as Record<'A' | 'B' | 'C', number>;
  for (const caso of ['A', 'B', 'C'] as const) {
    const frase = frases[caso];
    const t = todos.find(c => c.text.includes(frase));
    if (!t) return { ok: false, motivo: `${codigo}: ningún trozo contiene la frase de ${caso} («${frase}»)` };
    if (!marcasDe(t.text).some(m => m.startsWith(`${caso}:`))) return { ok: false, motivo: `${codigo}: el trozo ${t.chunkIndex}, el de ${caso}, no lleva ninguna marca de ${caso}` };
    abc[caso] = t.chunkIndex;
  }
  const competencia = [...new Set([trozoD, abc.A, abc.B, abc.C])].sort((a, b) => a - b);
  const tamanoDeCompetencia = medir(todos.filter(c => competencia.includes(c.chunkIndex)));
  if (brazo === 'documentos') return { ok: true, indices: todos.map(c => c.chunkIndex), tamano: medir(todos), tamanoDeCompetencia, trozosDeABC: abc };
  return { ok: true, indices: competencia, tamano: tamanoDeCompetencia, tamanoDeCompetencia, trozosDeABC: abc };
}
