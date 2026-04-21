import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { callLLMJson } from './llm-client';
import type { AtomicClaim } from './extract-claims';

/**
 * Fase 4b — Verificación de afirmaciones atómicas contra el corpus.
 *
 * Cada afirmación se busca en Pinecone para encontrar fragmentos del corpus
 * que hablen del mismo tema. Luego el LLM compara la afirmación con los
 * fragmentos y determina si hay contradicción, confirmación o sin relación.
 *
 * Las contradicciones encontradas aquí se fusionan con las del pipeline v2.
 */

/** Resultado de verificar una afirmación contra el corpus. */
export interface ClaimVerification {
  claim: string;
  category: string;
  sourceQuote: string;
  verdict: 'contradiccion' | 'confirmado' | 'sin_datos';
  /** Solo si verdict === 'contradiccion': qué dice el corpus. */
  corpusSays?: string;
  /** Solo si verdict === 'contradiccion': nombre del documento del corpus. */
  existingDocument?: string;
}

/** Contradicción detectada por verificación atómica (formato compatible con synthesize). */
export interface AtomicContradiction {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
}

interface VerifyResponse {
  verdict: 'contradiccion' | 'confirmado' | 'sin_datos';
  corpusSays?: string;
  existingDocument?: string;
}

/** Tamaño del lote de verificaciones paralelas. */
const VERIFY_BATCH_SIZE = 5;

/** Umbral de similitud para buscar fragmentos relevantes del corpus. */
const CORPUS_SCORE_THRESHOLD = 0.50;

/** Máximo de fragmentos del corpus por afirmación. */
const MAX_CORPUS_FRAGMENTS = 4;

/**
 * Verifica todas las afirmaciones contra el corpus.
 * Devuelve solo las contradicciones encontradas, listas para fusionar
 * con las del pipeline v2.
 */
export async function verifyClaimsAgainstCorpus(
  claims: AtomicClaim[],
  orgId: string,
): Promise<AtomicContradiction[]> {
  if (claims.length === 0) return [];

  const t0 = Date.now();
  const contradictions: AtomicContradiction[] = [];

  // Procesar en lotes para no saturar Pinecone ni el LLM
  for (let batchStart = 0; batchStart < claims.length; batchStart += VERIFY_BATCH_SIZE) {
    const batch = claims.slice(batchStart, batchStart + VERIFY_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(claim => verifySingleClaim(claim, orgId))
    );

    for (const result of batchResults) {
      if (result.verdict === 'contradiccion' && result.corpusSays && result.existingDocument) {
        contradictions.push({
          topic: result.category,
          newDocSays: result.claim,
          existingDocSays: result.corpusSays,
          existingDocument: result.existingDocument,
        });
      }
    }
  }

  console.log(`[verify-claims] ${claims.length} afirmaciones verificadas, ${contradictions.length} contradicciones encontradas (${Date.now() - t0}ms)`);
  return contradictions;
}

// ============================================================
// Internos
// ============================================================

async function verifySingleClaim(claim: AtomicClaim, orgId: string): Promise<ClaimVerification> {
  // 1. Buscar fragmentos relevantes del corpus
  const corpusFragments = await findCorpusFragments(claim.claim, orgId);

  if (corpusFragments.length === 0) {
    return { ...claim, verdict: 'sin_datos' };
  }

  // 2. Pedir al LLM que compare la afirmación con los fragmentos
  const corpusBlock = corpusFragments
    .map((f, i) => `[${i + 1}] Documento: "${f.documentName}"\n${f.text}`)
    .join('\n\n');

  const prompt = `Eres un verificador de datos. Compara esta afirmación de un documento nuevo con fragmentos del corpus existente.

AFIRMACIÓN DEL DOCUMENTO NUEVO:
"${claim.claim}"

CONTEXTO ORIGINAL: "${claim.sourceQuote}"

FRAGMENTOS DEL CORPUS EXISTENTE:
${corpusBlock}

INSTRUCCIONES:
- "contradiccion": el corpus afirma algo DISTINTO sobre el mismo dato concreto (cifra, plazo, política, definición diferente).
- "confirmado": el corpus dice lo mismo o es compatible.
- "sin_datos": los fragmentos no hablan del mismo tema concreto.

Solo marca "contradiccion" si hay un dato concreto que se contradice. Diferencias de redacción NO son contradicciones.

Responde EXCLUSIVAMENTE con este JSON:
{
  "verdict": "contradiccion" | "confirmado" | "sin_datos",
  "corpusSays": "<qué dice el corpus sobre este tema, solo si es contradiccion>",
  "existingDocument": "<nombre del documento del corpus que contradice, solo si es contradiccion>"
}`;

  try {
    const response = await callLLMJson<VerifyResponse>(prompt, {
      maxOutputTokens: 512,
      temperature: 0.1,
    });

    return {
      ...claim,
      verdict: response.verdict || 'sin_datos',
      corpusSays: response.corpusSays,
      existingDocument: response.existingDocument,
    };
  } catch (err) {
    console.warn(`[verify-claims] Falló verificación de "${claim.claim.slice(0, 50)}...":`, err);
    return { ...claim, verdict: 'sin_datos' };
  }
}

interface CorpusFragment {
  text: string;
  documentName: string;
  score: number;
}

async function findCorpusFragments(claimText: string, orgId: string): Promise<CorpusFragment[]> {
  try {
    const [embedding] = await generateEmbeddings([claimText]);
    const index = getIndex();
    const ns = index.namespace(orgId);

    const res = await ns.query({ vector: embedding, topK: MAX_CORPUS_FRAGMENTS * 2, includeMetadata: true });

    const fragments: CorpusFragment[] = [];
    for (const m of res.matches || []) {
      if (!m.metadata || typeof m.score !== 'number') continue;
      if (m.score < CORPUS_SCORE_THRESHOLD) continue;
      const meta = m.metadata as { text?: string; documentName?: string };
      if (!meta.text || !meta.documentName) continue;
      fragments.push({
        text: meta.text,
        documentName: meta.documentName,
        score: m.score,
      });
    }

    // Deduplicar por contenido (mismo texto de distinto embedding)
    const seen = new Set<string>();
    return fragments.filter(f => {
      const key = f.text.slice(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_CORPUS_FRAGMENTS);
  } catch (err) {
    console.warn('[verify-claims] Pinecone query failed:', err);
    return [];
  }
}
