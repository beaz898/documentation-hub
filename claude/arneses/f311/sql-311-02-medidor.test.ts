import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { poner, type Fila } from '../f128/textos';
import { computeCostUsd } from '@/lib/observability/llm-pricing';

/**
 * EL ARNÉS DE `SQL_311_02_el_medidor_por_llamada.sql` (3.1.1, paso 5, 21/10/2026), en PGlite.
 *
 * Un análisis SINTÉTICO de cinco peticiones —la forma del primero real, del 21/10: rerank, juez dos veces
 * en paralelo, verificador y síntesis— con cifras elegidas para que todo se pueda calcular a mano, y el
 * cálculo escrito al lado de cada aserción. Una situación por control, para que cada uno caiga donde debe.
 * Y la tabla de precios del SQL, comparada con la del código: son la misma regla en dos sitios.
 *
 * CUATRO BASES, NO UNA POR PRUEBA (21/10): con once, el arnés solo tardaba ~30 s y la suite rozaba los
 * 90 s. Las pruebas de cálculo comparten la del análisis de cifras conocidas, y los tres controles que
 * se miran por análisis (3, 4 y 5) caen juntos en una base con tres análisis, uno roto de cada manera.
 */
// La organización se RESUELVE por el USUARIO (26/10/2026). USUARIO y ORG son DISTINTOS a propósito: en la base son el
// mismo número (código de antes del 27/04), y con el mismo número aquí, volver a leer el id del piloto como
// organización pasaría sin que nada lo notara. `pertenencias` es para los casos de la guarda, al final.
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA_ORG = '99999999-9999-9999-9999-999999999999';
let pertenencias = 1;
const H45 = 'claude-haiku-4-5-20251001', H55 = 'claude-haiku-5-5';
type P = { n: number; etapa: string; modelo: string; te: number; ts: number; tw?: number; tr?: number; lat: number; esp: number; com: number; est?: number; resultado?: string };
const pet = (p: P) => ({
  n: p.n, etapa: p.etapa, modelo: p.modelo, vuelta: 1, intento: 1, resultado: p.resultado ?? 'ok', estadoHttp: 200,
  latenciaMs: p.lat, esperaMs: p.esp, comienzoMs: p.com,
  tokens: { entrada: p.te, salida: p.ts, escrituraCache: p.tw ?? 0, lecturaCache: p.tr ?? 0 },
  ...(p.est !== undefined ? { entradaEstimada: p.est } : {}), ...(p.etapa === 'juez' ? { pareja: 'id-candidato' } : {}),
});
const CINCO: P[] = [
  { n: 1, etapa: 'rerank', modelo: H45, te: 1000, ts: 100, lat: 1000, esp: 50, com: 0, est: 1100 },
  { n: 2, etapa: 'juez', modelo: H55, te: 20000, ts: 3000, lat: 20000, esp: 10, com: 1100, est: 19000 },
  { n: 3, etapa: 'juez', modelo: H55, te: 18000, ts: 2500, lat: 18000, esp: 10, com: 1200, est: 17000 },
  { n: 4, etapa: 'verificador', modelo: H45, te: 4000, ts: 300, tw: 2000, tr: 1000, lat: 3000, esp: 5, com: 39500, est: 6500 },
  { n: 5, etapa: 'sintesis', modelo: H45, te: 1500, ts: 200, lat: 2000, esp: 0, com: 43000, est: 1600 },
];
const registro = (ps: P[], extra: Record<string, unknown> = {}) => ({ peticiones: ps.map(pet), sinEtapa: 0, fueraDelDetalle: null, ...extra });

async function correr(registros: unknown[]): Promise<Fila[]> {
  const db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis_type text, analysis jsonb);`);
  for (let i = 0; i < registros.length; i++)
    await db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
      [ORG, new Date(Date.UTC(2026, 9, 21, 12, i)).toISOString(), 'NOR-11.docx', 'quick', { llamadasAlModelo: registros[i] }]);
  // ruido: otra organización, y un análisis sin registro, que no cuentan
  await db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
    ['otra', '2026-10-21T12:30:00Z', 'X.docx', 'quick', { llamadasAlModelo: registro([{ ...CINCO[0], modelo: 'modelo-raro' }]) }]);
  await db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
    [ORG, '2026-10-21T12:40:00Z', 'Y.docx', 'quick', { discrepancies: [] }]);
  // LA PERTENENCIA (26/10/2026): la consulta resuelve la organización por el USUARIO; las tablas y la columna que
  // la guarda cuenta, por si el arnés no las tenía, y `pertenencias` filas de membresía, ni una más.
  await db.exec('CREATE TABLE IF NOT EXISTS memberships (user_id uuid, org_id uuid); CREATE TABLE IF NOT EXISTS organizations (id uuid, name text); ' +
    'CREATE TABLE IF NOT EXISTS documents (id uuid, org_id text); ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id text; ' +
    'DELETE FROM memberships; DELETE FROM organizations;');
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  for (let i = 0; i < pertenencias; i++) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, i === 0 ? ORG : OTRA_ORG]);
  let sql = readFileSync('SQL_311_02_el_medidor_por_llamada.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS desde/, "timestamptz '2026-10-21 00:00:00+02' AS desde");
  sql = poner(sql, /timestamptz '[^']+' AS hasta/, "timestamptz '2026-10-22 00:00:00+02' AS hasta");
  const filas = (await db.query<Fila>(sql)).rows;
  await db.close();
  return filas;
}
const bloque = (f: Fila[], p: string) => f.filter(x => x.bloque.startsWith(p));
const fallas = (f: Fila[]) => bloque(f, '0').filter(x => x.a !== 'OK').map(x => `${x.a} · ${x.b}`);

let base: Fila[] = [], vacia: Fila[] = [], sinPrecio: Fila[] = [], rotos: Fila[] = [];
beforeAll(async () => {
  [base, vacia, sinPrecio, rotos] = await Promise.all([
    correr([registro(CINCO)]),
    correr([]),
    correr([registro([...CINCO, { n: 6, etapa: 'juez', modelo: 'claude-desconocido', te: 10, ts: 1, lat: 1, esp: 0, com: 1 }])]),
    correr([
      registro(CINCO, { fueraDelDetalle: { peticiones: 3, tokens: { entrada: 1, salida: 1, escrituraCache: 0, lecturaCache: 0 }, latenciaMs: 1, esperaMs: 0 } }),
      registro(CINCO, { sinEtapa: 2 }),
      registro([...CINCO, { n: 6, etapa: 'juez', modelo: H55, te: 0, ts: 0, lat: 5, esp: 0, com: 1 },
        { n: 7, etapa: 'juez', modelo: H55, te: 0, ts: 0, lat: 5, esp: 0, com: 1, resultado: 'http' }]),
    ]),
  ]);
}, 120_000);

describe('SQL_311_02, el medidor del registro por llamada', () => {
  it('la tabla de precios del SQL es la de lib/observability/llm-pricing.ts', () => {
    const sql = readFileSync('SQL_311_02_el_medidor_por_llamada.sql', 'utf8');
    const filas = [...sql.matchAll(/\('(claude-[^']+)',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g)];
    expect(filas.length).toBe(3);
    for (const [, modelo, e, s, w, r] of filas) {
      // un millón de tokens de cada clase, uno a uno, cuesta exactamente su precio por millón
      const uno = (k: 'inputTokens' | 'outputTokens' | 'cacheCreationTokens' | 'cacheReadTokens') =>
        computeCostUsd(modelo, { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, [k]: 1_000_000 });
      expect([uno('inputTokens'), uno('outputTokens'), uno('cacheCreationTokens'), uno('cacheReadTokens')], modelo).toEqual([+e, +s, +w, +r]);
    }
  });

  it('con el análisis de cifras conocidas: todos los controles OK, y la otra organización y el análisis sin registro no cuentan', () => {
    const f = base;
    expect(fallas(f)).toEqual([]);
    expect(bloque(f, '0')[0].b).toBe('análisis con registro por llamada entre DESDE y HASTA: 1');
  });

  it('(c) el coste por etapa y su porcentaje, calculados a mano', () => {
    const f = base;
    const etapa = (e: string) => bloque(f, '2 ·').find(x => x.a === e)?.c ?? '';
    // rerank: (1.000×1 + 100×5)/1e6 = 0,0015 · juez: (20.000×0,1 + 3.000×0,5 + 18.000×0,1 + 2.500×0,5)/1e6 = 0,00655
    // verificador: (4.000×1 + 300×5 + 2.000×1,25 + 1.000×0,1)/1e6 = 0,0081 · síntesis: (1.500×1 + 200×5)/1e6 = 0,0025
    // total 0,01865 → el juez, el 35,1 %
    expect(etapa('rerank')).toContain('coste 0.001500 $ · 8.0 % del análisis');
    expect(etapa('juez')).toContain('coste 0.006550 $ · 35.1 % del análisis');
    expect(etapa('verificador')).toContain('coste 0.008100 $ · 43.4 % del análisis');
    expect(etapa('sintesis')).toContain('coste 0.002500 $ · 13.4 % del análisis');
    expect(bloque(f, '3 ·')[0].c).toContain('coste 0.018650 $');
  });

  it('(d) la caché: lo escrito, lo leído y el ahorro de verdad', () => {
    const f = base;
    // sin caché, los 3.000 tokens habrían costado 3.000×1/1e6 = 0,003; con ella, 2.000×1,25 + 1.000×0,1 = 0,0026 → ahorro 0,0004
    expect(bloque(f, '2 ·').find(x => x.a === 'verificador')?.c).toContain('ahorro de la caché 0.000400 $');
    expect(bloque(f, '3 ·')[0].c).toContain('caché escrita 2000 · leída 1000 · ahorro 0.000400 $');
  });

  it('(e) y (f) la DURACIÓN al lado del TRABAJO, y el reparto entre petición y espera', () => {
    const f = base;
    // duración: del comienzo 0 al último final, 43.000 + 0 + 2.000 = 45.000 ms
    // trabajo: (50+1.000) + (10+20.000) + (10+18.000) + (5+3.000) + (0+2.000) = 44.075 ms; en petición 44.000, en espera 75
    expect(bloque(f, '3 ·')[0].b).toBe('DURACIÓN 45000 ms · TRABAJO (suma de las entradas) 44075 ms · en petición 44000 ms (99.8 %) · en espera 75 ms (0.2 %)');
  });

  it('(b) los dos ÷4: la estimada contra la real (entrada + caché), petición a petición y resumida', () => {
    const f = base;
    const prop = bloque(f, '1 ·').map(x => /proporción estimada\/real ([\d.—]+)/.exec(x.c ?? '')?.[1]);
    // 1.100/1.000 · 19.000/20.000 · 17.000/18.000 · 6.500/(4.000+2.000+1.000) · 1.600/1.500
    expect(prop).toEqual(['1.100', '0.950', '0.944', '0.929', '1.067']);
    expect(bloque(f, '4 ·')[0].b).toBe('proporción estimada/real · mínima 0.929 · mediana 0.950 · máxima 1.100');
    expect(bloque(f, '4 ·')[0].c).toBe('suma estimada 45200 · suma real 47500');
  });

  it('CONTROL 1: sin ningún análisis con registro, NO APLICA y no OK', () => {
    expect(bloque(vacia, '0').map(x => x.a)).toEqual(['NO APLICA', 'OK']);
  });

  it('CONTROL 2: un modelo sin precio cae, en vez de costar cero en silencio', () => {
    expect(fallas(sinPrecio)).toEqual(['FALLA · peticiones con un modelo que no está en la tabla de precios: 1 (claude-desconocido)']);
  });

  it('CONTROLES 3, 4 y 5, cada uno en su análisis: lo que pasó de la guarda, una llamada sin etapa, y una petición que salió bien sin tokens (la que falló, no)', () => {
    expect(fallas(rotos)).toEqual([
      'FALLA · análisis 1: nada fuera del detalle (si lo hay, las cifras por petición no son el total): 3',
      'FALLA · análisis 2: sinEtapa = 2',
      'FALLA · análisis 3: peticiones que salieron bien y no traen ningún token de entrada: 1',
    ]);
  });
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
