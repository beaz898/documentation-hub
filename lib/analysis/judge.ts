import { callLLMJson } from './llm-client';
import type { RerankedCandidate, DocumentJudgment, PipelineOptions } from './types';

/**
 * Etapa 3 — Juicio individual por documento.
 *
 * Modo rápido: secuencial con pausa (1200ms), documento truncado a 6000 chars.
 * Modo exhaustivo: 2 en paralelo con pausa entre rondas (500ms),
 *   documento completo.
 *
 * Post-procesamiento: las citas del LLM se verifican contra el texto real
 * del documento y se corrigen con match fuzzy si no coinciden exactamente.
 */

/** Límite de texto del doc nuevo en modo rápido (ahorra tokens). */
const NEW_DOC_LIMIT_QUICK = 6000;

/** Pausa entre juicios secuenciales en modo rápido. */
const SEQUENTIAL_DELAY_QUICK_MS = 1200;

/** Concurrencia en modo exhaustivo. */
const EXHAUSTIVE_CONCURRENCY = 5;

/** Pausa entre rondas en modo exhaustivo. */
const EXHAUSTIVE_ROUND_DELAY_MS = 500;

interface JudgeResponse {
  overlapPercent: number;
  verdict: 'duplicado_exacto' | 'reformulacion' | 'solapamiento_parcial' | 'tema_similar' | 'sin_relacion';
  contradictions: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    severity: 'contradiction' | 'minor_inconsistency';
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

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"""''«»()[\]{}\-—–…]/g, '')
    .trim();
}

function findBestMatch(haystack: string, needle: string): string | null {
  if (!needle || needle.length < 10) return null;

  const exactIdx = haystack.indexOf(needle);
  if (exactIdx !== -1) return needle;

  const normNeedle = normalize(needle);
  if (normNeedle.length < 8) return null;

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

  const normIdx = normHaystack.indexOf(normNeedle);
  if (normIdx !== -1 && mapping[normIdx] !== undefined) {
    const startOrig = mapping[normIdx];
    const endNormIdx = normIdx + normNeedle.length - 1;
    const endOrig = (mapping[endNormIdx] ?? startOrig) + 1;
    return haystack.slice(startOrig, endOrig);
  }

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
        if (endOrig - startOrig < needle.length * 3) {
          return haystack.slice(startOrig, endOrig);
        }
      }
    }
  }

  return null;
}

function fixQuotesInJudgment(
  judgment: DocumentJudgment,
  newDocumentText: string,
): DocumentJudgment {
  const fixedContradictions = judgment.contradictions.map(c => {
    if (!c.newDocSays) return c;

    const matchNew = findBestMatch(newDocumentText, c.newDocSays);
    if (matchNew) {
      return { ...c, newDocSays: matchNew };
    }

    if (c.existingDocSays) {
      const matchSwapped = findBestMatch(newDocumentText, c.existingDocSays);
      if (matchSwapped) {
        return {
          ...c,
          newDocSays: matchSwapped,
          existingDocSays: c.newDocSays,
        };
      }
    }

    return c;
  });

  const fixedOverlaps = judgment.overlappingContent.map(o => {
    if (!o.evidenceInNewDoc) return o;

    const matchNew = findBestMatch(newDocumentText, o.evidenceInNewDoc);
    if (matchNew) {
      return { ...o, evidenceInNewDoc: matchNew };
    }

    if (o.evidence) {
      const matchSwapped = findBestMatch(newDocumentText, o.evidence);
      if (matchSwapped) {
        return {
          ...o,
          evidenceInNewDoc: matchSwapped,
          evidence: o.evidenceInNewDoc,
        };
      }
    }

    return o;
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
2. "Contradicción" significa que ambos documentos afirman cosas INCOMPATIBLES sobre el mismo dato concreto. Es decir: es IMPOSIBLE que ambas afirmaciones sean verdaderas a la vez.
3. "Inconsistencia menor" significa que ambos documentos hablan del mismo tema con enfoques, matices o énfasis diferentes, pero no son estrictamente incompatibles.
4. El porcentaje de solapamiento debe reflejar CUÁNTO del documento nuevo ya está en el existente, no la similitud temática.
5. Si los documentos hablan del mismo tema pero con contenido distinto, veredicto = "tema_similar", overlapPercent < 20.
6. Solo marca "duplicado_exacto" si el contenido es prácticamente idéntico (>85% del nuevo ya está en el existente).
7. Busca contradicciones en TODO el documento nuevo, no solo en las primeras líneas.

EJEMPLOS DE LO QUE SÍ ES CONTRADICCIÓN:
- "El plazo de entrega es 30 días" vs "El plazo de entrega es 15 días"
- "El presupuesto aprobado es 100.000€" vs "El presupuesto aprobado es 200.000€"
- "La política prohíbe el teletrabajo" vs "Se permite el teletrabajo 3 días por semana"
- "El responsable del proyecto es Ana García" vs "El responsable del proyecto es Luis Pérez"

EJEMPLOS DE LO QUE NO ES CONTRADICCIÓN (usar inconsistencia menor si aplica):
- "La transformación digital es un proceso tecnológico" vs "La tecnología es solo el habilitador" → perspectivas diferentes, ambas pueden ser verdaderas
- "Es importante formar al equipo" vs "Es fundamental formar al equipo" → diferencia de énfasis, no de dato
- "El proyecto tiene 3 fases" vs "El proyecto tiene 3 fases principales y 2 secundarias" → la segunda amplía la primera, no la contradice
- "Se recomienda usar Python" vs "Se recomienda usar TypeScript" → pueden ser recomendaciones para contextos diferentes
- Afirmaciones genéricas vs específicas que son compatibles entre sí

REGLA DE ORO: Si puedes imaginar un contexto razonable en el que ambas afirmaciones sean verdaderas simultáneamente, NO es contradicción. Puede ser inconsistencia menor.

REGLAS DE FORMATO:
- En newDocSays y evidenceInNewDoc: copia LITERALMENTE un fragmento del DOCUMENTO NUEVO.
- En existingDocSays y evidence: copia literalmente un fragmento del DOCUMENTO EXISTENTE.
- Máximo 1 frase por cita. NO copies párrafos enteros.
- Máximo 10 contradicciones, 5 inconsistencias menores y 5 solapamientos.
- El campo "severity" es obligatorio en cada contradicción: "contradiction" si son incompatibles, "minor_inconsistency" si son diferencias de enfoque o matiz.

Responde con este JSON (sin bloques de código, sin texto adicional):
{
  "overlapPercent": 25,
  "verdict": "tema_similar",
  "contradictions": [
    { "topic": "tema", "newDocSays": "cita literal del nuevo", "existingDocSays": "cita literal del existente", "severity": "contradiction" },
    { "topic": "tema", "newDocSays": "cita literal del nuevo", "existingDocSays": "cita literal del existente", "severity": "minor_inconsistency" }
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
 * Modo rápido: secuencial con pausa de 1200ms, documento truncado.
 * Modo exhaustivo: 2 en paralelo con pausa de 500ms entre rondas,
 *   documento completo.
 */
export async function judgeAllDocuments(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: RerankedCandidate[];
  options?: PipelineOptions;
}): Promise<DocumentJudgment[]> {
  if (args.candidates.length === 0) return [];

  const isExhaustive = args.options?.exhaustive === true;

  // Modo rápido: truncar para ahorrar tokens
  // Modo exhaustivo: documento completo
  const newDocumentText = isExhaustive
    ? args.newDocumentSample
    : args.newDocumentSample.slice(0, NEW_DOC_LIMIT_QUICK);

  if (isExhaustive) {
    // Paralelo controlado: 2 a la vez con pausa entre rondas
    const results: DocumentJudgment[] = new Array(args.candidates.length);

    for (let roundStart = 0; roundStart < args.candidates.length; roundStart += EXHAUSTIVE_CONCURRENCY) {
      if (roundStart > 0) {
        await new Promise(r => setTimeout(r, EXHAUSTIVE_ROUND_DELAY_MS));
      }

      const roundEnd = Math.min(roundStart + EXHAUSTIVE_CONCURRENCY, args.candidates.length);
      const roundPromises = [];

      for (let i = roundStart; i < roundEnd; i++) {
        roundPromises.push(
          judgeSingleDocument({
            newDocumentName: args.newDocumentName,
            newDocumentText,
            candidate: args.candidates[i],
          }).then(judgment => { results[i] = judgment; })
        );
      }

      await Promise.all(roundPromises);
    }

    return results;
  }

  // Secuencial con pausa (modo rápido)
  const results: DocumentJudgment[] = [];
  for (let i = 0; i < args.candidates.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, SEQUENTIAL_DELAY_QUICK_MS));
    const judgment = await judgeSingleDocument({
      newDocumentName: args.newDocumentName,
      newDocumentText,
      candidate: args.candidates[i],
    });
    results.push(judgment);
  }
  return results;
}
