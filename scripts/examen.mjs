import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

async function cargarCasos() {
  const ficheros = readdirSync(DIR_CASOS).filter(f => f.endsWith('.mjs')).sort();
  const casos = [];
  for (const f of ficheros) {
    const mod = await import(`../${DIR_CASOS}/${f}`);
    casos.push({ fichero: f, ...mod.default });
  }
  return soloCaso ? casos.filter(c => c.id === soloCaso) : casos;
}

// ---------------------------------------------------------------------------
// VALIDACIÓN DE LOS CASOS — pura, y corre siempre, también antes de --lanzar.
// ⚠️ Un caso mal escrito gasta créditos y devuelve un marcador sin sentido, así
// que se valida ANTES de pagar. Es F-104: la vía de reparación va primero.
// ---------------------------------------------------------------------------

function validarCasos(casos) {
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
  }
  return problemas;
}

/**
 * ⚠️ LA COMPROBACIÓN QUE MÁS VALE DEL MODO SECO: que cada discriminante aparezca
 * EXACTAMENTE UNA VEZ en su documento y CERO en el otro. Es lo que impide que el
 * marcador confunda dos hallazgos vecinos —el caso A/D de P1, a 7 líneas uno de
 * otro—, y cuesta cero créditos.
 *
 * ⚠️ Y SI NO SE PUEDE LEER EL DOCUMENTO, **NO PASA EN SILENCIO**: se declara sin
 * verificar. Una comprobación que se salta a sí misma cuando falla la
 * herramienta es la que pasó en B.126.
 */
function verificarDiscriminantes(caso) {
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

async function unaPasada(caso, n, dirSalida) {
  const base = process.env.EXAMEN_URL_BASE;
  const token = process.env.EXAMEN_TOKEN_ADMIN;
  if (!base || !token) {
    throw new Error('faltan EXAMEN_URL_BASE y/o EXAMEN_TOKEN_ADMIN en el entorno');
  }

  const t0 = Date.now();
  const res = await fetch(`${base}/api/admin/examen`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      analizado: caso.analizado,
      corpusExacto: caso.corpusExacto,
      modo: caso.modo,
      casoId: caso.id,
      pasada: n,
    }),
  });
  const cuerpo = await res.text();
  const crudo = {
    casoId: caso.id,
    pasada: n,
    http: res.status,
    ms: Date.now() - t0,
    cuando: new Date().toISOString(),
    cuerpo: (() => { try { return JSON.parse(cuerpo); } catch { return cuerpo; } })(),
  };

  // ⚠️ SE ESCRIBE ANTES DE AGREGAR NADA, Y ES LA CONDICIÓN DEL DIRECTOR:
  // «que deje por escrito, en fichero, el resultado crudo de cada pasada antes
  // de agregarlo … nada de borrar evidencia intermedia». Y es además la regla de
  // F-102: la cifra que vale es la que se guarda, no la que se imprime. Si el
  // agregado sorprende, las cinco pasadas están ahí una por una.
  writeFileSync(join(dirSalida, `${caso.id}_pasada${n}.json`), JSON.stringify(crudo, null, 2));

  if (!res.ok) throw new Error(`HTTP ${res.status} en ${caso.id} pasada ${n}`);
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
      const v = verificarDiscriminantes(c);
      if (!v.verificado) lineas.push(`    ⚠️ discriminantes SIN VERIFICAR: ${v.motivo}`);
      else if (v.fallos.length) {
        lineas.push('    ⚠️ DISCRIMINANTES QUE NO AÍSLAN:');
        for (const f of v.fallos) lineas.push(`         ${f}`);
      } else {
        lineas.push('    ✅ discriminantes verificados: cada uno 1 vez en su documento, 0 en el otro');
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
        const r = await unaPasada(c, n, dirSalida);
        resultados.push(r);
        console.log(`  ${c.id} pasada ${n}: HTTP ${r.http} en ${r.ms} ms`);
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

main().catch(err => { console.error(err); process.exit(1); });
