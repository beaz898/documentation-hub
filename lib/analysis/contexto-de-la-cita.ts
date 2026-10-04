import type { StoredChunk } from '@/lib/read-chunks';
import type { FindingNeighbours } from './verify-findings';
import { findBestMatch } from './coincidencia-de-cita';

/**
 * LO QUE EL VERIFICADOR VE ALREDEDOR DE UNA CITA (B.322, 04/10/2026).
 *
 * Hasta hoy recibía la cita y el texto del trozo ANTERIOR y del SIGUIENTE, pero
 * no el resto del trozo en el que está la cita. El caso que lo trajo: la cita de
 * 222 caracteres de NOR-10 acaba en «esta figura», y su sujeto —«El Director
 * Clínico puede delegar…»— está al principio de su misma frase, en su mismo
 * trozo. El verificador no tenía de dónde sacarlo, y la descartó 5 de 6 veces.
 *
 * Ahora recibe, además de los dos vecinos, **el trozo entero donde está la
 * cita**. Si la cita cruza de un trozo a otro (no hay un único trozo de
 * evidencia), **todos los trozos que toca, enteros**, y los vecinos son el de
 * antes del primero y el de después del último.
 *
 * Esto sólo da CONTEXTO: no decide si la cita existe —eso ya lo decidió la
 * comprobación de citas— ni si el hallazgo vale.
 */

/** ⚠️ TOPE DECLARADO: una cita que pida más trozos que éstos no lleva ninguno
 *  —se queda como hoy, la cita sola—. Una cita es una frase, y una frase no
 *  cruza tres trozos; si alguna lo hace, algo raro pasa y no se rellena. */
export const TOPE_DE_TROZOS_DE_UNA_CITA = 3;

/** Texto del trozo inmediatamente anterior y posterior, por `chunkIndex` ± 1
 *  (el criterio que vivía en pipeline.ts como `buildNeighbours`). */
function vecinos(chunks: StoredChunk[], primero: StoredChunk, ultimo: StoredChunk): FindingNeighbours {
  const previous = chunks.find(c => c.chunkIndex === primero.chunkIndex - 1);
  const next = chunks.find(c => c.chunkIndex === ultimo.chunkIndex + 1);
  return { previous: previous?.text ?? null, next: next?.text ?? null };
}

/** Cómo se le dio el contexto a un lado. `fila_de_tabla` se pinta como fila,
 *  con todas sus columnas, y no lleva trozos; `sin_contexto` se pinta como
 *  antes de B.322, la cita con sus vecinos si los hay. */
export type EstadoDelContexto = 'trozo' | 'cruza' | 'fila_de_tabla' | 'sin_contexto';

export interface ContextoDeLaCita {
  /** El trozo o los trozos donde está la cita, enteros. Vacío si no se sabe. */
  trozos: string[];
  vecinos: FindingNeighbours;
  estado: EstadoDelContexto;
}

const SIN_CONTEXTO: ContextoDeLaCita = { trozos: [], vecinos: { previous: null, next: null }, estado: 'sin_contexto' };

export function contextoDeLaCita(chunks: StoredChunk[], chunk: StoredChunk | null, cita: string): ContextoDeLaCita {
  if (chunk?.chunkType === 'table_row') return { trozos: [], vecinos: vecinos(chunks, chunk, chunk), estado: 'fila_de_tabla' };
  if (chunk) return { trozos: [chunk.text], vecinos: vecinos(chunks, chunk, chunk), estado: 'trozo' };
  if (!cita || chunks.length === 0) return SIN_CONTEXTO;

  // La cita no casó entera en ningún trozo: cruza. Se unen los trozos en orden,
  // se localiza la cita entera con la MISMA búsqueda que la comprobación
  // (literal o normalizada; sólo para dar contexto, no acepta nada) y se toman
  // los trozos que pisa. Una frontera que caiga en cualquier punto de la cita da
  // igual.
  const ordenados = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
  const inicios: number[] = [];
  let todo = '';
  for (const c of ordenados) { inicios.push(todo.length); todo += c.text + '\n'; }
  const recorte = findBestMatch(todo, cita);
  if (recorte === null) return SIN_CONTEXTO;
  const desde = todo.indexOf(recorte);
  const hasta = desde + recorte.length;
  const tocados = ordenados.filter((c, k) => inicios[k] < hasta && inicios[k] + c.text.length > desde);
  if (tocados.length === 0 || tocados.length > TOPE_DE_TROZOS_DE_UNA_CITA) return SIN_CONTEXTO;
  return { trozos: tocados.map(c => c.text), vecinos: vecinos(chunks, tocados[0], tocados[tocados.length - 1]), estado: 'cruza' };
}

export interface LadosParaVerificar {
  /** Los campos de `FindingToVerify`, para esparcirlos. */
  campos: { newNeighbours: FindingNeighbours; existingNeighbours: FindingNeighbours; newTrozos: string[]; existingTrozos: string[] };
  nuevo: ContextoDeLaCita;
  existente: ContextoDeLaCita;
}

/** Los dos lados de un hallazgo, listos para `FindingToVerify`. Un sitio para
 *  los dos puntos del pipeline que construyen lo que el verificador recibe. */
export function ladosParaVerificar(
  nuevo: { chunks: StoredChunk[]; chunk: StoredChunk | null; cita: string },
  existente: { chunks: StoredChunk[]; chunk: StoredChunk | null; cita: string },
): LadosParaVerificar {
  const n = contextoDeLaCita(nuevo.chunks, nuevo.chunk, nuevo.cita);
  const e = contextoDeLaCita(existente.chunks, existente.chunk, existente.cita);
  return {
    campos: { newNeighbours: n.vecinos, existingNeighbours: e.vecinos, newTrozos: n.trozos, existingTrozos: e.trozos },
    nuevo: n,
    existente: e,
  };
}

/**
 * ⚠️ EL SELLO DE B.322 (04/10/2026): una línea de log por hallazgo que entra al
 * verificador, con lo que B.322 añade. Si aparece con `trozos` ≥ 1 en el lado
 * nuevo, el cambio está desplegado; el sello no depende del resultado que se
 * quiere medir. **Sin una palabra del documento**: números y nombres de estado.
 */
export function lineaDelContexto(lados: LadosParaVerificar): string {
  const lado = (c: ContextoDeLaCita) => `trozos=${c.trozos.length} caracteres=${c.trozos.reduce((s, t) => s + t.length, 0)} (${c.estado})`;
  return `contexto del verificador: nuevo ${lado(lados.nuevo)} · existente ${lado(lados.existente)}`;
}

/** El tope ciego, contado: cada lado que llega al verificador sin contexto
 *  —la cita no se localizó, o no había trozos— se ve como antes de B.322. */
export const CITA_SIN_CONTEXTO = 'verificador.cita_sin_contexto';

export function contarSinContexto(counts: Record<string, number>, lados: LadosParaVerificar): void {
  for (const c of [lados.nuevo, lados.existente]) {
    if (c.estado === 'sin_contexto') counts[CITA_SIN_CONTEXTO] = (counts[CITA_SIN_CONTEXTO] ?? 0) + 1;
  }
}
