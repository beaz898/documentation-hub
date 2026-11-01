import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNTER_CATALOGUE } from './counters';

/**
 * EL INSTRUMENTO DEL PASO 2 DE F-130 (02/11/2026): `verificador.confirmados_solo_por_cumplimiento`, el contador con el
 * que se va a atribuir el efecto del cambio del verificador. Condición del arquitecto para subirlo: «un instrumento sin
 * prueba puede leer cero para siempre».
 *
 * Tres eslabones, y cada uno con su prueba:
 *   1. el tally de la cascada sube cuando el verificador confirma sólo por la pregunta 2: lo prueba
 *      rama-de-las-reglas.test.ts, con la cascada de verdad (`applyCascadeToCandidate`) y el modelo simulado;
 *   2. `runCorePipeline` SUMA el tally de cada candidato y lo ESCRIBE en los contadores del análisis: aquí. El
 *      pipeline entero no se puede ejecutar en la suite (necesita Supabase y Pinecone de verdad; ver
 *      registro-en-el-pipeline.test.ts), así que se vigila el cableado en el código: la suma, hecha sobre el campo
 *      del tally y no sobre otro, y la escritura, en la clave del contador y con el total y no con otro valor;
 *   3. el contador está en el catálogo, sin lo cual la fusión lo tiraría (Contrato_Contadores.md, cláusula 4): aquí.
 * ⚠️ El eslabón 2 es una prueba sobre el TEXTO del código, la misma clase que registro-en-el-pipeline.test.ts: caza
 * que alguien quite, cambie de campo o deje a cero cualquiera de las dos líneas, y no caza un error que deje el texto
 * intacto. Los demás contadores `verificador.*` no tienen ni ésta (pendiente aparte, arquitecto, 02/11).
 */
const fuente = readFileSync('lib/analysis/pipeline.ts', 'utf8');

/** El cuerpo de una función, hasta la llave que la cierra. */
function cuerpo(firma: string): string {
  const i = fuente.indexOf(firma);
  if (i < 0) throw new Error(`no encuentro ${firma}`);
  let j = fuente.indexOf('{', fuente.indexOf(')', i)), profundidad = 0;
  for (let k = j; k < fuente.length; k++) {
    if (fuente[k] === '{') profundidad++;
    else if (fuente[k] === '}' && --profundidad === 0) { j = k; break; }
  }
  return fuente.slice(i, j + 1);
}

describe('verificador.confirmados_solo_por_cumplimiento, del tally al análisis', () => {
  const nucleo = cuerpo('async function runCorePipeline(');

  it('runCorePipeline lo pone a cero, lo SUMA desde el tally de cada candidato y lo ESCRIBE en su clave con ese total', () => {
    expect(nucleo.match(/let totalConfirmadosSoloPorCumplimiento = 0;/g)).toHaveLength(1);
    expect(nucleo.match(/totalConfirmadosSoloPorCumplimiento \+= outcome\.tally\.confirmadosSoloPorCumplimiento;/g)).toHaveLength(1);
    expect(nucleo.match(/counters\['verificador\.confirmados_solo_por_cumplimiento'\] = totalConfirmadosSoloPorCumplimiento;/g)).toHaveLength(1);
    // y en ningún otro sitio se le da otro valor
    expect(fuente.match(/'verificador\.confirmados_solo_por_cumplimiento'\]/g)).toHaveLength(1);
    expect(fuente.match(/totalConfirmadosSoloPorCumplimiento (\+?=)/g)).toEqual(['totalConfirmadosSoloPorCumplimiento =', 'totalConfirmadosSoloPorCumplimiento +=']);
  });

  it('la suma va DENTRO del recorrido de los candidatos, junto a la de confirmados_por_juicio', () => {
    const suma = nucleo.indexOf('totalConfirmadosSoloPorCumplimiento += outcome.tally.confirmadosSoloPorCumplimiento;');
    const hermana = nucleo.indexOf('totalConfirmadosPorJuicio += outcome.tally.confirmadosPorJuicio;');
    expect(hermana).toBeGreaterThan(0);
    expect(suma).toBeGreaterThan(hermana);
    expect(nucleo.slice(hermana, suma)).not.toContain('}');
  });

  it('está en el catálogo: sin eso, la fusión de contadores lo tiraría', () => {
    expect(COUNTER_CATALOGUE).toContain('verificador.confirmados_solo_por_cumplimiento');
  });
});
