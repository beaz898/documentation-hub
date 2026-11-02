import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_09_el_verificador_nuevo.sql (02/11/2026), en PGlite. Las dos líneas base van rellenas en la
 * consulta, así que se siembran en sus ventanas reales: 21 de NOR-10 (30-31/10) y 13 de NOR-11 (28/10), SIN el contador
 * nuevo. La tanda nueva, el 02/11: 20 de NOR-10 de 18:00 a 20:00 y 20 de NOR-11 de 20:00 a 22:00 (Madrid), CON él.
 *   · NOR-10 nueva: la pasada 1 confirma 2 sólo por el cumplimiento y la 5 uno (3 en 2 pasadas); la 2 y la 3, un sin
 *     veredicto cada una. Base: un sin veredicto, en la pasada 1. Llegan 4 hallazgos al verificador por pasada.
 *   · NOR-11: nada sólo por el cumplimiento, ningún sin veredicto, 2 hallazgos por pasada.
 *   · Una pasada de NOR-10 del 02/11 a la 01:00, SIN el contador (código viejo), fuera de las ventanas: sale en la lista.
 * Ruido: otra organización y NOR-12.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE memberships (user_id uuid, org_id uuid);
    CREATE TABLE organizations (id uuid, name text);
    CREATE TABLE documents (id uuid, org_id text, name text);
    CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis_type text, analysis jsonb);`);
}, 120_000);
afterAll(async () => { await db.close(); });

interface Opciones { viejaEnLaNueva?: boolean; nuevaEnLaBase?: boolean; exhaustiva?: boolean; unaMenos?: boolean; dosPertenencias?: boolean }
const analisis = (o: { nuevo: boolean; solo?: number; entrantes: number; sinVeredicto?: number }) => ({
  pipelineCounters: { 'verificador.hallazgos_entrantes': o.entrantes, ...(o.nuevo ? { 'verificador.confirmados_solo_por_cumplimiento': o.solo ?? 0 } : {}) },
  discardedFindings: { 'descartado.sin_relacion': 1, ...(o.sinVeredicto ? { 'descartado.sin_veredicto': o.sinVeredicto } : {}) },
});
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES (gen_random_uuid(), $1, 'NOR-10_protocolo.docx')", [ORG]);
  const meter = (org: string, cuando: Date, doc: string, a: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando.toISOString(), doc, tipo, a]);
  const N10 = 'NOR-10_protocolo.docx', N11 = 'NOR-11_residuos.docx';
  // línea base de NOR-10: 21 desde el 30/10 a las 23:45 de Madrid (22:45 UTC)
  for (let i = 1; i <= 21; i++) await meter(ORG, new Date(Date.UTC(2026, 9, 30, 22, 45) + (i - 1) * 30 * 60_000), N10,
    analisis({ nuevo: i === 2 && !!o.nuevaEnLaBase, entrantes: 4, sinVeredicto: i === 1 ? 1 : 0 }));
  // línea base de NOR-11: 13 desde el 28/10 a las 08:33 de Madrid (07:33 UTC)
  for (let i = 1; i <= 13; i++) await meter(ORG, new Date(Date.UTC(2026, 9, 28, 7, 33) + (i - 1) * 2 * 60_000), N11, analisis({ nuevo: false, entrantes: 2 }));
  // tanda nueva de NOR-10: desde el 02/11 a las 18:01 de Madrid (17:01 UTC), una cada 5 minutos
  const n10 = o.unaMenos ? 19 : 20;
  for (let i = 1; i <= n10; i++) await meter(ORG, new Date(Date.UTC(2026, 10, 2, 17, 1) + (i - 1) * 5 * 60_000), N10,
    analisis({ nuevo: !(i === 4 && o.viejaEnLaNueva), solo: i === 1 ? 2 : i === 5 ? 1 : 0, entrantes: 4, sinVeredicto: i === 2 || i === 3 ? 1 : 0 }),
    i === 6 && o.exhaustiva ? 'exhaustive' : 'quick');
  // tanda nueva de NOR-11: desde las 20:01 de Madrid (19:01 UTC)
  for (let i = 1; i <= 20; i++) await meter(ORG, new Date(Date.UTC(2026, 10, 2, 19, 1) + (i - 1) * 5 * 60_000), N11, analisis({ nuevo: true, entrantes: 2 }));
  // una del 02/11 a la 01:00 de Madrid, con el código viejo, fuera de las ventanas
  await meter(ORG, new Date(Date.UTC(2026, 10, 2, 0, 0)), N10, analisis({ nuevo: false, entrantes: 4 }));
  // ruido
  await meter(OTRA, new Date(Date.UTC(2026, 10, 2, 17, 30)), N10, analisis({ nuevo: true, solo: 9, entrantes: 4, sinVeredicto: 9 }));
  await meter(ORG, new Date(Date.UTC(2026, 10, 2, 17, 30)), 'NOR-12_otro.docx', analisis({ nuevo: true, solo: 9, entrantes: 4, sinVeredicto: 9 }));
}
function preparar(sql: string, conVentanas: boolean): string {
  let s = sql.replaceAll('public.', '');
  if (conVentanas) {
    s = s.replace("(3, 'tanda nueva', 'NOR-10', NULL::timestamptz, NULL::timestamptz, 20)", "(3, 'tanda nueva', 'NOR-10', timestamptz '2026-11-02 18:00:00+01', timestamptz '2026-11-02 20:00:00+01', 20)");
    s = s.replace("(4, 'tanda nueva', 'NOR-11', NULL::timestamptz, NULL::timestamptz, 20)", "(4, 'tanda nueva', 'NOR-11', timestamptz '2026-11-02 20:00:00+01', timestamptz '2026-11-02 22:00:00+01', 20)");
  }
  return s;
}
async function correr(o: Opciones = {}, conVentanas = true): Promise<Fila[]> {
  await sembrar(o);
  return (await db.query<Fila>(preparar(readFileSync('SQL_34_09_el_verificador_nuevo.sql', 'utf8'), conVentanas))).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c, x.d]);
const control = (f: Fila[]) => de(f, '0 · control').map(x => [x[0], x[1]]);
const ok = (f: Fila[]) => control(f).map(x => x[1]);

describe('SQL_34_09, el verificador nuevo en la tanda', () => {
  it('LOS CONTROLES: las cuatro mediciones con su esperado, todas rápidas, y los dos controles positivos en verde', async () => {
    const f = await correr();
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 1 documentos`);
    expect(control(f)).toEqual([
      ['línea base · NOR-10 · pasadas en su ventana: 21 · esperado: 21', 'OK'],
      ['línea base · NOR-11 · pasadas en su ventana: 13 · esperado: 13', 'OK'],
      ['tanda nueva · NOR-10 · pasadas en su ventana: 20 · esperado: 20', 'OK'],
      ['tanda nueva · NOR-11 · pasadas en su ventana: 20 · esperado: 20', 'OK'],
      ['pasadas que no son rápidas: 0', 'OK'],
      ['CONTROL POSITIVO · pasadas de la tanda nueva con el contador nuevo (corrieron con el verificador nuevo): 40 de 40', 'OK'],
      ['pasadas de la línea base con el contador nuevo (tienen que ser 0): 0', 'OK'],
    ]);
  });

  it('POR MEDICIÓN: las dos cifras con su denominador', async () => {
    expect(de(await correr(), '1 · por medición')).toEqual([
      ['línea base · NOR-10 · 21 pasadas', '(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio)', '(b) descartado.sin_veredicto: 1 en 1 pasadas, de 84 hallazgos que llegaron al verificador', 'por pasada: 0.05 sin veredicto'],
      ['línea base · NOR-11 · 13 pasadas', '(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio)', '(b) descartado.sin_veredicto: 0 en 0 pasadas, de 26 hallazgos que llegaron al verificador', 'por pasada: 0.00 sin veredicto'],
      ['tanda nueva · NOR-10 · 20 pasadas', '(a) confirmados SÓLO por la pregunta del cumplimiento: 3 en 2 pasadas', '(b) descartado.sin_veredicto: 2 en 2 pasadas, de 80 hallazgos que llegaron al verificador', 'por pasada: 0.10 sin veredicto'],
      ['tanda nueva · NOR-11 · 20 pasadas', '(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas', '(b) descartado.sin_veredicto: 0 en 0 pasadas, de 40 hallazgos que llegaron al verificador', 'por pasada: 0.00 sin veredicto'],
    ]);
  });

  it('LA GUARDA DE REGRESIÓN: sin_veredicto, nueva frente a base, por documento; y EL TOTAL de la tanda nueva', async () => {
    const f = await correr();
    expect(de(f, '2 · sin_veredicto, nueva frente a base')).toEqual([
      ['NOR-10', 'línea base: 1 de 84 en 21 pasadas · tanda nueva: 2 de 80 en 20 pasadas', '⚠️ SUBE', null],
      ['NOR-11', 'línea base: 0 de 26 en 13 pasadas · tanda nueva: 0 de 40 en 20 pasadas', 'igual', null],
    ]);
    expect(de(f, '3 · el total de la tanda nueva')).toEqual([['confirmados SÓLO por la pregunta del cumplimiento: 3 en 2 de 40 pasadas', null, null, null]]);
  });

  it('SIN LAS VENTANAS NUEVAS, LISTA las pasadas rápidas desde el 02/11, y señala la del código viejo', async () => {
    const f = await correr({}, false);
    const l = de(f, '0 · sin ventana: las pasadas rápidas desde el 02/11');
    expect(f.filter(x => x.bloque === '0 · control')).toEqual([]);
    expect(l.length).toBe(41);
    expect(l[0].slice(0, 2)).toEqual(['NOR-10 · pasada 1 · 02/11/2026 01:00:00 (hora de Madrid)', '⚠️ SIN el contador: código viejo']);
    expect(l[1].slice(0, 2)).toEqual(['NOR-10 · pasada 2 · 02/11/2026 18:01:00 (hora de Madrid)', 'con el verificador nuevo']);
    expect(l[21].slice(0, 2)).toEqual(['NOR-11 · pasada 1 · 02/11/2026 20:01:00 (hora de Madrid)', 'con el verificador nuevo']);
  });

  it('⚠️ LOS DOS CONTROLES POSITIVOS FALLAN cuando deben: una pasada nueva con código viejo, una de la base con el contador', async () => {
    expect(control(await correr({ viejaEnLaNueva: true }))[5]).toEqual(['CONTROL POSITIVO · pasadas de la tanda nueva con el contador nuevo (corrieron con el verificador nuevo): 39 de 40', '⚠️⚠️ FALLA']);
    expect(control(await correr({ nuevaEnLaBase: true }))[6]).toEqual(['pasadas de la línea base con el contador nuevo (tienen que ser 0): 1', '⚠️⚠️ FALLA']);
  });

  it('LOS DEMÁS CONTROLES QUE PUEDEN FALLAR, fallan: una pasada menos, una exhaustiva, dos pertenencias', async () => {
    expect(ok(await correr({ unaMenos: true }))[2]).toBe('⚠️⚠️ FALLA');
    expect(ok(await correr({ exhaustiva: true }))[4]).toBe('⚠️⚠️ FALLA');
    const g = await correr({ dosPertenencias: true });
    expect(g[0].a).toMatch(/^⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario .* tiene 2 pertenencias/);
    expect(de(g, '1 · por medición').every(x => x[0]?.endsWith(' · 0 pasadas'))).toBe(true);
  });
});
