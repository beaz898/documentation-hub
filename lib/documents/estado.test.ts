import { describe, expect, it } from 'vitest';

import {
  esElegibleParaCorpus,
  esEstadoDeAnalisis,
  estaEnElIndice,
  ESTADOS_DE_ANALISIS,
  type EstadoDeAnalisis,
} from './estado';

/**
 * EL VOCABULARIO DEL ESTADO, EN UN SOLO SITIO (frente 3, paso 1).
 *
 * Hasta hoy vivía en TRES copias y ninguna era autoritativa: el `CHECK` de la
 * base y dos COMENTARIOS al lado de un `string` pelado. Los dos comentarios ya
 * estaban desactualizados — ninguno mencionaba `en_revision`.
 */

describe('el vocabulario es espejo del CHECK de la base', () => {
  /**
   * Los cinco de `supabase-f3-en-revision.sql`, ejecutado el 02/09/2026.
   * Si alguien añade un valor a la base y no aquí, la guarda rechazará filas
   * legítimas; si lo añade aquí y no a la base, el INSERT fallará. Este caso es
   * el que hace visible la pareja.
   */
  it('tiene los cinco valores del CHECK, ni uno más', () => {
    expect([...ESTADOS_DE_ANALISIS]).toEqual([
      'en_revision', 'pendiente', 'en_analisis', 'analizado', 'desactualizado',
    ]);
  });
});

describe('esElegibleParaCorpus — la partición de F-96', () => {
  it('solo `analizado` es elegible', () => {
    expect(esElegibleParaCorpus('analizado')).toBe(true);
  });

  /**
   * ⚠️ LA MITAD CONTRARIA, y recorre los CUATRO restantes a propósito, no solo
   * el nuevo: lo que se prueba es que esto es una PARTICIÓN —`analizado` frente
   * a todo lo demás— y no «una lista que excluye a en_revision».
   *
   * La diferencia importa el día que aparezca un sexto valor: con la igualdad
   * nace excluido; con una lista de exclusiones, entraría al corpus hasta que
   * alguien se acordara de añadirlo.
   */
  it('NINGUNO de los otros cuatro lo es', () => {
    for (const estado of ESTADOS_DE_ANALISIS) {
      if (estado === 'analizado') continue;
      expect(esElegibleParaCorpus(estado), estado).toBe(false);
    }
  });

  /**
   * Y el caso que fija la propiedad para el futuro: un valor que todavía no
   * existe tampoco sería elegible. Se comprueba con un cast porque el tipo lo
   * impide —que es justo lo que se quiere— pero la función se ejecuta con datos
   * de la base, donde la columna es `text`.
   */
  it('un valor futuro nacería excluido', () => {
    expect(esElegibleParaCorpus('inventado_mañana' as EstadoDeAnalisis)).toBe(false);
  });
});

describe('estaEnElIndice — la distinción que justifica el valor nuevo', () => {
  /**
   * ⚠️ ES LO ÚNICO QUE SEPARA `en_revision` DE `pendiente`, y por eso existe
   * desde el primer commit aunque todavía no lo llame nadie.
   *
   * Un documento `pendiente` está INDEXADO —el 02/09 se midieron veintisiete
   * así, todos con sus vectores— y lo que no está es aprobado. `en_revision` es
   * lo otro: la fila existe y no hay nada en el índice.
   * Sin este caso, el valor nuevo parece redundante y alguien lo unificará.
   */
  it('`en_revision` es el único que NO está en el índice', () => {
    expect(estaEnElIndice('en_revision')).toBe(false);

    for (const estado of ESTADOS_DE_ANALISIS) {
      if (estado === 'en_revision') continue;
      expect(estaEnElIndice(estado), estado).toBe(true);
    }
  });

  /**
   * Y LAS DOS PREGUNTAS SON INDEPENDIENTES: `pendiente` está en el índice y NO
   * es elegible. Si alguien las colapsara —«no elegible = no indexado»— el
   * corpus perdería de vista veintisiete documentos que sí tienen vectores.
   */
  it('estar en el índice y ser elegible son cosas distintas', () => {
    expect(estaEnElIndice('pendiente')).toBe(true);
    expect(esElegibleParaCorpus('pendiente')).toBe(false);
  });
});

describe('esEstadoDeAnalisis — la guarda de lo que viene de la base', () => {
  it('acepta los cinco', () => {
    for (const estado of ESTADOS_DE_ANALISIS) {
      expect(esEstadoDeAnalisis(estado), estado).toBe(true);
    }
  });

  /**
   * La columna es `text` y el jsonb de la bandeja tiene meses: esto recibe lo
   * que sea y no puede lanzar.
   */
  it('rechaza la basura sin romperse', () => {
    expect(esEstadoDeAnalisis(null)).toBe(false);
    expect(esEstadoDeAnalisis(undefined)).toBe(false);
    expect(esEstadoDeAnalisis(42)).toBe(false);
    expect(esEstadoDeAnalisis({})).toBe(false);
    expect(esEstadoDeAnalisis('')).toBe(false);
    expect(esEstadoDeAnalisis('indexed')).toBe(false);
  });

  /** Ni espacios ni mayúsculas: el valor es literal o no es. */
  it('no perdona ni un espacio ni una mayúscula', () => {
    expect(esEstadoDeAnalisis('analizado ')).toBe(false);
    expect(esEstadoDeAnalisis(' analizado')).toBe(false);
    expect(esEstadoDeAnalisis('ANALIZADO')).toBe(false);
  });
});
