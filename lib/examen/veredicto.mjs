import { estadoDeEstabilidad } from './estabilidad.mjs';
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
      ? {
          pasada: r.pasada, hallazgos, tablas: analisis.tableDiffs, contadores: analisis.pipelineCounters,
          solapamientos: analisis.overlaps,
          duplicado: { isDuplicate: analisis.isDuplicate, duplicateOf: analisis.duplicateOf, duplicateConfidence: analisis.duplicateConfidence },
        }
      : { pasada: r.pasada, noMedible: 'el cuerpo de la respuesta no trae `analisis.discrepancies`' });
  }
  return porCaso;
}

/** Las líneas de veredicto del informe, una tanda entera. */
export function lineasDelVeredicto(casos, resultados) {
  const lineas = [];
  let inestablesDeLaTanda = 0;
  for (const m of marcarTanda(casos, pasadasParaElMarcador(casos, resultados))) {
    const cifras = m.estado === SIN_VEREDICTO ? ''
      : m.estructura
        ? ` · peor pasada: ${m.estructura.identicas} idénticas, ${m.estructura.discrepantes} discrepantes con columna y valores, ` +
          `${m.estructura.forzadas} parejas forzadas, ${m.estructura.delJuez} del juez por estructura`
        : ` · ${m.totalAciertos} estable(s)-acierto · ${m.maxFalsos} falsos (máx. por pasada)`;
    lineas.push(`${m.casoId}: ${m.estado}${cifras}`);
    for (const r of m.razones) lineas.push(`    ~ ${r}`);
    for (const f of m.fallos) lineas.push(`    ✗ ${f}`);
    for (const s of m.seguimiento ?? []) lineas.push(`    ~ ${s}`);
    // Un extra que se contó como falso se enseña por su nombre: el director
    // decide si es un falso de verdad (P2, «Fecha de última revisión»).
    const porExtra = new Map();
    for (const mk of m.marcas.filter(x => x.ejecutada)) {
      for (const t of mk.falsosPorExtra ?? []) porExtra.set(t, (porExtra.get(t) ?? new Set()).add(mk.pasada));
    }
    for (const [t, ps] of porExtra) lineas.push(`    ✗ contado como falso (auditoría completa): «${t}» — pasada(s) ${[...ps].join(', ')}`);
    lineas.push(...lineasDeAciertos(casos.find(c => c.id === m.casoId), m.marcas));
    // Fable: «El número de inestables es una métrica en sí.» Su propia línea.
    if (m.estabilidad?.porEsperado.length) {
      lineas.push(`    · inestables: ${m.estabilidad.inestables}`);
      inestablesDeLaTanda += m.estabilidad.inestables;
    }
    lineas.push(...lineasDeExtras(m.marcas));
  }
  lineas.push('', `INESTABLES EN LA TANDA: ${inestablesDeLaTanda} ` +
    '(entre 1 y 4 de 5; si crece, el sistema se ha vuelto más aleatorio aunque la media no se mueva)');
  return lineas;
}

/** Cada esperado, en cuántas pasadas salió y en qué estado de Fable. Se imprime
 *  también sin veredicto: un SIN_VEREDICTO no juzga, pero lo observado no se esconde. */
export function lineasDeAciertos(caso, marcas) {
  const hechas = (marcas ?? []).filter(m => m.ejecutada);
  if (!hechas.length || !(caso?.debenSalir ?? []).length) return [];
  const n = hechas.length;
  return [`    · aciertos observados: ${caso.debenSalir.map(e => {
    const k = hechas.filter(m => m.aciertos.includes(e.id)).length;
    return `${e.id} ${k}/${n} ${estadoDeEstabilidad(k, n)}`;
  }).join(' · ')}`];
}

/** Hasta cuántos textos distintos se imprimen enteros. Con más, sólo cuentas por especie. */
export const TEXTOS_DE_EXTRAS_MAXIMO = 5;

/**
 * LOS EXTRAS, POR PASADA Y CON SU TEXTO CUANDO SON POCOS (director, 27/09/2026):
 * lo que el sistema emitió y ninguna expectativa clasificó. No es un falso —
 * nadie lo ha etiquetado—, pero callarlo es esconder un posible falso positivo.
 */
export function lineasDeExtras(marcas) {
  const hechas = (marcas ?? []).filter(m => m.ejecutada);
  const total = hechas.reduce((s, m) => s + m.extras, 0);
  if (total === 0) return hechas.length ? ['    · extras sin etiquetar: ninguno'] : [];
  const lineas = [`    · extras sin etiquetar: ${hechas.map(m => `p${m.pasada} ${m.extras}`).join(' · ')}`];
  const porTexto = new Map();
  for (const m of hechas) {
    for (const x of m.extrasDetalle) {
      const k = `${x.especie}: ${x.texto}`;
      porTexto.set(k, (porTexto.get(k) ?? new Set()).add(m.pasada));
    }
  }
  if (porTexto.size <= TEXTOS_DE_EXTRAS_MAXIMO) {
    for (const [k, pasadas] of porTexto) lineas.push(`        ${k} — en ${pasadas.size} de ${hechas.length} pasadas`);
  } else {
    const porEspecie = {};
    for (const m of hechas) for (const x of m.extrasDetalle) porEspecie[x.especie] = (porEspecie[x.especie] ?? 0) + 1;
    lineas.push(`        ${porTexto.size} textos distintos; por especie: ` +
      Object.entries(porEspecie).map(([e, n]) => `${e} ${n}`).join(' · '));
  }
  return lineas;
}
