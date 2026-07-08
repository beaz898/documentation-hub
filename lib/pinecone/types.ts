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
  // analysisStatus?: string;  // se añadirá en B.2 (estado del documento)
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
