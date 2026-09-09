import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  invariantesDelDocumentoDeEstado,
  repartoPorClase,
  type Violacion,
} from './invariantes-de-estado';

/**
 * ⚠️ LA MITAD QUE IMPORTA DE ESTA BATERÍA ES LA PRIMERA, y no la del documento
 * real: **un chequeo que nunca ha disparado es una pantalla apagada.** Antes de
 * creerse ningún recuento sobre `Estado_Del_MVP.md` hay que saber que las cuatro
 * clases saben dispararse y que un documento limpio da cero. Esa es la regla del
 * cero de F-103 aplicada al propio verificador.
 */

const clases = (vs: Violacion[]) => vs.map(v => v.clase).sort();

describe('invariantesDelDocumentoDeEstado — control positivo por clase', () => {
  it('un documento bien formado no produce ninguna violación', () => {
    const limpio = [
      '# Estado',
      '',
      '| ficha | qué es | estado |',
      '|---|---|---|',
      '| **B.204** | la ruta la elige el cliente | abierto — 09/09/2026 |',
      '',
      '## B.205 — lo que se cobra y no se devuelve (09/09/2026)',
      '',
      'Una referencia suelta a B.204 no declara nada: apunta.',
    ].join('\n');
    expect(invariantesDelDocumentoDeEstado(limpio)).toEqual([]);
  });

  it('I1 · una ficha citada y nunca declarada es `ficha_sin_casa`', () => {
    const texto = 'Esto lo arregló B.177, y no hay ficha suya en ninguna parte.';
    expect(clases(invariantesDelDocumentoDeEstado(texto))).toEqual(['ficha_sin_casa']);
  });

  it('I1 · fila-índice MÁS sección propia son DOS casas, y se canta', () => {
    const texto = [
      '| **B.204 — sin clasificar** | ver 5.1 | 09/09/2026 |',
      '',
      '## B.204 — la ruta la elige el cliente (09/09/2026)',
    ].join('\n');
    const vs = invariantesDelDocumentoDeEstado(texto);
    expect(clases(vs)).toEqual(['ficha_con_dos_casas']);
    expect(vs[0].texto).toContain('2 sitios');
  });

  it('I2 · una casa sin fecha es presente perpetuo', () => {
    const texto = '## B.180 — los botones no dicen lo que cuestan';
    expect(clases(invariantesDelDocumentoDeEstado(texto))).toEqual(['casa_sin_fecha']);
  });

  it('I3 · un «bloquea» fuera de una casa es una segunda respuesta', () => {
    const texto = [
      '## B.177 — arreglado (09/09/2026)',
      '',
      'Lo que bloquea hoy son dos cosas.',
    ].join('\n');
    expect(clases(invariantesDelDocumentoDeEstado(texto))).toEqual(['bloqueo_fuera_de_casa']);
  });

  it('I3 · «no bloquea» cuenta igual: negar un estado es afirmarlo', () => {
    const texto = [
      '## B.177 — arreglado (09/09/2026)',
      '',
      'Hoy no bloquea nada.',
    ].join('\n');
    expect(clases(invariantesDelDocumentoDeEstado(texto))).toEqual(['bloqueo_fuera_de_casa']);
  });

  it('I3 · dentro de un bloque DERIVADO no se juzga: ahí el texto se reconstruye', () => {
    const texto = [
      '## B.177 — arreglado (09/09/2026)',
      '',
      '<!-- DERIVADO desde las fichas: no editar a mano -->',
      'Hoy no bloquea nada.',
      '<!-- /DERIVADO -->',
    ].join('\n');
    expect(invariantesDelDocumentoDeEstado(texto)).toEqual([]);
  });

  it('el separador de una tabla no declara nada', () => {
    const texto = [
      '| ficha | estado |',
      '|---|---|',
      '| **B.204** | abierto — 09/09/2026 |',
    ].join('\n');
    expect(invariantesDelDocumentoDeEstado(texto)).toEqual([]);
  });

  it('una ficha en una celda que NO es la primera es referencia, no casa', () => {
    const texto = [
      '## B.204 — la ruta la elige el cliente (09/09/2026)',
      '',
      '| pieza | de dónde sale |',
      '|---|---|',
      '| el arreglo | lo mismo que B.204 |',
    ].join('\n');
    expect(invariantesDelDocumentoDeEstado(texto)).toEqual([]);
  });

  it('el reparto por clase suma exactamente las violaciones', () => {
    const texto = [
      '## B.180 — sin fecha',
      'Y aquí se dice que algo bloquea.',
      'Y se cita B.999 que no tiene casa.',
    ].join('\n');
    const vs = invariantesDelDocumentoDeEstado(texto);
    const reparto = repartoPorClase(vs);
    const suma = Object.values(reparto).reduce((a, b) => a + b, 0);
    expect(suma).toBe(vs.length);
    expect(vs.length).toBe(3);
  });
});

/**
 * ⚠️ EL TECHO ES UNA LÁPIDA CON FECHA, NO UN APROBADO.
 *
 * `Estado_Del_MVP.md` NO cumple hoy los invariantes, y este número es la deuda
 * medida el 09/09/2026, antes de aplicar las cláusulas (a), (b) y (c) de
 * F-106 P4. **Su destino es CERO**, y bajarlo es el trabajo del commit de
 * reorganización — no de éste.
 *
 * ⚠️ SE PREDIJO 29 Y SALIERON 31. **PREDICCIÓN FALLADA, y se cuenta.** El número
 * se escribió aquí antes de ejecutar nada. El reparto predicho acertó tres de
 * cuatro clases exactas —`ficha_sin_casa` 4, `ficha_con_dos_casas` 4 (y las
 * cuatro nombradas: B.197, B.199, B.204, B.205), `casa_sin_fecha` 15— y falló
 * entero en la cuarta: `bloqueo_fuera_de_casa` predicho «~6», real **8**. Las
 * dos que faltaban son de la clase más difícil de contar de memoria: párrafos de
 * prosa que hablan DE la disciplina («decidir si bloquean es del director») y
 * que el chequeo no distingue de los que la violan. Ese es su límite, y está
 * dicho.
 *
 * ⚠️ Y ES UN TRINQUETE, no una tolerancia: solo puede BAJAR. Quien arregle
 * violaciones baja el número en el mismo commit; si no lo baja, la próxima
 * regresión cabe dentro del hueco que dejó y no la ve nadie.
 */
const TECHO_DECLARADO_09_09_2026 = 31;

describe('Estado_Del_MVP.md — la deuda de forma, medida', () => {
  const ruta = join(process.cwd(), 'claude', 'Estado_Del_MVP.md');
  const texto = readFileSync(ruta, 'utf-8');

  it('no supera el techo declarado, que solo puede bajar', () => {
    const violaciones = invariantesDelDocumentoDeEstado(texto);
    const reparto = repartoPorClase(violaciones);
    const detalle = Object.entries(reparto)
      .map(([clase, n]) => `${clase}=${n}`)
      .join(' · ');
    // ⚠️ LA LISTA VA EN EL MENSAJE, no solo el recuento: un fallo que dice «31»
    // manda a contar a mano, y contar a mano es donde se cuela un artefacto por
    // dato. Con las líneas delante, quien lo lea puede abrirlas.
    const lista = violaciones
      .map(v => `  · L${v.linea} [${v.clase}]${v.ficha ? ` ${v.ficha}` : ''} — ${v.texto}`)
      .join('\n');

    expect(
      violaciones.length,
      `Estado_Del_MVP.md tiene ${violaciones.length} violaciones de forma ` +
      `(${detalle}) y el techo declarado es ${TECHO_DECLARADO_09_09_2026}.\n${lista}\n` +
      `Si has ARREGLADO violaciones, baja el techo en este mismo commit. Si has ` +
      `AÑADIDO una, el sitio de arreglarla es el documento, no este número.`,
    ).toBeLessThanOrEqual(TECHO_DECLARADO_09_09_2026);
  });

  it('el documento existe y tiene contenido — el cero de un fichero vacío no cuenta', () => {
    // Sin esto, un `Estado_Del_MVP.md` borrado daría CERO violaciones y el
    // chequeo pasaría en verde diciendo que la forma es perfecta. Es la regla
    // del cero aplicada al propio fixture.
    expect(texto.length).toBeGreaterThan(10_000);
  });
});
