import { callLLMJson } from './llm-client';
import type { DocumentJudgment, FinalAnalysis, DiscardedFindings } from './types';

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
  excludeDocumentId?: string;
}): Promise<FinalAnalysis> {
  const { newDocumentName, excludeDocumentId } = args;

  const judgments = excludeDocumentId
    ? args.judgments.filter(j => {
        if (j.documentId === excludeDocumentId) {
          console.warn(`[synthesize] Judgment descartado (documentId coincide con el analizado): "${j.documentName}"`);
          return false;
        }
        return true;
      })
    : args.judgments;

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

  // Construir overlaps a partir de los juicios — F-45: por GRUPO, no por
  // documento. Un documento puede aportar dos overlaps: uno con lo que el
  // juez detectó y pudo citar (sin confirmedBy, como siempre) y otro con lo
  // que el colapso de filas idénticas confirmó estructuralmente
  // (confirmedBy==='estructura', F-44/F-45) — fusionarlos en un solo overlap
  // por documento, como antes de F-45, perdería la identidad de la entrada
  // estructural: su severidad y su porcentaje no dependen de lo que el juez
  // haya podido decir, y no deben diluirse en un join de texto. La UI ya
  // agrupa por existingDocument en el cliente (AnalysisModal.tsx), así que
  // los dos caen en el mismo desplegable sin tocar nada ahí.
  //
  // Se busca el primer evidenceInNewDoc no vacío de CADA montón para usarlo
  // como textRef (permite que la tarjeta de duplicidad sea clickable en el
  // editor) — el montón estructural nunca tiene uno (evidence/evidenceInNewDoc
  // van vacíos a propósito, ver pipeline.ts), así que su overlap sale sin
  // textRef.
  const overlaps: FinalAnalysis['overlaps'] = [];
  for (const j of judgments) {
    const judgeEntries = j.overlappingContent.filter(o => !o.confirmedBy && o.description.trim().length > 0);
    const structuralEntries = j.overlappingContent.filter(o => o.confirmedBy && o.description.trim().length > 0);

    if (judgeEntries.length > 0) {
      const firstEvidence = judgeEntries.find(o => o.evidenceInNewDoc && o.evidenceInNewDoc.trim().length > 0);
      overlaps.push({
        existingDocument: j.documentName,
        description: judgeEntries.map(o => o.description).join('. '),
        severity: (j.overlapPercent >= 60 ? 'alta' : j.overlapPercent >= 30 ? 'media' : 'baja') as 'alta' | 'media' | 'baja',
        overlapPercent: j.overlapPercent,
        textRef: firstEvidence?.evidenceInNewDoc || undefined,
      });
    }

    if (structuralEntries.length > 0) {
      // F-46: MÁXIMO entre lo que midió el juez (j.overlapPercent, el mismo
      // número que arriba) y lo que midió el colapso — no la media: son dos
      // mediciones de cosas distintas (impresión del LLM sobre lo que vio vs.
      // proporción real de filas idénticas verificadas celda a celda) y el
      // solapamiento real es, como mínimo, el mayor de los dos. Si una misma
      // tabla colapsara en más de un tramo (raro, pero posible con varias
      // consultas de retrieval), se toma la de mayor proporción.
      const structuralPercent = Math.max(...structuralEntries.map(o => o.structuralPercent ?? 0));
      const firstEvidence = structuralEntries.find(o => o.evidenceInNewDoc && o.evidenceInNewDoc.trim().length > 0);
      overlaps.push({
        existingDocument: j.documentName,
        description: structuralEntries.map(o => o.description).join('. '),
        // 'alta' de fábrica (F-46): nueve filas idénticas verificadas celda a
        // celda no es una severidad estimada por umbral, como la del juez.
        severity: 'alta',
        overlapPercent: Math.max(j.overlapPercent, structuralPercent),
        textRef: firstEvidence?.evidenceInNewDoc || undefined,
        confirmedBy: 'estructura',
      });
    }
  }

  // Construir discrepancies con las claves que el frontend espera
  const discrepancies = judgments.flatMap(j =>
    j.contradictions.map(c => ({
      topic: c.topic,
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      existingDocument: j.documentName,
      severity: c.severity,
      confirmedBy: c.confirmedBy,
    }))
  );

  // Recuento de hallazgos descartados: suma de los ya contados en judge.ts
  // (solo de los judgments que sobrevivieron al filtro de excludeDocumentId,
  // el documento no debe compararse consigo mismo) más los solapamientos sin
  // descripción, que nunca llegan a `overlaps` — a nivel de cada entrada, no
  // solo de judgment, para contar todo lo que de verdad se pierde.
  const discardedFindings: DiscardedFindings = {};
  for (const j of judgments) {
    if (!j.discarded) continue;
    for (const [reason, count] of Object.entries(j.discarded)) {
      discardedFindings[reason] = (discardedFindings[reason] ?? 0) + count;
    }
  }
  const solapamientoSinDescripcion = judgments.reduce(
    (sum, j) => sum + j.overlappingContent.filter(o => o.description.trim().length === 0).length,
    0,
  );
  if (solapamientoSinDescripcion > 0) {
    discardedFindings.solapamientoSinDescripcion =
      (discardedFindings.solapamientoSinDescripcion ?? 0) + solapamientoSinDescripcion;
  }

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
    ...(Object.keys(discardedFindings).length > 0 ? { discardedFindings } : {}),
  };
}
