#!/usr/bin/env node
/**
 * SONDA · ¿LLEGA LA RESPUESTA EN VARIOS BLOQUES CON LAS CITAS ACTIVADAS?
 * (B.362, la primera pregunta de la prueba en sombra; 08/10/2026)
 *
 * UNA llamada mínima a la API con dos documentos INVENTADOS como bloques de
 * documento y las citas activadas, pidiendo el MISMO JSON que pide hoy el juez.
 * Contesta: cuántos bloques trae la respuesta, qué llevan las citas, y si el
 * JSON se puede leer concatenando todos los bloques o cogiendo sólo el primero
 * —que es lo que hace hoy `callAnthropicTextWithTokens`
 * (lib/llm/anthropic-client.ts:167)—.
 *
 * NO ES PRODUCTO: no lo importa nadie y no toca el pipeline.
 *
 * LO QUE COMPARTE CON EL PRODUCTO SE LEE DE SUS FICHEROS, NO SE COPIA:
 *   · las instrucciones y el formato JSON del juez, de lib/analysis/judge.ts
 *     (la plantilla `const prompt = \`Eres un auditor…`, desde «REGLA PRINCIPAL»
 *     hasta el final; los documentos van aparte, como bloques);
 *   · el sufijo que añade `callAnthropicJson` y el modelo Haiku, de
 *     lib/llm/anthropic-client.ts.
 * Si el producto cambia, la sonda pregunta por el formato nuevo.
 *
 * ⚠️ LA CLAVE: se lee de la variable de entorno ANTHROPIC_API_KEY o, si no está,
 * de la línea ANTHROPIC_API_KEY=… del fichero `.env.sonda.local` (ignorado por
 * git: `.env*.local`). NUNCA se imprime, ni entera ni en parte.
 *
 * USO
 *   node scripts/sonda-citas.mjs --seco   → monta la petición y la describe,
 *                                            SIN llamar a la API ni leer clave.
 *   node scripts/sonda-citas.mjs          → UNA llamada (céntimos).
 */
import { readFileSync, existsSync } from 'node:fs';

const SECO = process.argv.includes('--seco');

// ── Lo que se lee del producto ────────────────────────────────────────────────
const judge = readFileSync('lib/analysis/judge.ts', 'utf8').replace(/\r\n/g, '\n');
const inicio = judge.indexOf('const prompt = `Eres un auditor');
if (inicio === -1) throw new Error('no encuentro la plantilla del juez en judge.ts');
const finPlantilla = judge.indexOf('}`;', inicio);
const plantilla = judge.slice(inicio + 'const prompt = `'.length, finPlantilla + 1);
const cabecera = plantilla.slice(0, plantilla.indexOf('\n'));
const desde = plantilla.indexOf('REGLA PRINCIPAL');
if (desde === -1) throw new Error('no encuentro «REGLA PRINCIPAL» en la plantilla del juez');
const instrucciones = plantilla.slice(desde);
if (instrucciones.includes('${')) throw new Error('las instrucciones del juez tienen huecos ${…}: la sonda ya no sirve tal cual');

const cliente = readFileSync('lib/llm/anthropic-client.ts', 'utf8').replace(/\r\n/g, '\n');
const sufijo = /const strictSuffix = `([^`]*)`;/.exec(cliente)?.[1]?.replace(/\\n/g, '\n');
const modelo = /HAIKU_MODEL\s*=\s*'([^']+)'/.exec(cliente)?.[1];
if (!sufijo || !modelo) throw new Error('no encuentro el sufijo JSON o el modelo en anthropic-client.ts');

// ── Dos documentos INVENTADOS, con una contradicción de cifras evidente ──────
const DOC_NUEVO = [
  'Talleres Brezo · Política de devoluciones (versión 3)',
  '',
  '1. Ámbito. Esta política se aplica a todas las compras hechas en la tienda de Valdecastro.',
  '2. Plazo. El cliente puede devolver cualquier artículo en un plazo de 30 días naturales desde la compra.',
  '3. Estado. El artículo debe devolverse sin usar y con su embalaje original.',
  '4. Justificante. Es imprescindible presentar el ticket de compra o la factura.',
  '5. Reembolso. El importe se devuelve por el mismo medio de pago en un máximo de 5 días hábiles.',
  '6. Excepciones. No se admiten devoluciones de pintura mezclada a medida.',
  '7. Herramientas eléctricas. Se revisan en el mostrador antes de aceptar la devolución.',
  '8. Responsable. La encargada de tienda resuelve cualquier duda sobre esta política.',
].join('\n');
const DOC_EXISTENTE = [
  'Talleres Brezo · Manual de atención al cliente',
  '',
  'Capítulo 4 · Devoluciones',
  '4.1. El cliente dispone de un plazo de 15 días naturales desde la compra para devolver un artículo.',
  '4.2. El artículo tiene que estar sin usar y en su embalaje original.',
  '4.3. Hay que pedir siempre el ticket de compra o la factura.',
  '4.4. El reembolso se hace por el mismo medio de pago.',
  '4.5. La pintura mezclada a medida no se puede devolver.',
  '4.6. Las herramientas eléctricas se revisan en el mostrador.',
  '4.7. Las dudas las resuelve la encargada de tienda.',
].join('\n');

const documento = (titulo, texto) => ({
  type: 'document',
  source: { type: 'text', media_type: 'text/plain', data: texto },
  title: titulo,
  citations: { enabled: true },
});

const textoDelPrompt =
  `${cabecera}\n\n` +
  'Los dos documentos van adjuntos como bloques de documento: el PRIMERO es el DOCUMENTO NUEVO ' +
  '("Política de devoluciones") y el SEGUNDO es el DOCUMENTO EXISTENTE ("Manual de atención al cliente").\n\n' +
  instrucciones + sufijo;

const peticion = {
  model: modelo,
  max_tokens: 4096,
  temperature: 0.1,
  messages: [{
    role: 'user',
    content: [
      documento('Política de devoluciones', DOC_NUEVO),
      documento('Manual de atención al cliente', DOC_EXISTENTE),
      { type: 'text', text: textoDelPrompt },
    ],
  }],
};

if (SECO) {
  console.log('MODO SECO: no se llama a la API ni se lee ninguna clave.');
  console.log(`modelo: ${modelo} · max_tokens 4096 · temperature 0.1`);
  console.log(`bloques de entrada: ${peticion.messages[0].content.map(b => b.type).join(', ')}`);
  console.log(`citas activadas en los dos documentos: ${peticion.messages[0].content.filter(b => b.type === 'document').every(b => b.citations.enabled)}`);
  console.log(`instrucciones del juez leídas de judge.ts: ${instrucciones.length} caracteres; acaban en: ${JSON.stringify(instrucciones.slice(-40))}`);
  console.log(`sufijo de callAnthropicJson leído: ${JSON.stringify(sufijo.slice(0, 50))}…`);
  console.log(`texto del prompt: ${textoDelPrompt.length} caracteres; documentos: ${DOC_NUEVO.length} + ${DOC_EXISTENTE.length}`);
  process.exit(0);
}

// ── La clave: entorno o .env.sonda.local. Nunca se imprime. ──────────────────
function leerClave() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  if (!existsSync('.env.sonda.local')) return null;
  const linea = readFileSync('.env.sonda.local', 'utf8').split(/\r?\n/).find(l => /^\s*ANTHROPIC_API_KEY\s*=/.test(l));
  const valor = linea?.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  return valor || null;
}
const clave = leerClave();
if (!clave) {
  console.error('No hay clave: ni ANTHROPIC_API_KEY en el entorno ni en .env.sonda.local. No se llama a la API.');
  process.exit(1);
}

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify(peticion),
});
if (!res.ok) {
  // El cuerpo del error de la API no lleva la clave; se imprime para poder corregir la forma.
  console.error(`La API respondió ${res.status}: ${(await res.text()).slice(0, 600)}`);
  process.exit(1);
}
const cuerpo = await res.json();
const bloques = Array.isArray(cuerpo.content) ? cuerpo.content : [];

// 1 · bloques
console.log(`1 · BLOQUES: ${bloques.length} — ${bloques.map(b => b.type).join(', ')}`);
console.log(`    stop_reason: ${cuerpo.stop_reason}`);

// 2 · citas
const conCitas = bloques.filter(b => Array.isArray(b.citations) && b.citations.length > 0);
console.log(`2 · BLOQUES CON CITAS: ${conCitas.length} de ${bloques.length}`);
const tiposDeRango = new Set();
const campos = new Set();
const indices = new Set();
for (const b of conCitas) for (const c of b.citations) {
  tiposDeRango.add(c.type);
  Object.keys(c).forEach(k => campos.add(k));
  indices.add(c.document_index);
}
console.log(`    clases de rango: ${[...tiposDeRango].join(', ') || '—'}`);
console.log(`    campos de cada cita: ${[...campos].sort().join(', ') || '—'}`);
console.log(`    document_index vistos: ${[...indices].join(', ') || '—'}`);

// 3 y 4 · ¿se puede leer el JSON?
const textos = bloques.filter(b => b.type === 'text').map(b => b.text ?? '');
const todo = textos.join('');
const primero = textos[0] ?? '';
const parsea = s => { try { JSON.parse(s); return true; } catch { return false; } };
// La limpieza principal que hace hoy el código antes de parsear (sanitizeJsonResponse,
// anthropic-client.ts): quedarse de la primera llave a la última. No es la función
// entera —no repara—: es para separar «JSON roto» de «texto alrededor».
const recortado = s => { const a = s.indexOf('{'); const b = s.lastIndexOf('}'); return a !== -1 && b > a ? s.slice(a, b + 1) : s; };
console.log(`3 · TODOS LOS BLOQUES CONCATENADOS (${todo.length} caracteres): JSON.parse ${parsea(todo) ? 'SÍ' : 'NO'} · de la primera a la última llave ${parsea(recortado(todo)) ? 'SÍ' : 'NO'}`);
console.log(`4 · SÓLO EL PRIMER BLOQUE, COMO HOY (${primero.length} caracteres): JSON.parse ${parsea(primero) ? 'SÍ' : 'NO'} · de la primera a la última llave ${parsea(recortado(primero)) ? 'SÍ' : 'NO'}`);
console.log(`    el primer bloque empieza: ${JSON.stringify(primero.slice(0, 80))}`);

// 5 · tokens
console.log(`5 · TOKENS: entrada ${cuerpo.usage?.input_tokens ?? '?'} · salida ${cuerpo.usage?.output_tokens ?? '?'}`);
