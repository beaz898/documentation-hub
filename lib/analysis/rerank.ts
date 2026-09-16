import { recordStageFailure } from './stage-failures';
import { callLLMJson } from './llm-client';
import { ordenarParaCortar, normalizarConfianza, contarSinConfianza, rangoDeConfianza } from './orden-del-rerank';
import { resolverSeleccion, repartoConModelo, repartoSinModelo, type RepartoDelRerank } from './reparto-del-rerank';
import type { CandidateDocument, RerankedCandidate, PipelineOptions } from './types';

/**
 * Etapa 2 — Rerank con LLM.
 * Recibe candidatos brutos de Pinecone y el LLM decide cuáles merece analizar.
 * Filtra ruido temático (docs del mismo dominio que no se solapan realmente).
 *
 * Modo rápido: máximo 6 seleccionados.
 * Modo exhaustivo: máximo 10 seleccionados — suficiente para cubrir todos los
 *   solapamientos y contradicciones reales. Un documento nuevo raramente tiene
 *   relación significativa con más de 10 documentos del corpus.
 *   Si hay más, se detectarán en reanálisis sucesivos.
 */

interface RerankResponse {
  selected: Array<{
    documentId: string;
    confidence: 'alta' | 'media' | 'baja';
    reason: string;
  }>;
}

/** Límite de seleccionados en modo rápido. */
const MAX_SELECTED_QUICK = 6;

/** Límite de seleccionados en modo exhaustivo. */
const MAX_SELECTED_EXHAUSTIVE = 25;

export async function rerankCandidates(args: {
  newDocumentName: string;
  newDocumentSample: string;
  candidates: CandidateDocument[];
  options?: PipelineOptions;
}): Promise<{ seleccionados: RerankedCandidate[]; sinConfianza: number; reparto: RepartoDelRerank }> {
  const { newDocumentName, newDocumentSample, candidates, options } = args;
  const isExhaustive = options?.exhaustive === true;
  const maxSelected = isExhaustive ? MAX_SELECTED_EXHAUSTIVE : MAX_SELECTED_QUICK;

  if (candidates.length === 0) {
    return {
      seleccionados: [],
      sinConfianza: 0,
      // Sin candidatos no hay nada que repartir. El pipeline sale antes de
      // escribir estos contadores (salida temprana 1).
      reparto: repartoConModelo({ recuperados: 0, elegidosPorElModelo: 0, idsNoReconocidos: 0, repetidos: 0, maxSelected }),
    };
  }

  const candidatesBlock = candidates.map((c, i) => {
    const fragsText = c.fragments.map(f => `  · "${f.text.slice(0, 300).replace(/\s+/g, ' ')}"`).join('\n');
    return `[${i + 1}] Documento: "${c.documentName}" (fuente: ${c.source})\nFragmentos similares encontrados:\n${fragsText}`;
  }).join('\n\n');

  // Instrucción de límite
  const limitInstruction = isExhaustive
    ? `- Selecciona los que merezcan análisis, hasta un máximo de ${MAX_SELECTED_EXHAUSTIVE}. Prioriza los que tengan mayor probabilidad de solapamiento o contradicción. Es preferible incluir un candidato dudoso que perder una posible contradicción.`
    : `- Máximo ${MAX_SELECTED_QUICK} seleccionados. Si ninguno merece análisis, devuelve selected: [].`;

  // Criterio de filtrado: exhaustivo es más permisivo.
  const filterCriteria = isExhaustive
    ? '- Un candidato merece análisis si hay CUALQUIER probabilidad de que contenga contenido solapado, duplicado o contradictorio con el nuevo. En caso de duda, INCLUIR.'
    : '- Un candidato merece análisis profundo SOLO si hay probabilidad real de que contenga contenido solapado, duplicado o contradictorio con el nuevo.\n- Sé estricto. Es preferible descartar un candidato dudoso que inflar la lista con ruido.';

  const prompt = `Eres un auditor de documentación corporativa. Tu tarea es decidir cuáles de estos documentos candidatos merecen un análisis profundo contra un documento nuevo.

DOCUMENTO NUEVO: "${newDocumentName}"
Muestra del documento nuevo:
"""
${newDocumentSample.slice(0, 3000)}
"""

DOCUMENTOS CANDIDATOS (recuperados por similitud de embeddings):
${candidatesBlock}

INSTRUCCIONES:
${filterCriteria}
- Compartir un tema general (ambos hablan de "RRHH", "técnica", "ventas") NO es suficiente. Debe haber indicios de contenido concreto coincidente.
${limitInstruction}

Responde EXCLUSIVAMENTE con este JSON, sin texto adicional:
{
  "selected": [
    {
      "documentId": "<id exacto del documento>",
      "confidence": "alta" | "media" | "baja",
      "reason": "<una frase breve justificando por qué merece análisis profundo>"
    }
  ]
}

IMPORTANTE: el campo documentId debe ser el documentId real que te paso a continuación, no el nombre. Aquí va el mapeo número → documentId:
${candidates.map((c, i) => `[${i + 1}] → ${c.documentId}`).join('\n')}`;

  try {
    const response = await callLLMJson<RerankResponse>(prompt, { maxOutputTokens: 2048, temperature: 0.1 });

    // ⚠️ LA RESOLUCIÓN ES UNA SOLA, y la selección y el reparto salen de ella
    // (B.253). Hasta el 16/09/2026 aquí había un `find` por entrada SIN quitar
    // repetidos: si el modelo devolvía [A, A, B], A entraba dos veces, ocupaba
    // DOS plazas del tope —dejando fuera a otro documento— y el juez lo
    // comparaba dos veces, cobrándolo dos veces. Y el reparto, que resolvía los
    // ids por su cuenta, contaba dos elegidos donde el juez recibía tres.
    // Entre dos entradas del mismo documento gana la de más confianza, con la
    // MISMA escala con la que luego se corta (B.255).
    const resolucion = resolverSeleccion(
      candidates,
      response.selected || [],
      entrada => rangoDeConfianza(normalizarConfianza(entrada.confidence)),
    );
    const selected: RerankedCandidate[] = resolucion.resueltos.map(({ candidato, entrada }) => ({
      documentId: candidato.documentId,
      documentName: candidato.documentName,
      source: candidato.source,
      fragments: candidato.fragments,
      rerankReason: entrada.reason || '',
      // ⚠️ YA NO ES `|| 'media'`. Ver orden-del-rerank.ts: convertir la
      // ausencia en el nivel intermedio era inventarse la valoración que
      // falta, y encima con un valor que ya significaba otra cosa.
      rerankConfidence: normalizarConfianza(entrada.confidence),
    }));

    // ⚠️ SE ORDENA ANTES DE CORTAR. Hasta el 16/09/2026 esto era
    // `selected.slice(0, maxSelected)` sobre el orden en que el modelo los
    // enumeró: el corte podía tirar una `alta` y quedarse una `baja`, y además
    // no era reproducible — el orden lo decidía la salida del modelo.
    const ordenados = ordenarParaCortar(selected);
    return {
      seleccionados: ordenados.slice(0, maxSelected),
      // Se cuenta sobre TODOS los que llegaron, no sobre los que sobreviven al
      // corte: lo que se quiere saber es si la señal existe, no si sobrevivió.
      sinConfianza: contarSinConfianza(selected),
      // ⚠️ EL REPARTO ENTERO, con las cifras de LA MISMA resolución que
      // construyó `selected`: no se vuelven a leer los ids en crudo. Ver
      // reparto-del-rerank.ts.
      reparto: repartoConModelo({
        recuperados: new Set(candidates.map(c => c.documentId)).size,
        elegidosPorElModelo: selected.length,
        idsNoReconocidos: resolucion.idsNoReconocidos,
        repetidos: resolucion.repetidos,
        maxSelected,
      }),
    };
  } catch (err) {
    console.warn('[rerank] LLM failed, falling back to top candidates by embedding score:', err);
    recordStageFailure('rerank', err);
    // Fallback: en exhaustivo top 5, en rápido top 3
    const fallbackCount = isExhaustive ? 5 : 3;
    const fallbackCandidates = candidates.slice(0, fallbackCount);
    // ⚠️ EL FALLBACK NO PASA POR `ordenarParaCortar`, Y ES CORRECTO: aquí no
    // hay ninguna confianza que ordenar —el modelo no contestó— y
    // `candidates` ya viene del retrieval. Lo que sí se declara es que todos
    // salen `baja`: es una valoración que NADIE hizo, así que se marca como
    // el nivel más bajo y no como `sin_declarar`, que significaría «el modelo
    // no lo dijo» cuando aquí el modelo ni siquiera llegó a hablar.
    return {
      seleccionados: fallbackCandidates.map(c => ({
        documentId: c.documentId,
        documentName: c.documentName,
        source: c.source,
        fragments: c.fragments,
        rerankReason: 'Fallback: rerank LLM falló, seleccionado por score de embedding',
        rerankConfidence: 'baja' as const,
      })),
      // Cero, y no «todos»: `sin_declarar` cuenta al modelo que no valoró. Aquí
      // no hubo modelo, y eso lo registra `analysis.stageFailures` con la etapa
      // `rerank`. (Hasta el 16/09 decía «lo cuenta `averia`»: no existe tal
      // contador — `averia` es una etapa reservada y vacía, `counters.ts`.)
      sinConfianza: 0,
      // ⚠️ EL MODELO NO LLEGÓ A HABLAR, Y EL REPARTO LO DICE EN SU FORMA
      // (B.254). Hasta el 16/09/2026 este comentario afirmaba «no hay nada que
      // repartir por criterio» mientras la llamada de debajo calculaba
      // `recuperados − 3` y lo guardaba como descartados POR CRITERIO. Aquí se
      // rompe a propósito la invariante `recuperados = criterio + elegidos`:
      // no hay criterio, y el reparto sin modelo no tiene ese campo.
      reparto: repartoSinModelo({
        recuperados: new Set(candidates.map(c => c.documentId)).size,
        seleccionadosPorScore: fallbackCandidates.length,
      }),
    };
  }
}
