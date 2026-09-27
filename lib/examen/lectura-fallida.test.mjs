import { describe, expect, it } from 'vitest';

import { crudoDeLecturaFallida, motivoDelCuerpo } from './lectura-fallida.mjs';

/**
 * EL MOTIVO DE UNA LECTURA FALLIDA — punto 2 del arquitecto, 27/09/2026.
 * Los dos 404 que la primera tanda no supo distinguir, uno de cada origen.
 */

/** El cuerpo LITERAL que devolvió Vercel el 27/09 (llamada de diagnóstico). */
const DE_PLATAFORMA = 'The deployment could not be found on Vercel.\n\nDEPLOYMENT_NOT_FOUND\n\ncdg1::vb5sm-1790496224130-b63bf3d2de5c';

/** El 404 NUESTRO de `app/api/admin/examen/route.ts`. */
const NUESTRO = {
  error: 'No se pudieron resolver todos los documentos del caso.',
  casoId: 'N1',
  problemas: ['"OPE-02_agenda-y-gestion-de-citas.xlsx" no está en esta organización'],
};

describe('el crudo guarda el cuerpo y el motivo', () => {
  it('⚠️ CASO DECISIVO — el 404 de plataforma deja su motivo, y el cuerpo entero', () => {
    const c = crudoDeLecturaFallida({ casoId: 'N1', pasada: 1, http: 404, cuerpo: DE_PLATAFORMA });
    expect(c.cuerpo).toBe(DE_PLATAFORMA);
    expect(c.motivo).toContain('DEPLOYMENT_NOT_FOUND');
    expect(c.http).toBe(404);
    expect(c.fase).toBe('fragmentos');
  });

  it('⚠️ los dos 404 se DISTINGUEN — que es justo lo que la tanda del 27/09 no pudo hacer', () => {
    const plataforma = crudoDeLecturaFallida({ casoId: 'N1', pasada: 1, http: 404, cuerpo: DE_PLATAFORMA });
    const nuestro = crudoDeLecturaFallida({ casoId: 'N1', pasada: 1, http: 404, cuerpo: NUESTRO });
    expect(nuestro.motivo).toContain('No se pudieron resolver');
    expect(nuestro.motivo).toContain('OPE-02');
    expect(nuestro.motivo).not.toBe(plataforma.motivo);
    expect(nuestro.cuerpo).toEqual(NUESTRO);
  });

  it('las renovaciones de credencial viajan también en este crudo', () => {
    const r = [{ motivo: 'HTTP 401' }];
    expect(crudoDeLecturaFallida({ casoId: 'N1', pasada: 1, http: 500, cuerpo: '', renovaciones: r }).renovacionesDeCredencial).toBe(r);
  });
});

describe('motivoDelCuerpo', () => {
  it('un cuerpo vacío lo dice, en vez de dejar el motivo en blanco', () => {
    expect(motivoDelCuerpo('')).toBe('cuerpo vacío');
    expect(motivoDelCuerpo(null)).toBe('cuerpo vacío');
  });

  it('recorta el motivo del informe, pero NO el cuerpo del crudo', () => {
    const largo = 'x'.repeat(5000);
    const c = crudoDeLecturaFallida({ casoId: 'N1', pasada: 1, http: 502, cuerpo: largo });
    expect(c.motivo.length).toBeLessThan(200);
    expect(c.cuerpo).toHaveLength(5000);
  });
});
