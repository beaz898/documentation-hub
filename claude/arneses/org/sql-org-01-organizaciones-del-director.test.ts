import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_ORG_01_las_organizaciones_del_director.sql (26/10/2026), en PGlite. El director con dos pertenencias
 * (el piloto purgado y la organización nueva con la suscripción), otro usuario con la suya (ruido), y los dos casos que
 * no pueden salir vacíos: un correo sin usuario y un usuario sin pertenencias. Una base por fichero (protocolo).
 */
const PILOTO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const NUEVA = '00000000-0000-0000-0000-00000000aaaa';
const AJENA = '00000000-0000-0000-0000-00000000bbbb';
const DIRECTOR = '00000000-0000-0000-0000-0000000000d1';
const OTRO = '00000000-0000-0000-0000-0000000000d2';
const SOLO = '00000000-0000-0000-0000-0000000000d3';

type Fila = Record<string, unknown>;
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid, email text, created_at timestamptz);
    CREATE TABLE organizations (id uuid, name text, plan text, credits_remaining int, credits_extra int, created_at timestamptz,
      stripe_subscription_id text, canceled_at timestamptz, purged_at timestamptz);
    CREATE TABLE memberships (id uuid DEFAULT gen_random_uuid(), org_id uuid, user_id uuid, role text);`);
  await db.query(`INSERT INTO auth.users VALUES ($1,'director@ejemplo.test','2026-04-03T08:00:00Z'),
    ($2,'otro@ejemplo.test','2026-05-02T08:00:00Z'),($3,'solo@ejemplo.test','2026-06-02T08:00:00Z')`, [DIRECTOR, OTRO, SOLO]);
  await db.query(`INSERT INTO organizations VALUES
    ($1,'Workspace principal','business_plus',4942,0,'2026-04-03T08:00:00Z',NULL,'2026-07-27T12:12:00Z','2026-10-25T17:11:00Z'),
    ($2,'Mi workspace','enterprise',10000,0,'2026-10-26T07:00:00Z','sub_x',NULL,NULL),
    ($3,'Ajena','pro',100,5,'2026-06-01T08:00:00Z','sub_y',NULL,NULL)`, [PILOTO, NUEVA, AJENA]);
  await db.query(`INSERT INTO memberships (org_id, user_id, role) VALUES ($1,$2,'admin'),($3,$2,'admin'),($4,$5,'admin')`,
    [NUEVA, DIRECTOR, PILOTO, AJENA, OTRO]);
}, 120_000);
afterAll(async () => { await db.close(); });

const correr = async (correo: string | null): Promise<Fila[]> => {
  let t = readFileSync('SQL_ORG_01_las_organizaciones_del_director.sql', 'utf8').replaceAll('public.', '');
  if (correo !== null) t = t.replaceAll("lower(trim(''))", "lower(trim('" + correo + "'))");
  return (await db.query<Fila>(t)).rows;
};

describe('SQL_ORG_01, las organizaciones del director', () => {
  it('las dos pertenencias del director y ninguna más, con todo lo que hace falta de cada organización', async () => {
    const f = await correr('  Director@Ejemplo.TEST ');
    expect(f).toHaveLength(2);
    expect(f.map(x => x.organizacion)).toEqual([PILOTO, NUEVA].sort());
    for (const x of f) {
      expect(x.que).toBe('pertenencia');
      expect(x.usuario).toBe(DIRECTOR);
      expect(x.usuario_alta).toBe('03/04/2026 10:00');
    }
    const nueva = f.find(x => x.organizacion === NUEVA)!;
    expect(nueva).toMatchObject({ nombre: 'Mi workspace', plan: 'enterprise', creditos: 10000, creditos_extra: 0,
      organizacion_alta: '26/10/2026 08:00', suscripcion_de_stripe_guardada: true, cancelada: null, purgada: null, rol: 'admin' });
    const piloto = f.find(x => x.organizacion === PILOTO)!;
    expect(piloto).toMatchObject({ nombre: 'Workspace principal', plan: 'business_plus', creditos: 4942,
      suscripcion_de_stripe_guardada: false, cancelada: '27/07/2026 14:12', purgada: '25/10/2026 18:11' });
  });

  it('un correo sin usuario, o la constante sin rellenar, dice NINGÚN USUARIO y no sale vacía', async () => {
    for (const correo of ['nadie@ejemplo.test', null]) {
      const f = await correr(correo);
      expect(f).toHaveLength(1);
      expect(f[0].que).toBe('NINGÚN USUARIO con ese correo');
    }
  });

  it('EL CASO DECISIVO DEL lower() DEL LADO GUARDADO: un correo guardado con mayúsculas se encuentra igual', async () => {
    // Auth suele guardarlos en minúsculas; esto vigila que la consulta no dependa de ello
    await db.query(`UPDATE auth.users SET email = 'Director@Ejemplo.TEST' WHERE id = $1`, [DIRECTOR]);
    try {
      expect(await correr('director@ejemplo.test')).toHaveLength(2);
    } finally {
      await db.query(`UPDATE auth.users SET email = 'director@ejemplo.test' WHERE id = $1`, [DIRECTOR]);
    }
  });

  it('un usuario sin pertenencias lo dice, con su id', async () => {
    const f = await correr('solo@ejemplo.test');
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ que: 'el usuario NO TIENE NINGUNA pertenencia', usuario: SOLO });
  });
});
