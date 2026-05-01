export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'loading' | 'error';
  content: string;
  sources?: Array<{ documentName: string; score: number }>;
}

export interface Document {
  id: string;
  name: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
  status: string;
  source?: string;
}

export interface DriveStatus {
  connected: boolean;
  email?: string;
  folderName?: string;
  lastSynced?: string;
  folders?: Array<{ id: string; name: string; fileCount: number }>;
}

export interface PendingAnalysis {
  fileName: string;
  storagePath: string;
  fileSize: number;
  analysis: Record<string, unknown>;
  documentSources?: Record<string, string[]>;
}

export interface ImprovementTarget {
  fileName: string;
  storagePath: string;
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
