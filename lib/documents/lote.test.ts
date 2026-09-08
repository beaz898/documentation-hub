import { describe, it, expect } from 'vitest';
import {
  LIMITE_POR_LLAMADA, PRESUPUESTO_PARA_EMPEZAR_MS, EXAMINADOS_MAXIMO,
  decidirContinuacion, cuboDe, gastaPlaza, motivoDeBloqueo, restantesDelLote,
} from './lote';
import type { ResultadoDeReparacion } from './reparar';

/**
 * EL REPARTO DEL CUPO DEL LOTE.
 *
 * ⚠️ EL CRITERIO QUE ESTOS CASOS DEFIENDEN, escrito antes que ellos: **el lote
 * tiene que CONVERGER**. Un lote que devuelve los mismos ocho rechazos en cada
 * llamada no es lento: es un botón que no termina nunca, y desde fuera se parece
 * mucho a uno que funciona despacio.
 *
 * De ahí sale todo lo demás — que un rechazo no gaste plaza, que un fallo sí, y
 * que «cuántos quedan» sean tres números y no uno.
 */

const LIMITES = { limite: 8, presupuestoMs: 180_000, maximoExaminados: 60 };

const REPARADO: ResultadoDeReparacion = {
  ok: true, via: 'retrocear', generacion: { antes: 1, ahora: 2 },
  trozos: { antes: 4, ahora: 4 }, ms: 1200,
};
const RECHAZADO: ResultadoDeReparacion = { ok: false, clase: 'rechazado', motivo: 'sin_original_con_tablas' };
const AL_DIA: ResultadoDeReparacion = { ok: false, clase: 'rechazado', motivo: 'al_dia' };
const NO_IMPLEMENTADO: ResultadoDeReparacion = { ok: false, clase: 'no_implementado', via: 'reprocesar' };
const NO_ENCONTRADO: ResultadoDeReparacion = { ok: false, clase: 'no_encontrado' };
const ROTO: ResultadoDeReparacion = { ok: false, clase: 'fallo', motivo: 'fallo_conmutacion', ms: 3400 };

describe('gastaPlaza — la regla que hace converger al lote', () => {
  /**
   * ⚠️ EL CASO CENTRAL DEL FICHERO, y se escribe con la consecuencia dentro: si
   * un rechazo gastara plaza, ocho `.xlsx` al principio de la lista agotarían la
   * llamada sin reparar nada, y la siguiente llamada haría exactamente lo mismo.
   */
  it('un rechazo NO gasta plaza: el lote camina por encima', () => {
    for (const r of [RECHAZADO, AL_DIA, NO_IMPLEMENTADO, NO_ENCONTRADO]) {
      expect(gastaPlaza(r), `${JSON.stringify(r)} no debería consumir una plaza`).toBe(false);
    }
  });

  /**
   * ⚠️ Y LA MITAD CONTRARIA, que es la que parece contraintuitiva: un fallo SÍ
   * gasta. La plaza mide TIEMPO, no éxito — una reparación que revienta después
   * de generar los embeddings ha gastado el rato igual. Sin esto, un documento
   * roto puede consumir la función entera a base de fallar barato.
   */
  it('un intento gasta plaza salga bien o mal', () => {
    expect(gastaPlaza(REPARADO)).toBe(true);
    expect(gastaPlaza(ROTO)).toBe(true);
  });
});

describe('cuboDe — tres cubos, y la diferencia entre los dos malos importa', () => {
  it('bloqueado es censo; fallido es incidente', () => {
    expect(cuboDe(REPARADO)).toBe('reparado');
    expect(cuboDe(RECHAZADO)).toBe('bloqueado');
    expect(cuboDe(NO_IMPLEMENTADO)).toBe('bloqueado');
    expect(cuboDe(NO_ENCONTRADO)).toBe('bloqueado');
    expect(cuboDe(ROTO)).toBe('fallido');
  });
});

describe('motivoDeBloqueo — el nombre que le dice al usuario qué hacer', () => {
  it('cada bloqueo se llama por lo suyo', () => {
    expect(motivoDeBloqueo(RECHAZADO)).toBe('sin_original_con_tablas');
    expect(motivoDeBloqueo(AL_DIA)).toBe('al_dia');
    expect(motivoDeBloqueo(NO_IMPLEMENTADO)).toBe('reprocesar_no_implementado');
    expect(motivoDeBloqueo(NO_ENCONTRADO)).toBe('no_encontrado');
  });

  it('preguntar el motivo de lo que no está bloqueado se ve, no se disimula', () => {
    expect(motivoDeBloqueo(REPARADO)).toBe('no_bloqueado');
    expect(motivoDeBloqueo(ROTO)).toBe('no_bloqueado');
  });
});

describe('decidirContinuacion — los dos límites declarados y su orden', () => {
  it('con las plazas libres y tiempo de sobra, se sigue', () => {
    expect(decidirContinuacion({ intentos: 0, examinados: 0, transcurridoMs: 0 }, LIMITES))
      .toEqual({ seguir: true });
    expect(decidirContinuacion({ intentos: 7, examinados: 20, transcurridoMs: 179_999 }, LIMITES))
      .toEqual({ seguir: true });
  });

  it('agotadas las plazas, se para por límite', () => {
    expect(decidirContinuacion({ intentos: 8, examinados: 8, transcurridoMs: 10 }, LIMITES))
      .toEqual({ seguir: false, motivo: 'limite' });
  });

  it('sin margen para empezar otra, se para por tiempo', () => {
    expect(decidirContinuacion({ intentos: 2, examinados: 2, transcurridoMs: 180_000 }, LIMITES))
      .toEqual({ seguir: false, motivo: 'tiempo' });
  });

  it('mirando demasiados candidatos, se para por examen', () => {
    expect(decidirContinuacion({ intentos: 0, examinados: 60, transcurridoMs: 10 }, LIMITES))
      .toEqual({ seguir: false, motivo: 'examen' });
  });

  /**
   * ⚠️ EL ORDEN ES PARTE DEL CRITERIO, no una casualidad: con las tres
   * condiciones cumplidas a la vez, lo que hay que decirle al usuario es
   * «hiciste tus ocho», que es el caso normal. Que el motivo excepcional tape al
   * normal haría leer un lote sano como un lote con problemas.
   */
  it('con los tres límites tocados a la vez, gana el límite', () => {
    expect(decidirContinuacion({ intentos: 8, examinados: 60, transcurridoMs: 200_000 }, LIMITES))
      .toEqual({ seguir: false, motivo: 'limite' });
  });

  it('sin plazas y sin tiempo, el tiempo no tapa al límite', () => {
    expect(decidirContinuacion({ intentos: 9, examinados: 3, transcurridoMs: 999_999 }, LIMITES))
      .toEqual({ seguir: false, motivo: 'limite' });
  });
});

describe('restantesDelLote — cuándo parar de pulsar', () => {
  it('todo reparado y nada sin mirar: no hay más', () => {
    expect(restantesDelLote({ candidatos: 3, reparados: 3, fallidos: 0, bloqueados: 0 }))
      .toEqual({ paraReintentar: 0, sinExaminar: 0, bloqueados: 0, hayMas: false });
  });

  /**
   * ⚠️ EL CASO QUE DECIDE SI EL BOTÓN TERMINA: un corpus cuyos candidatos son
   * TODOS bloqueados. Si los bloqueados contaran como pendientes, `hayMas` sería
   * verdadero para siempre y el usuario pulsaría hasta cansarse.
   */
  it('todo bloqueado: no hay más que pulsar, y se dice cuántos son', () => {
    expect(restantesDelLote({ candidatos: 15, reparados: 0, fallidos: 0, bloqueados: 15 }))
      .toEqual({ paraReintentar: 0, sinExaminar: 0, bloqueados: 15, hayMas: false });
  });

  it('un fallo cuenta como pendiente: se reintenta en la siguiente', () => {
    expect(restantesDelLote({ candidatos: 5, reparados: 4, fallidos: 1, bloqueados: 0 }))
      .toEqual({ paraReintentar: 1, sinExaminar: 0, bloqueados: 0, hayMas: true });
  });

  it('lo que no se llegó a mirar va aparte, porque no se sabe qué es', () => {
    expect(restantesDelLote({ candidatos: 38, reparados: 8, fallidos: 0, bloqueados: 4 }))
      .toEqual({ paraReintentar: 0, sinExaminar: 26, bloqueados: 4, hayMas: true });
  });

  it('sin candidatos no hay nada que decir, y las tres cifras salen igual', () => {
    expect(restantesDelLote({ candidatos: 0, reparados: 0, fallidos: 0, bloqueados: 0 }))
      .toEqual({ paraReintentar: 0, sinExaminar: 0, bloqueados: 0, hayMas: false });
  });

  /**
   * Si los cubos suman más que los candidatos, algo se contó dos veces. No es un
   * caso esperado; se fija que la cifra no salga NEGATIVA, que es como un error
   * de cuenta se convierte en una respuesta absurda enseñada al usuario.
   */
  it('una cuenta imposible no produce cifras negativas', () => {
    expect(restantesDelLote({ candidatos: 2, reparados: 3, fallidos: 0, bloqueados: 1 }).sinExaminar)
      .toBe(0);
  });
});

describe('los límites del lote, fijados', () => {
  /**
   * ⚠️ EL PRESUPUESTO DE TIEMPO NO ES LA DURACIÓN DE LA FUNCIÓN, y este caso
   * existe para que nadie los iguale «para aprovechar». Los 300 s son de la
   * plataforma; el presupuesto es el instante a partir del cual NO SE EMPIEZA una
   * reparación más, y la diferencia es el margen de la que ya está corriendo —que
   * no se puede interrumpir—. Igualarlos deja a la plataforma cortando a media
   * conmutación.
   */
  it('el presupuesto deja margen dentro de los 300 s de la función', () => {
    const MAX_DURATION_MS = 300_000;
    expect(PRESUPUESTO_PARA_EMPEZAR_MS).toBeLessThan(MAX_DURATION_MS);
    // Y el margen tiene que caber una espera larga de embeddings: la política de
    // indexación gasta hasta 61 s solo esperando, por lote de 20 trozos.
    expect(MAX_DURATION_MS - PRESUPUESTO_PARA_EMPEZAR_MS).toBeGreaterThanOrEqual(61_000);
  });

  it('se pueden mirar más candidatos de los que se pueden reparar', () => {
    // Si no, el lote no podría caminar por encima de los bloqueados, que es justo
    // lo que le permite converger.
    expect(EXAMINADOS_MAXIMO).toBeGreaterThan(LIMITE_POR_LLAMADA);
  });
});
