import { describe, expect, it } from 'vitest';

import {
  estadoDelSecreto,
  LONGITUD_MINIMA_DEL_SECRETO,
  NOMBRE_DEL_SECRETO,
  secretoDeFirma,
} from './secreto';

/**
 * LA LECTURA DEL SECRETO — el arranque de la comprobación (03/09/2026).
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, DECLARADO: que la variable esté puesta en
 * Vercel. Eso no lo puede saber una prueba — lo contesta la ruta de
 * administración corriendo en el despliegue, que es justamente por lo que esa
 * ruta existe.
 */

const bueno = 'a'.repeat(64);

describe('qué sabemos del secreto sin decir qué es', () => {
  it('un secreto de la longitud prevista es usable', () => {
    expect(estadoDelSecreto(bueno)).toEqual({
      presente: true, longitud: 64, usable: true, motivo: null,
    });
  });

  /** ⚠️ MITAD CONTRARIA, y es LA del módulo: ausente no es vacío, y ninguno de
   *  los dos es usable. Con `?? ''` se firmaría con la cadena vacía y el sistema
   *  aceptaría cualquier cosa, en silencio. */
  it('ausente y vacío no son usables, y se distinguen', () => {
    expect(estadoDelSecreto(undefined)).toEqual({
      presente: false, longitud: 0, usable: false, motivo: 'ausente',
    });
    expect(estadoDelSecreto('')).toEqual({
      presente: true, longitud: 0, usable: false, motivo: 'vacío',
    });
  });

  /** El pegado truncado: el fallo real de configurar un secreto a mano. */
  it('un secreto demasiado corto no es usable', () => {
    const corto = estadoDelSecreto('a'.repeat(LONGITUD_MINIMA_DEL_SECRETO - 1));
    expect(corto.usable).toBe(false);
    expect(corto.longitud).toBe(LONGITUD_MINIMA_DEL_SECRETO - 1);
  });

  it('justo en el mínimo sí es usable — el límite es inclusivo', () => {
    expect(estadoDelSecreto('a'.repeat(LONGITUD_MINIMA_DEL_SECRETO)).usable).toBe(true);
  });

  /**
   * ⚠️ SE RECORTA ANTES DE MEDIR. Un salto de línea al pegar en el panel haría
   * que el secreto firmara distinto en cada entorno, y el síntoma —«las firmas
   * no verifican»— no señalaría a su causa.
   */
  it('los espacios de alrededor no cuentan', () => {
    expect(estadoDelSecreto(`  ${bueno}\n`).longitud).toBe(64);
    expect(estadoDelSecreto(`   ${' '.repeat(40)}   `).motivo).toBe('vacío');
  });

  /** No devuelve NADA del valor: es un diagnóstico, no una filtración. */
  it('no filtra ni un carácter del secreto', () => {
    const json = JSON.stringify(estadoDelSecreto(bueno));
    expect(json).not.toContain('aaaa');
  });
});

describe('el secreto, o una avería ruidosa', () => {
  it('devuelve el secreto recortado cuando es usable', () => {
    expect(secretoDeFirma({ [NOMBRE_DEL_SECRETO]: `  ${bueno}  ` })).toBe(bueno);
  });

  /** ⚠️ LANZA, y no devuelve cadena vacía ni null: un secreto ausente es un
   *  despliegue mal configurado, no un caso a manejar. */
  it('lanza si falta, y el mensaje dice qué pasa sin decir el valor', () => {
    expect(() => secretoDeFirma({})).toThrowError(/ausente/);
    expect(() => secretoDeFirma({ [NOMBRE_DEL_SECRETO]: '' })).toThrowError(/vacío/);
    expect(() => secretoDeFirma({ [NOMBRE_DEL_SECRETO]: 'corto' })).toThrowError(/demasiado corto/);
  });

  it('el mensaje de la avería no lleva el secreto dentro', () => {
    try {
      secretoDeFirma({ [NOMBRE_DEL_SECRETO]: 'secreto-corto-pero-real' });
      throw new Error('debería haber lanzado');
    } catch (err) {
      expect(String(err)).not.toContain('secreto-corto-pero-real');
    }
  });
});
