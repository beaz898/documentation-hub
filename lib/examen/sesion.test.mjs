import { describe, expect, it } from 'vitest';

import { conRenovacion, CredencialPerdida, crearSesion, leerFicheroDeEntorno } from './sesion.mjs';

/**
 * LA RENOVACIÓN DEL EJECUTOR — condición (d) del arquitecto, 27/09/2026.
 * Sin red: la llamada al endpoint y la API de Supabase se inyectan.
 */

/** Sesión falsa: cada renovación cambia el token. */
function sesionFalsa({ renuevaBien = true } = {}) {
  let n = 1;
  return {
    renovaciones: 0,
    token: () => `t${n}`,
    async renovar() {
      if (!renuevaBien) throw new CredencialPerdida('no se pudo renovar');
      this.renovaciones++;
      n++;
    },
  };
}

describe('conRenovacion', () => {
  it('sin 401 no renueva ni anota nada', async () => {
    const s = sesionFalsa();
    const registro = [];
    const r = await conRenovacion(async () => ({ http: 200 }), s, registro);
    expect(r.http).toBe(200);
    expect(s.renovaciones).toBe(0);
    expect(registro).toEqual([]);
  });

  it('⚠️ CASO DECISIVO — un 401 renueva, REINTENTA con el token nuevo y deja la pasada en 200', async () => {
    const s = sesionFalsa();
    const registro = [];
    const tokens = [];
    const r = await conRenovacion(async t => { tokens.push(t); return { http: t === 't1' ? 401 : 200 }; }, s, registro);
    expect(r.http).toBe(200);
    expect(tokens).toEqual(['t1', 't2']);
    // Anotado como renovación, y dicho que no es un fallo del análisis.
    expect(registro).toHaveLength(1);
    expect(registro[0].resultado).toContain('NO es un fallo del análisis');
  });

  it('si no puede renovar, lanza CredencialPerdida — que es lo que PARA la tanda', async () => {
    await expect(conRenovacion(async () => ({ http: 401 }), sesionFalsa({ renuevaBien: false }), []))
      .rejects.toBeInstanceOf(CredencialPerdida);
  });

  it('401 también con el token renovado: para, no renueva en bucle', async () => {
    const s = sesionFalsa();
    await expect(conRenovacion(async () => ({ http: 401 }), s, [])).rejects.toThrow(/recién renovado/);
    expect(s.renovaciones).toBe(1);
  });

  it('⚠️ CONTROL POSITIVO — otros errores (500, 402) NO renuevan: son del sistema y cuentan', async () => {
    for (const http of [500, 402, 403]) {
      const s = sesionFalsa();
      const r = await conRenovacion(async () => ({ http }), s, []);
      expect(r.http).toBe(http);
      expect(s.renovaciones).toBe(0);
    }
  });
});

describe('crearSesion', () => {
  const respuesta = (status, json) => ({ ok: status < 400, status, json: async () => json });

  it('renueva con el refresh token si puede, y si no vuelve a entrar con contraseña', async () => {
    const grants = [];
    const fetchImpl = async url => {
      const grant = new URL(url).searchParams.get('grant_type');
      grants.push(grant);
      if (grant === 'refresh_token') return respuesta(400, { error_description: 'Invalid Refresh Token' });
      return respuesta(200, { access_token: `a${grants.length}`, refresh_token: 'r' });
    };
    const s = crearSesion({ supabaseUrl: 'https://x.supabase.co', anonKey: 'k', correo: 'c', contrasena: 'p', fetchImpl });
    await s.iniciar();
    await s.renovar();
    expect(grants).toEqual(['password', 'refresh_token', 'password']);
    expect(s.token()).toBe('a3');
  });

  it('⚠️ el mensaje de error NUNCA lleva la contraseña', async () => {
    const fetchImpl = async () => respuesta(400, { error_description: 'Invalid login credentials' });
    const s = crearSesion({ supabaseUrl: 'https://x.supabase.co', anonKey: 'k', correo: 'yo@x', contrasena: 'SECRETA-123', fetchImpl });
    const err = await s.iniciar().catch(e => e);
    expect(err).toBeInstanceOf(CredencialPerdida);
    expect(err.message).toContain('Invalid login credentials');
    expect(err.message).not.toContain('SECRETA-123');
  });
});

describe('leerFicheroDeEntorno', () => {
  it('lee CLAVE=valor, ignora comentarios y vacías, y quita comillas', () => {
    const e = leerFicheroDeEntorno('# comentario\r\nA=1\n\nB = "dos"\nC=con=igual\n');
    expect(e).toEqual({ A: '1', B: 'dos', C: 'con=igual' });
  });
});
