import { CUBOS, cuboDe, histogramaVacio } from './cubos-de-score';
import { EMBEDDING_MODEL } from '@/lib/embeddings';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ESTADO_DEL_CORPUS } from '@/lib/documents/estado';

/**
 * EL TERMÓMETRO DE LA RECUPERACIÓN — F-114 (21/09/2026).
 *
 * ⚠️ QUÉ PREGUNTA CONTESTA, Y NO ES LA DE UN CONTADOR. Un contador dice **cuántas
 * veces se tomó un camino** (`claude/Contrato_Contadores.md`, cláusula 2). El
 * termómetro dice **qué se encontró**: dónde vivió la distribución de scores de
 * este análisis concreto. Por eso NO va en `pipeline_counters` —`mergeCounters`
 * SUMA al fusionar, y sumar dos mínimos da una cifra sin sentido— sino en el
 * jsonb `analysis`, que se persiste igual y admite nulos (F-114 P2, opción b).
 *
 * ⚠️ PARA QUÉ SIRVE, Y ES LO QUE JUSTIFICA ESCRIBIRLO: la retirada del umbral se
 * apoya en que el suelo medido del corpus es 0,696, muy por encima de 0,50. Ese
 * suelo **baja cuando el fondo es más variado** (medido: Facturacion_2025 cae de
 * 0,769 a 0,705 al pasar de la población real al corpus entero). Nadie sabe
 * cuánto bajaría con una organización de otro sector o otro idioma. El
 * termómetro es lo que lo enseñaría **el día que ocurra**, en vez de un año
 * después: es la vigilancia que sustituye a la constante que se retira.
 *
 * ⚠️ SÓLO NÚMEROS Y EL NOMBRE DEL MODELO. Ni un texto de fragmento, ni un nombre
 * de documento. Es la cláusula 5 del contrato de contadores aplicada aquí: esto
 * se agrega entre análisis y viaja a la telemetría, así que no puede llevar
 * datos del cliente. La pareja del mínimo —que sí lleva muestras de texto— vive
 * en el censo de administración, que no se persiste.
 */

/** Los tres estados, y la clave `termometro` NUNCA se omite. */
export type EstadoDelTermometro =
  /** La recuperación corrió y hubo fondo que consultar. */
  | 'con_candidatos'
  /** La recuperación corrió y el fondo consultable era 0: no había con qué comparar. */
  | 'fondo_vacio'
  /** La recuperación NO corrió. Lleva `motivo` con el predicado literal que cortó. */
  | 'no_recuperado';

/** El sello: lo que pedimos, lo que el servicio dijo, y la dimensión real. */
export interface SelloDelModelo {
  pedido: string;
  /** `null` si la respuesta no lo declaró, o si no hubo llamada. Ausente NO es
   *  «el que pedimos»: rellenarlo convertiría una ausencia en confirmación. */
  servido: string | null;
  /** La longitud REAL del vector recibido. `null` si no hubo vectores. */
  dimension_servida: number | null;
}

/**
 * Los denominadores, cada uno contado DONDE OCURRE y sobre lo que sobrevivió al
 * paso anterior. El orden de los campos es el orden del pipeline, a propósito.
 *
 * ⚠️ EL CUADRE, y por qué tiene cinco términos y no cuatro:
 *   crudos = descartados_umbral + sin_metadata_utilizable + propios_excluidos
 *            + generacion_muerta_excluida + candidatos_con_repeticion
 *
 * `sin_metadata_utilizable` NO estaba en la ecuación que F-113 pidió, y sin él
 * el cuadre **no puede cerrar**: `collectMatches` tiene DOS descartes más por
 * metadata incompleta —antes del umbral (`retrieval.ts`, el `typeof m.score`) y
 * después (`documentId`/`documentName`/`text`)— que llevaban ahí desde siempre y
 * que nadie contaba. Se añade el término en vez de dejar una identidad que no
 * cierra: una ecuación que no cuadra no es un cuadre.
 */
export interface DenominadoresDelTermometro {
  /** Lo que Pinecone devolvió, sumando todas las consultas. Es EL TOTAL. */
  crudos: number;
  /**
   * ⚠️ TEMPORAL: se va con la retirada de SCORE_THRESHOLD_QUICK/EXHAUSTIVE, que
   * es el commit siguiente. Mientras el umbral exista, su descarte tiene que
   * estar en el cuadre o el cuadre no cierra.
   */
  descartados_umbral: number;
  /** Matches sin la metadata mínima para poder contarlos. Ver el aviso de arriba. */
  sin_metadata_utilizable: number;
  /** Fragmentos del documento que se está analizando, que se excluye después de consultar. */
  propios_excluidos: number;
  /** Fragmentos de una generación que ya no se sirve. ⚠️ Esperado CERO. */
  generacion_muerta_excluida: number;
  /** Lo que sobrevivió a todo, ANTES de deduplicar. */
  candidatos_con_repeticion: number;
  /** Lo que sobrevivió al dedup por documento. Siempre ≤ el anterior. */
  unicos: number;
}

/** La forma de los scores. Sobre los fragmentos ÚNICOS, no sobre los crudos. */
export interface ScoresDelTermometro {
  minimo: number;
  maximo: number;
  /** Veinte cubos de 0,05. La MISMA escala que el censo de vecindario. */
  histograma: number[];
  /**
   * Máximo del 1.º documento menos máximo del 2.º. `null` con menos de dos
   * documentos candidatos: con uno solo no hay hueco, y un 0 diría que los dos
   * primeros empatan.
   */
  hueco_1_2: number | null;
}

export interface Termometro {
  version: 1;
  estado: EstadoDelTermometro;
  /** Sólo en `no_recuperado`, con el predicado literal que cortó. */
  motivo: string | null;
  modelo: SelloDelModelo;
  consultas: number | null;
  topK: number | null;
  denominadores: DenominadoresDelTermometro | null;
  /**
   * Fragmentos consultables según LA BASE, no según lo que Pinecone devolvió.
   * Es el denominador que dice si el mínimo observado es el SUELO o sólo el
   * puesto `topK`. `null` si la lectura falló — y entonces `fondo_motivo` lo dice.
   */
  fondo: number | null;
  /** Por qué `fondo` es `null`. `null` cuando el fondo sí se pudo contar. */
  fondo_motivo: string | null;
  documentos_candidatos: number | null;
  scores: ScoresDelTermometro | null;
}

/** El predicado literal del único corte que se salta la recuperación. */
export const MOTIVO_DUPLICADO_EXACTO = 'corte por hash: isDuplicateExact';

/**
 * El termómetro de un análisis que NO llegó a recuperar.
 *
 * ⚠️ SE ESCRIBE IGUAL, con todo a `null` y su motivo. Omitir la clave dejaría
 * «no se recuperó» indistinguible de «se recuperó y no se midió», que es
 * exactamente el fallo que este objeto viene a cerrar. Es la regla del cero:
 * ausente y cero no significan lo mismo, y aquí ni siquiera hay cero.
 */
export function termometroNoRecuperado(motivo: string): Termometro {
  return {
    version: 1,
    estado: 'no_recuperado',
    motivo,
    // No hubo llamada al servicio de embeddings, así que no hay nada servido.
    modelo: { pedido: EMBEDDING_MODEL, servido: null, dimension_servida: null },
    consultas: null,
    topK: null,
    denominadores: null,
    fondo: null,
    fondo_motivo: motivo,
    documentos_candidatos: null,
    scores: null,
  };
}

/** Lo que la recuperación reúne para construir su termómetro. */
export interface MedidaDeLaRecuperacion {
  consultas: number;
  topK: number;
  denominadores: DenominadoresDelTermometro;
  fondo: number | null;
  fondo_motivo: string | null;
  /** Los máximos por documento, de mayor a menor. Su longitud es el nº de candidatos. */
  maximosPorDocumento: number[];
  /** Todos los scores de los fragmentos únicos. */
  scoresUnicos: number[];
  modelo: SelloDelModelo;
}

/**
 * El termómetro de un análisis que SÍ recuperó. Función pura.
 *
 * ⚠️ EL ESTADO LO DECIDE EL FONDO, NO LOS CANDIDATOS: con fondo 0 no había nada
 * que comparar —`fondo_vacio`—, y con fondo > 0 la recuperación hizo su trabajo
 * aunque no sobreviviera ningún fragmento. Los dos casos son hoy indistinguibles
 * en la base, y separarlos es media razón de este objeto.
 */
export function termometroDeLaRecuperacion(m: MedidaDeLaRecuperacion): Termometro {
  const estado: EstadoDelTermometro = m.fondo === 0 ? 'fondo_vacio' : 'con_candidatos';

  return {
    version: 1,
    estado,
    motivo: null,
    modelo: m.modelo,
    consultas: m.consultas,
    topK: m.topK,
    denominadores: m.denominadores,
    fondo: m.fondo,
    fondo_motivo: m.fondo_motivo,
    documentos_candidatos: m.maximosPorDocumento.length,
    scores: scoresDeLosUnicos(m.scoresUnicos, m.maximosPorDocumento),
  };
}

/** Los extremos, el histograma y el hueco. `null` sin ni un fragmento único. */
export function scoresDeLosUnicos(
  scoresUnicos: number[],
  maximosPorDocumento: number[],
): ScoresDelTermometro | null {
  const validos = scoresUnicos.filter(s => Number.isFinite(s));
  if (validos.length === 0) return null;

  const histograma = histogramaVacio();
  let minimo = validos[0];
  let maximo = validos[0];
  for (const s of validos) {
    histograma[cuboDe(s)] += 1;
    if (s < minimo) minimo = s;
    if (s > maximo) maximo = s;
  }

  const ordenados = [...maximosPorDocumento].sort((a, b) => b - a);
  const hueco = ordenados.length >= 2 ? ordenados[0] - ordenados[1] : null;

  return { minimo, maximo, histograma, hueco_1_2: hueco };
}

/** ¿Cuadra el reparto? Los cinco términos suman el total, y únicos ≤ con repetición. */
export function elRepartoCuadra(d: DenominadoresDelTermometro): boolean {
  const suma = d.descartados_umbral
    + d.sin_metadata_utilizable
    + d.propios_excluidos
    + d.generacion_muerta_excluida
    + d.candidatos_con_repeticion;
  return suma === d.crudos && d.unicos <= d.candidatos_con_repeticion;
}

/**
 * EL FONDO, CONTADO EN LA BASE — no es puro y se dice.
 *
 * ⚠️ MISMO CRITERIO QUE EL FILTRO DE CORPUS, PREGUNTADO Y NO RECALCULADO: los
 * elegibles son los `analizado` (`ESTADO_DEL_CORPUS`, el mismo valor que
 * `CORPUS_ACTIVO` usa en el filtro de metadata) más los ids que la tanda nomine,
 * menos el documento que se analiza.
 *
 * ⚠️ ES UNA COTA SUPERIOR, Y VA DECLARADO: cuenta filas de `document_chunks` sin
 * filtrar por generación activa, así que si quedaran vectores de una generación
 * muerta el fondo saldría mayor que lo consultable de verdad. El contador
 * `generacion_muerta_excluida` del propio termómetro es lo que dice si eso pasa
 * — y su valor esperado es cero.
 *
 * ⚠️ Y SI FALLA, NO TUMBA EL ANÁLISIS: devuelve `null` con su motivo. Un fondo
 * que no se pudo leer no es un fondo de cero, y un análisis de 30 créditos no se
 * pierde por no poder contar su denominador.
 */
export async function contarElFondo(
  supabase: SupabaseClient,
  args: { orgId: string; excludeDocumentId?: string; batchDocumentIds?: string[] },
): Promise<{ fondo: number | null; motivo: string | null }> {
  try {
    const { data: elegibles, error: errDocs } = await supabase
      .from('documents')
      .select('id, analysis_status')
      .eq('org_id', args.orgId);
    if (errDocs) return { fondo: null, motivo: `no se pudo leer la lista de documentos: ${errDocs.message}` };

    const deLaTanda = new Set(args.batchDocumentIds ?? []);
    const ids = (elegibles ?? [])
      .map(d => ({ id: d.id as string, estado: d.analysis_status as string | null }))
      .filter(d => d.estado === ESTADO_DEL_CORPUS || deLaTanda.has(d.id))
      .map(d => d.id)
      .filter(id => id !== args.excludeDocumentId);

    if (ids.length === 0) return { fondo: 0, motivo: null };

    const { count, error: errChunks } = await supabase
      .from('document_chunks')
      .select('document_id', { count: 'exact', head: true })
      .eq('org_id', args.orgId)
      .in('document_id', ids);
    if (errChunks) return { fondo: null, motivo: `no se pudieron contar los fragmentos: ${errChunks.message}` };

    return { fondo: count ?? 0, motivo: null };
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    return { fondo: null, motivo: `excepción al contar el fondo: ${motivo}` };
  }
}


/** Cuántos cubos tiene el histograma, para quien lo lea sin abrir el módulo. */
export const CUBOS_DEL_HISTOGRAMA = CUBOS;
