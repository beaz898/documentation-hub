import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_SEG_02_las_tablas_de_la_medida.sql (26/10/2026), en PGlite. Ocho consultas, una por tabla, que se
 * ejecutan de una en una. En cada tabla, dos filas del piloto insertadas al revés de su orden y una de otra
 * organización. Cada consulta tiene que sacar las dos del piloto, enteras, en orden, con n y total_filas, y las
 * huellas de las celdas grandes bien calculadas. Una base por fichero (protocolo).
 */
const ORG = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const OTRA = '99999999-9999-9999-9999-999999999999';
const D1 = '00000000-0000-0000-0000-0000000000d1';
const D2 = '00000000-0000-0000-0000-0000000000d2';
const LARGO = 'Texto «largo» con ñ y "comillas". '.repeat(8000);
const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex');

let db: PGlite;
let consultas: string[] = [];
const resultados: Record<string, Record<string, unknown>[]> = {};
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE documents (id uuid, org_id text, name text, created_at timestamptz, full_text text);
    CREATE TABLE document_chunks (id uuid DEFAULT gen_random_uuid(), document_id uuid, org_id text, generation int, chunk_index int, chunk_type text, text text);
    CREATE TABLE document_staged (document_id uuid, org_id text, generation int, full_text text, created_at timestamptz);
    CREATE TABLE analysis_jobs (id uuid, org_id uuid, status text, document_name text, document_text text, result jsonb, created_at timestamptz);
    CREATE TABLE finding_dismissals (id uuid, org_id text, fingerprint text, kind text, created_at timestamptz);
    CREATE TABLE llm_usage (id uuid, created_at timestamptz, org_id uuid, operation text, model text, input_tokens int);
    CREATE TABLE usage_logs (id uuid, created_at timestamptz, org_id text, endpoint text, user_query text);
    CREATE TABLE organizations (id uuid, name text, plan text, grace_period_ends_at timestamptz);`);
  // documents: la segunda en fecha se inserta primero
  await db.query('INSERT INTO documents VALUES ($1,$2,$3,$4,$5),($6,$2,$7,$8,$9),($10,$11,$3,$4,$5)',
    [D2, ORG, 'NOR-11_x.docx', '2026-10-02T08:00:00Z', 'corto', D1, 'NOR-10_x.docx', '2026-10-01T08:00:00Z', LARGO,
     '00000000-0000-0000-0000-0000000000d9', OTRA]);
  await db.query(`INSERT INTO document_chunks (document_id, org_id, generation, chunk_index, chunk_type, text) VALUES
    ($1,$3,1,1,'text','segundo trozo'),($1,$3,1,0,'text',$4),($2,$5,1,0,'text','ruido')`, [D1, D2, ORG, LARGO, OTRA]);
  await db.query(`INSERT INTO document_staged VALUES ($1,$3,2,'staged 2','2026-10-05T08:00:00Z'),
    ($2,$3,2,$4,'2026-10-04T08:00:00Z'),($5,$6,2,'ruido','2026-10-04T08:00:00Z')`,
    [D1, D2, ORG, LARGO, '00000000-0000-0000-0000-0000000000d9', OTRA]);
  const resultado = { discrepancies: [{ newDocSays: LARGO.slice(0, 5000) }] };
  await db.query(`INSERT INTO analysis_jobs VALUES ('00000000-0000-0000-0000-0000000000a2',$1,'completed','NOR-11_x.docx','dos',NULL,'2026-10-07T08:00:00Z'),
    ('00000000-0000-0000-0000-0000000000a1',$1,'completed','NOR-10_x.docx',$3,$4,'2026-10-06T08:00:00Z'),
    ('00000000-0000-0000-0000-0000000000a9',$2,'completed','NOR-10_x.docx','ruido',$4,'2026-10-06T08:00:00Z')`,
    [ORG, OTRA, LARGO, resultado]);
  await db.query(`INSERT INTO finding_dismissals VALUES ('00000000-0000-0000-0000-0000000000f2',$1,'h2','prosa','2026-10-09T08:00:00Z'),
    ('00000000-0000-0000-0000-0000000000f1',$1,'h1','tabular','2026-10-08T08:00:00Z'),
    ('00000000-0000-0000-0000-0000000000f9',$2,'h9','prosa','2026-10-08T08:00:00Z')`, [ORG, OTRA]);
  await db.query(`INSERT INTO llm_usage VALUES ('00000000-0000-0000-0000-0000000000b2','2026-10-11T08:00:00Z',$1,'analyze_quick','haiku',2),
    ('00000000-0000-0000-0000-0000000000b1','2026-10-10T08:00:00Z',$1,'analyze_quick','haiku',1),
    ('00000000-0000-0000-0000-0000000000b9','2026-10-10T08:00:00Z',$2,'chat','haiku',9)`, [ORG, OTRA]);
  await db.query(`INSERT INTO usage_logs VALUES ('00000000-0000-0000-0000-0000000000c2','2026-10-13T08:00:00Z',$1,'/api/ask','segunda'),
    ('00000000-0000-0000-0000-0000000000c1','2026-10-12T08:00:00Z',$1,'/api/analyze-v2','primera'),
    ('00000000-0000-0000-0000-0000000000c9','2026-10-12T08:00:00Z',$2,'/api/ask','ruido')`, [ORG, OTRA]);
  await db.query(`INSERT INTO organizations VALUES ($1,'Workspace principal','free','2027-01-24T00:00:00Z'),($2,'Mi workspace','pro',NULL)`, [ORG, OTRA]);

  const texto = readFileSync('SQL_SEG_02_las_tablas_de_la_medida.sql', 'utf8').replaceAll('public.', '');
  consultas = texto.split('-- ══ SEG-02 · ').slice(1);
  for (const c of consultas) {
    const tabla = /^\d+ · (\w+)/.exec(c)![1];
    // la marca se partió por la mitad: el resto de su línea vuelve a ser comentario
    resultados[tabla] = (await db.query<Record<string, unknown>>('-- ' + c)).rows;
  }
}, 120_000);
afterAll(async () => { await db.close(); });

const ids = (t: string, campo = 'id') => resultados[t].map(f => f[campo]);
const cuadre = (t: string) => {
  expect(resultados[t].map(f => Number(f.n))).toEqual([1, 2]);
  expect(resultados[t].map(f => Number(f.total_filas))).toEqual([2, 2]);
};

describe('SQL_SEG_02, el segundo seguro', () => {
  it('son ocho consultas, una por tabla, en el orden de la cabecera', () => {
    expect(Object.keys(resultados)).toEqual(['documents', 'document_chunks', 'document_staged', 'analysis_jobs',
      'finding_dismissals', 'llm_usage', 'usage_logs', 'organizations']);
  });

  it('documents: las dos del piloto, en orden de fecha, con el full_text entero y su huella', () => {
    cuadre('documents');
    expect(ids('documents')).toEqual([D1, D2]);
    expect(resultados.documents[0].full_text).toBe(LARGO);
    expect(Number(resultados.documents[0].caracteres_del_texto)).toBe(LARGO.length);
    expect(resultados.documents[0].huella_del_texto).toBe(md5(LARGO));
    expect(resultados.documents[0].fecha_madrid).toBe('2026-10-01 10:00:00');
  });

  it('document_chunks: por documento, generación e índice, con el texto entero y su huella', () => {
    cuadre('document_chunks');
    expect(resultados.document_chunks.map(f => f.chunk_index)).toEqual([0, 1]);
    expect(resultados.document_chunks[0].text).toBe(LARGO);
    expect(resultados.document_chunks[0].huella_del_trozo).toBe(md5(LARGO));
    expect(Number(resultados.document_chunks[1].caracteres_del_trozo)).toBe('segundo trozo'.length);
  });

  it('document_staged: en orden de fecha, con el texto y su huella', () => {
    cuadre('document_staged');
    expect(ids('document_staged', 'document_id')).toEqual([D2, D1]);
    expect(resultados.document_staged[0].huella_del_texto).toBe(md5(LARGO));
  });

  it('analysis_jobs: la organización es uuid y casa; huellas del resultado y del documento', async () => {
    cuadre('analysis_jobs');
    expect(ids('analysis_jobs')).toEqual(['00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2']);
    const r = (await db.query<{ t: string }>("SELECT result::text AS t FROM analysis_jobs WHERE id = '00000000-0000-0000-0000-0000000000a1'")).rows[0].t;
    expect(resultados.analysis_jobs[0].huella_del_resultado).toBe(md5(r));
    expect(Number(resultados.analysis_jobs[0].caracteres_del_resultado)).toBe(r.length);
    expect(resultados.analysis_jobs[0].huella_del_documento).toBe(md5(LARGO));
    expect(Number(resultados.analysis_jobs[0].caracteres_del_documento)).toBe(LARGO.length);
    expect(resultados.analysis_jobs[1].huella_del_resultado).toBeNull();
  });

  it('descartes, llm_usage y usage_logs: las dos del piloto en orden de fecha', () => {
    for (const t of ['finding_dismissals', 'llm_usage', 'usage_logs']) cuadre(t);
    expect(ids('finding_dismissals')).toEqual(['00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2']);
    expect(ids('llm_usage')).toEqual(['00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2']);
    expect(resultados.usage_logs.map(f => f.user_query)).toEqual(['primera', 'segunda']);
  });

  it('organizations: sólo la fila del piloto', () => {
    expect(resultados.organizations).toHaveLength(1);
    expect(resultados.organizations[0].id).toBe(ORG);
    expect(Number(resultados.organizations[0].total_filas)).toBe(1);
  });
});
