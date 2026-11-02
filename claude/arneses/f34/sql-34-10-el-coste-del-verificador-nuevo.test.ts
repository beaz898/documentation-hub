import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { computeCostUsd } from '@/lib/observability/llm-pricing';

/**
 * EL ARNÉS DE SQL_34_10_el_coste_del_verificador_nuevo.sql (02/11/2026), en PGlite. Las tres ventanas rellenas se
 * siembran donde están; la de NOR-11 nueva va en nulo y no se mide. Cifras elegidas para calcularse a mano:
 *   · cada pasada de LÍNEA BASE (21 de NOR-10 y 13 de NOR-11): juez Haiku 5.5, 100.000 de entrada y 10.000 de salida
 *     = 0,015 $ (en NOR-11, 50.000 de entrada = 0,010 $, para que las dos bases no sean intercambiables); verificador Haiku 4.5, 2.000 y 500 = 0,0045 $ (latencia 2.000 ms, espera 500); rerank Haiku 4.5, 1.000 y
 *     100 = 0,0015 $. Total, 0,021 $. Duración: el verificador empieza a los 30.000 ms y acaba a los 32.500.
 *   · cada pasada de la TANDA NUEVA de NOR-10 (21): el mismo juez y el mismo rerank, y DOS peticiones del verificador de
 *     1.500 y 500 = 0,004 $ cada una (latencias 2.000 y 4.000), 0,008 $. Total, 0,0245 $; duración, 34.000 ms. La pasada
 *     1 lleva un juez de 200.000 de entrada (0,025 $, total 0,0345 $), y la 2 una petición del verificador fallida, sin
 *     tokens, de 1.000 ms.
 * Ruido: otra organización y NOR-12 dentro de la ventana nueva.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const H55 = 'claude-haiku-5-5', H45 = 'claude-haiku-4-5-20251001';
type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };
type Pet = { etapa?: string; modelo: string; te: number; ts: number; lat: number; esp?: number; com: number; resultado?: string };

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

interface Opciones {
  unaMenos?: boolean; exhaustiva?: boolean; dosPertenencias?: boolean; sinRegistro?: boolean; sinPrecio?: boolean;
  fueraDelDetalle?: boolean; sinEtapa?: boolean; verificadorConOtroNombre?: boolean;
}
const registro = (pets: Pet[], extra: Record<string, unknown> = {}) => ({
  llamadasAlModelo: {
    sinEtapa: 0, ...extra,
    peticiones: pets.map((p, i) => ({
      n: i + 1, ...(p.etapa === undefined ? {} : { etapa: p.etapa }), modelo: p.modelo, resultado: p.resultado ?? 'ok',
      tokens: { entrada: p.te, salida: p.ts, escrituraCache: 0, lecturaCache: 0 },
      latenciaMs: p.lat, esperaMs: p.esp ?? 0, comienzoMs: p.com,
    })),
  },
});
const juez = (te = 100_000): Pet => ({ etapa: 'juez', modelo: H55, te, ts: 10_000, lat: 30_000, com: 0 });
const rerank: Pet = { etapa: 'rerank', modelo: H45, te: 1_000, ts: 100, lat: 1_000, com: 100 };
const base = (te = 100_000) => registro([juez(te), rerank, { etapa: 'verificador', modelo: H45, te: 2_000, ts: 500, lat: 2_000, esp: 500, com: 30_000 }]);

async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES (gen_random_uuid(), $1, 'NOR-10_protocolo.docx')", [ORG]);
  const meter = (org: string, cuando: Date, doc: string, a: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando.toISOString(), doc, tipo, a]);
  const N10 = 'NOR-10_protocolo.docx', N11 = 'NOR-11_residuos.docx';
  // línea base de NOR-10: 21 desde el 30/10 a las 23:45 de Madrid (22:45 UTC), una cada media hora
  for (let i = 1; i <= 21; i++) await meter(ORG, new Date(Date.UTC(2026, 9, 30, 22, 45) + (i - 1) * 30 * 60_000), N10, base());
  // línea base de NOR-11: 13 desde el 28/10 a las 08:33 de Madrid (07:33 UTC)
  for (let i = 1; i <= 13; i++) await meter(ORG, new Date(Date.UTC(2026, 9, 28, 7, 33) + (i - 1) * 2 * 60_000), N11, base(50_000));
  // tanda nueva de NOR-10: 21 desde el 02/11 a las 17:54:03 de Madrid (16:54:03 UTC), una cada 90 s
  const n = o.unaMenos ? 20 : 21;
  for (let i = 1; i <= n; i++) {
    const verif = (lat: number): Pet => ({ etapa: o.verificadorConOtroNombre && i === 3 ? 'verify' : 'verificador', modelo: H45, te: 1_500, ts: 500, lat, com: 30_000 });
    const pets: Pet[] = [juez(i === 1 ? 200_000 : 100_000), rerank, verif(2_000), verif(4_000)];
    if (i === 2) pets.push({ etapa: 'verificador', modelo: H45, te: 0, ts: 0, lat: 1_000, com: 30_000, resultado: 'http' });
    if (i === 4 && o.sinPrecio) pets.push({ etapa: 'sintesis', modelo: 'claude-desconocido', te: 10, ts: 10, lat: 10, com: 0 });
    if (i === 5 && o.sinEtapa) pets.push({ modelo: H45, te: 10, ts: 10, lat: 10, com: 0 });
    const extra = i === 6 && o.fueraDelDetalle ? { fueraDelDetalle: { peticiones: 3 } } : {};
    const a = i === 7 && o.sinRegistro ? { pipelineCounters: {} } : registro(pets, extra);
    await meter(ORG, new Date(Date.UTC(2026, 10, 2, 16, 54, 3) + (i - 1) * 90_000), N10, a, i === 8 && o.exhaustiva ? 'exhaustive' : 'quick');
  }
  // ruido: otra organización y otro documento, dentro de la ventana nueva
  await meter(OTRA, new Date(Date.UTC(2026, 10, 2, 17, 0)), N10, registro([juez(9_000_000)]));
  await meter(ORG, new Date(Date.UTC(2026, 10, 2, 17, 0)), 'NOR-12_otro.docx', registro([juez(9_000_000)]));
}
async function correr(o: Opciones = {}): Promise<Fila[]> {
  await sembrar(o);
  return (await db.query<Fila>(readFileSync('SQL_34_10_el_coste_del_verificador_nuevo.sql', 'utf8').replaceAll('public.', ''))).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c, x.d]);
const control = (f: Fila[]) => de(f, '0 · control').map(x => [x[0], x[1]]);

describe('SQL_34_10, el coste de la tanda del verificador nuevo', () => {
  it('la tabla de precios del SQL es la de lib/observability/llm-pricing.ts', () => {
    const sql = readFileSync('SQL_34_10_el_coste_del_verificador_nuevo.sql', 'utf8');
    const filas = [...sql.matchAll(/\('(claude-[^']+)',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g)];
    expect(filas.length).toBe(3);
    for (const [, modelo, e, s, w, r] of filas) {
      const uno = (k: 'inputTokens' | 'outputTokens' | 'cacheCreationTokens' | 'cacheReadTokens') =>
        computeCostUsd(modelo, { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, [k]: 1_000_000 });
      expect([uno('inputTokens'), uno('outputTokens'), uno('cacheCreationTokens'), uno('cacheReadTokens')], modelo).toEqual([+e, +s, +w, +r]);
    }
  });

  it('LOS CONTROLES, en verde; la ventana de NOR-11 nueva, sin rellenar, NO APLICA', async () => {
    const f = await correr();
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 1 documentos`);
    expect(control(f)).toEqual([
      ['línea base · NOR-10 · pasadas en su ventana: 21 · esperado: 21', 'OK'],
      ['tanda nueva · NOR-10 · pasadas en su ventana: 21 · esperado: 21', 'OK'],
      ['línea base · NOR-11 · pasadas en su ventana: 13 · esperado: 13', 'OK'],
      ['tanda nueva · NOR-11 · pasadas en su ventana: 0 · esperado: 21 (sin ventana todavía: no se mide)', 'NO APLICA'],
      ['pasadas que no son rápidas: 0', 'OK'],
      ['pasadas sin registro por llamada (su coste no se puede medir): 0', 'OK'],
      ['peticiones con un modelo que no está en la tabla de precios: 0', 'OK'],
      ['pasadas con peticiones fuera del detalle o sin etapa (las cifras por etapa no serían el total): 0', 'OK'],
      ['CONTROL POSITIVO · pasadas medidas con alguna petición del verificador: 55 de 55', 'OK'],
    ]);
  });

  it('POR MEDICIÓN: el coste medio, el del verificador aparte, y la duración, calculados a mano', async () => {
    expect(de(await correr(), '1 · por medición')).toEqual([
      ['línea base · NOR-10 · 21 pasadas', 'coste medio por análisis 0.021000 $ (de 0.021000 a 0.021000) · total 0.441000 $',
        'verificador: 0.004500 $ por análisis · 21.4 % del coste · 1.00 peticiones por análisis · latencia media por petición 2000 ms',
        'duración media del análisis 32.5 s · peticiones que no salieron bien: 0 de 63'],
      // (0,0345 + 20 × 0,0245) / 21 = 0,5245 / 21 = 0,0249762; el verificador, 21 × 0,008 / 0,5245 = 32,03 %;
      // 43 peticiones en 21 pasadas = 2,05; latencia (21 × 6.000 + 1.000) / 43 = 2.953,5 → 2953
      ['tanda nueva · NOR-10 · 21 pasadas', 'coste medio por análisis 0.024976 $ (de 0.024500 a 0.034500) · total 0.524500 $',
        'verificador: 0.008000 $ por análisis · 32.0 % del coste · 2.05 peticiones por análisis · latencia media por petición 2953 ms',
        'duración media del análisis 34.0 s · peticiones que no salieron bien: 1 de 85'],
      // NOR-11: 0,010 + 0,0045 + 0,0015 = 0,016 por pasada; el verificador, 0,0045 / 0,016 = 28,1 %
      ['línea base · NOR-11 · 13 pasadas', 'coste medio por análisis 0.016000 $ (de 0.016000 a 0.016000) · total 0.208000 $',
        'verificador: 0.004500 $ por análisis · 28.1 % del coste · 1.00 peticiones por análisis · latencia media por petición 2000 ms',
        'duración media del análisis 32.5 s · peticiones que no salieron bien: 0 de 39'],
    ]);
  });

  it('POR ETAPA, de la más cara a la más barata; y LA TANDA NUEVA FRENTE A SU BASE', async () => {
    const f = await correr();
    expect(de(f, '2 · por etapa')).toEqual([
      ['línea base · NOR-10', 'juez', '0.015000 $ por análisis · 71.4 % del coste', '1.00 peticiones por análisis'],
      ['línea base · NOR-10', 'verificador', '0.004500 $ por análisis · 21.4 % del coste', '1.00 peticiones por análisis'],
      ['línea base · NOR-10', 'rerank', '0.001500 $ por análisis · 7.1 % del coste', '1.00 peticiones por análisis'],
      // juez: (0,025 + 20 × 0,015) / 21 = 0,015476; 0,325 / 0,5245 = 61,96 %
      ['tanda nueva · NOR-10', 'juez', '0.015476 $ por análisis · 62.0 % del coste', '1.00 peticiones por análisis'],
      ['tanda nueva · NOR-10', 'verificador', '0.008000 $ por análisis · 32.0 % del coste', '2.05 peticiones por análisis'],
      ['tanda nueva · NOR-10', 'rerank', '0.001500 $ por análisis · 6.0 % del coste', '1.00 peticiones por análisis'],
      ['línea base · NOR-11', 'juez', '0.010000 $ por análisis · 62.5 % del coste', '1.00 peticiones por análisis'],
      ['línea base · NOR-11', 'verificador', '0.004500 $ por análisis · 28.1 % del coste', '1.00 peticiones por análisis'],
      ['línea base · NOR-11', 'rerank', '0.001500 $ por análisis · 9.4 % del coste', '1.00 peticiones por análisis'],
    ]);
    // (0,0249762 − 0,021) / 0,021 = +18,9 %; el verificador, (0,008 − 0,0045) / 0,0045 = +77,8 %
    expect(de(f, '3 · nueva frente a base')).toEqual([
      ['NOR-10', 'coste medio por análisis: 0.021000 → 0.024976 $ (+18.9 %)', 'verificador: 0.004500 → 0.008000 $ (+77.8 %)', 'duración media: 32.5 → 34.0 s'],
    ]);
  });

  it('⚠️ EL CONTROL POSITIVO FALLA si la etapa del verificador se llama de otra forma en una pasada', async () => {
    expect(control(await correr({ verificadorConOtroNombre: true }))[8]).toEqual(['CONTROL POSITIVO · pasadas medidas con alguna petición del verificador: 54 de 55', '⚠️⚠️ FALLA']);
  });

  it('LOS DEMÁS CONTROLES QUE PUEDEN FALLAR, fallan', async () => {
    expect(control(await correr({ unaMenos: true }))[1]).toEqual(['tanda nueva · NOR-10 · pasadas en su ventana: 20 · esperado: 21', '⚠️⚠️ FALLA']);
    expect(control(await correr({ exhaustiva: true }))[4]).toEqual(['pasadas que no son rápidas: 1', '⚠️⚠️ FALLA']);
    expect(control(await correr({ sinRegistro: true }))[5]).toEqual(['pasadas sin registro por llamada (su coste no se puede medir): 1', '⚠️⚠️ FALLA']);
    expect(control(await correr({ sinPrecio: true }))[6]).toEqual(['peticiones con un modelo que no está en la tabla de precios: 1 (claude-desconocido)', '⚠️⚠️ FALLA']);
    expect(control(await correr({ fueraDelDetalle: true }))[7]).toEqual(['pasadas con peticiones fuera del detalle o sin etapa (las cifras por etapa no serían el total): 1', '⚠️⚠️ FALLA']);
    const g = await correr({ dosPertenencias: true });
    expect(g[0].a).toMatch(/^⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario .* tiene 2 pertenencias/);
    expect(de(g, '1 · por medición')).toEqual([]);
  });

  it('UNA PETICIÓN SIN ETAPA cuenta como «sin_etapa» y hace caer el control 23', async () => {
    const f = await correr({ sinEtapa: true });
    expect(control(f)[7]).toEqual(['pasadas con peticiones fuera del detalle o sin etapa (las cifras por etapa no serían el total): 1', '⚠️⚠️ FALLA']);
    expect(de(f, '2 · por etapa').some(x => x[0] === 'tanda nueva · NOR-10' && x[1] === 'sin_etapa')).toBe(true);
  });
});
