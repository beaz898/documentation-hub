import { describe, it, expect } from 'vitest';
import { costeDe, sufijoDeCoste, sufijoDeTotal } from './coste-visible';
import { CREDIT_COSTS } from './credits';

/**
 * EL PRECIO QUE VE EL USUARIO — B.180.
 *
 * Lo que se vigila aquí no es el formato: es que el número salga de
 * `CREDIT_COSTS` y no de una constante escrita al lado. Un precio duplicado no
 * falla al escribirlo — falla meses después, cuando alguien cambia el coste y
 * la etiqueta se queda con el viejo.
 */
describe('costeDe', () => {
  /**
   * ⚠️ EL CASO QUE ATA LA ETIQUETA AL COBRO. No compara contra 30: compara
   * contra lo que el servidor cobra. Si mañana el exhaustivo pasa a 40, este
   * caso sigue verde y la etiqueta también cambia — que es justo lo que se
   * quiere. Un `toBe(30)` aquí habría sido la segunda definición del precio,
   * disfrazada de test.
   */
  it('sale de CREDIT_COSTS, no de un número escrito aquí', () => {
    expect(costeDe('/api/analyze-v2:exhaustive')).toBe(CREDIT_COSTS['/api/analyze-v2:exhaustive']);
    expect(costeDe('/api/analyze-style')).toBe(CREDIT_COSTS['/api/analyze-style']);
  });

  it('multiplica por documentos', () => {
    const uno = CREDIT_COSTS['/api/analyze-v2'];
    expect(costeDe('/api/analyze-v2', 4)).toBe(uno * 4);
  });

  /** ⚠️ MITAD CONTRARIA: una clave desconocida NO vale cero. Un cero se
   *  pintaría como «0 créditos» —un precio afirmado y falso—; `null` deja el
   *  botón sin precio, que es la verdad. */
  it('una clave que no existe devuelve null, no cero', () => {
    expect(costeDe('/api/lo-que-sea')).toBeNull();
  });

  it('cero o menos documentos no tiene precio que enseñar', () => {
    expect(costeDe('/api/analyze-v2', 0)).toBeNull();
    expect(costeDe('/api/analyze-v2', -3)).toBeNull();
  });
});

describe('sufijoDeCoste', () => {
  it('plural para más de uno', () => {
    expect(sufijoDeCoste('/api/analyze-v2:exhaustive'))
      .toBe(`${CREDIT_COSTS['/api/analyze-v2:exhaustive']} créditos`);
  });

  /** ⚠️ MITAD CONTRARIA: el singular existe. «1 créditos» se lee como un
   *  descuido y resta confianza justo donde se habla de dinero. */
  it('singular cuando el total es exactamente uno', () => {
    expect(sufijoDeCoste('/api/ask')).toBe('1 crédito');
  });

  it('el plural vuelve en cuanto se multiplica', () => {
    expect(sufijoDeCoste('/api/ask', 2)).toBe('2 créditos');
  });

  it('sin precio conocido no hay sufijo', () => {
    expect(sufijoDeCoste('/api/lo-que-sea')).toBeNull();
  });
});

/**
 * ⚠️ EL FORMATEADOR DE UN TOTAL YA CALCULADO — y el caso que vigila que nadie
 * vuelva a recalcularlo.
 *
 * La primera versión de B.180 hizo justo eso: `ReviewSelectionBar` recibía
 * `estimatedCost` y `exhaustiveCost` ya computados por `useReviewList`, y el
 * componente los ignoró para multiplicar clave × unidades por su cuenta. Dos
 * caminos al mismo número, de acuerdo ese día — en el commit escrito para
 * quitar exactamente eso.
 */
describe('sufijoDeTotal', () => {
  it('formatea el total que le den', () => {
    expect(sufijoDeTotal(50)).toBe('50 créditos');
  });

  it('singular en el uno', () => {
    expect(sufijoDeTotal(1)).toBe('1 crédito');
  });

  /** ⚠️ MITAD CONTRARIA: sin total no hay precio. Cero se pintaría como
   *  «0 créditos», un precio afirmado y falso. */
  it('cero, negativo o ausente no tienen precio', () => {
    expect(sufijoDeTotal(0)).toBeNull();
    expect(sufijoDeTotal(-5)).toBeNull();
    expect(sufijoDeTotal(null)).toBeNull();
    expect(sufijoDeTotal(undefined)).toBeNull();
  });

  /** Los dos caminos tienen que dar lo mismo mientras coincidan: si algún día
   *  dejan de hacerlo, será por una decisión y no por un descuido. */
  it('coincide con sufijoDeCoste para el mismo total', () => {
    const total = CREDIT_COSTS['/api/analyze-v2'] * 10;
    expect(sufijoDeTotal(total)).toBe(sufijoDeCoste('/api/analyze-v2', 10));
  });
});
