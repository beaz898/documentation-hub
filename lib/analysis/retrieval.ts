import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import type { CandidateDocument, DocumentFragment, PipelineOptions } from './types';

/**
 * Etapa 1 — Retrieval amplio.
 *
 * Modo rápido: umbral 0.60, secuencial, 4 fragmentos por documento.
 * Modo exhaustivo: umbral 0.45, paralelo por lotes, TODOS los fragmentos únicos.
 *   El umbral bajo en exhaustivo permite recuperar candidatos que los embeddings
 *   puntúan bajo pero que pueden contener contradicciones. El rerank filtra el ruido.
 */

/** Tamaño del lote de queries paralelas a Pinecone. */
const QUERY_BATCH_SIZE = 5;

/** Fragmentos por documento en modo rápido. */
const FRAGS_PER_DOC_QUICK = 4;

/** Umbral mínimo de similitud.
 *  Rápido: 0.60 (menos ruido, suficiente para detección básica).
 *  Exhaustivo: 0.45 (más permisivo — el rerank filtra el ruido temático). */
const SCORE_THRESHOLD_QUICK = 0.60;
const SCORE_THRESHOLD_EXHAUSTIVE = 0.45;

export async function retrieveCandidates(args: {
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
  options?: PipelineOptions;
}): Promise<CandidateDocument[]> {
  const { sampleTexts, orgId, excludeDocumentId, options } = args;
  const isExhaustive = options?.exhaustive === true;

  const embeddings = await generateEmbeddings(sampleTexts);
  const index = getIndex();
  const ns = index.namespace(orgId);

  const scoreThreshold = isExhaustive ? SCORE_THRESHOLD_EXHAUSTIVE : SCORE_THRESHOLD_QUICK;

  // Recoger todos los matches de Pinecone
  const allMatches: DocumentFragment[] = [];

  if (isExhaustive) {
    // Paralelo por lotes — menor latencia total
    for (let batchStart = 0; batchStart < embeddings.length; batchStart += QUERY_BATCH_SIZE) {
      const batch = embeddings.slice(batchStart, batchStart + QUERY_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(emb => ns.query({ vector: emb, topK: 25, includeMetadata: true }))
      );
      for (const res of batchResults) {
        collectMatches(res.matches, allMatches, scoreThreshold, excludeDocumentId);
      }
    }
  } else {
    // Secuencial — menos presión sobre Pinecone free tier
    for (const emb of embeddings) {
      const res = await ns.query({ vector: emb, topK: 25, includeMetadata: true });
      collectMatches(res.matches, allMatches, scoreThreshold, excludeDocumentId);
    }
  }

  // Agrupar por documento y deduplicar chunks
  const byDoc = new Map<string, DocumentFragment[]>();
  for (const f of allMatches) {
    const arr = byDoc.get(f.documentId) ?? [];
    arr.push(f);
    byDoc.set(f.documentId, arr);
  }

  const candidates: CandidateDocument[] = [];
  for (const [documentId, frags] of byDoc) {
    const unique = deduplicateFragments(frags);
    const sorted = unique.sort((a, b) => b.score - a.score);

    // Exhaustivo: todos los fragmentos únicos. Rápido: solo los top 4.
    const selected = isExhaustive ? sorted : sorted.slice(0, FRAGS_PER_DOC_QUICK);

    candidates.push({
      documentId,
      documentName: selected[0].documentName,
      source: selected[0].source,
      fragments: selected,
      maxScore: selected[0].score,
    });
  }

  // Hasta 25 candidatos hacia el rerank
  return candidates.sort((a, b) => b.maxScore - a.maxScore).slice(0, 25);
}

// ============================================================
// Helpers internos
// ============================================================

/** Extrae DocumentFragments válidos de los matches de Pinecone. */
function collectMatches(
  matches: Array<{ metadata?: Record<string, unknown>; score?: number }> | undefined,
  out: DocumentFragment[],
  scoreThreshold: number,
  excludeDocumentId?: string,
): void {
  for (const m of matches || []) {
    if (!m.metadata || typeof m.score !== 'number') continue;
    if (m.score < scoreThreshold) continue;
    const meta = m.metadata as {
      documentId?: string; documentName?: string;
      source?: string; chunkIndex?: number; text?: string;
    };
    if (!meta.documentId || !meta.documentName || !meta.text) continue;
    if (excludeDocumentId && meta.documentId === excludeDocumentId) continue;

    out.push({
      text: meta.text,
      documentId: meta.documentId,
      documentName: meta.documentName,
      source: meta.source === 'google_drive' ? 'google_drive' : 'manual',
      score: m.score,
      chunkIndex: meta.chunkIndex ?? 0,
    });
  }
}

/** Elimina fragmentos del mismo chunk (pueden aparecer si distintos embeddings los recuperan). */
function deduplicateFragments(frags: DocumentFragment[]): DocumentFragment[] {
  const seen = new Set<string>();
  const out: DocumentFragment[] = [];
  for (const f of frags) {
    const key = `${f.documentId}-${f.chunkIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}
