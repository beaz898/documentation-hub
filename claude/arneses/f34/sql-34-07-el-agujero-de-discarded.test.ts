import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_07_el_agujero_de_discarded.sql (01/11/2026), en PGlite. Nueve pasadas de NOR-11 en la ventana,
 * una por cada camino del veredicto:
 *   1 · con «discarded» y el juez a CLI-12 con 200: no es un agujero (y es el control positivo);
 *   2 · agujero, el juicio NO es el de reserva (tema_similar, 20 %): CERO REAL por la forma;
 *   3 · agujero, juicio de reserva, 200 y ninguna caída del juez (sí una del rerank, y un verificador a CLI-12 que
 *       contestó 529 DESPUÉS): CERO REAL por las caídas;
 *   4 · agujero, la última petición del juez a CLI-12 contestó 529, y una caída del juez: JUEZ CAÍDO;
 *   5 · agujero, juicio de reserva, 200 y una caída del juez: NO SE DISTINGUE;
 *   6 · agujero, sin registro por llamada: NO SE SABE;
 *   7 · agujero, el registro sólo tiene peticiones del juez a CLI-13: NO SE SABE;
 *   8 · sin juicio de CLI-12;
 *   9 · agujero, un 529 y después un 200, guardados en el array AL REVÉS que su orden: la última es el 200, CERO REAL.
 * Ruido: una de NOR-10 en la ventana, una de NOR-11 fuera de ella y otra de otra organización.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';
const COPIA = '00000000-0000-0000-0000-0000000000c4';

type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };
const reserva = (doc = C12) => ({ documentId: doc, documentName: 'x', source: 'manual', overlapPercent: 0, verdict: 'sin_relacion', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] });
const pet = (n: number, resultado: 'ok' | 'http' | 'red', pareja = C12, etapa = 'juez') => ({ n, etapa, pareja, modelo: 'claude-haiku-5-5', vuelta: 1, intento: 1, resultado, latenciaMs: 1000, esperaMs: 0, comienzoMs: 0, tokens: { entrada: 0, salida: 0, escrituraCache: 0, lecturaCache: 0 } });
const registro = (peticiones: unknown[], fuera: unknown = null) => ({ peticiones, sinEtapa: 0, fueraDelDetalle: fuera });
const caida = (stage: string, detail = 'HTTP 529: overloaded') => ({ stage, detail });

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

interface Opciones { sinLaSeis?: boolean; guarda?: boolean; controlRoto?: boolean; exhaustiva?: boolean; dosCli12?: boolean; dosPertenencias?: boolean }
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_manual.docx'), ($3, $2, 'CLI-13_instrucciones.docx')", [C12, ORG, C13]);
  if (o.dosCli12) await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_copia.docx')", [COPIA, ORG]);
  const meter = (org: string, cuando: string, doc: string, analisis: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando, doc, tipo, analisis]);
  const N11 = 'NOR-11_residuos.docx';
  const a = (judgments: unknown[], llamadas?: unknown, stageFailures?: unknown[]) =>
    ({ judgments, ...(llamadas === undefined ? {} : { llamadasAlModelo: llamadas }), ...(stageFailures ? { stageFailures } : {}) });
  await meter(ORG, '2026-10-27T10:10:00Z', N11, a([{ ...reserva(), discarded: { 'confirmado.por_juicio': 1 } }],
    registro(o.controlRoto ? [pet(1, 'ok', C13)] : [pet(1, 'ok')], o.guarda ? { peticiones: 3, tokens: {}, latenciaMs: 0, esperaMs: 0 } : null)));
  await meter(ORG, '2026-10-27T10:20:00Z', N11, a([{ ...reserva(), verdict: 'tema_similar', overlapPercent: 20 }], registro([pet(1, 'ok')])));
  await meter(ORG, '2026-10-27T10:30:00Z', N11, a([reserva()], registro([pet(1, 'ok'), pet(2, 'http', C12, 'verificador')]), [caida('rerank')]), o.exhaustiva ? 'exhaustive' : 'quick');
  await meter(ORG, '2026-10-27T10:40:00Z', N11, a([reserva()], registro([pet(1, 'http'), pet(2, 'http')]), [caida('judge')]));
  await meter(ORG, '2026-10-27T10:50:00Z', N11, a([reserva(), reserva(C13)], registro([pet(1, 'ok'), pet(2, 'http', C13)]), [caida('judge', 'JSON inválido')]));
  if (!o.sinLaSeis) await meter(ORG, '2026-10-27T11:00:00Z', N11, a([reserva()]));
  await meter(ORG, '2026-10-27T11:10:00Z', N11, a([reserva(), reserva(C13)], registro([pet(1, 'ok', C13)])));
  await meter(ORG, '2026-10-27T11:20:00Z', N11, a([reserva(C13)], registro([pet(1, 'ok', C13)])));
  await meter(ORG, '2026-10-27T11:30:00Z', N11, a([reserva()], registro([pet(2, 'ok'), pet(1, 'http')])));
  // ruido: una caída del juez en cada una, que no puede llegar a ninguna pasada de la ventana
  const ruido = a([reserva()], registro([pet(1, 'http')]), [caida('judge')]);
  await meter(ORG, '2026-10-27T10:15:00Z', 'NOR-10_protocolo.docx', ruido);
  await meter(ORG, '2026-10-27T09:00:00Z', N11, ruido);
  await meter(OTRA, '2026-10-27T10:25:00Z', N11, ruido);
}

type Ventana = boolean | 'solo_desde';
function preparar(sql: string, ventana: Ventana, esperado: number | null): string {
  let s = sql.replaceAll('public.', '');
  if (ventana) s = s.replace('NULL::timestamptz AS desde', "timestamptz '2026-10-27 10:00:00+00' AS desde");
  if (ventana === true) s = s.replace('NULL::timestamptz AS hasta', "timestamptz '2026-10-27 13:00:00+00' AS hasta");
  if (esperado !== null) s = s.replace('NULL::int AS esperado', `${esperado} AS esperado`);
  return s;
}
async function correr(o: Opciones = {}, ventana: Ventana = true, esperado: number | null = 9): Promise<Fila[]> {
  await sembrar(o);
  return (await db.query<Fila>(preparar(readFileSync('SQL_34_07_el_agujero_de_discarded.sql', 'utf8'), ventana, esperado))).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c, x.d]);
const control = (f: Fila[]) => de(f, '0 · control').map(x => [x[0], x[1]]);
const ok = (f: Fila[]) => control(f).map(x => x[1]);

describe('SQL_34_07, el agujero de «discarded»', () => {
  it('LOS CONTROLES: la organización primero; la pasada 6 sin registro hace FALLAR el 5; el control positivo, OK', async () => {
    const f = await correr();
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 2 documentos`);
    expect(control(f)).toEqual([
      ['ventana: 27/10 11:00 a 27/10 14:00 (hora de Madrid)', 'OK'],
      ['pasadas de NOR-11 en la ventana: 9 · esperado: 9', 'OK'],
      ['pasadas que no son rápidas: 0', 'OK'],
      ['documentos CLI-12 en la organización: 1 (tiene que ser uno)', 'OK'],
      ['pasadas con el registro por llamada: 8 de 9 · que pasaron su guarda de 200: 0', '⚠️⚠️ FALLA'],
      ['CONTROL POSITIVO · pasadas con «discarded» y una petición del juez a CLI-12 con 200: 1 de 1', 'OK'],
    ]);
  });

  it('EL VEREDICTO DE CADA PASADA, por cada camino, con lo que lo decidió', async () => {
    expect(de(await correr(), '1 · por pasada').map(x => [x[0], x[1], x[2]])).toEqual([
      ['pasada 1 · 27/10 11:10:00', 'con «discarded»: no es un agujero', 'juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0'],
      ['pasada 2 · 27/10 11:20:00', 'CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada', 'juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0'],
      ['pasada 3 · 27/10 11:30:00', 'CERO REAL: el juez contestó a CLI-12 y el análisis no registra ninguna caída del juez', 'juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0'],
      ['pasada 4 · 27/10 11:40:00', 'JUEZ CAÍDO: la última petición del juez a CLI-12 no contestó 200', 'juez a CLI-12: 2 peticiones, 0 con 200, la última: http · caídas del juez en el análisis: 1'],
      ['pasada 5 · 27/10 11:50:00', 'NO SE DISTINGUE: CLI-12 contestó 200, el juicio tiene la forma del de reserva y hubo 1 caída(s) del juez en el análisis', 'juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 1'],
      ['pasada 6 · 27/10 12:00:00', 'NO SE SABE: el análisis no guarda el registro por llamada', 'juez a CLI-12: 0 peticiones, 0 con 200, la última: ninguna · caídas del juez en el análisis: 0'],
      ['pasada 7 · 27/10 12:10:00', 'NO SE SABE: el registro no tiene ninguna petición del juez a CLI-12', 'juez a CLI-12: 0 peticiones, 0 con 200, la última: ninguna · caídas del juez en el análisis: 0'],
      ['pasada 8 · 27/10 12:20:00', 'SIN JUICIO DE CLI-12', 'juez a CLI-12: 0 peticiones, 0 con 200, la última: ninguna · caídas del juez en el análisis: 0'],
      ['pasada 9 · 27/10 12:30:00', 'CERO REAL: el juez contestó a CLI-12 y el análisis no registra ninguna caída del juez', 'juez a CLI-12: 2 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0'],
    ]);
  });

  it('LA FORMA DEL JUICIO Y EL DETALLE DE LAS CAÍDAS, sólo las del juez', async () => {
    const d = de(await correr(), '1 · por pasada').map(x => x[3]);
    expect(d[1]).toBe('el juicio de CLI-12: tema_similar · solape 20 % · contradicciones 0 · solapes 0 · únicos 0');
    expect(d[2]).toBe('el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 0');
    expect(d[3]).toBe('el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 0 · caídas: HTTP 529: overloaded');
    expect(d[4]).toBe('el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 0 · caídas: JSON inválido');
    expect(d[7]).toBe('el juicio de CLI-12: ninguno');
  });

  it('EL TOTAL: cuántos agujeros son cada cosa', async () => {
    expect(de(await correr(), '2 · el total')).toEqual([
      ['agujeros: 8 · cero real: 3 · juez caído: 1 · no se distingue: 1 · no se sabe: 3', null, null, null],
    ]);
  });

  it('UN JUICIO CON OTRO VEREDICTO, SOLAPE, CONTRADICCIONES, SOLAPES O ÚNICOS, cada uno por su cuenta, no es el de reserva', async () => {
    for (const extra of [{ verdict: 'tema_similar' }, { overlapPercent: 15 }, { contradictions: [{}] }, { overlappingContent: [{}] }, { uniqueToNewDoc: ['x'] }]) {
      await sembrar();
      await db.query("UPDATE analysis_results SET analysis = jsonb_set(analysis, '{judgments,0}', analysis->'judgments'->0 || $1::jsonb) WHERE created_at = '2026-10-27T10:50:00Z'", [JSON.stringify(extra)]);
      const f = (await db.query<Fila>(preparar(readFileSync('SQL_34_07_el_agujero_de_discarded.sql', 'utf8'), true, 9))).rows;
      expect(de(f, '1 · por pasada')[4][1]).toBe('CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada');
    }
  });

  it('⚠️ EL CONTROL POSITIVO FALLA si el registro no tiene el 200 del juez a CLI-12 donde «discarded» dice que contestó', async () => {
    const f = await correr({ controlRoto: true, sinLaSeis: true }, true, 8);
    expect(control(f)[5]).toEqual(['CONTROL POSITIVO · pasadas con «discarded» y una petición del juez a CLI-12 con 200: 0 de 1', '⚠️⚠️ FALLA']);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR, fallan: un solo extremo, la guarda pasada, una exhaustiva, dos CLI-12, dos pertenencias, el esperado mal', async () => {
    expect(ok(await correr({}, 'solo_desde', null))).toEqual(['⚠️⚠️ FALLA', 'NO APLICA', 'NO APLICA', 'OK', 'NO APLICA', 'NO APLICA']);
    expect(ok(await correr({ sinLaSeis: true }, true, 8))).toEqual(['OK', 'OK', 'OK', 'OK', 'OK', 'OK']);
    expect(control(await correr({ sinLaSeis: true, guarda: true }, true, 8))[4]).toEqual(['pasadas con el registro por llamada: 8 de 8 · que pasaron su guarda de 200: 1', '⚠️⚠️ FALLA']);
    expect(ok(await correr({ exhaustiva: true }))[2]).toBe('⚠️⚠️ FALLA');
    expect(ok(await correr({ dosCli12: true }))[3]).toBe('⚠️⚠️ FALLA');
    expect(ok(await correr({}, true, 7))[1]).toBe('⚠️⚠️ FALLA');
    const g = await correr({ dosPertenencias: true });
    expect(g[0].a).toMatch(/^⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario .* tiene 2 pertenencias/);
    expect(de(g, '1 · por pasada')).toEqual([]);
  });
});
