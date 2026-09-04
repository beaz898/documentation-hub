import { describe, expect, it } from 'vitest';

import { puedeUsarLaEstructura } from './estructura-del-modal';

/**
 * B.175 — la estructura del original solo vale si el texto no cambió.
 *
 * ⚠️ LO QUE NO PRUEBAN: que `analyze-v2` extraiga los segmentos ni que el diff
 * los use. Eso descarga un fichero y habla con el modelo. Lo que sí prueban es
 * LA CONDICIÓN, que es donde equivocarse produce un informe falso.
 */

const original = 'Tratamiento | Precio | Clínica\nEND-03 | 320 | Norte\nEST-03 | 180 | Sur';

describe('mismo texto: la estructura del original vale', () => {
  it('idéntico', () => {
    expect(puedeUsarLaEstructura(original, original)).toBe(true);
  });

  /** Abrir el modal y guardar sin tocar nada puede reescribir saltos o espacios.
   *  Eso NO es editar, y contarlo como edición dejaría el arreglo sin efecto en
   *  el caso más común. */
  it('los saltos, los tabuladores y las mayúsculas no son una edición', () => {
    expect(puedeUsarLaEstructura(original, original.replace(/\n/g, '\r\n'))).toBe(true);
    expect(puedeUsarLaEstructura(original, original.replace(/ \| /g, '\t|\t'))).toBe(true);
    expect(puedeUsarLaEstructura(original, original.toUpperCase())).toBe(true);
    expect(puedeUsarLaEstructura(`  ${original}\n\n`, original)).toBe(true);
  });
});

describe('TEXTO EDITADO: la estructura NO vale', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA, y es el arreglo entero. Con los segmentos del
   * original y el texto editado, el diff emitiría diferencias sobre celdas que
   * el usuario YA CORRIGIÓ — un informe falso con sello de estructura, peor que
   * no emitir nada.
   */
  it('una sola cifra cambiada invalida la estructura', () => {
    expect(puedeUsarLaEstructura(original.replace('320', '350'), original)).toBe(false);
  });

  it('una fila borrada también', () => {
    expect(puedeUsarLaEstructura(original.split('\n').slice(0, 2).join('\n'), original)).toBe(false);
  });

  it('una línea añadida también', () => {
    expect(puedeUsarLaEstructura(`${original}\nURG-03 | 90 | Norte`, original)).toBe(false);
  });
});

describe('lo que falta o no es texto no habilita nada', () => {
  it('vacío, ausente o de otro tipo dan false', () => {
    expect(puedeUsarLaEstructura('', original)).toBe(false);
    expect(puedeUsarLaEstructura(original, '')).toBe(false);
    expect(puedeUsarLaEstructura(undefined as unknown as string, original)).toBe(false);
    expect(puedeUsarLaEstructura(original, 42 as unknown as string)).toBe(false);
  });

  /**
   * ⚠️ DOS VACÍOS TIENEN EL MISMO HASH, así que sin la guarda de longitud esto
   * diría que SÍ se puede usar la estructura de un fichero que no dio texto.
   * Lo cazó una mutación que sobrevivió: la comparación por hash sola no basta.
   */
  it('dos vacíos no son «el mismo texto»', () => {
    expect(puedeUsarLaEstructura('', '')).toBe(false);
    expect(puedeUsarLaEstructura('   ', '   ')).toBe(false);
  });
});
