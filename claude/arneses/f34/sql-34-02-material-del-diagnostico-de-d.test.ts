import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_02_el_material_del_diagnostico_de_d.sql (27/10/2026; §3.1 y la ventana en NULO, el mismo día), en
 * PGlite. Tres pasadas de NOR-10 dentro de la ventana: la 1 con citas de §3.5 (con tilde, en mayúsculas sin tilde), de
 * §3.1 en la frase del principio, en la frase de A, a caballo entre las dos y partida por un salto de línea, una cita
 * corta y §3.5 sólo en el lado nuevo; la 2 y la 3 con lo entregado al juez entero, cortado y fuera. Ruido con §3.5
 * citado: una pasada fuera de la ventana, otra de otra organización y una de NOR-11. Una base por fichero.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';
const DE_35 = 'nunca por el Director Clínico del propio centro';
const PRINCIPIO = 'separar la responsabilidad de un proceso crítico de seguridad del paciente';
const DE_A = 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro';
const A_CABALLO = 'no el Director Clínico. Esta asignación responde a un criterio';
const PARTIDA = 'quien firma los registros de auditoría\n  trimestral del área';

type Fila = { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null };
const disc = (nuevo: string, existe: string) =>
  ({ existingDocument: 'CLI-12_manual.docx', topic: 'tema', newDocSays: nuevo, existingDocSays: existe, severity: 'contradiction' });
const lectura = (doc: string, an: [number, number], ca: [number, number]) =>
  ({ documentId: doc, regimen: 'entero', analizado: { mostrados: an[0], caracteres: an[1] }, candidato: { mostrados: ca[0], caracteres: ca[1] } });

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

async function sembrar(sinCitas = false) {
  await db.exec('DELETE FROM analysis_results');
  const meter = (org: string, cuando: string, doc: string, analisis: unknown) =>
    db.query("INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,'quick',$4)", [org, cuando, doc, analisis]);
  const primera = sinCitas ? { discrepancies: [] } : {
    discrepancies: [disc('puede recaer en el propio Director Clínico', DE_35), disc('otra cosa del analizado', PRINCIPIO),
      // §3.5 sólo en el lado NUEVO no es §3.5 citado del candidato
      disc('sus funciones son asumidas temporalmente por el Coordinador', 'una frase del candidato que no es de ahí'),
      disc('la retirada del autoclave', DE_A)],
    judgments: [{
      documentName: 'CLI-12_manual.docx',
      overlappingContent: [
        { description: 'solape', evidence: 'sus funciones son asumidas temporalmente por el Coordinador de Calidad', evidenceInNewDoc: 'nada que ver con la sustitución' },
        { description: 'a caballo', evidence: A_CABALLO, evidenceInNewDoc: 'nada' },
        { description: 'partida', evidence: PARTIDA, evidenceInNewDoc: 'nada' },
      ],
      descartesPorCita: [
        { tipo: 'contradiction', tema: 'sustitución', ladoFallido: 'nuevo', citaNuevo: 'una cita del nuevo que no está', citaExistente: 'NUNCA POR EL DIRECTOR CLINICO DEL PROPIO CENTRO' },
        // menos de 20 caracteres: no cuenta aunque sea un tramo de §3.5
        { tipo: 'overlap', tema: 'corta', ladoFallido: 'existente', citaNuevo: 'otra', citaExistente: 'del propio centro' },
      ],
    }, { documentName: 'CLI-13_instrucciones.docx' }],
    discardedFindings: { 'descartado.sin_relacion': 2, 'descartado.cumplibles_a_la_vez.norma_contra_norma': 1 },
    lecturaDeLasParejas: [lectura(C12, [66801, 66801], [55135, 55135]), lectura(C13, [66801, 66801], [9000, 9000])],
  };
  await meter(ORG, '2026-10-26T22:10:00Z', 'NOR-10_x.docx', primera);
  await meter(ORG, '2026-10-26T22:20:00Z', 'NOR-10_x.docx', {
    lecturaDeLasParejas: [lectura(C12, [66801, 66801], [7000, 55135]), lectura(C12, [4000, 66801], [55135, 55135])],
  });
  await meter(ORG, '2026-10-26T22:30:00Z', 'NOR-10_x.docx', { lecturaDeLasParejas: [lectura(C12, [66801, 66801], [6900, 55135])] });
  // ruido, todo con §3.5 y §3.1 citados: fuera de la ventana, de otra organización, y de NOR-11
  const ruido = { discrepancies: [disc('x', DE_35), disc('y', PRINCIPIO)], discardedFindings: { 'ruido': 9 }, lecturaDeLasParejas: [lectura(C12, [1, 1], [1, 1])] };
  await meter(ORG, '2026-10-26T21:00:00Z', 'NOR-10_x.docx', ruido);
  await meter(OTRA, '2026-10-26T22:15:00Z', 'NOR-10_x.docx', ruido);
  await meter(ORG, '2026-10-26T22:25:00Z', 'NOR-11_x.docx', ruido);
}
async function correr(sinCitas = false, conVentana = true, esperado: number | null = 3): Promise<Fila[]> {
  await sembrar(sinCitas);
  let sql = readFileSync('SQL_34_02_el_material_del_diagnostico_de_d.sql', 'utf8').replaceAll('public.', '');
  if (conVentana) {
    sql = sql.replace('NULL::timestamptz AS desde', "timestamptz '2026-10-26 23:00:00+01' AS desde")
             .replace('NULL::timestamptz AS hasta', "timestamptz '2026-10-27 00:30:00+01' AS hasta");
  }
  if (esperado !== null) sql = sql.replace('NULL::int AS esperado_nor10', `${esperado} AS esperado_nor10`);
  return (await db.query<Fila>(sql)).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b);
const orden = (xs: (string | null)[][]) => xs.map(x => JSON.stringify(x)).sort();

describe('SQL_34_02, el material del diagnóstico de D', () => {
  it('LA ORGANIZACIÓN LEÍDA va primera, y los cuatro controles salen OK con la ventana y el esperado puestos', async () => {
    const f = await correr();
    expect(f[0]).toMatchObject({ bloque: 'organización leída', a: 'organización leída: ' + ORG + ' · «Mi workspace» · 2 documentos' });
    expect(de(f, '0 · control').map(x => [x.a, x.b])).toEqual([
      ['OK', 'ventana: 26/10 23:00 a 27/10 00:30 (hora de Madrid)'],
      ['OK', 'pasadas de NOR-10 en la ventana: 3 · esperado: 3'],
      ['OK', 'citas del lado existente leídas en las tres fuentes: 9'],
      ['OK', 'la frase del principio está dentro de §3.1: carácter 142 a 503'],
    ]);
  });

  it('SIN PERTENENCIA, O CON DOS, lo grita en la primera fila, el esperado FALLA y no se lee ninguna pasada', async () => {
    for (const n of [0, 2]) {
      await db.exec('DELETE FROM memberships');
      if (n === 2) await db.query('INSERT INTO memberships VALUES ($1, $2), ($1, $3)', [USUARIO, ORG, OTRA]);
      try {
        const f = await correr();
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
          ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
        expect(de(f, '0 · control').map(x => x.a)).toEqual(['OK', 'FALLA', 'NO APLICA', 'OK']);
        expect(f.filter(x => /^[123] ·/.test(x.bloque))).toHaveLength(0);
      } finally {
        await db.exec('DELETE FROM memberships');
        await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
      }
    }
  });

  it('SIN VENTANA: el control 1 FALLA, el esperado vacío es NO APLICA, y no se lee ninguna pasada', async () => {
    const f = await correr(false, false, null);
    const c = de(f, '0 · control');
    expect(c.map(x => x.a)).toEqual(['FALLA', 'NO APLICA', 'NO APLICA', 'OK']);
    expect(c[0].b).toBe('ventana: SIN RELLENAR a SIN RELLENAR (hora de Madrid)');
    expect(c[1].b).toBe('pasadas de NOR-10 en la ventana: 0 · esperado: SIN RELLENAR');
    expect(f.filter(x => /^[123] ·/.test(x.bloque))).toHaveLength(0);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR: un esperado que no cuadra, y pasadas sin ninguna cita que leer', async () => {
    expect(de(await correr(false, true, 5), '0 · control')[1].a).toBe('FALLA');
    expect(de(await correr(true), '0 · control')[2].a).toBe('FALLA');
  });

  it('1 · LA MITAD CITADA: §3.5 y §3.1 por pasada, los dos siempre, y §3.1 con lo que toca la frase del principio', async () => {
    const f = de(await correr(), '1 · la mitad citada');
    expect(f.filter(x => x.c === null).map(x => [x.pasada, x.a, x.b])).toEqual([
      ['NOR-10 1', '§3.5: 3 · §3.1: 4 (de la frase del principio: 2)', 'de 9 citas del lado existente en la pasada'],
      ['NOR-10 2', '§3.5: 0 · §3.1: 0 (de la frase del principio: 0)', 'de 0 citas del lado existente en la pasada'],
      ['NOR-10 3', '§3.5: 0 · §3.1: 0 (de la frase del principio: 0)', 'de 0 citas del lado existente en la pasada'],
    ]);
    expect(orden(f.filter(x => x.c !== null).map(x => [x.pasada, x.a, x.b, x.c]))).toEqual(orden([
      ['NOR-10 1', '§3.5 · contradicción publicada', 'CLI-12_manual.docx · tema', '«' + DE_35 + '»'],
      ['NOR-10 1', '§3.5 · descarte de la puerta de citas', 'CLI-12_manual.docx · sustitución', '«NUNCA POR EL DIRECTOR CLINICO DEL PROPIO CENTRO»'],
      ['NOR-10 1', '§3.5 · solapamiento', 'CLI-12_manual.docx · solape', '«sus funciones son asumidas temporalmente por el Coordinador de Calidad»'],
      ['NOR-10 1', '§3.1 · la frase del principio · contradicción publicada', 'CLI-12_manual.docx · tema', '«' + PRINCIPIO + '»'],
      ['NOR-10 1', '§3.1 · la frase del principio · solapamiento', 'CLI-12_manual.docx · a caballo', '«' + A_CABALLO + '»'],
      ['NOR-10 1', '§3.1 · fuera de la frase del principio · contradicción publicada', 'CLI-12_manual.docx · tema', '«' + DE_A + '»'],
      ['NOR-10 1', '§3.1 · fuera de la frase del principio · solapamiento', 'CLI-12_manual.docx · partida', '«' + PARTIDA + '»'],
    ]));
  });

  it('2 · TODOS LOS DESCARTES: cada contador con su nombre, y cada descarte de la puerta con sus dos citas; nada del ruido', async () => {
    const f = de(await correr(), '2 · descartes');
    expect(orden(f.map(x => [x.pasada, x.a, x.b, x.c]))).toEqual(orden([
      ['NOR-10 1', 'descartado.cumplibles_a_la_vez.norma_contra_norma', '1', 'contador'],
      ['NOR-10 1', 'descartado.sin_relacion', '2', 'contador'],
      ['NOR-10 1', 'puerta de citas · contradiction · falló: nuevo', 'CLI-12_manual.docx · sustitución',
        'nuevo: «una cita del nuevo que no está» · existente: «NUNCA POR EL DIRECTOR CLINICO DEL PROPIO CENTRO»'],
      ['NOR-10 1', 'puerta de citas · overlap · falló: existente', 'CLI-12_manual.docx · corta', 'nuevo: «otra» · existente: «del propio centro»'],
    ]));
  });

  it('3 · LO ENTREGADO: enteros es DENTRO, cortado pero pasado el final es CORTADA, y una mitad sin llegar es FUERA, por cada lado', async () => {
    const f = de(await correr(), '3 · lo entregado').map(x => [x.pasada, x.a, x.b, x.c]);
    expect(orden(f)).toEqual(orden([
      ['NOR-10 1', 'CLI-12_manual.docx · entero', 'analizado 66801/66801 · candidato 55135/55135', 'las dos mitades de D, DENTRO: los dos lados enteros'],
      ['NOR-10 1', 'CLI-13_instrucciones.docx · entero', 'analizado 66801/66801 · candidato 9000/9000', null],
      ['NOR-10 2', 'CLI-12_manual.docx · entero', 'analizado 66801/66801 · candidato 7000/55135', 'CORTADA: lo mostrado llega al final de las dos mitades, pero no es el documento entero'],
      ['NOR-10 2', 'CLI-12_manual.docx · entero', 'analizado 4000/66801 · candidato 55135/55135', '⚠️ ALGUNA MITAD DE D FUERA de lo entregado'],
      ['NOR-10 3', 'CLI-12_manual.docx · entero', 'analizado 66801/66801 · candidato 6900/55135', '⚠️ ALGUNA MITAD DE D FUERA de lo entregado'],
    ]));
  });
});
