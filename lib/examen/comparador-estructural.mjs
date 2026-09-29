import { vigilarDetector } from './alarma-de-detector.mjs';
import { celdasDeFila, detectorExigido, encajaFila } from './comparador-tabular.mjs';

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
 *   · los hallazgos, emparejados con `encajaFila` por código, columna y los dos
 *     valores, y exigiendo el detector que declara el caso (`detectorExigido`).
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

  // Los índices emparejados salen para que el marcador no los enseñe como extras:
  // ya los clasificó una expectativa. El detector exigido lo declara el CASO
  // (`esperado.detectorExigido`, fase 2 del detector); una discrepante que la
  // encuentra el OTRO detector no cuenta como acierto ni como extra: se devuelve
  // aparte, y el marcador da SIN_VEREDICTO («el caso dejó de ejercer su rama»).
  const exigido = detectorExigido(esperado);
  const emparejados = [];
  const otroDetector = [];
  // Fase 3: con base declarada, cada discrepante pregunta si su detector de base
  // emitió algo emparejable (`alarma-de-detector.mjs`).
  const vigilancia = [];
  let aciertosDeFila = 0;
  for (const d of esperado.discrepantes) {
    const e = { columnaEnOposicion: d.columna, enElAnalizado: d.enElAnalizado, enElCorpus: d.enElCorpus };
    const v = vigilarDetector(esperado.detectorDeBase,
      hallazgos.filter(h => encajaFila(h, e, d.codigo)).map(h => h.confirmedBy ?? null));
    if (v) vigilancia.push({ id: `${d.codigo}·${d.columna}`, base: esperado.detectorDeBase, ...v });
    const i = hallazgos.findIndex((h, k) => !emparejados.includes(k) && encajaFila(h, e, d.codigo) &&
      (!exigido || h.confirmedBy === exigido));
    if (i !== -1) { emparejados.push(i); aciertosDeFila++; continue; }
    const j = hallazgos.findIndex((h, k) => !emparejados.includes(k) && encajaFila(h, e, d.codigo));
    if (j !== -1) {
      emparejados.push(j);
      otroDetector.push({ id: `${d.codigo}·${d.columna}`, detector: hallazgos[j].confirmedBy ?? null, exigido, motivo: esperado.detectorExigido.motivo });
    }
  }
  const discrepantes = aciertosDeFila;

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

  return { medida: { identicas, discrepantes, forzadas, delJuez }, emparejados, otroDetector, vigilancia };
}

/** Juzga las medidas de las pasadas hechas contra el umbral; vale la peor. */
export function juzgarEstructura(umbral, medidas) {
  const peor = {
    identicas: Math.min(...medidas.map(m => m.identicas)),
    discrepantes: Math.min(...medidas.map(m => m.discrepantes)),
    forzadas: Math.max(...medidas.map(m => m.forzadas)),
    delJuez: Math.max(...medidas.map(m => m.delJuez)),
  };
  // Un mínimo no alcanzado es una AUSENCIA; un máximo superado, un EXCESO medido.
  // La clase CERO de la puerta del marcador sólo deja pasar los segundos.
  const fallos = [];
  const excesos = [];
  const min = (k, v, txt) => { if (typeof umbral[k] === 'number' && v < umbral[k]) fallos.push(`${txt}: ${v} en la peor pasada y el mínimo es ${umbral[k]}`); };
  const max = (k, v, txt) => {
    if (typeof umbral[k] !== 'number' || v <= umbral[k]) return;
    const t = `${txt}: ${v} en la peor pasada y el máximo es ${umbral[k]}`;
    fallos.push(t);
    excesos.push(t);
  };
  min('identicasMinimo', peor.identicas, 'idénticas');
  min('discrepantesConColumnaCorrectaMinimo', peor.discrepantes, 'discrepantes con columna y valores correctos');
  max('sinParejaForzadaMaximo', peor.forzadas, 'parejas forzadas');
  max('confirmadosPorEstructuraDelJuezMaximo', peor.delJuez, 'confirmados por estructura del juez');
  return { peor, fallos, excesos };
}
