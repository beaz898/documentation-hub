import { describe, expect, it } from 'vitest';

import { particionDoubleCheck } from './pipeline';
import type { ConfirmedBy } from './types';

/**
 * BATERÍA DE LA FRONTERA DEL DOUBLE-CHECK (F-71 paso 3, caso rescatado en F-86).
 *
 * ESTE FICHERO NO PRUEBA EL PIPELINE. El pipeline llama a Pinecone, a Supabase y
 * a tres modelos, y el alcance de la suite lo prohíbe. Prueba UNA función pura
 * que hasta F-86 no existía como función: la frontera eran dos `filter` escritos
 * en línea, correctos y sin un solo caso que los vigilara.
 *
 * POR QUÉ SE RESCATA. F-86 lo dijo con precisión: «la puerta de F-71 filtrando
 * por confirmedBy sin mirar el tipo es la frontera funcionando por construcción
 * — no la toquéis, pero añadid el caso a la suite para que siga siendo verdad
 * por CONTRATO y no por CASUALIDAD». Y la casualidad importa aquí más que en
 * otros sitios: la emisión del diff va a meter hallazgos de un tipo que hoy no
 * existe, y depende de que este filtro los reconozca sin haberlos previsto.
 *
 * LO QUE MOTIVÓ LA FRONTERA, medido el 28/08 sobre 5fa72955: en tres pasadas
 * seguidas, la contradicción del Puesto de Pablo Reyes llegaba confirmada por
 * estructura y Sonnet la degradaba a «posible» en DOS de las tres. El hallazgo
 * mejor verificado del sistema desaparecía por opinión de un modelo.
 */

const hallazgo = (confirmedBy?: ConfirmedBy) => ({ topic: 't', confirmedBy });

describe('particionDoubleCheck — ningún modelo revierte un veredicto determinista', () => {
  it('lo confirmado por ESTRUCTURA no se envía a Sonnet', () => {
    const r = particionDoubleCheck([hallazgo('estructura')]);
    expect(r.estructurales).toHaveLength(1);
    expect(r.aJuicio).toHaveLength(0);
  });

  it('lo confirmado por JUICIO sí se envía', () => {
    const r = particionDoubleCheck([hallazgo('juicio')]);
    expect(r.aJuicio).toHaveLength(1);
    expect(r.estructurales).toHaveLength(0);
  });

  it('lo que llega SIN confirmar se envía: la ausencia no es un veredicto', () => {
    const r = particionDoubleCheck([hallazgo(undefined)]);
    expect(r.aJuicio).toHaveLength(1);
    expect(r.estructurales).toHaveLength(0);
  });

  it('lo sellado por double_check se envía: no es determinista', () => {
    const r = particionDoubleCheck([hallazgo('double_check')]);
    expect(r.aJuicio).toHaveLength(1);
  });

  /**
   * EL CASO QUE HACE FALTA PARA LA EMISIÓN, y el motivo de rescatarlo. La
   * frontera filtra por el VALOR DEL CAMPO, no por el tipo ni la procedencia
   * del hallazgo. Un hallazgo del diff de tablas —que hoy no existe en el
   * pipeline— quedará excluido de Sonnet sin que nadie tenga que enseñarle
   * nada, siempre que llegue con `confirmedBy: 'estructura'`.
   *
   * SI ALGUIEN «MEJORA» ESTO enumerando tipos conocidos, este caso se pone
   * rojo — y esa es su función: enumerar tipos es exactamente lo que haría que
   * un tipo nuevo se colara hasta Sonnet.
   */
  it('un hallazgo de un tipo QUE NO EXISTE hoy queda fuera si es estructural', () => {
    const delDiff = { tipo: 'diff_tabular', columna: 'Precio base', confirmedBy: 'estructura' as ConfirmedBy };
    const r = particionDoubleCheck([delDiff]);
    expect(r.estructurales).toEqual([delDiff]);
    expect(r.aJuicio).toHaveLength(0);
  });

  it('la partición es exhaustiva y sin solapes', () => {
    const todas = [hallazgo('estructura'), hallazgo('juicio'), hallazgo(undefined), hallazgo('double_check')];
    const r = particionDoubleCheck(todas);
    expect(r.estructurales.length + r.aJuicio.length).toBe(todas.length);
    expect(r.estructurales.some(x => r.aJuicio.includes(x))).toBe(false);
  });

  it('sin candidatas, dos listas vacías y ningún error', () => {
    expect(particionDoubleCheck([])).toEqual({ estructurales: [], aJuicio: [] });
  });
});
