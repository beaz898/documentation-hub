/**
 * Tipos compartidos del pipeline de análisis v2.
 * Diseñado para ser agnóstico de proveedor: hoy Gemini+Pinecone, mañana Claude+Voyage+Cohere.
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
  }>;
  uniqueToNewDoc: string[];
}

export interface FinalAnalysis {
  isDuplicate: boolean;
  duplicateOf: string | null;
  duplicateConfidence: number;
  overlaps: Array<{
    existingDocument: string;
    description: string;
    severity: 'alta' | 'media' | 'baja';
    overlapPercent: number;
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
}
