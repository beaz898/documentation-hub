import { callLLMJson } from './gemini-client';
import type { DocumentJudgment, FinalAnalysis } from './types';

/**
 * Etapa 4 — Síntesis final.
 * Agrega los juicios individuales en una recomendación global con resumen para el usuario.
 */

interface SynthesisResponse {
  recommendation: 'INDEXAR' | 'REVISAR' | 'NO_INDEXAR';
  summary: string;
  newInformation: string;
}

export async function synthesizeFinalAnalysis(args: {
  newDocumentName: string;
  judgments: DocumentJudgment[];
}): Promise<FinalAnalysis> {
  const { newDocumentName, judgments } = args;

  // Caso sin candidatos: todo limpio
  if (judgments.length === 0) {
    return {
      isDuplicate: false,
      duplicateOf: null,
      duplicateConfidence: 0,
      overlaps: [],
      discrepancies: [],
      newInformation: 'Este documento aporta información completamente nueva al sistema.',
      recommendation: 'INDEXAR',
      summary: `No se encontraron documentos con contenido solapado. "${newDocumentName}" puede indexarse sin conflicto.`,
      judgments: [],
    };
  }

  // Detectar duplicado exacto
  const topJudgment = [...judgments].sort((a, b) => b.overlapPercent - a.overlapPercent)[0];
  const isDuplicate = topJudgment.verdict === 'duplicado_exacto' && topJudgment.overlapPercent >= 85;

  // Síntesis vía LLM
  const judgmentsBlock = judgments.map(j =>
    `Documento: "${j.documentName}"
  Veredicto: ${j.verdict} (${j.overlapPercent}% solapamiento)
  Contradicciones: ${j.contradictions.length > 0 ? j.contradictions.map(c => `"${c.topic}"`).join(', ') : 'ninguna'}
  Solapamientos: ${j.overlappingContent.length > 0 ? j.overlappingContent.map(o => o.description).join('; ') : 'ninguno'}`
  ).join('\n\n');

  const prompt = `Eres un asistente que resume análisis de documentación para un usuario no técnico.

DOCUMENTO NUEVO: "${newDocumentName}"

JUICIOS INDIVIDUALES YA EMITIDOS POR EL AUDITOR:
${judgmentsBlock}

Genera un resumen final. Considera:
- INDEXAR: ningún solapamiento significativo (todos "tema_similar" o "sin_relacion", sin contradicciones).
- REVISAR: solapamientos parciales, reformulaciones, o contradicciones detectadas.
- NO_INDEXAR: duplicado exacto confirmado (overlap >= 85% con un documento).

Responde EXCLUSIVAMENTE con este JSON:
{
  "recommendation": "INDEXAR" | "REVISAR" | "NO_INDEXAR",
  "summary": "<2-3 frases claras para el usuario sobre qué se encontró>",
  "newInformation": "<1-2 frases sobre qué aporta el documento nuevo>"
}`;

  let synthesis: SynthesisResponse;
  try {
    synthesis = await callLLMJson<SynthesisResponse>(prompt, { maxOutputTokens: 1024, temperature: 0.2 });
  } catch (err) {
    console.warn('[synthesize] LLM failed, using deterministic fallback:', err);
    const totalOverlaps = judgments.filter(j => j.overlapPercent >= 15).length;
    const totalContradictions = judgments.reduce((sum, j) => sum + j.contradictions.length, 0);
    const hasSignificantOverlap = judgments.some(j => j.overlapPercent >= 30);

    synthesis = {
      recommendation: isDuplicate
        ? 'NO_INDEXAR'
        : (hasSignificantOverlap || totalContradictions > 0 ? 'REVISAR' : 'INDEXAR'),
      summary: isDuplicate
        ? `Se detectó que este documento es prácticamente idéntico a "${topJudgment.documentName}" (${topJudgment.overlapPercent}% de solapamiento).`
        : totalOverlaps > 0
          ? `Se analizaron ${judgments.length} documentos relacionados. ${totalOverlaps} presentan solapamiento significativo${totalContradictions > 0 ? ` y se detectaron ${totalContradictions} contradicciones` : ''}. Revisa los detalles antes de indexar.`
          : `Se evaluaron ${judgments.length} documentos relacionados pero ninguno presenta solapamiento significativo. Puede indexarse.`,
      newInformation: judgments
        .flatMap(j => j.uniqueToNewDoc)
        .slice(0, 3)
        .join('. ') || 'Contenido del nuevo documento que no coincide con lo existente.',
    };
  }

  // Construir overlaps y discrepancies a partir de los juicios
  const overlaps = judgments
    .filter(j => j.overlapPercent >= 15 || j.overlappingContent.length > 0)
    .map(j => ({
      existingDocument: j.documentName,
      description: j.overlappingContent.length > 0
        ? j.overlappingContent.map(o => o.description).join('. ')
        : `Solapamiento ${j.verdict.replace('_', ' ')}`,
      severity: (j.overlapPercent >= 60 ? 'alta' : j.overlapPercent >= 30 ? 'media' : 'baja') as 'alta' | 'media' | 'baja',
      overlapPercent: j.overlapPercent,
    }));

  const discrepancies = judgments.flatMap(j =>
    j.contradictions.map(c => ({
      topic: c.topic,
      newDocument: c.newDocSays,
      existingDocument: c.existingDocSays,
      description: `En el documento nuevo: "${c.newDocSays}". En "${j.documentName}": "${c.existingDocSays}".`,
    }))
  );

  return {
    isDuplicate,
    duplicateOf: isDuplicate ? topJudgment.documentName : null,
    duplicateConfidence: isDuplicate ? topJudgment.overlapPercent : 0,
    overlaps,
    discrepancies,
    newInformation: synthesis.newInformation,
    recommendation: synthesis.recommendation,
    summary: synthesis.summary,
    judgments,
  };
}
