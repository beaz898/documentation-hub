import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolverOrg, getEffectiveRole } from './org';

/**
 * LO QUE ESTA BATERÍA DEMUESTRA, Y ES UNA SOLA COSA: que «no perteneces» y «la
 * base no contestó» salen por caminos DISTINTOS. Antes del 14/09/2026 los dos
 * salían por `null`, así que ningún test podía distinguirlos — y ninguno lo
 * intentó.
 *
 * ⚠️ EL CONTROL POSITIVO ES EL PAR, NO EL CASO SUELTO. Un test que sólo
 * comprobara `indisponible` pasaría igual con una función que devolviera
 * `indisponible` SIEMPRE. Por eso cada motivo se ejerce junto a su contrario,
 * con la misma forma de cliente y cambiando sólo el error.
 */

type Respuesta = { data: unknown; error: { code?: string; message?: string } | null };
type Guion = Respuesta | (() => never);

/**
 * Un cliente de Supabase de mentira. A cada tabla se le da una COLA de
 * respuestas, no una sola.
 *
 * ⚠️ Y LA COLA NO ES COMODIDAD: `resolverOrg` consulta `memberships` DOS VECES
 * —una para el `org_id` y otra, dentro del rol, para `role` e `is_owner`— y con
 * una respuesta única la segunda recibía la forma de la primera. `role` llegaba
 * `undefined`, el rol efectivo salía `member` por descarte y el test verde no
 * probaba nada. Se cazó escribiendo la batería mal primero.
 *
 * La última respuesta de la cola se repite: así un test que sólo declara una no
 * tiene que contar cuántas consultas hace por dentro lo que prueba.
 */
function clienteFalso(guiones: Record<string, Guion[]>): SupabaseClient {
  const pendientes: Record<string, Guion[]> = {};
  for (const [tabla, lista] of Object.entries(guiones)) pendientes[tabla] = [...lista];

  const constructor = (tabla: string) => {
    const terminar = () => {
      const cola = pendientes[tabla];
      if (!cola || cola.length === 0) {
        throw new Error(`El test no preparó respuesta para «${tabla}»`);
      }
      const r = cola.length > 1 ? cola.shift()! : cola[0];
      if (typeof r === 'function') return r();
      return Promise.resolve(r);
    };
    const cadena: Record<string, unknown> = {};
    for (const metodo of ['select', 'eq', 'is', 'limit']) cadena[metodo] = () => cadena;
    cadena.single = terminar;
    cadena.then = (resolver: (v: unknown) => unknown) => terminar().then(resolver);
    return cadena;
  };
  return { from: constructor } as unknown as SupabaseClient;
}

const PERTENENCIA  = { data: { org_id: 'org-1' }, error: null };
const ROL_MIEMBRO  = { data: { role: 'member', is_owner: false }, error: null };
const ROL_DUENO    = { data: { role: 'member', is_owner: true  }, error: null };
const SIN_ELEVACION = { data: [], error: null };
const CON_ELEVACION = { data: [{ id: 'e1' }], error: null };
const NO_HAY_FILA  = { data: null, error: { code: 'PGRST116', message: 'no rows' } };
const BASE_CAIDA   = { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } };

/** El caso sano completo: las dos consultas a `memberships`, por orden. */
const SANO = {
  memberships: [PERTENENCIA, ROL_MIEMBRO],
  temporary_elevations: [SIN_ELEVACION],
};

describe('resolverOrg — los dos motivos son distinguibles', () => {
  it('resuelve cuando hay pertenencia y rol', async () => {
    const r = await resolverOrg(clienteFalso(SANO), 'u1');
    expect(r.resuelta).toBe(true);
    if (r.resuelta) {
      expect(r.org.orgId).toBe('org-1');
      expect(r.org.role).toBe('member');
      expect(r.org.nativeRole).toBe('member');
    }
  });

  it('CONTROL POSITIVO (a): sin fila de pertenencia dice sin_organizacion', async () => {
    const r = await resolverOrg(clienteFalso({ memberships: [NO_HAY_FILA] }), 'u1');
    expect(r.resuelta).toBe(false);
    if (!r.resuelta) expect(r.motivo).toBe('sin_organizacion');
  });

  it('CONTROL POSITIVO (b): el MISMO camino con un error de base dice indisponible', async () => {
    const r = await resolverOrg(clienteFalso({ memberships: [BASE_CAIDA] }), 'u1');
    expect(r.resuelta).toBe(false);
    if (!r.resuelta) expect(r.motivo).toBe('indisponible');
  });

  it('una excepción del cliente es indisponible, no una afirmación sobre el usuario', async () => {
    const r = await resolverOrg(
      clienteFalso({ memberships: [() => { throw new Error('fetch failed'); }] }),
      'u1',
    );
    expect(r.resuelta).toBe(false);
    if (!r.resuelta) {
      expect(r.motivo).toBe('indisponible');
      expect(r.detalle).toContain('fetch failed');
    }
  });

  it('sin error y sin dato es indisponible — lo desconocido no se lee como un hecho', async () => {
    const r = await resolverOrg(clienteFalso({ memberships: [{ data: null, error: null }] }), 'u1');
    expect(r.resuelta).toBe(false);
    if (!r.resuelta) expect(r.motivo).toBe('indisponible');
  });

  it('⚠️ el fallo en la SEGUNDA consulta —la del rol— también sale como indisponible', async () => {
    // La pertenencia se resuelve; lo que cae es la consulta del rol. Antes esto
    // devolvía el mismo `null` que «no perteneces», con la fila de pertenencia
    // ya leída y delante.
    const r = await resolverOrg(
      clienteFalso({ memberships: [PERTENENCIA, BASE_CAIDA], temporary_elevations: [SIN_ELEVACION] }),
      'u1',
    );
    expect(r.resuelta).toBe(false);
    if (!r.resuelta) expect(r.motivo).toBe('indisponible');
  });

  it('y si la del rol dice «no hay fila», eso sí es sin_organizacion', async () => {
    const r = await resolverOrg(
      clienteFalso({ memberships: [PERTENENCIA, NO_HAY_FILA], temporary_elevations: [SIN_ELEVACION] }),
      'u1',
    );
    expect(r.resuelta).toBe(false);
    if (!r.resuelta) expect(r.motivo).toBe('sin_organizacion');
  });

  it('la elevación que falla DEGRADA, no aborta: se conserva el rol nativo', async () => {
    const r = await resolverOrg(
      clienteFalso({
        memberships: [PERTENENCIA, ROL_MIEMBRO],
        temporary_elevations: [{ data: null, error: { message: 'timeout' } }],
      }),
      'u1',
    );
    expect(r.resuelta).toBe(true);
    if (r.resuelta) {
      expect(r.org.role).toBe('member');
      expect(r.org.elevationActive).toBe(false);
    }
  });

  it('CONTROL POSITIVO de la elevación: cuando SÍ hay, el rol sube a admin', async () => {
    const r = await resolverOrg(
      clienteFalso({
        memberships: [PERTENENCIA, ROL_MIEMBRO],
        temporary_elevations: [CON_ELEVACION],
      }),
      'u1',
    );
    expect(r.resuelta).toBe(true);
    if (r.resuelta) {
      expect(r.org.role).toBe('admin');
      expect(r.org.nativeRole).toBe('member');
      expect(r.org.elevationActive).toBe(true);
    }
  });

  it('is_owner manda sobre el rol nativo', async () => {
    const r = await resolverOrg(
      clienteFalso({ memberships: [PERTENENCIA, ROL_DUENO], temporary_elevations: [SIN_ELEVACION] }),
      'u1',
    );
    expect(r.resuelta).toBe(true);
    if (r.resuelta) {
      expect(r.org.role).toBe('admin');
      expect(r.org.nativeRole).toBe('member');
      expect(r.org.isOwner).toBe(true);
    }
  });
});

describe('getEffectiveRole — su null sigue estando bien', () => {
  it('devuelve el rol cuando la consulta va bien', async () => {
    const r = await getEffectiveRole(
      clienteFalso({ memberships: [ROL_MIEMBRO], temporary_elevations: [SIN_ELEVACION] }),
      'u1',
      'org-1',
    );
    expect(r?.effectiveRole).toBe('member');
  });

  it('devuelve null ante un fallo, y su llamador lo lee como «member» — degrada', async () => {
    const r = await getEffectiveRole(clienteFalso({ memberships: [BASE_CAIDA] }), 'u1', 'org-1');
    expect(r).toBeNull();
  });
});
