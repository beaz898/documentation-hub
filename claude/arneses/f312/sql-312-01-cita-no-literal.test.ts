import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_312_01_la_cita_no_literal.sql (3.1.2, 25/10/2026), en PGlite, con un documento sintético de dos
 * trozos y cuatro citas publicadas: una LITERAL (no debe salir), una con las COMILLAS cambiadas, una con UN
 * CARÁCTER cambiado en medio y una INVENTADA. Cada una tiene que salir con su primera diferencia exacta.
 * Una base por fichero, vaciada entre casos (protocolo).
 */
// La organización se RESUELVE por el USUARIO (26/10/2026). USUARIO y ORG son DISTINTOS a propósito: en la base son el
// mismo número (código de antes del 27/04), y con el mismo número aquí, volver a leer el id del piloto como
// organización pasaría sin que nada lo notara. `pertenencias` es para los casos de la guarda, al final.
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA_ORG = '99999999-9999-9999-9999-999999999999';
let pertenencias = 1;
const DOC = '10101010-1010-1010-1010-101010101010';
const T0 = 'El Director Clínico autoriza cualquier excepción documentada al «protocolo» de esterilización.';
const T1 = 'La responsabilidad última recae siempre sobre esta figura y no es delegable.';
const contra = (newDocSays: string) => ({ newDocSays, existingDocSays: 'x', existingDocument: 'CLI-12_manual.docx', topic: 'tema', severity: 'contradiction' });

interface Fila { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null }
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_id uuid, document_name text, pipeline_counters jsonb, analysis jsonb);
                 CREATE TABLE documents (id uuid, org_id text, name text, active_generation int, full_text text);
                 CREATE TABLE document_chunks (document_id uuid, generation int, chunk_index int, text text);`);
  await db.query('INSERT INTO documents VALUES ($1,$2,$3,1,$4)', [DOC, ORG, 'NOR-10_x.docx', `${T0}\n\n${T1}`]);
  await db.query('INSERT INTO document_chunks VALUES ($1,1,0,$2),($1,1,1,$3)', [DOC, T0, T1]);
}, 120_000);
afterAll(async () => { await db.close(); });
async function correr(citas: string[]): Promise<Fila[]> {
  await db.exec('DELETE FROM analysis_results');
  if (citas.length)
    await db.query('INSERT INTO analysis_results (org_id, created_at, document_id, document_name, pipeline_counters, analysis) VALUES ($1,$2,$3,$4,$5,$6)',
      [ORG, '2026-10-24T17:09:41Z', DOC, 'NOR-10_x.docx', { 'juez.citas_recompuestas': 0, 'juez.citas_rescatadas_quitando_glosa': 0, 'otro.contador': 5 }, { discrepancies: citas.map(contra) }]);
  // ruido, con citas no literales que no tienen que contar: otra organización, otro documento y fuera de las horas
  const ruido = (org: string, cuando: string, nombre: string) =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_id, document_name, pipeline_counters, analysis) VALUES ($1,$2,$3,$4,$5,$6)',
      [org, cuando, DOC, nombre, {}, { discrepancies: [contra('una cita que no está en ninguna parte del documento')] }]);
  await ruido('otra', '2026-10-24T17:10:00Z', 'NOR-10_x.docx');
  await ruido(ORG, '2026-10-24T17:10:00Z', 'NOR-11_x.docx');
  await ruido(ORG, '2026-10-24T16:00:00Z', 'NOR-10_x.docx');
  // LA PERTENENCIA (26/10/2026): la consulta resuelve la organización por el USUARIO; las tablas y la columna que
  // la guarda cuenta, por si el arnés no las tenía, y `pertenencias` filas de membresía, ni una más.
  await db.exec('CREATE TABLE IF NOT EXISTS memberships (user_id uuid, org_id uuid); CREATE TABLE IF NOT EXISTS organizations (id uuid, name text); ' +
    'CREATE TABLE IF NOT EXISTS documents (id uuid, org_id text); ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id text; ' +
    'DELETE FROM memberships; DELETE FROM organizations;');
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  for (let i = 0; i < pertenencias; i++) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, i === 0 ? ORG : OTRA_ORG]);
  const sql = readFileSync('SQL_312_01_la_cita_no_literal.sql', 'utf8').replaceAll('public.', '');
  return (await db.query<Fila>(sql)).rows;
}
const filas = (f: Fila[]) => f.filter(x => x.bloque.startsWith('1 ·'));

describe('SQL_312_01, la cita no literal, carácter a carácter', () => {
  it('la literal no sale; las tres no literales salen, y el control cuenta las cuatro', async () => {
    const f = await correr([
      'autoriza cualquier excepción documentada al «protocolo» de esterilización',               // literal
      'autoriza cualquier excepción documentada al "protocolo" de esterilización',               // comillas cambiadas
      'La responsabilidad última recae siempre sobre esta persona y no es delegable',             // un tramo cambiado en medio
      'El comité aprueba por unanimidad el presupuesto anual del servicio',                       // inventada
    ]);
    expect(f.find(x => x.bloque === '0 · control')!.b).toBe('pasadas de NOR-10 entre las dos horas: 1 · contradicciones publicadas: 4 · con la cita del nuevo NO literal en el texto reconstruido: 3');
    expect(filas(f)).toHaveLength(3);
  }, 60_000);

  it('LAS COMILLAS: el principio literal llega hasta «al », y el primer carácter distinto es la comilla, con sus dos códigos', async () => {
    const [r] = filas(await correr(['autoriza cualquier excepción documentada al "protocolo" de esterilización']));
    expect(r.b).toContain('literal en el full_text: NO · literal en algún trozo suelto: NO');
    expect(r.b).toContain('PRINCIPIO literal: 44 caracteres (en el texto, desde la posición 21)');
    expect(r.b).toContain('PRIMER CARÁCTER DISTINTO, posición 45 de la cita: «"» (U+22) frente a ««» (U+AB) en el documento');
    expect(r.b).toContain('FINAL literal: 18 caracteres');                                  // « de esterilización»: antes, el " y la » ya difieren
  }, 60_000);

  it('EL TRAMO CAMBIADO: el principio literal llega hasta «esta », y el final literal desde «a y no es delegable» (persona y figura acaban en a)', async () => {
    const [r] = filas(await correr(['La responsabilidad última recae siempre sobre esta persona y no es delegable']));
    expect(r.b).toContain('PRINCIPIO literal: 51 caracteres');
    expect(r.b).toContain('PRIMER CARÁCTER DISTINTO, posición 52 de la cita: «p» (U+70) frente a «f» (U+66) en el documento');
    expect(r.b).toContain('FINAL literal: 19 caracteres');
    expect(r.c).toContain('ALREDEDOR DE LA DIFERENCIA, en el documento: «');
  }, 60_000);

  it('LA INVENTADA: casi nada del principio está en el documento', async () => {
    const [r] = filas(await correr(['El comité aprueba por unanimidad el presupuesto anual del servicio']));
    expect(Number(r.b!.match(/PRINCIPIO literal: (\d+)/)![1])).toBeLessThan(5);
  }, 60_000);

  it('los contadores de la puerta de esa pasada, sólo los de la puerta', async () => {
    const f = await correr(['autoriza cualquier excepción documentada al "protocolo" de esterilización']);
    expect(f.filter(x => x.bloque.startsWith('2 ·')).map(x => x.a)).toEqual(['juez.citas_recompuestas=0 · juez.citas_rescatadas_quitando_glosa=0']);
  }, 60_000);

  it('sin pasadas, el control FALLA y no hay filas', async () => {
    const f = await correr([]);
    expect(f.find(x => x.bloque === '0 · control')!.a).toBe('FALLA');
    expect(filas(f)).toHaveLength(0);
  }, 60_000);
});

describe('LA ORGANIZACIÓN LEÍDA (26/10/2026): se resuelve por el usuario, y la primera fila lo dice', () => {
  it('va primera: la del usuario, con su nombre y sus documentos', async () => {
    const f = await correr([]);
    expect(f[0].bloque).toBe('organización leída');
    expect(f[0].a).toMatch(new RegExp('^organización leída: ' + ORG + ' · «Mi workspace» · \\d+ documentos$'));
  }, 240_000);

  it('sin pertenencia, o con dos, lo grita en la primera fila', async () => {
    for (const n of [0, 2]) {
      pertenencias = n;
      try {
        const f = await correr([]);
        expect(f[0].bloque).toBe('organización leída');
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
            ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
      } finally {
        pertenencias = 1;
      }
    }
  }, 240_000);
});
