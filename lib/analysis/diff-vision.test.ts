import { describe, it, expect } from 'vitest';
import {
  visionDeUnLado, clasificarVision, elCeroEsInterpretable, contadoresDeVision,
} from './diff-vision';
import type { VisionDelPar } from './diff-vision';
import type { TableGroup } from './table-structure';

/**
 * LOS DENOMINADORES DE LOS CEROS DEL DIFF — pieza 2 de F-103 P3.
 *
 * ⚠️ EL CRITERIO QUE ESTOS CASOS DEFIENDEN, escrito antes que ellos: **un cero
 * solo confirma cuando los dos lados vieron.** Todo lo demás de este fichero sale
 * de ahí — que los lados se cuenten por separado, que la asimetría se conserve, y
 * que las siete cifras salgan aunque valgan cero.
 *
 * Los dos casos reales que lo pidieron están en el mismo registro con una semana
 * de diferencia y eran indistinguibles: «0 parejas» del 04/09 (una medición: no
 * había clave) y «0 sobre 0 parejas» de B.175 (ceguera: no llegó ni una tabla).
 */

function tabla(filas: number, id = 't1'): TableGroup {
  return { tableId: id, sheetName: 'H1', columns: ['a', 'b'], totalRows: filas, rows: [] };
}

const CIEGO: VisionDelPar = { analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 2, filas: 60 } };
const VIDENTE: VisionDelPar = { analizado: { tablas: 1, filas: 30 }, candidato: { tablas: 2, filas: 60 } };

describe('visionDeUnLado', () => {
  it('cuenta tablas y filas de lo que el agrupador produjo', () => {
    expect(visionDeUnLado([tabla(30), tabla(12, 't2')])).toEqual({ tablas: 2, filas: 42 });
  });

  it('sin tablas, cero y cero — no undefined ni NaN', () => {
    expect(visionDeUnLado([])).toEqual({ tablas: 0, filas: 0 });
  });

  /**
   * ⚠️ LAS FILAS SALEN DE `totalRows`, que es lo que el agrupador contó, y no de
   * `rows.length`. Contarlas otra vez aquí sería una segunda cuenta de lo mismo,
   * y dos cuentas de lo mismo se separan el día que una cambie — sin avisar,
   * porque las dos seguirían pareciendo correctas.
   */
  it('las filas las dice el agrupador, no se recuentan', () => {
    const t: TableGroup = { ...tabla(0), totalRows: 7, rows: [] };
    expect(visionDeUnLado([t]).filas).toBe(7);
  });
});

describe('clasificarVision — la asimetría se conserva', () => {
  it('los cuatro casos tienen nombre propio', () => {
    expect(clasificarVision(VIDENTE)).toBe('ambos');
    expect(clasificarVision(CIEGO)).toBe('solo_candidato');
    expect(clasificarVision({ analizado: { tablas: 3, filas: 9 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe('solo_analizado');
    expect(clasificarVision({ analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe('ninguno');
  });

  /**
   * ⚠️ POR QUÉ NO SE FUNDEN EN «alguno»: que el analizado no traiga tablas es un
   * fallo NUESTRO —es B.175, la estructura no llegó— y que no las traiga el
   * candidato es un caso normal del corpus. Fundirlos perdería justo la mitad que
   * distingue una avería de un día cualquiera.
   */
  it('quién es el ciego importa: los dos casos no son el mismo', () => {
    const analizadoCiego = { analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 1, filas: 5 } };
    const candidatoCiego = { analizado: { tablas: 1, filas: 5 }, candidato: { tablas: 0, filas: 0 } };
    expect(clasificarVision(analizadoCiego)).not.toBe(clasificarVision(candidatoCiego));
  });
});

describe('elCeroEsInterpretable — LA pregunta', () => {
  /**
   * ⚠️⚠️ EL CASO CENTRAL DEL FICHERO. Si esto se pusiera en verde para un par
   * ciego, el sistema volvería a poder decir «no hay contradicciones» sin haber
   * mirado — que es exactamente B.175 y lo que costó semanas destapar.
   */
  it('solo cuando los DOS lados vieron', () => {
    expect(elCeroEsInterpretable(VIDENTE)).toBe(true);
    expect(elCeroEsInterpretable(CIEGO)).toBe(false);
    expect(elCeroEsInterpretable({ analizado: { tablas: 2, filas: 8 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe(false);
    expect(elCeroEsInterpretable({ analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe(false);
  });

  /**
   * ⚠️ LO QUE DECIDE ES LA TABLA, NO LA FILA. Una tabla con cero filas SE MIRÓ:
   * el emparejador la tuvo delante y pudo decidir. Exigir filas confundiría «no
   * me llegó nada» con «me llegó una tabla vacía», que son cosas distintas — la
   * segunda es un resultado y la primera es una pantalla apagada.
   */
  it('una tabla vacía es visión: se miró, y no había filas', () => {
    expect(elCeroEsInterpretable({
      analizado: { tablas: 1, filas: 0 },
      candidato: { tablas: 1, filas: 0 },
    })).toBe(true);
  });
});

describe('contadoresDeVision — las siete cifras', () => {
  it('reparte los pares entre videntes y ciegos, y suman el total', () => {
    const c = contadoresDeVision([VIDENTE, CIEGO, VIDENTE]);
    expect(c.pares_con_vision).toBe(2);
    expect(c.pares_ciegos).toBe(1);
    expect(c.pares_con_vision + c.pares_ciegos).toBe(3);
  });

  it('señala cuándo el ciego fue el documento analizado', () => {
    expect(contadoresDeVision([CIEGO, CIEGO, VIDENTE]).ciegos_por_el_analizado).toBe(2);
    expect(contadoresDeVision([{ analizado: { tablas: 1, filas: 2 }, candidato: { tablas: 0, filas: 0 } }])
      .ciegos_por_el_analizado).toBe(0);
  });

  /**
   * ⚠️ EL ANALIZADO NO SE SUMA SOBRE LOS PARES: es el mismo documento en todos,
   * así que sumarlo lo multiplicaría por el número de candidatos y daría una
   * cifra que parece un total y es un producto. Es la misma forma del «5» que
   * pasó por dato media hora el 06/09.
   */
  it('las tablas del analizado no se multiplican por el número de candidatos', () => {
    const c = contadoresDeVision([VIDENTE, VIDENTE, VIDENTE]);
    expect(c.tablas_analizado).toBe(1);
    expect(c.filas_analizado).toBe(30);
    // Y las de los candidatos SÍ se suman: son documentos distintos.
    expect(c.tablas_candidatos).toBe(6);
    expect(c.filas_candidatos).toBe(180);
  });

  /**
   * ⚠️ LAS SIETE SALEN SIEMPRE, aunque valgan cero. Es la regla del cero aplicada
   * al propio instrumento: una cifra que desaparece cuando vale cero es
   * indistinguible de una que nadie calculó, y entonces el denominador tampoco se
   * puede leer.
   */
  it('sin un solo par, las siete cifras están y valen cero', () => {
    expect(contadoresDeVision([])).toEqual({
      pares_con_vision: 0,
      pares_ciegos: 0,
      ciegos_por_el_analizado: 0,
      tablas_analizado: 0,
      filas_analizado: 0,
      tablas_candidatos: 0,
      filas_candidatos: 0,
    });
  });

  /**
   * EL CASO DE B.175, RECONSTRUIDO. Un documento analizado como texto plano
   * —sin celdas— contra cuatro candidatos con tablas: el diff no emitirá nada, y
   * hasta hoy eso salía como «0 parejas» a secas.
   */
  it('el caso de B.175 se lee de un vistazo', () => {
    const c = contadoresDeVision([CIEGO, CIEGO, CIEGO, CIEGO]);
    expect(c.pares_con_vision).toBe(0);
    expect(c.pares_ciegos).toBe(4);
    expect(c.ciegos_por_el_analizado).toBe(4);
    expect(c.tablas_analizado).toBe(0);
    // Y el dato que lo delata: el corpus SÍ tenía tablas que mirar.
    expect(c.tablas_candidatos).toBe(8);
  });
});
