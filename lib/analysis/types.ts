/**
 * Tipos compartidos del pipeline de análisis v2.
 * Diseñado para ser agnóstico de proveedor: hoy Claude+Pinecone, mañana Claude+Voyage+Cohere.
 */

import type { FragmentContext } from './fragment-context';

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
  rerankConfidence: 'alta' | 'media' | 'baja';
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
  }>;
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
}

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

/** Nivel de confianza de una contradicción detectada. */
export type DiscrepancyConfidence = 'alta' | 'posible';

/** Etapas que cayeron a su fallback por fallo del LLM (F-71). Una entrada por
 *  caída, no por etapa: si el juicio cae 3 veces, hay 3 entradas. */
export interface StageFailure {
  /** 'rerank' | 'judge' | 'synthesize' | 'verify-findings' | 'style-check' |
   *  'extract-claims' | 'verify-claims-embeddings' | 'verify-claims' |
   *  'verify-claims-pinecone' | 'double-check' */
  stage: string;
  /** El mensaje de error, recortado. */
  detail?: string;
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
  }>;
  /** Diferencias de enfoque o matiz confirmadas como no estrictamente incompatibles (solo modo exhaustivo). */
  minorInconsistencies?: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
  }>;
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
}
