import { readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { extractSegments, produceTablas, EXTENSIONES_CON_TABLAS } from './chunking';

/**
 * LA LISTA DE FORMATOS CON TABLAS, ATADA A LA CONDUCTA (B.191).
 *
 * ⚠️ POR QUÉ ESTE CASO Y NO UN COMENTARIO. `EXTENSIONES_CON_TABLAS` es la
 * respuesta a «¿qué formatos pueden perder estructura si se re-trocean?», y esa
 * respuesta la decide de verdad el `switch` de `extractSegments`. Una lista que
 * solo se sostiene en un comentario se separa del código el día que alguien
 * añada una rama — y se separa en silencio, porque las dos siguen pareciendo
 * correctas por su cuenta.
 *
 * Aquí la lista se comprueba contra lo que el extractor HACE, sobre los ficheros
 * reales del repositorio: exactamente los de la lista producen segmentos con
 * estructura, y ninguno más.
 *
 * Es el mismo mecanismo con el que `origen.ts` se ata al registro de
 * proveedores, y nace de la misma lección: el fallo no fue «falta un valor en la
 * lista», fue que había dos listas.
 */

const ficheros = readdirSync('corpus-pruebas').filter(f => !f.startsWith('.'));

describe('EXTENSIONES_CON_TABLAS dice la verdad sobre el extractor', () => {
  /**
   * El control positivo del propio barrido: sin ficheros, todo lo de abajo
   * pasaría sin comprobar nada. Y hace falta al menos uno de cada lado.
   */
  it('el corpus de pruebas tiene material de los dos lados', () => {
    const conTablas = ficheros.filter(produceTablas);
    const sinTablas = ficheros.filter(f => !produceTablas(f));
    expect(conTablas.length).toBeGreaterThanOrEqual(2);
    expect(sinTablas.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * ⚠️ EL PRESUPUESTO DE TIEMPO ES EXPLÍCITO — B.193, y no es precaución: se
   * confirmó en directo. Cada caso extrae un fichero REAL (PDF por `pdf-parse`,
   * `.docx` por `mammoth`), y con el límite de 5 s por defecto uno de ellos
   * —`CLI-12`, 51.000 caracteres— falló en **5021 ms** bajo carga, tras dos
   * apariciones previas que no se pudieron identificar porque no se reprodujeron.
   *
   * Un caso que falla una vez de cada cuatro es peor que uno que falla siempre:
   * envenena la lectura de todo lo demás. Con presupuesto propio, si algún día
   * falla será por lo que vigila y no por la máquina.
   */
  it.each(ficheros)('%s: la lista coincide con lo que extractSegments produce', { timeout: 30_000 }, async nombre => {
    const segmentos = await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre);
    const emiteEstructura = segmentos.some(s => s.type !== 'text');

    expect(
      emiteEstructura,
      emiteEstructura
        ? `"${nombre}" produce segmentos con estructura y su extensión NO está en ` +
          `EXTENSIONES_CON_TABLAS (${EXTENSIONES_CON_TABLAS.join(', ')}). La guarda del ` +
          `reindexado lo dejaría re-trocear y perdería sus celdas. Añádelo a la lista.`
        : `"${nombre}" está en EXTENSIONES_CON_TABLAS pero no produce estructura. ` +
          `La lista bloquearía reparaciones legítimas sin motivo.`,
    ).toBe(produceTablas(nombre));
  });
});

describe('produceTablas — los bordes del nombre', () => {
  it('reconoce las dos extensiones, en cualquier caja', () => {
    expect(produceTablas('a.xlsx')).toBe(true);
    expect(produceTablas('a.XLSX')).toBe(true);
    expect(produceTablas('a.xlsm')).toBe(true);
  });

  it('un nombre con varios puntos se juzga por el último', () => {
    expect(produceTablas('tarifas.2026.final.xlsx')).toBe(true);
    expect(produceTablas('hoja.xlsx.bak')).toBe(false);
  });

  it('⚠️ el nombre ausente o sin extensión NO activa la guarda, y es deliberado', () => {
    // Un nombre que falta no es prueba de que haya tablas. Rechazar por su
    // ausencia bloquearía la reparación de documentos de prosa, que es
    // justamente para lo que la reparación existe. La protección de esos casos
    // viene de la OTRA fuente: los trozos ya persistidos.
    for (const nombre of [null, undefined, '', '   ', 'sinextension']) {
      expect(produceTablas(nombre)).toBe(false);
    }
  });
});
