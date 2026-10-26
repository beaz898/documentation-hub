import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { CLI12, CLI13, NOR10, contadoresACero, especies, fraseDe, poner, publicada, textoDe, type Fila, type Publicada } from './textos';

/**
 * EL ARNÉS DEL MEDIDOR DE NOR-10 (`SQL_F128_02_nor10_con_haiku55.sql`), en PGlite, con el texto
 * real de NOR-10, CLI-12 y CLI-13. Entró en la suite el 19/10/2026 (arquitecto): el medidor es lo
 * que falló cuatro veces el 19/10, y este arnés es lo único que lo vigila.
 *
 * TRES BASES, montadas por separado:
 *  · LA RÉPLICA DE LA LÍNEA BASE del 16/10 (Haiku 4.5, tres pasadas, una A cada una), con la cita
 *    EXACTA de la salida del director del 20/10: OTRA por la cita y A por la frase, mediana 281, y
 *    el 0.9 en NO APLICA porque no guarda el modelo.
 *  · LA RÉPLICA DE LA TANDA de Haiku 5.5 del 19/10 (publicadas 4/3/2), con sus citas exactas: las
 *    ocho A, OTRA por la cita y A por la frase; la de CLI-13, OTRA en las dos; mediana 83.
 *  · LOS CONTROLES sintéticos: los pares al valor declarado por el registro (A: el cargo Y una
 *    formulación; B y D, enteros), el contraejemplo del cargo solo, las trampas que el par recortado
 *    de B y D se tragaba, y la D que «vive pegada a la A» (registro), que no puede salir A.
 */
// La organización se RESUELVE por el USUARIO (26/10/2026). USUARIO y ORG son DISTINTOS a propósito: en la base son el
// mismo número (código de antes del 27/04), y con el mismo número aquí, volver a leer el id del piloto como
// organización pasaría sin que nada lo notara. `pertenencias` es para los casos de la guarda, al final.
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA_ORG = '99999999-9999-9999-9999-999999999999';
let pertenencias = 1;
const ID = { nor: '11111111-1111-1111-1111-111111111111', cli: '22222222-2222-2222-2222-222222222222', c13: '33333333-3333-3333-3333-333333333333' };
const D = publicada(CLI12), D13 = publicada(CLI13);

// ── Las citas EXACTAS de las dos salidas del director (20/10)
const COORD_ENTERA = 'El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico';
const A_45 = D('Autoridad para retirar autoclave de servicio tras fallo de control biológico', 'la responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre esta figura', COORD_ENTERA);
const EXC = D('Responsable de autorizar excepciones', 'quien autoriza cualquier excepción documentada al procedimiento', 'El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización');
const FIR = D('Responsable de firmar los registros de auditoría trimestral', 'la firma de los registros de auditoría trimestral', 'quien firma los registros de auditoría trimestral del área');
const FIR_INCL = D('Responsable de la firma de los registros de auditoría trimestral', 'incluida la firma de los registros de auditoría trimestral', 'quien firma los registros de auditoría trimestral del área');
const AUT = D('Responsable de la retirada de un autoclave', 'la decisión de retirar del servicio un autoclave que no supere un control biológico', 'quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico');
const NOR04 = D13('Protocolo de referencia para la gestión de residuos sanitarios (NOR-04 frente a NOR-11)', 'Queda fuera de alcance el material de un solo uso, que se rige por el protocolo NOR-04 de gestión de residuos sanitarios.', 'lo establecido en el protocolo NOR-11 de gestión de residuos sanitarios');
const TANDA: Publicada[][] = [[EXC, FIR, AUT, NOR04], [EXC, AUT, FIR_INCL], [EXC, AUT]];

// ── Los controles sintéticos (literales del texto real)
const A_BASE = D('Responsable último de la esterilización', 'El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente', 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico');
const TRAMPA_A = D('Notificación', 'se notifica al Director Clínico y se repite la esterilización de toda la carga procesada', 'coordinada conjuntamente por el Coordinador de Calidad y el Director Clínico del centro afectado');
const B_REAL = D('Control biológico', 'El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora', 'El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes');
const B_CITA_MALA = D('Control biológico', 'El control biológico del autoclave se realiza semanalmente', 'Esta periodicidad mensual se considera suficiente desde el punto de vista de calidad');
const D_REAL = D('¿Pueden coincidir las dos figuras?', 'figura que puede recaer en el propio Director Clínico o en otro profesional designado por él', 'nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones');
const TRAMPA_B = D('Periodicidad', 'Semanalmente se realiza el test de la lámina de aluminio', 'Los resultados se consolidan mensualmente por clínica y se incorporan al cuadro de mando de calidad');
const TRAMPA_D = D('Coincidencia', 'figura que puede recaer en el propio Director Clínico', 'nunca como mecanismo de control individual del personal presente en el momento de la auditoría');
const EN_35 = 'En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro';
const D_24B_35 = D('¿Pueden coincidir?', 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1', EN_35);
const D_24A_35 = D('¿Pueden coincidir?', 'Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él', EN_35);
const A_24B_31 = D('Responsable último', 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1', 'El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico');

/** [por la cita, por la frase, nombre] */
const ESPERADO = new Map<Publicada, [string, string, string]>([
  [A_45, ['OTRA', 'A', 'la A de Haiku 4.5, sin el cargo']],
  [EXC, ['OTRA', 'A', 'A, autorizar excepciones']], [FIR, ['OTRA', 'A', 'A, firmar auditorías']], [FIR_INCL, ['OTRA', 'A', 'A, «incluida la firma…»']],
  [AUT, ['OTRA', 'A', 'A, retirar el autoclave']], [NOR04, ['OTRA', 'OTRA', 'la de CLI-13, NOR-04 frente a NOR-11']],
  [A_BASE, ['A', 'A', 'A, las dos frases de la negrita del registro']], [TRAMPA_A, ['OTRA', 'OTRA', 'contraejemplo del cargo solo']],
  [B_REAL, ['B', 'B', 'B sembrada']], [B_CITA_MALA, ['OTRA', 'B', 'B con la cita mala']], [D_REAL, ['D', 'D', 'D']],
  [TRAMPA_B, ['OTRA', 'OTRA', 'trampa B: test semanal de la cubeta contra resultados mensuales']],
  [TRAMPA_D, ['OTRA', 'OTRA', 'trampa D: «nunca como mecanismo de control individual»']],
  [D_24B_35, ['OTRA', 'OTRA', 'D por la 2.ª frase de 2.4, con 3.5: NO sale A']],
  [D_24A_35, ['D', 'D', 'D por la 1.ª frase de 2.4, con 3.5']],
  [A_24B_31, ['A', 'A', '2.4 (2.ª frase) contra el 3.1 de la A']],
]);

interface Lectura { candidato: 'cli' | 'c13'; tokens?: number }
async function montar(pasadas: { hora: string; ds: Publicada[]; modelo: boolean }[], ventana: { desde: string; hasta: string; push: string; exigir: boolean }, entera = false): Promise<Fila[]> {
  const nor = await textoDe(NOR10), cli = await textoDe(CLI12), c13 = await textoDe(CLI13);
  const rec = nor.trozos.map(c => c.text).join('\n\n');
  const db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_id uuid, document_name text, contradictions_found int, pipeline_counters jsonb, analysis jsonb);
    CREATE TABLE documents (id uuid, org_id text, name text, active_generation int, full_text text);
    CREATE TABLE document_chunks (document_id uuid, org_id text, generation int, chunk_index int, chunk_type text, text text);`);
  await db.query('INSERT INTO documents VALUES ($1,$2,$3,1,$4),($5,$2,$6,1,$7),($8,$2,$9,1,$10)', [ID.nor, ORG, NOR10, nor.fullText, ID.cli, CLI12, cli.fullText, ID.c13, CLI13, c13.fullText]);
  for (const [id, t] of [[ID.nor, nor], [ID.cli, cli], [ID.c13, c13]] as const)
    for (const c of t.trozos) await db.query('INSERT INTO document_chunks VALUES ($1,$2,1,$3,$4,$5)', [id, ORG, c.chunkIndex, c.chunkType, c.text]);
  // las dos parejas, con lo que leyó el juez de cada una en la tanda real (bloque 1 de las salidas)
  const lectura = (l: Lectura, modelo: boolean) => l.candidato === 'cli'
    ? { documentId: ID.cli, regimen: 'corte_honesto', analizado: { caracteres: rec.length, mostrados: 37143, dejoFuera: true }, candidato: { caracteres: 55135, mostrados: 2857, dejoFuera: true }, presupuesto: 40000, ...(modelo ? { modelo: 'claude-haiku-5-5', tokensDeSalida: 3000 } : {}) }
    : { documentId: ID.c13, regimen: 'corte_honesto', analizado: { caracteres: rec.length, mostrados: 30183, dejoFuera: true }, candidato: { caracteres: 9817, mostrados: 9817, dejoFuera: false }, presupuesto: 40000, ...(modelo ? { modelo: 'claude-haiku-5-5', tokensDeSalida: 2000 } : {}) };
  // 22/10/2026: con la ventana de 150.000 las dos parejas van ENTERAS, y no hay corte
  const enteraDe = (l: Lectura, modelo: boolean) => ({ ...lectura(l, modelo), regimen: 'pareja_entera', presupuesto: 150000,
    analizado: { caracteres: rec.length, mostrados: rec.length, dejoFuera: false },
    candidato: l.candidato === 'cli' ? { caracteres: 55135, mostrados: 55135, dejoFuera: false } : { caracteres: 9817, mostrados: 9817, dejoFuera: false } });
  for (const p of pasadas) {
    const deCLI12 = p.ds.filter(d => d.existingDocument === CLI12), deCLI13 = p.ds.filter(d => d.existingDocument === CLI13);
    const leer = entera ? enteraDe : lectura;
    await db.query('INSERT INTO analysis_results (org_id, created_at, document_id, document_name, contradictions_found, pipeline_counters, analysis) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [ORG, p.hora, ID.nor, NOR10, p.ds.length, contadoresACero(), { discrepancies: p.ds,
        judgments: [{ documentName: CLI12, contradictions: deCLI12 }, { documentName: CLI13, contradictions: deCLI13 }],
        lecturaDeLasParejas: [leer({ candidato: 'cli' }, p.modelo), leer({ candidato: 'c13' }, p.modelo)] }]);
  }
  // LA PERTENENCIA (26/10/2026): la consulta resuelve la organización por el USUARIO; las tablas y la columna que
  // la guarda cuenta, por si el arnés no las tenía, y `pertenencias` filas de membresía, ni una más.
  await db.exec('CREATE TABLE IF NOT EXISTS memberships (user_id uuid, org_id uuid); CREATE TABLE IF NOT EXISTS organizations (id uuid, name text); ' +
    'CREATE TABLE IF NOT EXISTS documents (id uuid, org_id text); ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id text; ' +
    'DELETE FROM memberships; DELETE FROM organizations;');
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  for (let i = 0; i < pertenencias; i++) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, i === 0 ? ORG : OTRA_ORG]);
  let sql = readFileSync('SQL_F128_02_nor10_con_haiku55.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS desde/, `timestamptz '${ventana.desde}' AS desde`);
  sql = poner(sql, /timestamptz '[^']+' AS hasta/, `timestamptz '${ventana.hasta}' AS hasta`);
  sql = poner(sql, /timestamptz '[^']+' AS push/, `timestamptz '${ventana.push}' AS push`);
  sql = poner(sql, /(true|false) AS exigir_modelo/, `${ventana.exigir} AS exigir_modelo`);
  sql = poner(sql, /\d+ AS esperado/, `${pasadas.length} AS esperado`);
  const filas = (await db.query<Fila>(sql)).rows;
  await db.close();
  return filas;
}

let base: Fila[] = [], tanda: Fila[] = [], controles: Fila[] = [], sinCorte: Fila[] = [];
beforeAll(async () => {
  // la línea base del 16/10, con los valores de la tabla de la cabecera del SQL
  base = await montar(['2026-10-16T10:45:35Z', '2026-10-16T10:46:17Z', '2026-10-16T10:46:53Z'].map(hora => ({ hora, ds: [A_45], modelo: false })),
    { desde: '2026-10-16 12:40:00+02', hasta: '2026-10-16 12:50:00+02', push: '2026-10-13 21:20:36+02', exigir: false });
  tanda = await montar(['2026-10-19T12:26:02Z', '2026-10-19T12:26:40Z', '2026-10-19T12:28:29Z'].map((hora, i) => ({ hora, ds: TANDA[i], modelo: true })),
    { desde: '2026-10-19 14:20:00+02', hasta: '2026-10-19 14:35:00+02', push: '2026-10-16 12:50:00+02', exigir: true });
  controles = await montar([[A_BASE], [EXC, FIR, AUT], [TRAMPA_A, B_REAL, B_CITA_MALA, D_REAL, TRAMPA_B, TRAMPA_D, D_24B_35, D_24A_35, A_24B_31]]
    .map((ds, i) => ({ hora: `2026-10-19T1${i}:10:00Z`, ds, modelo: true })),
    { desde: '2026-10-19 11:00:00+02', hasta: '2026-10-19 17:00:00+02', push: '2026-10-16 12:50:00+02', exigir: true });
  // 22/10/2026: la misma tanda de 5.5, pero con las dos parejas enteras (ventana de 150.000): no hay corte
  sinCorte = await montar(['2026-10-19T12:26:02Z', '2026-10-19T12:26:40Z', '2026-10-19T12:28:29Z'].map((hora, i) => ({ hora, ds: TANDA[i], modelo: true })),
    { desde: '2026-10-19 14:20:00+02', hasta: '2026-10-19 14:35:00+02', push: '2026-10-16 12:50:00+02', exigir: true }, true);
}, 240_000);

describe('SQL_F128_02 · el bloque 8 sin corte (22/10/2026, arquitecto: la predicción 8 no podía fallar)', () => {
  it('con las dos parejas enteras no hay corte, y el bloque 8 dice NO APLICA, no «ninguna cita»', () => {
    expect(bloque(sinCorte, '8 ·').map(f => f.a)).toEqual(['NO APLICA: sin corte (el analizado fue entero en todas las parejas)']);
    expect(bloque(sinCorte, '7 ·')).toEqual([]);
  });
  it('y con corte, sin citas cerca, sigue diciendo «ninguna»: las dos ramas tienen su caso', () => {
    expect(bloque(base, '8 ·').map(f => f.a)).toEqual(['ninguna cita, publicada ni descartada, en los 500 anteriores al corte ni cruzándolo']);
  });
});

const bloque = (filas: Fila[], prefijo: string) => filas.filter(f => f.bloque.startsWith(prefijo));
function especiesMal(filas: Fila[]): string[] {
  const mal: string[] = [];
  for (const f of bloque(filas, '2 ·').filter(f => f.a !== 'ninguna')) {
    const e = especies(f);
    const caso = [...ESPERADO.keys()].find(k => k.newDocSays === e.nuevo && k.existingDocSays === e.existente);
    if (!caso) { mal.push(`${f.pasada}: cita sin caso: ${e.nuevo.slice(0, 50)}`); continue; }
    const [cita, frase, nombre] = ESPERADO.get(caso) ?? ['', '', ''];
    if (e.cita !== cita || e.frase !== frase) mal.push(`${f.pasada} · ${nombre}: cita ${e.cita} (esperado ${cita}), frase ${e.frase} (esperado ${frase})`);
  }
  return mal;
}

describe('SQL_F128_02 · la réplica de la línea base del 16/10 (Haiku 4.5)', () => {
  it('los controles salen OK, y el 0.9 NO APLICA en las tres (no guarda el modelo)', () => {
    const c = bloque(base, '0');
    expect(c.filter(f => f.a === 'NO APLICA').length).toBe(3);
    expect(c.filter(f => f.a !== 'OK' && f.a !== 'NO APLICA').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });
  it('la A de Haiku 4.5 sale OTRA por la cita y A por la frase, las tres veces', () => {
    expect(bloque(base, '2 ·').length).toBe(3);
    expect(especiesMal(base)).toEqual([]);
  });
  it('mediana 281, y la cita del nuevo dentro de lo entregado, en la 2748', () => {
    expect(bloque(base, '6 ·').find(f => f.a === 'TODAS')?.b).toBe('n 6 · mediana 281.0');
    expect(bloque(base, '2 ·')[0]?.c).toContain('literal, DENTRO de lo entregado (empieza en 2748)');
    expect(bloque(base, '3 ·')[0]?.a).toBe('de 3 citas publicadas del lado NOR-10: 0 no están dentro');
  });
});

describe('SQL_F128_02 · la réplica de la tanda de Haiku 5.5 del 19/10', () => {
  it('todos los controles del bloque 0 salen OK', () => {
    expect(bloque(tanda, '0').filter(f => f.a !== 'OK').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });
  it('publicadas 4/3/2: las ocho A, OTRA por la cita y A por la frase; la de CLI-13, OTRA en las dos', () => {
    expect(bloque(tanda, '2 ·').map(f => f.pasada)).toEqual(['pasada 1', 'pasada 1', 'pasada 1', 'pasada 1', 'pasada 2', 'pasada 2', 'pasada 2', 'pasada 3', 'pasada 3']);
    expect(especiesMal(tanda)).toEqual([]);
  });
  it('mediana 83, y cada cita del nuevo empieza donde la salida real dice', () => {
    expect(bloque(tanda, '6 ·').map(f => `${f.a}: ${f.b}`).sort()).toEqual(['CLI-12: n 16 · mediana 83.0', 'TODAS: n 18 · mediana 83.0']);
    const inicios = [...new Set(bloque(tanda, '2 ·').map(f => /empieza en (\d+)/.exec(f.c ?? '')?.[1]))].sort();
    expect(inicios).toEqual(['1474', '2439', '2775', '2784', '2836']);
  });
});

describe('SQL_F128_02 · los controles', () => {
  it('todos los controles del bloque 0 salen OK', () => {
    expect(bloque(controles, '0').filter(f => f.a !== 'OK').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });
  it('cada caso sale con su especie por la cita y por la frase', () => {
    expect(bloque(controles, '2 ·').length).toBe(1 + 3 + 9);
    expect(especiesMal(controles)).toEqual([]);
  });
  it('los dos límites de la frase, con casos decisivos', () => {
    const exc = bloque(controles, '2 ·').find(f => especies(f).nuevo === EXC.newDocSays) as Fila;
    // el principio: la de las excepciones va detrás de «El responsable último…» en su párrafo
    expect(fraseDe(exc, 'NUEVO')).toBe('Es el Director Clínico quien debe asegurar que existen los recursos materiales y humanos necesarios para ejecutar cada etapa del ciclo de esterilización conforme a lo aquí descrito, quien autoriza cualquier excepción documentada al procedimiento y quien responde ante Dirección de Operaciones en caso de incidencia grave relacionada con la esterilización del instrumental.');
    // el final: la del Coordinador de Calidad tiene otra frase detrás en su párrafo
    expect(fraseDe(exc, 'EXISTENTE')).toBe(COORD_ENTERA + '.');
  });
});

describe('LA ORGANIZACIÓN LEÍDA (26/10/2026): se resuelve por el usuario, y la primera fila lo dice', () => {
  it('va primera: la del usuario, con su nombre y sus documentos', async () => {
    const f = await montar([], { desde: '2026-10-19 14:20:00+02', hasta: '2026-10-19 14:35:00+02', push: '2026-10-16 12:50:00+02', exigir: false });
    expect(f[0].bloque).toBe('organización leída');
    expect(f[0].a).toMatch(new RegExp('^organización leída: ' + ORG + ' · «Mi workspace» · \\d+ documentos$'));
  }, 240_000);

  it('sin pertenencia, o con dos, lo grita en la primera fila', async () => {
    for (const n of [0, 2]) {
      pertenencias = n;
      try {
        const f = await montar([], { desde: '2026-10-19 14:20:00+02', hasta: '2026-10-19 14:35:00+02', push: '2026-10-16 12:50:00+02', exigir: false });
        expect(f[0].bloque).toBe('organización leída');
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
            ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
      } finally {
        pertenencias = 1;
      }
    }
  }, 240_000);
});
