import {
  CLAVES_DE_UMBRAL_QUE_LEE,
  CLAVES_ESTRUCTURALES,
  esFilaPorJuicio,
  esTabular,
  ESPECIES,
  ESTADOS_DE_UMBRAL_QUE_LEE,
  REGLAS_MECANICAS,
  SEVERIDADES_QUE_LEE,
  sabeEmparejar,
} from './marcador.mjs';

/**
 * ¿SABE EL MARCADOR LEER LO QUE ESTE CASO ESPERA? (27/09/2026)
 *
 * La primera tanda del examen (`c39397e7`) dio tres pantallas apagadas: N1
 * acertó cinco de cinco y salió FALLA porque su esperado no tenía con qué
 * emparejarse; P3 salió PASA con cuatro umbrales que el marcador no lee; y los
 * avisos de N4 y N5 colgaban de ese acierto de N1 que no se podía contar.
 * **Las tres pantallas apagadas de hoy las habría parado antes de gastar un
 * crédito.**
 *
 * FALLA CERRADO: toda clave de un caso está clasificada abajo como LEÍDA,
 * DOCUMENTAL o EXPECTATIVA SIN COMPARADOR. Una clave sin clasificar es un
 * problema, porque no se sabe si alguien cuenta con que se compruebe.
 *
 * `contextoSuministrado`: lo que el ejecutor le pasa al marcador en `contexto`
 * (hoy nada). Un caso que necesite algo que no llega se caza aquí.
 */

// ── Clasificación por capacidad ────────────────────────────────────────────

/** Nivel del caso: lo leen el ejecutor, el marcador o la validación de forma. */
const RAIZ_LEIDA = new Set([
  'fichero', 'id', 'nivel', 'analizado', 'corpusExacto', 'modo', 'pasadas',
  'debenSalir', 'noDebenSalir', 'umbralDeAlarma', 'elSilencioCuentaSiSoloSi',
  'lineaDeBase', 'denominadorObligatorio', 'extras', 'siApareceOtraAlarma',
  'esperadoEstructural',
]);
/** Nivel del caso: notas para quien lo lee. No piden nada al resultado. */
const RAIZ_DOCUMENTAL = new Set([
  'recall', 'loQueRealmenteMide', 'discrepanciaAbierta', 'reglaDeEmparejamiento',
  'discriminantesMedidos', 'consistenteVerificado', 'coartadaJerarquica',
  'cerosQueNoSonDelCamino', 'fragilidadDeclarada',
]);
/** Nivel del caso: piden algo al resultado y nadie lo comprueba. */
/** Nivel del caso: repiten en prosa lo que un umbral estructural mide. Valen
 *  sólo si ese umbral está; sin él, no los comprueba nadie. */
const RAIZ_CUBIERTA_POR_UMBRAL = {
  exigeNombrarLaColumna: 'discrepantesConColumnaCorrectaMinimo',
  falloSiFuerzaPareja: 'sinParejaForzadaMaximo',
};
const RAIZ_SIN_COMPARADOR = {
  criterioDeAcierto: 'el marcador sólo empareja por discriminante o por columna y valores',
  precondicion: 'ni el ejecutor ni el endpoint la comprueban: el caso no aborta aunque no se cumpla',
};

const UMBRAL_DOCUMENTAL = new Set(['nota', 'esTrinquete']);

const ESPERADO_LEIDO = new Set(['id', 'citaEnElAnalizado', 'citaEnElCorpus', 'cuentaParaElUmbral', 'documentoEnElCorpus']);
const ESPERADO_DOCUMENTAL = new Set([
  'sembrada', 'superficie', 'tema', 'descubierta', 'noConfundirCon', 'coartadaEnLaCita',
  'pendienteConocido', 'pendienteRelacionado', 'fragmentoEsperado', 'siNoSale', 'rama',
  'horasCoinciden', 'persona',
]);
/** Una expectativa TABULAR: se cumple por columna y valores, no por cita. */
const ESPERADO_TABULAR = new Set(['columnaEnOposicion', 'enElAnalizado', 'enElCorpus', 'anclaEsperada', 'columnasAsimetricas']);
const TABULAR_LEIDO = new Set(['columnaEnOposicion', 'enElAnalizado', 'enElCorpus']);
const FILA_POR_JUICIO_LEIDO = new Set(['enElAnalizado', 'enElCorpus']);
/** Claves con valor: se aceptan sólo si el valor coincide con lo que el marcador ya hace. */
const ESPERADO_CON_VALOR = new Set(['severidadMinima', 'confirmadoPorEsperado', 'etiquetasAceptadas']);

const FALSO_LEIDO = new Set(['id', 'regla', 'cuentaComoFallo', 'citaEnElAnalizado', 'citaEnElCorpus', 'patronDeF22', 'lineaDeBase']);
const FALSO_DOCUMENTAL = new Set([
  'pendienteDeOrigen', 'temaEspurio', 'estado', 'descripcion', 'porQueNoEsContradiccion',
  'procedenciaDeLaCita', 'fragmentoDondeVive', 'tema', 'ancla', 'clasificacion', 'alcance',
]);
/** «Si aparece otra cosa, a etiqueta humana»: es lo que el marcador ya hace
 *  con lo que no empareja (lo deja en `extras`, sin contarlo). */
const DERIVA_A_ETIQUETA = 'MARCAR_PARA_ETIQUETA_HUMANA';
const FALSO_DERIVACION = new Set(['siApareceConOtroEmpleado', 'siApareceConOtrasCitas']);

const CITA = new Set(['literal', 'discriminante']);

/** Lo que el marcador hace con los extras: no contarlos. Cualquier otra promesa no se cumple. */
const EXTRAS_QUE_LEE = new Set(['PENDIENTE_DE_ETIQUETA']);

// ────────────────────────────────────────────────────────────────────────────

function clavesSinClasificar(obj, ...conjuntos) {
  return Object.keys(obj ?? {}).filter(k => !conjuntos.some(s => (s instanceof Set ? s.has(k) : k in s)));
}

function citasSinClasificar(h) {
  return ['citaEnElAnalizado', 'citaEnElCorpus']
    .flatMap(lado => (h[lado] ? clavesSinClasificar(h[lado], CITA).map(k => `${lado}.${k}`) : []));
}

export function validarLoQueElMarcadorLee(casos, { contextoSuministrado = new Set() } = {}) {
  const problemas = [];
  const porId = new Map(casos.map(c => [c.id, c]));

  for (const c of casos) {
    const donde = `${c.fichero} (${c.id ?? 'SIN ID'})`;
    const p = m => problemas.push(`${donde}: ${m}`);

    // ── la raíz ──
    for (const [k, porque] of Object.entries(RAIZ_SIN_COMPARADOR)) {
      if (k in c) p(`\`${k}\` pide algo al resultado y ${porque}`);
    }
    for (const [k, umbralQueLoMide] of Object.entries(RAIZ_CUBIERTA_POR_UMBRAL)) {
      if (k in c && typeof c.umbralDeAlarma?.[umbralQueLoMide] !== 'number') {
        p(`\`${k}\` pide algo al resultado y sólo lo mide \`${umbralQueLoMide}\`, que el umbral no trae`);
      }
    }
    for (const k of clavesSinClasificar(c, RAIZ_LEIDA, RAIZ_DOCUMENTAL, RAIZ_SIN_COMPARADOR, RAIZ_CUBIERTA_POR_UMBRAL)) {
      p(`clave \`${k}\` sin clasificar: no se sabe si alguien cuenta con que se compruebe`);
    }
    const estructurales = Object.keys(c.umbralDeAlarma ?? {}).filter(k => CLAVES_ESTRUCTURALES.has(k));
    if (estructurales.length && !c.esperadoEstructural) {
      p(`umbrales estructurales (${estructurales.join(', ')}) sin \`esperadoEstructural\` contra el que medirlos`);
    }
    if (c.esperadoEstructural && !estructurales.length) {
      p('`esperadoEstructural` sin ningún umbral estructural: nadie lo compara');
    }
    if (c.extras !== undefined && !EXTRAS_QUE_LEE.has(c.extras)) {
      p(`\`extras: '${c.extras}'\` y el marcador no cuenta los extras: los deja sin etiqueta`);
    }
    if (c.siApareceOtraAlarma !== undefined && c.siApareceOtraAlarma !== DERIVA_A_ETIQUETA) {
      p(`\`siApareceOtraAlarma: '${c.siApareceOtraAlarma}'\` no es una derivación que el marcador sepa hacer`);
    }
    if (c.denominadorObligatorio && !contextoSuministrado.has('candidatosJuzgados')) {
      p('declara `denominadorObligatorio` y el ejecutor no le pasa `candidatosJuzgados` al marcador: ' +
        'el cero se leería sin denominador');
    }

    // ── el umbral ──
    const umbral = c.umbralDeAlarma ?? {};
    const ajenas = clavesSinClasificar(umbral, CLAVES_DE_UMBRAL_QUE_LEE, UMBRAL_DOCUMENTAL);
    if (ajenas.length) p(`el umbral tiene claves que el marcador no sabe leer: ${ajenas.join(', ')}`);
    if (umbral.estado !== undefined && !ESTADOS_DE_UMBRAL_QUE_LEE.has(umbral.estado)) {
      p(`el umbral declara el estado '${umbral.estado}', que el marcador no conoce`);
    }

    // ── lo que debe salir ──
    for (const h of c.debenSalir ?? []) {
      const d = `${h.id ?? 'SIN ID'}`;
      const cuenta = h.cuentaParaElUmbral !== false;
      // Lo que lee cada comparador de fila; el resto de claves tabulares, nadie.
      const leidas = esTabular(h) ? TABULAR_LEIDO : esFilaPorJuicio(h) ? FILA_POR_JUICIO_LEIDO : new Set();
      const tabulares = Object.keys(h).filter(k => ESPERADO_TABULAR.has(k) && !leidas.has(k));
      if (cuenta && !sabeEmparejar(h, c)) {
        p(`${d} cuenta para el umbral y el marcador no puede emparejarlo: le faltan discriminantes` +
          (tabulares.length ? ` (es tabular: ${tabulares.join(', ')}; el comparador tabular exige ` +
            "columnaEnOposicion, enElAnalizado, enElCorpus y confirmadoPorEsperado: 'estructura', y el de " +
            "fila por juicio persona, enElAnalizado, enElCorpus y confirmadoPorEsperado: 'juicio')" : '') +
          '. Un acierto saldría como fallo');
      } else if (tabulares.length) {
        p(`${d}: claves tabulares (${tabulares.join(', ')}) que ningún comparador lee` +
          (esFilaPorJuicio(h) ? ': el juez no nombra la columna, así que se empareja la fila sin comprobarla' : ''));
      }
      if (h.severidadMinima !== undefined && !SEVERIDADES_QUE_LEE.has(h.severidadMinima)) {
        p(`${d}: \`severidadMinima: '${h.severidadMinima}'\` y el marcador sólo juzga contradicciones`);
      }
      if (h.confirmadoPorEsperado !== undefined && h.confirmadoPorEsperado !== 'cualquiera' &&
          !esTabular(h) && !esFilaPorJuicio(h)) {
        p(`${d}: \`confirmadoPorEsperado: '${h.confirmadoPorEsperado}'\` y el marcador no mira quién confirmó`);
      }
      const ajenas = (h.etiquetasAceptadas ?? []).filter(x => !ESPECIES.has(x));
      if (ajenas.length) {
        p(`${d}: \`etiquetasAceptadas\` con especies que el marcador no conoce: ${ajenas.join(', ')}`);
      }
      for (const k of [...clavesSinClasificar(h, ESPERADO_LEIDO, ESPERADO_DOCUMENTAL, ESPERADO_TABULAR, ESPERADO_CON_VALOR), ...citasSinClasificar(h)]) {
        p(`${d}: clave \`${k}\` sin clasificar`);
      }
    }

    // ── lo que no debe salir ──
    for (const f of c.noDebenSalir ?? []) {
      const d = `${f.id ?? 'SIN ID'}`;
      // Una regla no mecánica ya sale en voz alta como SIN_VEREDICTO: no es una pantalla apagada.
      if (f.cuentaComoFallo !== false && !f.regla && !sabeEmparejar(f, c)) {
        p(`${d} cuenta como fallo y el marcador no puede emparejarlo: nunca sumaría un falso`);
      }
      for (const k of FALSO_DERIVACION) {
        if (k in f && f[k] !== DERIVA_A_ETIQUETA) p(`${d}: \`${k}: '${f[k]}'\` no es una derivación que el marcador sepa hacer`);
      }
      for (const k of [...clavesSinClasificar(f, FALSO_LEIDO, FALSO_DOCUMENTAL, FALSO_DERIVACION), ...citasSinClasificar(f)]) {
        p(`${d}: clave \`${k}\` sin clasificar`);
      }
    }

    // ── el control de tanda ──
    const control = c.elSilencioCuentaSiSoloSi;
    if (control) {
      const otro = porId.get(control.caso);
      const esperado = otro?.debenSalir?.find(h => h.id === control.hallazgo);
      if (otro && !esperado) {
        p(`su control de tanda apunta a ${control.caso}/${control.hallazgo}, que no existe en ${control.caso}`);
      } else if (esperado && !sabeEmparejar(esperado, otro)) {
        p(`su control de tanda depende de ${control.caso}/${control.hallazgo}, que el marcador no sabe ` +
          'emparejar: el aviso de «control no cumplido» saldría aunque el sistema acierte');
      }
    }

    // ── un caso sin nada que el marcador lea sólo puede salir PASA ──
    const leeAlgo = (c.debenSalir ?? []).some(h => h.cuentaParaElUmbral !== false && sabeEmparejar(h, c)) ||
      (c.noDebenSalir ?? []).some(f => f.cuentaComoFallo !== false && (REGLAS_MECANICAS.has(f.regla) || sabeEmparejar(f, c))) ||
      Boolean(c.esperadoEstructural && estructurales.length);
    if (!leeAlgo) p('no tiene ninguna expectativa que el marcador sepa comprobar: sólo puede salir PASA o SIN_VEREDICTO');
  }
  return problemas;
}
