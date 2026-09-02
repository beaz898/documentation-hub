import { describe, expect, it } from 'vitest';

import { avisosDelAnalisis, guardadoDeJob } from './avisos';

/**
 * LOS DOS AVISOS, Y QUE NO SE MEZCLEN (regla 6, memoria del fallo, 02/09/2026).
 *
 * Un análisis DEGRADADO y un análisis NO GUARDADO son cosas distintas, y la
 * tentación de meter el segundo en el primero es real: el aviso de etapas
 * caídas ya existe y ya se pinta. Mezclarlos mentiría sobre la calidad del
 * análisis y dispararía el reembolso automático de `analyze-v2` sobre un
 * resultado que el usuario recibió entero.
 */

const CAIDA = [{ stage: 'judge', detail: 'HTTP 529' }];

describe('avisosDelAnalisis — dos avisos, y separados', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA, y es la fácil de olvidar: un análisis que SÍ se
   * guarda no marca nada ni avisa de nada. Sin este caso, un `noGuardado: true`
   * fijo pasaría verde y todo el mundo vería la alarma siempre.
   */
  it('guardado y completo: NINGÚN aviso', () => {
    expect(avisosDelAnalisis({ guardado: true })).toEqual({ noGuardado: false, etapasCaidas: 0 });
    expect(avisosDelAnalisis({ guardado: true, stageFailures: [] })).toEqual({
      noGuardado: false,
      etapasCaidas: 0,
    });
  });

  it('guardado pero degradado: solo el aviso de etapas caídas', () => {
    expect(avisosDelAnalisis({ guardado: true, stageFailures: CAIDA })).toEqual({
      noGuardado: false,
      etapasCaidas: 1,
    });
  });

  /**
   * ⚠️⚠️ EL CASO QUE IMPIDE MEZCLARLOS. Un análisis bueno que no se guardó avisa
   * de UNA cosa, y `etapasCaidas` sigue valiendo CERO.
   * Si alguien colara el no-guardado dentro de `stageFailures` —que es lo
   * cómodo—, este número dejaría de ser cero y el reembolso automático se
   * dispararía sobre un análisis que el usuario recibió completo.
   */
  it('NO guardado pero completo: solo ese aviso, y cero etapas caídas', () => {
    expect(avisosDelAnalisis({ guardado: false })).toEqual({
      noGuardado: true,
      etapasCaidas: 0,
    });
  });

  it('ni guardado ni completo: los dos, cada uno con lo suyo', () => {
    expect(avisosDelAnalisis({ guardado: false, stageFailures: CAIDA })).toEqual({
      noGuardado: true,
      etapasCaidas: 1,
    });
  });

  /**
   * ⚠️ AUSENTE NO ES FALSO, y aquí está toda la compatibilidad. Lo que llega sin
   * el campo es el jsonb de la bandeja —que por definición SÍ está guardado, o
   * no habría jsonb que leer— y cualquier respuesta anterior a este despliegue.
   * Con `!guardado` en vez de `guardado === false`, la bandeja entera se
   * llenaría de alarmas sobre análisis que existen perfectamente.
   */
  it('SIN el campo: se asume guardado, con y sin etapas caídas', () => {
    expect(avisosDelAnalisis({})).toEqual({ noGuardado: false, etapasCaidas: 0 });
    expect(avisosDelAnalisis({ stageFailures: CAIDA })).toEqual({
      noGuardado: false,
      etapasCaidas: 1,
    });
  });

  /** Las cuatro combinaciones juntas: sale más barato leer la tabla que
   *  deducirla de los casos de arriba. */
  it('la tabla entera de las dos entradas', () => {
    const casos = [
      { guardado: true, stageFailures: [], esperado: { noGuardado: false, etapasCaidas: 0 } },
      { guardado: true, stageFailures: CAIDA, esperado: { noGuardado: false, etapasCaidas: 1 } },
      { guardado: false, stageFailures: [], esperado: { noGuardado: true, etapasCaidas: 0 } },
      { guardado: false, stageFailures: CAIDA, esperado: { noGuardado: true, etapasCaidas: 1 } },
    ];

    for (const c of casos) {
      expect(avisosDelAnalisis(c), JSON.stringify(c)).toEqual(c.esperado);
    }
  });
});

/**
 * EL CAMINO EXHAUSTIVO (B.143, 02/09/2026), que es el de 30 créditos.
 *
 * ⚠️ POR QUÉ HACE FALTA ESTA TRADUCCIÓN Y NO SE LEE LA COLUMNA A PELO: el dato
 * viaja desde el worker —fuera de Vercel— por la fila del job, el endpoint, el
 * tipo `JobStatus` y DOS consumidores de polling distintos. En cualquiera de
 * esos saltos llega `undefined`: mientras el job no ha terminado, en los jobs
 * `failed`, y en cualquier lector que no pida la columna en su `select`.
 * AUSENTE tiene que significar GUARDADO, o el aviso saldría sobre análisis que
 * existen perfectamente.
 */
describe('guardadoDeJob — la columna del worker, traducida', () => {
  it('la columna en false: NO guardado', () => {
    expect(guardadoDeJob(false)).toBe(false);
  });

  /** ⚠️ MITAD CONTRARIA A: un job que guarda bien no marca nada. */
  it('la columna en true: guardado', () => {
    expect(guardadoDeJob(true)).toBe(true);
  });

  /**
   * ⚠️ MITAD CONTRARIA B: un análisis viejo, o una fila leída sin pedir la
   * columna, tampoco marca nada. Es la que un `!x` dejaría pasar — y con ella
   * se llenaría de avisos todo el histórico anterior a la migración, que nació
   * con `DEFAULT true` precisamente para eso.
   */
  it('sin dato: se asume guardado', () => {
    expect(guardadoDeJob(undefined)).toBe(true);
    expect(guardadoDeJob(null)).toBe(true);
  });

  /**
   * Y ENGANCHA CON EL CRITERIO DE AYER: lo que sale de aquí es exactamente lo
   * que `avisosDelAnalisis` espera en `guardado`. Un solo vocabulario para los
   * dos caminos — el síncrono y el exhaustivo — que es lo que impide que el
   * aviso salga por uno y no por el otro.
   */
  it('encaja con avisosDelAnalisis sin traducir dos veces', () => {
    expect(avisosDelAnalisis({ guardado: guardadoDeJob(false) })).toEqual({
      noGuardado: true,
      etapasCaidas: 0,
    });
    expect(avisosDelAnalisis({ guardado: guardadoDeJob(undefined) })).toEqual({
      noGuardado: false,
      etapasCaidas: 0,
    });
  });
});
