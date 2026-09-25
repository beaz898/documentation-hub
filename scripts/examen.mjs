import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  MEDIBLE,
  verificarDiscriminantesEnFragmentos,
} from '../lib/examen/discriminantes.mjs';

/**
 * EL EJECUTOR DEL EXAMEN (25/09/2026).
 *
 * El nivel de extremo a extremo del arnés de F-117 P1: corre los casos de
 * `examen/casos/` contra el pipeline real, compara con lo esperado y produce un
 * informe que el director pueda leer sin abrir un log.
 *
 * ⚠️ POR QUÉ ESTO NO ES UN TEST DE VITEST, y no es una excusa: el alcance está
 * declarado en `claude/Protocolo_Harness_Tasas.md:748-795` y en
 * `vitest.config.mts` desde el 27/08/2026. «NO se testean aquí … nada que
 * necesite Supabase, Pinecone o Anthropic, ni MOCKS de ninguno de los tres. Para
 * lo que necesita estado real hay endpoints de diagnóstico … Para lo que lee un
 * modelo hay TANDAS.» Este script lanza una tanda. Lo determinista —el
 * comparador, el cuadre, el emparejamiento por discriminante— vive en vitest,
 * donde se puede falsar sin gastar un céntimo.
 *
 * ⚠️ POR DEFECTO NO GASTA NADA. Hace falta `--lanzar` explícito. Es la regla de
 * fallar CERRADO (F-95 P3): un ejecutor que gaste créditos por descuido de quien
 * teclea es un ejecutor mal diseñado, y aquí una pasada son 100 créditos.
 *
 * Uso:
 *   node scripts/examen.mjs                      # seco: valida y declara coste
 *   node scripts/examen.mjs --caso P1            # seco, un solo caso
 *   node scripts/examen.mjs --lanzar             # gasta de verdad
 *   node scripts/examen.mjs --lanzar --caso P2
 *
 * Variables de entorno necesarias SÓLO para --lanzar (por NOMBRE, nunca su
 * valor): EXAMEN_URL_BASE y EXAMEN_TOKEN_ADMIN.
 */

// ---------------------------------------------------------------------------
// Constantes con su procedencia. Ninguna cifra sin medición detrás.
// ---------------------------------------------------------------------------

/** Créditos de un análisis rápido. `CLAUDE.md`, tabla de endpoints. */
const CREDITOS_POR_ANALISIS = 5;

/** Coste LLM mediano de un análisis rápido, en dólares. MEDIDO sobre
 *  `llm_usage`, n=614, reportado en la consulta F-117 §2. No es una estimación:
 *  es la mediana de los análisis rápidos registrados. */
const DOLARES_POR_ANALISIS = 0.0045;

const DIR_CASOS = 'examen/casos';
const DIR_RESULTADOS = 'examen/resultados';

// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const LANZAR = argv.includes('--lanzar');
const soloCaso = (() => {
  const i = argv.indexOf('--caso');
  return i === -1 ? null : argv[i + 1];
})();

function commitActual() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'sin-git';
  }
}

/**
 * ⚠️ EXPORTADAS EL 25/09/2026 PARA QUE LA VALIDACIÓN TENGA BATERÍA, y el motivo
 * va aquí y no en el commit: `validarCasos` es código puro —entra un objeto,
 * sale una lista de problemas— y hasta hoy **no tenía ni un caso de prueba**.
 * Una regla de validación sin batería es una regla que nadie puede falsar, que
 * es exactamente lo que este examen existe para no hacer.
 *
 * Su batería es `scripts/examen-validacion.test.mjs`, y `main()` pasa a correr
 * SÓLO cuando el fichero se invoca directamente (ver el final) — sin eso,
 * importarlo desde un test lanzaría el ejecutor.
 */
export async function cargarCasos() {
  const ficheros = readdirSync(DIR_CASOS).filter(f => f.endsWith('.mjs')).sort();
  const casos = [];
  for (const f of ficheros) {
    /**
     * ⚠️ LA RUTA VA LITERAL Y LA EXTENSIÓN FUERA DE LA INTERPOLACIÓN, aunque
     * `DIR_CASOS` diga lo mismo tres líneas arriba. No es un despiste: con
     * `` import(`../${DIR_CASOS}/${f}`) `` el analizador de vite no puede ver
     * qué se importa y avisa en CADA pasada de la batería —«a file extension
     * must be included in the static part of the import»—. Funcionaba, pero
     * dejaba un aviso fijo en la salida de los tests, y el ruido entrena a
     * ignorar la luz.
     * Las dos apariciones de la carpeta se mantienen a mano porque son de
     * naturaleza distinta: una la lee `readdirSync` en ejecución y la otra la
     * tiene que ver un analizador estático. Si se mueve la carpeta, se mueven
     * las dos — y este comentario es lo que hace que un `grep` las encuentre.
     */
    const mod = await import(`../examen/casos/${f.replace(/\.mjs$/, '')}.mjs`);
    casos.push({ fichero: f, ...mod.default });
  }
  return soloCaso ? casos.filter(c => c.id === soloCaso) : casos;
}

// ---------------------------------------------------------------------------
// VALIDACIÓN DE LOS CASOS — pura, y corre siempre, también antes de --lanzar.
// ⚠️ Un caso mal escrito gasta créditos y devuelve un marcador sin sentido, así
// que se valida ANTES de pagar. Es F-104: la vía de reparación va primero.
// ---------------------------------------------------------------------------

export function validarCasos(casos) {
  const problemas = [];
  const idsVistos = new Set();

  for (const c of casos) {
    const donde = `${c.fichero} (${c.id ?? 'SIN ID'})`;
    if (!c.id) problemas.push(`${donde}: sin id`);
    if (idsVistos.has(c.id)) problemas.push(`${donde}: id repetido`);
    idsVistos.add(c.id);

    if (!c.analizado) problemas.push(`${donde}: sin documento analizado`);
    if (!Array.isArray(c.corpusExacto) || c.corpusExacto.length === 0) {
      // ⚠️ Es el mismo motivo por el que `buildCorpusExacto` lanza con lista
      // vacía: un corpus vacío da cero candidatos, y el informe escribiría «no
      // detectó nada» — un cero de montaje disfrazado de cero de detección.
      problemas.push(`${donde}: corpusExacto vacío. Un examen sin corpus daría un cero indistinguible de un fallo de detección`);
    }
    if (!c.pasadas || c.pasadas < 1) problemas.push(`${donde}: sin pasadas`);

    // Los casos de prosa emparejan por DISCRIMINANTE (decisión del director del
    // 25/09). Sin él, el marcador puede apuntar un hallazgo a la expectativa
    // equivocada y salir verde por casualidad.
    for (const h of c.debenSalir ?? []) {
      if (!h.id) problemas.push(`${donde}: un esperado sin id`);
      if (c.nivel === 'juez-prosa') {
        if (!h.citaEnElAnalizado?.discriminante) problemas.push(`${donde}/${h.id}: falta discriminante en el analizado`);
        if (!h.citaEnElCorpus?.discriminante) problemas.push(`${donde}/${h.id}: falta discriminante en el corpus`);
      }
    }

    // El umbral no puede exigir más aciertos de los que el caso declara como
    // contables: eso sería un rojo permanente, y «el ruido nos entrena a
    // ignorar la luz» (director, 25/09/2026).
    const contables = (c.debenSalir ?? []).filter(h => h.cuentaParaElUmbral !== false).length;
    const minimo = c.umbralDeAlarma?.minimoDeAciertos;
    if (typeof minimo === 'number' && minimo > contables) {
      problemas.push(`${donde}: el umbral exige ${minimo} aciertos y sólo ${contables} cuentan para el umbral`);
    }

    problemas.push(...validarElTechoDeFalsos(c, donde));
  }
  return problemas;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NO SE PUEDE ESCRIBIR UN TECHO QUE NO SE HA MEDIDO (aprobado el 25/09/2026).
 *
 * El techo de falsos de un caso responde a UNA pregunta —«¿cuántas veces
 * aparecía este falso?»— y ésa es una pregunta sobre una FRECUENCIA. Si nadie la
 * midió, cualquier número es inventado: **0 pone el caso en rojo el primer día
 * por algo que a lo mejor era su comportamiento normal, y un número alto no avisa
 * nunca.** Sin esta regla, el estado `LINEA_DE_BASE_PENDIENTE` sería una nota que
 * cualquiera puede contradecir en la línea de al lado sin que nada se queje.
 *
 * ⚠️ LA DISTINCIÓN QUE LA HACE APLICABLE, Y SALIÓ DE MEDIRLA CONTRA LOS DIEZ
 * CASOS REALES ANTES DE ESCRIBIRLA. La primera redacción decía «prohibido un
 * techo numérico donde `lineaDeBase.aciertos` sea null», y **habría tumbado P4**,
 * que es un caso legítimo. La razón es que hay DOS ESPECIES en `noDebenSalir` y
 * sólo una lleva frecuencia:
 *
 *   · **UN FALSO CONOCIDO** (lleva `patronDeF22`): apareció antes, así que su
 *     techo es una FRECUENCIA MEDIDA o no es nada.
 *   · **UNA REGLA** (lleva `regla`): «ningún hallazgo sobre las otras doce»,
 *     «ninguna contradicción en absoluto». No nombra ninguna aparición pasada:
 *     su techo no es una frecuencia, es una EXIGENCIA, y una exigencia puede ser
 *     0 el primer día.
 *
 * Por eso N2 y P4 conservan su 0 y N3, N4 y N5 no pueden tener número.
 *
 * LAS TRES MITADES, y las tres tienen que estar o la regla se puede rodear:
 *   1. falso conocido SIN frecuencia  → el techo tiene que ser `null` + estado.
 *   2. estado `LINEA_DE_BASE_PENDIENTE` → el techo tiene que ser `null`.
 *      (Sin ésta, se declara pendiente y se pone número al lado.)
 *   3. todos los falsos conocidos CON frecuencia → el techo NO puede ser `null`.
 *      (Sin ésta, un caso ya medido se esconde para siempre detrás del estado, y
 *      el trinquete nunca empieza.)
 *
 * ⚠️ Y SU CASO DECISIVO NO ESTÁ AQUÍ: está en `examen-validacion.test.mjs`, con
 * un caso sintético que viola cada mitad y los diez casos reales como control
 * positivo. Hoy la regla **no caza ninguno de los diez**, y eso sólo se puede
 * leer como bueno si existe la prueba de que sabe cazar — si no, es un número
 * que decora.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function validarElTechoDeFalsos(c, donde) {
  const problemas = [];
  const umbral = c.umbralDeAlarma ?? {};
  const techo = umbral.maximoDeFalsosConfirmados;
  const hayTecho = typeof techo === 'number';
  const pendiente = umbral.estado === 'LINEA_DE_BASE_PENDIENTE';

  // Un falso CONOCIDO que cuenta como fallo. `cuentaComoFallo !== false` y no
  // `=== true` a propósito: el defecto de omitirlo es contarlo, que es el lado
  // seguro; declararlo `false` es una decisión explícita (N1-NURIA).
  const falsosConocidos = (c.noDebenSalir ?? [])
    .filter(h => h.patronDeF22 && h.cuentaComoFallo !== false);
  const sinFrecuencia = falsosConocidos
    .filter(h => !h.lineaDeBase?.aparicionesSobrePasadas);

  // ⚠️ UNA ESPECIE POR NOMBRE: el campo se llama `cuentaComoFallo` y en P4 se
  // escribió `cuentaComoFalso`. Dos grafías del mismo campo no se mantienen
  // sincronizadas: el día que alguien lea una, la otra deja de contar en
  // silencio. Se caza aquí para que no puedan volver a ser dos.
  for (const h of [...(c.noDebenSalir ?? []), ...(c.debenSalir ?? [])]) {
    if ('cuentaComoFalso' in h) {
      problemas.push(
        `${donde}/${h.id}: el campo es \`cuentaComoFallo\`, no \`cuentaComoFalso\`. ` +
        `Dos grafías del mismo campo se separan y nadie se entera.`);
    }
  }

  if (sinFrecuencia.length > 0 && hayTecho) {
    problemas.push(
      `${donde}: techo de falsos ${techo} con ${sinFrecuencia.length} falso(s) ` +
      `conocido(s) SIN frecuencia medida (${sinFrecuencia.map(h => h.id).join(', ')}). ` +
      `Un techo es una frecuencia: si no se midió, va \`maximoDeFalsosConfirmados: null\` ` +
      `y \`estado: 'LINEA_DE_BASE_PENDIENTE'\`. El primer número lo escribe la primera tanda.`);
  }

  if (sinFrecuencia.length > 0 && !pendiente) {
    problemas.push(
      `${donde}: hay falso(s) conocido(s) sin frecuencia medida y el umbral no ` +
      `declara \`estado: 'LINEA_DE_BASE_PENDIENTE'\`. El estado no es adorno: es lo ` +
      `que impide que el informe lea el resultado como un veredicto.`);
  }

  if (pendiente && hayTecho) {
    problemas.push(
      `${donde}: el umbral se declara LINEA_DE_BASE_PENDIENTE y a la vez pone un ` +
      `techo de ${techo}. Una de las dos cosas miente.`);
  }

  if (falsosConocidos.length > 0 && sinFrecuencia.length === 0 && techo === null) {
    problemas.push(
      `${donde}: todos los falsos conocidos tienen frecuencia medida ` +
      `(${falsosConocidos.map(h => h.id).join(', ')}) y el techo sigue en \`null\`. ` +
      `Con la medición hecha, el techo se escribe en el MÁXIMO OBSERVADO y de ahí ` +
      `sólo puede bajar. Dejarlo en null es esconder un caso ya medido.`);
  }

  return problemas;
}

/**
 * ⚠️ PRE-COMPROBACIÓN DÉBIL, Y HAY QUE SABER QUÉ NO CUBRE (25/09/2026).
 *
 * Cuenta cada discriminante sobre el TEXTO DEL `.docx`: una vez en su documento
 * y cero en el otro. Sirve para escribir un caso y para pillar una errata sin
 * gastar nada — **pero NO es la comprobación que decide.**
 *
 * Lo que NO cubre, dicho por Fable el 25/09: «si el trozado parte una frase
 * discriminante en dos fragmentos, el juez no puede citarla aunque acierte».
 * Esto mide el DOCUMENTO; lo que el juez cita son FRAGMENTOS. Una frase puede
 * aparecer una vez en el `.docx` y estar partida por una costura, y esta función
 * la daría por buena.
 *
 * ⚠️ LA QUE DECIDE ES `verificarDiscriminantesEnFragmentos`, de
 * `lib/examen/discriminantes.mjs`, y corre EN CADA PASADA contra los fragmentos
 * que devuelve el endpoint. Esta de aquí se queda porque es gratis y no necesita
 * credenciales; su etiqueta en el informe dice «débil» a propósito.
 *
 * ⚠️ Y SI NO SE PUEDE LEER EL DOCUMENTO, **NO PASA EN SILENCIO**: se declara sin
 * verificar. Una comprobación que se salta a sí misma cuando falla la
 * herramienta es la que pasó en B.126.
 */
function preComprobarSobreElDocumento(caso) {
  const texto = ruta => {
    const xml = execFileSync('unzip', ['-p', `corpus-pruebas/${ruta}`, 'word/document.xml'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]*>/g, '');
  };

  let analizado, corpus;
  try {
    analizado = texto(caso.analizado);
    corpus = texto(caso.corpusExacto[0]);
  } catch (err) {
    return { verificado: false, motivo: `no se pudo extraer el texto: ${err.message}`, fallos: [] };
  }

  const cuenta = (t, s) => t.split(s).length - 1;
  const fallos = [];
  for (const h of caso.debenSalir ?? []) {
    for (const [lado, cita, propio, ajeno] of [
      ['analizado', h.citaEnElAnalizado, analizado, corpus],
      ['corpus', h.citaEnElCorpus, corpus, analizado],
    ]) {
      const d = cita?.discriminante;
      if (!d) continue;
      const enPropio = cuenta(propio, d);
      const enAjeno = cuenta(ajeno, d);
      if (enPropio !== 1 || enAjeno !== 0) {
        fallos.push(`${h.id}/${lado}: "${d}" → ${enPropio} en su documento, ${enAjeno} en el otro (se exige 1 y 0)`);
      }
    }
  }
  return { verificado: true, motivo: null, fallos };
}

// ---------------------------------------------------------------------------
// LA PASADA — una llamada al endpoint del examen.
// ---------------------------------------------------------------------------

function credenciales() {
  const base = process.env.EXAMEN_URL_BASE;
  const token = process.env.EXAMEN_TOKEN_ADMIN;
  if (!base || !token) {
    throw new Error('faltan EXAMEN_URL_BASE y/o EXAMEN_TOKEN_ADMIN en el entorno');
  }
  return { base, token };
}

async function llamarAlEndpoint(cuerpo) {
  const { base, token } = credenciales();
  const t0 = Date.now();
  const res = await fetch(`${base}/api/admin/examen`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  let json;
  try { json = JSON.parse(texto); } catch { json = texto; }
  return { ok: res.ok, http: res.status, ms: Date.now() - t0, json };
}

/**
 * ⚠️ LOS FRAGMENTOS, ANTES DE GASTAR Y SIN GASTAR. Es la operación de LECTURA
 * del endpoint: devuelve los fragmentos de la generación activa de los
 * documentos del caso —**los mismos que el análisis va a leer**, decisión 1 del
 * camino B— sin llamar a ningún modelo y sin consumir créditos.
 *
 * Por eso la verificación puede correr ANTES del análisis y el caso puede
 * ABORTAR sin haber pagado los 5 créditos.
 */
async function pedirFragmentos(caso) {
  const r = await llamarAlEndpoint({
    operacion: 'fragmentos',
    casoId: caso.id,
    analizado: caso.analizado,
    corpusExacto: caso.corpusExacto,
  });
  if (!r.ok) throw new Error(`HTTP ${r.http} pidiendo fragmentos de ${caso.id}`);
  return r.json?.fragmentosPorDocumento ?? null;
}

/**
 * ⚠️ EL CRUDO GUARDA `chunkIndex` + HASH, NUNCA EL TEXTO. Decisión del director
 * del 25/09/2026: «el resultado crudo guarda chunkIndex + hash del texto, y la
 * comprobación se hace en memoria».
 *
 * La razón se escribe hoy porque hoy no cuesta nada: los fragmentos son
 * CONTENIDO DE LOS DOCUMENTOS, y `examen/resultados/` se versiona. Con el corpus
 * de pruebas no hay fuga; el día que un caso use un documento de cliente, la
 * regla ya está puesta y nadie tiene que acordarse de cambiarla.
 *
 * El hash sirve además para lo que Fable pide en la procedencia: detectar que
 * un fragmento cambió entre dos pasadas sin tener que guardar su texto.
 */
function huellaDeLosFragmentos(fragmentosPorDocumento) {
  const salida = {};
  for (const [doc, frags] of Object.entries(fragmentosPorDocumento ?? {})) {
    salida[doc] = (frags ?? []).map(f => ({
      chunkIndex: f.chunkIndex,
      caracteres: (f.text ?? '').length,
      hash: createHash('sha256').update(f.text ?? '').digest('hex').slice(0, 16),
    }));
  }
  return salida;
}

async function unaPasada(caso, n, dirSalida) {
  const r = await llamarAlEndpoint({
    operacion: 'analizar',
    analizado: caso.analizado,
    corpusExacto: caso.corpusExacto,
    modo: caso.modo,
    casoId: caso.id,
    pasada: n,
  });
  const crudo = {
    casoId: caso.id,
    pasada: n,
    http: r.http,
    ms: r.ms,
    cuando: new Date().toISOString(),
    cuerpo: r.json,
  };

  // ⚠️ SE ESCRIBE ANTES DE AGREGAR NADA, Y ES LA CONDICIÓN DEL DIRECTOR:
  // «que deje por escrito, en fichero, el resultado crudo de cada pasada antes
  // de agregarlo … nada de borrar evidencia intermedia». Y es además la regla de
  // F-102: la cifra que vale es la que se guarda, no la que se imprime. Si el
  // agregado sorprende, las cinco pasadas están ahí una por una.
  writeFileSync(join(dirSalida, `${caso.id}_pasada${n}.json`), JSON.stringify(crudo, null, 2));

  if (!r.ok) throw new Error(`HTTP ${r.http} en ${caso.id} pasada ${n}`);
  return crudo;
}

// ---------------------------------------------------------------------------
// EL INFORME
// ---------------------------------------------------------------------------

function costeDe(casos) {
  const analisis = casos.reduce((s, c) => s + c.pasadas, 0);
  return {
    analisis,
    creditos: analisis * CREDITOS_POR_ANALISIS,
    dolares: +(analisis * DOLARES_POR_ANALISIS).toFixed(4),
  };
}

function cabecera(casos, commit) {
  const { analisis, creditos, dolares } = costeDe(casos);
  return [
    `EXAMEN · ${new Date().toISOString().slice(0, 10)} · commit ${commit}`,
    `${casos.length} caso(s) · ${analisis} análisis · ${creditos} créditos · ${dolares} $`,
    '',
  ].join('\n');
}

function informeSeco(casos, commit) {
  const lineas = [cabecera(casos, commit), 'MODO SECO — no se ha gastado nada.', ''];

  for (const c of casos) {
    const contables = (c.debenSalir ?? []).filter(h => h.cuentaParaElUmbral !== false);
    const aplazados = (c.debenSalir ?? []).filter(h => h.cuentaParaElUmbral === false);
    lineas.push(`${c.id} · ${c.analizado} contra ${c.corpusExacto.join(', ')}`);
    lineas.push(`    nivel: ${c.nivel} · ${c.pasadas} pasadas`);

    if (c.esperadoEstructural) {
      const e = c.esperadoEstructural;
      lineas.push(`    espera: ${e.identicas.length} idénticas, ${e.discrepantes.length} discrepantes, ` +
                  `${e.soloEnElAnalizado.length} sólo en A, ${e.soloEnElCorpus.length} sólo en B`);
    } else {
      lineas.push(`    espera: ${contables.length} hallazgo(s) que cuentan` +
                  (aplazados.length ? `, y ${aplazados.length} aplazado(s): ${aplazados.map(h => `${h.id} (${h.pendienteConocido})`).join(', ')}` : ''));
    }

    const lb = c.lineaDeBase ?? {};
    lineas.push(lb.aciertos === null || lb.aciertos === undefined
      ? `    línea de base: SIN MEDIR — ${lb.nota ?? 'la primera pasada DESCUBRE'}`
      : `    línea de base: ${lb.aciertos} de ${lb.esperados ?? contables.length} sobre ${lb.commit} (${lb.fecha})`);

    if (c.nivel === 'juez-prosa') {
      const v = preComprobarSobreElDocumento(c);
      if (!v.verificado) lineas.push(`    ⚠️ pre-comprobación SIN HACER: ${v.motivo}`);
      else if (v.fallos.length) {
        lineas.push('    ⚠️ DISCRIMINANTES QUE NO AÍSLAN EN EL DOCUMENTO:');
        for (const f of v.fallos) lineas.push(`         ${f}`);
      } else {
        lineas.push('    ~ pre-comprobación DÉBIL pasada: 1 vez en su documento, 0 en el otro');
        // ⚠️ El aviso va aquí y no en la cabecera para que se lea PEGADO al
        // resultado que podría leerse mal. Un verde de la pre-comprobación no
        // dice que el caso sea medible.
        lineas.push('      ⚠️ NO dice que sea medible: mide el DOCUMENTO, no los');
        lineas.push('         FRAGMENTOS. Una frase puede estar entera en el .docx y');
        lineas.push('         partida por una costura del troceado. Eso sólo se sabe');
        lineas.push('         con los fragmentos, y se comprueba en cada pasada.');
      }
    }
    lineas.push('');
  }

  lineas.push('Para gastar de verdad: node scripts/examen.mjs --lanzar');
  return lineas.join('\n');
}

function informeReal(casos, resultados, commit, dirSalida) {
  const lineas = [cabecera(casos, commit)];
  for (const c of casos) {
    const propias = resultados.filter(r => r.casoId === c.id);
    const fallidas = propias.filter(r => r.error);
    lineas.push(`${c.id} · ${propias.length - fallidas.length} de ${c.pasadas} pasadas completadas` +
                (fallidas.length ? ` · ⚠️ ${fallidas.length} con error` : ''));
    for (const r of propias) {
      lineas.push(`    pasada ${r.pasada}: ${r.error ? `⚠️ ${r.error}` : `HTTP ${r.http} en ${r.ms} ms`}`);
    }
    lineas.push('');
  }
  lineas.push('⚠️ EL MARCADOR NO SE CALCULA TODAVÍA: el comparador es la siguiente');
  lineas.push('   pieza, y vive en vitest porque es determinista. Lo que este');
  lineas.push('   ejecutor garantiza hoy es que las pasadas ocurrieron y que su');
  lineas.push('   resultado CRUDO está guardado, una por una, sin agregar.');
  lineas.push('');
  lineas.push(`Evidencia cruda: ${dirSalida}`);
  return lineas.join('\n');
}

// ---------------------------------------------------------------------------

async function main() {
  const commit = commitActual();
  const casos = await cargarCasos();

  if (casos.length === 0) {
    console.error(soloCaso ? `No hay ningún caso con id ${soloCaso}.` : `No hay casos en ${DIR_CASOS}.`);
    process.exit(1);
  }

  const problemas = validarCasos(casos);
  if (problemas.length) {
    console.error('LOS CASOS NO VALIDAN. No se lanza nada.\n');
    for (const p of problemas) console.error(`  · ${p}`);
    process.exit(1);
  }

  if (!LANZAR) {
    console.log(informeSeco(casos, commit));
    return;
  }

  const dirSalida = join(DIR_RESULTADOS, `${new Date().toISOString().slice(0, 10)}_${commit}`);
  mkdirSync(dirSalida, { recursive: true });

  const { creditos, dolares } = costeDe(casos);
  console.log(cabecera(casos, commit));
  console.log(`LANZANDO. Coste declarado antes de correr: ${creditos} créditos, ${dolares} $.\n`);

  const resultados = [];
  for (const c of casos) {
    for (let n = 1; n <= c.pasadas; n++) {
      try {
        /**
         * ⚠️ LA VERIFICACIÓN VA EN CADA PASADA Y ANTES DE PAGAR, y las dos
         * mitades son requisitos distintos:
         *   · EN CADA PASADA porque «un cambio de trozado lo rompería en
         *     silencio» (Fable, 25/09). Una comprobación al escribir el caso
         *     caduca sin avisar.
         *   · ANTES DE PAGAR porque pedir fragmentos es una lectura y no cuesta
         *     créditos: si el caso no es medible, no tiene sentido gastar 5.
         */
        const fragmentos = await pedirFragmentos(c);
        const v = verificarDiscriminantesEnFragmentos(c, fragmentos);

        if (v.estado !== MEDIBLE) {
          // ⚠️ NO ES ROJO. Es «no medible, arregla el discriminante» — y se
          // guarda como pasada con su motivo, porque una pasada que no ocurrió
          // no puede contarse como una que dio cero.
          const crudo = {
            casoId: c.id,
            pasada: n,
            veredicto: v.estado,
            cuando: new Date().toISOString(),
            comprobados: v.comprobados,
            // Los mensajes van al fichero porque son el diagnóstico; el TEXTO de
            // los fragmentos no, sólo su huella.
            fallos: v.fallos,
            huellaDeLosFragmentos: huellaDeLosFragmentos(fragmentos),
          };
          writeFileSync(join(dirSalida, `${c.id}_pasada${n}.json`), JSON.stringify(crudo, null, 2));

          resultados.push({ casoId: c.id, pasada: n, noMedible: v.estado, fallos: v.fallos });
          console.error(`  ${c.id} pasada ${n}: ⚠️ ${v.estado} — NO se gastan créditos`);
          // Se IMPRIME el detalle (imprimir no es persistir contenido).
          for (const f of v.fallos) console.error(`      ${f.mensaje}`);
          continue;
        }

        const r = await unaPasada(c, n, dirSalida);
        resultados.push({ ...r, discriminantesComprobados: v.comprobados });
        console.log(`  ${c.id} pasada ${n}: HTTP ${r.http} en ${r.ms} ms · ${v.comprobados} discriminantes íntegros`);
      } catch (err) {
        // ⚠️ NO SE ABORTA LA TANDA ENTERA por una pasada, pero el error se
        // GUARDA y se cuenta: una tanda con pasadas perdidas no es una tanda de
        // cinco, y el informe no puede dejar que lo parezca.
        resultados.push({ casoId: c.id, pasada: n, error: err.message });
        console.error(`  ${c.id} pasada ${n}: ⚠️ ${err.message}`);
      }
    }
  }

  const informe = informeReal(casos, resultados, commit, dirSalida);
  writeFileSync(join(dirSalida, 'informe.txt'), informe);
  console.log(`\n${informe}`);
}

/**
 * ⚠️ `main()` SÓLO CUANDO SE INVOCA DIRECTAMENTE. Antes se llamaba al importar el
 * módulo, así que cualquier test que quisiera probar `validarCasos` habría
 * lanzado el ejecutor entero — y con `--lanzar` en la línea de órdenes, habría
 * gastado créditos desde una batería.
 * Se compara la URL del módulo con la del fichero invocado en vez de mirar
 * `process.argv[1]` a pelo: en Windows las barras y la letra de unidad no
 * coinciden entre las dos formas, y `pathToFileURL` las normaliza.
 */
const invocadoDirectamente =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invocadoDirectamente) {
  main().catch(err => { console.error(err); process.exit(1); });
}
