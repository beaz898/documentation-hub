/**
 * LO QUE SE PUBLICA DE UN ANÁLISIS: `FinalAnalysis` y sus tipos auxiliares.
 *
 * Partido de `types.ts` el 05/10/2026, sin cambiar una línea de lo movido:
 * `types.ts` iba por 637 líneas contra un tope de 400, y lo siguiente que había
 * que añadirle —la lista de puntos de cada solapamiento (B.314)— era de este
 * dominio. `types.ts` lo reexporta todo, así que ningún import cambia.
 */
import type { AnalysisMode, DiscardedFindings, DocumentJudgment, GrupoDeTablas, LecturaDeLaPareja, PresupuestoDelCandidato, TextoAnalizado } from './types';
import type { PipelineCounters } from './counters';
import type { Termometro } from './termometro';
import type { CoberturaDeCandidatos } from './cobertura-de-candidatos';

/** Nivel de confianza de una contradicción detectada. */
export type DiscrepancyConfidence = 'alta' | 'posible';

/** Etapas que cayeron a su fallback por fallo del LLM (F-71). Una entrada por
 *  caída, no por etapa: si el juicio cae 3 veces, hay 3 entradas. */
export interface StageFailure {
  /** 'rerank' | 'judge' | 'synthesize' | 'verify-findings' | 'style-check' |
   *  'double-check'
   *
   *  F-114 (21/09/2026): se retiran de esta lista las cuatro etapas de la rama
   *  atómica —'extract-claims', 'verify-claims-embeddings', 'verify-claims' y
   *  'verify-claims-pinecone'—, porque los dos módulos que las emitían ya no
   *  existen. Un nombre de etapa que nadie puede emitir es una lista que miente
   *  a quien la lea buscando qué puede caer. */
  stage: string;
  /** El mensaje de error, recortado. */
  detail?: string;
}

/**
 * F-74 P2: filas de una tabla que el reparto por unidades dejó fuera del
 * prompt por tamaño. Es el ALCANCE del análisis, no un hallazgo — declara qué
 * no se llegó a comparar.
 *
 * `rowsLeftOut` de `rowsRecovered`: el denominador son las filas que Pinecone
 * DEVOLVIÓ para esa tabla, no todas las que tiene. Las que nunca fueron
 * candidatas no se «quedaron fuera por tamaño»: no compitieron.
 *
 * NO dice cuántas de esas filas eran interesantes. Decirlo exige el predicado
 * de F-65 (claude/Descarte_Filas_Ajenas.md), que aún no está implementado; ver
 * B.104.
 */
export interface SelectionLimit {
  documentName: string;
  sheetName: string | null;
  tableId: string;
  rowsLeftOut: number;
  rowsRecovered: number;
}

/** F-70: valor de una columna enfrentado entre los dos documentos.
 *  Lo calcula el código en el punto de la alineación, nunca el modelo. */
export interface ComparedValue {
  column: string;
  newDocValue: string;
  existingDocValue: string;
}

/**
 * Quién confirmó un hallazgo (F-39/F-40, Fable). Registra QUIÉN, no CUÁNTA
 * confianza hay — eso lo sigue diciendo `confidence`, un dato distinto.
 * 'estructura': la capa determinista (finding-rules.ts, veredicto 'confirm').
 * 'juicio': la llamada corta (verify-findings.ts, veredicto 'confirmado').
 * 'double_check': Sonnet en el modo exhaustivo (double-check.ts) — el
 * veredicto más caro y el último en pronunciarse, así que si sella un hallazgo
 * que ya traía 'estructura' o 'juicio', su valor gana.
 */
export type ConfirmedBy = 'estructura' | 'juicio' | 'double_check';

/** Motivo por el que el análisis exhaustivo se detuvo antes de completar todas las capas. */
export type EarlyStopReason = 'high_overlap' | 'too_many_contradictions';

export interface FinalAnalysis {
  isDuplicate: boolean;
  duplicateOf: string | null;
  duplicateConfidence: number;
  overlaps: Array<{
    existingDocument: string;
    /** F-86 paso 0: el ID del documento existente, HERMANO del nombre y no su
     *  sustituto. Ver la nota extensa en `discrepancies` justo debajo. */
    existingDocumentId?: string;
    description: string;
    severity: 'alta' | 'media' | 'baja';
    overlapPercent: number;
    textRef?: string;
    /** F-45: presente ('estructura') cuando esta entrada viene del montón
     *  estructural (synthesize.ts) — ausente cuando viene del montón del
     *  juez, igual que en discrepancies. */
    confirmedBy?: ConfirmedBy;
  }>;
  discrepancies: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
    /**
     * F-86 paso 0 — EL ID DEL DOCUMENTO EXISTENTE.
     *
     * CAMPO HERMANO, NO SUSTITUTO. `existingDocument` (el nombre) SE QUEDA: es
     * lo que el usuario lee en la tarjeta y en los tres prompts de
     * ImprovementModal. Este campo se añade AL LADO para lo que un nombre no
     * puede hacer: identificar el documento cuando lo renombran.
     *
     * PARA QUÉ SE PROPAGA HOY, si nadie lo pinta: lo necesita la huella
     * bidireccional (huella-hallazgo.ts). `huellaDeProsa` pide el `id` de los
     * dos lados, y hoy el servidor no puede dárselo porque synthesize pone el
     * NOMBRE y el id se pierde ahí mismo. Sin este campo, la persistencia de
     * descartes no tiene con qué construir la identidad.
     *
     * OPCIONAL, y para siempre: los análisis guardados en el jsonb antes de
     * este commit no lo tienen, y la bandeja los relee meses después.
     *
     * LO QUE NO CAMBIA EN ESTE COMMIT, a propósito (F-87, frente del ciclo de
     * vida): `involved_documents` sigue guardando nombres, `makeContradictionKey`
     * sigue construyendo su clave con el nombre, y `documentSources` sigue
     * indexado por nombre. Son el mismo patrón y se arreglan juntos o no se
     * arreglan: cambiar `makeContradictionKey` al id cambiaría QUÉ se considera
     * duplicado, que es comportamiento, y este commit no cambia comportamiento.
     */
    existingDocumentId?: string;
    /** Nivel de confianza: 'alta' si dos modelos coinciden, 'posible' si solo uno la detectó.
     *  Opcional para compatibilidad: el pipeline rápido no hace doble verificación. */
    confidence?: DiscrepancyConfidence;
    severity?: 'contradiction' | 'minor_inconsistency';
    confirmedBy?: ConfirmedBy;
    /** F-69: mismo campo que en DocumentJudgment.contradictions, transportado
     *  sin tocar por synthesize.ts. Llega al jsonb de analysis_results por el
     *  mismo camino que confirmedBy (persist-analysis.ts guarda `analysis`
     *  entero) y de ahí a lo que lee el cliente. Ausente en los análisis
     *  guardados antes de este commit. */
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
  /** Diferencias de enfoque o matiz confirmadas como no estrictamente incompatibles (solo modo exhaustivo). */
  minorInconsistencies?: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
    /** F-86 paso 0: hermano del nombre, igual que en `discrepancies`. Este es
     *  el que más fácil se pierde: se construye con un destructuring de lista
     *  CERRADA en pipeline.ts, que es la puerta por la que murieron los campos
     *  de F-69, F-70 y F-71. */
    existingDocumentId?: string;
  }>;
  /**
   * F-88 paso 2 — LA ESTRUCTURA AGRUPADA del diff de tablas, una por pareja.
   *
   * VIAJA AUNQUE NADIE LA PINTE TODAVÍA: la ficha es el commit siguiente. Se
   * emite ya porque las CINCUENTA AJENAS no tienen otro domicilio —F-84 P1 las
   * dejó fuera de todos los contadores planos a propósito— y un dato que no
   * viaja es un dato que hay que volver a calcular.
   *
   * ⚠️ CAMPO DE PRIMER NIVEL, así que hay que añadirlo A MANO en las dos listas
   * CERRADAS de serialización: app/api/analyze-v2/route.ts y
   * worker/src/index.ts. Es exactamente el hueco por el que `stageFailures` no
   * llegó al cliente en F-71.
   */
  tableDiffs?: GrupoDeTablas[];
  newInformation: string;
  recommendation: 'INDEXAR' | 'REVISAR' | 'NO_INDEXAR';
  summary: string;
  judgments: DocumentJudgment[]; // útil para debug
  /** Indica si el resultado viene del análisis rápido o del exhaustivo.
   *  Opcional aquí porque lo asigna pipeline.ts tras la síntesis. */
  analysisMode?: AnalysisMode;
  /** Problemas de estilo detectados (solo en análisis exhaustivo).
   *  Opcional para compatibilidad: el pipeline rápido no los incluye. */
  styleProblems?: Array<{
    type: 'ortografia' | 'ambiguedad' | 'sugerencia';
    title: string;
    description: string;
    textRef: string;
  }>;
  /**
   * Si el análisis exhaustivo se detuvo antes de completar todas las capas.
   * - 'high_overlap': solapamiento ≥30% con documentos existentes.
   * - 'too_many_contradictions': ≥15 contradicciones detectadas por el judge.
   * Ausente si el análisis se completó normalmente.
   */
  earlyStop?: EarlyStopReason;
  /**
   * Total de candidatas a contradicción encontradas antes del corte a 50.
   * Presente solo cuando hay más de 50 candidatas; indica cuántas se omitieron.
   */
  candidatesOverLimit?: number;
  /**
   * Estimación del coste computacional del análisis exhaustivo.
   * Usado para calcular el reembolso parcial de créditos en planes Business/Enterprise.
   * - 'light':  <10 contradicciones confirmadas
   * - 'medium': 10–30 contradicciones confirmadas
   * - 'heavy':  >30 contradicciones o pipeline completo con 50 candidatas
   */
  estimatedCost?: 'light' | 'medium' | 'heavy';
  /**
   * Recuento de hallazgos descartados por motivo, sumado de todos los
   * judgments. Solo el número; el texto descartado no está verificado.
   * Ausente si no se descartó nada.
   */
  discardedFindings?: DiscardedFindings;
  /**
   * F-71: etapas que cayeron a su fallback por fallo del LLM. Ausente o vacío
   * = el análisis se completó con todas sus etapas. No vacío = el resultado
   * está INCOMPLETO y no se puede leer como una foto del corpus: lo que no se
   * encontró puede ser que no exista o que no se llegara a mirar.
   * Cuando trae entradas: la recomendación es 'REVISAR', el resumen lo dice, y
   * los créditos se devuelven íntegros.
   */
  stageFailures?: StageFailure[];
  /**
   * F-74 P2: tablas cuyas filas recuperadas no cupieron enteras en el reparto.
   * Ausente o vacío = todo lo recuperado se comparó. Es el ALCANCE declarado,
   * no un hallazgo: se cobra igual y volver a lanzarlo NO cambia el resultado,
   * a diferencia de stageFailures.
   */
  selectionLimits?: SelectionLimit[];
  /**
   * B.244 paso 2: contra cuántos documentos se comparó, de los afines que
   * encontró la recuperación. AUSENTE en todo análisis anterior a este
   * despliegue, y la bandeja relee jsonb viejos — por eso `resumirCobertura`
   * calla cuando no está en vez de inventarse un cero.
   */
  coberturaDeCandidatos?: CoberturaDeCandidatos;
  /**
   * F-82: contadores de INCIDENCIA de las etapas del pipeline — cuántas veces
   * actuó cada pieza, no qué encontró. Es lo que exige la condición 3 de la
   * regla de entrada (protocolo), y su contrato está en
   * `claude/Contrato_Contadores.md`: catálogo cerrado, apellido de etapa
   * obligatorio y fusión que solo transporta lo declarado.
   *
   * NO ES `discardedFindings` con otro nombre, y la diferencia es la que aquel
   * campo perdió: aquí solo entran RECUENTOS DE DECISIÓN, y solo los que están
   * en el catálogo de `counters.ts`.
   *
   * Viaja aquí dentro porque `FinalAnalysis` es el único objeto que cruza a la
   * persistencia; `saveAnalysisResult` lo iza a su propia columna
   * (`analysis_results.pipeline_counters`), igual que ya iza
   * `contradictions_found` y las otras seis. Ausente en los análisis anteriores
   * a F-82.
   */
  pipelineCounters?: PipelineCounters;

  /**
   * F-114 — EL TERMÓMETRO DE LA RECUPERACIÓN, y va DENTRO del jsonb, no izado a
   * columna propia como `pipelineCounters`.
   *
   * ⚠️ LA DIFERENCIA CON UN CONTADOR ES LA QUE DECIDE DÓNDE VIVE: un contador
   * dice cuántas veces se tomó un camino y se puede AGREGAR entre análisis, así
   * que su columna sirve. El termómetro dice **qué se encontró** —mínimo, máximo,
   * histograma, hueco—, y `mergeCounters` SUMA al fusionar: sumar dos mínimos da
   * una cifra sin sentido. Por eso va aquí (F-114 P2, opción b).
   *
   * ⚠️ OPCIONAL EN EL TIPO, OBLIGATORIO EN EL CAMINO: los tres retornos de
   * `runCorePipeline` lo llevan por el tipo `CountedAnalysis`, y el corte por
   * duplicado exacto lo escribe con `termometroNoRecuperado`. Es opcional aquí
   * sólo porque los análisis anteriores a hoy no lo tienen.
   */
  termometro?: Termometro;
  /**
   * 27/09/2026 — F-116: cuánto texto del documento analizado había y cuánto
   * llegó al juez tras el recorte del rápido. Es la cifra que mide el
   * estrangulamiento («truncado a 6000 de 7342»), que hasta hoy sólo salía en
   * el log.
   *
   * ⚠️ NO ES UN CONTADOR, y por eso no va en `pipelineCounters`: es una
   * MAGNITUD, y la cláusula 2 de `claude/Contrato_Contadores.md` admite sólo
   * recuentos de decisión. Viaja como `termometro`, dentro del jsonb `analysis`.
   *
   * Ausente = el juez no corrió (sin candidatos, duplicado exacto), el
   * análisis es anterior al 27/09, o el interruptor del escalón 1 estaba
   * encendido (B.295): entonces el analizado se lee distinto en cada pareja, y
   * lo dice `lecturaDeLasParejas`. Nadie decide nada con él.
   */
  textoAnalizado?: TextoAnalizado;
  /**
   * 29/09/2026 — B.281: con qué presupuesto por candidato se repartieron los
   * fragmentos que vio el juez. En rápido es fijo (3.000 caracteres); en
   * exhaustivo lo decide `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` en el worker, y
   * hasta hoy sólo salía en el log (`lib/analysis/retrieval.ts`), así que un
   * exhaustivo guardado no decía si se hizo con 3.000 o con otra cosa.
   *
   * ⚠️ NO ES UN CONTADOR, por la misma razón que `textoAnalizado`: es una
   * MAGNITUD, y la cláusula 2 de `claude/Contrato_Contadores.md` admite sólo
   * recuentos de decisión. Viaja dentro del jsonb `analysis`.
   *
   * Ausente = el juez no corrió (sin candidatos, duplicado exacto) o el
   * análisis es anterior al 29/09. Nadie decide nada con él.
   */
  presupuestoDelCandidato?: PresupuestoDelCandidato;
  /**
   * 29/09/2026 — escalón 1 (B.295): qué leyó EL JUEZ de cada lado, una entrada
   * por candidato juzgado. Es la otra estación: `presupuestoDelCandidato` dice
   * qué recuperó el retrieval antes del rerank, y esto qué entró en la llamada
   * del juez. Que discrepen es un dato, no un fallo.
   *
   * Se rellena también con el interruptor apagado (`tijera_vieja`): sin eso no
   * hay línea de base. Ausente = el juez no corrió o el análisis es anterior.
   */
  lecturaDeLasParejas?: LecturaDeLaPareja[];
}
