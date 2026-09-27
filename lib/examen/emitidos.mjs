/**
 * TODO LO QUE EL SISTEMA EMITIÓ EN UNA PASADA, CON SU ESPECIE (27/09/2026).
 *
 * Hasta hoy el marcador sólo miraba las contradicciones de `discrepancies`. Un
 * solapamiento o un duplicado —y una inconsistencia menor— no se veían: ni
 * como acierto (N3-DUPLICADO) ni como posible falso positivo. Aquí entra todo
 * lo que el usuario vería, cada cosa con su especie.
 *
 * Solapamientos y duplicados son de DOCUMENTO: no traen las dos citas, sólo el
 * documento del corpus. Se emparejan por ese documento, no por discriminante.
 */

export const DE_DOCUMENTO = new Set(['solapamiento', 'duplicado']);
/** Las especies que un caso puede nombrar en `etiquetasAceptadas`. */
export const ESPECIES = new Set(['contradiccion', 'inconsistencia_menor', 'solapamiento', 'duplicado']);

function especieDe(severity) {
  const s = severity ?? 'contradiction';
  if (s === 'contradiction') return 'contradiccion';
  if (s === 'minor_inconsistency') return 'inconsistencia_menor';
  return `severidad:${s}`;
}

/** `pasada` en la forma de `veredicto.mjs`. Las contradicciones van primero y
 *  en su orden, para que los índices del comparador estructural casen. */
export function emitidosDe(pasada) {
  const todos = (pasada.hallazgos ?? []).map(h => ({
    especie: especieDe(h.severity), hallazgo: h, texto: h.topic ?? '(sin título)',
  }));
  const salida = [...todos.filter(x => x.especie === 'contradiccion'), ...todos.filter(x => x.especie !== 'contradiccion')];
  for (const o of Array.isArray(pasada.solapamientos) ? pasada.solapamientos : []) {
    salida.push({
      especie: 'solapamiento', documento: o.existingDocument,
      texto: `solapamiento con ${o.existingDocument} (${o.overlapPercent ?? '?'} %, ${o.severity ?? '?'})`,
    });
  }
  if (pasada.duplicado?.isDuplicate) {
    salida.push({
      especie: 'duplicado', documento: pasada.duplicado.duplicateOf,
      texto: `duplicado de ${pasada.duplicado.duplicateOf} (${pasada.duplicado.duplicateConfidence ?? '?'} %)`,
    });
  }
  return salida;
}

/** Las especies que una expectativa acepta. Sin `etiquetasAceptadas`: contradicción. */
export function especiesAceptadas(e) {
  return e.etiquetasAceptadas ?? ['contradiccion'];
}

/** El documento del corpus contra el que se empareja una expectativa de
 *  documento: el que declara, o el único del corpus. Con varios y sin
 *  declararlo, ninguno — y no se puede emparejar. */
export function documentoEsperado(e, caso) {
  if (e.documentoEnElCorpus) return e.documentoEnElCorpus;
  return caso?.corpusExacto?.length === 1 ? caso.corpusExacto[0] : null;
}
