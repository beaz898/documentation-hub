import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { CLI13, NOR11, contadoresACero, especies, fraseDe, poner, publicada, textoDe, type Fila, type Publicada } from './textos';

/**
 * EL ARNÉS DEL MEDIDOR DE NOR-11 (`SQL_F128_01_nor11_con_haiku55.sql`), en PGlite, con el texto
 * real de NOR-11 y CLI-13. Entró en la suite el 19/10/2026 (arquitecto): el medidor es lo que
 * falló cuatro veces el 19/10, y este arnés es lo único que lo vigila.
 *
 * Qué vigila: los controles del bloque 0; la especie de cada contradicción publicada POR LA CITA
 * (la que puntúa) y POR LA FRASE (la que sólo se lee); los dos límites de la frase; y los dos
 * controles negativos permanentes de la pasada 8 —la trampa de Chamberí, que tiene que dar OTRA
 * en las dos, y un LUGAR con la cita mala que demuestra que la columna de la frase no cuenta—.
 */
const ORG = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ID = { nor: '11111111-1111-1111-1111-111111111111', c13: '33333333-3333-3333-3333-333333333333' };
const C = publicada(CLI13);

// La línea base del 14/10 (claude/Predicciones_F126_La_Regla_De_La_Cita.md)
const PLAZO = C('Plazo máximo de almacenamiento', 'los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de 72 horas desde el momento en que se cierran', 'ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de 7 días naturales desde que se cierra');
const LUGAR = C('Ubicación del punto de retirada', 'El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica de Chamberí', 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro, que es el centro de referencia logística de residuos sanitarios de Dentavia');
const NEG_BASE = C('Color del contenedor para residuos grupo III', 'el resto de residuos biosanitarios especiales no punzantes (gasas, guantes, apósitos), que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada gabinete', 'Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado en cada gabinete');
// La tanda de Haiku 5.5 (19/10): la de la bolsa amarilla y la NEGATIVA del 10.2 que citó en cuatro de siete
const NEG_55 = C('Tipo de contenedor para residuos biosanitarios', 'que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada gabinete', 'se depositan en el contenedor negro habilitado en cada gabinete');
const NEG_NEGATIVA = C('Contenedor para residuos del grupo III', 'En ningún caso se depositan en el contenedor negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I', 'se depositan en el contenedor negro habilitado en cada gabinete');
// Trampas: dos sintéticas, que no son literales, y dos literales del texto real
const TRAMPA_LUGAR = C('Ubicación', 'la recogida se coordina desde la clínica de Chamberí', 'el almacén de la clínica de Chamberí se revisa cada mes');
const TRAMPA_PLAZO = C('Plazo', 'el contenedor no puede pasar de 72 horas', 'tampoco el de vidrio puede pasar de 72 horas');
const TRAMPA_CHAMBERI = C('Ubicación', 'ubicado en la clínica de Chamberí', 'Si trabajas en Chamberí o Salamanca y tienes dudas sobre una recogida');
const TRAMPA_PLAZO_LITERAL = C('Plazo', 'El cómputo de las 72 horas se inicia en el momento exacto en que el personal auxiliar cierra el contenedor', 'Si trabajas en Chamberí o Salamanca y tienes dudas sobre una recogida');
// Un LUGAR bueno con la cita mala: su frase lleva «en la clínica de Chamberí», la cita no
const LUGAR_CITA_MALA = C('Ubicación del punto de retirada', 'desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro', 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro, que es el centro de referencia logística de residuos sanitarios de Dentavia');

/** [por la cita, por la frase] */
const ESPERADO = new Map<Publicada, [string, string, string]>([
  [PLAZO, ['PLAZO', 'PLAZO', 'PLAZO de la línea base']], [LUGAR, ['LUGAR', 'LUGAR', 'LUGAR de la línea base']],
  [NEG_BASE, ['NEGACIÓN', 'NEGACIÓN', 'NEGACIÓN de la línea base (3.3)']], [NEG_55, ['NEGACIÓN', 'NEGACIÓN', 'NEGACIÓN de 5.5, la bolsa amarilla']],
  [NEG_NEGATIVA, ['NEGACIÓN', 'NEGACIÓN', 'NEGACIÓN de 5.5, la negativa del 10.2']],
  [TRAMPA_LUGAR, ['OTRA', 'SIN FRASE', 'trampa LUGAR sintética']], [TRAMPA_PLAZO, ['OTRA', 'SIN FRASE', 'trampa PLAZO sintética']],
  [TRAMPA_CHAMBERI, ['OTRA', 'OTRA', 'trampa de Chamberí (expectativa invertida el 19/10)']],
  [TRAMPA_PLAZO_LITERAL, ['OTRA', 'OTRA', 'trampa PLAZO literal, 72 horas en un solo lado']],
  [LUGAR_CITA_MALA, ['OTRA', 'LUGAR', 'LUGAR con la cita mala']],
]);

let filas: Fila[] = [];

beforeAll(async () => {
  const nor = await textoDe(NOR11), c13 = await textoDe(CLI13);
  const db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_id uuid, document_name text, analysis_type text, contradictions_found int, overlaps_found int, pipeline_counters jsonb, analysis jsonb);
    CREATE TABLE documents (id uuid, org_id text, name text, active_generation int, full_text text);
    CREATE TABLE document_chunks (document_id uuid, org_id text, generation int, chunk_index int, chunk_type text, text text);`);
  await db.query('INSERT INTO documents VALUES ($1,$2,$3,1,$4),($5,$2,$6,1,$7)', [ID.nor, ORG, NOR11, nor.fullText, ID.c13, CLI13, c13.fullText]);
  for (const c of nor.trozos) await db.query('INSERT INTO document_chunks VALUES ($1,$2,1,$3,$4,$5)', [ID.nor, ORG, c.chunkIndex, c.chunkType, c.text]);
  const meter = (t: string, d: Publicada[], modelo: string | null) => db.query(
    'INSERT INTO analysis_results (org_id, created_at, document_id, document_name, analysis_type, contradictions_found, overlaps_found, pipeline_counters, analysis) VALUES ($1,$2,$3,$4,$5,$6,1,$7,$8)',
    [ORG, t, ID.nor, NOR11, 'quick', d.length, contadoresACero(), { discrepancies: d, judgments: [{ documentName: CLI13, contradictions: d }],
      lecturaDeLasParejas: [{ documentId: ID.c13, analizado: { caracteres: 14704, mostrados: 14704 }, ...(modelo ? { modelo, tokensDeSalida: 2600 } : {}) }] }]);
  for (let i = 0; i < 7; i++) await meter(`2026-10-14T06:${String(29 + 2 * i).padStart(2, '0')}:00Z`, [PLAZO, NEG_BASE, LUGAR], null);
  for (let i = 0; i < 7; i++) {
    const d = [PLAZO, i < 4 ? NEG_NEGATIVA : NEG_55, LUGAR];            // la negativa en cuatro de siete, como en la tanda
    if (i === 5) d.push(TRAMPA_LUGAR, TRAMPA_PLAZO, TRAMPA_CHAMBERI, TRAMPA_PLAZO_LITERAL);
    await meter(`2026-10-19T10:${String(15 + 3 * i).padStart(2, '0')}:00Z`, d, 'claude-haiku-5-5');
  }
  // la pasada 8, la de los dos controles negativos permanentes: sin LUGAR de verdad
  await meter('2026-10-19T10:38:00Z', [PLAZO, NEG_NEGATIVA, TRAMPA_CHAMBERI, LUGAR_CITA_MALA], 'claude-haiku-5-5');
  let sql = readFileSync('SQL_F128_01_nor11_con_haiku55.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS nueva_desde/, "timestamptz '2026-10-19 12:14:00+02' AS nueva_desde");
  sql = poner(sql, /timestamptz '[^']+' AS nueva_hasta/, "timestamptz '2026-10-19 12:40:00+02' AS nueva_hasta");
  sql = poner(sql, /timestamptz '[^']+' AS push/, "timestamptz '2026-10-19 12:04:00+02' AS push");
  sql = poner(sql, /\d+ AS esperado_nueva/, '8 AS esperado_nueva');
  filas = (await db.query<Fila>(sql)).rows;
  await db.close();
}, 120_000);

describe('SQL_F128_01, el medidor de NOR-11', () => {
  it('todos los controles del bloque 0 salen OK', () => {
    const controles = filas.filter(f => f.bloque.startsWith('0'));
    expect(controles.length).toBeGreaterThan(30);
    expect(controles.filter(f => f.a !== 'OK').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });

  it('cada contradicción publicada sale con su especie por la cita y por la frase', () => {
    const publicadas = filas.filter(f => f.bloque.startsWith('2 ·'));
    expect(publicadas.length).toBe(7 * 3 + 4 + 4);
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

  it('el marcador, por la cita, es 3/3 en las siete de la línea base y las siete de la tanda', () => {
    const censo = filas.filter(f => f.bloque.startsWith('1 ·') && f.pasada !== 'nueva 8');
    expect(censo.length).toBe(14);
    for (const f of censo) expect(f.c, f.pasada ?? '').toContain('· marcador 3/3 ·');
  });

  it('los dos límites de la frase: la negativa sale exactamente como la sembrada, sin la frase de antes ni la de después', () => {
    const neg = filas.find(f => f.bloque.startsWith('2 ·') && especies(f).nuevo === NEG_NEGATIVA.newDocSays);
    expect(neg).toBeDefined();
    expect(fraseDe(neg as Fila, 'NUEVO')).toBe('En ningún caso se depositan en el contenedor negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I.');
  });

  it('CONTROL NEGATIVO PERMANENTE: la columna de la frase no cuenta para el marcador (pasada 8)', () => {
    // El LUGAR con la cita mala da LUGAR por la frase (3/3) y el marcador se queda en 2/3. Si el marcador se
    // contara por la frase, subiría a 3/3. La trampa de Chamberí, en la misma pasada, la vigila la tabla ESPERADO.
    const ocho = filas.find(f => f.bloque.startsWith('1 ·') && f.pasada === 'nueva 8');
    expect(ocho?.c).toContain('· marcador 2/3 ·');
    expect(ocho?.c).toMatch(/POR LA FRASE \(no cuenta\): [^,]*LUGAR[^,]*, 3\/3/);
  });
});
