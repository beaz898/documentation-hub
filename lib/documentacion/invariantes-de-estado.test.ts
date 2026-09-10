import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  invariantesDelDocumentoDeEstado,
  repartoPorClase,
  rutasDeCasasExternas,
  type Violacion,
} from './invariantes-de-estado';

/**
 * ⚠️ LA MITAD QUE IMPORTA DE ESTA BATERÍA ES LA PRIMERA, y no la del documento
 * real: **un chequeo que nunca ha disparado es una pantalla apagada.** Antes de
 * creerse ningún recuento sobre `Estado_Del_MVP.md` hay que saber que las seis
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

  it('las rutas de las marcas salen sin repetir y en orden de aparición', () => {
    const texto = [
      '<!-- CASA-EXTERNA: B.1 → claude/A.md -->',
      '<!-- CASA-EXTERNA: B.2 → claude/A.md -->',
      '<!-- CASA-EXTERNA: B.3 -> claude/B.md -->',
    ].join('\n');
    expect(rutasDeCasasExternas(texto)).toEqual(['claude/A.md', 'claude/B.md']);
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
 * ⚠️ LOS TRES CERROJOS DE LA CASA EXTERNA, uno por caso y ninguno de palabra.
 *
 * La pregunta que estos casos contestan no es «¿funciona la marca?» sino **«¿se
 * puede usar la marca para escapar del invariante?»**. Por eso los cinco casos
 * son de ABUSO —marca que miente, fichero que no abre, casa sin fecha, casa
 * doble— y solo el primero es de uso legítimo: una exención que solo se prueba
 * por su camino feliz no se ha probado.
 */
describe('la casa externa — los tres cerrojos', () => {
  const fuera = (contenido: string) =>
    new Map([['claude/Otro.md', contenido]]);

  it('cerrojo 1 · la marca se SIGUE: con casa al otro lado, la cita deja de ser violación', () => {
    const texto = [
      '# Estado',
      '<!-- CASA-EXTERNA: B.198 → claude/Otro.md -->',
      'Aquí solo se cita B.198, que es una referencia y apunta.',
    ].join('\n');
    const externo = '## B.198 · la omisión que causa las dos averías (08/09/2026)';
    expect(invariantesDelDocumentoDeEstado(texto, fuera(externo))).toEqual([]);
  });

  it('cerrojo 1 · una marca que apunta a un fichero SIN casa no concede: la marca no se cree', () => {
    const texto = [
      '<!-- CASA-EXTERNA: B.198 → claude/Otro.md -->',
      'Aquí se cita B.198.',
    ].join('\n');
    // Mención en prosa al otro lado: es referencia, no casa. La marca miente.
    const externo = 'Allí se habla de B.198 en un párrafo, que no declara nada.';
    const vs = invariantesDelDocumentoDeEstado(texto, fuera(externo));
    // ⚠️ SALEN LAS DOS, y es lo correcto aunque cueste una línea de más: son dos
    // afirmaciones distintas y las dos son verdad —«esta marca miente» y «esta
    // ficha no tiene casa que yo pueda ver»—, y quien lea el fallo necesita la
    // segunda para saber que arreglar la marca no basta si además no hay casa.
    // Escrito tras fallar la predicción: se predijo UNA sola clase aquí.
    expect(clases(vs)).toEqual(['casa_externa_ausente', 'ficha_sin_casa']);
    expect(vs.find(v => v.clase === 'casa_externa_ausente')?.texto)
      .toContain('no tiene casa');
  });

  it('cerrojo 1 · si el fichero no se puede abrir TAMPOCO concede: falla cerrada', () => {
    const texto = [
      '<!-- CASA-EXTERNA: B.198 → claude/Otro.md -->',
      'Aquí se cita B.198.',
    ].join('\n');
    const vs = invariantesDelDocumentoDeEstado(texto, new Map());
    // Las dos, por lo mismo que arriba: no poder abrir el fichero no le da casa.
    expect(clases(vs)).toEqual(['casa_externa_ausente', 'ficha_sin_casa']);
    expect(vs.find(v => v.clase === 'casa_externa_ausente')?.texto)
      .toContain('no pudo abrirlo');
  });

  it('cerrojo 2 · la marca MUEVE la fecha, no la perdona', () => {
    const texto = [
      '<!-- CASA-EXTERNA: B.198 → claude/Otro.md -->',
      'Aquí se cita B.198.',
    ].join('\n');
    const externo = '## B.198 · declarada allí, y sin fecha ninguna';
    expect(clases(invariantesDelDocumentoDeEstado(texto, fuera(externo))))
      .toEqual(['casa_externa_sin_fecha']);
  });

  it('cerrojo 3 · casa aquí MÁS marca son dos casas: la marca sustituye, no duplica', () => {
    const texto = [
      '## B.198 · declarada aquí (09/09/2026)',
      '<!-- CASA-EXTERNA: B.198 → claude/Otro.md -->',
    ].join('\n');
    const externo = '## B.198 · y también allí (08/09/2026)';
    const vs = invariantesDelDocumentoDeEstado(texto, fuera(externo));
    expect(clases(vs)).toEqual(['ficha_con_dos_casas']);
    expect(vs[0].texto).toContain('2 sitios');
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
 *
 * ⚠️ 10/09/2026 · BAJA DE 31 A 29 AL CORREGIR I1, y el reparto importa más que
 * el total, porque el total solo dice que bajó: **−3 falsos positivos y +1
 * verdadero.** Se fueron B.198, B.175 y B.178, que eran citas correctas a fichas
 * con casa fuera y que I1 obligaba al documento a adoptar; y entró
 * `casa_externa_sin_fecha` en `Plan_F103_P3.md:176`, un presente perpetuo que
 * antes no podía ver nadie porque estaba al otro lado de una cita.
 * Que un cambio del instrumento haga BAJAR el número no lo absuelve —cambiar la
 * regla después de ver la medida es la forma más fácil de ajustarla a los
 * datos—; lo que lo absuelve es que en la misma pasada AÑADE una violación que
 * antes no se veía. Si solo aflojara, el número no habría subido nunca.
 */
const TECHO_DECLARADO_10_09_2026 = 29;

describe('Estado_Del_MVP.md — la deuda de forma, medida', () => {
  const ruta = join(process.cwd(), 'claude', 'Estado_Del_MVP.md');
  const texto = readFileSync(ruta, 'utf-8');

  // ⚠️ QUIÉN LEE DEL DISCO ES ESTE TEST, y QUÉ ficheros abrir se lo dice el
  // propio documento a través de `rutasDeCasasExternas`. Listarlos a mano aquí
  // sería una segunda lista que se separaría de las marcas el día que alguien
  // añadiera una — y las dos seguirían pareciendo correctas por su cuenta.
  // Un fichero que no se puede leer NO se mete en el mapa: así lo reporta el
  // chequeo como `casa_externa_ausente`, con su línea y su mensaje, en vez de
  // reventar aquí con una excepción que no señala a la marca culpable.
  const externos = new Map<string, string>();
  for (const relativa of rutasDeCasasExternas(texto)) {
    try {
      externos.set(relativa, readFileSync(join(process.cwd(), relativa), 'utf-8'));
    } catch { /* se queda fuera del mapa: el chequeo lo canta */ }
  }

  it('no supera el techo declarado, que solo puede bajar', () => {
    const violaciones = invariantesDelDocumentoDeEstado(texto, externos);
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
      `(${detalle}) y el techo declarado es ${TECHO_DECLARADO_10_09_2026}.\n${lista}\n` +
      `Si has ARREGLADO violaciones, baja el techo en este mismo commit. Si has ` +
      `AÑADIDO una, el sitio de arreglarla es el documento, no este número.`,
    ).toBeLessThanOrEqual(TECHO_DECLARADO_10_09_2026);
  });

  it('el documento existe y tiene contenido — el cero de un fichero vacío no cuenta', () => {
    // Sin esto, un `Estado_Del_MVP.md` borrado daría CERO violaciones y el
    // chequeo pasaría en verde diciendo que la forma es perfecta. Es la regla
    // del cero aplicada al propio fixture.
    expect(texto.length).toBeGreaterThan(10_000);
  });
});
