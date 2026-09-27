import { marcarTanda, SIN_VEREDICTO } from './marcador.mjs';

/**
 * DE LOS CRUDOS AL VEREDICTO — compartido por el ejecutor (`scripts/examen.mjs`)
 * y la repuntuación (`scripts/examen-repuntuar.mjs`), para que la tanda y su
 * relectura no tengan dos adaptadores que se separen.
 */

/**
 * Adapta los crudos a lo que el marcador espera: `cuerpo.analisis.discrepancies`
 * (la forma de `FinalAnalysis`), y para los casos estructurales `tableDiffs` y
 * `pipelineCounters`.
 *
 * ⚠️ SI NO ESTÁN, LA PASADA NO SE MARCA COMO «CERO HALLAZGOS»: se marca como NO
 * EJECUTADA. Un cuerpo del que no se sabe leer produciría un cero indistinguible
 * de un cero real, que es lo único que este examen no puede permitirse.
 */
export function pasadasParaElMarcador(casos, resultados) {
  const porCaso = {};
  for (const c of casos) porCaso[c.id] = [];
  for (const r of resultados) {
    if (!porCaso[r.casoId]) continue;
    if (r.error || r.noMedible) {
      porCaso[r.casoId].push({ pasada: r.pasada, error: r.error, noMedible: r.noMedible });
      continue;
    }
    const analisis = r.cuerpo?.analisis;
    const hallazgos = analisis?.discrepancies;
    porCaso[r.casoId].push(Array.isArray(hallazgos)
      ? { pasada: r.pasada, hallazgos, tablas: analisis.tableDiffs, contadores: analisis.pipelineCounters }
      : { pasada: r.pasada, noMedible: 'el cuerpo de la respuesta no trae `analisis.discrepancies`' });
  }
  return porCaso;
}

/** Las líneas de veredicto del informe, una tanda entera. */
export function lineasDelVeredicto(casos, resultados) {
  const lineas = [];
  for (const m of marcarTanda(casos, pasadasParaElMarcador(casos, resultados))) {
    const cifras = m.estado === SIN_VEREDICTO ? ''
      : m.estructura
        ? ` · peor pasada: ${m.estructura.identicas} idénticas, ${m.estructura.discrepantes} discrepantes con columna y valores, ` +
          `${m.estructura.forzadas} parejas forzadas, ${m.estructura.delJuez} del juez por estructura`
        : ` · ${m.totalAciertos} aciertos · ${m.maxFalsos} falsos (máx. por pasada)`;
    lineas.push(`${m.casoId}: ${m.estado}${cifras}`);
    for (const r of m.razones) lineas.push(`    ~ ${r}`);
    for (const f of m.fallos) lineas.push(`    ✗ ${f}`);
  }
  return lineas;
}
