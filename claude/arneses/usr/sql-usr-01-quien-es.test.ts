import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_USR_01_quien_es_3c628122.sql (26/10/2026), en PGlite: el usuario buscado entre otros dos, y el caso
 * en que no existe, que no puede salir vacío. Una base por fichero (protocolo).
 */
const BUSCADO = '3c628122-e668-4ca6-a5eb-8f751ba52a41';
type Fila = Record<string, unknown>;
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz);`);
}, 120_000);
afterAll(async () => { await db.close(); });

async function correr(conElBuscado: boolean): Promise<Fila[]> {
  await db.exec('DELETE FROM auth.users');
  await db.query(`INSERT INTO auth.users VALUES ('a9625e93-af2a-4416-a465-5c2fa2a25bdf','director@ejemplo.test','2026-04-03T08:00:00Z','2026-10-26T07:00:00Z'),
    ('00000000-0000-0000-0000-0000000000d2','otro@ejemplo.test','2026-05-02T08:00:00Z',NULL)`);
  if (conElBuscado)
    await db.query(`INSERT INTO auth.users VALUES ($1,'segunda@ejemplo.test','2026-07-08T09:30:00Z','2026-09-11T10:15:00Z')`, [BUSCADO]);
  return (await db.query<Fila>(readFileSync('SQL_USR_01_quien_es_3c628122.sql', 'utf8'))).rows;
}

describe('SQL_USR_01, quién es 3c628122', () => {
  it('UNA fila con su correo, su alta y su última sesión, y la de nadie más', async () => {
    expect(await correr(true)).toEqual([{ usuario: BUSCADO, correo: 'segunda@ejemplo.test', alta: '08/07/2026 11:30', ultima_sesion: '11/09/2026 12:15' }]);
  });

  it('si no existe, lo dice en una fila: nunca un resultado vacío', async () => {
    expect(await correr(false)).toEqual([{ usuario: BUSCADO, correo: 'NO EXISTE en auth.users', alta: null, ultima_sesion: null }]);
  });
});
