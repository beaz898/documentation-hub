/**
 * Tipos compartidos del pipeline de análisis v2.
 * Diseñado para ser agnóstico de proveedor: hoy Claude+Pinecone, mañana Claude+Voyage+Cohere.
 */

export interface DocumentFragment {
  text: string;
  documentId: string;
  documentName: string;
  source: 'manual' | 'google_drive';
  score: number;
  chunkIndex: number;
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
  }>;
  overlappingContent: Array<{
    description: string;
    evidence: string;
    evidenceInNewDoc?: string;
  }>;
  uniqueToNewDoc: string[];
}

/** Modo de análisis: rápido (v2 con muestreo) o exhaustivo (multicapa, sin muestreo). */
export type AnalysisMode = 'quick' | 'exhaustive';

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
  }>;
  discrepancies: Array<{
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
}
