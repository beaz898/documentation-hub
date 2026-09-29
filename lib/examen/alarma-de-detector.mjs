/**
 * LA ALARMA DEL DETECTOR (principio del detector, FASE 3, 29/09/2026; B.290 y
 * B.294). Por pasada, y por cada esperado con `detectorDeBase`:
 *
 *   ¿EMITIÓ EL DETECTOR DE BASE ALGO EMPAREJABLE?
 *
 * No se pregunta cuál eligió el marcador: se queda con el PRIMER emitido que
 * encaja (`findIndex` en `marcador.mjs`). Con la misma fila por los dos
 * detectores y la del juez delante, preguntar por el elegido daría rojo con la
 * estructura funcionando.
 *
 * Asimétrica:
 *   · base `estructura` y encaja sólo el otro → PERDIDO → FALLA. Un comparador
 *     determinista no tiene ruido: UNA pasada basta, no hay nada que promediar.
 *   · base `juicio` y encaja sólo la estructura → CAMBIADO → aviso destacado,
 *     no rojo. No se ha perdido nada; ha cambiado el camino.
 *   · sin base, o si no encaja nada → nada: no hay con qué comparar, y lo que
 *     no salió ya lo juzga la cobertura.
 *   · encaja sólo lo que no dice su detector (`null`) → SIN_DETECTOR: la
 *     alarma falla ABIERTO, y se cuenta (B.287: los solapamientos del juez no
 *     traen `confirmedBy`). No se deduce que fue el juez.
 */

export const DETECTOR_DETERMINISTA = 'estructura';
export const PERDIDO = 'PERDIDO';
export const CAMBIADO = 'CAMBIADO';
export const SIN_DETECTOR = 'SIN_DETECTOR';

/**
 * `detectoresQueEncajan`: el detector (`confirmedBy ?? null`) de CADA emitido de
 * la pasada que encaja con el esperado. Devuelve `null` si no hay nada que avisar.
 */
export function vigilarDetector(base, detectoresQueEncajan) {
  if (!base || detectoresQueEncajan.length === 0) return null;
  if (detectoresQueEncajan.includes(base)) return null;
  const otro = detectoresQueEncajan.find(d => d !== null);
  if (otro === undefined) return { tipo: SIN_DETECTOR };
  return { tipo: base === DETECTOR_DETERMINISTA ? PERDIDO : CAMBIADO, detector: otro };
}

/**
 * Agrega la vigilancia de las pasadas hechas. Un PERDIDO en cualquier pasada es
 * un fallo; un CAMBIADO, un aviso; los SIN_DETECTOR, un contador.
 *
 * ⚠️ EL CONTADOR CUENTA SÓLO SOBRE ESPERADOS CON BASE (decisión del arquitecto,
 * 29/09/2026). Declara dónde la alarma falla abierto, y sin base no había nada
 * que vigilar: contar los 15 de N3-DUPLICADO, que no tiene base, exageraría el
 * agujero. Ese otro número no se pierde: la línea del detector del informe ya
 * imprime «desconocido 15/15». Son dos hechos distintos, cada uno en su sitio.
 * No se «arregla» a la cifra grande.
 */
export function juzgarVigilancia(hechas) {
  const n = hechas.length;
  const porClave = new Map();
  let sinDetector = 0;
  for (const m of hechas) {
    for (const v of m.vigilancia ?? []) {
      if (v.tipo === SIN_DETECTOR) { sinDetector++; continue; }
      const k = `${v.tipo}|${v.id}|${v.detector}`;
      porClave.set(k, { ...v, pasadas: (porClave.get(k)?.pasadas ?? 0) + 1 });
    }
  }
  const fallos = [];
  const avisos = [];
  for (const v of porClave.values()) {
    if (v.tipo === PERDIDO) {
      fallos.push(`ALARMA DE DETECTOR: ${v.id} tiene base ${v.base} y en ${v.pasadas}/${n} pasada(s) lo encontró ` +
        `${v.detector} sin que ${v.base} emitiera nada emparejable: se perdió un detector determinista, y eso no es ruido`);
    } else {
      avisos.push(`AVISO DE DETECTOR: ${v.id} tiene base ${v.base} y en ${v.pasadas}/${n} pasada(s) lo emitió ` +
        `${v.detector}: no se ha perdido nada, ha cambiado el camino`);
    }
  }
  return { fallos, avisos, sinDetector };
}
