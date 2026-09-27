import { celdasDeFila, encajaTabular } from './comparador-tabular.mjs';

/**
 * EL COMPARADOR ESTRUCTURAL DEL EXAMEN (27/09/2026) — los cuatro umbrales de P3.
 *
 * Hasta hoy P3 salía PASA sin medir nada: sus umbrales tenían claves que el
 * marcador no leía. Se juzga POR PASADA y vale la peor, porque la base es
 * «15 en todas» (`P3_tarifarios_tablas.mjs`, `lineaDeBase`), no «15 en alguna».
 *
 * Lo que lee de cada pasada, y si falta no se inventa un cero: la pasada queda
 * sin medir.
 *   · `analisis.tableDiffs[].identicas`, la cuenta del diff.
 *   · los hallazgos con `comparedValues`, emparejados con `encajaTabular` por
 *     código, columna y los dos valores.
 *   · el contador `verificador.confirmados_por_estructura`: vale 0 por diseño
 *     desde que el juez no tiene camino a ese sello (`pipeline.ts:451-453`).
 */

export const CLAVES_ESTRUCTURALES = new Set([
  'identicasMinimo',
  'discrepantesConColumnaCorrectaMinimo',
  'sinParejaForzadaMaximo',
  'confirmadosPorEstructuraDelJuezMaximo',
]);

const CONTADOR_DEL_JUEZ = 'verificador.confirmados_por_estructura';

/** `{ medida }` o `{ noMedible: motivo }`. `hallazgos` ya filtrados por severidad. */
export function medirEstructura(esperado, pasada, hallazgos) {
  if (!Array.isArray(pasada.tablas)) return { noMedible: 'el cuerpo no trae `analisis.tableDiffs`' };
  const delJuez = pasada.contadores?.[CONTADOR_DEL_JUEZ];
  if (typeof delJuez !== 'number') return { noMedible: `el cuerpo no trae el contador \`${CONTADOR_DEL_JUEZ}\`` };

  const identicas = pasada.tablas.reduce((s, t) => s + (typeof t.identicas === 'number' ? t.identicas : 0), 0);

  const discrepantes = esperado.discrepantes.filter(d => hallazgos.some(h => encajaTabular(h, {
    columnaEnOposicion: d.columna,
    enElAnalizado: d.enElAnalizado,
    enElCorpus: d.enElCorpus,
    confirmadoPorEsperado: 'estructura',
  }, d.codigo))).length;

  // Pareja forzada: un hallazgo del diff que no une la MISMA fila emparejable en
  // los dos lados. Un código que no se encuentra cuenta como forzada: falla cerrado.
  const emparejables = new Set([...esperado.identicas, ...esperado.discrepantes.map(d => d.codigo)]);
  const conocidos = new Set([...emparejables, ...esperado.soloEnElAnalizado, ...esperado.soloEnElCorpus]);
  const codigos = fila => celdasDeFila(fila).filter(c => conocidos.has(c));
  const forzadas = hallazgos.filter(h => (h.comparedValues ?? []).length > 0).filter(h => {
    const a = codigos(h.newDocRow ?? h.newDocSays);
    const b = codigos(h.existingDocRow ?? h.existingDocSays);
    return !(a.length === 1 && b.length === 1 && a[0] === b[0] && emparejables.has(a[0]));
  }).length;

  return { medida: { identicas, discrepantes, forzadas, delJuez } };
}

/** Juzga las medidas de las pasadas hechas contra el umbral; vale la peor. */
export function juzgarEstructura(umbral, medidas) {
  const peor = {
    identicas: Math.min(...medidas.map(m => m.identicas)),
    discrepantes: Math.min(...medidas.map(m => m.discrepantes)),
    forzadas: Math.max(...medidas.map(m => m.forzadas)),
    delJuez: Math.max(...medidas.map(m => m.delJuez)),
  };
  const fallos = [];
  const min = (k, v, txt) => { if (typeof umbral[k] === 'number' && v < umbral[k]) fallos.push(`${txt}: ${v} en la peor pasada y el mínimo es ${umbral[k]}`); };
  const max = (k, v, txt) => { if (typeof umbral[k] === 'number' && v > umbral[k]) fallos.push(`${txt}: ${v} en la peor pasada y el máximo es ${umbral[k]}`); };
  min('identicasMinimo', peor.identicas, 'idénticas');
  min('discrepantesConColumnaCorrectaMinimo', peor.discrepantes, 'discrepantes con columna y valores correctos');
  max('sinParejaForzadaMaximo', peor.forzadas, 'parejas forzadas');
  max('confirmadosPorEstructuraDelJuezMaximo', peor.delJuez, 'confirmados por estructura del juez');
  return { peor, fallos };
}
