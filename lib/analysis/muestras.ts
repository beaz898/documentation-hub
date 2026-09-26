/**
 * EL MUESTREO DEL ANÁLISIS RÁPIDO — qué fragmentos del documento analizado se
 * convierten en consultas a Pinecone.
 *
 * Vivía privado en `app/api/analyze-v2/route.ts`. Sale aquí el 26/09/2026, sin
 * cambiar una línea de su cuerpo, porque el endpoint del examen corre el mismo
 * análisis y tiene que muestrear igual: un criterio se implementa UNA VEZ.
 */

/** Extrae textos muestreados de los chunks para el análisis rápido. */
export function pickSampledTexts(chunks: Array<{ text: string }>): string[] {
  const total = chunks.length;
  // B.77 — Tras el paso 4b un chunk de hoja de cálculo es UNA FILA, y saltarse
  // una fila es perder un dato entero, no un matiz (a diferencia de la prosa,
  // donde párrafos vecinos se solapan). Se sube el tope para que los documentos
  // tabulares del corpus entren completos: OPE-06, el mayor medido, tiene 114
  // chunks. Cada muestra cuesta una consulta a Pinecone y su parte de un lote de
  // embeddings, pero CERO llamadas a LLM (el rerank y el judge trabajan sobre
  // newDocumentText, no sobre las muestras), así que el tope lo pone el tiempo
  // de la función (maxDuration 120s), no el coste.
  const targetSamples = total <= 120
    ? total
    : 120;
  const indices = pickSampleIndices(total, targetSamples);
  return indices.map(i => chunks[i].text);
}

/** Selecciona índices distribuidos uniformemente por el documento. */
function pickSampleIndices(total: number, count: number): number[] {
  if (total <= count) return Array.from({ length: total }, (_, i) => i);
  const indices: number[] = [];
  const step = (total - 1) / (count - 1);
  for (let i = 0; i < count; i++) indices.push(Math.round(i * step));
  return [...new Set(indices)];
}
