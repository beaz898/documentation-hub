import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { claseDelConflicto, explicacion, puertaDeValidez } from './regla-de-validez';

/** LA HUELLA DE LA PUERTA DE VALIDEZ, CONGELADA (12/11/2026): sobre el fichero con finales de línea LF, como la de la regla laxa. */
export const HUELLA_DE_LA_REGLA_DE_VALIDEZ = 'c3a3f85dfca620a8';

describe('la puerta de validez del brazo N, congelada', () => {
  it('⚠️ SU HUELLA es la prerregistrada', () => {
    const texto = readFileSync('app/api/admin/medida-f130/regla-de-validez.ts', 'utf8').replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(texto, 'utf8').digest('hex').slice(0, 16)).toBe(HUELLA_DE_LA_REGLA_DE_VALIDEZ);
  });

  it('la explicación es lo que va después de la primera línea no vacía', () => {
    expect(explicacion('\n\nCONFLICTO\nUna.\nDos.')).toBe('Una.\nDos.');
    expect(explicacion('CONFLICTO')).toBe('');
  });

  it('LA CLASE: por D si la explicación habla de la misma persona o de la separación; si no, OTRA COSA (el sesgo, contra nosotros)', () => {
    const casos: Array<[string, 'd' | 'otra']> = [
      ['CONFLICTO\nEl Texto 1 permite que la misma persona ocupe los dos cargos.', 'd'],
      ['CONFLICTO\nEl Texto 2 exige la separación de funciones que el Texto 1 permite romper.', 'd'],
      ['CONFLICTO\nSi el Coordinador puede ser el propio Director Clínico, no se cumple el criterio.', 'd'],
      ['CONFLICTO\nEl Texto 1 deja que la figura recaiga en el Director, y eso choca con separar responsabilidades.', 'd'],
      ['CONFLICTO\nEn el Texto 1 el Coordinador hace supervisión documental y en el Texto 2 es el responsable último de la esterilización.', 'otra'],
      ['CONFLICTO\nLas funciones del Coordinador no coinciden entre los dos textos.', 'otra'],
      ['CONFLICTO', 'otra'],
      // la explicación manda, no la primera línea: «separación» en la primera línea no cuenta
      ['CONFLICTO por la separación\nLas funciones del Coordinador no coinciden.', 'otra'],
    ];
    for (const [r, clase] of casos) expect([r, claseDelConflicto(r).clase]).toEqual([r, clase]);
  });

  it('LA PUERTA: válida si los de otra cosa no pasan de uno de cada cinco (4+1 vale; 3+1 no); y se cuenta sobre los conflictos', () => {
    const d = 'CONFLICTO\nLa misma persona.', otra = 'CONFLICTO\nLas funciones difieren.';
    expect(puertaDeValidez([d, d, d, d, otra])).toEqual({ conflictos: 5, porD: 4, porOtraCosa: 1, valida: true });
    expect(puertaDeValidez([d, d, d, otra])).toEqual({ conflictos: 4, porD: 3, porOtraCosa: 1, valida: false });
    expect(puertaDeValidez([])).toEqual({ conflictos: 0, porD: 0, porOtraCosa: 0, valida: true });
  });
});
