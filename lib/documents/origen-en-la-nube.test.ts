import { describe, it, expect } from 'vitest';
import { tieneOriginalEnLaNube } from './origen-en-la-nube';

/**
 * EL CRITERIO DE B.202, que contesta a una sola pregunta: ¿hay algo aguas
 * arriba que pueda pisar este documento?
 *
 * Lo usan el veto del servidor y el botón del cliente. Si alguna vez dejan de
 * usar el mismo, el botón dirá que se puede guardar y el servidor contestará
 * 409 — o peor, al revés.
 */
describe('tieneOriginalEnLaNube', () => {
  it('con identificador del proveedor, sí', () => {
    expect(tieneOriginalEnLaNube({ provider_file_id: '01ABCDEF' })).toBe(true);
  });

  it('un manual no lo tiene', () => {
    expect(tieneOriginalEnLaNube({ provider_file_id: null })).toBe(false);
  });

  /**
   * ⚠️ MITAD CONTRARIA Y EL CAMBIO DE F-15: **no se pregunta por `source`**.
   * Un proveedor futuro trae `provider_file_id` desde su primer documento, así
   * que queda protegido el día uno sin que nadie tenga que acordarse de añadirlo
   * a ninguna lista. Falla CERRADA.
   */
  it('un proveedor que nadie ha catalogado también queda protegido', () => {
    expect(
      tieneOriginalEnLaNube({ provider_file_id: 'algo-de-un-proveedor-nuevo' }),
      'Si esto fuera false, un proveedor nuevo podría guardarse desde el modal ' +
      'hasta que alguien recordara añadirlo a una lista, y su corrección se ' +
      'perdería en la siguiente sincronización sin decir nada.',
    ).toBe(true);
  });

  /** La cadena vacía no es un identificador: sería vetar sin motivo. */
  it('la cadena vacía no cuenta', () => {
    expect(tieneOriginalEnLaNube({ provider_file_id: '' })).toBe(false);
  });

  it('ausente o nulo no revienta', () => {
    expect(tieneOriginalEnLaNube({})).toBe(false);
    expect(tieneOriginalEnLaNube(null)).toBe(false);
    expect(tieneOriginalEnLaNube(undefined)).toBe(false);
  });
});
