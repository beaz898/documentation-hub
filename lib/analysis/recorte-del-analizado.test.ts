import { describe, it, expect } from 'vitest';
import { recortarAnalizado } from './judge';

/**
 * F-116, 27/09/2026: el recorte del analizado y su medida salen de la misma
 * función. El 6000 es `NEW_DOC_LIMIT_QUICK` (`judge.ts:35`); su caso decisivo es
 * el borde: 6000 no se recorta, 6001 sí.
 */
describe('recortarAnalizado', () => {
  it('rápido y más largo que el tope: recorta y lo dice — «6000 de 7342»', () => {
    const r = recortarAnalizado('x'.repeat(7342), false);
    expect(r.medida).toEqual({ caracteres: 7342, mostrados: 6000 });
    expect(r.texto.length).toBe(6000);
  });
  it('el borde: 6000 entra entero, 6001 pierde uno', () => {
    expect(recortarAnalizado('x'.repeat(6000), false).medida).toEqual({ caracteres: 6000, mostrados: 6000 });
    expect(recortarAnalizado('x'.repeat(6001), false).medida).toEqual({ caracteres: 6001, mostrados: 6000 });
  });
  it('exhaustivo: no recorta, las dos cifras iguales', () => {
    const r = recortarAnalizado('x'.repeat(7342), true);
    expect(r.medida).toEqual({ caracteres: 7342, mostrados: 7342 });
    expect(r.texto.length).toBe(7342);
  });
  it('el texto mostrado es el principio del completo, no otra cosa', () => {
    const completo = 'a'.repeat(6000) + 'b'.repeat(10);
    expect(recortarAnalizado(completo, false).texto).toBe('a'.repeat(6000));
  });
});
