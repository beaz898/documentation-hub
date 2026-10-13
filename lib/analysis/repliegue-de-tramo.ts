import type { StoredChunk } from '@/lib/read-chunks';
import type { ComprobadorDeLado, LoEntregado } from './pajar-de-la-cita';
import { comprobarConRepliegueDeGlosa, type ComprobacionConRepliegue } from './glosa-de-cita';
import { indiceDePajar, localizarPorTramo, type IndiceDePajar } from './tramo-de-cita';
import { frasesDeLaRecompuesta } from './frase-real';
import type { CitaRecompuestaDeLado, DocumentJudgment, RegistroDelTramo } from './types';
import type { PipelineCounters } from './counters';

/**
 * LA CADENA DE LA PUERTA PARA LAS CITAS DE UNA CONTRADICCIÓN (F-125, fase 3.1;
 * 13/10/2026): la comprobación de siempre → la glosa → el tramo literal más
 * largo (B). Es el ÚNICO sitio que llama a `tramo-de-cita.ts` y a
 * `frase-real.ts`.
 *
 * LAS DECISIONES QUE LO GOBIERNAN (arquitecto, 12-13/10/2026):
 *   · D1 — SÓLO CONTRADICCIONES. Los solapamientos no pasan por ningún
 *     verificador (`pipeline.ts`, cabecera de `applyCascadeToCandidate`:
 *     «Solo contradictions[] pasa por verifyFindings»): un solapamiento recompuesto se
 *     publicaría sin que nadie comprobase las frases reales. El bucle de
 *     solapamientos de `judge.ts` sigue con `comprobarConRepliegueDeGlosa`.
 *   · D2 — (B) VA EL ÚLTIMO: sólo se busca el tramo si la comprobación de
 *     siempre y la glosa ya fallaron. Una cita que hoy pasa no cambia en nada.
 *   · D3 — LO QUE SE PUBLICA NUNCA ES EL EMPALME: la cita que sigue adelante es
 *     la frase real del ancla; la del resto y la cita del juez van en la marca
 *     `recompuesta` (types.ts).
 *   · D4 — UN EMPALME NUNCA SE PUBLICA SIN VERIFICADOR: lo garantiza
 *     `pipeline.ts` con la marca (la guarda de la reclasificación y las dos
 *     frases al verificador). Este módulo sólo pone la marca.
 *   · D6 — `resto_insuficiente`, `resto_no_literal`, `empalme_multiple` y
 *     `sin_tramo_literal` mueren como hoy. Se anotan en el registro.
 *   · D7 — `cita_entera` se trata como hoy el paso `normalizada`: pasa.
 *   · Sin las dos frases reales no hay publicación (`sin_frases`).
 *
 * EL PAJAR es el del lado en esa pareja (`pajar-de-la-cita.ts`): el texto
 * ENTREGADO al juez, el mismo que usa la comprobación de siempre. Sin lo
 * entregado, o entregado por piezas, (B) no se aplica.
 */

/** El lado de una pareja tal como (B) lo necesita. */
export interface LadoDelTramo {
  entregado: LoEntregado | null;
  trozos: StoredChunk[];
}

/** Un lado con su índice, que se construye UNA vez, la primera vez que hace
 *  falta, y sirve para todas las citas de ese lado en la pareja. */
export interface LocalizadorDeLado {
  lado: LadoDelTramo;
  indice(): IndiceDePajar | null;
}

export function localizadorDeLado(lado: LadoDelTramo): LocalizadorDeLado {
  let indice: IndiceDePajar | null = null;
  return {
    lado,
    indice(): IndiceDePajar | null {
      const texto = lado.entregado?.texto ?? null;
      if (texto === null) return null;
      if (!indice) indice = indiceDePajar(texto);
      return indice;
    },
  };
}

/** Lo que devuelve la cadena para UNA cita. `registro` es null si (B) no se
 *  intentó —la cita pasó antes, o no había localizador—. */
export interface ComprobacionConTramo extends ComprobacionConRepliegue {
  recompuesta: CitaRecompuestaDeLado | null;
  registro: Omit<RegistroDelTramo, 'hash' | 'lado'> | null;
}

/** La cadena entera para una cita de contradicción. */
export function comprobarConRepliegues(
  lado: ComprobadorDeLado,
  tramo: LocalizadorDeLado | null,
  quote: string | undefined,
): ComprobacionConTramo {
  const c = comprobarConRepliegueDeGlosa(lado, quote);
  // D2: (B) sólo cuando lo de siempre ya ha fallado.
  if (c.verificada || !quote || !tramo) return { ...c, recompuesta: null, registro: null };
  return { ...c, ...repliegueDeTramo(tramo, quote) };
}

function repliegueDeTramo(
  tramo: LocalizadorDeLado,
  quote: string,
): Pick<ComprobacionConTramo, 'verificada' | 'cita' | 'recompuesta' | 'registro'> {
  const longitudDeLaCita = quote.length;
  const falla = (registro: Omit<RegistroDelTramo, 'hash' | 'lado'>) => ({ verificada: null, cita: quote, recompuesta: null, registro });
  const { entregado, trozos } = tramo.lado;
  if (!entregado) return falla({ salida: 'no_aplica', motivo: 'sin_lo_entregado', longitudDeLaCita });
  const indice = tramo.indice();
  if (!indice) return falla({ salida: 'no_aplica', motivo: 'entregado_piezas', longitudDeLaCita });

  const s = localizarPorTramo(indice, quote);
  switch (s.tipo) {
    case 'cita_entera':
      // D7: como el paso `normalizada` de hoy. No debería verse: queda anotada.
      return {
        verificada: { text: quote, chunk: null, columns: null, porCeldas: false },
        cita: quote,
        recompuesta: null,
        registro: { salida: 'cita_entera', longitudDeLaCita, ancla: { desde: s.ancla.desde, hasta: s.ancla.hasta } },
      };
    case 'sin_tramo_literal':
      return falla({ salida: 'sin_tramo_literal', longitudDeLaCita });
    case 'empalme_multiple':
      return falla({ salida: 'empalme_multiple', longitudDeLaCita, ancla: { desde: s.ancla.desde, hasta: s.ancla.hasta } });
    case 'resto_insuficiente':
    case 'resto_no_literal':
      return falla({ salida: s.tipo, longitudDeLaCita, ancla: { desde: s.ancla.desde, hasta: s.ancla.hasta }, longitudDelResto: s.longitudDelResto });
    case 'recompuesta': {
      const posiciones = {
        ancla: { desde: s.ancla.desde, hasta: s.ancla.hasta },
        resto: { desde: s.resto.desde, hasta: s.resto.hasta },
        distancia: s.distancia,
      };
      const f = frasesDeLaRecompuesta(entregado, trozos, s);
      if (f.ancla.tipo !== 'frase' || f.resto.tipo !== 'frase') {
        const motivo = (x: typeof f.ancla) => (x.tipo === 'no_aplica' ? x.motivo : x.tipo);
        return falla({ salida: 'sin_frases', motivo: `ancla: ${motivo(f.ancla)} · resto: ${motivo(f.resto)}`, longitudDeLaCita, ...posiciones });
      }
      const fraseDelAncla = { chunkIndex: f.ancla.chunkIndex, desde: f.ancla.desde, hasta: f.ancla.hasta, texto: f.ancla.texto };
      const fraseDelResto = { chunkIndex: f.resto.chunkIndex, desde: f.resto.desde, hasta: f.resto.hasta, texto: f.resto.texto };
      const recompuesta: CitaRecompuestaDeLado = {
        citaDelJuez: quote, fraseDelAncla, fraseDelResto, ...posiciones,
        hueco: s.hueco, ordenInverso: s.ordenInverso,
        enTrozosDistintos: fraseDelAncla.chunkIndex !== fraseDelResto.chunkIndex,
      };
      return {
        // D3: lo que sigue adelante es la frase real del ancla, nunca el empalme.
        verificada: { text: fraseDelAncla.texto, chunk: trozos.find(t => t.chunkIndex === fraseDelAncla.chunkIndex) ?? null, columns: null, porCeldas: false },
        cita: fraseDelAncla.texto,
        recompuesta,
        registro: {
          salida: 'recompuesta', longitudDeLaCita, ...posiciones,
          trozos: { ancla: fraseDelAncla.chunkIndex, resto: fraseDelResto.chunkIndex },
          frases: { ancla: fraseDelAncla.texto, resto: fraseDelResto.texto },
        },
      };
    }
  }
}

/** El registro de una pareja: anota cada cita que llegó al tramo. */
export function registroDelTramo() {
  const citas: RegistroDelTramo[] = [];
  return {
    anotar(hash: string, lado: 'nuevo' | 'existente', c: ComprobacionConTramo): void {
      if (c.registro) citas.push({ hash, lado, ...c.registro });
    },
    resultado(): Pick<DocumentJudgment, 'citasAlTramo'> {
      return citas.length > 0 ? { citasAlTramo: citas } : {};
    },
  };
}

/** D4: el motivo, en el `discarded` de la pareja, de una contradicción
 *  recompuesta que caía en la rama de reclasificar a solapamiento
 *  (`pipeline.ts`): un solapamiento no pasa por verificador, así que muere. */
export const RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR = 'descartado.recompuesta_al_reclasificar';

/**
 * LOS CINCO CONTADORES DEL TRAMO, sumados sobre todas las parejas. Se emiten
 * SIEMPRE que el juez corrió, también a cero: 0 es «corrió y no hizo falta»
 * (F-82). El contrato de cada uno, en `claude/Contrato_Contadores.md`.
 *   · los cuatro primeros, POR CITA, de `citasAlTramo` (el registro de la
 *     puerta): `resto_insuficiente`, `resto_no_literal`, `cita_entera`,
 *     `no_aplica` y `sin_frases` NO llevan contador (D6): sólo registro;
 *   · el quinto, POR HALLAZGO, del `discarded` de la pareja, donde lo deja la
 *     guarda de la cascada (`pipeline.ts`). Por eso se suma DESPUÉS de ella.
 */
export function contadoresDelTramo(judgments: DocumentJudgment[]): PipelineCounters {
  const citas = judgments.flatMap(j => j.citasAlTramo ?? []);
  const recompuestas = citas.filter(c => c.salida === 'recompuesta');
  return {
    'juez.citas_recompuestas': recompuestas.length,
    'juez.citas_recompuestas_en_trozos_distintos': recompuestas.filter(c => c.trozos && c.trozos.ancla !== c.trozos.resto).length,
    'juez.citas_empalme_multiple': citas.filter(c => c.salida === 'empalme_multiple').length,
    'juez.citas_sin_tramo_literal': citas.filter(c => c.salida === 'sin_tramo_literal').length,
    'juez.recompuestas_bloqueadas_al_reclasificar': judgments.reduce((n, j) => n + (j.discarded?.[RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR] ?? 0), 0),
  };
}
