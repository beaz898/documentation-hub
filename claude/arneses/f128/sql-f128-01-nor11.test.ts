import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { CLI13, NOR11, contadoresACero, especies, fraseDe, poner, publicada, textoDe, type Fila, type Publicada } from './textos';

/**
 * EL ARNÉS DEL MEDIDOR DE NOR-11 (`SQL_F128_01_nor11_con_haiku55.sql`), en PGlite, con el texto
 * real de NOR-11 y CLI-13. Entró en la suite el 19/10/2026 (arquitecto): el medidor es lo que
 * falló cuatro veces el 19/10, y este arnés es lo único que lo vigila.
 *
 * DOS BASES, montadas por separado para que una no ensucie las cifras de la otra:
 *  · LA RÉPLICA: las siete pasadas de la línea base del 14/10 y las siete de la tanda de Haiku 5.5
 *    del 19/10 con las citas EXACTAS que publicaron (la tanda, copiada del bloque 2 de la salida del
 *    director del 20/10; la línea base, de `claude/Predicciones_F126_La_Regla_De_La_Cita.md`). Tiene
 *    que reproducir lo que dio la base de verdad: controles, marcador, mediana 100,5 y 167, y las
 *    dos columnas coincidiendo en las 21 contradicciones de la tanda.
 *  · LOS CONTROLES: la misma tanda más dos pasadas sintéticas con las trampas y los dos controles
 *    negativos permanentes —la trampa de Chamberí, OTRA en las dos, y un LUGAR con la cita mala que
 *    demuestra que la columna de la frase no cuenta—.
 */
// La organización se RESUELVE por el USUARIO (26/10/2026). USUARIO y ORG son DISTINTOS a propósito: en la base son el
// mismo número (código de antes del 27/04), y con el mismo número aquí, volver a leer el id del piloto como
// organización pasaría sin que nada lo notara. `pertenencias` es para los casos de la guarda, al final.
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA_ORG = '99999999-9999-9999-9999-999999999999';
let pertenencias = 1;
const ID = { nor: '11111111-1111-1111-1111-111111111111', c13: '33333333-3333-3333-3333-333333333333' };
const C = publicada(CLI13);

// ── La línea base del 14/10 (Haiku 4.5), tal como se publicó
const B_PLAZO = C('Plazo máximo de almacenamiento', 'los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de 72 horas desde el momento en que se cierran', 'ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de 7 días naturales desde que se cierra');
const B_LUGAR = C('Ubicación del punto de retirada', 'El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica de Chamberí', 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro, que es el centro de referencia logística de residuos sanitarios de Dentavia');
const B_NEG = C('Color del contenedor para residuos grupo III', 'el resto de residuos biosanitarios especiales no punzantes (gasas, guantes, apósitos), que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada gabinete', 'Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado en cada gabinete');

// ── La tanda de Haiku 5.5 del 19/10, cita a cita, del bloque 2 de la salida del director
const T = {
  plazoCorto: 'no pueden permanecer en el área de almacenamiento intermedio más de 72 horas desde el momento en que se cierran',
  plazoLargo: 'los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de 72 horas desde el momento en que se cierran',
  sieteDias: 'ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de 7 días naturales desde que se cierra',
  sieteDiasCorto: 'debe permanecer en el almacén intermedio más de 7 días naturales desde que se cierra',
  chamberi: 'un punto de retirada centralizado, ubicado en la clínica de Chamberí',
  chamberiCorto: 'ubicado en la clínica de Chamberí',
  chamberiLargo: 'El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica de Chamberí',
  retiro: 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro',
  retiroCorto: 'se encuentra en la clínica de Retiro',
  amarillaQue: 'que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada gabinete',
  amarilla: 'se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada gabinete',
  negativa: 'En ningún caso se depositan en el contenedor negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I',
  negativaCorta: 'En ningún caso se depositan en el contenedor negro de zona común',
  negro: 'se depositan en el contenedor negro habilitado en cada gabinete',
  negroLargo: 'Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado en cada gabinete',
};
const P = (n: string, e: string) => C('Plazo', n, e), L = (n: string, e: string) => C('Lugar', n, e), N = (n: string, e: string) => C('Negación', n, e);
const TANDA: Publicada[][] = [
  [P(T.plazoCorto, T.sieteDias), L(T.chamberi, T.retiro), N(T.amarillaQue, T.negro)],
  [P(T.plazoLargo, T.sieteDias), N(T.negativa, T.negro), L(T.chamberi, T.retiro)],
  [P(T.plazoLargo, T.sieteDias), L(T.chamberi, T.retiroCorto), N(T.amarilla, T.negro)],
  [P(T.plazoCorto, T.sieteDias), L(T.chamberiCorto, T.retiroCorto), N(T.negativaCorta, T.negro)],
  [P(T.plazoLargo, T.sieteDias), L(T.chamberiCorto, T.retiroCorto), N(T.negativa, T.negroLargo)],
  [P(T.plazoLargo, T.sieteDias), L(T.chamberiLargo, T.retiro), N(T.negativa, T.negro)],
  [P(T.plazoCorto, T.sieteDiasCorto), L(T.chamberiCorto, T.retiroCorto), N(T.amarillaQue, T.negro)],
];
const ESPECIE_DE_LA_TANDA: Record<string, string> = { Plazo: 'PLAZO', Lugar: 'LUGAR', Negación: 'NEGACIÓN' };

// ── Los controles sintéticos: trampas y los dos controles negativos permanentes
const TRAMPA_LUGAR = C('Ubicación', 'la recogida se coordina desde la clínica de Chamberí', 'el almacén de la clínica de Chamberí se revisa cada mes');
const TRAMPA_PLAZO = C('Plazo', 'el contenedor no puede pasar de 72 horas', 'tampoco el de vidrio puede pasar de 72 horas');
const TRAMPA_CHAMBERI = C('Ubicación', 'ubicado en la clínica de Chamberí', 'Si trabajas en Chamberí o Salamanca y tienes dudas sobre una recogida');
const TRAMPA_PLAZO_LITERAL = C('Plazo', 'El cómputo de las 72 horas se inicia en el momento exacto en que el personal auxiliar cierra el contenedor', 'Si trabajas en Chamberí o Salamanca y tienes dudas sobre una recogida');
const LUGAR_CITA_MALA = C('Ubicación del punto de retirada', 'desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro', 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro, que es el centro de referencia logística de residuos sanitarios de Dentavia');
/** [por la cita, por la frase, nombre] */
const CONTROLES = new Map<Publicada, [string, string, string]>([
  [TRAMPA_LUGAR, ['OTRA', 'SIN FRASE', 'trampa LUGAR sintética']], [TRAMPA_PLAZO, ['OTRA', 'SIN FRASE', 'trampa PLAZO sintética']],
  [TRAMPA_CHAMBERI, ['OTRA', 'OTRA', 'trampa de Chamberí (expectativa invertida el 19/10)']],
  [TRAMPA_PLAZO_LITERAL, ['OTRA', 'OTRA', 'trampa PLAZO literal, 72 horas en un solo lado']],
  [LUGAR_CITA_MALA, ['OTRA', 'LUGAR', 'LUGAR con la cita mala']],
]);

async function montar(nuevas: Publicada[][]): Promise<Fila[]> {
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
  for (let i = 0; i < 7; i++) await meter(`2026-10-14T06:${String(29 + 2 * i).padStart(2, '0')}:00Z`, [B_PLAZO, B_NEG, B_LUGAR], null);
  for (let i = 0; i < nuevas.length; i++) await meter(`2026-10-19T10:${String(15 + 3 * i).padStart(2, '0')}:00Z`, nuevas[i], 'claude-haiku-5-5');
  // LA PERTENENCIA (26/10/2026): la consulta resuelve la organización por el USUARIO; las tablas y la columna que
  // la guarda cuenta, por si el arnés no las tenía, y `pertenencias` filas de membresía, ni una más.
  await db.exec('CREATE TABLE IF NOT EXISTS memberships (user_id uuid, org_id uuid); CREATE TABLE IF NOT EXISTS organizations (id uuid, name text); ' +
    'CREATE TABLE IF NOT EXISTS documents (id uuid, org_id text); ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id text; ' +
    'DELETE FROM memberships; DELETE FROM organizations;');
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  for (let i = 0; i < pertenencias; i++) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, i === 0 ? ORG : OTRA_ORG]);
  let sql = readFileSync('SQL_F128_01_nor11_con_haiku55.sql', 'utf8').replaceAll('public.', '');
  sql = poner(sql, /timestamptz '[^']+' AS nueva_desde/, "timestamptz '2026-10-19 12:14:00+02' AS nueva_desde");
  sql = poner(sql, /timestamptz '[^']+' AS nueva_hasta/, "timestamptz '2026-10-19 12:50:00+02' AS nueva_hasta");
  sql = poner(sql, /timestamptz '[^']+' AS push/, "timestamptz '2026-10-19 12:04:00+02' AS push");
  sql = poner(sql, /\d+ AS esperado_nueva/, `${nuevas.length} AS esperado_nueva`);
  const filas = (await db.query<Fila>(sql)).rows;
  await db.close();
  return filas;
}

let replica: Fila[] = [], controles: Fila[] = [];
beforeAll(async () => {
  replica = await montar(TANDA);
  controles = await montar([...TANDA,
    [P(T.plazoLargo, T.sieteDias), N(T.negativa, T.negro), TRAMPA_CHAMBERI, LUGAR_CITA_MALA],     // pasada 8: sin LUGAR de verdad
    [P(T.plazoLargo, T.sieteDias), L(T.chamberi, T.retiro), N(T.negativa, T.negro), TRAMPA_LUGAR, TRAMPA_PLAZO, TRAMPA_PLAZO_LITERAL]]);  // pasada 9: las trampas
}, 180_000);

const bloque = (filas: Fila[], prefijo: string) => filas.filter(f => f.bloque.startsWith(prefijo));

describe('SQL_F128_01 · la réplica de la salida real del 20/10', () => {
  it('todos los controles del bloque 0 salen OK', () => {
    expect(bloque(replica, '0').length).toBe(31);
    expect(bloque(replica, '0').filter(f => f.a !== 'OK').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });

  it('las 21 de la tanda salen con su especie, y las dos columnas coinciden en las 21 (42 citas)', () => {
    const pub = bloque(replica, '2 ·');
    expect(pub.length).toBe(21);
    const mal = pub.map(f => [f, especies(f)] as const)
      .filter(([f, e]) => { const tema = TANDA.flat().find(k => k.newDocSays === e.nuevo && k.existingDocSays === e.existente)?.topic ?? '';
        return e.cita !== ESPECIE_DE_LA_TANDA[tema] || e.frase !== e.cita; })
      .map(([f, e]) => `${f.pasada}: cita ${e.cita}, frase ${e.frase}: ${e.nuevo.slice(0, 40)}`);
    expect(mal).toEqual([]);
  });

  it('marcador 3/3 por la cita y por la frase en las catorce pasadas', () => {
    const censo = bloque(replica, '1 ·');
    expect(censo.length).toBe(14);
    for (const f of censo) { expect(f.c, f.pasada ?? '').toContain('· marcador 3/3 ·'); expect(f.c, f.pasada ?? '').toMatch(/\(no cuenta\): [^,]+, 3\/3$/); }
  });

  it('las medianas son las de la salida real: 100,5 en la tanda y 167 en la línea base', () => {
    const med = bloque(replica, '5 ·').filter(f => f.a === 'TODAS').map(f => `${f.pasada}: ${f.b} · ${f.c}`).sort();
    expect(med).toEqual(['nueva: n 42 · mediana 100.5 · mínimo 33 · máximo 195', 'vieja: n 42 · mediana 167.0 · mínimo 128 · máximo 195']);
  });

  it('ninguna cita aparece más de una vez en su documento (2c)', () => {
    expect(bloque(replica, '2c')[0]?.a).toBe('del nuevo: 0 de 21 · del existente: 0 de 21');
  });

  it('los dos límites de la frase: la negativa sale exactamente como la sembrada', () => {
    const neg = bloque(replica, '2 ·').find(f => especies(f).nuevo === T.negativa) as Fila;
    expect(fraseDe(neg, 'NUEVO')).toBe('En ningún caso se depositan en el contenedor negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I.');
  });
});

describe('SQL_F128_01 · los controles', () => {
  it('todos los controles del bloque 0 salen OK', () => {
    expect(bloque(controles, '0').filter(f => f.a !== 'OK').map(f => `${f.a}: ${f.b}`)).toEqual([]);
  });

  it('cada trampa y cada control negativo sale con su especie por la cita y por la frase', () => {
    const mal: string[] = [];
    for (const f of bloque(controles, '2 ·')) {
      const e = especies(f);
      const caso = [...CONTROLES.keys()].find(k => k.newDocSays === e.nuevo && k.existingDocSays === e.existente);
      if (!caso) continue;                                   // las de la tanda las mira la réplica
      const [cita, frase, nombre] = CONTROLES.get(caso) ?? ['', '', ''];
      if (e.cita !== cita || e.frase !== frase) mal.push(`${f.pasada} · ${nombre}: cita ${e.cita} (esperado ${cita}), frase ${e.frase} (esperado ${frase})`);
    }
    expect(mal).toEqual([]);
    expect(bloque(controles, '2 ·').filter(f => { const e = especies(f); return [...CONTROLES.keys()].some(k => k.newDocSays === e.nuevo && k.existingDocSays === e.existente); }).length).toBe(5);
  });

  it('CONTROL NEGATIVO PERMANENTE: la columna de la frase no cuenta para el marcador (pasada 8)', () => {
    // El LUGAR con la cita mala da LUGAR por la frase (3/3) y el marcador se queda en 2/3. Si el marcador se
    // contara por la frase, subiría a 3/3. La trampa de Chamberí, en la misma pasada, la vigila la tabla CONTROLES.
    const ocho = controles.find(f => f.bloque.startsWith('1 ·') && f.pasada === 'nueva 8');
    expect(ocho?.c).toContain('· marcador 2/3 ·');
    expect(ocho?.c).toMatch(/POR LA FRASE \(no cuenta\): [^,]*LUGAR[^,]*, 3\/3/);
  });
});

describe('LA ORGANIZACIÓN LEÍDA (26/10/2026): se resuelve por el usuario, y la primera fila lo dice', () => {
  it('va primera: la del usuario, con su nombre y sus documentos', async () => {
    const f = await montar([]);
    expect(f[0].bloque).toBe('organización leída');
    expect(f[0].a).toMatch(new RegExp('^organización leída: ' + ORG + ' · «Mi workspace» · \\d+ documentos$'));
  }, 240_000);

  it('sin pertenencia, o con dos, lo grita en la primera fila', async () => {
    for (const n of [0, 2]) {
      pertenencias = n;
      try {
        const f = await montar([]);
        expect(f[0].bloque).toBe('organización leída');
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
            ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
      } finally {
        pertenencias = 1;
      }
    }
  }, 240_000);
});
