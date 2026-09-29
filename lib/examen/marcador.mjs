import { normalize } from '../analysis/normalize-core.mjs';
import { juzgarVigilancia, vigilarDetector } from './alarma-de-detector.mjs';
import { CLAVES_ESTRUCTURALES, juzgarEstructura, medirEstructura } from './comparador-estructural.mjs';
import { detectorExigido, encajaFila, esDeFila } from './comparador-tabular.mjs';
import { DE_DOCUMENTO, documentoEsperado, emitidosDe, ESPECIES, especiesAceptadas } from './emitidos.mjs';
import { juzgarEstabilidad } from './estabilidad.mjs';
import { claseDeSeguimiento, juzgarFrecuencias, MITADES, mitadesEnSeguimiento } from './seguimiento-y-frecuencia.mjs';

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
export const REGLAS_MECANICAS = new Set(['TODO_HALLAZGO_DE_TIPO_CONTRADICCION']);

/**
 * LO QUE ESTE MARCADOR SABE LEER, declarado aquí para que el validador
 * (`validar-lectura.mjs`) PREGUNTE en vez de tener su propia lista. Quien
 * enseñe al marcador una clave nueva la añade aquí en el mismo commit.
 */
export const CLAVES_DE_UMBRAL_QUE_LEE = new Set([
  'minimoDeAciertos', 'maximoDeFalsosConfirmados', 'seguimiento', ...CLAVES_ESTRUCTURALES,
]);
/** Las contradicciones se juzgan como tales; el resto de lo emitido se enseña
 *  por especie (`emitidos.mjs`). */
export const SEVERIDADES_QUE_LEE = new Set(['contradiction']);
export { CLAVES_ESTRUCTURALES, esDeFila, detectorExigido, ESPECIES, DE_DOCUMENTO };

const porCita = e => Boolean(e.citaEnElAnalizado?.discriminante && e.citaEnElCorpus?.discriminante);

/** ¿Tiene esta expectativa con qué emparejarse? Con las especies que acepta:
 *  una de documento necesita su documento del corpus; una contradicción, cita
 *  (dos discriminantes) o fila y valores (`esDeFila`). Si no, `encajaCon`
 *  devolvería `false` siempre y el acierto saldría como no salido. */
export function sabeEmparejar(e, caso) {
  const especies = especiesAceptadas(e);
  if (especies.some(x => DE_DOCUMENTO.has(x)) && documentoEsperado(e, caso)) return true;
  return especies.includes('contradiccion') && (porCita(e) || esDeFila(e));
}

/** El motivo de SIN_VEREDICTO cuando una excepción recibe el acierto del otro detector. */
export const DEJO_DE_EJERCER = 'el caso dejó de ejercer su rama';

/** Las tres clases de razón de la puerta de `marcarCaso` (B.291). */
export const TODO = 'TODO';
export const CERO = 'CERO';
export const PARTE = 'PARTE';

/**
 * Principio del detector, FASE 2 (28/09/2026): el CONTENIDO decide si un emitido
 * es el esperado; el DETECTOR, si el caso lo cuenta. Devuelve 'acierto', 'otro'
 * (el contenido es el esperado pero lo encontró quien el caso no exige) o null.
 * Sin `detectorExigido` en el caso, cualquier detector es acierto.
 */
function clasificar(emitido, e, caso) {
  if (!encajaCon(emitido, e, caso)) return null;
  const exigido = detectorExigido(e);
  return !exigido || detectorDe(emitido) === exigido ? 'acierto' : 'otro';
}

/** Quién confirmó un emitido: el `confirmedBy` del hallazgo (contradicciones) o
 *  del solapamiento. `null` si no viene. */
export function detectorDe(emitido) {
  const origen = emitido.hallazgo ?? emitido;
  return origen.confirmedBy ?? null;
}

/** El id con el que se apunta un falso que es un extra con auditoría completa. */
export const FALSO_POR_EXTRA = 'EXTRA';

/** Los extras de contradicción son falsos SÓLO si el caso lo dice Y declara
 *  de dónde sale que la auditoría del par es completa. */
export function extrasCuentanComoFalsos(caso) {
  return caso.extras === 'FALSO_POSITIVO' && Boolean(caso.auditoriaCompleta?.fuente);
}

function citaContiene(h, ancla) {
  const a = normalize(ancla);
  return normalize(h.newDocSays ?? '').includes(a) || normalize(h.existingDocSays ?? '').includes(a);
}

function encajaCon(emitido, e, caso) {
  if (!especiesAceptadas(e).includes(emitido.especie)) return false;
  if (DE_DOCUMENTO.has(emitido.especie)) {
    const doc = documentoEsperado(e, caso);
    return Boolean(doc) && emitido.documento === doc;
  }
  const h = emitido.hallazgo;
  if (porCita(e)) return encaja(h, e);
  return encajaFila(h, e);
}

/** Un hallazgo satisface una expectativa si sus DOS citas contienen los dos
 *  discriminantes. Emparejar por título es lo que F-22 §4.1 midió que no vale. */
function encaja(hallazgo, expectativa) {
  if (!porCita(expectativa)) return false;
  const a = expectativa.citaEnElAnalizado.discriminante;
  const b = expectativa.citaEnElCorpus.discriminante;
  const nuevo = normalize(hallazgo.newDocSays ?? '');
  const viejo = normalize(hallazgo.existingDocSays ?? '');
  const na = normalize(a);
  const nb = normalize(b);
  // Los lados pueden venir intercambiados: el caso declara quién es el analizado,
  // pero el juez decide en qué campo pone cada cita.
  return (nuevo.includes(na) && viejo.includes(nb)) || (nuevo.includes(nb) && viejo.includes(na));
}

/**
 * Marca UNA pasada: qué esperados salieron y qué falsos aparecieron.
 * `extras` es todo lo EMITIDO que no encaja con ninguna expectativa, de
 * cualquier especie — no se cuenta como falso, se ENSEÑA (`extrasDetalle`): un
 * hallazgo que nadie clasificó es un posible falso positivo invisible.
 */
export function marcarPasada(caso, pasada) {
  if (pasada.error || pasada.noMedible) {
    return { pasada: pasada.pasada, ejecutada: false, motivo: pasada.noMedible ?? pasada.error };
  }
  const emitidos = emitidosDe(pasada);
  const emparejados = new Set();
  let estructura;
  let estructuraOtro;
  let estructuraVigilancia;
  if (caso.esperadoEstructural) {
    // `emitidosDe` pone las contradicciones primero y en orden: los índices casan.
    const contradicciones = emitidos.filter(x => x.especie === 'contradiccion').map(x => x.hallazgo);
    const m = medirEstructura(caso.esperadoEstructural, pasada, contradicciones);
    if (m.noMedible) return { pasada: pasada.pasada, ejecutada: false, motivo: m.noMedible };
    estructura = m.medida;
    estructuraOtro = m.otroDetector;
    estructuraVigilancia = m.vigilancia;
    for (const k of m.emparejados) emparejados.add(k);
  }
  const aciertos = [];
  const falsos = [];
  // Fase 2: el acierto que encontró el OTRO detector dentro de una excepción. No
  // es acierto (el caso no ejerció su rama) ni extra ni falso (el contenido es
  // verdadero): se apunta, y el caso sale SIN_VEREDICTO.
  const otroDetector = [...(estructuraOtro ?? [])];

  // Principio del detector, FASE 1 (28/09/2026): qué detector encontró cada
  // acierto, tal como lo dice el hallazgo. Si no lo dice, `null` —«no viene»—.
  const detectores = {};
  // Fase 3: ¿emitió el detector de BASE algo emparejable? Se mira TODO lo emitido
  // que encaja, no el que eligió el marcador (`alarma-de-detector.mjs`).
  const vigilancia = [...(estructuraVigilancia ?? [])];
  for (const e of caso.debenSalir ?? []) {
    const v = vigilarDetector(e.detectorDeBase, emitidos.filter(x => encajaCon(x, e, caso)).map(detectorDe));
    if (v) vigilancia.push({ id: e.id, base: e.detectorDeBase, ...v });
    const i = emitidos.findIndex((x, k) => !emparejados.has(k) && clasificar(x, e, caso) === 'acierto');
    if (i !== -1) { emparejados.add(i); aciertos.push(e.id); detectores[e.id] = detectorDe(emitidos[i]); continue; }
    const j = emitidos.findIndex((x, k) => !emparejados.has(k) && clasificar(x, e, caso) === 'otro');
    if (j !== -1) {
      emparejados.add(j);
      otroDetector.push({ id: e.id, detector: detectorDe(emitidos[j]), exigido: detectorExigido(e), motivo: e.detectorExigido.motivo });
    }
  }
  for (const f of caso.noDebenSalir ?? []) {
    if (f.cuentaComoFallo === false) {
      // Lo declarado AMBIGUO (P2-NO-1) no cuenta, pero se RECLAMA por su ancla:
      // si no, con los extras contados como falsos, lo contaría la puerta de atrás.
      if (f.ancla) {
        emitidos.forEach((x, k) => {
          if (x.especie === 'contradiccion' && !emparejados.has(k) && citaContiene(x.hallazgo, f.ancla)) emparejados.add(k);
        });
      }
      continue;
    }
    if (f.regla) {
      if (!REGLAS_MECANICAS.has(f.regla)) continue;   // a etiqueta humana
      emitidos.forEach((x, k) => {
        if (x.especie === 'contradiccion' && !emparejados.has(k)) { emparejados.add(k); falsos.push(f.id); }
      });
      continue;
    }
    const i = emitidos.findIndex((x, k) => !emparejados.has(k) && encajaCon(x, f, caso));
    if (i !== -1) { emparejados.add(i); falsos.push(f.id); }
  }

  // Con auditoría completa declarada, una CONTRADICCIÓN que ninguna expectativa
  // reclama es un falso: el par no tiene más contradicciones que las sembradas.
  // Solapamientos y duplicados no: pueden ser verdad (B.269).
  const falsosPorExtra = [];
  if (extrasCuentanComoFalsos(caso)) {
    emitidos.forEach((x, k) => {
      if (x.especie === 'contradiccion' && !emparejados.has(k)) {
        emparejados.add(k); falsos.push(FALSO_POR_EXTRA); falsosPorExtra.push(x.texto);
      }
    });
  }

  const extrasDetalle = emitidos.filter((_, k) => !emparejados.has(k)).map(x => ({ especie: x.especie, texto: x.texto }));
  return {
    pasada: pasada.pasada,
    ejecutada: true,
    aciertos,
    detectores,
    otroDetector,
    vigilancia,
    falsos,
    falsosPorExtra,
    extras: extrasDetalle.length,
    extrasDetalle,
    ...(estructura ? { estructura } : {}),
  };
}

/** ¿Declara el caso algún detector de base, en sus esperados o en el estructural? */
function tieneBase(caso) {
  return (caso.debenSalir ?? []).some(e => e.detectorDeBase) || Boolean(caso.esperadoEstructural?.detectorDeBase);
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
  /**
   * LA PUERTA, CON TRES CLASES DE RAZÓN (29/09/2026, B.291 y B.293). Antes toda
   * razón silenciaba TODOS los fallos del caso:
   *   · TODO — el caso no se puede leer: no se juzga nada.
   *   · CERO — existe para que una AUSENCIA no se lea como confirmación. Calla las
   *     ausencias (un mínimo no alcanzado, la estabilidad) y deja salir los EXCESOS
   *     medidos: un falso que salió, salió.
   *   · PARTE — invalida una regla: el resto se juzga, y el caso no puede dar PASA.
   */
  const razones = [];
  const razon = (clase, texto) => razones.push({ clase, texto });

  const umbral = caso.umbralDeAlarma ?? {};
  // Fable (estabilidad.mjs): cuenta como acierto lo que sale en TODAS las pasadas.
  const estabilidad = juzgarEstabilidad(caso, hechas);
  const totalAciertos = estabilidad.estables;
  const falsosPorPasada = hechas.map(m => m.falsos.length);
  const maxFalsos = falsosPorPasada.length ? Math.max(...falsosPorPasada) : 0;

  // ── 1 · Lo que impide leerlo como veredicto, antes de juzgar nada ──────────
  const incompleta = hechas.length > 0 && hechas.length < (caso.pasadas ?? hechas.length);
  if (hechas.length === 0) {
    razon(TODO, `ninguna pasada ejecutable de ${marcas.length}: ${marcas.map(m => m.motivo).filter(Boolean).join(' · ') || 'sin resultados'}`);
  } else if (incompleta) {
    razon(CERO, `${hechas.length} de ${caso.pasadas} pasadas: una tanda incompleta no da la tasa que el caso declara`);
  }

  const control = caso.elSilencioCuentaSiSoloSi;
  if (control) {
    const logrados = contexto.aciertosPorCaso?.[control.caso];
    if (!logrados || !logrados.has(control.hallazgo)) {
      razon(CERO, `control de tanda NO cumplido: ${control.caso}/${control.hallazgo} no salió en esta tanda, ` +
                  'así que el silencio de este caso no distingue «no inventó» de «no funcionó nada»');
    }
  }

  // ⚠️ Hoy no la puede dar nadie: nadie pasa `candidatosJuzgados` (B.292).
  const denom = caso.denominadorObligatorio;
  if (denom && typeof contexto.candidatosJuzgados === 'number' &&
      contexto.candidatosJuzgados < denom.minimoParaQueElCeroValga) {
    razon(CERO, `${contexto.candidatosJuzgados} candidatos juzgados y el caso exige ${denom.minimoParaQueElCeroValga}: ` +
                'un cero con menos es trivialmente cierto');
  }

  const sinMecanica = reglasNoMecanicas(caso);
  if (sinMecanica.length > 0) {
    razon(PARTE, `regla(s) que el marcador no sabe aplicar y necesitan etiqueta humana: ${sinMecanica.join(', ')}`);
  }

  // Fase 2 del detector: dentro de una excepción, el acierto del OTRO detector.
  // Nunca un falso: un contenido verdadero no se cuenta como invención. Es TODO
  // porque la excepción es de un caso cuya PRECONDICIÓN desmiente el otro
  // detector (P4, B.290). N1 y P3 la llevan hasta la fase 3, que se la retira.
  const otros = new Map();
  for (const m of hechas) for (const o of m.otroDetector ?? []) {
    const previo = otros.get(o.id);
    otros.set(o.id, { ...o, pasadas: (previo?.pasadas ?? 0) + 1 });
  }
  for (const o of otros.values()) {
    razon(TODO, `${o.id}: ${DEJO_DE_EJERCER} — lo encontró ${o.detector ?? 'un detector desconocido'} en ` +
                `${o.pasadas}/${hechas.length} pasada(s), y el caso exige ${o.exigido} («${o.motivo}»)`);
  }

  // SEGUIMIENTO: la mitad declarada mide y no juzga. Las dos, el caso entero.
  const enSeguimiento = mitadesEnSeguimiento(caso);
  if (enSeguimiento.size === MITADES.length) razon(TODO, 'SEGUIMIENTO: el caso mide y no juzga');
  const seguimiento = [...enSeguimiento].map(m =>
    `${m} en SEGUIMIENTO (${claseDeSeguimiento(caso, m)}): mide y no juzga`);

  const hay = clase => razones.some(r => r.clase === clase);

  // ── 2 · Se juzga salvo con una razón TODO; con una CERO, sólo los excesos ──
  const fallos = [];
  const excesos = new Set();
  if (!hay(TODO)) {
    if (!enSeguimiento.has('cobertura')) fallos.push(...estabilidad.fallos);
    if (!enSeguimiento.has('precision')) {
      if (typeof umbral.maximoDeFalsosConfirmados === 'number' && maxFalsos > umbral.maximoDeFalsosConfirmados) {
        const t = `${maxFalsos} falsos en una pasada y el techo es ${umbral.maximoDeFalsosConfirmados}`;
        fallos.push(t);
        excesos.add(t);
      }
      for (const t of juzgarFrecuencias(caso, hechas, incompleta ? caso.pasadas : hechas.length)) {
        fallos.push(t);
        excesos.add(t);
      }
    }
  }
  let estructura;
  if (caso.esperadoEstructural && hechas.length > 0) {
    const j = juzgarEstructura(umbral, hechas.map(m => m.estructura));
    estructura = j.peor;
    if (!hay(TODO)) {
      fallos.push(...j.fallos);
      for (const t of j.excesos) excesos.add(t);
    }
  }
  // Fase 3: la alarma del detector. Un PERDIDO es un hecho medido en una pasada
  // —el determinista no emitió lo que otro sí encontró—, no una ausencia: sale
  // también con una razón CERO.
  const vigilancia = juzgarVigilancia(hechas);
  if (!hay(TODO)) for (const t of vigilancia.fallos) { fallos.push(t); excesos.add(t); }
  const juzgados = hay(CERO) ? fallos.filter(t => excesos.has(t)) : fallos;

  // ⚠️ EL ORDEN IMPORTA: un caso ilegible (TODO) no da veredicto ni para mal.
  // Después, un fallo medido es FALLA aunque haya razones CERO o PARTE. Y si no
  // hay fallo, cualquier razón deja el caso SIN_VEREDICTO: no se ha comprobado todo.
  // El «repetir 5 más» de la estabilidad va DESPUÉS de FALLA: no es un caso
  // ilegible, es un esperado dudoso, y no puede tapar la alarma de otro.
  const repetir = razones.length === 0 && !enSeguimiento.has('cobertura') ? estabilidad.razones : [];
  const estado = hay(TODO) ? SIN_VEREDICTO
    : juzgados.length > 0 ? FALLA
      : razones.length > 0 || repetir.length > 0 ? SIN_VEREDICTO : PASA;
  return {
    casoId: caso.id, estado, razones: [...razones.map(r => r.texto), ...repetir], fallos: juzgados,
    totalAciertos, maxFalsos, marcas, seguimiento, ausenciasCalladas: hay(CERO) && !hay(TODO),
    avisosDeDetector: vigilancia.avisos,
    // El contador sólo existe donde hay una base que vigilar (`alarma-de-detector.mjs`).
    ...(tieneBase(caso) ? { aciertosSinDetectorEnElOrigen: vigilancia.sinDetector } : {}),
    estabilidad: { porEsperado: estabilidad.porEsperado, inestables: estabilidad.inestables },
    ...(estructura ? { estructura } : {}),
  };
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
