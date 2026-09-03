import { describe, expect, it } from 'vitest';

import { firmarAnalisis, verificarAnalisis } from './firma';

/**
 * EL ANÁLISIS FIRMADO — aditivo, sin consumidores todavía.
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, Y SE DECLARA EN VEZ DE FINGIRLO: que la
 * comparación sea de tiempo constante. Cambiar `timingSafeEqual` por `===` no
 * pondría rojo ni un caso — es una propiedad de SEGURIDAD, no de comportamiento,
 * y una suite determinista no la puede medir. Se sostiene por lectura y queda
 * escrita aquí para que nadie la dé por cubierta.
 */

const SECRETO = 'a'.repeat(64);
const analisis = { discrepancies: [{ topic: 'Días de vacación', newDocSays: 'veintitrés' }], recommendation: 'REVISAR' };

describe('lo que firmo, lo reconozco', () => {
  it('ida y vuelta: el contenido vuelve intacto', () => {
    const { token, analysisId } = firmarAnalisis(analisis, SECRETO);
    const v = verificarAnalisis(token, SECRETO);
    expect(v).not.toBeNull();
    expect(v!.analisis).toEqual(analisis);
    expect(v!.analysisId).toBe(analysisId);
  });

  /** Los análisis van en español: si la codificación se rompiera, el síntoma
   *  sería «a veces no guarda» y no señalaría a su causa. */
  it('los acentos y las eñes sobreviven', () => {
    const conTildes = { texto: 'Añadió una cláusula sobre indemnización — «según convenio»' };
    const { token } = firmarAnalisis(conTildes, SECRETO);
    expect(verificarAnalisis(token, SECRETO)!.analisis).toEqual(conTildes);
  });

  /** ⚠️ EL ID LO EMITE EL SERVIDOR Y VA DENTRO DE LA FIRMA: es lo que permite
   *  usarlo como clave primaria, y de ahí sale gratis la unicidad del doble
   *  clic. Si el cliente pudiera ponerlo, sería fabricable. */
  it('el id viaja dentro y no se puede cambiar sin romper la firma', () => {
    const { token, analysisId } = firmarAnalisis(analisis, SECRETO, 'id-del-servidor');
    expect(analysisId).toBe('id-del-servidor');
    expect(verificarAnalisis(token, SECRETO)!.analysisId).toBe('id-del-servidor');
  });

  it('dos firmas del mismo análisis tienen ids distintos', () => {
    expect(firmarAnalisis(analisis, SECRETO).analysisId)
      .not.toBe(firmarAnalisis(analisis, SECRETO).analysisId);
  });
});

describe('LO QUE NO EMITÍ NO PASA', () => {
  const { token } = firmarAnalisis(analisis, SECRETO);
  const [cuerpo, firma] = token.split('.');

  /** ⚠️ MITAD CONTRARIA A: un solo byte cambiado en el contenido. Es la
   *  fabricación: alterar los contadores de un análisis que el servidor emitió. */
  it('un payload alterado no verifica', () => {
    const otro = Buffer.from(JSON.stringify({ analysisId: 'x', analisis: { recommendation: 'INDEXAR' } }), 'utf8').toString('base64url');
    expect(verificarAnalisis(`${otro}.${firma}`, SECRETO)).toBeNull();
  });

  it('una firma alterada no verifica', () => {
    const rota = firma.slice(0, -1) + (firma.endsWith('A') ? 'B' : 'A');
    expect(verificarAnalisis(`${cuerpo}.${rota}`, SECRETO)).toBeNull();
  });

  /** ⚠️ MITAD CONTRARIA B: la rotación del secreto. No es un fallo — es el
   *  comportamiento correcto, y por eso se fija. */
  it('otro secreto no verifica', () => {
    expect(verificarAnalisis(token, 'b'.repeat(64))).toBeNull();
  });

  /**
   * ⚠️ MITAD CONTRARIA C: la basura devuelve `null` SIN LANZAR. Incluida la que
   * reventaría `timingSafeEqual`, que lanza si las longitudes no coinciden — por
   * eso la comparación va detrás de una guarda de longitud.
   */
  it('la basura no verifica, y no lanza', () => {
    for (const basura of ['', '.', 'sinpunto', `${cuerpo}.`, `.${firma}`, `${cuerpo}.${firma}.extra`, `${cuerpo}.corta`, 42, null, undefined, {}]) {
      expect(() => verificarAnalisis(basura, SECRETO)).not.toThrow();
      expect(verificarAnalisis(basura, SECRETO)).toBeNull();
    }
  });

  /** Firma válida pero contenido sin id: no se persiste nada sin identidad. */
  it('un contenido sin analysisId no verifica aunque la firma case', () => {
    const sinId = Buffer.from(JSON.stringify({ analisis }), 'utf8').toString('base64url');
    const { createHmac } = require('crypto');
    const firmaValida = createHmac('sha256', SECRETO).update(sinId).digest('base64url');
    expect(verificarAnalisis(`${sinId}.${firmaValida}`, SECRETO)).toBeNull();
  });
});
