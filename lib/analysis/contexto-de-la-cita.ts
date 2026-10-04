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

export interface ContextoDeLaCita {
  /** El trozo o los trozos donde está la cita, enteros. Vacío si no se sabe. */
  trozos: string[];
  vecinos: FindingNeighbours;
}

const SIN_CONTEXTO: ContextoDeLaCita = { trozos: [], vecinos: { previous: null, next: null } };

export function contextoDeLaCita(chunks: StoredChunk[], chunk: StoredChunk | null, cita: string): ContextoDeLaCita {
  if (chunk) return { trozos: [chunk.text], vecinos: vecinos(chunks, chunk, chunk) };
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
  return { trozos: tocados.map(c => c.text), vecinos: vecinos(chunks, tocados[0], tocados[tocados.length - 1]) };
}

/** Los dos lados de un hallazgo, listos para `FindingToVerify`. Un sitio para
 *  los dos puntos del pipeline que construyen lo que el verificador recibe. */
export function ladosParaVerificar(
  nuevo: { chunks: StoredChunk[]; chunk: StoredChunk | null; cita: string },
  existente: { chunks: StoredChunk[]; chunk: StoredChunk | null; cita: string },
): { newNeighbours: FindingNeighbours; existingNeighbours: FindingNeighbours; newTrozos: string[]; existingTrozos: string[] } {
  const n = contextoDeLaCita(nuevo.chunks, nuevo.chunk, nuevo.cita);
  const e = contextoDeLaCita(existente.chunks, existente.chunk, existente.cita);
  return { newNeighbours: n.vecinos, existingNeighbours: e.vecinos, newTrozos: n.trozos, existingTrozos: e.trozos };
}
