import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_05_d_por_pasada.sql (30/10/2026), en PGlite. Siete pasadas de NOR-10 en la ventana, una por caso:
 *   1 · D con la etiqueta, citando el principio de §3.1 (y A al lado, que no cuenta), y un muerto sin texto en la pareja;
 *   2 · D sin la etiqueta, citando §3.5;
 *   3 · D con la cita de NOR-10 a caballo entre las dos frases de 2.4: DUDOSA;
 *   4 · sólo A, y D muerta en la puerta de citas (con texto); un solapamiento con la misma cita, que no cuenta;
 *   5 · sólo A, y tres muertos sin texto en la pareja (uno del verificador con la etiqueta); y en la puerta, A, que no es D;
 *   6 · la cita de D contra CLI-13, que no es la pareja, y el juicio de CLI-13 con descartes, que no cuentan;
 *   7 · sólo A, con el juicio de CLI-12 sin «discarded» guardado: un agujero, no un cero.
 * Sin ventana, la consulta sólo lista las pasadas rápidas de NOR-10 (las ocho de la organización, la de fuera incluida).
 * Ruido con D: una pasada fuera de la ventana, otra de otra organización y otra de NOR-11; y en todas, la lectura de
 * una pareja con CLI-13 con otro modelo, que no es la de D. Una base por fichero.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';
const COPIA = '00000000-0000-0000-0000-0000000000c4';
const H55 = 'claude-haiku-5-5';

// citas literales del corpus (subcadenas de los textos de la consulta)
const NOR_D = 'figura que puede recaer en el propio Director Clínico o en otro profesional designado por él';
const NOR_A = 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1';
const NOR_CABALLO = 'basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico';
const CLI_PRINCIPIO = 'separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial';
const CLI_35 = 'sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro';
const CLI_A = 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico';

type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };
const hallazgo = (doc: string, nor: string, cli: string, especie?: string) =>
  ({ existingDocument: doc === C12 ? 'CLI-12_manual.docx' : 'CLI-13_instrucciones.docx', existingDocumentId: doc, topic: 't',
     newDocSays: nor, existingDocSays: cli, severity: 'contradiction', ...(especie ? { conflictoNormativo: especie } : {}) });
const A = hallazgo(C12, NOR_A, CLI_A);
const juicio = (extra: Record<string, unknown> = { discarded: {} }) => ({ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: [], ...extra });
const pasada = (discrepancias: unknown[], juicios: unknown[], ms = [20000, 15400]) => ({
  discrepancies: discrepancias, judgments: juicios,
  lecturaDeLasParejas: [{ documentId: C12, modelo: H55 }, { documentId: C13, modelo: 'claude-otro' }],
  llamadasAlModelo: { peticiones: [{ comienzoMs: 0, latenciaMs: ms[0] }, { comienzoMs: ms[0], latenciaMs: ms[1] }] },
});

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

interface Opciones { exhaustiva?: boolean; dosCli12?: boolean; dosPertenencias?: boolean }
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_manual.docx'), ($3, $2, 'CLI-13_instrucciones.docx')", [C12, ORG, C13]);
  if (o.dosCli12) await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_copia.docx')", [COPIA, ORG]);
  const meter = (org: string, cuando: string, doc: string, analisis: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando, doc, tipo, analisis]);
  const N10 = 'NOR-10_protocolo.docx';
  await meter(ORG, '2026-10-27T10:30:00Z', N10, pasada([A, hallazgo(C12, NOR_D, CLI_PRINCIPIO, 'norma_contra_norma')], [juicio({ discarded: { 'descartado.equivalentes': 1 } })]));
  await meter(ORG, '2026-10-27T10:40:00Z', N10, pasada([A, hallazgo(C12, NOR_D, CLI_35)], [juicio()]));
  await meter(ORG, '2026-10-27T10:50:00Z', N10, pasada([A, hallazgo(C12, NOR_CABALLO, CLI_PRINCIPIO, 'norma_contra_norma')], [juicio()]));
  await meter(ORG, '2026-10-27T11:00:00Z', N10, pasada([A], [juicio({ discarded: {}, descartesPorCita: [
    { tipo: 'contradiccion', citaNuevo: NOR_D, citaExistente: CLI_PRINCIPIO },
    { tipo: 'solapamiento', citaNuevo: NOR_D, citaExistente: CLI_PRINCIPIO },
  ] })]), o.exhaustiva ? 'exhaustive' : 'quick');
  await meter(ORG, '2026-10-27T11:10:00Z', N10, pasada([A], [juicio({ discarded: {
    'descartado.cumplibles_a_la_vez': 1, 'descartado.cumplibles_a_la_vez.norma_contra_norma': 1,
    'frontera.cita_ausente': 1, narracionEnCita: 1, 'confirmado.por_juicio': 1,
  }, descartesPorCita: [{ tipo: 'contradiccion', citaNuevo: NOR_A, citaExistente: CLI_A }] })]));
  await meter(ORG, '2026-10-27T11:20:00Z', N10, pasada([A, hallazgo(C13, NOR_D, CLI_PRINCIPIO, 'norma_contra_norma')], [juicio(), { documentId: C13, documentName: 'CLI-13_instrucciones.docx', contradictions: [], discarded: { 'descartado.sin_relacion': 2 }, descartesPorCita: [{ tipo: 'contradiccion', citaNuevo: NOR_D, citaExistente: CLI_PRINCIPIO }] }]));
  await meter(ORG, '2026-10-27T11:30:00Z', N10, pasada([A], [juicio({})]));
  // ruido con D
  const conD = pasada([hallazgo(C12, NOR_D, CLI_PRINCIPIO, 'norma_contra_norma')], [juicio()]);
  await meter(ORG, '2026-10-27T09:00:00Z', N10, conD);
  await meter(OTRA, '2026-10-27T10:35:00Z', N10, conD);
  await meter(ORG, '2026-10-27T10:45:00Z', 'NOR-11_otro.docx', conD);
}

async function correr(o: Opciones = {}, conVentana: boolean | 'solo_desde' = true, esperado: number | null = 7): Promise<Fila[]> {
  await sembrar(o);
  let sql = readFileSync('SQL_34_05_d_por_pasada.sql', 'utf8').replaceAll('public.', '');
  if (conVentana) sql = sql.replace('NULL::timestamptz AS desde', "timestamptz '2026-10-27 10:00:00+00' AS desde");
  if (conVentana === true) sql = sql.replace('NULL::timestamptz AS hasta', "timestamptz '2026-10-27 13:00:00+00' AS hasta");
  if (esperado !== null) sql = sql.replace('NULL::int AS esperado', `${esperado} AS esperado`);
  return (await db.query<Fila>(sql)).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c, x.d]);

describe('SQL_34_05, D por pasada', () => {
  it('LA ORGANIZACIÓN LEÍDA va primera, y los controles: OK los que miran, y el del agujero FALLA por la pasada 7', async () => {
    const f = await correr();
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 2 documentos`);
    // con ventana mide, y la lista del modo sin ventana no sale
    expect(f.filter(x => x.bloque.startsWith('0 · sin ventana'))).toEqual([]);
    expect(de(f, '0 · control').map(x => [x[0], x[1]])).toEqual([
      ['ventana: 27/10 11:00 a 27/10 14:00 (hora de Madrid)', 'OK'],
      ['pasadas de NOR-10 en la ventana: 7 · esperado: 7', 'OK'],
      ['pasadas que no son rápidas: 0', 'OK'],
      ['documentos CLI-12 en la organización: 1 (tiene que ser uno)', 'OK'],
      ['la primera frase de 2.4 está dentro de 2.4: carácter 1 a 387 · el principio dentro de §3.1: carácter 142 a 503', 'OK'],
      ['pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 1', '⚠️⚠️ FALLA'],
    ]);
  });

  it('EL VEREDICTO POR PASADA: D con y sin etiqueta, la dudosa, la de la puerta, lo que no se ve, y la de otra pareja', async () => {
    const f = (await correr()).filter(x => x.bloque === '1 · por pasada' && !x.a?.includes('cita de D'));
    expect(f.map(x => [x.a, x.b, x.c])).toEqual([
      ['pasada 1 · 27/10 11:30:00 · ' + H55 + ' · 35 s', 'D (norma_contra_norma)', 'en la puerta, con texto: 0 · sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)'],
      ['pasada 2 · 27/10 11:40:00 · ' + H55 + ' · 35 s', 'D (sin especie)', 'en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)'],
      ['pasada 3 · 27/10 11:50:00 · ' + H55 + ' · 35 s', 'D DUDOSA: la cita de NOR-10 sigue en la segunda frase de 2.4 (norma_contra_norma)', 'en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)'],
      ['pasada 4 · 27/10 12:00:00 · ' + H55 + ' · 35 s', 'no · D muerta en la puerta de citas (1)', 'en la puerta, con texto: 1 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)'],
      ['pasada 5 · 27/10 12:10:00 · ' + H55 + ' · 35 s', 'no', 'en la puerta, con texto: 0 · sin texto en la pareja: 3 (con la etiqueta, del verificador: 1)'],
      ['pasada 6 · 27/10 12:20:00 · ' + H55 + ' · 35 s', 'no', 'en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)'],
      ['pasada 7 · 27/10 12:30:00 · ' + H55 + ' · 35 s', 'no', 'en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero'],
    ]);
  });

  it('LAS CITAS DE CADA D, con el lado de CLI-12 que citó', async () => {
    expect(de(await correr(), '1 · por pasada').filter(x => x[0]?.includes('cita de D'))).toEqual([
      ['pasada 1 · cita de D', 'norma_contra_norma · CLI-12: el principio de §3.1', `NOR-10: «${NOR_D}»`, `CLI-12: «${CLI_PRINCIPIO}»`],
      ['pasada 2 · cita de D', 'sin especie · CLI-12: §3.5', `NOR-10: «${NOR_D}»`, `CLI-12: «${CLI_35}»`],
      ['pasada 3 · cita de D', 'norma_contra_norma · CLI-12: el principio de §3.1 · ⚠️ A CABALLO', `NOR-10: «${NOR_CABALLO}»`, `CLI-12: «${CLI_PRINCIPIO}»`],
    ]);
  });

  it('EL TOTAL: D en 2 de 7, una con etiqueta, la dudosa aparte, la puerta y la cota de lo que no se ve', async () => {
    expect(de(await correr(), '2 · el total')).toEqual([[
      'D en 2 de 7 pasadas · con la etiqueta: 1 · dudosas aparte: 1',
      'muertas en la puerta, con texto: 1 pasadas',
      'sin texto en la pareja: 4 hallazgos en 2 pasadas, 3 de ellos en pasadas SIN D (con la etiqueta: 1)',
      null,
    ]]);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR, fallan: con un solo extremo de la ventana, con una pasada exhaustiva, con dos CLI-12 y con el esperado mal', async () => {
    const control = (f: Fila[]) => de(f, '0 · control').map(x => x[1]);
    expect(control(await correr({}, 'solo_desde', null))).toEqual(['⚠️⚠️ FALLA', 'NO APLICA', 'NO APLICA', 'OK', 'OK', 'NO APLICA']);
    expect(control(await correr({ exhaustiva: true }))[2]).toBe('⚠️⚠️ FALLA');
    expect(control(await correr({ dosCli12: true }))[3]).toBe('⚠️⚠️ FALLA');
    expect(control(await correr({}, true, 6))[1]).toBe('⚠️⚠️ FALLA');
  });

  it('SIN VENTANA, LISTA Y NO MIDE: todas las pasadas rápidas de NOR-10 de la organización, con su hora y su duración, y nada más', async () => {
    const f = await correr({}, false, null);
    expect(f.map(x => x.bloque)).toEqual(['organización leída', ...Array(8).fill('0 · sin ventana: las pasadas rápidas de NOR-10')]);
    expect(de(f, '0 · sin ventana: las pasadas rápidas de NOR-10')).toEqual(
      ['10:00', '11:30', '11:40', '11:50', '12:00', '12:10', '12:20', '12:30'].map((h, i) =>
        [`pasada ${i + 1} · 27/10/2026 ${h}:00 (hora de Madrid)`, '35 s', null, null]));
    // la exhaustiva no sale en la lista
    expect(de(await correr({ exhaustiva: true }, false, null), '0 · sin ventana: las pasadas rápidas de NOR-10').length).toBe(7);
  });

  it('SIN ORGANIZACIÓN RESUELTA, la primera fila lo grita y no hay ni una D', async () => {
    const f = await correr({ dosPertenencias: true });
    expect(f[0].a).toContain('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN');
    expect(de(f, '2 · el total')[0][0]).toBe('D en 0 de 0 pasadas · con la etiqueta: 0 · dudosas aparte: 0');
  });
});
