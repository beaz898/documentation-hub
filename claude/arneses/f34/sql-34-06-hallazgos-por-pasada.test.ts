import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_06_hallazgos_por_pasada.sql (31/10/2026), en PGlite. Cinco pasadas de NOR-10 en la ventana:
 *   1 · A (por §2.1), B y D con la etiqueta;
 *   2 · A (por la segunda frase de 2.4), C y D sin etiqueta, citando §3.5;
 *   3 · una cita a caballo entre las dos frases de 2.4 (DUDOSA para A y para D), y B muerta en la puerta de citas;
 *   4 · nada publicado, y dos muertos sin texto en la pareja (uno del verificador con la etiqueta);
 *   5 · C citada contra CLI-13, que no es la pareja, y el juicio de CLI-12 sin «discarded»: un agujero.
 * Y dos de NOR-11: la 1 con el quinto conflicto, la 2 sin nada. Ruido: una pasada fuera de la ventana y otra de otra
 * organización. Y un control que corre SQL_34_05 sobre los mismos datos: D tiene que salir igual en las dos. Además: A
 * muerta en la puerta en la pasada 1, donde A también está encontrada; una cita CORTA de B en la 4, que no cuenta; y una
 * variante con una D limpia sin etiqueta junto a la dudosa con etiqueta, el único borde en que difiere de SQL_34_05.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';
const COPIA = '00000000-0000-0000-0000-0000000000c4';
const H55 = 'claude-haiku-5-5';

const NOR_A21 = 'El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico';
const NOR_A24 = 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última';
const NOR_D = 'figura que puede recaer en el propio Director Clínico o en otro profesional designado por él';
const NOR_CABALLO = 'basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico';
const NOR_B = 'El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora';
const NOR_C = 'mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización';
const NOR11_Q = 'El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento';
const CLI_A = 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico';
const CLI_PRINCIPIO = 'separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial';
const CLI_35 = 'sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro';
const CLI_B = 'El control biológico del autoclave se realiza con periodicidad mensual';
const CLI_C = 'se considera válido durante un periodo máximo de 12 meses';
const CLI_Q = 'Las auditorías internas las realiza siempre personal ajeno al área auditada';

type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };
const hallazgo = (doc: string, nor: string, cli: string, especie?: string) =>
  ({ existingDocument: doc === C12 ? 'CLI-12_manual.docx' : 'CLI-13_instrucciones.docx', existingDocumentId: doc, topic: 't',
     newDocSays: nor, existingDocSays: cli, severity: 'contradiction', ...(especie ? { conflictoNormativo: especie } : {}) });
const juicio = (extra: Record<string, unknown> = { discarded: {} }) => ({ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: [], ...extra });
const pasada = (discrepancias: unknown[], juicios: unknown[]) => ({
  discrepancies: discrepancias, judgments: juicios,
  lecturaDeLasParejas: [{ documentId: C12, modelo: H55 }, { documentId: C13, modelo: 'claude-otro' }],
  llamadasAlModelo: { peticiones: [{ comienzoMs: 0, latenciaMs: 20000 }, { comienzoMs: 20000, latenciaMs: 15400 }] },
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

interface Opciones { exhaustiva?: boolean; dosCli12?: boolean; dosPertenencias?: boolean; limpiaYDudosa?: boolean }
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM analysis_results;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_manual.docx'), ($3, $2, 'CLI-13_instrucciones.docx')", [C12, ORG, C13]);
  if (o.dosCli12) await db.query("INSERT INTO documents VALUES ($1, $2, 'CLI-12_copia.docx')", [COPIA, ORG]);
  const meter = (org: string, cuando: string, doc: string, analisis: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando, doc, tipo, analisis]);
  const N10 = 'NOR-10_protocolo.docx', N11 = 'NOR-11_residuos.docx';
  await meter(ORG, '2026-10-27T10:30:00Z', N10, pasada([hallazgo(C12, NOR_A21, CLI_A), hallazgo(C12, NOR_B, CLI_B), hallazgo(C12, NOR_D, CLI_PRINCIPIO, 'norma_contra_norma')],
    [juicio({ discarded: {}, descartesPorCita: [{ tipo: 'contradiccion', citaNuevo: NOR_A24, citaExistente: CLI_A }] })]));
  await meter(ORG, '2026-10-27T10:40:00Z', N10, pasada([hallazgo(C12, NOR_A24, CLI_A), hallazgo(C12, NOR_C, CLI_C), hallazgo(C12, NOR_D, CLI_35)], [juicio()]));
  await meter(ORG, '2026-10-27T10:50:00Z', N10, pasada([hallazgo(C12, NOR_CABALLO, CLI_PRINCIPIO, 'norma_contra_norma'), ...(o.limpiaYDudosa ? [hallazgo(C12, NOR_D, CLI_35)] : [])], [juicio({ discarded: {}, descartesPorCita: [
    { tipo: 'contradiccion', citaNuevo: NOR_B, citaExistente: CLI_B },
    { tipo: 'solapamiento', citaNuevo: NOR_C, citaExistente: CLI_C },
  ] })]), o.exhaustiva ? 'exhaustive' : 'quick');
  await meter(ORG, '2026-10-27T11:00:00Z', N10, pasada([hallazgo(C12, 'semanalmente', CLI_B)], [juicio({ discarded: {
    'descartado.cumplibles_a_la_vez': 1, 'descartado.cumplibles_a_la_vez.norma_contra_norma': 1, 'frontera.cita_ausente': 1, 'confirmado.por_juicio': 2,
  } })]));
  await meter(ORG, '2026-10-27T11:10:00Z', N10, pasada([hallazgo(C13, NOR_C, CLI_C)], [juicio({}), { documentId: C13, documentName: 'CLI-13_instrucciones.docx', contradictions: [], discarded: { 'descartado.sin_relacion': 3 } }]));
  await meter(ORG, '2026-10-27T10:35:00Z', N11, pasada([hallazgo(C12, NOR11_Q, CLI_Q)], [juicio()]));
  await meter(ORG, '2026-10-27T10:45:00Z', N11, pasada([], [juicio()]));
  // ruido con A, B, C, D y el quinto
  const todo = pasada([hallazgo(C12, NOR_A21, CLI_A), hallazgo(C12, NOR_B, CLI_B), hallazgo(C12, NOR_C, CLI_C), hallazgo(C12, NOR_D, CLI_PRINCIPIO)], [juicio()]);
  await meter(ORG, '2026-10-27T09:00:00Z', N10, todo);
  await meter(OTRA, '2026-10-27T10:31:00Z', N10, todo);
  await meter(OTRA, '2026-10-27T10:36:00Z', N11, pasada([hallazgo(C12, NOR11_Q, CLI_Q)], [juicio()]));
}

type Ventana = boolean | 'solo_desde';
function preparar(sql: string, ventana: Ventana, esperado: number | null, documento?: string): string {
  let s = sql.replaceAll('public.', '');
  if (ventana) s = s.replace('NULL::timestamptz AS desde', "timestamptz '2026-10-27 10:00:00+00' AS desde");
  if (ventana === true) s = s.replace('NULL::timestamptz AS hasta', "timestamptz '2026-10-27 13:00:00+00' AS hasta");
  if (esperado !== null) s = s.replace('NULL::int AS esperado', `${esperado} AS esperado`);
  if (documento) s = s.replace("'NOR-10'::text AS documento", `'${documento}'::text AS documento`);
  return s;
}
async function correr(o: Opciones = {}, ventana: Ventana = true, esperado: number | null = 5, documento?: string): Promise<Fila[]> {
  await sembrar(o);
  return (await db.query<Fila>(preparar(readFileSync('SQL_34_06_hallazgos_por_pasada.sql', 'utf8'), ventana, esperado, documento))).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.a, x.b, x.c, x.d]);
const control = (f: Fila[]) => de(f, '0 · control').map(x => [x[0], x[1]]);

describe('SQL_34_06, A, B, C, D y el quinto por pasada', () => {
  it('LOS CONTROLES con NOR-10: la organización primero, OK los que miran, y el agujero de la pasada 5 FALLA', async () => {
    const f = await correr();
    expect(f[0].a).toBe(`organización leída: ${ORG} · «Mi workspace» · 2 documentos`);
    expect(f.filter(x => x.bloque.startsWith('0 · sin ventana'))).toEqual([]);
    expect(control(f)).toEqual([
      ['ventana: 27/10 11:00 a 27/10 14:00 (hora de Madrid)', 'OK'],
      ['pasadas de NOR-10 en la ventana: 5 · esperado: 5', 'OK'],
      ['pasadas que no son rápidas: 0', 'OK'],
      ['documentos CLI-12 en la organización: 1 (tiene que ser uno)', 'OK'],
      ['casos de NOR-10: A, B, C, D · frases dentro de su párrafo: 5 de 5', 'OK'],
      ['pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 1', '⚠️⚠️ FALLA'],
    ]);
  });

  it('EL ESTADO DE CADA CASO EN CADA PASADA, y lo que no se ve', async () => {
    const f = (await correr()).filter(x => x.bloque === '1 · por pasada' && !x.a?.includes('cita de'));
    const sinTexto = (n: number, e: number, extra = '') => `sin texto en la pareja: ${n} (con la etiqueta, del verificador: ${e})${extra}`;
    expect(f.map(x => [x.a, x.b, x.c])).toEqual([
      [`pasada 1 · 27/10 11:30:00 · ${H55} · 35 s`, 'A: sí (sin especie) · B: sí (sin especie) · C: no · D: sí (norma_contra_norma)', sinTexto(0, 0)],
      [`pasada 2 · 27/10 11:40:00 · ${H55} · 35 s`, 'A: sí (sin especie) · B: no · C: sí (sin especie) · D: sí (sin especie)', sinTexto(0, 0)],
      [`pasada 3 · 27/10 11:50:00 · ${H55} · 35 s`, 'A: DUDOSA · B: muerta en la puerta · C: no · D: DUDOSA', sinTexto(0, 0)],
      [`pasada 4 · 27/10 12:00:00 · ${H55} · 35 s`, 'A: no · B: no · C: no · D: no', sinTexto(2, 1)],
      [`pasada 5 · 27/10 12:10:00 · ${H55} · 35 s`, 'A: no · B: no · C: no · D: no', sinTexto(0, 0, ' · ⚠️ SIN «discarded»: agujero')],
    ]);
  });

  it('LAS CITAS DE CADA CASO, con el lado de CLI-12 que citó, y la dudosa en los dos casos que toca', async () => {
    const nor = (s: string) => `cita del documento: «${s}»`, cli = (s: string) => `CLI-12: «${s}»`;
    expect(de(await correr(), '1 · por pasada').filter(x => x[0]?.includes('cita de'))).toEqual([
      ['pasada 1 · cita de A', 'sin especie · CLI-12: §3.1, fuera del principio', nor(NOR_A21), cli(CLI_A)],
      ['pasada 1 · cita de B', 'sin especie · CLI-12: fuera de §3.1 y §3.5', nor(NOR_B), cli(CLI_B)],
      ['pasada 1 · cita de D', 'norma_contra_norma · CLI-12: el principio de §3.1', nor(NOR_D), cli(CLI_PRINCIPIO)],
      ['pasada 2 · cita de A', 'sin especie · CLI-12: §3.1, fuera del principio', nor(NOR_A24), cli(CLI_A)],
      ['pasada 2 · cita de C', 'sin especie · CLI-12: fuera de §3.1 y §3.5', nor(NOR_C), cli(CLI_C)],
      ['pasada 2 · cita de D', 'sin especie · CLI-12: §3.5', nor(NOR_D), cli(CLI_35)],
      ['pasada 3 · cita de A', 'norma_contra_norma · CLI-12: el principio de §3.1 · ⚠️ DUDOSA: toca la frase de otro caso', nor(NOR_CABALLO), cli(CLI_PRINCIPIO)],
      ['pasada 3 · cita de D', 'norma_contra_norma · CLI-12: el principio de §3.1 · ⚠️ DUDOSA: toca la frase de otro caso', nor(NOR_CABALLO), cli(CLI_PRINCIPIO)],
    ]);
  });

  it('EL TOTAL POR CASO, y la cota sin texto UNA vez, sin repartir', async () => {
    expect(de(await correr(), '2 · el total')).toEqual([
      ['A en 2 de 5 pasadas · con la etiqueta: 0 · dudosas aparte: 1', 'muertas en la puerta, con texto: 0 pasadas', null, null],
      ['B en 1 de 5 pasadas · con la etiqueta: 0 · dudosas aparte: 0', 'muertas en la puerta, con texto: 1 pasadas', null, null],
      ['C en 1 de 5 pasadas · con la etiqueta: 0 · dudosas aparte: 0', 'muertas en la puerta, con texto: 0 pasadas', null, null],
      ['D en 2 de 5 pasadas · con la etiqueta: 1 · dudosas aparte: 1', 'muertas en la puerta, con texto: 0 pasadas', null, null],
      ['sin texto en la pareja, que no se reparte por caso: 2 hallazgos en 1 pasadas (con la etiqueta, del verificador: 1)', null, null, null],
    ]);
  });

  it('CON NOR-11, EL QUINTO: sus pasadas, su caso y su total', async () => {
    const f = await correr({}, true, 2, 'NOR-11');
    expect(control(f)[1]).toEqual(['pasadas de NOR-11 en la ventana: 2 · esperado: 2', 'OK']);
    expect(control(f)[4]).toEqual(['casos de NOR-11: quinto · frases dentro de su párrafo: 1 de 1', 'OK']);
    expect(f.filter(x => x.bloque === '1 · por pasada').map(x => [x.a, x.b])).toEqual([
      [`pasada 1 · 27/10 11:35:00 · ${H55} · 35 s`, 'quinto: sí (sin especie)'],
      ['pasada 1 · cita de quinto', 'sin especie · CLI-12: fuera de §3.1 y §3.5'],
      [`pasada 2 · 27/10 11:45:00 · ${H55} · 35 s`, 'quinto: no'],
    ]);
    expect(de(f, '2 · el total')[0][0]).toBe('quinto en 1 de 2 pasadas · con la etiqueta: 0 · dudosas aparte: 0');
  });

  it('⚠️ CONTROL POSITIVO: SOBRE LOS MISMOS DATOS, D SALE IGUAL QUE EN SQL_34_05', async () => {
    await sembrar();
    const v05 = (await db.query<Fila>(preparar(readFileSync('SQL_34_05_d_por_pasada.sql', 'utf8'), true, 5))).rows;
    const v06 = (await db.query<Fila>(preparar(readFileSync('SQL_34_06_hallazgos_por_pasada.sql', 'utf8'), true, 5))).rows;
    const total05 = v05.find(x => x.bloque === '2 · el total')?.a;
    const total06 = v06.find(x => x.bloque === '2 · el total' && x.a?.startsWith('D en '))?.a;
    expect(total05).toBe('D en 2 de 5 pasadas · con la etiqueta: 1 · dudosas aparte: 1');
    expect(total06).toBe(total05);
  });

  it('UNA D LIMPIA SIN ETIQUETA Y UNA DUDOSA CON ETIQUETA EN LA MISMA PASADA: la etiqueta de la dudosa NO cuenta (aquí difiere de SQL_34_05)', async () => {
    const f = await correr({ limpiaYDudosa: true });
    expect(f.find(x => x.a?.startsWith('pasada 3 ·') && !x.a.includes('cita de'))?.b).toBe('A: DUDOSA · B: muerta en la puerta · C: no · D: sí (sin especie)');
    expect(de(f, '2 · el total')[3][0]).toBe('D en 3 de 5 pasadas · con la etiqueta: 1 · dudosas aparte: 0');
  });

  it('SIN VENTANA, LISTA las pasadas rápidas del documento elegido, y nada más', async () => {
    const f = await correr({}, false, null);
    expect(f.map(x => x.bloque)).toEqual(['organización leída', ...Array(6).fill('0 · sin ventana: las pasadas rápidas de NOR-10')]);
    expect(f.slice(1).map(x => x.a)).toEqual(['10:00', '11:30', '11:40', '11:50', '12:00', '12:10'].map((h, i) => `pasada ${i + 1} · 27/10/2026 ${h}:00 (hora de Madrid)`));
    expect((await correr({ exhaustiva: true }, false, null)).length).toBe(1 + 5);
    const g = await correr({}, false, null, 'NOR-11');
    expect(g.slice(1).map(x => [x.bloque, x.a, x.b])).toEqual([
      ['0 · sin ventana: las pasadas rápidas de NOR-11', 'pasada 1 · 27/10/2026 11:35:00 (hora de Madrid)', '35 s'],
      ['0 · sin ventana: las pasadas rápidas de NOR-11', 'pasada 2 · 27/10/2026 11:45:00 (hora de Madrid)', '35 s'],
    ]);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR, fallan: un solo extremo, una exhaustiva, dos CLI-12, un documento sin casos, el esperado mal', async () => {
    const ok = (f: Fila[]) => control(f).map(x => x[1]);
    expect(ok(await correr({}, 'solo_desde', null))).toEqual(['⚠️⚠️ FALLA', 'NO APLICA', 'NO APLICA', 'OK', 'OK', 'NO APLICA']);
    expect(ok(await correr({ exhaustiva: true }))[2]).toBe('⚠️⚠️ FALLA');
    expect(ok(await correr({ dosCli12: true }))[3]).toBe('⚠️⚠️ FALLA');
    expect(control(await correr({}, true, null, 'NOR-12'))[4]).toEqual(['casos de NOR-12: NINGUNO · frases dentro de su párrafo: 0 de 0', '⚠️⚠️ FALLA']);
    expect(ok(await correr({}, true, 4))[1]).toBe('⚠️⚠️ FALLA');
  });

  it('SIN ORGANIZACIÓN RESUELTA, la primera fila lo grita y no hay ni un caso encontrado', async () => {
    const f = await correr({ dosPertenencias: true });
    expect(f[0].a).toContain('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN');
    expect(f.filter(x => x.bloque === '1 · por pasada')).toEqual([]);
  });
});
