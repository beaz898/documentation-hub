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
 *
 * OPTIMIZACIONES (mayo 2026):
 * - Embeddings en batch: todas las afirmaciones se embeden en una sola llamada.
 * - Verificación secuencial: una llamada LLM a la vez con pausa entre ellas
 *   para evitar 429 de Anthropic.
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

/** Umbral de similitud para buscar fragmentos relevantes del corpus. */
const CORPUS_SCORE_THRESHOLD = 0.50;

/** Máximo de fragmentos del corpus por afirmación. */
const MAX_CORPUS_FRAGMENTS = 4;

/** Número de verificaciones LLM en paralelo. */
const CONCURRENCY = 5;

/** Pausa en ms entre rondas de verificaciones para evitar 429. */
const DELAY_BETWEEN_ROUNDS_MS = 200;

/**
 * Verifica todas las afirmaciones contra el corpus.
 * Devuelve solo las contradicciones encontradas, listas para fusionar
 * con las del pipeline v2.
 *
 * Flujo optimizado:
 * 1. Embeder todas las afirmaciones en un solo batch.
 * 2. Buscar fragmentos del corpus para cada embedding (Pinecone, sin LLM).
 * 3. Verificar en rondas de CONCURRENCY llamadas LLM en paralelo.
 */
export async function verifyClaimsAgainstCorpus(
  claims: AtomicClaim[],
  orgId: string,
): Promise<AtomicContradiction[]> {
  if (claims.length === 0) return [];

  const t0 = Date.now();
  const contradictions: AtomicContradiction[] = [];

  // ── Paso 1: Embeder todas las afirmaciones en un solo batch ───
  const claimTexts = claims.map(c => c.claim);
  let embeddings: number[][];
  try {
    embeddings = await generateEmbeddings(claimTexts);
  } catch (err) {
    console.warn('[verify-claims] Falló el batch de embeddings:', err);
    return [];
  }

  // ── Paso 2: Buscar fragmentos del corpus para cada claim ──────
  const corpusResults = await Promise.all(
    embeddings.map((emb, i) => findCorpusFragmentsByEmbedding(emb, orgId, claims[i].claim))
  );

  // ── Paso 3: Filtrar claims que tienen fragmentos relevantes ───
  const claimsToVerify: Array<{ claim: AtomicClaim; fragments: CorpusFragment[] }> = [];
  for (let i = 0; i < claims.length; i++) {
    if (corpusResults[i].length > 0) {
      claimsToVerify.push({ claim: claims[i], fragments: corpusResults[i] });
    }
  }

  // ── Paso 4: Verificar en rondas de CONCURRENCY en paralelo ────
  for (let roundStart = 0; roundStart < claimsToVerify.length; roundStart += CONCURRENCY) {
    if (roundStart > 0) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_ROUNDS_MS));
    }

    const round = claimsToVerify.slice(roundStart, roundStart + CONCURRENCY);
    const results = await Promise.all(
      round.map(({ claim, fragments }) => verifySingleClaimWithFragments(claim, fragments))
    );

    for (const result of results) {
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

  console.log(`[verify-claims] ${claims.length} afirmaciones verificadas (${claimsToVerify.length} con corpus), ${contradictions.length} contradicciones encontradas (${Date.now() - t0}ms)`);
  return contradictions;
}

// ============================================================
// Internos
// ============================================================

/**
 * Verifica una afirmación contra fragmentos del corpus ya recuperados.
 * Separado de la búsqueda de embeddings para poder secuenciar las llamadas LLM.
 */
async function verifySingleClaimWithFragments(
  claim: AtomicClaim,
  corpusFragments: CorpusFragment[],
): Promise<ClaimVerification> {
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

/**
 * Busca fragmentos relevantes del corpus usando un embedding ya calculado.
 * Esto evita la llamada individual a generateEmbeddings por cada claim.
 */
async function findCorpusFragmentsByEmbedding(
  embedding: number[],
  orgId: string,
  claimText: string,
): Promise<CorpusFragment[]> {
  try {
    const index = getIndex();
    const ns = index.namespace(orgId);

    const res = await ns.query({
      vector: embedding,
      topK: MAX_CORPUS_FRAGMENTS * 2,
      includeMetadata: true,
    });

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
    console.warn(`[verify-claims] Pinecone query failed for "${claimText.slice(0, 40)}...":`, err);
    return [];
  }
}
