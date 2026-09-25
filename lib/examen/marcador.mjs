import { normalize } from '../analysis/normalize-core.mjs';

/**
 * EL MARCADOR DEL EXAMEN, CON TRES ESTADOS (26/09/2026).
 *
 * `PASA` / `FALLA` / `SIN_VEREDICTO`. El tercero no es un empate: es «este
 * resultado no se puede leer como veredicto», y existe porque sin él un caso sin
 * línea de base medida saldría verde el primer día y un cero sin denominador
 * pasaría por medición.
 *
 * Código puro: entran el caso y sus pasadas, sale un veredicto. Vive en `.mjs`
 * porque `scripts/examen.mjs` lo necesita, y usa el `normalize` del producto en
 * vez de tener su propio comparador.
 */

export const PASA = 'PASA';
export const FALLA = 'FALLA';
export const SIN_VEREDICTO = 'SIN_VEREDICTO';

/** Las reglas de `noDebenSalir` que el marcador sabe aplicar solo. Cualquier
 *  otra redacción cae a etiqueta humana: falla CERRADO, no se interpreta prosa. */
const REGLAS_MECANICAS = new Set(['TODO_HALLAZGO_DE_TIPO_CONTRADICCION']);

/** Un hallazgo satisface una expectativa si sus DOS citas contienen los dos
 *  discriminantes. Emparejar por título es lo que F-22 §4.1 midió que no vale. */
function encaja(hallazgo, expectativa) {
  const a = expectativa.citaEnElAnalizado?.discriminante;
  const b = expectativa.citaEnElCorpus?.discriminante;
  if (!a || !b) return false;
  const nuevo = normalize(hallazgo.newDocSays ?? '');
  const viejo = normalize(hallazgo.existingDocSays ?? '');
  const na = normalize(a);
  const nb = normalize(b);
  // Los lados pueden venir intercambiados: el caso declara quién es el analizado,
  // pero el juez decide en qué campo pone cada cita.
  return (nuevo.includes(na) && viejo.includes(nb)) || (nuevo.includes(nb) && viejo.includes(na));
}

const esContradiccion = h => (h.severity ?? 'contradiction') === 'contradiction';

/**
 * Marca UNA pasada: qué esperados salieron y qué falsos aparecieron.
 * `extras` son los hallazgos que no encajan con ninguna expectativa — no se
 * cuentan como falsos, se enseñan: el caso declara si su par tiene auditoría
 * completa y sólo entonces un extra es un falso.
 */
export function marcarPasada(caso, pasada) {
  if (pasada.error || pasada.noMedible) {
    return { pasada: pasada.pasada, ejecutada: false, motivo: pasada.noMedible ?? pasada.error };
  }
  const hallazgos = (pasada.hallazgos ?? []).filter(esContradiccion);
  const aciertos = [];
  const falsos = [];
  const emparejados = new Set();

  for (const e of caso.debenSalir ?? []) {
    const i = hallazgos.findIndex((h, k) => !emparejados.has(k) && encaja(h, e));
    if (i !== -1) { emparejados.add(i); aciertos.push(e.id); }
  }
  for (const f of caso.noDebenSalir ?? []) {
    if (f.cuentaComoFallo === false) continue;
    if (f.regla) {
      if (!REGLAS_MECANICAS.has(f.regla)) continue;   // a etiqueta humana
      hallazgos.forEach((_, k) => { if (!emparejados.has(k)) { emparejados.add(k); falsos.push(f.id); } });
      continue;
    }
    const i = hallazgos.findIndex((h, k) => !emparejados.has(k) && encaja(h, f));
    if (i !== -1) { emparejados.add(i); falsos.push(f.id); }
  }

  return {
    pasada: pasada.pasada,
    ejecutada: true,
    aciertos,
    falsos,
    extras: hallazgos.filter((_, k) => !emparejados.has(k)).length,
  };
}

/** Las reglas que este caso declara y el marcador NO sabe aplicar. */
function reglasNoMecanicas(caso) {
  return (caso.noDebenSalir ?? [])
    .filter(f => f.regla && f.cuentaComoFallo !== false && !REGLAS_MECANICAS.has(f.regla))
    .map(f => f.id);
}

/**
 * Marca un CASO a partir de sus pasadas.
 *
 * `contexto.aciertosPorCaso` es un mapa `casoId → Set(idsDeAcierto)` con lo que
 * la MISMA tanda logró en los otros casos. Es lo que hace falta para el control
 * de tanda de N4 y N5: sus pares no llevan siembra, así que su silencio sólo
 * significa algo si otro caso demostró que el sistema no estaba mudo.
 */
export function marcarCaso(caso, pasadas, contexto = {}) {
  const marcas = (pasadas ?? []).map(p => marcarPasada(caso, p));
  const hechas = marcas.filter(m => m.ejecutada);
  const razones = [];

  const umbral = caso.umbralDeAlarma ?? {};
  const totalAciertos = new Set(hechas.flatMap(m => m.aciertos)).size;
  const falsosPorPasada = hechas.map(m => m.falsos.length);
  const maxFalsos = falsosPorPasada.length ? Math.max(...falsosPorPasada) : 0;

  // ── 1 · Lo que impide leerlo como veredicto, antes de juzgar nada ──────────
  if (hechas.length === 0) {
    razones.push(`ninguna pasada ejecutable de ${marcas.length}: ${marcas.map(m => m.motivo).filter(Boolean).join(' · ') || 'sin resultados'}`);
  } else if (hechas.length < (caso.pasadas ?? hechas.length)) {
    razones.push(`${hechas.length} de ${caso.pasadas} pasadas: una tanda incompleta no da la tasa que el caso declara`);
  }

  if (umbral.estado === 'LINEA_DE_BASE_PENDIENTE') {
    razones.push('línea de base PENDIENTE: esta tanda MIDE la frecuencia, no la juzga. ' +
                 `observado: ${falsosPorPasada.join('/')} falsos por pasada`);
  }

  const control = caso.elSilencioCuentaSiSoloSi;
  if (control) {
    const logrados = contexto.aciertosPorCaso?.[control.caso];
    if (!logrados || !logrados.has(control.hallazgo)) {
      razones.push(`control de tanda NO cumplido: ${control.caso}/${control.hallazgo} no salió en esta tanda, ` +
                   'así que el silencio de este caso no distingue «no inventó» de «no funcionó nada»');
    }
  }

  const denom = caso.denominadorObligatorio;
  if (denom && typeof contexto.candidatosJuzgados === 'number' &&
      contexto.candidatosJuzgados < denom.minimoParaQueElCeroValga) {
    razones.push(`${contexto.candidatosJuzgados} candidatos juzgados y el caso exige ${denom.minimoParaQueElCeroValga}: ` +
                 'un cero con menos es trivialmente cierto');
  }

  const sinMecanica = reglasNoMecanicas(caso);
  if (sinMecanica.length > 0) {
    razones.push(`regla(s) que el marcador no sabe aplicar y necesitan etiqueta humana: ${sinMecanica.join(', ')}`);
  }

  // ── 2 · Y sólo si se puede leer, se juzga ──────────────────────────────────
  const fallos = [];
  if (razones.length === 0) {
    if (typeof umbral.minimoDeAciertos === 'number' && totalAciertos < umbral.minimoDeAciertos) {
      fallos.push(`${totalAciertos} aciertos y el umbral exige ${umbral.minimoDeAciertos}`);
    }
    if (typeof umbral.maximoDeFalsosConfirmados === 'number' && maxFalsos > umbral.maximoDeFalsosConfirmados) {
      fallos.push(`${maxFalsos} falsos en una pasada y el techo es ${umbral.maximoDeFalsosConfirmados}`);
    }
  }

  // ⚠️ EL ORDEN IMPORTA: un FALLA es un veredicto, y un caso ilegible no puede
  // dar veredicto ni para mal. Primero SIN_VEREDICTO, después FALLA.
  const estado = razones.length > 0 ? SIN_VEREDICTO : (fallos.length > 0 ? FALLA : PASA);
  return { casoId: caso.id, estado, razones, fallos, totalAciertos, maxFalsos, marcas };
}

/**
 * Marca la TANDA entera. Dos vueltas y no una: la primera recoge lo que cada
 * caso logró, la segunda juzga con eso delante — porque el control de tanda de
 * un caso depende del resultado de otro.
 */
export function marcarTanda(casos, pasadasPorCaso, contextoPorCaso = {}) {
  const aciertosPorCaso = {};
  for (const c of casos) {
    const marcas = (pasadasPorCaso[c.id] ?? []).map(p => marcarPasada(c, p));
    aciertosPorCaso[c.id] = new Set(marcas.filter(m => m.ejecutada).flatMap(m => m.aciertos));
  }
  return casos.map(c => marcarCaso(c, pasadasPorCaso[c.id] ?? [], {
    ...(contextoPorCaso[c.id] ?? {}),
    aciertosPorCaso,
  }));
}
