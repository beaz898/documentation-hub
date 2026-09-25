import { describe, it, expect } from 'vitest';
import { cargarCasos, validarCasos, validarElTechoDeFalsos } from './examen.mjs';

/**
 * LA BATERÍA DE LA VALIDACIÓN DE LOS CASOS DEL EXAMEN (25/09/2026).
 *
 * ⚠️ POR QUÉ EXISTE, y es la razón por la que `validarCasos` se exportó: hasta
 * hoy la validación era la única pieza del examen **sin una sola prueba**. Corría
 * antes de cada tanda, decidía si se gastaban créditos, y nadie podía falsarla.
 *
 * ⚠️ Y POR QUÉ ESTO SÍ CABE EN VITEST: es código puro. Entra un objeto de caso,
 * sale una lista de cadenas. Ni red, ni base, ni modelo — el alcance declarado en
 * `vitest.config.mts`. Importar `examen.mjs` ya no lanza nada: `main()` está
 * detrás de la guarda de invocación directa, y el caso de más abajo lo comprueba.
 *
 * ⚠️ LO QUE ESTA BATERÍA NO CUBRE: que el caso MIDA lo que dice medir. Comprueba
 * la FORMA del caso, no su contenido. Un caso con un discriminante mal elegido
 * pasa esta batería y lo caza `verificarDiscriminantesEnFragmentos` en la pasada.
 */

/** Un caso mínimo que valida, del que se derivan los defectuosos por mutación. */
const base = () => ({
  fichero: 'X_prueba.mjs',
  id: 'X',
  nivel: 'precision-pura',
  analizado: 'A.txt',
  corpusExacto: ['B.txt'],
  pasadas: 5,
  debenSalir: [],
  noDebenSalir: [],
  umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 },
  lineaDeBase: { aciertos: 0 },
});

/** Un falso CONOCIDO: lleva `patronDeF22`. Con frecuencia si se le pasa. */
const falsoConocido = (frecuencia) => ({
  id: 'X-FALSO',
  patronDeF22: 'algun-patron',
  cuentaComoFallo: true,
  ...(frecuencia ? { lineaDeBase: { aparicionesSobrePasadas: frecuencia } } : {}),
});

/** Una REGLA: no nombra ninguna aparición pasada. */
const regla = () => ({ id: 'X-REGLA', regla: 'TODO_HALLAZGO', cuentaComoFallo: true });

describe('el techo de falsos — las tres mitades, cada una con su caso decisivo', () => {
  it('1 · falso conocido SIN frecuencia y con techo numérico: NO pasa', () => {
    const c = { ...base(), noDebenSalir: [falsoConocido(null)] };
    const problemas = validarElTechoDeFalsos(c, c.id);
    expect(problemas.join(' ')).toContain('SIN frecuencia medida');
  });

  it('1-bis · el MISMO caso con el techo en null y el estado puesto: pasa', () => {
    // ⚠️ ES EL CONTROL POSITIVO DE LA MITAD 1: sin él, un «no pasa» no distingue
    // «la regla funciona» de «la regla rechaza cualquier cosa».
    const c = {
      ...base(),
      noDebenSalir: [falsoConocido(null)],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: null, estado: 'LINEA_DE_BASE_PENDIENTE' },
    };
    expect(validarElTechoDeFalsos(c, c.id)).toEqual([]);
  });

  it('2 · falso conocido sin frecuencia y SIN declarar el estado: NO pasa', () => {
    const c = {
      ...base(),
      noDebenSalir: [falsoConocido(null)],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: null },
    };
    expect(validarElTechoDeFalsos(c, c.id).join(' ')).toContain('LINEA_DE_BASE_PENDIENTE');
  });

  it('2-bis · declarar el estado Y poner un techo a la vez: NO pasa', () => {
    const c = {
      ...base(),
      noDebenSalir: [falsoConocido('2/2')],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 3, estado: 'LINEA_DE_BASE_PENDIENTE' },
    };
    expect(validarElTechoDeFalsos(c, c.id).join(' ')).toContain('Una de las dos cosas miente');
  });

  it('3 · todos los falsos CON frecuencia y el techo en null: NO pasa', () => {
    // La mitad que impide que un caso ya medido se esconda detrás del estado
    // para siempre. Sin ella el trinquete nunca empieza.
    const c = {
      ...base(),
      noDebenSalir: [falsoConocido('2/2')],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: null },
    };
    expect(validarElTechoDeFalsos(c, c.id).join(' ')).toContain('sigue en `null`');
  });

  it('3-bis · el MISMO caso con su techo escrito: pasa', () => {
    const c = {
      ...base(),
      noDebenSalir: [falsoConocido('2/2')],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 5 },
    };
    expect(validarElTechoDeFalsos(c, c.id)).toEqual([]);
  });
});

describe('la distinción que la hace aplicable: falso conocido frente a REGLA', () => {
  /**
   * ⚠️ ES EL CASO QUE SALVÓ A P4, y por eso está aquí y no en un comentario: la
   * primera redacción de la regla prohibía un techo numérico en cualquier caso
   * con `lineaDeBase.aciertos` nulo, y P4 —`umbralDeAlarma` en 0 sobre un camino
   * que nunca se ha ejecutado— es legítimo, porque su `noDebenSalir` es una
   * EXIGENCIA («ningún hallazgo sobre las otras doce») y no la frecuencia de un
   * falso que apareció.
   */
  it('una REGLA con techo 0 y sin línea de base: pasa', () => {
    const c = { ...base(), noDebenSalir: [regla()], lineaDeBase: { aciertos: null } };
    expect(validarElTechoDeFalsos(c, c.id)).toEqual([]);
  });

  it('un caso SIN noDebenSalir no queda obligado a nada', () => {
    const c = { ...base(), noDebenSalir: [], lineaDeBase: { aciertos: null } };
    expect(validarElTechoDeFalsos(c, c.id)).toEqual([]);
  });

  it('un falso declarado `cuentaComoFallo: false` no cuenta como falso conocido', () => {
    // N1-NURIA: sin cita literal, no comprobable, y declarado explícitamente.
    const c = {
      ...base(),
      noDebenSalir: [{ id: 'X-NO', patronDeF22: 'p', cuentaComoFallo: false }],
    };
    expect(validarElTechoDeFalsos(c, c.id)).toEqual([]);
  });

  it('omitir `cuentaComoFallo` CUENTA — el defecto es el lado seguro', () => {
    const c = { ...base(), noDebenSalir: [{ id: 'X-NO', patronDeF22: 'p' }] };
    expect(validarElTechoDeFalsos(c, c.id).join(' ')).toContain('SIN frecuencia medida');
  });
});

describe('una especie por nombre: `cuentaComoFalso` no es `cuentaComoFallo`', () => {
  it('la grafía equivocada se canta, esté donde esté', () => {
    const c = {
      ...base(),
      noDebenSalir: [{ id: 'X-NO', regla: 'R', cuentaComoFalso: true }],
    };
    expect(validarElTechoDeFalsos(c, c.id).join(' ')).toContain('no `cuentaComoFalso`');
  });

  it('la grafía correcta no se canta — control positivo', () => {
    const c = { ...base(), noDebenSalir: [regla()] };
    expect(validarElTechoDeFalsos(c, c.id)).toEqual([]);
  });
});

describe('LOS DIEZ CASOS REALES — el control positivo de toda la regla', () => {
  /**
   * ⚠️ ESTO ES LA MITAD QUE HACE QUE LO DE ARRIBA SIGNIFIQUE ALGO. Una regla que
   * rechaza casos sintéticos y nadie ha pasado por los de verdad puede estar
   * rechazando a todos. Y al revés: los diez pasando sin los sintéticos de arriba
   * sería una pantalla apagada — hoy la regla **no caza ninguno de los diez**, y
   * eso sólo se lee como bueno porque existe la prueba de que sabe cazar.
   */
  it('los casos de examen/casos/ validan, y son diez', async () => {
    const casos = await cargarCasos();
    expect(casos.length).toBe(10);
    expect(validarCasos(casos)).toEqual([]);
  });

  it('importar el ejecutor NO lo ejecuta', async () => {
    // Si `main()` corriera al importar, este fichero habría intentado hablar con
    // el endpoint —y con `--lanzar` habría gastado créditos desde una batería.
    // El caso es que hayamos llegado aquí: los `import` de arriba ya pasaron.
    const casos = await cargarCasos();
    expect(Array.isArray(casos)).toBe(true);
  });
});
