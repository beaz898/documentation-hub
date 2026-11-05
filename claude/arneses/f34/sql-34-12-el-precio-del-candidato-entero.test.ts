import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_12_el_precio_del_candidato_entero.sql (05/11/2026). En PGlite, una llm_usage con filas SINTÉTICAS:
 * los exhaustivos del 28/09 de la organización del piloto antes, dentro y después de la ventana de 14.676 (hora de
 * Madrid, CEST = UTC+2), un rápido, filas de otro día y de otra organización (ruido que no se puede leer), y una
 * operación que no es de análisis. Una base por fichero, vaciada entre casos.
 */
const PILOTO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const OTRA = '00000000-0000-0000-0000-00000000bbbb';
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE llm_usage (id uuid DEFAULT gen_random_uuid(), created_at timestamptz, org_id uuid, user_id uuid, operation text,
      model text, input_tokens int, output_tokens int, cache_write_tokens int, cache_read_tokens int, cost_usd numeric(12,8),
      credits_charged int);`);
}, 120_000);
afterAll(async () => { await db.close(); });

type Fila = [string, string, string, string, number, number, number];   // utc, org, operación, modelo, entrada, salida, coste
async function sembrar(filas: Fila[]) {
  await db.exec('DELETE FROM llm_usage;');
  for (const [utc, org, op, modelo, ent, sal, coste] of filas)
    await db.query(`INSERT INTO llm_usage (created_at, org_id, operation, model, input_tokens, output_tokens, cache_write_tokens,
      cache_read_tokens, cost_usd, credits_charged) VALUES ($1,$2,$3,$4,$5,$6,0,0,$7,30)`, [utc, org, op, modelo, ent, sal, coste]);
}
const consulta = () => readFileSync('SQL_34_12_el_precio_del_candidato_entero.sql', 'utf8').replaceAll('public.', '');
const correr = async () => (await db.query<{ bloque: string; linea: string }>(consulta())).rows;
const H = 'claude-haiku-5-5', S = 'claude-sonnet-4-6';
const NORMAL: Fila[] = [
  // la mañana, con 3.000: un exhaustivo (dos filas a la misma hora) a las 10:05 de Madrid = 08:05 UTC
  ['2026-09-28T08:05:00Z', PILOTO, 'analyze_exhaustive', H, 20000, 3000, 0.04],
  ['2026-09-28T08:05:00Z', PILOTO, 'analyze_exhaustive', S, 5000, 800, 0.03],
  // la ventana de 14.676: dos exhaustivos, 13:22:32 y 13:23:16 de Madrid
  ['2026-09-28T11:22:32Z', PILOTO, 'analyze_exhaustive', H, 50000, 4000, 0.09],
  ['2026-09-28T11:22:32Z', PILOTO, 'analyze_exhaustive', S, 9000, 900, 0.05],
  ['2026-09-28T11:23:16Z', PILOTO, 'analyze_exhaustive', H, 52000, 4100, 0.10],
  // después de la ventana: 13:40 de Madrid
  ['2026-09-28T11:40:00Z', PILOTO, 'analyze_exhaustive', H, 21000, 2900, 0.05],
  // un rápido del mismo día, y ruido: otro día, otra organización, otra operación
  ['2026-09-28T09:00:00Z', PILOTO, 'analyze_quick', H, 8000, 1000, 0.02],
  ['2026-09-27T11:22:00Z', PILOTO, 'analyze_exhaustive', H, 99999, 9999, 9.99],
  ['2026-09-28T11:22:40Z', OTRA, 'analyze_exhaustive', H, 77777, 7777, 7.77],
  ['2026-09-28T11:21:00Z', PILOTO, 'chat', H, 500, 100, 0.001],
];

describe('SQL_34_12, el precio del candidato entero', () => {
  it('LOS CONTROLES: el id viejo, cuántas filas y de qué fecha a qué fecha, que llegan al 28/09, y la duración NO medible', async () => {
    await sembrar(NORMAL);
    const c = (await correr()).filter(r => r.bloque === '0 · control').map(r => r.linea);
    expect(c[0]).toBe(`id leído (organización del piloto, el viejo): ${PILOTO}`);
    expect(c[1]).toBe('filas de la organización en llm_usage: 9 · de 27/09/2026 13:22 a 28/09/2026 13:40 (hora de Madrid)');
    expect(c[2]).toBe('¿llegan al 28/09/2026? SÍ: 8 filas ese día, de cualquier operación');
    expect(c[3]).toContain('la DURACIÓN no se puede medir');
  });

  it('POR ANÁLISIS: un grupo por hora, en hora de Madrid y con su ventana; ni otro día, ni otra organización, ni el chat', async () => {
    await sembrar(NORMAL);
    const a = (await correr()).filter(r => r.bloque === '1 · por análisis').map(r => r.linea);
    expect(a).toEqual([
      '10:05:00 · analyze_exhaustive · 1 · antes de las 13:20 (presupuesto 3.000) · 2 filas (claude-haiku-5-5 + claude-sonnet-4-6) · entrada 25000 · salida 3800 · caché 0/0 · 0.070000 $ · créditos 30',
      '11:00:00 · analyze_quick · 1 · antes de las 13:20 (presupuesto 3.000) · 1 filas (claude-haiku-5-5) · entrada 8000 · salida 1000 · caché 0/0 · 0.020000 $ · créditos 30',
      '13:22:32 · analyze_exhaustive · 2 · de 13:20 a 13:26 (presupuesto 14.676) · 2 filas (claude-haiku-5-5 + claude-sonnet-4-6) · entrada 59000 · salida 4900 · caché 0/0 · 0.140000 $ · créditos 30',
      '13:23:16 · analyze_exhaustive · 2 · de 13:20 a 13:26 (presupuesto 14.676) · 1 filas (claude-haiku-5-5) · entrada 52000 · salida 4100 · caché 0/0 · 0.100000 $ · créditos 30',
      '13:40:00 · analyze_exhaustive · 3 · después de las 13:26 (presupuesto 3.000) · 1 filas (claude-haiku-5-5) · entrada 21000 · salida 2900 · caché 0/0 · 0.050000 $ · créditos 30',
    ]);
  });

  it('POR VENTANA: sólo exhaustivos, con cuántos, el total y el medio', async () => {
    await sembrar(NORMAL);
    const v = (await correr()).filter(r => r.bloque === '2 · por ventana').map(r => r.linea);
    expect(v).toEqual([
      '1 · antes de las 13:20 (presupuesto 3.000) · exhaustivos: 1 · coste total 0.070000 $ · medio 0.070000 $ · entrada media 25000 tokens',
      '2 · de 13:20 a 13:26 (presupuesto 14.676) · exhaustivos: 2 · coste total 0.240000 $ · medio 0.120000 $ · entrada media 55500 tokens',
      '3 · después de las 13:26 (presupuesto 3.000) · exhaustivos: 1 · coste total 0.050000 $ · medio 0.050000 $ · entrada media 21000 tokens',
    ]);
  });

  it('⚠️ SIN FILAS ESE DÍA lo dice, y no inventa ningún precio', async () => {
    await sembrar(NORMAL.filter(f => !f[0].startsWith('2026-09-28')));
    const r = await correr();
    expect(r.find(x => x.bloque === '0 · control' && x.linea.startsWith('¿llegan'))?.linea).toBe('¿llegan al 28/09/2026? NO: ninguna fila ese día. EL PRECIO DE F-118 NO SE PUEDE SACAR DE AQUÍ');
    expect(r.filter(x => x.bloque !== '0 · control')).toEqual([]);
  });

  it('⚠️ CON EL ID SIN FILAS lo dice a gritos, en vez de devolver una tabla vacía que parezca un resultado', async () => {
    await sembrar(NORMAL.filter(f => f[1] !== PILOTO));
    const c = (await correr()).filter(r => r.bloque === '0 · control').map(r => r.linea);
    expect(c[1]).toBe('filas de la organización en llm_usage: 0 — ⚠️ NINGUNA: el id no lee nada y todo lo de abajo está vacío');
  });

  it('LOS BORDES DE LA VENTANA, en hora de Madrid: 13:19:59 va antes, 13:20:00 y 13:26:59 dentro, 13:27:00 después', async () => {
    await sembrar([
      ['2026-09-28T11:19:59Z', PILOTO, 'analyze_exhaustive', H, 1, 1, 0.01],
      ['2026-09-28T11:20:00Z', PILOTO, 'analyze_exhaustive', H, 1, 1, 0.01],
      ['2026-09-28T11:26:59Z', PILOTO, 'analyze_exhaustive', H, 1, 1, 0.01],
      ['2026-09-28T11:27:00Z', PILOTO, 'analyze_exhaustive', H, 1, 1, 0.01],
    ]);
    const a = (await correr()).filter(r => r.bloque === '1 · por análisis').map(r => r.linea.split(' · ').slice(0, 4).join(' · ')); // la ventana lleva un « · » dentro
    expect(a).toEqual([
      '13:19:59 · analyze_exhaustive · 1 · antes de las 13:20 (presupuesto 3.000)',
      '13:20:00 · analyze_exhaustive · 2 · de 13:20 a 13:26 (presupuesto 14.676)',
      '13:26:59 · analyze_exhaustive · 2 · de 13:20 a 13:26 (presupuesto 14.676)',
      '13:27:00 · analyze_exhaustive · 3 · después de las 13:26 (presupuesto 3.000)',
    ]);
  });
});
