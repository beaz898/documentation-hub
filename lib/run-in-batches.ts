/**
 * Ejecuta `items` en rondas de `batchSize`, con Promise.all dentro de cada
 * ronda, para paralelizar sin desbordar al proveedor de turno (la API de
 * Anthropic o la de Pinecone). Sustituye el mismo bucle de rondas que hoy
 * está copiado tres veces, cada uno con su propia constante:
 * lib/analysis/judge.ts (EXHAUSTIVE_CONCURRENCY / EXHAUSTIVE_ROUND_DELAY_MS),
 * lib/analysis/verify-claims.ts (CONCURRENCY / DELAY_BETWEEN_ROUNDS_MS) y
 * lib/analysis/retrieval.ts (QUERY_BATCH_SIZE).
 *
 * Tres decisiones deliberadas, para quien migre los otros dos ficheros:
 *   - `delayMs` es OPCIONAL, sin valor por defecto. La pausa existe en
 *     judge.ts y verify-claims.ts porque llaman a un LLM con límite de
 *     peticiones; retrieval.ts paraleliza contra Pinecone y no la necesita —
 *     omitirlo es exactamente su comportamiento actual, no una aproximación.
 *   - NO captura errores: si una promesa rechaza, el Promise.all de esa ronda
 *     rechaza y la excepción sube. Cada llamador ya resuelve esto dentro de
 *     su propio worker (judge.ts y verify-claims.ts atrapan el error ahí y
 *     devuelven un valor de repuesto; retrieval.ts deja subir el error de
 *     Pinecone tal cual). Capturar aquí sería tomar por los tres una decisión
 *     que cada uno ya tiene tomada.
 *   - Devuelve SIEMPRE en el orden de entrada, no en el de finalización. Hace
 *     explícita para los tres la garantía que judge.ts ya construía a mano
 *     con un array indexado (results[i] = ...) y que los otros dos daban por
 *     supuesta apoyándose en que Array.prototype.map y el recorrido
 *     secuencial de rondas la preservan.
 */
export async function runInBatches<TInput, TOutput>(
  items: TInput[],
  worker: (item: TInput, index: number) => Promise<TOutput>,
  options: { batchSize: number; delayMs?: number },
): Promise<TOutput[]> {
  const { delayMs } = options;
  const batchSize = options.batchSize < 1 ? 1 : options.batchSize;
  const results: TOutput[] = new Array(items.length);

  for (let batchStart = 0; batchStart < items.length; batchStart += batchSize) {
    if (batchStart > 0 && delayMs) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const batchEnd = Math.min(batchStart + batchSize, items.length);
    const batchPromises: Promise<void>[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(
        worker(items[i], i).then(result => { results[i] = result; }),
      );
    }

    await Promise.all(batchPromises);
  }

  return results;
}
