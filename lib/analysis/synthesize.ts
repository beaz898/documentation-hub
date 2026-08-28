import { recordStageFailure, stageFailureContext } from './stage-failures';
import { callLLMJson } from './llm-client';
import type { DocumentJudgment, FinalAnalysis, DiscardedFindings, StageFailure } from './types';

/**
 * F-71: marca un análisis como INCOMPLETO cuando alguna etapa cayó a su
 * fallback. Devuelve el mismo objeto si no hubo caídas.
 *
 * RECOMENDACIÓN → 'REVISAR', y no hizo falta un valor nuevo: el CHECK de
 * analysis_results.recommendation admite INDEXAR / REVISAR / NO_INDEXAR, y
 * 'REVISAR' significa exactamente lo que aquí ocurre — que hace falta una
 * persona antes de dar el documento por bueno. 'INDEXAR' está vetado por
 * definición: solo se emite por AUSENCIA de hallazgos, y esa ausencia no está
 * medida cuando una etapa no llegó a ejecutarse. 'NO_INDEXAR' afirmaría un
 * duplicado que tampoco se ha comprobado.
 *
 * Se exporta porque hay que aplicarla DOS veces en el modo exhaustivo: aquí,
 * al sintetizar, y otra vez al final del pipeline exhaustivo — el
 * double-check y la rama atómica corren DESPUÉS de synthesize, así que sus
 * caídas no existen todavía cuando esta función se llama la primera vez. Es
 * idempotente: recalcula desde la lista completa, no acumula.
 */
export function markIncompleteAnalysis(
  final: FinalAnalysis,
  failures: StageFailure[],
): FinalAnalysis {
  if (failures.length === 0) return final;

  const stages = [...new Set(failures.map(f => f.stage))].join(', ');
  const plural = failures.length === 1 ? 'etapa' : 'etapas';

  return {
    ...final,
    recommendation: 'REVISAR',
    // En PASADO: este resumen se persiste en el jsonb y la bandeja lo relee
    // días después. "No se han descontado créditos" se leería como si el
    // reembolso estuviera ocurriendo ahora.
    summary:
      `El análisis NO llegó a completarse: ${failures.length} ${plural} del proceso fallaron ` +
      `(${stages}). Lo que no aparece aquí puede ser que no exista o que no se llegara a ` +
      `comprobar, así que este resultado no debe leerse como una revisión completa. ` +
      `No costó créditos: se devolvieron íntegros.`,
    stageFailures: failures,
  };
}

/**
 * PRIMER ESLABÓN DEL CAMINO DE UNA DISCREPANCIA (F-86 paso 0), con nombre
 * para poder probarlo.
 *
 * POR QUÉ SE EXTRAE. Esta es la LISTA CERRADA original: el sitio donde un
 * `DocumentJudgment` se convierte en la discrepancia que verá el cliente, y
 * donde un campo que no se nombre muere sin ruido. Ya mató a `confidence`
 * (antes de 3dd8670c) y por poco a los de F-69 y F-70. Vivía dentro de
 * `synthesizeFinalAnalysis`, que llama al LLM, así que era IMPOSIBLE de probar
 * bajo el alcance de vitest (vitest.config.mts prohíbe Anthropic). Fuera, es
 * una función pura con entrada y salida conocidas.
 *
 * MISMA TÉCNICA QUE `particionDoubleCheck` (pipeline.ts, F-86 paso 1) y por la
 * misma razón: la corrección estaba viva por CONSTRUCCIÓN y sin un caso que la
 * vigilara. No cambia comportamiento — es el mismo `flatMap` movido de sitio.
 *
 * EL ID SALE DE `j`, NO DE `c`. La contradicción (`c`) no sabe de qué documento
 * viene; lo sabe el juicio (`j`) que la contiene. Nombre e id salen de la misma
 * variable y en líneas contiguas: es la regla que huella-hallazgo.ts aprendió
 * a golpes —todo lo que pertenece a un documento viaja con su id— aplicada
 * aquí.
 */
export function construirDiscrepancias(judgments: DocumentJudgment[]): FinalAnalysis['discrepancies'] {
  return judgments.flatMap(j =>
    j.contradictions.map(c => ({
      topic: c.topic,
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      existingDocument: j.documentName,
      // F-86 paso 0: hermano del de arriba, de la misma variable.
      existingDocumentId: j.documentId,
      severity: c.severity,
      confirmedBy: c.confirmedBy,
      // F-69: lista CERRADA — un campo que no se nombre aquí muere en este
      // punto, pasen los dos modos por él. Ver `confidence` antes de 3dd8670c.
      columns: c.columns,
      // F-70: los valores enfrentados y las dos filas, propagados tal cual.
      comparedValues: c.comparedValues,
      newDocRow: c.newDocRow,
      existingDocRow: c.existingDocRow,
    }))
  );
}

/**
 * Etapa 4 — Síntesis final.
 * Agrega los juicios individuales en una recomendación global con resumen para el usuario.
 */

interface SynthesisResponse {
  recommendation: 'INDEXAR' | 'REVISAR' | 'NO_INDEXAR';
  summary: string;
  newInformation: string;
}

/**
 * SEGUNDO Y TERCER ESLABÓN DEL JUEZ (F-86 paso 0), con nombre para poder
 * probarlos.
 *
 * POR QUÉ SE EXTRAE, exactamente igual que `construirDiscrepancias`: los dos
 * `overlaps.push` son LISTAS CERRADAS —el sitio donde un juicio se convierte
 * en el solapamiento que verá el cliente— y vivían dentro de
 * `synthesizeFinalAnalysis`, que llama al LLM, así que ninguna batería podía
 * llegar a ellas bajo el alcance de vitest. Este bucle no depende del LLM: solo
 * de `judgments`. Fuera, es una función pura, y las dos listas cerradas del
 * fichero quedan vigiladas por la misma batería.
 *
 * NO CAMBIA COMPORTAMIENTO: es el mismo bucle, con el mismo comentario, movido
 * de sitio.
 */
export function construirOverlaps(judgments: DocumentJudgment[]): FinalAnalysis['overlaps'] {
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
        // F-86 paso 0: el id sale de la MISMA variable que el nombre. Los dos
        // juntos y en la misma línea, para que separarlos requiera un acto
        // deliberado y no un descuido.
        existingDocumentId: j.documentId,
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
        existingDocumentId: j.documentId,
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
  return overlaps;
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
    // F-71: también aquí. "No se encontraron documentos solapados" es una
    // afirmación sobre el corpus, y si una etapa cayó no está comprobada.
    return markIncompleteAnalysis({
      isDuplicate: false,
      duplicateOf: null,
      duplicateConfidence: 0,
      overlaps: [],
      discrepancies: [],
      newInformation: 'Este documento aporta información completamente nueva al sistema.',
      recommendation: 'INDEXAR',
      summary: `No se encontraron documentos con contenido solapado. "${newDocumentName}" puede indexarse sin conflicto.`,
      judgments: [],
    }, stageFailureContext.getStore() ?? []);
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
    recordStageFailure('synthesize', err);
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

  const overlaps = construirOverlaps(judgments);

  // Construir discrepancies con las claves que el frontend espera
  const discrepancies = construirDiscrepancias(judgments);

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

  return markIncompleteAnalysis({
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
  }, stageFailureContext.getStore() ?? []);
}
