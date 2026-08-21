import { queryVectors, buildCorpusFilter } from '@/lib/pinecone/vectors';
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

/**
 * Presupuesto de contenido por documento candidato en modo rápido.
 * Antes se recortaba a un número fijo de fragmentos, lo que penalizaba a los
 * documentos troceados en piezas pequeñas (una fila de hoja de cálculo es un
 * fragmento) frente a los troceados en secciones largas. Se mide contenido,
 * no piezas.
 */
const FRAGMENT_BUDGET_CHARS_QUICK = 3000;

/**
 * Red de seguridad: un documento con miles de fragmentos diminutos no debe
 * inundar el juicio aunque quepa en el presupuesto.
 */
const MAX_FRAGMENTS_PER_DOC_QUICK = 25;

/** Umbral mínimo de similitud.
 *  Rápido: 0.50 — calibrado para chunks de ~500 caracteres tras el troceado
 *  por sección (chunking.ts): con chunks más pequeños y concretos, el score
 *  de similitud de cada uno es naturalmente más bajo que con los chunks de
 *  ~2000 caracteres de antes, así que el umbral bajó en la misma calibración.
 *  No subir a ciegas sin volver a medir con el troceado actual.
 *  Exhaustivo: 0.45 (más permisivo — el rerank filtra el ruido temático). */
const SCORE_THRESHOLD_QUICK = 0.50;
const SCORE_THRESHOLD_EXHAUSTIVE = 0.45;

export async function retrieveCandidates(args: {
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
  batchDocumentIds?: string[];
  options?: PipelineOptions;
}): Promise<CandidateDocument[]> {
  const { sampleTexts, orgId, excludeDocumentId, batchDocumentIds, options } = args;
  const isExhaustive = options?.exhaustive === true;

  const embeddings = await generateEmbeddings(sampleTexts);
  const scoreThreshold = isExhaustive ? SCORE_THRESHOLD_EXHAUSTIVE : SCORE_THRESHOLD_QUICK;
  const corpusFilter = buildCorpusFilter(batchDocumentIds);

  // Recoger todos los matches de Pinecone
  const allMatches: DocumentFragment[] = [];

  if (isExhaustive) {
    // Paralelo por lotes — menor latencia total
    for (let batchStart = 0; batchStart < embeddings.length; batchStart += QUERY_BATCH_SIZE) {
      const batch = embeddings.slice(batchStart, batchStart + QUERY_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(emb => queryVectors(orgId, { vector: emb, topK: 25, includeMetadata: true, filter: corpusFilter }))
      );
      for (const matches of batchResults) {
        collectMatches(matches as Array<{ metadata?: Record<string, unknown>; score?: number }>, allMatches, scoreThreshold, excludeDocumentId);
      }
    }
  } else {
    // Secuencial — menos presión sobre Pinecone free tier
    for (const emb of embeddings) {
      const matches = await queryVectors(orgId, { vector: emb, topK: 25, includeMetadata: true, filter: corpusFilter });
      collectMatches(matches as Array<{ metadata?: Record<string, unknown>; score?: number }>, allMatches, scoreThreshold, excludeDocumentId);
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

    // Exhaustivo: todos los fragmentos únicos. Rápido: los que quepan en el presupuesto.
    const selected = isExhaustive ? sorted : selectFragmentsWithinBudget(sorted);

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
      generation?: number;
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
      // C.4b escribe `generation` en la metadata de todos los vectores desde
      // hace varias fases, pero hasta ahora nadie la leía. Sin ella no se puede
      // localizar el chunk correcto en document_chunks: los chunks de
      // generaciones distintas del mismo documento comparten chunk_index.
      // Ausente = g1 implícita, igual que en parseVectorId.
      generation: meta.generation ?? 1,
    });
  }
}

/**
 * Selecciona fragmentos por orden de score hasta agotar el presupuesto de
 * caracteres. Un fragmento NUNCA se parte: si no cabe entero, se descarta y se
 * sigue con el siguiente, que puede ser más corto. Se garantiza al menos un
 * fragmento aunque por sí solo supere el presupuesto.
 */
function selectFragmentsWithinBudget(sortedFragments: DocumentFragment[]): DocumentFragment[] {
  if (sortedFragments.length === 0) return sortedFragments;

  const selected: DocumentFragment[] = [sortedFragments[0]];
  let usedChars = sortedFragments[0].text.length;

  for (let i = 1; i < sortedFragments.length; i++) {
    if (selected.length >= MAX_FRAGMENTS_PER_DOC_QUICK) break;
    const fragment = sortedFragments[i];
    if (usedChars + fragment.text.length > FRAGMENT_BUDGET_CHARS_QUICK) continue;
    selected.push(fragment);
    usedChars += fragment.text.length;
  }

  return selected;
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
