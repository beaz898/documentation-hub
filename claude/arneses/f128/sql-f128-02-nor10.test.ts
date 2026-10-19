import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { CLI12, NOR10, contadoresACero, especies, fraseDe, poner, publicada, textoDe, type Fila, type Publicada } from './textos';

/**
 * EL ARNÉS DEL MEDIDOR DE NOR-10 (`SQL_F128_02_nor10_con_haiku55.sql`), en PGlite, con el texto
 * real de NOR-10 y CLI-12. Entró en la suite el 19/10/2026 (arquitecto): el medidor es lo que
 * falló cuatro veces el 19/10, y este arnés es lo único que lo vigila.
 *
 * Qué vigila: los controles del bloque 0; la especie de cada contradicción publicada por la cita
 * y por la frase, con los pares al valor declarado por el registro (A: el cargo Y una
 * formulación; B y D, enteros); los dos límites de la frase; y los controles negativos: el
 * contraejemplo del cargo solo, dos trampas que el par recortado de B y D se tragaba, y la D que
 * «vive pegada a la A» (registro), que no puede salir A.
 */
const ORG = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ID = { nor: '11111111-1111-1111-1111-111111111111', cli: '22222222-2222-2222-2222-222222222222' };
const D = publicada(CLI12);

// A: la de la línea base del 16/10 (las dos frases de la negrita del registro) y las tres de la tanda,
// RECONSTRUIDAS de la descripción del arquitecto (autorizar excepciones, firmar auditorías, retirar el autoclave)
const A_BASE = D('Responsable último de la esterilización', 'El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente', 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico');
const A_EXC = D('Autorización de excepciones', 'quien autoriza cualquier excepción documentada al procedimiento', 'quien autoriza cualquier excepción documentada al protocolo de esterilización');
const A_FIR = D('Firma de auditorías', 'la firma de los registros de auditoría trimestral', 'quien firma los registros de auditoría trimestral del área');
const A_AUT = D('Retirada del autoclave', 'la decisión de retirar del servicio un autoclave que no supere un control biológico', 'la retirada de servicio de un autoclave que no supere un control biológico');
// El contraejemplo del cargo solo (19/10): las dos citas nombran los dos cargos y no hablan de lo mismo
const TRAMPA_A = D('Notificación', 'se notifica al Director Clínico y se repite la esterilización de toda la carga procesada', 'coordinada conjuntamente por el Coordinador de Calidad y el Director Clínico del centro afectado');
// B y D al valor declarado (19/10)
const B_REAL = D('Control biológico', 'El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora', 'El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes');
const B_CITA_MALA = D('Control biológico', 'El control biológico del autoclave se realiza semanalmente', 'Esta periodicidad mensual se considera suficiente desde el punto de vista de calidad');
const D_REAL = D('¿Pueden coincidir las dos figuras?', 'figura que puede recaer en el propio Director Clínico o en otro profesional designado por él', 'nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones');
const TRAMPA_B = D('Periodicidad', 'Semanalmente se realiza el test de la lámina de aluminio', 'Los resultados se consolidan mensualmente por clínica y se incorporan al cuadro de mando de calidad');
const TRAMPA_D = D('Coincidencia', 'figura que puede recaer en el propio Director Clínico', 'nunca como mecanismo de control individual del personal presente en el momento de la auditoría');
// «LA D VIVE PEGADA A LA A» (registro): la segunda frase de NOR-10 2.4 lleva cargo y «responsabilidad última»
const EN_35 = 'En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro';
const D_24B_35 = D('¿Pueden coincidir?', 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1', EN_35);
const D_24A_35 = D('¿Pueden coincidir?', 'Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él', EN_35);
const A_24B_31 = D('Responsable último', 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1', 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico');

/** [por la cita, por la frase, nombre] */
const ESPERADO = new Map<Publicada, [string, string, string]>([
  [A_BASE, ['A', 'A', 'A de la línea base']], [A_EXC, ['OTRA', 'A', 'A, autorizar excepciones']],
  [A_FIR, ['OTRA', 'A', 'A, firmar auditorías']], [A_AUT, ['OTRA', 'A', 'A, retirar el autoclave']],
  [TRAMPA_A, ['OTRA', 'OTRA', 'contraejemplo del cargo solo']],
  [B_REAL, ['B', 'B', 'B sembrada']], [B_CITA_MALA, ['OTRA', 'B', 'B con la cita mala']], [D_REAL, ['D', 'D', 'D']],
  [TRAMPA_B, ['OTRA', 'OTRA', 'trampa B: test semanal de la cubeta contra resultados mensuales']],
  [TRAMPA_D, ['OTRA', 'OTRA', 'trampa D: «nunca como mecanismo de control individual»']],
  [D_24B_35, ['OTRA', 'OTRA', 'D por la 2.ª frase de 2.4, con 3.5: NO sale A']],
  [D_24A_35, ['D', 'D', 'D por la 1.ª frase de 2.4, con 3.5']],
  [A_24B_31, ['A', 'A', '2.4 (2.ª frase) contra el 3.1 de la A']],
]);

let filas: Fila[] = [];

beforeAll(async () => {
  const nor = await textoDe(NOR10), cli = await textoDe(CLI12);
  const rec = nor.trozos.map(c => c.text).join('\n\n');
  const db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_id uuid, document_name text, contradictions_found int, pipeline_counters jsonb, analysis jsonb);
    CREATE TABLE documents (id uuid, org_id text, name text, active_generation int, full_text text);
    CREATE TABLE document_chunks (document_id uuid, org_id text, generation int, chunk_index int, chunk_type text, text text);`);
  await db.query('INSERT INTO documents VALUES ($1,$2,$3,1,$4),($5,$2,$6,1,$7)', [ID.nor, ORG, NOR10, nor.fullText, ID.cli, CLI12, cli.fullText]);
  for (const [id, t] of [[ID.nor, nor], [ID.cli, cli]] as const)
    for (const c of t.trozos) await db.query('INSERT INTO document_chunks VALUES ($1,$2,1,$3,$4,$5)', [id, ORG, c.chunkIndex, c.chunkType, c.text]);
  const tanda = [A_EXC, A_FIR, A_AUT];
  const pasadas = [[A_BASE], tanda, tanda, [...tanda, TRAMPA_A, B_REAL, B_CITA_MALA, D_REAL, TRAMPA_B, TRAMPA_D, D_24B_35, D_24A_35, A_24B_31]];
  for (let i = 0; i < pasadas.length; i++) {
    const ds = pasadas[i];
    await db.query('INSERT INTO analysis_results (org_id, created_at, document_id, document_name, contradictions_found, pipeline_counters, analysis) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [ORG, `2026-10-19T1${i}:10:00Z`, ID.nor, NOR10, ds.length, contadoresACero(), { discrepancies: ds, judgments: [{ documentName: CLI12, contradictions: ds }],
        lecturaDeLasParejas: [{ documentId: ID.cli, regimen: 'corte_honesto', modelo: 'claude-haiku-5-5', tokensDeSalida: 3100,
          analizado: { caracteres: rec.length, mostrados: 37143, dejoFuera: true }, candidato: { caracteres: 55135, mostrados: 2857, dejoFuera: true }, presupuesto: 40000 }] }]);
  }
  let sql = readFileSync('SQL_F128_02_nor10_con_haiku55.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS desde/, "timestamptz '2026-10-19 11:00:00+02' AS desde");
  sql = poner(sql, /timestamptz '[^']+' AS hasta/, "timestamptz '2026-10-19 17:00:00+02' AS hasta");
  sql = poner(sql, /timestamptz '[^']+' AS push/, "timestamptz '2026-10-16 12:50:00+02' AS push");
  sql = poner(sql, /(true|false) AS exigir_modelo/, 'true AS exigir_modelo');
  sql = poner(sql, /3 AS esperado/, '4 AS esperado');
  filas = (await db.query<Fila>(sql)).rows;
  await db.close();
}, 120_000);

describe('SQL_F128_02, el medidor de NOR-10', () => {
  it('todos los controles del bloque 0 salen OK', () => {
    const controles = filas.filter(f => f.bloque.startsWith('0'));
    expect(controles.length).toBeGreaterThan(20);
    expect(controles.filter(f => f.a !== 'OK').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });

  it('cada contradicción publicada sale con su especie por la cita y por la frase', () => {
    const publicadas = filas.filter(f => f.bloque.startsWith('2 ·') && f.a !== 'ninguna');
    expect(publicadas.length).toBe(1 + 3 + 3 + 12);
    const mal: string[] = [];
    for (const f of publicadas) {
      const e = especies(f);
      const caso = [...ESPERADO.keys()].find(k => k.newDocSays === e.nuevo && k.existingDocSays === e.existente);
      if (!caso) { mal.push(`${f.pasada}: cita sin caso: ${e.nuevo.slice(0, 50)}`); continue; }
      const [cita, frase, nombre] = ESPERADO.get(caso) ?? ['', '', ''];
      if (e.cita !== cita || e.frase !== frase) mal.push(`${f.pasada} · ${nombre}: cita ${e.cita} (esperado ${cita}), frase ${e.frase} (esperado ${frase})`);
    }
    expect(mal).toEqual([]);
  });

  it('los dos límites de la frase, con casos decisivos', () => {
    const exc = filas.find(f => f.bloque.startsWith('2 ·') && especies(f).nuevo === A_EXC.newDocSays) as Fila;
    // el principio: la de las excepciones va detrás de «El responsable último…» en su párrafo
    expect(fraseDe(exc, 'NUEVO')).toBe('Es el Director Clínico quien debe asegurar que existen los recursos materiales y humanos necesarios para ejecutar cada etapa del ciclo de esterilización conforme a lo aquí descrito, quien autoriza cualquier excepción documentada al procedimiento y quien responde ante Dirección de Operaciones en caso de incidencia grave relacionada con la esterilización del instrumental.');
    // el final: la del Coordinador de Calidad tiene otra frase detrás en su párrafo
    expect(fraseDe(exc, 'EXISTENTE')).toBe('El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico.');
  });
});
