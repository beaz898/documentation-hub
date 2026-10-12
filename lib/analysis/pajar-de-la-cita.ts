import type { StoredChunk } from '@/lib/read-chunks';
import type { LecturaDeLaPareja } from './types';
import type { VerifiedQuote } from './judge';
import { groupChunksByTable, renderTableRow, despegarPunteroDeFila } from './table-structure';
import {
  findBestMatch, describirDescarte, describirAcierto, datosDelDescarte, datosDelAcierto,
  type DatosDeLaCita,
} from './coincidencia-de-cita';

/**
 * CONTRA QUÉ SE COMPRUEBA UNA CITA — separado de `coincidencia-de-cita.ts` el
 * 12/10/2026 (fase 3.1, commit 0), que llegaba a 399 líneas contra una regla de
 * 400. Se movió TAL CUAL, sin cambiar una coma de comportamiento: aquél dice
 * CÓMO se busca una cita en un pajar; éste, QUÉ pajar le toca a cada lado.
 */

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
  /** Lo mismo que `describir`/`describirAcierto`, como DATO: lo que se guarda
   *  de un hallazgo descartado (B.313). */
  datos(quote: string | undefined, verificada: boolean): DatosDeLaCita & { pajar: PajarDeLaCita };
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

  const pajares = (): string[] => !entregado
    ? (chunks.length > 0 ? chunks.map(c => c.text) : fallbackText ? [fallbackText] : [])
    : [...(entregado.texto !== null ? [entregado.texto] : []), ...entregado.trozos.map(c => c.text)];
  const describirCon = (describe: (pajares: string[], quote: string | undefined) => string) => (quote: string | undefined): string => {
    const cuantos = entregado
      ? (entregado.texto !== null ? `${entregado.trozos.length} filas visibles` : `${entregado.trozos.length} trozos`)
      : (chunks.length > 0 ? `${chunks.length} trozos` : '');
    return `${describe(pajares(), quote)}, pajar=${pajar}${cuantos ? ` (${cuantos})` : ''}`;
  };
  const datos = (quote: string | undefined, verificada: boolean) =>
    ({ ...(verificada ? datosDelAcierto : datosDelDescarte)(pajares(), quote), pajar });

  return { comprobar, describir: describirCon(describirDescarte), describirAcierto: describirCon(describirAcierto), datos };
}
