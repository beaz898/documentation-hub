import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 3.1.1, paso 4 (21/10/2026): LAS DOS ENTRADAS DEL PIPELINE ABREN EL REGISTRO POR LLAMADA Y LO DEVUELVEN.
 *
 * El pipeline entero no se puede ejecutar en la suite (necesita Supabase y Pinecone de verdad), así que
 * el control de que el registro llega a un análisis real es `SQL_311_01` sobre el primer análisis
 * guardado. Esto vigila el cableado en el código: cada una de las dos funciones exportadas abre
 * `conRegistroDeLlamadas` y devuelve el resultado con `llamadasAlModelo`. Si alguien quita una de las
 * dos, el análisis de ese camino se guardaría sin registro y nadie se enteraría hasta leerlo.
 */
const fuente = readFileSync('lib/analysis/pipeline.ts', 'utf8');

/** El cuerpo de una función exportada, hasta la llave que la cierra. */
function cuerpo(nombre: string): string {
  const i = fuente.indexOf(`export async function ${nombre}(`);
  if (i < 0) throw new Error(`no encuentro ${nombre}`);
  let j = fuente.indexOf('{', fuente.indexOf(')', i)), profundidad = 0;
  for (let k = j; k < fuente.length; k++) {
    if (fuente[k] === '{') profundidad++;
    else if (fuente[k] === '}' && --profundidad === 0) { j = k; break; }
  }
  return fuente.slice(i, j + 1);
}

describe('el registro por llamada, en las dos entradas del pipeline', () => {
  for (const nombre of ['runAnalysisPipeline', 'runExhaustiveAnalysisPipeline']) {
    it(`${nombre} lo abre y lo devuelve en llamadasAlModelo`, () => {
      const c = cuerpo(nombre);
      expect(c).toMatch(/await conRegistroDeLlamadas\(/);
      expect(c).toMatch(/llamadasAlModelo:\s*registro/);
    });
  }
});
