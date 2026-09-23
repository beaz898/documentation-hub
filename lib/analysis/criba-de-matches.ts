import type { DocumentFragment } from './types';
import { repartoPorFilaViva, idsParaElRegistro } from '@/lib/documents/vivos';
import { generacionesMuertas, soloGeneracionActiva } from './generacion-activa';

/**
 * LA CRIBA DE LOS MATCHES, EN UN SITIO Y EN UN ORDEN — F-115 (22/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ EL ORDEN ES EL CONTENIDO DE ESTE MÓDULO, no un detalle de implementación:
 *
 *   1. ¿EXISTE el documento?  → `sin_fila_viva`
 *   2. ¿es el propio?         → `propios_excluidos`
 *   3. ¿es su generación?     → `generacion_muerta_excluida`
 *
 * ⚠️ FUERON CUATRO HASTA EL 23/09/2026: el segundo era el UMBRAL, y se retiró con
 * `SCORE_THRESHOLD_QUICK`/`SCORE_THRESHOLD_EXHAUSTIVE` (fase 2 de la retirada).
 * El suelo medido del corpus es 0,696141422 sobre n=424.040, así que ningún corte
 * absoluto por debajo de 0,50 descartaba nada. Quien vigila ahora es el
 * TERMÓMETRO, que enseña la distribución entera en vez de cortarla.
 *
 * Hasta hoy estos cuatro descartes vivían en tres sitios —dos tramos de
 * `collectMatches` y dos funciones llamadas 80 líneas después— y el orden era
 * una propiedad EMERGENTE de dónde estaba cada `continue`. Emergente significa
 * que nadie lo podía probar, y de hecho estaba mal: **el umbral se aplicaba
 * antes de saber si el documento existía**, así que un fantasma por debajo del
 * umbral se anotaba como «perdido por el umbral» y uno por encima entraba como
 * candidato legítimo.
 *
 * La razón del orden, que es de F-115 y va literal: «la pregunta ¿existe?
 * precede a cualquier otra pregunta sobre el fragmento». Y su consecuencia
 * práctica: los denominadores quedan limpios, porque cada término cuenta sobre
 * lo que sobrevivió al anterior y los conjuntos son disjuntos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LA EXCEPCIÓN AL ORDEN, Y ES OBLIGADA: la metadata se comprueba ANTES de
 * todo, porque sin `documentId` no hay nada por lo que preguntar si existe. Un
 * match sin metadata utilizable no es un fantasma: es un match del que no se
 * sabe nada, y va a su propio término (`sin_metadata_utilizable`).
 *
 * ⚠️ FUNCIÓN PURA, y por eso existe como módulo aparte: es la única forma de que
 * «un documento sin fila se descarta y se cuenta» tenga un caso que lo pruebe.
 * `retrieveCandidates` necesita Pinecone y Supabase, así que allí no se puede
 * probar nada — y lo que no se puede probar es lo que se rompe en silencio.
 */

/** Lo que Pinecone devuelve, en la forma mínima que la criba necesita. */
export interface MatchCrudo {
  /** El id del vector. Es lo que se registra de lo descartado: un uuid con
   *  índice, sin una letra de contenido del cliente. */
  id?: string;
  metadata?: Record<string, unknown>;
  score?: number;
}

/** Los CINCO términos del reparto, cada uno contado donde ocurre su descarte.
 *  ⚠️ Fueron seis hasta el 23/09/2026: `descartados_umbral` se fue con las dos
 *  constantes del umbral. */
export interface RepartoDeLaCriba {
  crudos: number;
  sin_fila_viva: number;
  sin_metadata_utilizable: number;
  propios_excluidos: number;
  generacion_muerta_excluida: number;
  candidatos_con_repeticion: number;
}

export interface ResultadoDeLaCriba {
  /** Lo que sobrevivió a los tres descartes, sin deduplicar. */
  fragmentos: DocumentFragment[];
  reparto: RepartoDeLaCriba;
  /** ⚠️ ESPERADO VACÍO. Los vectorId de los fragmentos sin fila, acotados. */
  idsSinFilaViva: string[];
  /** Los documentId sin fila, para el log — sin tope, son pocos y no se persisten. */
  documentosSinFila: string[];
  /** Por documento, cuántos fragmentos cayeron por generación. ⚠️ Esperado vacío. */
  porGeneracionMuerta: Map<string, number>;
}

/** Forma intermedia: un match con su metadata ya validada. */
interface MatchUtilizable {
  vectorId: string;
  documentId: string;
  documentName: string;
  text: string;
  source: 'manual' | 'google_drive';
  score: number;
  chunkIndex: number;
  generation?: number;
}

/**
 * Los documentId distintos que aparecen en los matches crudos.
 *
 * ⚠️ SOBRE LOS CRUDOS, ANTES DE CUALQUIER CRIBA, y ahí está el punto: es la
 * lista por la que se le pregunta a la base quién existe, así que tiene que
 * incluir **también** a los que van a caer por el umbral o por ser el propio.
 * Preguntar sólo por los supervivientes dejaría sin verificar justo a los que se
 * quieren contar aparte.
 */
export function documentIdsDeLosMatches(
  // ⚠️ LA FORMA MÁS FLOJA QUE SIRVE, y a propósito: los cuatro caminos llaman
  // aquí con tipos distintos —`MatchCrudo` en el análisis, `VectorMatch` en el
  // chat, en `improve` y en el agente— y `VectorMetadata` es una interfaz sin
  // índice, así que pedir `Record<string, unknown>` obligaría a tres `as`. Pedir
  // sólo lo que se lee evita los tres.
  crudos: readonly { metadata?: { documentId?: unknown } }[],
): string[] {
  const ids = new Set<string>();
  for (const m of crudos) {
    const id = m.metadata?.documentId;
    if (typeof id === 'string' && id !== '') ids.add(id);
  }
  return [...ids];
}

export function cribarMatches(args: {
  crudos: readonly MatchCrudo[];
  /** El mapa de `documentosVivos`, YA abierto por quien llama: si la lectura
   *  falló, aquí no se llega — el análisis se paró antes. */
  generaciones: ReadonlyMap<string, number>;
  excluido?: string;
}): ResultadoDeLaCriba {
  const reparto: RepartoDeLaCriba = {
    crudos: 0,
    sin_fila_viva: 0,
    sin_metadata_utilizable: 0,
    propios_excluidos: 0,
    generacion_muerta_excluida: 0,
    candidatos_con_repeticion: 0,
  };

  // ── 0 · LA METADATA, que es lo único que no puede ir después ──────────
  const utilizables: MatchUtilizable[] = [];
  for (const m of args.crudos) {
    reparto.crudos += 1;
    if (!m.metadata || typeof m.score !== 'number') {
      reparto.sin_metadata_utilizable += 1;
      continue;
    }
    const meta = m.metadata as {
      documentId?: unknown; documentName?: unknown;
      source?: unknown; chunkIndex?: unknown; text?: unknown; generation?: unknown;
    };
    if (
      typeof meta.documentId !== 'string' || meta.documentId === '' ||
      typeof meta.documentName !== 'string' || meta.documentName === '' ||
      typeof meta.text !== 'string' || meta.text === ''
    ) {
      reparto.sin_metadata_utilizable += 1;
      continue;
    }
    utilizables.push({
      vectorId: typeof m.id === 'string' ? m.id : '(sin id)',
      documentId: meta.documentId,
      documentName: meta.documentName,
      text: meta.text,
      source: meta.source === 'google_drive' ? 'google_drive' : 'manual',
      score: m.score,
      chunkIndex: typeof meta.chunkIndex === 'number' ? meta.chunkIndex : 0,
      // Ausente = g1 implícita, igual que en `parseVectorId`.
      generation: typeof meta.generation === 'number' ? meta.generation : undefined,
    });
  }

  // ── 1 · ¿EXISTE? La primera, y la única que mira LA BASE ──────────────
  const { vivos: conFila, sinFila } = repartoPorFilaViva(utilizables, args.generaciones);
  reparto.sin_fila_viva = sinFila.length;
  const documentosSinFila = [...new Set(sinFila.map(m => m.documentId))];

  // ── 2 · EL PROPIO ────────────────────────────────────────────────────
  //
  // ⚠️ AQUÍ HABÍA UN PASO MÁS, Y ERA EL UMBRAL. Se retiró el 23/09/2026 con
  // `SCORE_THRESHOLD_QUICK` (0,50) y `SCORE_THRESHOLD_EXHAUSTIVE` (0,45): el
  // suelo medido del corpus es **0,696141422** sobre n=424.040, con **cero**
  // fragmentos por debajo de 0,50 y de 0,45, así que el corte no descartaba
  // nada. No se reinstaura sin un caso decisivo — un candidato concreto que
  // llegó al juez, era basura, y cuyo score lo habría separado de los buenos—
  // y, si algún día vuelve, vuelve RELATIVO (orden o hueco) y no absoluto.
  const ajenos: MatchUtilizable[] = [];
  for (const m of conFila) {
    if (args.excluido !== undefined && m.documentId === args.excluido) {
      reparto.propios_excluidos += 1;
      continue;
    }
    ajenos.push(m);
  }

  // ── 3 · LA GENERACIÓN, preguntada a quien la decide ──────────────────
  // Las MISMAS dos funciones que usa el censo de vecindario. El criterio de
  // «qué generación sirve este documento» no se reimplementa aquí.
  const deLaActiva = soloGeneracionActiva(ajenos, args.generaciones);
  const porGeneracionMuerta = generacionesMuertas(ajenos, args.generaciones);
  for (const n of porGeneracionMuerta.values()) reparto.generacion_muerta_excluida += n;

  reparto.candidatos_con_repeticion = deLaActiva.length;

  return {
    fragmentos: deLaActiva.map(m => ({
      text: m.text,
      documentId: m.documentId,
      documentName: m.documentName,
      source: m.source,
      score: m.score,
      chunkIndex: m.chunkIndex,
      generation: m.generation ?? 1,
    })),
    reparto,
    idsSinFilaViva: idsParaElRegistro(sinFila.map(m => m.vectorId)),
    documentosSinFila,
    porGeneracionMuerta,
  };
}

/**
 * ¿Cuadra el reparto de la criba? Los CINCO términos suman los crudos.
 *
 * Es el mismo cuadre que `elRepartoCuadra` comprueba sobre el termómetro ya
 * construido, pero AQUÍ, sobre la fuente: si esto fuera falso, el termómetro
 * escribiría una ecuación que no cierra y nadie sabría en qué paso se perdió el
 * fragmento.
 *
 * ⚠️ Eran SEIS hasta el 23/09/2026. Al retirar el umbral, su término desaparece
 * de la suma — y eso es lo que hace que el cuadre siga siendo un cuadre: dejarlo
 * en cero habría funcionado igual, y habría dejado en la ecuación un término que
 * ningún camino puede mover, o sea una comprobación que no puede fallar.
 */
export function laCribaCuadra(r: RepartoDeLaCriba): boolean {
  const suma = r.sin_fila_viva
    + r.sin_metadata_utilizable
    + r.propios_excluidos
    + r.generacion_muerta_excluida
    + r.candidatos_con_repeticion;
  return suma === r.crudos;
}
