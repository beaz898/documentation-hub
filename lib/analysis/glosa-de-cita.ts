import type { VerifiedQuote } from './judge';
import { citaUtilizable, type ComprobadorDeLado } from './coincidencia-de-cita';
import type { PipelineCounters } from './counters';
import { despegarPunteroDeFila } from './table-structure';
import type { DocumentJudgment } from './types';

/**
 * F-121 · LA GLOSA ENTRE CORCHETES NO MATA UN HALLAZGO (08/10/2026).
 *
 * El juez aclara a veces DENTRO de la cita —«…recae siempre sobre esta figura
 * [el Director Clínico]»— y la cita deja de ser literal. Si la aclaración es
 * correcta, la puerta tira un hallazgo verdadero (B.332, conducta 2).
 *
 * ⚠️ ES UN REPLIEGUE Y SÓLO PUEDE RESCATAR. Se intenta únicamente cuando la
 * comprobación de siempre ya ha devuelto «no está»; una cita que hoy se
 * verifica no pasa por aquí, así que ni su texto ni su camino cambian.
 *
 * ⚠️ EL MISMO CRITERIO QUE EL PUNTERO, EXTENDIDO: la puerta ya guarda la cita
 * del juez con algo quitado —el puntero de fila `[F3]`—; aquí se quitan además
 * los tramos entre corchetes. LA GLOSA NO SE GUARDA EN NINGÚN SITIO: es un
 * parche que se borra cuando la cita llegue por puntero (plan de F-121), y
 * entonces la glosa tendrá campo propio.
 *
 * Sólo corchetes cuadrados: los paréntesis son texto normal de estos documentos
 * («(guantes, bata y protección ocular)»).
 */

/** Un tramo entre corchetes, con el espacio que lo precede. Sin anidar. */
const TRAMO_DE_GLOSA = /\s*\[[^[\]]*\]/g;

/**
 * La cita sin sus tramos entre corchetes, conservando el puntero de fila del
 * principio (`[F3]`), que no es glosa y que `verifyQuote` usa para localizar.
 * `null` si no lleva glosa: entonces no hay nada que intentar.
 */
export function quitarGlosa(quote: string): string | null {
  const { texto } = despegarPunteroDeFila(quote);
  const sinGlosa = texto.replace(TRAMO_DE_GLOSA, '');
  if (sinGlosa === texto) return null;
  return quote.slice(0, quote.length - texto.length) + sinGlosa.trim();
}

/** Qué pasó con la glosa en UNA cita. */
export type RepliegueDeGlosa = 'no_intentado' | 'rescatada' | 'sin_rescate';

export interface ComprobacionConRepliegue {
  verificada: VerifiedQuote | null;
  /** La cita con la que se verificó (o la original si no se verificó). */
  cita: string | undefined;
  repliegue: RepliegueDeGlosa;
}

/**
 * La comprobación de siempre y, SÓLO si falla y la cita lleva glosa, una más
 * sin ella, por el mismo comprobador. Si sin glosa la cita no es utilizable
 * —el mismo mínimo que la puerta, `citaUtilizable`— no se intenta: sin rescate.
 */
export function comprobarConRepliegueDeGlosa(lado: ComprobadorDeLado, quote: string | undefined): ComprobacionConRepliegue {
  const verificada = lado.comprobar(quote);
  if (verificada || !quote) return { verificada, cita: quote, repliegue: 'no_intentado' };
  const sinGlosa = quitarGlosa(quote);
  if (sinGlosa === null) return { verificada: null, cita: quote, repliegue: 'no_intentado' };
  if (!citaUtilizable(despegarPunteroDeFila(sinGlosa).texto)) return { verificada: null, cita: quote, repliegue: 'sin_rescate' };
  const rescatada = lado.comprobar(sinGlosa);
  return rescatada
    ? { verificada: rescatada, cita: sinGlosa, repliegue: 'rescatada' }
    : { verificada: null, cita: quote, repliegue: 'sin_rescate' };
}

/** El acumulador de una pareja: por CITA (por lado), no por hallazgo. */
export function registroDeGlosas() {
  let rescatadas = 0;
  let sinRescate = 0;
  return {
    anotar(...comprobaciones: ComprobacionConRepliegue[]): void {
      for (const c of comprobaciones) {
        if (c.repliegue === 'rescatada') rescatadas++;
        else if (c.repliegue === 'sin_rescate') sinRescate++;
      }
    },
    /** Lo que va al juicio: nada si no se intentó ninguna. */
    resultado(): Pick<DocumentJudgment, 'repliegueDeGlosa'> {
      return rescatadas + sinRescate > 0 ? { repliegueDeGlosa: { rescatadas, sinRescate } } : {};
    },
  };
}

/** Los dos contadores del análisis, sumados sobre todas las parejas. Se emiten
 *  siempre que el juez corrió: 0 es «corrió y no hizo falta» (F-82). */
export function contadoresDeLaGlosa(judgments: DocumentJudgment[]): PipelineCounters {
  let rescatadas = 0;
  let sinRescate = 0;
  for (const j of judgments) {
    rescatadas += j.repliegueDeGlosa?.rescatadas ?? 0;
    sinRescate += j.repliegueDeGlosa?.sinRescate ?? 0;
  }
  return {
    'juez.citas_rescatadas_quitando_glosa': rescatadas,
    'juez.citas_con_glosa_sin_rescate': sinRescate,
  };
}
