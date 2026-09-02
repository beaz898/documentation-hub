import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  esErrorPasajeroDePinecone,
  esperaDeReintento,
  hayPresupuestoParaEsperar,
} from '@/lib/embeddings';
import { PLAN_DE_VECTORES } from './vectors';

/**
 * EL RETRY DE LOS DATOS VECTORIALES (regla 6, 02/09/2026).
 *
 * ⚠️ LO QUE ESTA BATERÍA PUEDE Y LO QUE NO: las ocho funciones que hablan con
 * Pinecone necesitan red, y el alcance de la suite la prohíbe (la guarda de
 * B.126 la bloquearía). No se puede comprobar que un reintento OCURRA.
 *
 * Lo que sí se comprueba, y es lo que decide:
 *   · el PRESUPUESTO — cuántas esperas caben y dónde corta;
 *   · que la política reutilizada se comporta como aquí se necesita;
 *   · y ⚠️ QUE LOS TRES EXCLUIDOS SIGUEN SIN RETRY, leyendo el fichero. Esa
 *     última no es ceremonia: dentro de seis meses, alguien que vea cinco
 *     funciones con reintento y tres sin él lo leerá como un olvido y «lo
 *     arreglará por simetría». El caso convierte la ausencia en una decisión.
 */

const FUENTE = readFileSync('lib/pinecone/vectors.ts', 'utf8');

/** El cuerpo de una función exportada de `vectors.ts`, desde su firma hasta la
 *  siguiente declaración de nivel superior. */
function cuerpoDe(nombre: string): string {
  const i = FUENTE.indexOf(`export async function ${nombre}`);
  expect(i, `no encuentro ${nombre}`).toBeGreaterThan(-1);
  const resto = FUENTE.slice(i + 1);
  const fin = resto.indexOf('\nexport ');
  return fin === -1 ? resto : resto.slice(0, fin);
}

describe('el presupuesto de los vectores, elegido para el llamador más apretado', () => {
  /**
   * ⚠️ 10 s Y NO 30 COMO EL DE INDEXACIÓN. El llamador más apretado es
   * `/api/ask` con `maxDuration: 30`, y ahí el vector NO va solo: comparte esos
   * 30 s con el embedding de la consulta y con la llamada a Anthropic, que
   * tiene su propio retry de hasta 32 s. El presupuesto se cuenta ENTERO.
   */
  it('caben tres esperas, y la cuarta ya no', () => {
    let gastado = 0;
    let caben = 0;
    for (let i = 0; i < PLAN_DE_VECTORES.maxIntentos + 3; i++) {
      const espera = esperaDeReintento(i);
      if (!hayPresupuestoParaEsperar(gastado, espera, PLAN_DE_VECTORES.presupuestoEsperaMs)) break;
      gastado += espera;
      caben++;
    }

    expect(caben).toBe(3);
    expect(gastado).toBe(7000);
  });

  /** Y es estrictamente más corto que el de indexación, que es el punto. */
  it('es más corto que el techo de indexación', () => {
    expect(PLAN_DE_VECTORES.presupuestoEsperaMs).toBeLessThan(30_000);
  });
});

describe('la política reutilizada se comporta como aquí hace falta', () => {
  /** ⚠️ MITAD CONTRARIA: un error permanente no se reintenta, aunque queden
   *  intentos y presupuesto de sobra. */
  it('un 400 no se reintenta ni con presupuesto entero', () => {
    expect(esErrorPasajeroDePinecone(new Error('HTTP 400: bad request'))).toBe(false);
  });

  it('un 429 y un 503 sí', () => {
    expect(esErrorPasajeroDePinecone(new Error('429 Too Many Requests'))).toBe(true);
    expect(esErrorPasajeroDePinecone(new Error('PineconeUnmappedHttpError: 503'))).toBe(true);
  });
});

/**
 * ⚠️⚠️ LAS TRES EXCLUSIONES, Y POR QUÉ SE COMPRUEBAN LEYENDO EL FICHERO.
 *
 * Lo que se afirma aquí es una AUSENCIA, y una ausencia no se ejecuta. El caso
 * mira el código, que es legítimo y es la única forma: sin él, la decisión de
 * dejar tres funciones fuera vive solo en un comentario, y un comentario no se
 * pone rojo.
 */
describe('los tres excluidos siguen SIN retry, y es una decisión', () => {
  /**
   * `deleteMany(filtro)` no borra un conjunto fijo: borra lo que exista AL
   * EJECUTARSE. Un reintento tardío no es la misma operación — si entre medias
   * alguien escribió vectores que casan el filtro, se los lleva.
   * Lo que falta para poder reintentarlo es declarar que nadie escribe durante
   * la operación, y eso hoy no está escrito en ninguna parte.
   */
  it('deleteVectorsByFilter no reintenta', () => {
    expect(cuerpoDe('deleteVectorsByFilter')).not.toContain('conReintento');
  });

  /** Lo mismo y con más motivo: es el namespace entero. */
  it('deleteAllVectors no reintenta', () => {
    expect(cuerpoDe('deleteAllVectors')).not.toContain('conReintento');
  });

  /**
   * Ésta sí sería idempotente —un merge del mismo parcial deja el mismo
   * estado—, pero NO TIENE LLAMADOR. Dar retry a código muerto es añadir
   * superficie sin lector. El día que alguien la use, entra con él.
   */
  it('updateVectorMetadata no reintenta, por no tener llamador', () => {
    expect(cuerpoDe('updateVectorMetadata')).not.toContain('conReintento');
  });

  /** Y la otra mitad del mismo caso: los cinco que SÍ lo llevan, lo llevan. Sin
   *  esto, borrar el envoltorio entero dejaría los tres de arriba en verde. */
  it('los cinco que sí lo llevan, lo llevan', () => {
    for (const fn of ['queryVectors', 'upsertVectors', 'deleteVectorsByIds', 'fetchVectors', 'listVectorIdsByPrefix']) {
      expect(cuerpoDe(fn), fn).toContain('conReintento');
    }
  });
});

describe('listVectorIdsByPrefix — todo o excepción', () => {
  /**
   * ⚠️ LA LECCIÓN DE B.138, EN OTRA FUNCIÓN. Esta lista alimenta el borrado de
   * zombis de la sync de Drive: un listado PARCIAL hace que se borre lo que
   * faltaba en la lista. Si una página se agota sin éxito, `conReintento` LANZA
   * y esta función no devuelve nada — nunca «lo que llevo».
   *
   * El retry no cambia esa garantía: la hace menos necesaria, no menos cierta.
   */
  it('no atrapa el fallo de una página: lo deja subir', () => {
    const cuerpo = cuerpoDe('listVectorIdsByPrefix');

    // Ni `catch`, ni un `return ids` de consolación dentro del bucle.
    expect(cuerpo).not.toContain('catch');
    expect(cuerpo).toContain('conReintento');
  });

  /** Y el reintento va POR PÁGINA, dentro del bucle: alrededor del bucle
   *  duplicaría ids, porque el acumulador no se reinicia. */
  it('el reintento envuelve la página, no el bucle', () => {
    const cuerpo = cuerpoDe('listVectorIdsByPrefix');
    const doWhile = cuerpo.indexOf('do {');
    const llamada = cuerpo.indexOf('conReintento');

    expect(doWhile).toBeGreaterThan(-1);
    expect(llamada).toBeGreaterThan(doWhile);
  });
});
