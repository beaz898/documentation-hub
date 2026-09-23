import { describe, expect, it } from 'vitest';

import {
  coseno,
  medirElCanario,
  canarioNoMedido,
  elOrdenSeSostiene,
  PAREJAS,
  TEXTOS_DEL_CANARIO,
  TEXTO_A1,
  TEXTO_A2,
  TEXTO_B,
  REFERENCIA,
  elCanarioSeHaMovido,
  type Embeber,
} from './canario';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSION } from '@/lib/embeddings';

/**
 * ⚠️ EL CANARIO — F-114 P3 (C6 y C7).
 *
 * Lo que estos casos vigilan es que el INSTRUMENTO esté bien construido, no que
 * el modelo esté bien: lo segundo no se puede probar sin llamar al servicio, y
 * eso está fuera del alcance declarado de esta suite. Lo que sí se puede probar
 * —y es donde el canario se rompería en silencio— es que el coseno sea un
 * coseno, que las dos parejas compartan su ancla, que un fallo salga por el tipo
 * de retorno y que nadie haya rellenado la referencia a mano.
 */

/** Un embebedor de mentira, determinista y sin red: devuelve los vectores que se
 *  le den. NO es un mock de Pinecone — es el parámetro que la función pide.
 *
 * ⚠️ LOS DEFECTOS SE RESUELVEN CON `in` Y NO CON `??`, y lo escribo porque me
 * costó un rojo: con `extra?.modeloServido ?? EMBEDDING_MODEL`, pasar
 * `modeloServido: null` A PROPÓSITO caía en el defecto y el caso que vigila «un
 * modelo que no vino se queda en null» medía lo contrario de lo que decía. Un
 * `??` en un helper de test convierte el valor que se quiere probar en el valor
 * que no se quiere probar. */
const embeberCon = (
  vectores: number[][],
  extra: Partial<{ modeloServido: string | null; dimensionServida: number | null }> = {},
): Embeber =>
  async () => ({
    vectores,
    modeloServido: 'modeloServido' in extra ? extra.modeloServido! : EMBEDDING_MODEL,
    dimensionServida: 'dimensionServida' in extra ? extra.dimensionServida! : EMBEDDING_DIMENSION,
  });

describe('coseno — y su fallo va en el tipo', () => {
  it('dos vectores idénticos dan 1', () => {
    expect(coseno([1, 2, 3], [1, 2, 3])!).toBeCloseTo(1, 10);
  });

  it('dos ortogonales dan 0, que es un RESULTADO y no un fallo', () => {
    expect(coseno([1, 0], [0, 1])).toBe(0);
  });

  it('la escala no cambia el coseno: mide dirección, no tamaño', () => {
    expect(coseno([1, 2, 3], [10, 20, 30])!).toBeCloseTo(1, 10);
  });

  it('opuestos dan −1', () => {
    expect(coseno([1, 2], [-1, -2])!).toBeCloseTo(-1, 10);
  });

  /**
   * ⚠️ CASO DECISIVO: las tres formas de «no se puede medir» devuelven `null` y
   * NO cero. Un cero significa ortogonales, que es una medición legítima; si el
   * fallo se devolviera como cero, una dimensión cambiada por el proveedor se
   * leería como «el canario no se parece a nada» y la alarma apuntaría al sitio
   * equivocado.
   */
  it('⚠️ dimensiones distintas, vector vacío y norma cero dan null, nunca 0', () => {
    expect(coseno([1, 2, 3], [1, 2])).toBeNull();
    expect(coseno([], [])).toBeNull();
    expect(coseno([0, 0], [1, 1])).toBeNull();
    expect(coseno([1, 1], [0, 0])).toBeNull();
  });

  it('un NaN o un Infinity no se propagan a la cifra: null', () => {
    expect(coseno([1, NaN], [1, 1])).toBeNull();
    expect(coseno([1, 1], [Infinity, 1])).toBeNull();
  });
});

describe('las dos parejas y sus tres textos', () => {
  it('hay DOS parejas, una alta y una baja', () => {
    expect(PAREJAS).toHaveLength(2);
    expect(PAREJAS.map(p => p.clave)).toEqual(['alta', 'baja']);
  });

  /**
   * ⚠️ CASO DECISIVO DEL DISEÑO: las dos parejas comparten el lado izquierdo.
   * Con dos anclas distintas, un movimiento del modelo podría mover una y no la
   * otra y la diferencia entre alta y baja dejaría de ser atribuible al lado
   * derecho. Si alguien cambiara el ancla de una, esto se pone rojo.
   */
  it('⚠️ las dos parejas comparten el ancla A1', () => {
    expect(PAREJAS[0].izquierda).toBe(TEXTO_A1);
    expect(PAREJAS[1].izquierda).toBe(TEXTO_A1);
    expect(PAREJAS[0].derecha).toBe(TEXTO_A2);
    expect(PAREJAS[1].derecha).toBe(TEXTO_B);
  });

  it('⚠️ A1 se embebe UNA vez, no una por pareja', () => {
    expect(TEXTOS_DEL_CANARIO).toHaveLength(3);
    expect(new Set(TEXTOS_DEL_CANARIO).size).toBe(3);
    // Y todos los lados de las dos parejas están en la lista que se embebe.
    for (const p of PAREJAS) {
      expect(TEXTOS_DEL_CANARIO).toContain(p.izquierda);
      expect(TEXTOS_DEL_CANARIO).toContain(p.derecha);
    }
  });

  it('los tres textos son distintos y no están vacíos', () => {
    for (const t of [TEXTO_A1, TEXTO_A2, TEXTO_B]) {
      expect(t.trim().length).toBeGreaterThan(40);
    }
    expect(new Set([TEXTO_A1, TEXTO_A2, TEXTO_B]).size).toBe(3);
  });
});

describe('medirElCanario — dos mediciones y su ruido', () => {
  // Tres vectores de mentira en los que A1 y A2 apuntan casi igual y B apunta a
  // otro sitio: reproduce en pequeño la forma que se espera del modelo real.
  const A1 = [1, 0, 0];
  const A2 = [0.99, 0.1, 0];
  const B = [0, 0, 1];

  it('mide las dos parejas, dos veces, y el ruido es CERO si nada cambió', async () => {
    const m = await medirElCanario(embeberCon([A1, A2, B]));
    expect(m.motivo).toBeNull();
    expect(m.parejas).toHaveLength(2);
    for (const p of m.parejas) {
      expect(p.primera).not.toBeNull();
      expect(p.segunda).toBe(p.primera);
      expect(p.ruido).toBe(0);
    }
  });

  /**
   * ⚠️ EL CASO PARA EL QUE EXISTE EL DUPLICADO (C7): si el servicio devuelve algo
   * distinto en la segunda llamada, `ruido` lo dice. Sin la segunda medición, esa
   * diferencia se leería como un cambio del modelo — que es la conclusión
   * contraria a la correcta.
   */
  it('⚠️ si la segunda llamada devuelve otra cosa, el ruido lo CUENTA', async () => {
    let llamada = 0;
    const alterno: Embeber = async () => {
      llamada += 1;
      return {
        vectores: llamada === 1 ? [A1, A2, B] : [A1, [0.98, 0.2, 0], B],
        modeloServido: EMBEDDING_MODEL,
        dimensionServida: EMBEDDING_DIMENSION,
      };
    };
    const m = await medirElCanario(alterno);
    const alta = m.parejas.find(p => p.clave === 'alta')!;
    expect(llamada).toBe(2);
    expect(alta.ruido).not.toBeNull();
    expect(alta.ruido!).toBeGreaterThan(0);
  });

  it('⚠️ el orden se sostiene: la alta se parece más que la baja', async () => {
    const m = await medirElCanario(embeberCon([A1, A2, B]));
    expect(elOrdenSeSostiene(m)).toBe(true);
    const alta = m.parejas.find(p => p.clave === 'alta')!.primera!;
    const baja = m.parejas.find(p => p.clave === 'baja')!.primera!;
    expect(alta).toBeGreaterThan(baja);
  });

  /** Control positivo del comprobador: con el orden invertido tiene que decir NO. */
  it('⚠️ y si se invirtiera, `elOrdenSeSostiene` lo diría — control positivo', async () => {
    const alRevés = await medirElCanario(embeberCon([A1, B, A2]));
    expect(elOrdenSeSostiene(alRevés)).toBe(false);
  });

  it('el sello del modelo viaja con la medición', async () => {
    const m = await medirElCanario(embeberCon([A1, A2, B]));
    expect(m.modelo.pedido).toBe(EMBEDDING_MODEL);
    expect(m.modelo.servido).toBe(EMBEDDING_MODEL);
    expect(m.modelo.dimension_servida).toBe(EMBEDDING_DIMENSION);
    expect(m.dimension_inesperada).toBe(false);
  });

  /**
   * ⚠️ Si el servicio devolviera otra dimensión, el coseno seguiría dando un
   * número perfectamente creíble sobre otro espacio vectorial. Esta bandera es lo
   * único que lo dice.
   */
  it('⚠️ una dimensión distinta de la declarada se MARCA', async () => {
    const m = await medirElCanario(embeberCon([A1, A2, B], { dimensionServida: 768 }));
    expect(m.dimension_inesperada).toBe(true);
    // Y las cifras se siguen dando: se marca, no se esconde.
    expect(m.parejas[0].primera).not.toBeNull();
  });

  it('un modelo servido que no vino queda en null, no se rellena con el pedido', async () => {
    const m = await medirElCanario(embeberCon([A1, A2, B], { modeloServido: null }));
    expect(m.modelo.servido).toBeNull();
    expect(m.modelo.pedido).toBe(EMBEDDING_MODEL);
  });

  it('⚠️ un fallo del servicio NO lanza: devuelve motivo y cero parejas', async () => {
    const roto: Embeber = async () => { throw new Error('429 rate limit'); };
    const m = await medirElCanario(roto);
    expect(m.parejas).toEqual([]);
    expect(m.motivo).toContain('429 rate limit');
    expect(elOrdenSeSostiene(m)).toBeNull();
  });

  it('si faltan vectores en la respuesta, las cifras son null y no cero', async () => {
    const m = await medirElCanario(embeberCon([A1]));
    expect(m.motivo).toBeNull();
    for (const p of m.parejas) {
      expect(p.primera).toBeNull();
      expect(p.ruido).toBeNull();
    }
  });
});

describe('el canario no medido se escribe igual', () => {
  it('lleva su motivo, su versión y el modelo pedido', () => {
    const m = canarioNoMedido('no se pidió');
    expect(m.version).toBe(1);
    expect(m.motivo).toBe('no se pidió');
    expect(m.parejas).toEqual([]);
    expect(m.modelo.pedido).toBe(EMBEDDING_MODEL);
    expect(m.modelo.servido).toBeNull();
  });
});

describe('⚠️ LA REFERENCIA — medida el 23/09/2026, y su tolerancia decidida', () => {
  /**
   * ⚠️ ESTE BLOQUE DECÍA «pendiente» Y COMPROBABA QUE `REFERENCIA` ERA `null`.
   * Se midió en producción el 23/09/2026, así que ese caso murió y éstos ocupan
   * su sitio. La distinción que conservan es la que importa: **la referencia está
   * MEDIDA y la tolerancia está SIN DECIDIR**, y son dos cosas distintas.
   */
  it('trae la medición completa, con su fecha y su sello', () => {
    expect(REFERENCIA.fecha).toBe('2026-09-23');
    expect(REFERENCIA.modelo).toBe(EMBEDDING_MODEL);
    expect(REFERENCIA.dimension).toBe(EMBEDDING_DIMENSION);
    expect(REFERENCIA.alta).toBeCloseTo(0.9787957957543013, 12);
    expect(REFERENCIA.baja).toBeCloseTo(0.7851197779564706, 12);
  });

  /**
   * ⚠️ EL ORDEN DE LA REFERENCIA ES EL QUE EL INSTRUMENTO PREDICE, y comprobarlo
   * aquí no es redundante: si alguien intercambiara los dos números al copiarlos,
   * el canario compararía la pareja alta contra la referencia baja y daría una
   * alarma permanente. Es el error de transcripción más probable.
   */
  it('⚠️ la referencia alta es mayor que la baja: el orden sobrevive a la copia', () => {
    expect(REFERENCIA.alta).toBeGreaterThan(REFERENCIA.baja);
    // Y con holgura: casi 0,2 de separación, no dos cifras pegadas.
    expect(REFERENCIA.alta - REFERENCIA.baja).toBeGreaterThan(0.15);
  });

  it('⚠️ el ruido medido es CERO EXACTO, no «pequeño»', () => {
    expect(REFERENCIA.ruido_medido).toBe(0);
  });

  /**
   * ⚠️ LA TOLERANCIA ES UNA DECISIÓN DEL DIRECTOR, NO UN CÁLCULO. C7 la derivaba
   * del ruido medido, y el ruido salió CERO: de cero no se puede derivar una
   * tolerancia sin inventarla. Se decidió el 23/09/2026 en 0,001, con su razón y
   * su condición de validez; los casos que la ejercen están más abajo.
   */
  it('⚠️ la tolerancia la DECIDIÓ el director: 0,001, no un cálculo', () => {
    expect(REFERENCIA.tolerancia).toBe(0.001);
  });
});

describe('⚠️ LA TOLERANCIA — 0,001, decidida por el director el 23/09/2026', () => {
  const A1v = [1, 0, 0];
  const Bv = [0, 0, 1];

  /** Dos vectores cuyo coseno vale EXACTAMENTE lo que se pida. Sirve para poner
   *  una pareja del canario en un valor elegido y medir el comprobador. */
  const parQueCoseno = (c: number): [number[], number[]] => [
    [1, 0],
    [c, Math.sqrt(1 - c * c)],
  ];

  /** Una medición del canario con la alta y la baja en los valores que se pidan. */
  const canarioEn = async (alta: number, baja: number) => {
    const [, derechaAlta] = parQueCoseno(alta);
    const [, derechaBaja] = parQueCoseno(baja);
    // A1 es el ancla de las dos parejas, así que va primero y en 2 dimensiones.
    return medirElCanario(embeberCon([[1, 0], derechaAlta, derechaBaja]));
  };

  it('el par de control cosenea lo que se le pide, que es lo que hace legible el resto', () => {
    const [i, d] = parQueCoseno(0.9788);
    expect(coseno(i, d)!).toBeCloseTo(0.9788, 10);
  });

  it('⚠️ YA NO DEVUELVE null: hay tolerancia, así que hay respuesta', async () => {
    expect(REFERENCIA.tolerancia).toBe(0.001);
    const m = await canarioEn(REFERENCIA.alta, REFERENCIA.baja);
    expect(elCanarioSeHaMovido(m)).not.toBeNull();
    expect(elCanarioSeHaMovido(m)).toBe(false);
  });

  /**
   * ⚠️ CASO DECISIVO DE LA TOLERANCIA: un movimiento POR DEBAJO de 0,001 no
   * alarma y uno POR ENCIMA sí. Si alguien la subiera a 0,01 o la bajara a 0,
   * uno de los dos lados se pondría rojo — que es lo que le faltaba a este
   * instrumento cuando la tolerancia era `null`.
   */
  it('⚠️ POR DEBAJO de la tolerancia NO alarma (deriva de 0,0005 en la alta)', async () => {
    const m = await canarioEn(REFERENCIA.alta - 0.0005, REFERENCIA.baja);
    expect(elCanarioSeHaMovido(m)).toBe(false);
  });

  it('⚠️ POR ENCIMA de la tolerancia SÍ alarma (deriva de 0,002 en la alta)', async () => {
    const m = await canarioEn(REFERENCIA.alta - 0.002, REFERENCIA.baja);
    expect(elCanarioSeHaMovido(m)).toBe(true);
  });

  it('⚠️ y la pareja BAJA alarma por su cuenta: basta que se mueva UNA', async () => {
    const m = await canarioEn(REFERENCIA.alta, REFERENCIA.baja + 0.002);
    expect(elCanarioSeHaMovido(m)).toBe(true);
  });

  it('la baja por debajo de la tolerancia tampoco alarma', async () => {
    const m = await canarioEn(REFERENCIA.alta, REFERENCIA.baja - 0.0005);
    expect(elCanarioSeHaMovido(m)).toBe(false);
  });

  /**
   * ⚠️ LA CONDICIÓN DE VALIDEZ, ESCRITA COMO CASO: 0,001 sólo discrimina mientras
   * el ruido se mantenga al menos un orden de magnitud por debajo. Esto no puede
   * comprobar el ruido futuro —no ha ocurrido— pero sí puede fijar la relación que
   * lo hará evidente: si alguien bajara la tolerancia al orden del ruido de
   * rederivación (1e-4), esta aserción se pone roja y le manda a leer la cabecera.
   */
  it('⚠️ la tolerancia está un orden de magnitud por encima del umbral de rederivación', () => {
    const UMBRAL_DE_REDERIVACION = 1e-4;
    expect(REFERENCIA.tolerancia!).toBeGreaterThanOrEqual(UMBRAL_DE_REDERIVACION * 10);
    // Y el ruido medido sigue muy por debajo, que es lo que la hace válida hoy.
    expect(REFERENCIA.ruido_medido).toBeLessThan(UMBRAL_DE_REDERIVACION);
  });

  it('sin cifras que comparar sigue devolviendo null, tolerancia o no', async () => {
    const roto: Embeber = async () => { throw new Error('503'); };
    expect(elCanarioSeHaMovido(await medirElCanario(roto))).toBeNull();
  });
});
