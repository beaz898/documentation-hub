import type { StoredChunk } from '@/lib/read-chunks';
import type { LoEntregado } from './pajar-de-la-cita';
import { unidadesDeCita } from './unidades-de-cita';
import type { SalidaDelTramo } from './tramo-de-cita';

/**
 * DE UN TRAMO A LA FRASE REAL QUE LO CONTIENE (F-125, fase 3.1; 13/10/2026).
 *
 * `tramo-de-cita.ts` dice DÓNDE está cada tramo de una cita recompuesta, sobre
 * el texto entregado al juez. Lo que se enseña y se verifica no es el tramo ni
 * el empalme del juez: es la FRASE REAL del documento que contiene el tramo.
 * La frase es la unidad de `unidades-de-cita.ts` —o las unidades seguidas— que
 * cubre el tramo dentro de SU trozo.
 *
 * ⚠️ `unidades-de-cita.ts` SE USA EN SÓLO LECTURA Y NO SE TOCA. Usarlo así NO
 * cuenta como «conectado» para el disparador de la vía 2 de F-125 (decisión del
 * arquitecto, 12/10/2026): aquél habla del módulo como mecanismo de citas del
 * juez, con punteros.
 *
 * ⚠️ HOY NO LO IMPORTA NADIE.
 *
 * CUÁNDO NO SE APLICA, y no es un fallo de este módulo sino una decisión:
 *   · sin lo entregado (`null`, el camino de antes de B.299 (i)): no se sabe
 *     qué leyó el juez;
 *   · entregado por piezas (`texto === null`): (B) no se aplica, por decisión
 *     del arquitecto (12/10/2026);
 *   · sin trozos de texto: no hay unidades.
 * Y un tramo que CRUZA el límite entre dos trozos no cuenta: su frase no está
 * entera en ningún trozo.
 *
 * CÓMO SE LOCALIZA EL TROZO: no por aritmética de longitudes, sino buscando el
 * texto de cada trozo en el texto entregado, en orden y desde donde acabó el
 * anterior. El texto entregado son los trozos tal cual, en orden de
 * `chunkIndex` (lo fija `texto-del-trozo-en-el-prompt.test.ts`), con las tablas
 * pintadas en medio; un trozo que no aparece entero —cortado por el régimen—
 * no se localiza y su tramo no cuenta.
 */

export type SalidaDeLaFrase =
  | {
      tipo: 'frase';
      chunkIndex: number;
      /** Sobre el texto del trozo, sin los espacios del final de la unidad. */
      desde: number;
      hasta: number;
      texto: string;
    }
  | { tipo: 'cruza_trozos' }
  | { tipo: 'no_aplica'; motivo: 'sin_lo_entregado' | 'entregado_piezas' | 'sin_trozos' | 'trozo_no_localizado' };

/** Dónde empieza el texto de cada trozo de texto dentro del texto entregado. */
function trozosEnElTexto(texto: string, trozos: StoredChunk[]): Array<{ trozo: StoredChunk; inicio: number }> {
  const salida: Array<{ trozo: StoredChunk; inicio: number }> = [];
  let cursor = 0;
  for (const trozo of [...trozos].sort((a, b) => a.chunkIndex - b.chunkIndex)) {
    if (trozo.chunkType !== 'text' || trozo.text.length === 0) continue;
    const inicio = texto.indexOf(trozo.text, cursor);
    if (inicio === -1) continue;
    salida.push({ trozo, inicio });
    cursor = inicio + trozo.text.length;
  }
  return salida;
}

/** La frase real que contiene el tramo [desde, hasta) del texto entregado. */
export function fraseReal(
  entregado: LoEntregado | null,
  trozos: StoredChunk[],
  tramo: { desde: number; hasta: number },
): SalidaDeLaFrase {
  if (!entregado) return { tipo: 'no_aplica', motivo: 'sin_lo_entregado' };
  if (entregado.texto === null) return { tipo: 'no_aplica', motivo: 'entregado_piezas' };
  if (!trozos.some(t => t.chunkType === 'text')) return { tipo: 'no_aplica', motivo: 'sin_trozos' };

  for (const { trozo, inicio } of trozosEnElTexto(entregado.texto, trozos)) {
    const fin = inicio + trozo.text.length;
    if (tramo.desde < inicio || tramo.desde >= fin) continue;
    if (tramo.hasta > fin) return { tipo: 'cruza_trozos' };
    const desde = tramo.desde - inicio;
    const hasta = tramo.hasta - inicio;
    const cubren = unidadesDeCita(trozo.text).filter(u => u.hasta > desde && u.desde < hasta);
    const d = cubren[0].desde;
    let h = cubren[cubren.length - 1].hasta;
    while (h > d && /\s/.test(trozo.text[h - 1])) h--;
    return { tipo: 'frase', chunkIndex: trozo.chunkIndex, desde: d, hasta: h, texto: trozo.text.slice(d, h) };
  }
  return { tipo: 'no_aplica', motivo: 'trozo_no_localizado' };
}

/** Las dos frases reales de una cita recompuesta: la del ancla y la del resto. */
export function frasesDeLaRecompuesta(
  entregado: LoEntregado | null,
  trozos: StoredChunk[],
  salida: Extract<SalidaDelTramo, { tipo: 'recompuesta' }>,
): { ancla: SalidaDeLaFrase; resto: SalidaDeLaFrase } {
  return {
    ancla: fraseReal(entregado, trozos, salida.ancla),
    resto: fraseReal(entregado, trozos, salida.resto),
  };
}
