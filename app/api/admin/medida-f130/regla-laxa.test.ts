import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { opcionLaxa, positivoLaxo } from './regla-laxa';

/**
 * LA HUELLA DE LA REGLA LAXA, CONGELADA (12/11/2026; condición de Fable: «la regla congelada con huella antes de contar»). Se calcula
 * sobre el fichero con los finales de línea normalizados a LF, para que la misma regla dé la misma huella en Windows y en Vercel. Si esta
 * prueba se pone en rojo, la regla ya no es la que se prerregistró: o se revierte, o se prerregistra otra ANTES de contar.
 */
export const HUELLA_DE_LA_REGLA_LAXA = 'dbd2687e70c2069e';

describe('la regla laxa, congelada', () => {
  it('⚠️ SU HUELLA es la prerregistrada', () => {
    const texto = readFileSync('app/api/admin/medida-f130/regla-laxa.ts', 'utf8').replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(texto, 'utf8').digest('hex').slice(0, 16)).toBe(HUELLA_DE_LA_REGLA_LAXA);
  });

  it('y hace lo que dice su cabecera: empieza por la palabra entera, sin las otras dos', () => {
    expect([opcionLaxa('n', 'Conflicto: porque…'), opcionLaxa('n', 'CONFLICTO o DEPENDE'), opcionLaxa('n', 'Hay CONFLICTO')]).toEqual(['CONFLICTO', 'INDECIDIBLE', 'OTRA']);
    expect([positivoLaxo('r', 'No puede, porque…'), positivoLaxo('r', 'Sí puede'), positivoLaxo('n', 'CONFLICTO')]).toEqual([true, false, true]);
  });
});
