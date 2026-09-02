import { describe, expect, it } from 'vitest';

import {
  debeReintentar,
  hayPresupuestoParaEsperar,
  planDeEmbedding,
  PRESUPUESTO_ESPERA_CONSULTA,
  PRESUPUESTO_ESPERA_INDEXACION,
  esErrorPasajeroDePinecone,
  esperaDeReintento,
  REINTENTOS_CONSULTA,
  REINTENTOS_INDEXACION,
} from './embeddings';

/**
 * LA POLÍTICA DE REINTENTO DE LOS EMBEDDINGS (regla 6, 01/09/2026).
 *
 * QUÉ VIGILA: hasta hoy `generateQueryEmbedding` —la llamada externa MÁS
 * FRECUENTE del producto, la que usan el chat y el agente— no tenía reintento
 * ninguno, ni siquiera ante un 429. La más transitada era la menos protegida.
 *
 * ⚠️ LO QUE ESTA BATERÍA NO PUEDE COMPROBAR, declarado:
 *
 *   · QUE EL REINTENTO OCURRA. Es red, y el alcance de la suite la prohíbe (la
 *     guarda de B.126 la bloquearía). Lo que se prueba es la POLÍTICA: cuándo
 *     se reintenta, cuánto se espera y cuántas veces.
 *   · QUE LA CONSULTA VAYA CON `inputType: 'query'`. Sin mocks no hay forma de
 *     observar el argumento con el que se llama al SDK. Y es justo el hallazgo
 *     que impidió reutilizar la función de indexación tal cual: tenía el
 *     `inputType` clavado en `'passage'`, y mandar una pregunta del chat como
 *     `passage` la habría sacado del espacio en el que se compara contra el
 *     corpus — degradando la recuperación en TODAS las preguntas, en silencio.
 *     Lo único que queda vigilándolo es que ahora es un parámetro explícito en
 *     los dos sitios, y el comentario que dice por qué. Se dice, no se finge.
 */

describe('esErrorPasajeroDePinecone — qué merece otro intento', () => {
  it('reconoce el 429 y el RESOURCE_EXHAUSTED', () => {
    expect(esErrorPasajeroDePinecone(new Error('PineconeUnmappedHttpError: 429 Too Many'))).toBe(true);
    expect(esErrorPasajeroDePinecone(new Error('RESOURCE_EXHAUSTED'))).toBe(true);
  });

  /**
   * ⚠️ EL CASO CUMPLIÓ SU FUNCIÓN. Se dejó escrito el 01/09 fijando que un 5xx
   * NO era pasajero, con la nota de que quien ampliara la política se enteraría
   * en rojo. El 02/09 se amplió y SE PUSO ROJO. Vigilaba lo que decía vigilar.
   *
   * Ahora fija lo contrario, y conserva la mitad que no cambia: **un 400 no será
   * pasajero nunca**. Reintentar una petición mal formada es repetir seis veces
   * contra la misma pared.
   */
  it('los 5xx SÍ son pasajeros desde el 02/09; un 400 no lo será nunca', () => {
    expect(esErrorPasajeroDePinecone(new Error('PineconeUnmappedHttpError: 500'))).toBe(true);
    expect(esErrorPasajeroDePinecone(new Error('PineconeUnmappedHttpError: 503 upstream'))).toBe(true);
    expect(esErrorPasajeroDePinecone(new Error('status: 502'))).toBe(true);

    expect(esErrorPasajeroDePinecone(new Error('HTTP 400: bad request'))).toBe(false);
    expect(esErrorPasajeroDePinecone(new Error('HTTP 404: not found'))).toBe(false);
  });

  /**
   * ⚠️ LA MITAD QUE IMPIDE REINTENTAR LO PERMANENTE, y no es teórica: un
   * `includes('500')` habría dado verdadero para este mensaje, y entonces un
   * error definitivo se habría reintentado hasta agotar el presupuesto entero.
   * El número tiene que ir precedido de algo que lo declare estado.
   */
  it('un 500 que NO es un estado no engaña a nadie', () => {
    expect(esErrorPasajeroDePinecone(new Error('procesados 500 fragmentos'))).toBe(false);
    expect(esErrorPasajeroDePinecone(new Error('chunk 5000 too long'))).toBe(false);
  });

  /** El SDK de Pinecone no siempre lanza `Error`. Nada de esto puede romper. */
  it('tolera lo que no es un Error', () => {
    expect(esErrorPasajeroDePinecone(null)).toBe(false);
    expect(esErrorPasajeroDePinecone(undefined)).toBe(false);
    expect(esErrorPasajeroDePinecone('429 en crudo')).toBe(true);
    expect(esErrorPasajeroDePinecone({ status: 429 })).toBe(false); // sin mensaje, no se ve
  });
});

describe('esperaDeReintento — exponencial con TOPE', () => {
  it('dobla en cada intento', () => {
    expect([0, 1, 2, 3, 4].map(esperaDeReintento)).toEqual([1000, 2000, 4000, 8000, 16000]);
  });

  /**
   * ⚠️ EL TOPE, que es la mitad que de verdad hace falta: sin él el intento 6
   * esperaría 64 s y el 8 más de cuatro minutos, dentro de una función que tiene
   * 30 o 60 segundos de vida.
   */
  it('no pasa de 30 s por mucho que suba el intento', () => {
    expect(esperaDeReintento(5)).toBe(30000);
    expect(esperaDeReintento(6)).toBe(30000);
    expect(esperaDeReintento(20)).toBe(30000);
  });
});

describe('debeReintentar — las dos condiciones, en un solo sitio', () => {
  const cuatroCientos = new Error('HTTP 400: bad request');
  const rate = new Error('429 Too Many Requests');

  const CONSULTA = planDeEmbedding('consulta');
  const INDEXACION = planDeEmbedding('indexacion');

  it('con el plan de CONSULTA se rinde al segundo reintento', () => {
    expect(debeReintentar(rate, 0, CONSULTA, 0)).toBe(true);
    expect(debeReintentar(rate, 1, CONSULTA, 1000)).toBe(true);
    expect(debeReintentar(rate, 2, CONSULTA, 3000)).toBe(false);
  });

  it('con el de INDEXACIÓN aguanta hasta el sexto si hay presupuesto', () => {
    expect(debeReintentar(rate, 5, INDEXACION, 0)).toBe(true);
    expect(debeReintentar(rate, 6, INDEXACION, 0)).toBe(false);
  });

  /**
   * ⚠️ LA MITAD NUEVA DEL 02/09: EL PRESUPUESTO MANDA AUNQUE QUEDEN INTENTOS.
   *
   * Sin ella, los seis reintentos son POR LOTE y `generateEmbeddings` recorre
   * los lotes en serie: un documento de 200 chunks son diez lotes, o sea 610 s
   * de espera pura contra un proveedor caído. El techo acota la LLAMADA, no el
   * lote, y por eso el peor caso ya no crece con el tamaño del documento.
   */
  it('sin presupuesto no se reintenta, aunque el error sea pasajero y queden intentos', () => {
    // Intento 4: la espera de 16 s no cabe en lo que queda (30 − 15).
    expect(debeReintentar(rate, 4, INDEXACION, 15000)).toBe(false);
    // Y con presupuesto de sobra, el mismo intento sí.
    expect(debeReintentar(rate, 4, INDEXACION, 0)).toBe(true);
  });

  /** La otra mitad: un error definitivo no se reintenta ni con presupuesto de
   *  sobra. Sin esto, un 400 se repetiría seis veces contra la misma pared. */
  it('un error definitivo no se reintenta ni en el primer intento', () => {
    expect(debeReintentar(cuatroCientos, 0, INDEXACION, 0)).toBe(false);
  });
});

/**
 * ⚠️ EL PRESUPUESTO TIENE QUE CABER EN EL TIEMPO DE LA FUNCIÓN, y esto es lo que
 * impidió copiar la política de indexación al camino de consulta.
 *
 * `/api/ask` tiene **30 s** y `/api/ingest` **300** (comprobado en Vercel el
 * 03/09; cuando este techo se eligió, el de ingest estaba declarado dos veces y
 * distinto y se eligió para el menor — B.141). Los seis reintentos de indexación
 * suman **61 s solo en esperas**: en `/api/ask` no
 * habrían dado un error limpio sino un TIMEOUT DE PLATAFORMA — sin `catch`, sin
 * `logUsage`, sin mensaje, y con el crédito ya cobrado.
 * Y en esos mismos 30 s corre además la llamada a Anthropic con su propio retry.
 */
describe('los dos presupuestos caben donde tienen que caber', () => {
  const suma = (n: number) =>
    Array.from({ length: n }, (_, i) => esperaDeReintento(i)).reduce((a, b) => a + b, 0);

  it('la CONSULTA gasta 3 s de espera, holgado en los 30 s de /api/ask', () => {
    expect(suma(REINTENTOS_CONSULTA)).toBe(3000);
    // Con el jitter máximo (30%) sigue por debajo de cuatro segundos.
    expect(suma(REINTENTOS_CONSULTA) * 1.3).toBeLessThan(4000);
  });

  /** Y la razón de que sean DOS: el de indexación NO cabría en /api/ask. */
  it('la INDEXACIÓN gasta 61 s, que NO cabrían en los 30 s de la consulta', () => {
    expect(suma(REINTENTOS_INDEXACION)).toBe(61000);
    expect(suma(REINTENTOS_INDEXACION)).toBeGreaterThan(30000);
  });

  it('el presupuesto de consulta es estrictamente menor que el de indexación', () => {
    expect(REINTENTOS_CONSULTA).toBeLessThan(REINTENTOS_INDEXACION);
  });
});

/**
 * ⚠️ EL PLAN DE CADA CAMINO, que es lo que hace VIGILABLE el hallazgo del
 * `inputType`.
 *
 * El argumento con el que se llama al SDK no se puede observar sin mocks —el
 * protocolo los prohíbe— así que, con el prefijo suelto en el sitio de llamada,
 * cambiar la consulta a `passage` no lo habría notado ningún caso. Y ese cambio
 * no da error: degrada la recuperación de TODAS las preguntas en silencio.
 * Convertido en un valor, se compara.
 */
describe('planDeEmbedding — el prefijo y el presupuesto son UNA decisión', () => {
  it('la consulta va como query, con pocos intentos y su techo de espera', () => {
    expect(planDeEmbedding('consulta')).toEqual({
      inputType: 'query',
      maxIntentos: REINTENTOS_CONSULTA,
      presupuestoEsperaMs: PRESUPUESTO_ESPERA_CONSULTA,
    });
  });

  it('la indexación va como passage, con muchos y su techo', () => {
    expect(planDeEmbedding('indexacion')).toEqual({
      inputType: 'passage',
      maxIntentos: REINTENTOS_INDEXACION,
      presupuestoEsperaMs: PRESUPUESTO_ESPERA_INDEXACION,
    });
  });

  /** Los dos caminos NO se pueden confundir: ni el prefijo ni el presupuesto
   *  coinciden. Si alguien unificara cualquiera de los dos, esto se pone rojo. */
  it('los dos planes difieren en las DOS cosas', () => {
    const consulta = planDeEmbedding('consulta');
    const indexacion = planDeEmbedding('indexacion');

    expect(consulta.inputType).not.toBe(indexacion.inputType);
    expect(consulta.maxIntentos).not.toBe(indexacion.maxIntentos);
  });
});

/**
 * EL TECHO TOTAL DE ESPERA (02/09/2026), que es lo que hace seguro ampliar la
 * cobertura a los 5xx.
 *
 * ⚠️ EL NÚMERO DE REINTENTOS NO ACOTABA NADA: los seis de indexación son POR
 * LOTE y `generateEmbeddings` recorre los lotes en serie. Un documento de 200
 * chunks son diez lotes — **610 s de espera pura** contra un proveedor caído,
 * para fallar igual al final. El peor caso crecía con el tamaño del documento.
 *
 * El presupuesto de `/api/ingest` son 300 s (Vercel, 03/09). Cuando este techo
 * se eligió estaba declarado dos veces y distinto y se eligió para el MENOR;
 * resultó ser el mayor, y la decisión no cambia — 30 s caben igual (B.141).
 */
describe('hayPresupuestoParaEsperar — el techo compartido entre lotes', () => {
  it('cabe lo que cabe, y el límite exacto cuenta como que cabe', () => {
    expect(hayPresupuestoParaEsperar(0, 1000, 30000)).toBe(true);
    expect(hayPresupuestoParaEsperar(15000, 15000, 30000)).toBe(true);
  });

  it('no cabe lo que se pasa, ni por un milisegundo', () => {
    expect(hayPresupuestoParaEsperar(15000, 15001, 30000)).toBe(false);
    expect(hayPresupuestoParaEsperar(30000, 1, 30000)).toBe(false);
  });

  /** En vacío: sin nada gastado y sin espera, siempre cabe. */
  it('con cero gastado y cero espera, cabe', () => {
    expect(hayPresupuestoParaEsperar(0, 0, 0)).toBe(true);
  });
});

describe('el peor caso de espera queda acotado', () => {
  const suma = (n: number) =>
    Array.from({ length: n }, (_, i) => esperaDeReintento(i)).reduce((a, b) => a + b, 0);

  /**
   * ⚠️ EL NÚMERO QUE JUSTIFICA EL COMMIT: los seis reintentos suman MÁS del doble
   * del techo. Sin techo, eso era el gasto de UN lote; con techo, es el de toda
   * la llamada.
   */
  it('los seis reintentos NO caben en el techo de indexación: por eso hay techo', () => {
    expect(suma(REINTENTOS_INDEXACION)).toBe(61000);
    expect(suma(REINTENTOS_INDEXACION)).toBeGreaterThan(PRESUPUESTO_ESPERA_INDEXACION);
  });

  /** Cuántas esperas caben de verdad: 1+2+4+8 = 15 s, y la de 16 ya no. */
  it('en el techo de indexación caben cuatro esperas, no seis', () => {
    let gastado = 0;
    let caben = 0;
    for (let i = 0; i < REINTENTOS_INDEXACION; i++) {
      const espera = esperaDeReintento(i);
      if (!hayPresupuestoParaEsperar(gastado, espera, PRESUPUESTO_ESPERA_INDEXACION)) break;
      gastado += espera;
      caben++;
    }

    expect(caben).toBe(4);
    expect(gastado).toBe(15000);
  });

  /**
   * EL DE CONSULTA NO ATA NUNCA, y se dice para que nadie lo lea como una
   * segunda regla: sus dos reintentos suman 3 s y el techo son 5 s. Está para
   * que el plan sea completo.
   */
  it('el techo de consulta no ata: sus reintentos caben de sobra', () => {
    expect(suma(REINTENTOS_CONSULTA)).toBeLessThan(PRESUPUESTO_ESPERA_CONSULTA);
  });
});
