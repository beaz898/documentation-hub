/**
 * DE QUÉ CLASE ES UN TROZO, LEÍDO DE SU PROPIO TEXTO — B.246.
 *
 * ⚠️ POR QUÉ DEL TEXTO Y NO DE UN CAMPO. La metadata de Pinecone NO lleva
 * `chunkType` (`lib/pinecone/types.ts`): lo lleva Supabase, y el retrieval lo
 * pide aparte con `getChunksForDocuments`. Para el censo de vecindario eso
 * significaría una consulta a la base por cada vecino de cada documento. El
 * texto, en cambio, YA VIAJA en la metadata de cada match — así que la clase se
 * lee de donde ya está.
 *
 * ⚠️ Y SE DECLARA LA IMPRECISIÓN, que es la parte que no se puede callar: esto
 * NO es `chunkType`. Es un reconocedor de la PLANTILLA con la que `chunking.ts`
 * escribe cada clase de trozo. Si mañana cambia la plantilla, esto deja de
 * reconocer y hay que venir aquí. Por eso el reconocedor cita la línea que
 * genera cada forma, para que un `grep` las encuentre juntas.
 */

/** `chunking.ts:882-884` — `[Hoja "X"] Tabla con N filas y M columnas. Columnas: …`
 *  Los ~52 caracteres de plantilla que son idénticos en CUALQUIER hoja. */
const RESUMEN_DE_TABLA = /Tabla con \d+ filas y \d+ columnas\. Columnas:/;

/** `chunking.ts:846` — el prefijo que llevan TODOS los trozos de una hoja de
 *  cálculo, sean resumen, fila o texto suelto (`:867`). */
const PREFIJO_DE_HOJA = /^\[Hoja "[^"]*"\]/;

export type ClaseDeTrozo =
  /** El resumen de la tabla: el que lleva la frase hecha. */
  | 'resumen_tabla'
  /** Otro trozo de una hoja de cálculo: una fila, o texto suelto de la hoja. */
  | 'otro_de_hoja'
  /** Prosa: no viene de una hoja de cálculo. */
  | 'prosa';

export function clasificarTrozo(texto: string): ClaseDeTrozo {
  if (RESUMEN_DE_TABLA.test(texto)) return 'resumen_tabla';
  if (PREFIJO_DE_HOJA.test(texto)) return 'otro_de_hoja';
  return 'prosa';
}

/**
 * LA CLASE DEL PAR, que es lo que de verdad se quiere contar: un vecino no lo
 * produce un trozo, lo produce un PAR de trozos.
 *
 * `resumen_x_resumen` es el que acusa: dos resúmenes de tabla comparten ~52
 * caracteres de frase hecha antes del primer dato propio. Si los vecinos de este
 * corpus son mayoritariamente de esa clase, el parecido es de ENVOLTORIO.
 */
export type ClaseDePar =
  | 'resumen_x_resumen'
  | 'resumen_x_otro'
  | 'hoja_x_hoja'
  | 'hoja_x_prosa'
  | 'prosa_x_prosa';

export function clasificarPar(a: ClaseDeTrozo, b: ClaseDeTrozo): ClaseDePar {
  if (a === 'resumen_tabla' && b === 'resumen_tabla') return 'resumen_x_resumen';
  if (a === 'resumen_tabla' || b === 'resumen_tabla') return 'resumen_x_otro';
  if (a === 'prosa' && b === 'prosa') return 'prosa_x_prosa';
  if (a === 'prosa' || b === 'prosa') return 'hoja_x_prosa';
  return 'hoja_x_hoja';
}

/** Las cinco clases, siempre escritas aunque valgan cero: un cero que no aparece
 *  no se distingue de «no se miró». */
export function reparteVacio(): Record<ClaseDePar, number> {
  return {
    resumen_x_resumen: 0,
    resumen_x_otro: 0,
    hoja_x_hoja: 0,
    hoja_x_prosa: 0,
    prosa_x_prosa: 0,
  };
}
