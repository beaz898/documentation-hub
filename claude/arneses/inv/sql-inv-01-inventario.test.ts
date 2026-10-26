import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_INV_01_inventario_del_corpus.sql (26/10/2026), en PGlite. Un corpus sintético con todo lo que la
 * consulta tiene que separar: un nombre duplicado, un NOR-100 que no es NOR-10, trozos de otra generación, análisis
 * de un documento borrado y sin documento, una conexión de Drive, una lápida, y ruido de otra organización con los
 * mismos nombres. Una base por fichero, vaciada entre casos (protocolo).
 */
// LA ORGANIZACIÓN SE RESUELVE POR EL USUARIO (26/10/2026). USUARIO y ORG tienen que ser DISTINTOS en el arnés: si fueran
// el mismo número —como en la base, por el código de antes del 27/04—, una consulta que volviera a leer el id del
// piloto como organización pasaría sin que nada lo notara.
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const A = '0000000a-0000-0000-0000-000000000000';   // NOR-10, la copia vieja, con dos análisis
const B = '0000000b-0000-0000-0000-000000000000';   // NOR-10, la copia nueva, sin análisis
const C = '0000000c-0000-0000-0000-000000000000';   // CLI-12, de Drive, con trozos y sin análisis
const D = '0000000d-0000-0000-0000-000000000000';   // OPE-15, sin trozos y con un análisis
const E = '0000000e-0000-0000-0000-000000000000';   // NOR-100, no es NOR-10
const BORRADO = '0000000f-0000-0000-0000-000000000000';
const R = '00000001-0000-0000-0000-000000000000';   // ruido: NOR-10 en otra organización

interface Fila { bloque: string; n: number; texto: string }
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE organizations (id uuid, plan text, credits_remaining int, stripe_subscription_id text, canceled_at timestamptz, grace_period_ends_at timestamptz, purged_at timestamptz, name text);
    CREATE TABLE memberships (user_id uuid, org_id uuid);
    CREATE TABLE documents (id uuid, org_id text, name text, source text, analysis_status text, active_generation int, chunk_count int, created_at timestamptz, full_text text);
    CREATE TABLE document_chunks (document_id uuid, generation int, chunk_index int);
    CREATE TABLE analysis_results (org_id text, created_at timestamptz, document_id uuid, document_name text);
    CREATE TABLE drive_connections (org_id text, provider text);
    CREATE TABLE document_tombstones (org_id text, source text, original_name text, excluded_at timestamptz);`);
}, 120_000);
afterAll(async () => { await db.close(); });

async function sembrar(cuenta: 'gracia' | 'sin_gracia' | 'sin_org', pertenencias = 1) {
  await db.exec(`DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM document_chunks; DELETE FROM analysis_results;
                 DELETE FROM drive_connections; DELETE FROM document_tombstones;`);
  if (cuenta !== 'sin_org')
    await db.query(`INSERT INTO organizations VALUES ($1, 'free', 50, NULL, $2, $3, NULL, 'Mi workspace')`,
      [ORG, cuenta === 'gracia' ? '2026-10-20T10:00:00Z' : null,
       cuenta === 'gracia' ? new Date(Date.now() + (30 * 24 + 1) * 3600_000).toISOString() : null]);
  await db.query(`INSERT INTO organizations VALUES ($1, 'pro', 999, 'sub', NULL, NULL, NULL, 'Ajena')`, [OTRA]);
  if (pertenencias >= 1) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (pertenencias >= 2) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  const doc = (id: string, org: string, nombre: string, origen: string | null, gen: number, alta: string, texto: string | null) =>
    db.query('INSERT INTO documents VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, org, nombre, origen, 'analizado', gen, 3, alta, texto]);
  await doc(A, ORG, 'NOR-10_manual.docx', 'manual', 2, '2026-10-01T08:00:00Z', 'texto');
  await doc(B, ORG, 'NOR-10_manual.docx', null, 1, '2026-10-02T08:00:00Z', 'texto');
  await doc(C, ORG, 'CLI-12_manual.docx', 'google_drive', 1, '2026-10-03T08:00:00Z', 'texto');
  await doc(D, ORG, 'OPE-15_x.txt', 'manual', 1, '2026-10-04T08:00:00Z', null);
  await doc(E, ORG, 'NOR-100_x.docx', 'manual', 1, '2026-10-05T08:00:00Z', 'texto');
  await doc(R, OTRA, 'NOR-10_manual.docx', 'manual', 1, '2026-10-06T08:00:00Z', 'texto');
  // trozos: A tiene 2 de su generación activa (2) y 1 de la vieja; B, C y E uno o dos; D ninguno; el ruido, cinco
  await db.query(`INSERT INTO document_chunks VALUES ($1,2,0),($1,2,1),($1,1,0),($2,1,0),($3,1,0),($3,1,1),($4,1,0),
                  ($5,1,0),($5,1,1),($5,1,2),($5,1,3),($5,1,4)`, [A, B, C, E, R]);
  const an = (org: string, cuando: string, id: string | null, nombre: string) =>
    db.query('INSERT INTO analysis_results VALUES ($1,$2,$3,$4)', [org, cuando, id, nombre]);
  await an(ORG, '2026-09-15T07:00:00Z', A, 'NOR-10_manual.docx');
  await an(ORG, '2026-10-24T15:30:00Z', A, 'NOR-10_manual.docx');
  await an(ORG, '2026-10-10T09:00:00Z', D, 'OPE-15_x.txt');
  await an(ORG, '2026-10-11T09:00:00Z', BORRADO, 'CLI-20_borrado.docx');
  await an(ORG, '2026-10-12T09:00:00Z', BORRADO, 'CLI-20_borrado.docx');
  await an(ORG, '2026-10-13T09:00:00Z', null, 'subido_en_el_chat.docx');
  // ruido: análisis de otra organización, uno de ellos sobre un documento del piloto y otro fuera de fechas
  await an(OTRA, '2025-01-01T00:00:00Z', A, 'NOR-10_manual.docx');
  await an(OTRA, '2027-01-01T00:00:00Z', R, 'NOR-10_manual.docx');
  await db.query(`INSERT INTO drive_connections VALUES ($1,'google_drive'),($2,'onedrive')`, [ORG, OTRA]);
  await db.query(`INSERT INTO document_tombstones VALUES ($1,'google_drive','RRHH-03_x.docx','2026-10-14T09:00:00Z'),
                  ($2,'google_drive','ruido.docx','2026-10-14T09:00:00Z')`, [ORG, OTRA]);
}
async function correr(cuenta: 'gracia' | 'sin_gracia' | 'sin_org', pertenencias = 1): Promise<Fila[]> {
  await sembrar(cuenta, pertenencias);
  const sql = readFileSync('SQL_INV_01_inventario_del_corpus.sql', 'utf8').replaceAll('public.', '');
  return (await db.query<Fila>(sql)).rows;
}
// la fila de la organización leída (0 · cuenta, n = 0) tiene sus propios casos, abajo; los bloques se leen sin ella
const de = (f: Fila[], bloque: string) => f.filter(x => x.bloque.startsWith(bloque) && !(x.bloque === '0 · cuenta' && Number(x.n) === 0)).map(x => x.texto);
const leida = (f: Fila[]) => f.find(x => x.bloque === '0 · cuenta' && Number(x.n) === 0)?.texto;

describe('SQL_INV_01, el inventario del corpus del piloto', () => {
  it('LA ORGANIZACIÓN LEÍDA va primera: la del usuario, con su nombre y sus documentos', async () => {
    const f = await correr('gracia');
    expect(f[0]).toMatchObject({ bloque: '0 · cuenta', texto: 'organización leída: ' + ORG + ' · «Mi workspace» · 5 documentos' });
  }, 60_000);

  it('SIN PERTENENCIA, O CON DOS, LO GRITA en la primera fila, y no lee la organización de nadie', async () => {
    for (const n of [0, 2]) {
      const f = await correr('gracia', n);
      expect(leida(f)).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
        ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
      expect(de(f, '1 ·')[0]).toBe('documentos en el corpus: 0 (por origen: ninguno)');
    }
  }, 60_000);

  it('LA CUENTA: plan, cancelación, purga programada con sus días, y la conexión de Drive del piloto', async () => {
    const c = de(await correr('gracia'), '0 ·');
    expect(c[0]).toMatch(/^reloj de la base: \d\d\/\d\d\/\d{4} \d\d:\d\d Madrid$/);
    expect(c[1]).toBe('plan: free · suscripción de Stripe guardada: NINGUNA · créditos: 50');
    expect(c[2]).toMatch(/^cancelada: 20\/10\/2026 12:00 · fin de la gracia: \d\d\/\d\d\/\d{4} \d\d:\d\d · purgada: no$/);
    expect(c[3]).toBe('⚠️ PURGA PROGRAMADA: pasada esa fecha el worker borra TODO (documentos, vectores, análisis, usuario). Quedan 30 días');
    expect(c[4]).toBe('conexión de Drive guardada: google_drive');
  }, 60_000);

  it('sin gracia, lo dice; sin la organización, NO APLICA y no inventa la cuenta', async () => {
    expect(de(await correr('sin_gracia'), '0 ·')[3]).toBe('sin purga programada (fin de la gracia vacío)');
    const c = de(await correr('sin_org'), '0 ·');
    expect(c[1]).toBe('ORGANIZACIÓN NO ENCONTRADA: todo lo que sigue es NO APLICA');
    expect(c).toHaveLength(3);
  }, 60_000);

  it('LOS DOCUMENTOS: sólo los del piloto, con los trozos de su generación activa y sus análisis', async () => {
    const d = de(await correr('gracia'), '1 ·');
    expect(d[0]).toBe('documentos en el corpus: 5 (por origen: google_drive 1, manual 4)');
    expect(d).toHaveLength(6);
    expect(d[1]).toBe('CLI-12_manual.docx · id ' + C + ' · origen google_drive · estado analizado · generación activa 1 · trozos guardados 2 · chunk_count de la fila 3 · texto completo sí · análisis 0 · alta 03/10/2026 10:00');
    expect(d[3]).toContain('NOR-10_manual.docx · id ' + A + ' · origen manual · estado analizado · generación activa 2 · trozos guardados 2 (más 1 de otras generaciones)');
    expect(d[3]).toContain('· análisis 2 · alta 01/10/2026 10:00');
    expect(d[4]).toContain('id ' + B + ' · origen manual');
    expect(d[4]).toContain('trozos guardados 1 · chunk_count');
    // NOR-100 va antes que NOR-10_ por orden de caracteres: el 0 va antes que el guion bajo
    expect(d[2]).toContain('NOR-100_x.docx · id ' + E);
    expect(d[5]).toContain('OPE-15_x.txt · id ' + D);
    expect(d[5]).toContain('trozos guardados 0 · chunk_count de la fila 3 · texto completo NO · análisis 1');
  }, 60_000);

  it('LOS ANÁLISIS: cuántos, de qué fechas, de quién, y el control por los dos caminos', async () => {
    const a = de(await correr('gracia'), '2 ·');
    expect(a[0]).toBe('filas de análisis: 6 · la más antigua: 15/09/2026 09:00 · la más reciente: 24/10/2026 17:30');
    expect(a[1]).toBe('de un documento que sigue en el corpus: 3 · de un documento que YA NO ESTÁ: 2 · sin documento (document_id nulo): 1');
    expect(a[2]).toBe('CONTROL: cuadra (3 por los dos caminos)');
    expect(a[3]).toBe('de un documento que ya no está: CLI-20_borrado.docx · 2 filas · de 11/10/2026 11:00 a 12/10/2026 11:00');
    expect(a).toHaveLength(4);
  }, 60_000);

  it('LOS DUPLICADOS, LOS CRUCES, LAS LÁPIDAS', async () => {
    const f = await correr('gracia');
    expect(de(f, '3 ·')).toEqual([
      'nombres repetidos: 1',
      'NOR-10_manual.docx · 2 copias: ' + A + ' (manual, 2 análisis, alta 01/10/2026 10:00) | ' + B + ' (manual, 0 análisis, alta 02/10/2026 10:00)',
    ]);
    expect(de(f, '4 ·')).toEqual([
      'con trozos y SIN análisis: 3: CLI-12_manual.docx, NOR-100_x.docx, NOR-10_manual.docx',
      'con análisis y SIN trozos guardados: 1: OPE-15_x.txt',
      'sin trozos y sin análisis: 0',
      'análisis cuyo documento ya no está (nombres distintos): 1 · ver el bloque 2',
    ]);
    expect(de(f, '5 ·')).toEqual(['documentos sincronizados excluidos a propósito: 1', 'RRHH-03_x.docx · google_drive · 14/10/2026 11:00']);
  }, 60_000);

  it('LA LISTA DEL DIRECTOR: NOR-100 no es NOR-10, lo que falta dice NO ESTÁ, y lo que sobra se nombra', async () => {
    const l = de(await correr('gracia'), '6 ·');
    expect(l).toHaveLength(11);
    expect(l[0]).toBe('NOR-10 (corpus-pruebas: sí · visto en los logs del 22 y 24/10: sí) → 2 en el corpus: NOR-10_manual.docx [manual, 2 trozos, 2 análisis] | NOR-10_manual.docx [manual, 1 trozos, 0 análisis]');
    expect(l[1]).toBe('NOR-11 (corpus-pruebas: sí · visto en los logs del 22 y 24/10: sí) → NO ESTÁ');
    expect(l[2]).toBe('CLI-12 (corpus-pruebas: sí · visto en los logs del 22 y 24/10: sí) → 1 en el corpus: CLI-12_manual.docx [google_drive, 2 trozos, 0 análisis]');
    expect(l[4]).toBe('CLI-20 (corpus-pruebas: sí · visto en los logs del 22 y 24/10: no) → NO ESTÁ');
    expect(l[8]).toBe('OPE-15 (corpus-pruebas: sí · visto en los logs del 22 y 24/10: no) → 1 en el corpus: OPE-15_x.txt [manual, 0 trozos, 1 análisis]');
    expect(l[10]).toBe('en el corpus y NO en la lista: 1: NOR-100_x.docx');
  }, 60_000);
});
