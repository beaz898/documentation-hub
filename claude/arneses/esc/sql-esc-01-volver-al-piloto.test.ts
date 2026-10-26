import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_ESC_01_volver_a_la_organizacion_del_piloto.sql (26/10/2026), la primera escritura en la base del
 * proyecto. En PGlite: el piloto purgado, la organización nueva del director, otro usuario con su propia organización
 * cancelada (ruido que no se puede tocar). El camino bueno escribe las dos cosas y sólo esas; cada guarda, rota por
 * separado, impide escribir nada y se nombra. Una base por fichero, vaciada entre casos (protocolo).
 */
const PILOTO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const NUEVA = '00000000-0000-0000-0000-00000000aaaa';
const AJENA = '00000000-0000-0000-0000-00000000bbbb';
const DIRECTOR = '00000000-0000-0000-0000-0000000000d1';
const OTRO = '00000000-0000-0000-0000-0000000000d2';
const CORREO = 'Director@Ejemplo.test';

interface Opciones { sinPurga?: boolean; documentosEnLaNueva?: boolean; pilotoConMiembro?: boolean; dosMembresias?: boolean }
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid, email text, created_at timestamptz);
    CREATE TABLE organizations (id uuid, name text, plan text, credits_remaining int, created_at timestamptz,
      canceled_at timestamptz, grace_period_ends_at timestamptz, purged_at timestamptz);
    CREATE TABLE memberships (id uuid DEFAULT gen_random_uuid(), org_id uuid, user_id uuid, role text, is_owner boolean,
      UNIQUE (org_id, user_id));
    CREATE TABLE documents (id uuid DEFAULT gen_random_uuid(), org_id text, name text);`);
}, 120_000);
afterAll(async () => { await db.close(); });

async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM auth.users; DELETE FROM organizations; DELETE FROM memberships; DELETE FROM documents;');
  await db.query(`INSERT INTO auth.users VALUES ($1,'director@ejemplo.test','2026-05-01T08:00:00Z'),($2,'otro@ejemplo.test','2026-05-02T08:00:00Z')`, [DIRECTOR, OTRO]);
  await db.query(`INSERT INTO organizations VALUES
    ($1,'Workspace principal','business_plus',4942,'2026-05-01T08:00:00Z','2026-07-27T12:12:00Z','2026-10-25T12:12:00Z',$4),
    ($2,'Mi workspace','free',50,'2026-10-26T07:00:00Z',NULL,NULL,NULL),
    ($3,'Ajena','pro',100,'2026-06-01T08:00:00Z','2026-07-01T08:00:00Z','2026-09-29T08:00:00Z','2026-09-29T14:00:00Z')`,
    [PILOTO, NUEVA, AJENA, o.sinPurga ? null : '2026-10-25T17:11:00Z']);
  await db.query(`INSERT INTO memberships (org_id, user_id, role, is_owner) VALUES ($1,$2,'admin',true),($3,$4,'admin',true)`, [NUEVA, DIRECTOR, AJENA, OTRO]);
  if (o.dosMembresias) await db.query(`INSERT INTO memberships (org_id, user_id, role, is_owner) VALUES ($1,$2,'member',false)`, [AJENA, DIRECTOR]);
  if (o.pilotoConMiembro) await db.query(`INSERT INTO memberships (org_id, user_id, role, is_owner) VALUES ($1,$2,'member',false)`, [PILOTO, OTRO]);
  if (o.documentosEnLaNueva) await db.query(`INSERT INTO documents (org_id, name) VALUES ($1,'NOR-10_x.docx')`, [NUEVA]);
}
function bloques(correo: string | null): [string, string] {
  let t = readFileSync('SQL_ESC_01_volver_a_la_organizacion_del_piloto.sql', 'utf8').replaceAll('public.', '');
  if (correo !== null) t = t.replaceAll("lower(trim(''))", "lower(trim('" + correo + "'))");
  const partes = t.split('-- ══ ESC-01 · ').slice(1).map(x => '-- ' + x);
  return [partes[0], partes[1]];
}
const estado = async (correo: string | null = CORREO) => (await db.query<{ estado: string }>(bloques(correo)[0])).rows.map(r => r.estado);
const escribir = async (correo: string | null = CORREO) => (await db.query<{ resultado: string }>(bloques(correo)[1])).rows[0].resultado;
const foto = async () => ({
  orgs: (await db.query<Record<string, unknown>>('SELECT * FROM organizations ORDER BY id')).rows,
  miembros: (await db.query<Record<string, unknown>>('SELECT org_id, user_id, role, is_owner FROM memberships ORDER BY user_id, org_id')).rows,
  docs: (await db.query<Record<string, unknown>>('SELECT org_id, name FROM documents ORDER BY name')).rows,
});

describe('SQL_ESC_01, volver a la organización del piloto', () => {
  it('EL CAMINO BUENO: mueve la membresía y vacía la cancelación del piloto, y NADA MÁS', async () => {
    await sembrar();
    const antes = await foto();
    expect(await escribir()).toBe('ESCRITO: 1 membresía movida al piloto · 1 organización con la cancelación vaciada. Ahora, el bloque 1 otra vez.');
    const despues = await foto();
    // la membresía del director es ahora del piloto, con su rol y su is_owner
    expect(despues.miembros).toContainEqual({ org_id: PILOTO, user_id: DIRECTOR, role: 'admin', is_owner: true });
    expect(despues.miembros.filter(m => m.user_id === DIRECTOR)).toHaveLength(1);
    // el piloto: cancelación y gracia a NULL; purged_at, plan y créditos intactos
    const piloto = (o: typeof despues) => o.orgs.find(x => x.id === PILOTO) as Record<string, unknown>;
    expect(piloto(despues).canceled_at).toBeNull();
    expect(piloto(despues).grace_period_ends_at).toBeNull();
    for (const c of ['purged_at', 'plan', 'credits_remaining', 'name', 'created_at']) expect(piloto(despues)[c]).toEqual(piloto(antes)[c]);
    // la nueva, la ajena y la membresía del otro, intactas
    expect(despues.orgs.filter(x => x.id !== PILOTO)).toEqual(antes.orgs.filter(x => x.id !== PILOTO));
    expect(despues.miembros.filter(m => m.user_id === OTRO)).toEqual(antes.miembros.filter(m => m.user_id === OTRO));
    expect(despues.docs).toEqual(antes.docs);
  });

  it('EL ESTADO, antes y después: el usuario, la membresía, el piloto, y lo que haría el worker y el cobro', async () => {
    await sembrar();
    const a = await estado();
    expect(a[0]).toBe('usuario: ' + DIRECTOR + ' · creado 01/05/2026 10:00');
    expect(a[1]).toBe('membresía: org ' + NUEVA + ' (Mi workspace, free, 50 créditos, creada 26/10/2026 08:00, 0 documentos) · rol admin');
    expect(a[2]).toBe('piloto: plan business_plus · créditos 4942 · cancelada 27/07/2026 14:12 · fin de la gracia 25/10/2026 13:12 · purgada 25/10/2026 18:11 · miembros 0');
    expect(a[3]).toBe('el worker purgaría el piloto: no · los créditos se negarían (subscription_expired): SÍ');
    await escribir();
    const d = await estado();
    expect(d[1]).toBe('membresía: org ' + PILOTO + ' (Workspace principal, business_plus, 4942 créditos, creada 01/05/2026 10:00, 0 documentos) · rol admin · ES EL PILOTO');
    expect(d[2]).toBe('piloto: plan business_plus · créditos 4942 · cancelada NULL · fin de la gracia NULL · purgada 25/10/2026 18:11 · miembros 1');
    expect(d[3]).toBe('el worker purgaría el piloto: no · los créditos se negarían (subscription_expired): no');
  });

  it('EL AVISO DEL WORKER PUEDE DISPARAR: sin purged_at y con la gracia pasada, dice SÍ', async () => {
    await sembrar({ sinPurga: true });
    expect((await estado())[3]).toBe('el worker purgaría el piloto: ⚠️ SÍ, EN MENOS DE SEIS HORAS · los créditos se negarían (subscription_expired): SÍ');
  });

  it('LAS GUARDAS: cada una, rota sola, impide escribir NADA y se nombra', async () => {
    const casos: [Opciones, string | null, string][] = [
      [{}, null, 'el correo no es de exactamente un usuario, el usuario no tiene exactamente una membresía'],
      [{}, 'nadie@ejemplo.test', 'el correo no es de exactamente un usuario, el usuario no tiene exactamente una membresía'],
      [{ dosMembresias: true }, CORREO, 'el usuario no tiene exactamente una membresía'],
      [{ documentosEnLaNueva: true }, CORREO, 'la organización nueva tiene documentos'],
      [{ sinPurga: true }, CORREO, 'el piloto no existe o no tiene purged_at'],
      [{ pilotoConMiembro: true }, CORREO, 'el piloto ya tiene miembros'],
    ];
    for (const [o, correo, motivo] of casos) {
      await sembrar(o);
      const antes = await foto();
      const r = await escribir(correo);
      expect(r).toBe('NO SE ESCRIBIÓ NADA. Falla: ' + motivo);
      expect(await foto()).toEqual(antes);
    }
  });

  it('DOS VECES: la segunda no escribe nada, porque la membresía ya es del piloto', async () => {
    await sembrar();
    await escribir();
    const antes = await foto();
    expect(await escribir()).toBe('NO SE ESCRIBIÓ NADA. Falla: la membresía ya es del piloto, el piloto ya tiene miembros');
    expect(await foto()).toEqual(antes);
  });
});
