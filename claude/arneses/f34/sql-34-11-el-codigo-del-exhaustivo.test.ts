import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_11_el_codigo_del_exhaustivo.sql (03/11/2026), en PGlite. Los rápidos fijan el «desde» MEDIDO de
 * cada marcador: el primero con lecturaDeLasParejas el 29/09 a las 12:00 de Madrid, con llamadasAlModelo el 21/10 a las
 * 12:00, y con el contador nuevo el 02/11 a las 17:54. Cada caso de la lectura se siembra con sus exhaustivos:
 *   · viejo: uno del 30/10 sin el marcador 2 (código anterior al 21/10) y uno del 03/11 sin ninguno (anterior al 29/09);
 *   · al día: uno del 03/11 con los tres;
 *   · ninguno: sólo exhaustivos anteriores al 02/11 17:54.
 * Ruido: otra organización con un exhaustivo viejo del 03/11. Fechas y orígenes distintos en cada uno, para que la
 * consulta no pueda confundir un marcador con otro (la regla de los datos sin simetrías).
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
type Fila = { bloque: string; a: string | null; b: string | null; c: string | null };
type Caso = 'viejo' | 'al_dia' | 'ninguno';

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

const con = (m1: boolean, m2: boolean, m3: boolean) => ({
  ...(m1 ? { lecturaDeLasParejas: [] } : {}),
  ...(m2 ? { llamadasAlModelo: { peticiones: [] } } : {}),
  pipelineCounters: m3 ? { 'verificador.confirmados_solo_por_cumplimiento': 0 } : { 'verificador.hallazgos_entrantes': 3 },
});
async function sembrar(caso: Caso, o: { dosPertenencias?: boolean; sinRapidoNuevo?: boolean } = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES (gen_random_uuid(), $1, 'NOR-10_protocolo.docx')", [ORG]);
  const meter = (org: string, iso: string, tipo: string, a: unknown, doc = 'NOR-10_protocolo.docx') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, iso, doc, tipo, a]);
  // los rápidos que fijan los «desde» (UTC): 29/09 10:00 (12:00 Madrid), 21/10 10:00, 02/11 16:54 (17:54 Madrid)
  await meter(ORG, '2026-09-28T10:00:00Z', 'quick', con(false, false, false));
  await meter(ORG, '2026-09-29T10:00:00Z', 'quick', con(true, false, false));
  await meter(ORG, '2026-10-21T10:00:00Z', 'quick', con(true, true, false));
  if (!o.sinRapidoNuevo) await meter(ORG, '2026-11-02T16:54:00Z', 'quick', con(true, true, true));
  // un exhaustivo anterior a todo, que no puede ser viejo para su fecha
  await meter(ORG, '2026-09-26T08:00:00Z', 'exhaustive', con(false, false, false), 'NOR-05.docx');
  if (caso === 'viejo') {
    await meter(ORG, '2026-10-30T09:15:00Z', 'exhaustive', con(true, false, false), 'NOR-07.docx');
    await meter(ORG, '2026-11-03T07:40:00Z', 'exhaustive', con(false, false, false), 'NOR-09.docx');
  }
  if (caso === 'al_dia') {
    // un exhaustivo con el contador ANTES que el primer rápido: el «desde» no puede salir de él (el worker no se examina a sí mismo)
    await meter(ORG, '2026-11-02T10:00:00Z', 'exhaustive', con(true, true, true), 'NOR-06.docx');
    await meter(ORG, '2026-11-03T07:40:00Z', 'exhaustive', con(true, true, true), 'NOR-09.docx');
  }
  if (caso === 'ninguno') await meter(ORG, '2026-11-01T11:05:00Z', 'exhaustive', con(true, true, false), 'NOR-08.docx');
  // ruido: otra organización, un exhaustivo viejo después del contador
  await meter(OTRA, '2026-11-03T08:00:00Z', 'exhaustive', con(false, false, false));
}
async function correr(caso: Caso, o: { dosPertenencias?: boolean; sinRapidoNuevo?: boolean } = {}): Promise<Fila[]> {
  await sembrar(caso, o);
  return (await db.query<Fila>(readFileSync('SQL_34_11_el_codigo_del_exhaustivo.sql', 'utf8').replace(/\r\n/g, '\n').replaceAll('public.', ''))).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c]);

describe('SQL_34_11, con qué código corre el exhaustivo', () => {
  it('LOS CONTROLES: el «desde» de cada marcador es el primer rápido que lo lleva, medido y en hora de Madrid', async () => {
    const f = await correr('viejo');
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 1 documentos`);
    expect(de(f, '0 · control')).toEqual([
      ['CONTROL POSITIVO · marcador 1, lecturaDeLasParejas: el primer rápido que lo lleva: 29/09 12:00', 'OK', null],
      ['CONTROL POSITIVO · marcador 2, llamadasAlModelo: el primer rápido que lo lleva: 21/10 12:00', 'OK', null],
      ['CONTROL POSITIVO · marcador 3, el contador del verificador nuevo: el primer rápido que lo lleva: 02/11 17:54', 'OK', null],
    ]);
  });

  it('CASO 2, CÓDIGO VIEJO: cada exhaustivo dice qué le falta, y sólo lo que los rápidos ya llevaban a su hora', async () => {
    const f = await correr('viejo');
    expect(de(f, '1 · por exhaustivo')).toEqual([
      ['exhaustivo 1 · 26/09/2026 10:00 (hora de Madrid) · NOR-05.docx', 'marcadores: 1 no · 2 no · 3 no', 'al día para su fecha'],
      ['exhaustivo 2 · 30/10/2026 10:15 (hora de Madrid) · NOR-07.docx', 'marcadores: 1 sí · 2 no · 3 no', '⚠️⚠️ CÓDIGO VIEJO: le falta llamadasAlModelo (21/10), que los rápidos ya llevaban'],
      ['exhaustivo 3 · 03/11/2026 08:40 (hora de Madrid) · NOR-09.docx', 'marcadores: 1 no · 2 no · 3 no', '⚠️⚠️ CÓDIGO VIEJO: le falta lecturaDeLasParejas (29/09), llamadasAlModelo (21/10), el contador del verificador nuevo (02/11), que los rápidos ya llevaban'],
    ]);
    expect(de(f, '2 · el total')).toEqual([['exhaustivos desde el 20/09: 3 · con código viejo: 2 · posteriores al primer rápido con el contador nuevo: 1', '⚠️⚠️ CASO 2 · algún exhaustivo posterior NO lleva el contador nuevo: el worker corre código viejo', null]]);
  });

  it('CASO 1, AL DÍA: el exhaustivo posterior lleva los tres marcadores', async () => {
    const f = await correr('al_dia');
    // el «desde» sale del primer RÁPIDO, no del exhaustivo de las 11:00 que ya lo llevaba
    expect(de(f, '0 · control')[2][0]).toBe('CONTROL POSITIVO · marcador 3, el contador del verificador nuevo: el primer rápido que lo lleva: 02/11 17:54');
    expect(de(f, '1 · por exhaustivo').at(-1)).toEqual(['exhaustivo 3 · 03/11/2026 08:40 (hora de Madrid) · NOR-09.docx', 'marcadores: 1 sí · 2 sí · 3 sí', 'al día para su fecha']);
    expect(de(f, '2 · el total')[0][1]).toBe('CASO 1 · los exhaustivos posteriores llevan el contador nuevo: el worker está al día');
  });

  it('CASO 3, NINGUNO POSTERIOR: no concluye, aunque al de antes ya le falte el contador que aún no existía', async () => {
    const f = await correr('ninguno');
    expect(de(f, '1 · por exhaustivo').at(-1)).toEqual(['exhaustivo 2 · 01/11/2026 12:05 (hora de Madrid) · NOR-08.docx', 'marcadores: 1 sí · 2 sí · 3 no', 'al día para su fecha']);
    expect(de(f, '2 · el total')[0][1]).toBe('CASO 3 · ningún exhaustivo posterior al contador nuevo: no concluye nada, hace falta Railway');
  });

  it('⚠️ EL CONTROL POSITIVO FALLA si ningún rápido lleva el contador nuevo, y entonces la lectura se niega', async () => {
    const f = await correr('viejo', { sinRapidoNuevo: true });
    expect(de(f, '0 · control')[2]).toEqual(['CONTROL POSITIVO · marcador 3, el contador del verificador nuevo: el primer rápido que lo lleva: NINGUNO', '⚠️⚠️ FALLA', null]);
    expect(de(f, '2 · el total')[0][1]).toBe('NO SE PUEDE LEER: ningún rápido lleva el contador nuevo (control 3)');
  });

  it('LA ORGANIZACIÓN: con dos pertenencias lo dice a gritos y no lee nada (ni el exhaustivo viejo de la otra)', async () => {
    const f = await correr('al_dia', { dosPertenencias: true });
    expect(f[0].a).toMatch(/^⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario .* tiene 2 pertenencias/);
    expect(de(f, '1 · por exhaustivo')).toEqual([]);
  });
});
