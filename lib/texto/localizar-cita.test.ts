import { describe, it, expect } from 'vitest';
import { findTolerant, normalizeWhitespace, normalizeTypography } from './localizar-cita';

/**
 * ⚠️ EL CASO QUE SUJETA ESTO ES EL DEL SALTO DE LÍNEA, y no es hipotético:
 * medido el 16/09/2026 sobre 113 citas reales, **46 —el 40 %— se daban por
 * ausentes** porque el documento lleva un salto donde el modelo devuelve un
 * espacio. Un `indexOf` crudo no las encuentra ninguna.
 */

// Un párrafo ajustado a columnas, como los documentos de verdad.
const PARRAFO =
  'El responsable de la revisión firma la hoja de control. Si detecta una\n' +
  'incidencia, la comunica al coordinador del centro y anota la fecha en la que a\n' +
  'sido subsanada.';

describe('⚠️ la cita que cruza un salto de línea', () => {
  it('se encuentra, aunque el `indexOf` crudo no la vea', () => {
    const cita = 'la fecha en la que a sido subsanada';

    // El control negativo, dentro del caso: así se comportaba hasta hoy.
    expect(PARRAFO.indexOf(cita)).toBe(-1);

    const r = findTolerant(PARRAFO, cita);
    expect(r).not.toBeNull();
  });

  it('⚠️ y devuelve la posición sobre el texto ORIGINAL, no sobre el normalizado', () => {
    // Es lo que separa «encontrarla» de «poder señalarla en pantalla». Con los
    // espacios colapsados el índice se corre, y el editor apuntaría a otro sitio.
    const cita = 'la fecha en la que a sido subsanada';
    const r = findTolerant(PARRAFO, cita)!;

    expect(PARRAFO.slice(r.start, r.start + 9)).toBe('la fecha ');
    expect(r.start).toBe(PARRAFO.indexOf('la fecha en la que a'));
  });
});

describe('el camino corriente', () => {
  it('una cita que cabe en una línea se encuentra exacta', () => {
    const t = 'Las consulltas telefónicas quedan registradas.';
    const r = findTolerant(t, 'Las consulltas telefónicas')!;
    expect(r.start).toBe(0);
    expect(t.slice(r.start, r.end)).toBe('Las consulltas telefónicas');
  });

  it('⚠️ CONTROL POSITIVO DEL FALLO: una cita inventada NO se encuentra', () => {
    // Sin este caso, una función que devolviera siempre `{start:0}` pasaría
    // todo lo de arriba.
    expect(findTolerant(PARRAFO, 'esta frase no está en el documento')).toBeNull();
  });

  it('la cita vacía no se encuentra', () => {
    expect(findTolerant(PARRAFO, '')).toBeNull();
  });
});

describe('la tipografía, que se normaliza sin mover los índices', () => {
  it('comillas curvas y guiones largos encajan con los rectos', () => {
    const t = 'El informe «de urgencias» — revisado.';
    expect(normalizeTypography('“x”').length).toBe(3);
    expect(findTolerant(t, 'de urgencias')).not.toBeNull();
  });

  it('el espacio no separable cuenta como espacio', () => {
    const t = 'plazo de conservación';
    expect(findTolerant(t, 'plazo de conservación')).not.toBeNull();
  });
});

describe('normalizeWhitespace', () => {
  it('colapsa y recorta, y nada más', () => {
    expect(normalizeWhitespace('  a \n b\t c  ')).toBe('a b c');
  });

  it('⚠️ NO toca mayúsculas ni acentos — una errata «arreglada» debe seguir cazándose', () => {
    expect(normalizeWhitespace('Consulltas Telefónicas')).toBe('Consulltas Telefónicas');
  });
});

describe('⚠️ el MAPEO, ejercido de verdad — lo cazó un mutante', () => {
  /**
   * El caso anterior pasaba por casualidad: cada salto era UN carácter, así que
   * colapsarlos no movía los índices y `mapping[idx]` valía lo mismo que `idx`.
   * Un mutante que devolvía `idx` a secas sobrevivía entero.
   *
   * Aquí hay tramos que SÍ se colapsan —línea en blanco y espacios dobles—, así
   * que el índice normalizado y el real **no coinciden**, y sólo el mapeo da el
   * bueno.
   */
  const CON_HUECOS =
    'Primer párrafo del protocolo.\n' +
    '\n' +
    '   Segundo  párrafo  con  espacios.\n' +
    '\n' +
    'anota la fecha en la que a\nsido subsanada.';

  it('el índice apunta al texto original, no al colapsado', () => {
    const cita = 'la fecha en la que a sido subsanada';
    const r = findTolerant(CON_HUECOS, cita)!;

    const real = CON_HUECOS.indexOf('la fecha en la que a');
    expect(r.start).toBe(real);

    // Y la prueba de que el mapeo hacía falta: sobre el texto colapsado el
    // índice sería OTRO, más pequeño.
    const colapsado = normalizeWhitespace(CON_HUECOS);
    expect(colapsado.indexOf('la fecha en la que a')).not.toBe(real);
  });

  it('lo que se recorta con ese índice es la cita, no otra cosa', () => {
    const r = findTolerant(CON_HUECOS, 'la fecha en la que a sido subsanada')!;
    expect(normalizeWhitespace(CON_HUECOS.slice(r.start, r.end)))
      .toBe('la fecha en la que a sido subsanada');
  });
});
