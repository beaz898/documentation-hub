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

describe('⚠️ LA REFERENCIA — pendiente, y esto lo vigila', () => {
  /**
   * ⚠️ NO ES UN CASO TONTO. C7 manda que la referencia sean los valores de la
   * PRIMERA MEDICIÓN, con su fecha y su sello, y que la tolerancia salga del
   * ruido medido. Nada de eso existe hoy. Si alguien rellenara `REFERENCIA` con
   * números estimados, el canario compararía contra una suposición — y daría
   * alarmas o silencios igual de infundados. Este caso muere el día que se
   * rellene DE VERDAD, y ese día hay que borrarlo a mano y escribir el que
   * compruebe la tolerancia.
   */
  it('⚠️ sigue siendo null: no se rellena a mano ni se estima', () => {
    expect(REFERENCIA).toBeNull();
  });
});
