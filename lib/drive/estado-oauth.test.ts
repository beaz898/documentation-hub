import { describe, it, expect } from 'vitest';
import {
  firmarEstadoDeOAuth,
  verificarEstadoDeOAuth,
  codigoDeEstadoRechazado,
  VIDA_DEL_ESTADO_MS,
  type MotivoDeEstado,
} from './estado-oauth';
import { firmarCarga } from '@/lib/analysis/firma';

/**
 * ⚠️ LO QUE ESTA BATERÍA TIENE QUE DEMOSTRAR ES LO QUE ANTES SE PODÍA HACER: que
 * un `state` compuesto a mano con el `orgId` de otro **no pasa**. El caso
 * positivo es el fácil; los que importan son los cinco rechazos, y cada uno va
 * junto a su control para que no pasen por el motivo equivocado.
 */

const SECRETO = 'secreto-de-pruebas-que-no-es-el-de-produccion';
const DATOS = { userId: 'u-1', orgId: 'org-1', provider: 'google_drive' };
const SESION = { userId: 'u-1' };
const AHORA = 1_700_000_000_000;

describe('el camino bueno', () => {
  it('lo que se firma se verifica, y vuelve entero', () => {
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA);
    const r = verificarEstadoDeOAuth(s, SESION, SECRETO, AHORA + 1000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.datos).toEqual(DATOS);
  });

  it('el `state` NO lleva ninguna credencial dentro', () => {
    // La razón de firmar en vez de leer el token: nada que valga por sí solo
    // viaja por la barra de direcciones. Se comprueba sobre el contenido real.
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA);
    const cuerpo = Buffer.from(s.split('.')[0], 'base64url').toString('utf8');
    expect(cuerpo).not.toContain('token');
    expect(cuerpo).toContain('org-1');
  });
});

describe('⚠️ lo que ANTES se podía hacer y ahora no', () => {
  it('un `state` compuesto a mano —el ataque exacto— se rechaza por FIRMA', () => {
    // Esto es literalmente lo que el callback aceptaba: base64 de un JSON.
    const falsificado = Buffer.from(
      JSON.stringify({ userId: 'atacante', orgId: 'org-de-la-victima', provider: 'google_drive' }),
    ).toString('base64');

    const r = verificarEstadoDeOAuth(falsificado, { userId: 'atacante' }, SECRETO, AHORA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('firma');
  });

  it('CONTROL: el mismo ataque con firma VÁLIDA de otro secreto tampoco pasa', () => {
    const conOtroSecreto = firmarEstadoDeOAuth(
      { userId: 'atacante', orgId: 'org-de-la-victima', provider: 'google_drive' },
      'otro-secreto', AHORA,
    );
    const r = verificarEstadoDeOAuth(conOtroSecreto, { userId: 'atacante' }, SECRETO, AHORA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('firma');
  });

  it('⚠️ un `state` NUESTRO, válido y vivo, pero de OTRA sesión: `ajeno`', () => {
    // El reintento de un `state` capturado. La firma casa y no ha caducado:
    // lo único que lo para es que la sesión no sea la suya.
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA);
    const r = verificarEstadoDeOAuth(s, { userId: 'otro-usuario' }, SECRETO, AHORA + 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('ajeno');
  });

  it('CONTROL POSITIVO del anterior: con la sesión correcta, el MISMO `state` pasa', () => {
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA);
    expect(verificarEstadoDeOAuth(s, SESION, SECRETO, AHORA + 1000).ok).toBe(true);
  });
});

describe('la caducidad', () => {
  it('justo dentro de la ventana, pasa', () => {
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA);
    expect(verificarEstadoDeOAuth(s, SESION, SECRETO, AHORA + VIDA_DEL_ESTADO_MS).ok).toBe(true);
  });

  it('un milisegundo más tarde, caduca', () => {
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA);
    const r = verificarEstadoDeOAuth(s, SESION, SECRETO, AHORA + VIDA_DEL_ESTADO_MS + 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('caducado');
  });

  it('emitido «en el futuro» también se rechaza', () => {
    const s = firmarEstadoDeOAuth(DATOS, SECRETO, AHORA + 10 * 60_000);
    const r = verificarEstadoDeOAuth(s, SESION, SECRETO, AHORA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('caducado');
  });
});

describe('las entradas que no son un `state`', () => {
  it('ausente', () => {
    for (const malo of [undefined, null, '', 123, {}]) {
      const r = verificarEstadoDeOAuth(malo, SESION, SECRETO, AHORA);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.motivo).toBe('ausente');
    }
  });

  it('firmado por nosotros pero sin los campos que hacen falta: `malformado`', () => {
    const cojo = firmarCarga({ orgId: 'org-1', t: AHORA }, SECRETO); // sin userId
    const r = verificarEstadoDeOAuth(cojo, SESION, SECRETO, AHORA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('malformado');
  });
});

describe('cada motivo tiene su código, y son distinguibles', () => {
  it('los cinco, y ninguno repetido donde importa', () => {
    const motivos: MotivoDeEstado[] = ['ausente', 'malformado', 'firma', 'caducado', 'ajeno'];
    for (const m of motivos) expect(codigoDeEstadoRechazado(m).length).toBeGreaterThan(0);
    // Los dos que el usuario puede arreglar por su cuenta NO se confunden con
    // los que significan «algo raro pasa».
    expect(codigoDeEstadoRechazado('caducado')).toBe('state_expired');
    expect(codigoDeEstadoRechazado('ajeno')).toBe('state_not_yours');
  });
});
