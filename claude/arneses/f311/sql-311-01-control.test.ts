import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { poner, type Fila } from '../f128/textos';

/**
 * EL ARNÉS DE `SQL_311_01_control_del_registro_por_llamada.sql` (3.1.1, paso 4, 21/10/2026), en PGlite.
 * Las filas son sintéticas y sólo números: el registro por llamada no lleva contenido. Cuatro
 * situaciones, y cada control tiene que caer donde debe —un control que nunca cae no vigila nada—.
 */
const ORG = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const SEIS = ['rerank', 'juez', 'verificador', 'double_check', 'sintesis', 'estilo'];
const peticion = (n: number, etapa: string, extra: Record<string, unknown> = {}) => ({
  n, etapa, modelo: 'claude-haiku-4-5-20251001', vuelta: 1, intento: 1, resultado: 'ok', estadoHttp: 200,
  latenciaMs: 900, esperaMs: 40, comienzoMs: n * 100, tokens: { entrada: 5000, salida: 400, escrituraCache: 0, lecturaCache: 0 },
  entradaEstimada: 5200, ...(etapa === 'juez' ? { pareja: '22222222-2222-2222-2222-222222222222' } : {}), ...extra,
});
const registroCompleto = () => ({ peticiones: SEIS.map((e, i) => peticion(i + 1, e)), sinEtapa: 0, fueraDelDetalle: null });

async function correr(analisis: { minutos: number; registro?: unknown }[]): Promise<Fila[]> {
  const db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis_type text, analysis jsonb);`);
  for (const a of analisis)
    await db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
      [ORG, new Date(Date.UTC(2026, 9, 21, 10, a.minutos)).toISOString(), 'NOR-11.docx', 'quick', { discrepancies: [], ...(a.registro ? { llamadasAlModelo: a.registro } : {}) }]);
  // ruido: otra organización y un análisis anterior a DESDE, que no tienen que contar
  await db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
    ['otra', '2026-10-21T10:30:00Z', 'X.docx', 'quick', { llamadasAlModelo: { peticiones: [], sinEtapa: 9, fueraDelDetalle: null } }]);
  await db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)',
    [ORG, '2026-10-21T08:00:00Z', 'Y.docx', 'quick', { llamadasAlModelo: { peticiones: [], sinEtapa: 9, fueraDelDetalle: null } }]);
  let sql = readFileSync('SQL_311_01_control_del_registro_por_llamada.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS desde/, "timestamptz '2026-10-21 12:00:00+02' AS desde");
  const filas = (await db.query<Fila>(sql)).rows;
  await db.close();
  return filas;
}
const controles = (f: Fila[]) => f.filter(x => x.bloque.startsWith('0')).map(x => `${x.a} · ${x.b}`);

describe('SQL_311_01, el control del registro por llamada', () => {
  it('un análisis con registro completo: todo OK, y el anterior a DESDE y el de otra organización no cuentan', async () => {
    const f = await correr([{ minutos: 5, registro: registroCompleto() }, { minutos: 6 }]);
    expect(controles(f).filter(c => !c.startsWith('OK'))).toEqual([]);
    expect(controles(f)[0]).toContain('análisis desde DESDE: 2, de ellos con registro por llamada: 1');
    expect(f.filter(x => x.bloque.startsWith('2 ·')).map(x => x.a).sort()).toEqual([...SEIS].sort());
  }, 60_000);

  it('una llamada sin etapa hace caer el 2', async () => {
    const f = await correr([{ minutos: 5, registro: { ...registroCompleto(), sinEtapa: 1 } }]);
    expect(controles(f).filter(c => c.startsWith('FALLA'))).toEqual([expect.stringContaining('sinEtapa = 1')]);
  }, 60_000);

  it('una etapa que no es del análisis hace caer el 3, y un juez sin pareja el 4', async () => {
    const r = registroCompleto();
    r.peticiones.push(peticion(7, 'sin_etapa'), { ...peticion(8, 'juez'), pareja: undefined } as ReturnType<typeof peticion>);
    const f = await correr([{ minutos: 5, registro: JSON.parse(JSON.stringify(r)) }]);
    const fallas = controles(f).filter(c => c.startsWith('FALLA'));
    expect(fallas).toHaveLength(2);
    expect(fallas[0]).toContain('una etapa que no es de las seis del análisis: 1');
    expect(fallas[1]).toContain('sin pareja: 1');
  }, 60_000);

  it('sin ningún análisis con registro, el 1 sale NO APLICA y no OK', async () => {
    const f = await correr([{ minutos: 5 }]);
    expect(controles(f)).toEqual(['NO APLICA · análisis desde DESDE: 1, de ellos con registro por llamada: 0']);
  }, 60_000);
});
