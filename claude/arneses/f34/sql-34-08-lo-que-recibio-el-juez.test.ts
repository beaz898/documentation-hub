import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_08_lo_que_recibio_el_juez.sql (01/11/2026), en PGlite. Las dos mediciones van rellenas en la
 * consulta, así que se siembran en sus ventanas reales: 21 pasadas de NOR-10 (30-31/10) y 13 de NOR-11 (28/10).
 * Casi todas, con los dos lados enteros. Las que no:
 *   · NOR-10, pasada 2: CLI-12 no entero (12 trozos de 55, selección «ampliada»);
 *   · NOR-10, pasada 3: el analizado cortado;
 *   · NOR-10, pasada 4: sin lectura de CLI-12 (sólo la de CLI-13);
 *   · NOR-11, pasada 1: CLI-12 con 55 caracteres de más, para el control positivo (sólo con `malos`).
 * CLI-12 tiene dos generaciones: la 1 con 50 trozos y la activa, la 2, con 55. Ruido: una pasada de NOR-10 fuera de la
 * ventana, otra de otra organización y una de NOR-12.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';
const COPIA = '00000000-0000-0000-0000-0000000000c4';

type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };
interface Lado { mostrados: number; caracteres: number; dejoFuera: boolean | null }
const lectura = (analizado: Lado, candidato: Lado, extra: Record<string, unknown> = {}, doc = C12) =>
  ({ documentId: doc, regimen: 'pareja_entera', analizado, candidato, presupuesto: 150000, seleccion: 'entero', trozosDelCandidato: 55, ...extra });
const entero = (n: number): Lado => ({ mostrados: n, caracteres: n, dejoFuera: false });

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE memberships (user_id uuid, org_id uuid);
    CREATE TABLE organizations (id uuid, name text);
    CREATE TABLE documents (id uuid, org_id text, name text, active_generation int);
    CREATE TABLE document_chunks (document_id uuid, org_id text, generation int, chunk_index int, text text);
    CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis_type text, analysis jsonb);`);
}, 120_000);
afterAll(async () => { await db.close(); });

interface Opciones { malos?: boolean; malosNor10?: boolean; malosNor11?: boolean; exhaustiva?: boolean; dosCli12?: boolean; dosPertenencias?: boolean; unaMenos?: boolean; dosLecturas?: boolean }
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM document_chunks; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_manual.docx', 2), ($3, $2, 'CLI-13_instrucciones.docx', 1)", [C12, ORG, C13]);
  if (o.dosCli12) await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_copia.docx', 1)", [COPIA, ORG]);
  await db.query("INSERT INTO document_chunks SELECT $1, $2, 1, g, 't' FROM generate_series(0, 49) g", [C12, ORG]);
  await db.query("INSERT INTO document_chunks SELECT $1, $2, 2, g, 't' FROM generate_series(0, 54) g", [C12, ORG]);
  await db.query("INSERT INTO document_chunks SELECT $1, $2, 1, g, 't' FROM generate_series(0, 29) g", [C13, ORG]);
  const meter = (org: string, cuando: Date, doc: string, lecturas: unknown[], tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
      [org, cuando.toISOString(), doc, tipo, { lecturaDeLasParejas: lecturas }]);
  const deCli13 = lectura(entero(66801), entero(30000), {}, C13);
  // D: 21 pasadas desde el 30/10 a las 23:45 de Madrid (22:45 UTC), una cada 30 minutos
  const n10 = o.unaMenos ? 20 : 21;
  for (let i = 1; i <= n10; i++) {
    const cuando = new Date(Date.UTC(2026, 9, 30, 22, 45) + (i - 1) * 30 * 60_000);
    let l: unknown[] = [lectura(entero(i === 7 && o.malosNor10 ? 66800 : 66801), entero(55135)), deCli13];
    if (i === 2) l = [lectura(entero(66801), { mostrados: 13000, caracteres: 55135, dejoFuera: true }, { seleccion: 'ampliada', trozosDelCandidato: 12 }), deCli13];
    if (i === 3) l = [lectura({ mostrados: 40000, caracteres: 66801, dejoFuera: true }, entero(55135)), deCli13];
    if (i === 4) l = [deCli13];
    if (i === 5 && o.dosLecturas) l = [lectura(entero(66801), entero(55135)), lectura(entero(66801), entero(55135))];
    await meter(ORG, cuando, 'NOR-10_protocolo.docx', l, i === 6 && o.exhaustiva ? 'exhaustive' : 'quick');
  }
  // el quinto: 13 pasadas desde el 28/10 a las 08:33 de Madrid (07:33 UTC), una cada 2 minutos
  for (let i = 1; i <= 13; i++) {
    const cuando = new Date(Date.UTC(2026, 9, 28, 7, 33) + (i - 1) * 2 * 60_000);
    const c = i === 1 && o.malos ? 55190 : 55135;
    await meter(ORG, cuando, 'NOR-11_residuos.docx', [lectura(entero(i === 2 && o.malosNor11 ? 14700 : 14704), entero(c))]);
  }
  // ruido
  await meter(ORG, new Date(Date.UTC(2026, 9, 30, 21, 0)), 'NOR-10_protocolo.docx', [lectura(entero(1), entero(1))]);
  await meter(OTRA, new Date(Date.UTC(2026, 9, 28, 7, 40)), 'NOR-11_residuos.docx', [lectura(entero(1), entero(1))]);
  await meter(ORG, new Date(Date.UTC(2026, 9, 28, 7, 41)), 'NOR-12_otro.docx', [lectura(entero(1), entero(1))]);
}

async function correr(o: Opciones = {}): Promise<Fila[]> {
  await sembrar(o);
  return (await db.query<Fila>(readFileSync('SQL_34_08_lo_que_recibio_el_juez.sql', 'utf8').replaceAll('public.', ''))).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c, x.d]);
const control = (f: Fila[]) => de(f, '0 · control').map(x => [x[0], x[1]]);
const ok = (f: Fila[]) => control(f).map(x => x[1]);

describe('SQL_34_08, lo que recibió el juez', () => {
  it('LOS CONTROLES: la organización primero; las dos ventanas con su esperado; la pasada sin lectura FALLA el suyo; el control positivo, OK', async () => {
    const f = await correr();
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 2 documentos`);
    expect(control(f)).toEqual([
      ['D · pasadas de NOR-10 en su ventana: 21 · esperado: 21', 'OK'],
      ['el quinto · pasadas de NOR-11 en su ventana: 13 · esperado: 13', 'OK'],
      ['pasadas que no son rápidas: 0', 'OK'],
      ['documentos CLI-12 en la organización: 1 (tiene que ser uno) · generación 1: 50 trozos · generación 2: 55 trozos · activa: 2', 'OK'],
      ['pasadas sin UNA lectura de la pareja con CLI-12: 1', '⚠️⚠️ FALLA'],
      ['CONTROL POSITIVO · caracteres de CLI-12 en la lectura: 55135 (tienen que ser 55135) · de NOR-10: 66801 (tienen que ser 66801) · de NOR-11: 14704 (tienen que ser 14704)', 'OK'],
    ]);
  });

  it('POR PASADA: los dos enteros, CLI-12 no entero, el analizado cortado y la que no tiene lectura', async () => {
    const f = de(await correr(), '1 · por pasada');
    expect(f.length).toBe(34);
    expect(f.slice(0, 5).map(x => [x[0], x[1]])).toEqual([
      ['D · pasada 1 · 30/10 23:45:00', 'LOS DOS ENTEROS'],
      ['D · pasada 2 · 31/10 00:15:00', '⚠️ CLI-12 NO ENTERO: 12 de 55 trozos; CUÁLES, la base no lo guarda'],
      ['D · pasada 3 · 31/10 00:45:00', '⚠️ NOR-10 CORTADO: 40000 de 66801 caracteres'],
      ['D · pasada 4 · 31/10 01:15:00', '⚠️ SIN LECTURA DE CLI-12: no se sabe qué recibió'],
      ['D · pasada 5 · 31/10 01:45:00', 'LOS DOS ENTEROS'],
    ]);
    expect(f[0][2]).toBe('NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos');
    expect(f[0][3]).toBe('régimen pareja_entera · selección entero · dejó fuera: false / false');
    expect(f[1][2]).toBe('NOR-10: 66801 de 66801 caracteres · CLI-12: 13000 de 55135 caracteres, 12 de 55 trozos');
    expect(f[1][3]).toBe('régimen pareja_entera · selección ampliada · dejó fuera: false / true');
    expect(f[21].slice(0, 2)).toEqual(['el quinto · pasada 1 · 28/10 08:33:00', 'LOS DOS ENTEROS']);
    expect(f[33][0]).toBe('el quinto · pasada 13 · 28/10 08:57:00');
  });

  it('EL TOTAL POR MEDICIÓN: D no entera en todas; el quinto, entero en las 13', async () => {
    expect(de(await correr(), '2 · el total')).toEqual([
      ['D (NOR-10 ↔ CLI-12): los dos enteros en 18 de 21 pasadas', '⚠️ NO en todas: la premisa «los dos documentos enteros delante» NO se sostiene para esta medición', null, null],
      ['el quinto (NOR-11 ↔ CLI-12): los dos enteros en 13 de 13 pasadas', 'el juez tuvo delante todo NOR-11 y todo CLI-12, con el §4 (trozos 7 a 9) y §6.2 (trozo 13)', null, null],
    ]);
  });

  it('UN CANDIDATO CON TODOS LOS CARACTERES PERO MENOS TROZOS QUE LA GENERACIÓN ACTIVA no es entero, y uno sin «dejoFuera» tampoco', async () => {
    await sembrar();
    await db.query("UPDATE analysis_results SET analysis = jsonb_set(analysis, '{lecturaDeLasParejas,0,trozosDelCandidato}', '50') WHERE document_name LIKE 'NOR-11%' AND created_at = '2026-10-28T07:35:00Z'");
    await db.query("UPDATE analysis_results SET analysis = analysis #- '{lecturaDeLasParejas,0,candidato,dejoFuera}' WHERE document_name LIKE 'NOR-11%' AND created_at = '2026-10-28T07:37:00Z'");
    const f = de((await db.query<Fila>(readFileSync('SQL_34_08_lo_que_recibio_el_juez.sql', 'utf8').replaceAll('public.', ''))).rows, '1 · por pasada');
    expect(f[22][1]).toBe('⚠️ CLI-12 NO ENTERO: 50 de 55 trozos; CUÁLES, la base no lo guarda');
    expect(f[23][1]).toBe('⚠️ CLI-12 NO ENTERO: 55 de 55 trozos; CUÁLES, la base no lo guarda');
    expect(f[24][1]).toBe('LOS DOS ENTEROS');
  });

  it('CADA CONDICIÓN DE «ENTERO», POR SEPARADO: caracteres de menos sin dejar nada fuera, o todos los caracteres dejando algo fuera, en cada lado', async () => {
    await sembrar();
    const poner = (min: string, ruta: string, valor: string) =>
      db.query(`UPDATE analysis_results SET analysis = jsonb_set(analysis, '{lecturaDeLasParejas,0,${ruta}}', '${valor}') WHERE document_name LIKE 'NOR-11%' AND created_at = '2026-10-28T07:${min}:00Z'`);
    await poner('39', 'analizado,mostrados', '14000');
    await poner('41', 'analizado,dejoFuera', 'true');
    await poner('43', 'candidato,mostrados', '55000');
    const f = de((await db.query<Fila>(readFileSync('SQL_34_08_lo_que_recibio_el_juez.sql', 'utf8').replaceAll('public.', ''))).rows, '1 · por pasada');
    expect(f.slice(24, 28).map(x => x[1])).toEqual([
      '⚠️ NOR-11 CORTADO: 14000 de 14704 caracteres',
      '⚠️ NOR-11 CORTADO: 14704 de 14704 caracteres',
      '⚠️ CLI-12 NO ENTERO: 55 de 55 trozos; CUÁLES, la base no lo guarda',
      'LOS DOS ENTEROS',
    ]);
  });

  it('⚠️ EL CONTROL POSITIVO FALLA si CLI-12, o NOR-10, no tienen los caracteres medidos', async () => {
    const f = await correr({ malos: true });
    expect(control(f)[5]).toEqual(['CONTROL POSITIVO · caracteres de CLI-12 en la lectura: 55135, 55190 (tienen que ser 55135) · de NOR-10: 66801 (tienen que ser 66801) · de NOR-11: 14704 (tienen que ser 14704)', '⚠️⚠️ FALLA']);
    const g = await correr({ malosNor10: true });
    expect(control(g)[5]).toEqual(['CONTROL POSITIVO · caracteres de CLI-12 en la lectura: 55135 (tienen que ser 55135) · de NOR-10: 66800, 66801 (tienen que ser 66801) · de NOR-11: 14704 (tienen que ser 14704)', '⚠️⚠️ FALLA']);
    const h = await correr({ malosNor11: true });
    expect(control(h)[5]).toEqual(['CONTROL POSITIVO · caracteres de CLI-12 en la lectura: 55135 (tienen que ser 55135) · de NOR-10: 66801 (tienen que ser 66801) · de NOR-11: 14700, 14704 (tienen que ser 14704)', '⚠️⚠️ FALLA']);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR, fallan: una pasada menos, una exhaustiva, dos CLI-12, dos lecturas, dos pertenencias', async () => {
    expect(ok(await correr({ unaMenos: true }))[0]).toBe('⚠️⚠️ FALLA');
    expect(ok(await correr({ exhaustiva: true }))[2]).toBe('⚠️⚠️ FALLA');
    expect(ok(await correr({ dosCli12: true }))[3]).toBe('⚠️⚠️ FALLA');
    const d = await correr({ dosLecturas: true });
    expect(control(d)[4]).toEqual(['pasadas sin UNA lectura de la pareja con CLI-12: 2', '⚠️⚠️ FALLA']);
    expect(de(d, '1 · por pasada')[4][1]).toBe('⚠️ 2 LECTURAS DE CLI-12');
    expect(de(d, '2 · el total')[0][0]).toBe('D (NOR-10 ↔ CLI-12): los dos enteros en 17 de 21 pasadas');
    const g = await correr({ dosPertenencias: true });
    expect(g[0].a).toMatch(/^⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario .* tiene 2 pertenencias/);
    expect(de(g, '1 · por pasada')).toEqual([]);
  });
});
