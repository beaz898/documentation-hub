import { callLLMJson } from './llm-client';

/**
 * Fase 4a — Extracción de afirmaciones atómicas.
 *
 * El LLM lee el documento nuevo y extrae cada afirmación factual concreta:
 * cifras, plazos, políticas, definiciones, precios, porcentajes, nombres,
 * fechas, responsables, procedimientos, etc.
 *
 * Cada afirmación es una frase corta, autónoma y verificable. No son
 * opiniones, ni frases vagas, ni títulos de sección.
 */

/** Una afirmación factual extraída del documento. */
export interface AtomicClaim {
  /** La afirmación en forma clara y autónoma. */
  claim: string;
  /** Categoría temática para agrupar (ej: "plazos", "precios", "política RRHH"). */
  category: string;
  /** Cita literal del documento nuevo de donde se extrajo. */
  sourceQuote: string;
}

interface ExtractClaimsResponse {
  claims: Array<{
    claim: string;
    category: string;
    sourceQuote: string;
  }>;
}

/**
 * Extrae afirmaciones atómicas del texto del documento.
 * Para documentos largos se procesa en segmentos para no superar
 * los límites de contexto y mantener la calidad de extracción.
 */
export async function extractAtomicClaims(documentText: string, documentName: string): Promise<AtomicClaim[]> {
  const t0 = Date.now();

  // Segmentar el documento si es muy largo (>8000 chars).
  // Cada segmento se procesa en una llamada independiente.
  const segments = splitIntoSegments(documentText, 8000);
  const allClaims: AtomicClaim[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segmentClaims = await extractClaimsFromSegment(segments[i], documentName, i + 1, segments.length);
    allClaims.push(...segmentClaims);
  }

  // Deduplicar afirmaciones idénticas o casi idénticas
  const unique = deduplicateClaims(allClaims);

  console.log(`[extract-claims] "${documentName}": ${unique.length} afirmaciones extraídas de ${segments.length} segmento(s) (${Date.now() - t0}ms)`);
  return unique;
}

// ============================================================
// Internos
// ============================================================

async function extractClaimsFromSegment(
  segmentText: string,
  documentName: string,
  segmentNumber: number,
  totalSegments: number,
): Promise<AtomicClaim[]> {
  const segmentLabel = totalSegments > 1 ? ` (segmento ${segmentNumber}/${totalSegments})` : '';

  const prompt = `Eres un auditor de documentación. Tu tarea es extraer TODAS las afirmaciones factuales concretas de este texto.

DOCUMENTO: "${documentName}"${segmentLabel}
"""
${segmentText}
"""

INSTRUCCIONES:
1. Extrae cada dato concreto y verificable: cifras, plazos, políticas, definiciones, precios, porcentajes, nombres, fechas, responsables, procedimientos, cantidades, horarios, requisitos, obligaciones.
2. Cada afirmación debe ser una frase CORTA y AUTÓNOMA (comprensible sin contexto adicional).
3. NO extraigas opiniones, frases vagas, títulos de sección ni enunciados genéricos sin dato concreto.
4. Incluye TODAS las que encuentres, sin importar cuántas sean. No resumas ni agrupes.
5. El campo sourceQuote debe ser una COPIA LITERAL de un fragmento del texto original que contiene el dato.

Responde EXCLUSIVAMENTE con este JSON:
{
  "claims": [
    {
      "claim": "<afirmación autónoma y concisa>",
      "category": "<categoría temática corta>",
      "sourceQuote": "<cita literal del texto>"
    }
  ]
}

Si no hay afirmaciones factuales concretas, devuelve {"claims": []}.`;

  try {
    const response = await callLLMJson<ExtractClaimsResponse>(prompt, {
      maxOutputTokens: 8192,
      temperature: 0.1,
    });

    return (response.claims || [])
      .filter(c => c.claim && c.claim.trim().length > 0)
      .map(c => ({
        claim: c.claim.trim(),
        category: c.category?.trim() || 'general',
        sourceQuote: c.sourceQuote?.trim() || '',
      }));
  } catch (err) {
    console.warn(`[extract-claims] Falló extracción del segmento ${segmentNumber}:`, err);
    return [];
  }
}

/** Divide el texto en segmentos de ~maxChars respetando límites de párrafo. */
function splitIntoSegments(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const segments: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      segments.push(remaining);
      break;
    }

    // Buscar un salto de párrafo cerca del límite para no cortar a mitad de frase
    let cutPoint = remaining.lastIndexOf('\n\n', maxChars);
    if (cutPoint < maxChars * 0.5) {
      // No hay buen punto de corte, buscar salto de línea simple
      cutPoint = remaining.lastIndexOf('\n', maxChars);
    }
    if (cutPoint < maxChars * 0.5) {
      // Último recurso: cortar en el límite
      cutPoint = maxChars;
    }

    segments.push(remaining.slice(0, cutPoint));
    remaining = remaining.slice(cutPoint).trimStart();
  }

  return segments;
}

/** Elimina afirmaciones duplicadas (misma claim normalizada). */
function deduplicateClaims(claims: AtomicClaim[]): AtomicClaim[] {
  const seen = new Set<string>();
  const out: AtomicClaim[] = [];
  for (const c of claims) {
    const key = c.claim.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
