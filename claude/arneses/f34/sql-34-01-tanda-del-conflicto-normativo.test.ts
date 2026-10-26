import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_01_la_tanda_del_conflicto_normativo.sql (26/10/2026), en PGlite. Dos pasadas de NOR-10 (una con
 * D marcado y otra con más de 7 hallazgos contra CLI-12), una de NOR-11 (con una especie que no debería estar, una
 * coincidencia declarada publicada y una NEGACIÓN que no es coincidencia), y ruido: una pasada fuera de la ventana y
 * otra de otra organización dentro. USUARIO y ORG distintos (la resolución por usuario). Una base por fichero.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';

type Fila = { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null };
const disc = (cand: string, tema: string, nuevo: string, existe: string, especie?: string) =>
  ({ existingDocument: cand, topic: tema, newDocSays: nuevo, existingDocSays: existe, severity: 'contradiction', ...(especie !== undefined ? { conflictoNormativo: especie } : {}) });
const pet = (etapa: string, pareja: string | null, entrada: number, lectura = 0) =>
  ({ n: 1, etapa, ...(pareja ? { pareja } : {}), modelo: 'm', vuelta: 1, intento: 1, resultado: 'ok', latenciaMs: 1, esperaMs: 0, comienzoMs: 0,
     tokens: { entrada, salida: 10, escrituraCache: 0, lecturaCache: lectura } });

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE memberships (user_id uuid, org_id uuid);
    CREATE TABLE organizations (id uuid, name text);
    CREATE TABLE documents (id uuid, org_id text, name text);
    CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis_type text, analysis jsonb);`);
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_manual.docx'), ($3, $2, 'CLI-13_instrucciones.docx')", [C12, ORG, C13]);
}, 120_000);
afterAll(async () => { await db.close(); });

interface Opciones { exhaustiva?: boolean; sinRegistro?: boolean }
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM analysis_results');
  const meter = (org: string, cuando: string, doc: string, analisis: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando, doc, tipo, analisis]);
  const registro = { peticiones: [pet('juez', C12, 30000, 5000), pet('juez', C13, 20000), pet('verificador', null, 3000), pet('verificador', null, 2000)], sinEtapa: 0, fueraDelDetalle: null };
  await meter(ORG, '2026-10-27T11:10:00Z', 'NOR-10_x.docx', {
    discrepancies: [
      disc('CLI-12_manual.docx', 'tema A', 'el responsable último es el Director Clínico', 'el responsable último es el Coordinador de Calidad'),
      disc('CLI-12_manual.docx', 'tema D', 'puede recaer en el propio Director Clínico', 'nunca por el Director Clínico del propio centro', 'norma_contra_norma'),
    ],
    discardedFindings: { 'frontera.conflicto_normativo_vacio': 1, 'descartado.cumplibles_a_la_vez': 2, 'descartado.cumplibles_a_la_vez.norma_contra_norma': 2, 'descartado.sin_relacion': 3 },
    ...(o.sinRegistro ? {} : { llamadasAlModelo: registro }),
  });
  await meter(ORG, '2026-10-27T11:20:00Z', 'NOR-10_x.docx', {
    discrepancies: Array.from({ length: 8 }, (_, i) => disc('CLI-12_manual.docx', 'tema ' + i, 'nuevo ' + i, 'existe ' + i)),
    llamadasAlModelo: registro,
  }, o.exhaustiva ? 'exhaustive' : 'quick');
  await meter(ORG, '2026-10-27T11:30:00Z', 'NOR-11_x.docx', {
    discrepancies: [
      disc('CLI-13_instrucciones.docx', 'plazo', 'en 72 horas', 'en 7 días', 'norma_contra_practica'),
      disc('CLI-13_instrucciones.docx', 'grupo IV', 'contenedor rígido de color azul', 'al contenedor azul del armario de medicación restringida'),
      disc('CLI-13_instrucciones.docx', 'negación', 'en bolsa amarilla, en ningún caso en el contenedor negro', 'en el contenedor negro'),
      // la palabra en UNA sola cita no es una coincidencia publicada: tiene que estar en las dos
      disc('CLI-13_instrucciones.docx', 'una sola', 'en la bolsa del gabinete', 'en la bolsa verde'),
    ],
    llamadasAlModelo: registro,
  });
  // ruido: fuera de la ventana, y de otra organización dentro
  await meter(ORG, '2026-10-27T09:00:00Z', 'NOR-10_x.docx', { discrepancies: [disc('CLI-12_manual.docx', 'ruido', 'x', 'y', 'norma_contra_norma')], llamadasAlModelo: registro });
  await meter(OTRA, '2026-10-27T11:15:00Z', 'NOR-10_x.docx', { discrepancies: [disc('CLI-12_manual.docx', 'ruido', 'x', 'y', 'norma_contra_norma')], llamadasAlModelo: registro });
}
async function correr(o: Opciones = {}, conVentana = true, esperados: [number, number] | null = [2, 1]): Promise<Fila[]> {
  await sembrar(o);
  let sql = readFileSync('SQL_34_01_la_tanda_del_conflicto_normativo.sql', 'utf8').replaceAll('public.', '');
  if (conVentana) {
    sql = sql.replace('NULL::timestamptz AS desde', "timestamptz '2026-10-27 12:00:00+01' AS desde")
             .replace('NULL::timestamptz AS hasta', "timestamptz '2026-10-27 13:00:00+01' AS hasta");
  }
  if (esperados) sql = sql.replace('NULL::int AS esperado_nor10', `${esperados[0]} AS esperado_nor10`).replace('NULL::int AS esperado_nor11', `${esperados[1]} AS esperado_nor11`);
  return (await db.query<Fila>(sql)).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b);

describe('SQL_34_01, la tanda del conflicto normativo', () => {
  it('LA ORGANIZACIÓN LEÍDA va primera, y los cinco controles salen OK con la ventana y los esperados puestos', async () => {
    const f = await correr();
    expect(f[0]).toMatchObject({ bloque: 'organización leída', a: 'organización leída: ' + ORG + ' · «Mi workspace» · 2 documentos' });
    expect(de(f, '0 · control').map(x => x.a)).toEqual(['OK', 'OK', 'OK', 'OK', 'OK']);
  });

  it('SIN PERTENENCIA, O CON DOS, LO GRITA en la primera fila y no lee ninguna pasada', async () => {
    for (const n of [0, 2]) {
      await db.exec('DELETE FROM memberships');
      if (n === 2) await db.query('INSERT INTO memberships VALUES ($1, $2), ($1, $3)', [USUARIO, ORG, OTRA]);
      try {
        const f = await correr();
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
          ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
        expect(f.filter(x => x.bloque.startsWith('1 ·'))).toHaveLength(0);
      } finally {
        await db.exec('DELETE FROM memberships');
        await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
      }
    }
  });

  it('SIN VENTANA: el control 1 FALLA, los esperados vacíos son NO APLICA, y no se lee ninguna pasada', async () => {
    const f = await correr({}, false, null);
    const c = de(f, '0 · control');
    expect(c.map(x => x.a)).toEqual(['FALLA', 'NO APLICA', 'NO APLICA', 'NO APLICA', 'NO APLICA']);
    expect(c[0].b).toBe('ventana: SIN RELLENAR a SIN RELLENAR (hora de Madrid)');
    expect(f.filter(x => x.bloque.startsWith('1 ·'))).toHaveLength(0);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR: una pasada exhaustiva, una sin registro, y unos esperados que no cuadran', async () => {
    expect(de(await correr({ exhaustiva: true }), '0 · control')[3].a).toBe('FALLA');
    expect(de(await correr({ sinRegistro: true }), '0 · control')[4].a).toBe('FALLA');
    expect(de(await correr({}, true, [5, 5]), '0 · control').map(x => x.a).slice(1, 3)).toEqual(['FALLA', 'FALLA']);
  });

  it('1 · CADA HALLAZGO, con su especie o «sin especie», su severidad y las dos citas enteras; sólo los de la ventana y del piloto', async () => {
    const h = de(await correr(), '1 · hallazgo');
    expect(h).toHaveLength(2 + 8 + 4);
    expect(h[0]).toEqual({ bloque: '1 · hallazgo', pasada: 'NOR-10 1', a: 'CLI-12_manual.docx', b: 'tema A · sin especie · contradiction',
      c: 'nuevo: «el responsable último es el Director Clínico» · existente: «el responsable último es el Coordinador de Calidad»' });
    expect(h[1].b).toBe('tema D · norma_contra_norma · contradiction');
    expect(h.filter(x => x.b?.startsWith('ruido'))).toHaveLength(0);
  });

  it('2 · EL RECUENTO DE NOR-10 ↔ CLI-12 y el criterio de abandono', async () => {
    expect(de(await correr(), '2 · NOR-10 ↔ CLI-12').map(x => [x.pasada, x.a, x.b, x.c])).toEqual([
      ['NOR-10 1', '2 hallazgos', 'no pasa de 7', 'con especie: 1'],
      ['NOR-10 2', '8 hallazgos', '⚠️ MÁS DE 7: CRITERIO DE ABANDONO', 'con especie: 0'],
    ]);
  });

  it('3 · LOS CONTADORES: los tres nombrados siempre (0 si faltan) y el desglose por especie; nada más', async () => {
    const c = de(await correr(), '3 · contadores').filter(x => x.pasada === 'NOR-10 1').map(x => [x.a, x.b, x.c]);
    expect(c).toEqual([
      ['frontera.conflicto_normativo_vacio', '1', null],
      ['frontera.conflicto_normativo_desconocido', '0 (ausente)', null],
      ['descartado.cumplibles_a_la_vez', '2', null],
      ['descartado.cumplibles_a_la_vez.norma_contra_norma', '2', 'desglose por especie'],
    ]);
  });

  it('4 · NOR-11 ↔ CLI-13: la especie que no debería estar se cuenta, y una coincidencia publicada se ve; la NEGACIÓN no es coincidencia', async () => {
    const c = de(await correr(), '4 · NOR-11 ↔ CLI-13').map(x => [x.a, x.b]);
    expect(c[0]).toEqual(['hallazgos con especie', '1']);
    expect(c.slice(1)).toEqual([
      ['coincidencia 1: verde para el grupo II', '0 hallazgos'],
      ['coincidencia 2: azul para el grupo IV', '1 hallazgos'],
      ['coincidencia 3: rígido amarillo para punzocortantes', '0 hallazgos'],
      ['coincidencia 4: cierre a las tres cuartas partes', '0 hallazgos'],
      ['coincidencia 5: grupo I sin color', '0 hallazgos'],
    ]);
  });

  it('5 · LOS TOKENS DEL JUEZ por llamada, con la pareja por su nombre, y la llamada extra del verificador', async () => {
    const t = de(await correr(), '5 · tokens').filter(x => x.pasada === 'NOR-10 1').map(x => [x.a, x.b, x.c]);
    expect(t).toEqual([
      ['juez · CLI-12_manual.docx', 'entrada 30000 · con la caché 35000', null],
      ['juez · CLI-13_instrucciones.docx', 'entrada 20000 · con la caché 20000', null],
      ['verificador', '2 llamadas', 'marcados que le llegaron: 3'],
    ]);
  });
});
