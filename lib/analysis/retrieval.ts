import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import type { CandidateDocument, DocumentFragment } from './types';

/**
 * Etapa 1 — Retrieval amplio.
 * Trae candidatos de Pinecone sin decidir nada; solo filtra.
 * Umbral bajo (0.60) para no perder candidatos. El juicio lo hace el LLM después.
 */
export async function retrieveCandidates(args: {
  sampleTexts: string[];      // fragmentos representativos del doc nuevo
  orgId: string;
  excludeDocumentId?: string; // para evitar auto-match al reanalizar
}): Promise<CandidateDocument[]> {
  const { sampleTexts, orgId, excludeDocumentId } = args;

  const embeddings = await generateEmbeddings(sampleTexts);
  const index = getIndex();
  const ns = index.namespace(orgId);

  const allMatches: DocumentFragment[] = [];
  for (const emb of embeddings) {
    const res = await ns.query({ vector: emb, topK: 15, includeMetadata: true });
    for (const m of res.matches || []) {
      if (!m.metadata || typeof m.score !== 'number') continue;
      if (m.score < 0.60) continue;
      const meta = m.metadata as {
        documentId?: string; documentName?: string;
        source?: string; chunkIndex?: number; text?: string;
      };
      if (!meta.documentId || !meta.documentName || !meta.text) continue;
      if (excludeDocumentId && meta.documentId === excludeDocumentId) continue;

      allMatches.push({
        text: meta.text,
        documentId: meta.documentId,
        documentName: meta.documentName,
        source: meta.source === 'google_drive' ? 'google_drive' : 'manual',
        score: m.score,
        chunkIndex: meta.chunkIndex ?? 0,
      });
    }
  }

  // Agrupar por documento, quedarse con top 4 fragmentos por doc
  const byDoc = new Map<string, DocumentFragment[]>();
  for (const f of allMatches) {
    const arr = byDoc.get(f.documentId) ?? [];
    arr.push(f);
    byDoc.set(f.documentId, arr);
  }

  const candidates: CandidateDocument[] = [];
  for (const [documentId, frags] of byDoc) {
    const sorted = frags.sort((a, b) => b.score - a.score).slice(0, 4);
    candidates.push({
      documentId,
      documentName: sorted[0].documentName,
      source: sorted[0].source,
      fragments: sorted,
      maxScore: sorted[0].score,
    });
  }

  // Ordenar documentos por maxScore y cap a 10 para no saturar al reranker
  return candidates.sort((a, b) => b.maxScore - a.maxScore).slice(0, 10);
}
