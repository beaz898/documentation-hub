import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { poner } from '../f128/textos';

/**
 * EL ARNÉS DE `SQL_313_01_la_ventana_doble_en_la_tanda.sql` (3.1.3, 22/10/2026), en PGlite. Filas sintéticas
 * y sólo números: diez pasadas con la forma de la tanda (siete de NOR-11 contra CLI-13, tres de NOR-10 contra
 * CLI-12), con cifras calculadas a mano, y una situación por control para que cada uno caiga donde debe —un
 * control que nunca cae no vigila nada—. Y ruido que no tiene que contar: otra organización, otro documento y
 * una pasada fuera de la ventana.
 */
const ORG = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const CLI13 = '13131313-1313-1313-1313-131313131313', CLI12 = '12121212-1212-1212-1212-121212121212', CLI20 = '20202020-2020-2020-2020-202020202020';

type Lectura = Record<string, unknown>;
const entera = (extra: Lectura = {}): Lectura => ({
  documentId: CLI13, regimen: 'pareja_entera', analizado: { caracteres: 14704, mostrados: 14704, dejoFuera: false },
  candidato: { caracteres: 9817, mostrados: 9817, dejoFuera: false }, presupuesto: 80000, modelo: 'claude-haiku-5-5',
  tokensDeSalida: 3000, trozosDelCandidato: 12, ...extra,
});
const corte = (extra: Lectura = {}): Lectura => ({
  documentId: CLI12, regimen: 'corte_honesto', analizado: { caracteres: 66801, mostrados: 66801, dejoFuera: false },
  candidato: { caracteres: 55135, mostrados: 12771, dejoFuera: true }, presupuesto: 80000, modelo: 'claude-haiku-5-5',
  tokensDeSalida: 7000, seleccion: 'ampliada', trozosDelCandidato: 12, ...extra,
});
/** El registro: un rerank de 1.000 ms que empieza en 0 y el juez de la pareja, que empieza en 1.000. */
const registro = (pareja: string, latJuez: number, reintento = false) => ({
  peticiones: [
    { n: 1, etapa: 'rerank', latenciaMs: 1000, esperaMs: 0, comienzoMs: 0, tokens: { salida: 100 } },
    ...(reintento ? [{ n: 2, etapa: 'juez', pareja, latenciaMs: 500, esperaMs: 0, comienzoMs: 1000, tokens: { salida: 0 } }] : []),
    { n: 3, etapa: 'juez', pareja, latenciaMs: latJuez, esperaMs: reintento ? 2000 : 0, comienzoMs: reintento ? 1500 : 1000, tokens: { salida: 6000 } },
  ],
  sinEtapa: 0, fueraDelDetalle: null,
});
interface Pasada { doc: 'NOR-11' | 'NOR-10'; minuto: number; lecturas: Lectura[]; registro?: unknown; org?: string }
const conDosParejas = (): Pasada => {
  const r = registro(CLI13, 20000);
  r.peticiones.push({ n: 4, etapa: 'juez', pareja: CLI20, latenciaMs: 5000, esperaMs: 0, comienzoMs: 1000, tokens: { salida: 800 } });
  return { doc: 'NOR-11', minuto: 6, lecturas: [entera(), entera({ documentId: CLI20, tokensDeSalida: 800, trozosDelCandidato: 3 })], registro: r };
};
const tanda = (): Pasada[] => [
  ...Array.from({ length: 6 }, (_, i): Pasada => ({ doc: 'NOR-11', minuto: i, lecturas: [entera()], registro: registro(CLI13, 20000) })),
  conDosParejas(),
  ...Array.from({ length: 3 }, (_, i): Pasada => ({ doc: 'NOR-10', minuto: 10 + i, lecturas: [corte()], registro: registro(CLI12, 30000, i === 0) })),
];

interface Fila { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null }
async function correr(pasadas: Pasada[]): Promise<Fila[]> {
  const db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis jsonb);
                 CREATE TABLE documents (id uuid, name text);`);
  await db.query('INSERT INTO documents VALUES ($1, $2), ($3, $4), ($5, $6)', [CLI13, 'CLI-13_instrucciones.docx', CLI12, 'CLI-12_manual.docx', CLI20, 'CLI-20_x.docx']);
  const meter = (org: string, cuando: string, nombre: string, analysis: unknown) =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis) VALUES ($1,$2,$3,$4)', [org, cuando, nombre, analysis]);
  for (const p of pasadas)
    await meter(p.org ?? ORG, new Date(Date.UTC(2026, 9, 22, 10, p.minuto)).toISOString(), `${p.doc}_x.docx`,
      { lecturaDeLasParejas: p.lecturas, ...(p.registro ? { llamadasAlModelo: p.registro } : {}) });
  // ruido: otra organización, otro documento y una pasada de NOR-11 antes de DESDE
  await meter('otra', '2026-10-22T10:30:00Z', 'NOR-11_x.docx', { lecturaDeLasParejas: [entera({ regimen: 'tijera_vieja' })] });
  await meter(ORG, '2026-10-22T10:31:00Z', 'OPE-10_x.docx', { lecturaDeLasParejas: [entera({ regimen: 'tijera_vieja' })] });
  await meter(ORG, '2026-10-22T07:00:00Z', 'NOR-11_x.docx', { lecturaDeLasParejas: [entera({ regimen: 'tijera_vieja' })] });
  let sql = readFileSync('SQL_313_01_la_ventana_doble_en_la_tanda.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS desde/, "timestamptz '2026-10-22 12:00:00+02' AS desde");
  sql = poner(sql, /timestamptz '[^']+' AS hasta/, "timestamptz '2026-10-22 13:00:00+02' AS hasta");
  const filas = (await db.query<Fila>(sql)).rows;
  await db.close();
  return filas;
}
const controles = (f: Fila[]) => f.filter(x => x.bloque.startsWith('0')).map(x => `${x.a} · ${x.b}`);
const fallas = (f: Fila[]) => controles(f).filter(c => !c.startsWith('OK'));

describe('SQL_313_01, la ventana doble en la tanda', () => {
  it('la tanda entera: los seis controles OK, la predicción acierta tres veces y las cifras salen como a mano', async () => {
    const f = await correr(tanda());
    expect(fallas(f)).toEqual([]);
    expect(controles(f)).toHaveLength(6);
    expect(f.filter(x => x.bloque.startsWith('2 ·')).map(x => x.a)).toEqual(['ACIERTA', 'ACIERTA', 'ACIERTA']);
    const pareja = f.find(x => x.bloque.startsWith('1 ·') && x.pasada === 'NOR-10 1')!;
    expect(pareja.a).toBe('CLI-12_manual.docx');
    expect(pareja.b).toBe('corte_honesto · bloque ampliada · 12 trozos del candidato · candidato 12771/55135 · analizado 66801/66801 · ventana 80000');
    // la primera de NOR-10 lleva un reintento: 500 + 30.000 en dos peticiones, la más larga 30.000
    expect(pareja.c).toBe('claude-haiku-5-5 · salida 7000 tokens · juez 30500 ms en 2 petición(es), la más larga 30000 ms');
    const pasada = f.find(x => x.bloque.startsWith('3 ·') && x.pasada === 'NOR-10 1')!;
    expect(pasada.b).toBe('la petición del juez más larga: 30000 ms (21/10: 27718 ms) · salida del juez 6000 tokens');
    expect(pasada.c).toBe('duración de las llamadas del análisis: 33500 ms');                  // 1.500 + 2.000 de espera + 30.000 − 0
    expect(f.find(x => x.bloque.startsWith('3 ·') && x.pasada === 'NOR-11 7')!.c).toBe('duración de las llamadas del análisis: 21000 ms');
    expect(f.filter(x => x.bloque.startsWith('3 ·'))).toHaveLength(10);
    // la pasada con dos candidatos: una fila por pareja, cada una con SU juez
    expect(f.filter(x => x.bloque.startsWith('1 ·'))).toHaveLength(11);
    const dos = f.filter(x => x.bloque.startsWith('1 ·') && x.pasada === 'NOR-11 7').map(x => [x.a, x.c]);
    expect(dos).toEqual([
      ['CLI-13_instrucciones.docx', 'claude-haiku-5-5 · salida 3000 tokens · juez 20000 ms en 1 petición(es), la más larga 20000 ms'],
      ['CLI-20_x.docx', 'claude-haiku-5-5 · salida 800 tokens · juez 5000 ms en 1 petición(es), la más larga 5000 ms'],
    ]);
  }, 60_000);

  it('el control 4 cae también por la ventana sola: una pareja con los 40.000 de antes y su recuento de trozos', async () => {
    const t = tanda();
    t[2].lecturas = [entera({ presupuesto: 40000 })];
    const f = await correr(t);
    expect(fallas(f)).toHaveLength(1);
    expect(fallas(f)[0]).toMatch(/^FALLA · parejas sin trozosDelCandidato o con una ventana que no es 80.000: 1 de 11/);
  }, 60_000);

  it('la predicción que falla es una predicción fallada, no un control: los controles siguen OK', async () => {
    const t = tanda();
    t[8].lecturas = [corte({ trozosDelCandidato: 11 })];
    const f = await correr(t);
    expect(fallas(f)).toEqual([]);
    expect(f.filter(x => x.bloque.startsWith('2 ·')).map(x => x.a)).toEqual(['ACIERTA', 'FALLA', 'ACIERTA']);
  }, 60_000);

  it('cada control cae donde debe: 1, 3, 4 (las dos mitades), 5 y 6', async () => {
    const t = tanda();
    t.splice(0, 1);                                                                  // 1: seis de NOR-11
    t[0].lecturas = [entera({ regimen: 'tijera_vieja', presupuesto: null })];         // 3
    t[1].lecturas = [entera({ trozosDelCandidato: undefined })];                      // 4: sin trozos
    t[2].lecturas = [entera({ presupuesto: 40000 })];                                 // 4: la ventana vieja
    t[7].lecturas = [corte({ seleccion: undefined })];                                // 5
    t[8].registro = registro(CLI13, 1000);                                            // 6: el juez de otra pareja
    const f = await correr(t);
    const esperadas = ['FALLA · pasadas de NOR-11', 'FALLA · parejas leídas con la tijera vieja', 'FALLA · parejas sin trozosDelCandidato',
      'FALLA · parejas en corte honesto sin seleccion', 'FALLA · parejas sin su petición del juez'];
    expect(fallas(f)).toHaveLength(esperadas.length);
    esperadas.forEach((e, i) => expect(fallas(f)[i].startsWith(e)).toBe(true));
    expect(controles(f)[3]).toContain(': 2 de 10');
  }, 60_000);

  it('sin una sola pasada: el 1 y el 2 FALLAN y los que no tienen qué mirar salen NO APLICA, nunca OK', async () => {
    const f = await correr([]);
    expect(controles(f).map(c => c.split(' · ')[0])).toEqual(['FALLA', 'FALLA', 'NO APLICA', 'NO APLICA', 'NO APLICA', 'NO APLICA']);
  }, 60_000);
});
