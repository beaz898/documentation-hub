/**
 * Tipos compartidos del pipeline de análisis v2.
 * Diseñado para ser agnóstico de proveedor: hoy Claude+Pinecone, mañana Claude+Voyage+Cohere.
 */

import type { FragmentContext } from './fragment-context';
import type { DatosDeLaCita, PajarDeLaCita } from './coincidencia-de-cita';

export interface DocumentFragment {
  text: string;
  documentId: string;
  documentName: string;
  source: 'manual' | 'google_drive';
  score: number;
  chunkIndex: number;
  /** Generación del vector del que salió este fragmento (F-20 4d). Viene de la
   *  metadata de Pinecone, donde ya se escribía desde C.4b pero no se leía.
   *  Necesaria para localizar el chunk correcto en document_chunks. */
  generation?: number;
  /** Contexto leído de document_chunks (tipo de chunk, localizadores de tabla y
   *  texto vecino). Ausente en documentos indexados antes de F-20, que no
   *  tienen chunks persistidos. */
  context?: FragmentContext;
  /** F-44: fragmento sintetizado en retrieval (no una fila/resumen real de
   *  document_chunks) cuya función es dar contexto al juez, no ser citado.
   *  `context` queda ausente a propósito (no hay fila real que describir) —
   *  este campo es la señal explícita que lo distingue de un fragmento sin
   *  contexto por documento antiguo (F-20), que también tiene `context`
   *  ausente pero SÍ es una fila real y SÍ es citable. Sin este campo,
   *  describeFragment y el diagnóstico F-36-bis no podrían distinguir los
   *  dos casos. Ausente (no `false`) en todo fragmento real. */
  isContext?: boolean;
}

export interface CandidateDocument {
  documentId: string;
  documentName: string;
  source: 'manual' | 'google_drive';
  fragments: DocumentFragment[];
  maxScore: number;
}

export interface RerankedCandidate {
  documentId: string;
  documentName: string;
  source: 'manual' | 'google_drive';
  fragments: DocumentFragment[];
  rerankReason: string;
  /** ⚠️ `sin_declarar` NO ES UN NIVEL MÁS: es la AUSENCIA de nivel, y existe
   *  porque hasta el 16/09/2026 se colapsaba en `media` (`sel.confidence ||
   *  'media'`) — un valor que ya tenía dueño. Lo lee `ordenarParaCortar`, que
   *  lo pone el último. Ver lib/analysis/orden-del-rerank.ts. */
  rerankConfidence: 'alta' | 'media' | 'baja' | 'sin_declarar';
}

/**
 * Recuento de hallazgos descartados durante el análisis, por motivo.
 * Solo el número: el texto de un hallazgo descartado NO está verificado y no
 * debe persistirse ni mostrarse como si lo estuviera. Sirve para que un
 * descarte deje rastro visible en vez de morir en un console.warn.
 */
export type DiscardedFindings = Record<string, number>;

export interface DocumentJudgment {
  documentId: string;
  documentName: string;
  source: 'manual' | 'google_drive';
  overlapPercent: number;
  verdict: 'duplicado_exacto' | 'reformulacion' | 'solapamiento_parcial' | 'tema_similar' | 'sin_relacion';
  contradictions: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    severity?: 'contradiction' | 'minor_inconsistency';
    confirmedBy?: ConfirmedBy;
    /** F-69: columnas de la fila en las que los dos lados difieren, tal como
     *  las identificó la capa determinista (finding-rules.ts, veredicto
     *  'confirm'). Ausente cuando no hay columnas identificables: prosa, tabla
     *  sin columna determinable, o hallazgo que no pasó por R2 (los que
     *  confirma el juicio o el double-check no producen este dato).
     *  Es el dato con el que la ficha podrá enseñar QUÉ difiere en vez de
     *  volcar la fila entera; este commit solo lo transporta. */
    columns?: string[];
    /** F-70: valores enfrentados por columna. Solo en hallazgos con
     *  confirmedBy: 'estructura', igual que columns. */
    comparedValues?: ComparedValue[];
    /** F-70: fila completa de cada lado, para plegar en la ficha. */
    newDocRow?: string;
    existingDocRow?: string;
    /**
     * F-88 paso 2 — DE DÓNDE VIENE ESTE HALLAZGO, para poder bifurcar por tipo.
     *
     * NO SIRVE `confirmedBy: 'estructura'` PARA ESTO, y conviene decirlo porque
     * es el error natural: R2 ya emite hallazgos estructurales sobre PROSA, y
     * ésos SÍ deben conservar sus acciones por fila. Lo que hay que distinguir
     * no es quién lo confirmó sino de qué MATERIA es.
     *
     * Ausente = como siempre (juez o R2). Su único consumidor hoy es la
     * supresión de acciones de F-88 P2.
     */
    origen?: 'diff_tabular';
    /**
     * F-88 paso 2 — LA CLAVE DE AGRUPACIÓN, OPACA a propósito.
     *
     * LA HUELLA RECUERDA, EL groupId ENSAMBLA. Compartido por las filas de una
     * misma pareja de tablas y por su entrada en `tableDiffs`, para que la
     * ficha pueda volver a juntarlas. No cruza análisis y no identifica nada
     * ante nadie: su vida entera es el ensamblaje de UNA emisión.
     * Ver el contrato en diff-emision.ts sobre por qué NO deriva del contenido.
     */
    groupId?: string;
    /**
     * F-88 paso 2 — LA HUELLA TABULAR de esta fila (huellaDeHallazgo).
     *
     * AUSENTE EN EL CAMINO PRE-INDEXADO, y no es un fallo: sin el id del
     * documento analizado no hay orden canónico posible (F-87 P4). El hallazgo
     * se emite igual —«justo ahí es donde más vale», F-87 P1—; lo que falta es
     * la memoria, no el hallazgo. Se cuenta en `diff.clasificacion.pre_indexado`.
     */
    huella?: string;
  }>;
  /** F-88 paso 2: la estructura agrupada de cada pareja de tablas de este
   *  candidato. Vacío en los documentos sin tablas, que es el caso normal. */
  tableDiffs?: GrupoDeTablas[];
  overlappingContent: Array<{
    description: string;
    evidence: string;
    evidenceInNewDoc?: string;
    /** F-45: quién generó esta entrada. Ausente = el juez (como siempre, sin
     *  cambios). 'estructura' = code-generada desde el colapso de filas
     *  idénticas (retrieval.ts F-44, vía applyCascadeToCandidate) — no
     *  depende de que el juez pueda citarla, así que sobrevive aunque el
     *  presupuesto haya sacado las filas reales del prompt. */
    confirmedBy?: ConfirmedBy;
    /** F-45/F-46: SOLO presente en entradas con confirmedBy==='estructura'.
     *  Filas idénticas / filas totales de la tabla que colapsó, como entero
     *  0-100. No es el overlapPercent del documento entero (ese lo sigue
     *  fijando el juez en overlapPercent, más abajo) — es la medida de UNA
     *  tabla, calculada sin LLM de por medio. */
    structuralPercent?: number;
  }>;
  uniqueToNewDoc: string[];
  discarded?: DiscardedFindings;
  /** B.313: los hallazgos de esta pareja descartados por cita no verificable,
   *  hasta `TOPE_DE_DESCARTES_POR_PAREJA` (diagnostico-de-cita.ts). Lo lee
   *  `SQL_B313_citas_descartadas.sql`; ninguna pantalla. */
  descartesPorCita?: DescarteDeCita[];
  /** Los que no cupieron en el tope. Ausente = ninguno; si alguna vez vale algo,
   *  es un hallazgo: el juez descartó más de diez en una pareja. */
  descartesPorCitaOmitidos?: number;
}

/**
 * B.313 (02/10/2026) — UN HALLAZGO DESCARTADO POR CITA NO VERIFICABLE, GUARDADO.
 * «Una puerta que descarta tiene que guardar lo que descartó» (protocolo). Campos
 * con nombre, no la respuesta del modelo. Las dos citas van COMPLETAS, cada una
 * en el campo del lado al que la asignó el juez. El id del candidato es el del
 * juicio que lo lleva; el del analizado, el de la fila (o su `storage_path`,
 * F-101).
 */
export interface DescarteDeCita {
  hash: string;
  /** `topic` de la contradicción, o `description` del solapamiento. */
  tema: string;
  tipo: 'contradiccion' | 'solapamiento';
  citaNuevo: string;
  citaExistente: string;
  ladoFallido: 'nuevo' | 'existente' | 'ambos';
  /** Por lado: si pasó, longitud, el paso (la vía si pasó, dónde se rindió si
   *  no) y el pajar contra el que se comprobó. */
  nuevo: LadoDelDescarte;
  existente: LadoDelDescarte;
}

export type LadoDelDescarte = DatosDeLaCita & { verificada: boolean; pajar: PajarDeLaCita };

/** Modo de análisis: rápido (v2 con muestreo) o exhaustivo (multicapa, sin muestreo). */
export type AnalysisMode = 'quick' | 'exhaustive';

/**
 * Opciones que condicionan el comportamiento de cada etapa del pipeline.
 * Se pasan desde pipeline.ts a retrieval, rerank y judge.
 */
export interface PipelineOptions {
  /** true = modo exhaustivo: sin límites arbitrarios, todo se analiza. */
  exhaustive: boolean;
}

export * from './tipos-del-analisis-publicado';
import type { ComparedValue, ConfirmedBy } from './tipos-del-analisis-publicado';

/** Cómo se leyó la pareja. `tijera_vieja`: las dos tijeras de siempre (el
 *  analizado por posición, el candidato por relevancia), y SÓLO con el
 *  interruptor apagado. Los otros tres, sólo en rápido y con el interruptor
 *  encendido (B.295):
 *   · `pareja_entera`: los dos lados enteros;
 *   · `corte_honesto`: la pareja no cabía, y el recorte queda confesado;
 *   · `sin_fuente_comun`: a un lado le faltan trozos y la pareja no se puede
 *     medir con una sola fuente. Se lee como la tijera vieja; el nombre dice por
 *     qué, para que no se confunda con «el interruptor estaba apagado». */
export type RegimenDeLectura = 'tijera_vieja' | 'pareja_entera' | 'corte_honesto' | 'sin_fuente_comun';

/** Qué leyó EL JUEZ de cada lado en la llamada de esta pareja. Contesta a una
 *  pregunta distinta de la de `presupuestoDelCandidato` (B.281), que dice qué
 *  RECUPERÓ y qué MOSTRÓ el retrieval, antes del rerank.
 *  Cada lado: una DECISIÓN (`dejoFuera`, ¿quedó material fuera de lo que leyó
 *  el juez?) con sus magnitudes de apoyo (Contrato_Contadores §2-quater). */
export interface LecturaDeLaPareja {
  /** El candidato de esta pareja. */
  documentId: string;
  regimen: RegimenDeLectura;
  analizado: { caracteres: number; mostrados: number; dejoFuera: boolean };
  /** `caracteres` y `dejoFuera` son `null` si el candidato no tiene trozos: no
   *  se sabe qué había, y un 0 o un false dirían lo que no consta. */
  candidato: { caracteres: number | null; mostrados: number; dejoFuera: boolean | null };
  /** Caracteres de la pareja; `null` con la tijera vieja. */
  presupuesto: number | null;
}

/** Caracteres del texto del analizado que armó el juez, y los que vio. En el
 *  exhaustivo son iguales: no se recorta. */
export interface TextoAnalizado {
  caracteres: number;
  mostrados: number;
}

/** El presupuesto por candidato del análisis, en caracteres, y cómo quedó el
 *  reparto de cada candidato que llegó al JUEZ (los que el rerank descartó no
 *  los vio nadie). */
export interface PresupuestoDelCandidato {
  caracteres: number;
  candidatos: RepartoDelCandidato[];
}

/**
 * B.281 (29/09/2026): el reparto de un candidato. Contesta dos preguntas, y cada
 * una con su tipo de dato:
 *   · «¿cuánto NO vio el juez?» — una MAGNITUD: `caracteres − mostrados`.
 *   · «¿cortó la tijera?» — una DECISIÓN: `dejoFuera`. No se contesta con
 *     caracteres (`claude/Contrato_Contadores.md`, cláusula espejo): una tabla que
 *     cabe entera muestra MÁS de lo recuperado, y el colapso de idénticas muestra
 *     MENOS sin perder nada.
 */
export interface RepartoDelCandidato {
  documentId: string;
  /** El candidato ENTERO: la suma de sus trozos. `null` si no tiene trozos
   *  (indexado antes de F-20): NO SE SABE, que no es un candidato vacío. */
  caracteres: number | null;
  /** Lo que vio el juez de él, con la línea de las filas colapsadas incluida. */
  mostrados: number;
  /** La tijera dejó fuera material RECUPERADO, por tamaño o por el tope de
   *  piezas: una fila, una unidad de prosa o una tabla entera. Las filas
   *  idénticas colapsadas NO cuentan: están representadas, no perdidas (F-74). */
  dejoFuera: boolean;
}


/**
 * Una fila de tabla tal como la enseña la ficha (F-88 paso 2).
 * `clave` es para que el usuario reconozca la fila de un vistazo; `texto` es la
 * fila renderizada por la fase 2 con el orden real de columnas de SU tabla — si
 * la ficha la volviera a componer, podría elegir otro orden que el usado para
 * comparar.
 */
export interface FilaDeTabla {
  clave: string;
  texto: string;
}

/**
 * LA TARJETA AGRUPADA de una pareja de tablas (F-83 P2 + F-88 P4), con sus
 * CUATRO secciones:
 *
 *   1. DISCREPANTES — la alarma. No viven aquí sino en el array de
 *      contradicciones, una por fila (F-84 P1); aquí va solo su recuento y el
 *      `groupId` que permite volver a juntarlas.
 *   2. VARIANTES DE ESCRITURA — información, plegada. La fila difiere pero en
 *      nada que signifique algo distinto.
 *   3. SOLO EN UNO — información, plegada. En INDICATIVO PURO: «presente solo
 *      en X», jamás «nueva» ni «eliminada» (F-83 P2, innegociable).
 *   4. IDÉNTICAS — solo el recuento.
 */
export interface GrupoDeTablas {
  /** Opaco. La huella recuerda; esto ensambla. Ver diff-emision.ts. */
  groupId: string;
  tablaNueva: string;
  tablaExistente: string;
  documentoExistente: string;
  documentoExistenteId: string;
  /** Cuántas filas discrepantes de este grupo hay en el array de
   *  contradicciones. NO incluye las variantes de escritura. */
  discrepantes: number;
  identicas: number;
  /** Cuántas parejas difieren en cada columna — el índice del titular. Vive en
   *  el RESULTADO y no en los contadores porque sus claves son nombres de
   *  columna del cliente (cláusula 5 del contrato de contadores). */
  porColumna: Record<string, number>;
  variantesDeEscritura: Array<{
    clave: string;
    columnas: string[];
    enNuevo: string;
    enOtro: string;
  }>;
  /** ⚠️ LOS DOS MONTONES NO SON INTERCAMBIABLES: `soloEnNuevo` es del documento
   *  que se ANALIZA y `soloEnOtro` del candidato. Confundirlos invierte el
   *  indicativo sin mover ni un número. El corpus no puede detectarlo porque
   *  sus montones son simétricos — ver B.121. */
  soloEnNuevo: FilaDeTabla[];
  soloEnOtro: FilaDeTabla[];
}
