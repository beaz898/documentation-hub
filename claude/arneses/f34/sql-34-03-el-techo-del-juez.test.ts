import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_03_el_techo_del_juez.sql (28/10/2026), en PGlite. Cuatro pasadas de NOR-10 y una de NOR-11 dentro
 * de la ventana:
 *   · NOR-10 1, Haiku 4.5: CLI-12 al 97,7 % del techo, con A citando la SEGUNDA frase de 2.4 (que no es D) y D muerta
 *     en la puerta; CLI-13 sin «discarded» guardado;
 *   · NOR-10 2, Haiku 5.5: CLI-12 con dos vueltas, la primera al 100 %, D publicada con su especie y diez emitidas;
 *   · NOR-10 3, un modelo sin tope conocido y distinto del de la lectura, D publicada por una cita a caballo entre las
 *     dos frases de 2.4, y una respuesta sin la lista de contradicciones;
 *   · NOR-10 4: D sólo en un solapamiento descartado, que no cuenta como D muerta en la puerta; y la única llamada
 *     con los parámetros guardados (28/10), cuyo tope sale del dato y no del modelo;
 *   · NOR-11 1: lo emitido depende de lo sin atribuir.
 * Ruido con la salida al techo: una pasada fuera de la ventana, otra de otra organización y otra de NOR-05. Una base
 * por fichero.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const C12 = '00000000-0000-0000-0000-0000000000c2', C13 = '00000000-0000-0000-0000-0000000000c3';
const H45 = 'claude-haiku-4-5-20251001', H55 = 'claude-haiku-5-5';
const FRASE_DE_A = 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última';

type Fila = { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null; d: string | null };
const llamada = (etapa: string, pareja: string | null, modelo: string, salida: number, vuelta = 1, resultado = 'ok', parametros?: unknown) =>
  ({ n: 1, etapa, ...(pareja ? { pareja } : {}), modelo, vuelta, intento: 1, resultado, latenciaMs: 1, esperaMs: 0, comienzoMs: 0,
     tokens: { entrada: 100, salida, escrituraCache: 0, lecturaCache: 0 }, ...(parametros ? { parametros } : {}) });
const registro = (peticiones: unknown[], fuera = false) =>
  ({ peticiones, sinEtapa: 0, fueraDelDetalle: fuera ? { peticiones: 1, tokens: { entrada: 0, salida: 0, escrituraCache: 0, lecturaCache: 0 }, latenciaMs: 0, esperaMs: 0 } : null });
const lectura = (doc: string, modelo: string, tokensDeSalida: number) => ({ documentId: doc, regimen: 'pareja_entera', modelo, tokensDeSalida });
const disc = (doc: string, nuevo: string, especie?: string) =>
  ({ existingDocument: doc === C12 ? 'CLI-12_manual.docx' : 'CLI-13_instrucciones.docx', existingDocumentId: doc, topic: 'tema',
     newDocSays: nuevo, existingDocSays: 'x', severity: 'contradiction', ...(especie ? { conflictoNormativo: especie } : {}) });
const contra = (n: number, diff = false) => Array.from({ length: n }, (_, i) => ({ topic: 't' + i, newDocSays: 'n', existingDocSays: 'e', ...(diff ? { origen: 'diff_tabular' } : {}) }));

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

interface Opciones { exhaustiva?: boolean; sinRegistro?: boolean; fueraDelDetalle?: boolean; sinLlamada?: boolean }
async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM analysis_results');
  const meter = (org: string, cuando: string, doc: string, analisis: unknown, tipo = 'quick') =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis_type, analysis) VALUES ($1,$2,$3,$4,$5)', [org, cuando, doc, tipo, analisis]);
  await meter(ORG, '2026-10-26T22:10:00Z', 'NOR-10_x.docx', {
    discrepancies: [disc(C12, FRASE_DE_A)],
    judgments: [
      { documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: [...contra(1), ...contra(1, true)],
        discarded: { 'descartado.sin_relacion': 2, 'descartado.sin_relacion.norma_contra_norma': 1, 'r2.sin_ancla': 1, 'frontera.cita_ausente': 1,
                     'frontera.cita_solo_por_cabeza_y_cola': 3, 'confirmado.por_juicio': 1, 'narracionEnCita': 1 },
        descartesPorCita: [
          { tipo: 'contradiccion', tema: 'd', citaNuevo: 'puede recaer en el propio Director Clínico o en otro profesional', citaExistente: 'x' },
          { tipo: 'solapamiento', tema: 's', citaNuevo: 'puede recaer en el propio Director Clínico o en otro profesional', citaExistente: 'x' },
        ] },
      { documentId: C13, documentName: 'CLI-13_instrucciones.docx', contradictions: [] },
    ],
    lecturaDeLasParejas: [lectura(C12, H45, 4000), lectura(C13, H45, 1000)],
    ...(o.sinRegistro ? {} : { llamadasAlModelo: registro([
      llamada('juez', C12, H45, 4000), llamada('juez', C13, H45, 1000),
      // un intento fallido del juez y una llamada del verificador: ninguno es una llamada del juez con respuesta
      llamada('juez', C12, H45, 0, 1, 'http'), llamada('verificador', null, H45, 2048)]) }),
  });
  await meter(ORG, '2026-10-26T22:20:00Z', 'NOR-10_x.docx', {
    discrepancies: [disc(C12, 'puede recaer en el propio Director Clínico o en otro profesional', 'norma_contra_norma')],
    judgments: [{ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: contra(9), discarded: { 'descartado.cubierto_por_diff': 1 } }],
    lecturaDeLasParejas: [lectura(C12, H55, 25000)],
    llamadasAlModelo: registro([llamada('juez', C12, H55, 16000, 1), llamada('juez', C12, H55, 9000, 2)], o.fueraDelDetalle),
  }, o.exhaustiva ? 'exhaustive' : 'quick');
  await meter(ORG, '2026-10-26T22:30:00Z', 'NOR-10_x.docx', {
    // a caballo entre las dos frases de 2.4: toca la primera, luego es D
    discrepancies: [disc(C12, 'diaria del centro. El Coordinador de Calidad no sustituye')],
    judgments: [{ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: contra(1), discarded: { 'frontera.contradicciones_no_es_array': 1 } }],
    lecturaDeLasParejas: [lectura(C12, H45, 3000)],
    llamadasAlModelo: registro(o.sinLlamada ? [] : [llamada('juez', C12, 'claude-otro', 3000)]),
  });
  // D sólo en un SOLAPAMIENTO descartado: no es D muerta en la puerta, que es de contradicciones
  await meter(ORG, '2026-10-26T22:40:00Z', 'NOR-10_x.docx', {
    discrepancies: [],
    judgments: [{ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: [], discarded: {},
                  descartesPorCita: [{ tipo: 'solapamiento', tema: 's', citaNuevo: 'puede recaer en el propio Director Clínico o en otro profesional', citaExistente: 'x' }] }],
    lecturaDeLasParejas: [lectura(C12, H45, 2000)],
    // con los parámetros guardados (28/10): el tope sale del dato, 2.048, y no del modelo, que daría 4.096
    llamadasAlModelo: registro([llamada('juez', C12, H45, 2000, 1, 'ok', { maxTokens: 2048, temperatura: 0.1, esfuerzo: 'sin_enviar' })]),
  });
  await meter(ORG, '2026-10-26T22:25:00Z', 'NOR-11_x.docx', {
    discrepancies: [disc(C12, 'puede recaer en el propio Director Clínico o en otro profesional')],
    judgments: [{ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: contra(8),
                  discarded: { 'citaDeContexto': 3, 'verificado.por_localizacion': 5 }, descartesPorCitaOmitidos: 1 }],
    lecturaDeLasParejas: [lectura(C12, H45, 500)],
    llamadasAlModelo: registro([llamada('juez', C12, H45, 500)]),
  });
  // ruido, todo al techo: fuera de la ventana, de otra organización, y de otro documento
  const ruido = { discrepancies: [], judgments: [{ documentId: C12, documentName: 'CLI-12_manual.docx', contradictions: contra(12), discarded: {} }],
                  lecturaDeLasParejas: [lectura(C12, H45, 4096)], llamadasAlModelo: registro([llamada('juez', C12, H45, 4096)]) };
  await meter(ORG, '2026-10-26T21:00:00Z', 'NOR-10_x.docx', ruido);
  await meter(OTRA, '2026-10-26T22:15:00Z', 'NOR-10_x.docx', ruido);
  await meter(ORG, '2026-10-26T22:16:00Z', 'NOR-05_x.docx', ruido);
}
async function correr(o: Opciones = {}, conVentana = true, esperados: [number, number] | null = [4, 1]): Promise<Fila[]> {
  await sembrar(o);
  let sql = readFileSync('SQL_34_03_el_techo_del_juez.sql', 'utf8').replaceAll('public.', '');
  if (conVentana) {
    sql = sql.replace('NULL::timestamptz AS desde', "timestamptz '2026-10-26 23:00:00+01' AS desde")
             .replace('NULL::timestamptz AS hasta', "timestamptz '2026-10-27 00:30:00+01' AS hasta");
  }
  if (esperados) sql = sql.replace('NULL::int AS esperado_nor10', `${esperados[0]} AS esperado_nor10`).replace('NULL::int AS esperado_nor11', `${esperados[1]} AS esperado_nor11`);
  return (await db.query<Fila>(sql)).rows;
}
const de = (f: Fila[], b: string) => f.filter(x => x.bloque === b).map(x => [x.pasada, x.a, x.b, x.c, x.d]);

describe('SQL_34_03, el techo del juez y lo que emitió', () => {
  it('LA ORGANIZACIÓN LEÍDA va primera, y los siete controles salen OK con la ventana y los esperados puestos', async () => {
    const f = await correr();
    expect(f[0]).toMatchObject({ bloque: 'organización leída', a: 'organización leída: ' + ORG + ' · «Mi workspace» · 2 documentos' });
    expect(f.filter(x => x.bloque === '0 · control').map(x => [x.a, x.b])).toEqual([
      ['OK', 'ventana: 26/10 23:00 a 27/10 00:30 (hora de Madrid)'],
      ['OK', 'pasadas de NOR-10 en la ventana: 4 · esperado: 4'],
      ['OK', 'pasadas de NOR-11 en la ventana: 1 · esperado: 1'],
      ['OK', 'pasadas que no son rápidas: 0'],
      ['OK', 'pasadas sin registro por llamada o con llamadas fuera del detalle: 0'],
      ['OK', 'parejas sin ninguna llamada del juez con respuesta: 0 de 6'],
      ['OK', 'la frase de D está dentro de 2.4: carácter 1 a 387'],
    ]);
  });

  it('SIN PERTENENCIA, O CON DOS, lo grita en la primera fila, los esperados FALLAN y no se lee ninguna pasada', async () => {
    for (const n of [0, 2]) {
      await db.exec('DELETE FROM memberships');
      if (n === 2) await db.query('INSERT INTO memberships VALUES ($1, $2), ($1, $3)', [USUARIO, ORG, OTRA]);
      try {
        const f = await correr();
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
          ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
        expect(f.filter(x => x.bloque === '0 · control').map(x => x.a)).toEqual(['OK', 'FALLA', 'FALLA', 'NO APLICA', 'NO APLICA', 'NO APLICA', 'OK']);
        expect(f.filter(x => /^[12] ·/.test(x.bloque))).toHaveLength(0);
      } finally {
        await db.exec('DELETE FROM memberships');
        await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
      }
    }
  });

  it('SIN VENTANA: el control 1 FALLA, los esperados vacíos son NO APLICA, y no se lee ninguna pasada', async () => {
    const f = await correr({}, false, null);
    const c = f.filter(x => x.bloque === '0 · control');
    expect(c.map(x => x.a)).toEqual(['FALLA', 'NO APLICA', 'NO APLICA', 'NO APLICA', 'NO APLICA', 'NO APLICA', 'OK']);
    expect(c[0].b).toBe('ventana: SIN RELLENAR a SIN RELLENAR (hora de Madrid)');
    expect(f.filter(x => /^[12] ·/.test(x.bloque))).toHaveLength(0);
  });

  it('LOS CONTROLES QUE PUEDEN FALLAR: esperados que no cuadran, una pasada exhaustiva, sin registro, fuera del detalle, y una pareja sin llamada', async () => {
    const control = async (o: Opciones, esperados: [number, number] = [4, 1]) => (await correr(o, true, esperados)).filter(x => x.bloque === '0 · control').map(x => x.a);
    expect((await control({}, [5, 5])).slice(1, 3)).toEqual(['FALLA', 'FALLA']);
    expect((await control({ exhaustiva: true }))[3]).toBe('FALLA');
    expect((await control({ sinRegistro: true }))[4]).toBe('FALLA');
    expect((await control({ fueraDelDetalle: true }))[4]).toBe('FALLA');
    const sinLlamada = await correr({ sinLlamada: true });
    expect(sinLlamada.filter(x => x.bloque === '0 · control')[5]).toMatchObject({ a: 'FALLA', b: 'parejas sin ninguna llamada del juez con respuesta: 1 de 6' });
  });

  it('1 · EL TECHO: una fila por llamada del juez con respuesta, su tope, el 95 % a gritos, y D al lado', async () => {
    expect(de(await correr(), '1 · el techo')).toEqual([
      ['NOR-10 1', 'CLI-12_manual.docx · ' + H45 + ' · condiciones sin guardar', 'vuelta 1 · salida 4000 de 4096 deducido del modelo (97.7 %, faltan 96) · suma de la lectura: 4000',
        '⚠️⚠️ AL 95 % O MÁS DEL TOPE', 'D no publicada: muerta en la puerta de citas'],
      ['NOR-10 1', 'CLI-13_instrucciones.docx · ' + H45 + ' · condiciones sin guardar', 'vuelta 1 · salida 1000 de 4096 deducido del modelo (24.4 %, faltan 3096) · suma de la lectura: 1000',
        'por debajo del 95 %', 'D: no aplica'],
      ['NOR-10 2', 'CLI-12_manual.docx · ' + H55 + ' · condiciones sin guardar', 'vuelta 1 · salida 16000 de 16000 deducido del modelo (100.0 %, faltan 0) · suma de la lectura: 25000',
        '⚠️⚠️ AL 95 % O MÁS DEL TOPE', 'D PUBLICADA (norma_contra_norma)'],
      ['NOR-10 2', 'CLI-12_manual.docx · ' + H55 + ' · condiciones sin guardar', 'vuelta 2 · salida 9000 de 16000 deducido del modelo (56.3 %, faltan 7000) · suma de la lectura: 25000',
        'por debajo del 95 %', 'D PUBLICADA (norma_contra_norma)'],
      ['NOR-10 3', 'CLI-12_manual.docx · claude-otro (⚠️ la lectura dice ' + H45 + ')' + ' · condiciones sin guardar', 'vuelta 1 · salida 3000 de TOPE DESCONOCIDO · suma de la lectura: 3000',
        'TOPE DESCONOCIDO para este modelo', 'D PUBLICADA (sin especie)'],
      ['NOR-10 4', 'CLI-12_manual.docx · ' + H45 + ' · temperatura 0.1 · esfuerzo sin_enviar', 'vuelta 1 · salida 2000 de 2048 del dato (97.7 %, faltan 48) · suma de la lectura: 2000',
        '⚠️⚠️ AL 95 % O MÁS DEL TOPE', 'D no publicada'],
      ['NOR-11 1', 'CLI-12_manual.docx · ' + H45 + ' · condiciones sin guardar', 'vuelta 1 · salida 500 de 4096 deducido del modelo (12.2 %, faltan 3596) · suma de la lectura: 500',
        'por debajo del 95 %', 'D: no aplica'],
    ]);
  });

  it('2 · LO EMITIDO: publicadas sin el diff, cascada sin el desglose, puerta, frontera y lo sin atribuir, frente al tope de 10', async () => {
    expect(de(await correr(), '2 · lo emitido')).toEqual([
      ['NOR-10 1', 'CLI-12_manual.docx', 'publicadas 1 · cascada 3 · puerta 1 · frontera 1 · sin atribuir 1 (narración 1, contexto 0, omitidos 0)',
        'emitidas: entre 6 y 7', 'no llega a 10'],
      ['NOR-10 1', 'CLI-13_instrucciones.docx · ⚠️ SIN «discarded» GUARDADO: agujero del medidor',
        'publicadas 0 · cascada 0 · puerta 0 · frontera 0 · sin atribuir 0 (narración 0, contexto 0, omitidos 0)', 'emitidas: 0', 'el tope de 10: NO SE PUEDE DECIR'],
      ['NOR-10 2', 'CLI-12_manual.docx', 'publicadas 9 · cascada 1 · puerta 0 · frontera 0 · sin atribuir 0 (narración 0, contexto 0, omitidos 0)',
        'emitidas: 10', '⚠️⚠️ LLEGA A 10 O MÁS'],
      ['NOR-10 3', 'CLI-12_manual.docx', 'publicadas 1 · cascada 0 · puerta 0 · frontera 0 · sin atribuir 0 (narración 0, contexto 0, omitidos 0)',
        'emitidas: NO SE PUEDE DECIR (la respuesta no traía la lista)', 'el tope de 10: NO SE PUEDE DECIR'],
      ['NOR-10 4', 'CLI-12_manual.docx', 'publicadas 0 · cascada 0 · puerta 0 · frontera 0 · sin atribuir 0 (narración 0, contexto 0, omitidos 0)',
        'emitidas: 0', 'no llega a 10'],
      ['NOR-11 1', 'CLI-12_manual.docx', 'publicadas 8 · cascada 0 · puerta 0 · frontera 0 · sin atribuir 4 (narración 0, contexto 3, omitidos 1)',
        'emitidas: entre 8 y 12', 'el tope de 10: NO SE PUEDE DECIR (depende de lo sin atribuir)'],
    ]);
  });
});
