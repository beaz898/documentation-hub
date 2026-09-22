/**
 * LOS DOS CORTES DE LA RECUPERACIÓN, CON NOMBRE Y CON CONTADOR — B.248, primer
 * tiempo (17/09/2026).
 *
 * ⚠️ QUÉ ES ESTO Y QUÉ NO: es la INSTRUMENTACIÓN. No mueve ningún valor. El 0,50
 * está sin calibrar y con el corpus de hoy no se puede calibrar: el censo de las
 * 42×41 parejas no encontró ninguna por debajo de ~0,79, así que ningún número
 * absoluto elegido hoy decidiría nada que se pueda comprobar. Lo que sí se puede
 * hacer hoy es que el día que el umbral empiece a descartar, SE VEA.
 *
 * ⚠️ Y LA DISTINCIÓN QUE HACE BUENO EL CONTADOR: el umbral descarta FRAGMENTOS, uno
 * a uno. Un DOCUMENTO sólo se pierde por el umbral si NINGUNO de sus fragmentos lo
 * pasa. Contar fragmentos diría «el umbral actuó» cuando quizá no dejó fuera a
 * nadie; contar documentos dice lo que importa.
 */

/**
 * ¿Pasa este fragmento el umbral? LA ÚNICA COMPARACIÓN: `cribarMatches`
 * (`criba-de-matches.ts`) la usa para decidir, y el caso decisivo la usa para
 * probar el mismo criterio. Hasta el 22/09/2026 el llamante era `collectMatches`,
 * en `retrieval.ts`, y allí el umbral se aplicaba ANTES de comprobar si el
 * documento existía — el orden que dejaba entrar a un documento borrado (F-115).
 */
export function pasaElUmbral(score: number, umbral: number): boolean {
  return score >= umbral;
}

/**
 * Cuántos DOCUMENTOS se perdieron sólo por el umbral: tuvieron algún fragmento
 * recuperado, ninguno lo pasó, y no eran el documento excluido a propósito.
 */
export function candidatosPerdidosPorUmbral(args: {
  idsConFragmentoBajoUmbral: Iterable<string>;
  idsConFragmentoAceptado: Iterable<string>;
  excluido?: string;
}): number {
  const aceptados = new Set(args.idsConFragmentoAceptado);
  const perdidos = new Set<string>();
  for (const id of args.idsConFragmentoBajoUmbral) {
    if (id === args.excluido) continue;
    if (!aceptados.has(id)) perdidos.add(id);
  }
  return perdidos.size;
}

/**
 * El corte previo al rerank: los `tope` más afines, y cuántos se quedaron fuera.
 * Hasta el 17/09/2026 era un `.slice(0, 25)` literal y mudo.
 */
export function cortarALosMasAfines<T extends { maxScore: number }>(
  candidatos: T[],
  tope: number,
): { candidatos: T[]; cortados: number } {
  const ordenados = [...candidatos].sort((a, b) => b.maxScore - a.maxScore);
  return {
    candidatos: ordenados.slice(0, tope),
    cortados: Math.max(0, ordenados.length - tope),
  };
}
