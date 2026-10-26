import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_SEG_01_las_mediciones_en_csv.sql (26/10/2026), en PGlite. Tres análisis del piloto —uno con un
 * jsonb de más de 200.000 caracteres y su registro por llamada, uno sin análisis, uno con acentos y comillas— y uno
 * de otra organización. El seguro tiene que sacar las tres filas enteras, con todas sus columnas, en orden, y con
 * las columnas de comprobación bien calculadas. Una base por fichero (protocolo).
 */
// La organización se resuelve por el USUARIO (26/10/2026); USUARIO y ORG son distintos a propósito (ver el inventario).
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const GRANDE = {
  discrepancies: Array.from({ length: 400 }, (_, i) => ({ newDocSays: 'frase número ' + i + ' ' + 'x'.repeat(500), existingDocument: 'CLI-12' })),
  llamadasAlModelo: { juez: [{ inputTokens: 1234, outputTokens: 56 }] },
};
const ACENTOS = { discrepancies: [{ newDocSays: 'El «Coordinador» de Calidad dice "sí" y ñ' }] };
const COLUMNAS = ['id', 'org_id', 'user_id', 'document_name', 'analysis_type', 'contradictions_found', 'created_at',
  'document_id', 'storage_path', 'analysis', 'pipeline_counters', 'involved_documents'];

let db: PGlite;
let filas: Record<string, unknown>[] = [];
const sql = () => readFileSync('SQL_SEG_01_las_mediciones_en_csv.sql', 'utf8').replaceAll('public.', '');
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE analysis_results (id uuid, org_id text, user_id uuid, document_name text, analysis_type text,
      contradictions_found int, created_at timestamptz, document_id uuid, storage_path text, analysis jsonb,
      pipeline_counters jsonb, involved_documents jsonb);
    CREATE TABLE memberships (user_id uuid, org_id uuid);
    CREATE TABLE organizations (id uuid, name text);
    CREATE TABLE documents (id uuid, org_id text);`);
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query('INSERT INTO documents VALUES ($1, $2), ($3, $2)', ['00000000-0000-0000-0000-0000000000e1', ORG, '00000000-0000-0000-0000-0000000000e2']);
  const fila = (id: string, org: string, cuando: string, nombre: string, analisis: unknown, contadores: unknown) =>
    db.query('INSERT INTO analysis_results VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [id, org, '00000000-0000-0000-0000-0000000000aa', nombre, 'quick', 2, cuando, null, 'ruta/' + nombre,
       analisis, contadores, [{ name: 'CLI-12' }]]);
  // insertadas fuera de orden: la consulta tiene que ordenarlas por fecha
  await fila('00000000-0000-0000-0000-000000000003', ORG, '2026-10-24T15:30:00Z', 'NOR-11_x.docx', ACENTOS, { 'juez.citas_recompuestas': 0 });
  await fila('00000000-0000-0000-0000-000000000001', ORG, '2026-08-01T07:00:00Z', 'NOR-10_x.docx', GRANDE, { 'otro.contador': 5 });
  await fila('00000000-0000-0000-0000-000000000002', ORG, '2026-09-15T07:00:00Z', 'OPE-11_x.xlsx', null, null);
  await fila('00000000-0000-0000-0000-000000000009', 'otra', '2026-09-01T07:00:00Z', 'NOR-10_x.docx', GRANDE, {});
  filas = (await db.query<Record<string, unknown>>(sql())).rows;
}, 120_000);
afterAll(async () => { await db.close(); });

describe('SQL_SEG_01, el seguro de las mediciones', () => {
  it('LA ORGANIZACIÓN LEÍDA va en TODAS las filas: la del usuario, con su nombre y sus documentos', () => {
    for (const f of filas) expect(f.organizacion_leida).toBe('organización leída: ' + ORG + ' · «Mi workspace» · 2 documentos');
  });

  it('SIN PERTENENCIA, O CON DOS: UNA fila que lo grita y nada más, nunca cero filas', async () => {
    for (const n of [0, 2]) {
      await db.exec('DELETE FROM memberships');
      if (n === 2) await db.query('INSERT INTO memberships VALUES ($1, $2), ($1, $3)', [USUARIO, ORG, '99999999-9999-9999-9999-999999999999']);
      try {
        const f = (await db.query<Record<string, unknown>>(sql())).rows;
        expect(f).toHaveLength(1);
        expect(f[0].organizacion_leida).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
          ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
        expect(f[0].id).toBeNull();
        expect(Number(f[0].total_filas)).toBe(0);
        expect(f[0].n).toBeNull();
      } finally {
        await db.exec('DELETE FROM memberships');
        await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
      }
    }
  });

  it('las tres filas del piloto y ninguna más, en orden de fecha, con n y total_filas para comprobar la descarga', () => {
    expect(filas.map(f => f.id)).toEqual(['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003']);
    expect(filas.map(f => Number(f.n))).toEqual([1, 2, 3]);
    expect(filas.map(f => Number(f.total_filas))).toEqual([3, 3, 3]);
    expect(filas.map(f => f.fecha_madrid)).toEqual(['2026-08-01 09:00:00', '2026-09-15 09:00:00', '2026-10-24 17:30:00']);
  });

  it('TODAS las columnas de la fila salen, y los jsonb salen enteros, el grande incluido', () => {
    for (const f of filas) for (const c of COLUMNAS) expect(Object.keys(f)).toContain(c);
    expect(filas[0].analysis).toEqual(GRANDE);
    expect(filas[0].pipeline_counters).toEqual({ 'otro.contador': 5 });
    expect(filas[2].analysis).toEqual(ACENTOS);
    expect(filas[1].analysis).toBeNull();
  });

  it('LAS COLUMNAS DE COMPROBACIÓN: los caracteres y el md5 son los del jsonb entero, y el registro por llamada se ve', async () => {
    const texto = (await db.query<{ t: string }>("SELECT analysis::text AS t FROM analysis_results WHERE id = '00000000-0000-0000-0000-000000000001'")).rows[0].t;
    expect(texto.length).toBeGreaterThan(200_000);
    expect(Number(filas[0].caracteres_del_analisis)).toBe(texto.length);
    expect(filas[0].huella_del_analisis).toBe(createHash('md5').update(texto, 'utf8').digest('hex'));
    const cont = (await db.query<{ t: string }>("SELECT pipeline_counters::text AS t FROM analysis_results WHERE id = '00000000-0000-0000-0000-000000000003'")).rows[0].t;
    expect(filas[2].huella_de_los_contadores).toBe(createHash('md5').update(cont, 'utf8').digest('hex'));
    expect(filas.map(f => f.lleva_registro_por_llamada)).toEqual([true, null, false]);
    expect(filas[1].huella_del_analisis).toBeNull();
  });
});
