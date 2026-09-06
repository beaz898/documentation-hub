import { readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { extractSegments, joinSegments, stripSegmentationMarkers } from './chunking';

/**
 * ENCARGO 1 DE F-105 — EL COSTE REAL DE PERSISTIR LOS SEGMENTOS.
 *
 * Antes del commit del paso 0 hay que saber cuánto ocupa la estructura frente al
 * texto plano que ya se guarda. La estimación que viajó al director fue **entre
 * 1× y 2×**; esto la contrasta.
 *
 * ⚠️ QUÉ MIDE EXACTAMENTE, y conviene que esté escrito aquí porque de otro modo
 * la cifra se lee de más:
 *   · NUMERADOR — `JSON.stringify(extractSegments(fichero))`: los segmentos
 *     serializados tal como irían a una columna `jsonb`.
 *   · DENOMINADOR — `stripSegmentationMarkers(joinSegments(segmentos))`: el
 *     texto plano que HOY se guarda en `documents.full_text`. Se deriva de los
 *     mismos segmentos a propósito, para que la comparación sea del MISMO
 *     documento y no de dos lecturas distintas.
 *   · El ratio es por documento, y se dan la media y el peor caso.
 *
 * ⚠️ LO QUE **NO** MIDE, declarado: no mide el corpus del piloto —son los ~16
 * ficheros de `corpus-pruebas/`, no los ~40 de producción— ni el tamaño en
 * disco tras la compresión TOAST de Postgres, que para `jsonb` grande es
 * sustancial y solo se ve en la base. Es una cota de la FORMA, no del coste
 * final de almacenamiento.
 *
 * NO ES UNA BATERÍA DE COMPORTAMIENTO: es una MEDICIÓN, y por eso no afirma
 * nada sobre el ratio. Solo falla si se dispara el umbral que F-105 fijó como
 * condición de parada —3×—, porque ahí el encargo dice explícitamente que hay
 * que consultar antes de escribir el esquema.
 */

const UMBRAL_DE_PARADA = 3;

const ficheros = readdirSync('corpus-pruebas').filter(f => !f.startsWith('.'));

describe('coste de persistir los segmentos (F-105, encargo 1)', () => {
  it('mide el ratio segmentos/texto sobre el corpus de pruebas', async () => {
    const filas: Array<{ nombre: string; texto: number; segmentos: number; ratio: number }> = [];

    for (const nombre of ficheros) {
      const buffer = readFileSync(`corpus-pruebas/${nombre}`);
      const segmentos = await extractSegments(buffer, nombre);
      const texto = stripSegmentationMarkers(joinSegments(segmentos)).length;
      const serializado = JSON.stringify(segmentos).length;
      if (texto === 0) continue;
      filas.push({ nombre, texto, segmentos: serializado, ratio: serializado / texto });
    }

    // El control positivo del propio instrumento: si el barrido no encuentra
    // ficheros, todo lo de abajo pasaría sin medir nada.
    expect(filas.length).toBeGreaterThanOrEqual(10);

    filas.sort((a, b) => b.ratio - a.ratio);
    const totalTexto = filas.reduce((s, f) => s + f.texto, 0);
    const totalSeg = filas.reduce((s, f) => s + f.segmentos, 0);

    const informe = [
      `DOCUMENTOS MEDIDOS: ${filas.length}`,
      `TOTAL texto:     ${totalTexto.toLocaleString('es')} caracteres`,
      `TOTAL segmentos: ${totalSeg.toLocaleString('es')} caracteres`,
      `RATIO GLOBAL:    ${(totalSeg / totalTexto).toFixed(2)}×`,
      `PEOR CASO:       ${filas[0].nombre} → ${filas[0].ratio.toFixed(2)}×`,
      `MEJOR CASO:      ${filas[filas.length - 1].nombre} → ${filas[filas.length - 1].ratio.toFixed(2)}×`,
      '',
      ...filas.map(f =>
        `  ${f.ratio.toFixed(2)}×  ${f.nombre}  (texto ${f.texto}, segmentos ${f.segmentos})`),
    ].join('\n');

    // La medición se imprime fallando a propósito cuando se pide verla; en verde
    // solo se comprueba la condición de parada de F-105.
    if (process.env.VER_MEDICION === '1') {
      expect(informe).toBe('(ver informe arriba)');
    }

    expect(
      totalSeg / totalTexto,
      `Ratio global ${(totalSeg / totalTexto).toFixed(2)}× — F-105 manda PARAR y consultar por encima de ${UMBRAL_DE_PARADA}×.\n${informe}`,
    ).toBeLessThan(UMBRAL_DE_PARADA);
  });
});
