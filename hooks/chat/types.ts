export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'loading' | 'error';
  content: string;
  sources?: Array<{ documentName: string; score: number }>;
  question?: string;
  noContext?: boolean;
  relevantDocsFound?: number;
  documentsUsed?: number;
}

export interface Document {
  id: string;
  name: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
  status: string;
  source?: string;
  analysis_status?: string; // 'pendiente' | 'en_analisis' | 'analizado' | 'desactualizado'
}

export interface DriveStatus {
  connected: boolean;
  email?: string;
  folderName?: string;
  lastSynced?: string;
  folders?: Array<{ id: string; name: string; fileCount: number }>;
  provider?: string;
}

export interface PendingAnalysis {
  fileName: string;
  storagePath: string;
  fileSize: number;
  analysis: Record<string, unknown>;
  documentSources?: Record<string, string[]>;
  /** Regla 6 (02/09): `false` si la fila de `analysis_results` no se pudo
   *  escribir. AUSENTE = se asume guardado — ver `avisosDelAnalisis`. */
  guardado?: boolean;
}

export interface ImprovementTarget {
  fileName: string;
  storagePath?: string;
  initialText: string;
  analysis: Record<string, unknown>;
  documentSources?: Record<string, string[]>;
  existingDocWithSameName: { id: string; name: string } | null;
}

export interface CreditsInfo {
  remaining: number;
  extra: number;
  plan: string;
  subscriptionStatus: string;
  gracePeriodEndsAt: string | null;
}

export interface SessionInfo {
  access_token: string;
  user: { email?: string; id: string };
}
