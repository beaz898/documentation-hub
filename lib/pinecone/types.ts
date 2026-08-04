/** Metadata que la app escribe en cada vector. Base obligatoria + opcionales. */
export interface VectorMetadata {
  text: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  totalChunks: number;
  orgId: string;
  source?: string;          // 'manual' | 'google_drive' | ...
  folderPath?: string;      // solo en documentos de Drive
  /** Estado de análisis del documento al que pertenece este vector.
   *  Proyección de documents.analysis_status (Supabase es la fuente de verdad).
   *  Valores: 'pendiente' | 'en_analisis' | 'analizado' | 'desactualizado'.
   *  Opcional: los vectores anteriores a B.2 no lo tienen (backfill en B.4). */
  analysisStatus?: string;
  /** Generación del vector (C.4b). Opcional por la misma razón que analysisStatus:
   *  los vectores anteriores a C.4b no lo tienen — su ausencia se trata como
   *  generación 1 implícita (parsing tolerante). */
  generation?: number;
}

/** Un vector listo para upsert. */
export interface VectorRecord {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

/** Opciones de una query de similitud. La capa exige orgId aparte; el resto
 *  se pasa tal cual al SDK. filter es genérico (metadata filter de Pinecone). */
export interface QueryVectorsParams {
  vector: number[];
  topK: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  filter?: object;
}

/** Un match devuelto por query (forma simplificada de ScoredPineconeRecord). */
export interface VectorMatch {
  id: string;
  score?: number;
  metadata?: VectorMetadata;
  values?: number[];
}
