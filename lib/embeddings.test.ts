import { describe, expect, it } from 'vitest';

import {
  debeReintentar,
  planDeEmbedding,
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
   * ⚠️ UN 5xx NO CUENTA HOY, y el caso lo deja escrito en vez de dejarlo al
   * descuido: un corte del proveedor —como el del 01/09— se trata como error
   * definitivo. Ampliarlo es otra decisión, porque esta función la usa también
   * la indexación. Cuando se amplíe, ESTE caso será el que se ponga rojo, que es
   * como debe enterarse quien lo cambie.
   */
  it('un 500 NO es pasajero todavía, y un 400 no lo será nunca', () => {
    expect(esErrorPasajeroDePinecone(new Error('PineconeUnmappedHttpError: 500'))).toBe(false);
    expect(esErrorPasajeroDePinecone(new Error('HTTP 400: bad request'))).toBe(false);
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

  it('con el presupuesto de CONSULTA se rinde al segundo reintento', () => {
    expect(debeReintentar(rate, 0, REINTENTOS_CONSULTA)).toBe(true);
    expect(debeReintentar(rate, 1, REINTENTOS_CONSULTA)).toBe(true);
    expect(debeReintentar(rate, 2, REINTENTOS_CONSULTA)).toBe(false);
  });

  it('con el de INDEXACIÓN aguanta hasta el sexto', () => {
    expect(debeReintentar(rate, 5, REINTENTOS_INDEXACION)).toBe(true);
    expect(debeReintentar(rate, 6, REINTENTOS_INDEXACION)).toBe(false);
  });

  /** La otra mitad: un error definitivo no se reintenta ni con presupuesto de
   *  sobra. Sin esto, un 400 se repetiría seis veces contra la misma pared. */
  it('un error definitivo no se reintenta ni en el primer intento', () => {
    expect(debeReintentar(cuatroCientos, 0, REINTENTOS_INDEXACION)).toBe(false);
  });
});

/**
 * ⚠️ EL PRESUPUESTO TIENE QUE CABER EN EL TIEMPO DE LA FUNCIÓN, y esto es lo que
 * impidió copiar la política de indexación al camino de consulta.
 *
 * `vercel.json` da **30 s a `/api/ask`** y 60 a `/api/ingest`. Los seis
 * reintentos de indexación suman **61 s solo en esperas**: en `/api/ask` no
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
  it('la consulta va como query, y con el presupuesto corto', () => {
    expect(planDeEmbedding('consulta')).toEqual({ inputType: 'query', maxIntentos: REINTENTOS_CONSULTA });
  });

  it('la indexación va como passage, y con el largo', () => {
    expect(planDeEmbedding('indexacion')).toEqual({ inputType: 'passage', maxIntentos: REINTENTOS_INDEXACION });
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
