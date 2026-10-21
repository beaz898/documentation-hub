import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 3.1.1, paso 3 (21/10/2026): TODA LLAMADA AL MODELO DEL ANÁLISIS LLEVA SU ETIQUETA DE ETAPA.
 *
 * Sin etiqueta, la llamada se apunta como «sin_etapa» (`lib/observability/registro-de-llamadas.ts`),
 * y el arquitecto puso el control: al acabar el paso 3, en un análisis completo ese contador tiene que
 * quedarse a cero. Hasta que el paso 4 guarde el registro no hay análisis real que lo diga, así que
 * este censo es el control de hoy: recorre el código POR CAPACIDAD —cualquier llamada a una función del
 * cliente del modelo, se llame como se llame en el fichero que la importa— y exige la etiqueta en cada
 * una de `lib/analysis/`. Las de fuera del análisis (chat, mejora, agente) van sin etiqueta a propósito
 * y están en una lista cerrada: una nueva, dentro o fuera, pone esto en rojo.
 */
const FUNCIONES = ['callLLMJson', 'callLLMWithUsage', 'callLLM', 'callAnthropicJson', 'callAnthropicWithUsage', 'callAnthropicText', 'callAnthropicAgent', 'callAgentLLM'];
const LLAMADA = new RegExp(`\\b(${FUNCIONES.join('|')})\\s*(<[^>(]*>)?\\s*\\(`, 'g');
const FUERA_DEL_ANALISIS_SIN_ETIQUETA = [
  'app/api/improve/route.ts · callLLMWithUsage',
  'lib/agent/runner-conv.ts · callAgentLLM',      // llm-call.ts sólo la reexporta
  'lib/rag.ts · callLLMWithUsage',
  'lib/rag.ts · callLLMWithUsage',
];

function ficheros(dir: string, fuera: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next'].includes(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) ficheros(ruta, fuera);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) fuera.push(ruta.replaceAll('\\', '/'));
  }
  return fuera;
}

/** Las llamadas de un fichero, con el texto de sus argumentos hasta el paréntesis que cierra. */
function llamadas(fichero: string): { funcion: string; argumentos: string }[] {
  const texto = readFileSync(fichero, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))       // fuera los comentarios de bloque
    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));           // y los de línea
  const encontradas: { funcion: string; argumentos: string }[] = [];
  for (const m of texto.matchAll(LLAMADA)) {
    const antes = texto.slice(Math.max(0, m.index - 40), m.index);
    if (/(function|import|export\s*\{|as)\s*$/.test(antes) || /\bfunction\s+$/.test(antes)) continue;   // definiciones e imports
    let i = m.index + m[0].length, profundidad = 1;
    while (i < texto.length && profundidad > 0) { if (texto[i] === '(') profundidad++; else if (texto[i] === ')') profundidad--; i++; }
    encontradas.push({ funcion: m[1], argumentos: texto.slice(m.index + m[0].length, i - 1) });
  }
  return encontradas;
}

describe('las etiquetas de etapa de las llamadas al modelo', () => {
  const todas = ['lib', 'app', 'worker'].flatMap(d => ficheros(d))
    .filter(f => f !== 'lib/llm/anthropic-client.ts' && f !== 'lib/analysis/llm-client.ts')   // el cliente y su reexportación
    .flatMap(f => llamadas(f).map(l => ({ fichero: f, ...l })));

  it('las seis del análisis llevan etiqueta (control positivo: son exactamente las seis del censo)', () => {
    const delAnalisis = todas.filter(l => l.fichero.startsWith('lib/analysis/'));
    expect(delAnalisis.map(l => l.fichero).sort()).toEqual([
      'lib/analysis/double-check.ts', 'lib/analysis/judge.ts', 'lib/analysis/rerank.ts',
      'lib/analysis/style-check.ts', 'lib/analysis/synthesize.ts', 'lib/analysis/verify-findings.ts',
    ]);
    expect(delAnalisis.filter(l => !/\betiqueta\s*:/.test(l.argumentos)).map(l => l.fichero)).toEqual([]);
  });

  it('la del juez lleva su pareja, por id', () => {
    const juez = todas.find(l => l.fichero === 'lib/analysis/judge.ts');
    expect(juez?.argumentos).toMatch(/etiqueta:\s*\{\s*etapa:\s*'juez',\s*pareja:\s*candidate\.documentId\s*\}/);
  });

  it('fuera del análisis, las que van sin etiqueta son exactamente las declaradas', () => {
    const sinEtiqueta = todas.filter(l => !l.fichero.startsWith('lib/analysis/') && !/\betiqueta\s*:/.test(l.argumentos))
      .map(l => `${l.fichero} · ${l.funcion}`).sort();
    expect(sinEtiqueta).toEqual([...FUERA_DEL_ANALISIS_SIN_ETIQUETA].sort());
  });
});
