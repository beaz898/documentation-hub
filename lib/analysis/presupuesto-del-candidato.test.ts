import { afterEach, describe, expect, it } from 'vitest';
import { presupuestoPorCandidato } from './retrieval';

/**
 * B.281 (29/09/2026): el presupuesto por candidato que se guarda con el análisis
 * (`FinalAnalysis.presupuestoDelCandidato`) sale de la MISMA función que el log.
 * Casos decisivos: el rápido no mira la variable; el exhaustivo la usa si es un
 * entero positivo y, si no, cae al del rápido.
 */

const VARIABLE = 'ANALYSIS_EXHAUSTIVE_BUDGET_CHARS';
const original = process.env[VARIABLE];
afterEach(() => {
  if (original === undefined) delete process.env[VARIABLE];
  else process.env[VARIABLE] = original;
});

describe('presupuestoPorCandidato', () => {
  it('rápido: 3.000, aunque la variable del exhaustivo esté puesta', () => {
    process.env[VARIABLE] = '14676';
    expect(presupuestoPorCandidato(false)).toBe(3000);
  });
  it('exhaustivo con la variable: su valor (el de B.280, 14.676)', () => {
    process.env[VARIABLE] = '14676';
    expect(presupuestoPorCandidato(true)).toBe(14676);
  });
  it('exhaustivo sin la variable: el del rápido', () => {
    delete process.env[VARIABLE];
    expect(presupuestoPorCandidato(true)).toBe(3000);
  });
  it.each(['0', '-5', 'mucho', ''])('exhaustivo con la variable inválida «%s»: el del rápido', v => {
    process.env[VARIABLE] = v;
    expect(presupuestoPorCandidato(true)).toBe(3000);
  });
});
