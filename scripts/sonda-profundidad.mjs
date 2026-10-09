#!/usr/bin/env node
/**
 * SONDA · PROFUNDIDAD CONTRA DIFICULTAD (10/10/2026, tras parar la vía 2).
 *
 * LA PREGUNTA: las tres trampas de NOR-11 ↔ CLI-13 salen 8/8 (PLAZO, página 1),
 * 4/8 (LUGAR, página 3) y 2/8 (NEGACIÓN, página 5 de 5), con la pareja leída
 * ENTERA. Las más profundas son también las más difíciles. Este experimento
 * separa las dos cosas: mismas trampas, mismo relleno, mismo tamaño, y la ÚNICA
 * variable es el SITIO.
 *   · MONTAJE 1 (reproduce lo de hoy): PLAZO al principio, LUGAR a la mitad,
 *     NEGACIÓN al final.
 *   · MONTAJE 2 (invertido): NEGACIÓN al principio, LUGAR a la mitad, PLAZO al
 *     final.
 *
 * ⚠️ EL CONTROL POSITIVO MANDA: el montaje 1 tiene que dar aproximadamente
 * PLAZO 5/5, LUGAR 2-3/5 y NEGACIÓN 1-2/5. Por eso el montaje 2 SÓLO se lanza
 * después, a mano, y no en la misma orden.
 *
 * QUÉ ES DEL PRODUCTO Y QUÉ NO (se lee de sus ficheros, no se copia):
 *   · el prompt del juez entero, de la plantilla de lib/analysis/judge.ts, con
 *     sus cinco huecos rellenos como los rellena el juez en `pareja_entera`;
 *   · el texto de cada lado, pintado por la cadena real: `chunkSegments` +
 *     `buildAnalyzedDocumentText` (a través de `leerLaPareja`);
 *   · el sufijo de `callAnthropicJson`, el modelo Haiku, temperatura 0,1 y
 *     tope de salida 4.096;
 *   · LA PUERTA REAL: `sanitizeJudgeContradictions` y
 *     `traducirSolapamientosDelJuez` (frontera), y `fixQuotesInJudgment` con los
 *     comprobadores de `loEntregadoDeLaPareja`, igual que `judgeSingleDocument`.
 * LO QUE NO ES IGUAL, y se declara: la llamada se hace con `fetch` y no con
 * `callAnthropicJson`, porque ésta pasa por el limitador, que necesita la base.
 * Sin reintentos (un fallo para la sonda) y el JSON se lee recortando de la
 * primera llave a la última, sin la reparación de JSON truncado del producto.
 * NO es un análisis del producto: no llama a ningún endpoint, no cobra créditos
 * y no escribe nada en ningún sitio.
 *
 * ⚠️ LA CLAVE: de ANTHROPIC_API_KEY o de la línea ANTHROPIC_API_KEY=… de
 * `.env.sonda.local` (ignorado por git). NUNCA se imprime, ni entera ni en parte.
 *
 * USO
 *   node scripts/sonda-profundidad.mjs --seco        → monta los dos documentos,
 *        dice tamaños, posiciones y tokens estimados, y comprueba la PUERTA con
 *        las citas exactas (control) — sin llamar a la API ni leer la clave.
 *   node scripts/sonda-profundidad.mjs --montaje 1   → 5 llamadas.
 *   node scripts/sonda-profundidad.mjs --montaje 2   → 5 llamadas.
 */
import { register } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const raiz = pathToFileURL(process.cwd() + '/').href;
const gancho = `
const RAIZ = ${JSON.stringify(raiz)};
export async function resolve(esp, ctx, sig) {
  if (esp.startsWith('@/')) esp = RAIZ + esp.slice(2);
  try { return await sig(esp, ctx); }
  catch (err) {
    if (!/\\.[cm]?[jt]sx?$/.test(esp) && (esp.startsWith('.') || esp.startsWith(RAIZ))) {
      try { return await sig(esp + '.ts', ctx); } catch { return sig(esp + '/index.ts', ctx); }
    }
    throw err;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const args = process.argv.slice(2);
const SECO = args.includes('--seco');
const MONTAJE = Number(args[args.indexOf('--montaje') + 1]);
if (!SECO && MONTAJE !== 1 && MONTAJE !== 2) {
  console.error('Uso: --seco, o --montaje 1, o --montaje 2.');
  process.exit(1);
}
const PASADAS = 5;

const { TRAMPAS, rellenoA, rellenoB } = await import('./sonda-profundidad-textos.mjs');
const { chunkSegments } = await import(raiz + 'lib/chunking.ts');
const { toStoredChunks } = await import(raiz + 'lib/read-chunks.ts');
const { leerLaPareja, fixQuotesInJudgment, verifyQuote } = await import(raiz + 'lib/analysis/judge.ts');
const { comprobadorDeLado, loEntregadoDeLaPareja } = await import(raiz + 'lib/analysis/coincidencia-de-cita.ts');
const { sanitizeJudgeContradictions, traducirSolapamientosDelJuez } = await import(raiz + 'lib/analysis/llm-boundary.ts');

// ── Lo que se lee del producto ────────────────────────────────────────────────
const judge = readFileSync('lib/analysis/judge.ts', 'utf8').replace(/\r\n/g, '\n');
const ini = judge.indexOf('const prompt = `Eres un auditor');
const plantilla = judge.slice(ini + 'const prompt = `'.length, judge.indexOf('}`;', ini) + 1);
const HUECOS = ['${newDocumentName}', '${pareja.textoAnalizado}', '${candidate.documentName}', '${candidate.source}', '${pareja.bloqueCandidato}'];
for (const h of HUECOS) if (plantilla.split(h).length !== 2) throw new Error(`la plantilla del juez ya no tiene el hueco ${h} una sola vez`);
if ((plantilla.match(/\$\{/g) ?? []).length !== HUECOS.length) throw new Error('la plantilla del juez tiene huecos que la sonda no sabe rellenar');
const cliente = readFileSync('lib/llm/anthropic-client.ts', 'utf8').replace(/\r\n/g, '\n');
const sufijo = /const strictSuffix = `([^`]*)`;/.exec(cliente)?.[1]?.replace(/\\n/g, '\n');
const modelo = /HAIKU_MODEL\s*=\s*'([^']+)'/.exec(cliente)?.[1];
if (!sufijo || !modelo) throw new Error('no encuentro el sufijo JSON o el modelo en anthropic-client.ts');

// ── Montar un documento: relleno + trampas en posiciones controladas ─────────
const NOMBRE_A = 'NOR-91_protocolo-sintetico-de-funcionamiento.docx';
const NOMBRE_B = 'CLI-93_instrucciones-sinteticas-de-gabinete.docx';
const ORDEN = { 1: ['PLAZO', 'LUGAR', 'NEGACIÓN'], 2: ['NEGACIÓN', 'LUGAR', 'PLAZO'] };
const OBJETIVOS = [0.05, 0.5, 0.93]; // principio, mitad, final

/** Inserta cada bloque de trampa en el límite de bloque más cercano a su objetivo. */
function montar(relleno, lado, orden) {
  const bloques = [...relleno];
  const total = bloques.reduce((n, b) => n + b.length + 2, 0);
  const inserciones = orden.map((t, i) => {
    // Nunca delante del título (k = 0): la trampa del principio va tras el primer bloque.
    let acumulado = bloques[0].length + 2, mejor = 1, distancia = Infinity;
    for (let k = 1; k <= bloques.length; k++) {
      const d = Math.abs(acumulado / total - OBJETIVOS[i]);
      if (d < distancia) { distancia = d; mejor = k; }
      if (k < bloques.length) acumulado += bloques[k].length + 2;
    }
    return { t, k: mejor };
  });
  for (const { t, k } of [...inserciones].sort((a, b) => b.k - a.k)) bloques.splice(k, 0, TRAMPAS[t].bloque(lado));
  return { texto: bloques.join('\n\n') };
}

/** Dónde empieza cada trampa en lo que VE el juez (el render), en tanto por uno. */
function posiciones(render, lado, orden) {
  return Object.fromEntries(orden.map(t => [t, render.indexOf(TRAMPAS[t][lado]) / render.length]));
}

function trozos(nombre, texto) {
  return toStoredChunks(chunkSegments([{ type: 'text', text: texto }], 'sonda', nombre, 'sonda'));
}

/** El render que ve el juez de un documento, por la cadena real (buildAnalyzedDocumentText). */
function render(nombre, chunks) {
  const p = leerLaPareja({
    parejaEntera: true, documentId: 'r', documentName: nombre, analizadoCompleto: 'x', analizadoConTrozos: true,
    analizadoViejo: { texto: 'x', lado: { caracteres: 1, mostrados: 1, dejoFuera: false } },
    candidatoChunks: chunks, fragmentosEnviados: [], bloqueRelevancia: '',
  });
  return p.bloqueCandidato;
}

function prepararMontaje(m) {
  const a = montar(rellenoA, 'A', ORDEN[m]);
  const b = montar(rellenoB, 'B', ORDEN[m]);
  const chunksA = trozos(NOMBRE_A, a.texto);
  const chunksB = trozos(NOMBRE_B, b.texto);
  const pareja = leerLaPareja({
    parejaEntera: true, documentId: 'cand', documentName: NOMBRE_B,
    analizadoCompleto: render(NOMBRE_A, chunksA), analizadoConTrozos: true,
    analizadoViejo: { texto: 'x', lado: { caracteres: 1, mostrados: 1, dejoFuera: false } },
    candidatoChunks: chunksB, fragmentosEnviados: [], bloqueRelevancia: '',
  });
  if (pareja.lectura.regimen !== 'pareja_entera') throw new Error(`el montaje ${m} no se lee entero: ${pareja.lectura.regimen}`);
  const prompt = plantilla
    .replace(HUECOS[0], () => NOMBRE_A).replace(HUECOS[1], () => pareja.textoAnalizado)
    .replace(HUECOS[2], () => NOMBRE_B).replace(HUECOS[3], () => 'manual')
    .replace(HUECOS[4], () => pareja.bloqueCandidato) + sufijo;
  const entregado = loEntregadoDeLaPareja({ pareja, analizadoChunks: chunksA, candidatoChunks: chunksB });
  const lados = () => ({
    nuevo: comprobadorDeLado(verifyQuote, entregado.nuevo, chunksA, null),
    existente: comprobadorDeLado(verifyQuote, entregado.existente, chunksB, null),
  });
  return { a, b, pareja, prompt, lados };
}

/** La puerta real sobre una respuesta del juez, como `judgeSingleDocument`. */
function pasarPorLaPuerta(respuesta, lados) {
  const { contradictions } = sanitizeJudgeContradictions(respuesta.contradictions);
  const solapes = traducirSolapamientosDelJuez(respuesta.overlappingContent);
  const crudo = {
    documentId: 'cand', documentName: NOMBRE_B, source: 'manual',
    overlapPercent: Math.max(0, Math.min(100, Math.round(respuesta.overlapPercent || 0))),
    verdict: respuesta.verdict || 'sin_relacion', contradictions,
    overlappingContent: solapes.overlappingContent, uniqueToNewDoc: respuesta.uniqueToNewDoc || [],
  };
  const { nuevo, existente } = lados();
  const silencio = console.warn; const silencioLog = console.log;
  console.warn = () => {}; console.log = () => {};
  try { return { crudo, verificado: fixQuotesInJudgment(crudo, nuevo, existente, []).judgment }; }
  finally { console.warn = silencio; console.log = silencioLog; }
}

/** ¿Qué trampa es este hallazgo? Por las palabras de su pareja de citas. */
function trampaDe(citaNuevo, citaExistente) {
  const t = `${citaNuevo ?? ''} ${citaExistente ?? ''}`;
  return Object.keys(TRAMPAS).find(k => TRAMPAS[k].senal.test(t)) ?? null;
}

const pct = x => `${(x * 100).toFixed(1)} %`;

// ── Modo seco: tamaños, posiciones, tokens y el control de la puerta ─────────
if (SECO) {
  console.log('MODO SECO: no se llama a la API ni se lee ninguna clave.\n');
  for (const m of [1, 2]) {
    const { a, b, pareja, prompt, lados } = prepararMontaje(m);
    console.log(`MONTAJE ${m}: lo que ve el juez — A ${pareja.textoAnalizado.length} caracteres, B ${pareja.bloqueCandidato.length} (texto sin trocear: ${a.texto.length} y ${b.texto.length}) · régimen ${pareja.lectura.regimen}`);
    console.log(`  posiciones en A: ${Object.entries(posiciones(pareja.textoAnalizado, 'A', ORDEN[m])).map(([t, p]) => `${t} ${pct(p)}`).join(' · ')}`);
    console.log(`  posiciones en B: ${Object.entries(posiciones(pareja.bloqueCandidato, 'B', ORDEN[m])).map(([t, p]) => `${t} ${pct(p)}`).join(' · ')}`);
    console.log(`  prompt ${prompt.length} caracteres · tokens de entrada estimados ~${Math.round(prompt.length / 3.3)} (a 3,3 caracteres por token, la razón de la sonda 1 del 09/10; ESTIMACIÓN)`);
    // CONTROL DE LA PUERTA: con las frases exactas pasan las tres; con la reescritura de LUGAR del 05/10 no.
    const exacta = { overlapPercent: 30, verdict: 'contradiccion', overlappingContent: [], uniqueToNewDoc: [],
      contradictions: Object.keys(TRAMPAS).map(t => ({ topic: t, newDocSays: TRAMPAS[t].A, existingDocSays: TRAMPAS[t].B, severity: 'contradiction' })) };
    const ok = pasarPorLaPuerta(exacta, lados).verificado.contradictions.map(c => trampaDe(c.newDocSays, c.existingDocSays));
    const reescrita = { ...exacta, contradictions: [{ topic: 'LUGAR', severity: 'contradiction',
      newDocSays: 'El punto de retirada centralizado concentra el material de las tres clínicas, ubicado en la clínica de Chamberí, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro',
      existingDocSays: TRAMPAS.LUGAR.B }] };
    const ko = pasarPorLaPuerta(reescrita, lados).verificado.contradictions.length;
    console.log(`  CONTROL DE LA PUERTA: citas exactas → pasan ${ok.length} de 3 (${ok.join(', ')}) · la reescritura de LUGAR del 05/10 → pasa ${ko} de 1\n`);
  }
  process.exit(0);
}

// ── Lanzamientos ──────────────────────────────────────────────────────────────
function leerClave() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  if (!existsSync('.env.sonda.local')) return null;
  const linea = readFileSync('.env.sonda.local', 'utf8').split(/\r?\n/).find(l => /^\s*ANTHROPIC_API_KEY\s*=/.test(l));
  const valor = linea?.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  return valor || null;
}
const clave = leerClave();
if (!clave) { console.error('No hay clave: ni ANTHROPIC_API_KEY en el entorno ni en .env.sonda.local. No se llama a la API.'); process.exit(1); }

const { a, b, prompt, lados } = prepararMontaje(MONTAJE);
console.log(`MONTAJE ${MONTAJE} · ${ORDEN[MONTAJE].join(' → ')} · A ${a.texto.length} · B ${b.texto.length} · ${PASADAS} pasadas\n`);
const cuenta = Object.fromEntries(Object.keys(TRAMPAS).map(t => [t, { emitida: 0, pasa: 0 }]));
let entrada = 0, salida = 0;
for (let p = 1; p <= PASADAS; p++) {
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: modelo, max_tokens: 4096, temperature: 0.1, messages: [{ role: 'user', content: prompt }] }),
    });
  } catch (err) {
    console.error(`Pasada ${p}: la llamada no salió: ${err?.message ?? 'error desconocido'}${err?.cause?.code ? ` (${err.cause.code})` : ''}`);
    process.exit(1);
  }
  if (!res.ok) { console.error(`Pasada ${p}: la API respondió ${res.status}: ${(await res.text()).slice(0, 600)}`); process.exit(1); }
  const cuerpo = await res.json();
  entrada += cuerpo.usage?.input_tokens ?? 0; salida += cuerpo.usage?.output_tokens ?? 0;
  const texto = (cuerpo.content ?? []).filter(x => x.type === 'text').map(x => x.text).join('');
  const i = texto.indexOf('{'), j = texto.lastIndexOf('}');
  let respuesta;
  try { respuesta = JSON.parse(texto.slice(i, j + 1)); }
  catch { console.log(`Pasada ${p}: el JSON no se pudo leer (stop_reason ${cuerpo.stop_reason}) — se cuenta como nada emitido\n`); continue; }
  const { crudo, verificado } = pasarPorLaPuerta(respuesta, lados);
  console.log(`Pasada ${p} · stop_reason ${cuerpo.stop_reason} · tokens ${cuerpo.usage?.input_tokens}/${cuerpo.usage?.output_tokens} · ${crudo.contradictions.length} contradicciones emitidas, ${verificado.contradictions.length} pasan`);
  for (const t of Object.keys(TRAMPAS)) {
    const emitidas = crudo.contradictions.filter(c => trampaDe(c.newDocSays, c.existingDocSays) === t);
    const pasan = verificado.contradictions.filter(c => trampaDe(c.newDocSays, c.existingDocSays) === t);
    const comoSolape = crudo.overlappingContent.filter(o => trampaDe(o.evidenceInNewDoc, o.evidence) === t).length;
    if (emitidas.length) cuenta[t].emitida++;
    if (pasan.length) cuenta[t].pasa++;
    console.log(`  ${t}: emitida ${emitidas.length ? 'SÍ' : 'no'} · puerta ${pasan.length ? 'PASA' : emitidas.length ? 'NO pasa' : '—'}${comoSolape ? ` · además ${comoSolape} como solapamiento` : ''}`);
    for (const c of emitidas) console.log(`    nuevo: ${JSON.stringify(c.newDocSays)}\n    existente: ${JSON.stringify(c.existingDocSays)}`);
  }
  console.log('');
}
console.log(`TOTAL MONTAJE ${MONTAJE}: ${Object.entries(cuenta).map(([t, c]) => `${t} emitida ${c.emitida}/${PASADAS}, pasa ${c.pasa}/${PASADAS}`).join(' · ')}`);
console.log(`TOKENS: entrada ${entrada} · salida ${salida}`);
