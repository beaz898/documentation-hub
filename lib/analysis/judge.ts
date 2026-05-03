import { callLLMJson } from './llm-client';
import type { RerankedCandidate, DocumentJudgment, PipelineOptions } from './types';

/**
 * Etapa 3 — Juicio individual por documento.
 *
 * Ambos modos (rápido y exhaustivo) reciben el documento nuevo COMPLETO
 * para no perder solapamientos ni contradicciones en la parte final.
 *
 * Modo rápido: secuencial con pausa larga (1200ms).
 * Modo exhaustivo: secuencial con pausa corta (500ms).
 *
 * Ambos son secuenciales para evitar ráfagas de llamadas LLM
 * que provocan 429 de Anthropic.
 *
 * Post-procesamiento: las citas del LLM (newDocSays, evidenceInNewDoc)
 * se verifican contra el texto real del documento. Si no coinciden
 * exactamente, se busca la frase más parecida con match fuzzy y se
 * sustituye para garantizar que la navegación y la fusión de problemas
 * funcionen correctamente.
 */

/** Pausa entre juicios secuenciales en modo rápido. */
const SEQUENTIAL_DELAY_QUICK_MS = 1200;

/** Pausa entre juicios secuenciales en modo exhaustivo. */
const SEQUENTIAL_DELAY_EXHAUSTIVE_MS = 500;

interface JudgeResponse {
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
    evidenceInNewDoc: string;
  }>;
  uniqueToNewDoc: string[];
}

// ============================================================
// Post-procesamiento: corregir citas del LLM contra el texto real
// ============================================================

/**
 * Normaliza texto para comparación: minúsculas, espacios colapsados,
 * puntuación removida.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"""''«»()[\]{}\-—–…]/g, '')
    .trim();
}

/**
 * Busca en `haystack` el substring que mejor coincide con `needle`.
 * Usa una estrategia de anclas: busca los primeros y últimos N caracteres
 * normalizados de `needle` dentro de `haystack` normalizado, y devuelve
 * el texto original correspondiente.
 *
 * Retorna el substring original del haystack que mejor coincide,
 * o null si no encuentra nada razonable.
 */
function findBestMatch(haystack: string, needle: string): string | null {
  if (!needle || needle.length < 10) return null;

  // 1. Búsqueda exacta
  const exactIdx = haystack.indexOf(needle);
  if (exactIdx !== -1) return needle;

  // 2. Búsqueda normalizada con mapeo de posiciones
  const normNeedle = normalize(needle);
  if (normNeedle.length < 8) return null;

  // Construir texto normalizado con mapeo a posiciones originales
  const mapping: number[] = [];
  let normHaystack = '';
  for (let i = 0; i < haystack.length; i++) {
    const ch = haystack[i];
    const isSpace = /\s/.test(ch);
    const isPunct = /[.,;:!?"""''«»()[\]{}\-—–…]/.test(ch);

    if (isPunct) continue;
    if (isSpace) {
      if (normHaystack.length > 0 && !normHaystack.endsWith(' ')) {
        normHaystack += ' ';
        mapping.push(i);
      }
    } else {
      normHaystack += ch.toLowerCase();
      mapping.push(i);
    }
  }

  // Buscar needle normalizado dentro de haystack normalizado
  const normIdx = normHaystack.indexOf(normNeedle);
  if (normIdx !== -1 && mapping[normIdx] !== undefined) {
    const startOrig = mapping[normIdx];
    const endNormIdx = normIdx + normNeedle.length - 1;
    const endOrig = (mapping[endNormIdx] ?? startOrig) + 1;
    return haystack.slice(startOrig, endOrig);
  }

  // 3. Búsqueda por anclas: primeros 20 chars + últimos 20 chars
  if (normNeedle.length >= 25) {
    const headLen = Math.min(20, Math.floor(normNeedle.length * 0.4));
    const tailLen = Math.min(20, Math.floor(normNeedle.length * 0.4));
    const head = normNeedle.slice(0, headLen);
    const tail = normNeedle.slice(-tailLen);

    const headIdx = normHaystack.indexOf(head);
    if (headIdx !== -1) {
      const tailIdx = normHaystack.indexOf(tail, headIdx + head.length);
      if (tailIdx !== -1) {
        const startOrig = mapping[headIdx];
        const endOrig = (mapping[tailIdx + tail.length - 1] ?? startOrig) + 1;
        // Sanity check: el match no debería ser más de 3x el needle original
        if (endOrig - startOrig < needle.length * 3) {
          return haystack.slice(startOrig, endOrig);
        }
      }
    }
  }

  return null;
}

/**
 * Corrige las citas del LLM para que coincidan con el texto real del documento.
 * Si una cita no se encuentra exactamente, busca la frase más parecida.
 * Si no encuentra nada razonable, deja la cita original del LLM.
 */
function fixQuotesInJudgment(
  judgment: DocumentJudgment,
  newDocumentText: string,
): DocumentJudgment {
  // Corregir newDocSays en contradicciones
  const fixedContradictions = judgment.contradictions.map(c => {
    if (!c.newDocSays) return c;
    const match = findBestMatch(newDocumentText, c.newDocSays);
    return match ? { ...c, newDocSays: match } : c;
  });

  // Corregir evidenceInNewDoc en solapamientos
  const fixedOverlaps = judgment.overlappingContent.map(o => {
    if (!o.evidenceInNewDoc) return o;
    const match = findBestMatch(newDocumentText, o.evidenceInNewDoc);
    return match ? { ...o, evidenceInNewDoc: match } : o;
  });

  return {
    ...judgment,
    contradictions: fixedContradictions,
    overlappingContent: fixedOverlaps,
  };
}

// ============================================================
// Juicio individual
// ============================================================

async function judgeSingleDocument(args: {
  newDocumentName: string;
  newDocumentText: string;
  candidate: RerankedCandidate;
}): Promise<DocumentJudgment> {
  const { newDocumentName, newDocumentText, candidate } = args;

  const existingFragsBlock = candidate.fragments
    .map((f, i) => `[Fragmento ${i + 1} de "${candidate.documentName}"]\n${f.text}`)
    .join('\n\n');

  const prompt = `Eres un auditor de documentación. Tu tarea es comparar CONTENIDO CONCRETO entre dos documentos y emitir un juicio preciso, no una impresión general.

DOCUMENTO NUEVO: "${newDocumentName}"
"""
${newDocumentText}
"""

DOCUMENTO EXISTENTE: "${candidate.documentName}" (fuente: ${candidate.source})
"""
${existingFragsBlock}
"""

INSTRUCCIONES CRÍTICAS:
1. "Solapamiento" significa contenido que se repite, aunque esté redactado con palabras distintas. NO significa compartir tema general.
2. "Contradicción" significa que ambos documentos afirman algo distinto sobre el mismo dato concreto (cifras, plazos, políticas, definiciones).
3. El porcentaje de solapamiento debe reflejar CUÁNTO del documento nuevo ya está en el existente, no la similitud temática.
4. Si los documentos hablan del mismo tema pero con contenido distinto, veredicto = "tema_similar", overlapPercent < 20.
5. Solo marca "duplicado_exacto" si el contenido es prácticamente idéntico (>85% del nuevo ya está en el existente).
6. Busca contradicciones en TODO el documento nuevo, no solo en las primeras líneas. Revisa cada afirmación concreta.

REGLAS DE FORMATO:
- En newDocSays y evidenceInNewDoc: copia LITERALMENTE un fragmento del DOCUMENTO NUEVO. Debe ser un substring exacto, carácter por carácter.
- En existingDocSays y evidence: copia literalmente un fragmento del DOCUMENTO EXISTENTE.
- Máximo 1 frase por cita. NO copies párrafos enteros.
- Máximo 10 contradicciones y 5 solapamientos. Si hay más, incluye los más importantes.

Responde con este JSON (sin bloques de código, sin texto adicional):
{
  "overlapPercent": 25,
  "verdict": "tema_similar",
  "contradictions": [
    { "topic": "tema", "newDocSays": "cita literal del nuevo", "existingDocSays": "cita literal del existente" }
  ],
  "overlappingContent": [
    { "description": "qué se solapa", "evidence": "cita literal del existente", "evidenceInNewDoc": "cita literal del nuevo" }
  ],
  "uniqueToNewDoc": ["aspecto 1", "aspecto 2"]
}`;

  try {
    const response = await callLLMJson<JudgeResponse>(prompt, { maxOutputTokens: 4096, temperature: 0.1 });
    const rawJudgment: DocumentJudgment = {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: Math.max(0, Math.min(100, Math.round(response.overlapPercent || 0))),
      verdict: response.verdict || 'sin_relacion',
      contradictions: response.contradictions || [],
      overlappingContent: (response.overlappingContent || []).map(o => ({
        description: o.description || '',
        evidence: o.evidence || '',
        evidenceInNewDoc: o.evidenceInNewDoc || '',
      })),
      uniqueToNewDoc: response.uniqueToNewDoc || [],
    };

    // Post-procesamiento: corregir citas para que coincidan con el texto real
    return fixQuotesInJudgment(rawJudgment, newDocumentText);
  } catch (err) {
    console.warn(`[judge] Failed for "${candidate.documentName}":`, err);
    return {
      documentId: candidate.documentId,
      documentName: candidate.documentName,
      source: candidate.source,
      overlapPercent: 0,
      verdict: 'sin_relacion',
      contradictions: [],
      overlappingContent: [{ description: 'No se pudo emitir juicio (error del LLM)', evidence: '', evidenceInNewDoc: '' }],
      uniqueToNewDoc: [],
    };
  }
}

/**
 * Lanza juicios para todos los candidatos.
 *
 * Ambos modos son secuenciales para evitar saturar la API.
 * Modo rápido: pausa de 1200ms.
 * Modo exhaustivo: pausa de 500ms.
 *
 * El documento nuevo se envía COMPLETO en ambos modos para no
 * perder solapamientos ni contradicciones en ninguna parte del texto.
 */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
  options?: PipelineOptions;
}): Promise<DocumentJudgment[]> {
  if (args.candidates.length === 0) return [];

  const isExhaustive = args.options?.exhaustive === true;
  const delayMs = isExhaustive ? SEQUENTIAL_DELAY_EXHAUSTIVE_MS : SEQUENTIAL_DELAY_QUICK_MS;

  // Documento nuevo COMPLETO en ambos modos
  const newDocumentText = args.newDocumentSample;

  const results: DocumentJudgment[] = [];
  for (let i = 0; i < args.candidates.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delayMs));
    const judgment = await judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentText,
      candidate: args.candidates[i],
    });
    results.push(judgment);
  }
  return results;
}
