import { describe, expect, it } from 'vitest';

import { claveSegura, esVarianteDeEscritura, normalize } from './normalize';

/**
 * BATERÍA DEL COMPARADOR DE TRES NIVELES (F-82 P2).
 *
 * Los tres niveles con los que la fase 2 clasifica una celda:
 *   IDÉNTICO           a === b
 *   VARIANTE           esVarianteDeEscritura(a, b)
 *   DISCREPANCIA PLENA ni lo uno ni lo otro
 *
 * Lo que fija esta batería no es aritmética: es POR QUÉ el nivel seguro no
 * toca puntuación. La tabla de abajo lo mide carácter a carácter en vez de
 * razonarlo, que es lo que pedía el criterio de F-82 P2.
 */

type Nivel = 'identico' | 'variante' | 'plena';

function nivel(a: string, b: string): Nivel {
  if (a === b) return 'identico';
  return esVarianteDeEscritura(a, b) ? 'variante' : 'plena';
}

/**
 * LOS CARACTERES QUE `normalize` ELIMINA, uno a uno, con un par que los pone a
 * prueba. `normalize` funde los dos valores de cada fila; el nivel seguro NO
 * debe fundir ninguno.
 *
 * Son 27 POSICIONES y 24 CARACTERES: en la clase del fuente `"` aparece tres
 * veces y `'` dos. Ver el test de las comillas tipográficas, más abajo, para
 * lo que ese detalle destapó.
 */
const ELIMINADOS: Array<{ nombre: string; a: string; b: string; porque: string }> = [
  { nombre: '. millar', a: '1.500', b: '1500', porque: 'factor mil' },
  { nombre: '. decimal', a: '45.0', b: '450', porque: 'factor diez' },
  { nombre: '. abreviatura', a: 'Dr. Pablo Reyes', b: 'Dr Pablo Reyes', porque: 'el MISMO punto que los dos de arriba' },
  { nombre: ', decimal', a: '25,00', b: '2500', porque: 'factor cien' },
  { nombre: ', lista', a: 'Lunes, Martes', b: 'Lunes Martes', porque: 'separador' },
  { nombre: '; separador', a: 'A;B', b: 'AB', porque: 'separador' },
  { nombre: ': hora', a: '10:30', b: '1030', porque: 'hora contra número' },
  { nombre: '! énfasis', a: 'Urgente!', b: 'Urgente', porque: 'marca del autor' },
  { nombre: '? duda', a: 'Revisar?', b: 'Revisar', porque: 'marca del autor' },
  { nombre: '" comilla recta', a: '"Caso A"', b: 'Caso A', porque: 'entrecomillado' },
  { nombre: "' apóstrofo recto", a: "O'Brien", b: 'OBrien', porque: 'apellido' },
  { nombre: '« » comilla latina', a: '«Caso»', b: 'Caso', porque: 'entrecomillado' },
  { nombre: '( ) contabilidad', a: '(500)', b: '500', porque: 'NEGATIVO en contabilidad' },
  { nombre: '[ ] estado', a: '[borrador]', b: 'borrador', porque: 'marca de estado' },
  { nombre: '{ } agrupación', a: '{A}', b: 'A', porque: 'agrupación' },
  { nombre: '- código', a: '12-345-678', b: '12345678', porque: 'código estructurado' },
  { nombre: '- SIGNO', a: '-5', b: '5', porque: 'EL MÁS CLARO: -5 no es 5' },
  { nombre: '- rango', a: '10-20', b: '1020', porque: 'rango contra número' },
  { nombre: '— raya', a: 'A—B', b: 'AB', porque: 'inciso' },
  { nombre: '– semirraya', a: '10–20', b: '1020', porque: 'rango' },
  { nombre: '… suspensivos', a: 'Texto…', b: 'Texto', porque: 'truncado contra completo' },
  { nombre: '* markdown', a: '**24 HORAS**', b: '24 HORAS', porque: 'marcado (aquí fundir SÍ se quería)' },
  { nombre: '_ identificador', a: 'COD_A', b: 'CODA', porque: 'dos códigos distintos' },
  { nombre: '# referencia', a: 'Ref #12', b: 'Ref 12', porque: 'marca de número' },
  { nombre: '` markdown', a: '`cod`', b: 'cod', porque: 'marcado' },
  { nombre: '~ aproximado', a: '~50', b: '50', porque: '~50 no es 50' },
];

describe('la tabla que decide el nivel seguro', () => {
  /**
   * EL RESULTADO QUE MANDA. `normalize` funde los 26 pares; el nivel seguro no
   * funde ninguno. Por eso el nivel seguro NO TOCA PUNTUACIÓN: no es timidez,
   * es que no existe un subconjunto que salve «Dr.» y condene «45.0» — es el
   * mismo carácter. «Seguro» no es propiedad del carácter, es del contexto.
   */
  it.each(ELIMINADOS)('$nombre — normalize los funde, el nivel seguro no ($porque)', ({ a, b }) => {
    expect(normalize(a), 'normalize DEBE fundirlos: es la comparación agresiva').toBe(normalize(b));
    expect(nivel(a, b), 'el nivel seguro NO puede fundirlos').toBe('plena');
  });
});

describe('lo que el nivel seguro SÍ funde, que es todo lo que puede', () => {
  it.each([
    ['caja', 'CHAMBERÍ', 'Chamberí'],
    ['caja en código', 'DIA-01', 'dia-01'],
    ['espacio al final', 'Chamberí ', 'Chamberí'],
    ['espacio al principio', ' Chamberí', 'Chamberí'],
    ['espacios internos', 'A  B', 'A B'],
    ['caja y espacio a la vez', ' SALAMANCA ', 'Salamanca'],
  ])('%s: %s / %s es variante de escritura', (_n, a, b) => {
    expect(nivel(a, b)).toBe('variante');
  });
});

describe('los cuatro casos de F-82 P2', () => {
  it('Chamberí con espacio → variante', () => {
    expect(nivel('Chamberí ', 'Chamberí')).toBe('variante');
  });
  it('mayúsculas → variante', () => {
    expect(nivel('CHAMBERÍ', 'Chamberí')).toBe('variante');
  });
  it('el factor cien → discrepancia PLENA (es el caso que motiva el commit)', () => {
    expect(nivel('25,00', '2500')).toBe('plena');
  });
  /**
   * El cuarto caso de F-82 P2 esperaba «variante», y sale PLENA. Es la
   * consecuencia de elegir el nivel seguro y está aceptada a conciencia: el
   * punto de «Dr.» es el mismo de «45.0», así que salvar este caso obligaría a
   * fundir el otro. Ver E2-bis en table-diff.test.ts.
   */
  it('Dr con y sin punto → discrepancia PLENA, y es el precio del nivel seguro', () => {
    expect(nivel('Dr. Pablo Reyes', 'Dr Pablo Reyes')).toBe('plena');
  });
});

describe('las fronteras', () => {
  it('idéntico no es variante', () => {
    expect(esVarianteDeEscritura('Chamberí', 'Chamberí')).toBe(false);
    expect(nivel('Chamberí', 'Chamberí')).toBe('identico');
  });

  it('una discrepancia real no se toca en ningún nivel', () => {
    expect(nivel('Salamanca', 'Chamberí')).toBe('plena');
    expect(normalize('Salamanca')).not.toBe(normalize('Chamberí'));
  });

  /** F-46: las tildes NO se tocan, ni en la comparación agresiva ni en la
   *  segura. «Chamberí» y «Chamberi» son valores distintos. */
  it('las tildes siguen distinguiendo (F-46)', () => {
    expect(nivel('Chamberí', 'Chamberi')).toBe('plena');
    expect(normalize('Chamberí')).not.toBe(normalize('Chamberi'));
  });

  /** La unidad no la salva ni `normalize`: el `€` no está en su clase. Es el
   *  control de que el comparador no se pasa de listo por otro lado. */
  it('la unidad es una diferencia en los dos niveles', () => {
    expect(nivel('25', '25 €')).toBe('plena');
    expect(normalize('25')).not.toBe(normalize('25 €'));
  });
});

/**
 * HALLAZGO ANOTADO, NO ARREGLADO (F-82 P2 → B.114).
 *
 * La cabecera de `normalize` dice que la clase incluye «el marcado Markdown
 * junto a la puntuación», y en el fuente aparecen `"` tres veces y `'` dos.
 * Esos duplicados son el rastro de unas comillas TIPOGRÁFICAS que se quisieron
 * poner y acabaron convertidas en rectas: `“`, `”` y `’` NO están en la clase.
 *
 * Consecuencia medida: `"Caso A"` se funde y `“Caso A”` no; `O'Brien` se funde
 * y `O’Brien` no. Y son justo las que produce cualquier procesador de textos,
 * así que es la forma que más va a llegar de un `.docx` real.
 *
 * ESTE TEST FIJA EL COMPORTAMIENTO DE HOY, no el deseado. Si alguien añade las
 * tipográficas a la clase, se pondrá rojo — y entonces hay que mirar B.114 y
 * la batería del colapso de F-46 antes de darlo por bueno, porque ampliar
 * `normalize` amplía lo que el colapso considera «la misma fila».
 */
describe('las comillas tipográficas NO están en la clase (B.114)', () => {
  it('las rectas se funden y las tipográficas no', () => {
    expect(normalize('"Caso A"')).toBe(normalize('Caso A'));
    expect(normalize('“Caso A”')).not.toBe(normalize('Caso A'));

    expect(normalize("O'Brien")).toBe(normalize('OBrien'));
    expect(normalize('O’Brien')).not.toBe(normalize('OBrien'));
  });

  it('para el nivel seguro da igual: no funde ninguna de las dos', () => {
    expect(nivel('"Caso A"', 'Caso A')).toBe('plena');
    expect(nivel('“Caso A”', 'Caso A')).toBe('plena');
  });
});

/**
 * EL CONTRATO QUE MANTIENE JUNTAS LAS DOS FORMAS DEL NIVEL SEGURO (F-84 1b).
 *
 * `esVarianteDeEscritura` es para PREGUNTAR y `claveSegura` para INDEXAR — la
 * fase 1 necesita una cadena porque un `Map` no acepta un predicado. Son la
 * misma comparación con dos formas, y si alguien toca una y no la otra, la
 * nominación y el emparejamiento dejarían de usar el mismo criterio: justo el
 * fallo contra el que avisa la regla de la cabecera de table-key.ts.
 */
describe('claveSegura y esVarianteDeEscritura no pueden separarse', () => {
  const VALORES = [
    'Chamberí', 'CHAMBERÍ', 'Chamberí ', ' Chamberí', 'Chamberi',
    'IMP-01', 'IMP01', 'imp-01', 'Dr. Pablo', 'Dr Pablo',
    '25,00', '2500', '1.500', '1,500', '-5', '5', 'A  B', 'A B', '',
  ];

  it('la equivalencia se cumple en los 361 pares', () => {
    let comprobados = 0;
    for (const a of VALORES) {
      for (const b of VALORES) {
        const porClave = claveSegura(a) === claveSegura(b);
        const porPredicado = a === b || esVarianteDeEscritura(a, b);
        expect(porClave, `${JSON.stringify(a)} / ${JSON.stringify(b)}`).toBe(porPredicado);
        comprobados++;
      }
    }
    expect(comprobados).toBe(VALORES.length * VALORES.length);
  });

  it('claveSegura es idempotente: indexar dos veces da lo mismo', () => {
    for (const v of VALORES) expect(claveSegura(claveSegura(v))).toBe(claveSegura(v));
  });
});

