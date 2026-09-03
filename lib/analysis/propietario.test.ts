import { describe, expect, it } from 'vitest';

import { documentoPropietario } from './propietario';

/**
 * F-100: LA FILA NACE ATADA O NO NACE.
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, DECLARADO: que la ruta consulte de verdad la
 * pertenencia —eso habla con Supabase— ni que el cliente mande el id correcto.
 * Lo que sí prueban es LA DECISIÓN: qué se escribe dado lo que llegó y lo que la
 * comprobación contestó.
 */

describe('el propietario, o nadie', () => {
  it('un id de la organización se escribe como propietario', () => {
    expect(documentoPropietario({ idPedido: 'doc-1', perteneceALaOrg: true })).toBe('doc-1');
  });

  /**
   * ⚠️ LA MITAD CONTRARIA DEL COMMIT. El id viene del cliente. Sin esta
   * comprobación, cualquiera con sesión atribuiría un análisis a cualquier
   * documento cuyo id conozca — y la bandeja, que se queda con el análisis más
   * reciente de cada documento, TAPARÍA el análisis real del ajeno.
   */
  it('un id que no es de la organización NO se escribe', () => {
    expect(documentoPropietario({ idPedido: 'doc-de-otro', perteneceALaOrg: false })).toBeNull();
  });

  /**
   * ⚠️ FALLA CERRADA. `perteneceALaOrg` llega en `false` también cuando la
   * consulta no pudo contestar. Entre degradar —análisis sin propietario— y
   * corromper —propietario ajeno—, se degrada.
   */
  it('si no se pudo comprobar, no hay propietario', () => {
    expect(documentoPropietario({ idPedido: 'doc-1', perteneceALaOrg: false })).toBeNull();
  });

  /** El camino del chat: el documento aún no existe y no manda id. No cambia
   *  respecto a hoy, y su arreglo es el régimen efímero, no este commit. */
  it('sin id no hay propietario, y eso es lo normal en el chat', () => {
    for (const nada of [undefined, null]) {
      expect(documentoPropietario({ idPedido: nada, perteneceALaOrg: true })).toBeNull();
    }
  });

  /**
   * ⚠️ DEVUELVE `null`, NUNCA CADENA VACÍA: una cadena vacía en el sitio de un
   * id se lee aguas abajo como un dato, y `''` no es «sin propietario».
   */
  it('la cadena vacía no es un propietario', () => {
    expect(documentoPropietario({ idPedido: '', perteneceALaOrg: true })).toBeNull();
  });

  it('lo que no es una cadena no pasa, y no lanza', () => {
    for (const basura of [42, {}, [], true, Symbol('x')]) {
      expect(documentoPropietario({ idPedido: basura, perteneceALaOrg: true })).toBeNull();
    }
  });
});
