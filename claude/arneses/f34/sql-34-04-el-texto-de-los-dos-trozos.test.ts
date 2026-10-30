import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE SQL_34_04_el_texto_de_los_dos_trozos.sql (30/10/2026), en PGlite. La base de partida:
 *   · NOR-10, generación activa 2, tocado el 28/10; sus trozos de la generación 2 creados el 28/10, el 4 con su frase; y
 *     restos de la generación 1 (el 20/10), con un trozo 4 SIN la frase, que no se tiene que leer;
 *   · CLI-12, generación activa 1, tocado el 29/10 a las 10:00; su trozo 3 creado el 27/10, con su frase; y una versión
 *     en espera (generación 2) creada el 29/10 a las 20:00;
 *   · ruido: otra organización con un «NOR-10» y un «CLI-12» propios, tocados hoy; en la nuestra, un documento con los
 *     dos códigos EN MEDIO del nombre; y una fila de trozo con el id de NOR-10 y la organización de otro.
 * Cada variante cambia una sola cosa y mira el veredicto. Una base por fichero.
 */
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA = '99999999-9999-9999-9999-999999999999';
const N10 = '00000000-0000-0000-0000-0000000000a1', C12 = '00000000-0000-0000-0000-0000000000c2';
const XN10 = '00000000-0000-0000-0000-0000000000f1', XC12 = '00000000-0000-0000-0000-0000000000f2';
const COPIA = '00000000-0000-0000-0000-0000000000a2', ANEXO = '00000000-0000-0000-0000-0000000000a3';
const FRASE_N10 = 'Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional.';
const FRASE_C12 = 'Esta asignación responde a separar la responsabilidad de un proceso crítico de seguridad del paciente de otra cosa.';

type Fila = { bloque: string; a: string | null; b: string | null; c: string | null; d: string | null };

interface Opciones {
  tocadoDespues?: boolean; tocadoEnElLimite?: boolean; sinFechaDeTocado?: boolean;
  trozoNuevo?: boolean; trozoEnElLimite?: boolean; sinFrase?: boolean; sinTrozo?: boolean;
  dosDocumentos?: boolean; dosPertenencias?: boolean;
}

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';
    CREATE TABLE memberships (user_id uuid, org_id uuid);
    CREATE TABLE organizations (id uuid, name text);
    CREATE TABLE documents (id uuid, org_id text, name text, active_generation int, updated_at timestamptz);
    CREATE TABLE document_chunks (document_id uuid, org_id text, generation int, chunk_index int, text text, created_at timestamptz);
    CREATE TABLE document_staged (document_id uuid, org_id text, generation int, created_at timestamptz);`);
}, 120_000);
afterAll(async () => { await db.close(); });

async function sembrar(o: Opciones = {}) {
  await db.exec('DELETE FROM memberships; DELETE FROM organizations; DELETE FROM documents; DELETE FROM document_chunks; DELETE FROM document_staged;');
  await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, ORG]);
  if (o.dosPertenencias) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, OTRA]);
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace'), ($2, 'Otra')", [ORG, OTRA]);
  const tocadoC12 = o.sinFechaDeTocado ? null : o.tocadoDespues ? '2026-10-30T07:50:00Z' : o.tocadoEnElLimite ? '2026-10-29T18:30:00Z' : '2026-10-29T10:00:00Z';
  const doc = (id: string, org: string, nombre: string, gen: number | null, tocado: string | null) =>
    db.query('INSERT INTO documents VALUES ($1,$2,$3,$4,$5)', [id, org, nombre, gen, tocado]);
  await doc(N10, ORG, 'NOR-10_protocolo-esterilizacion-instrumental.docx', 2, '2026-10-28T09:00:00Z');
  await doc(C12, ORG, 'CLI-12_manual-calidad-clinica.docx', null, tocadoC12);
  if (o.dosDocumentos) await doc(COPIA, ORG, 'NOR-10_copia.docx', 1, '2026-10-01T00:00:00Z');
  // el código en MEDIO del nombre: la herramienta no lo coge (el nombre tiene que EMPEZAR por el código)
  await doc(ANEXO, ORG, 'ANEXO_NOR-10_y_CLI-12.docx', 1, '2026-10-30T07:00:00Z');
  await doc(XN10, OTRA, 'NOR-10_ajeno.docx', 1, '2026-10-30T07:00:00Z');
  await doc(XC12, OTRA, 'CLI-12_ajeno.docx', 1, '2026-10-30T07:00:00Z');
  const trozo = (id: string, org: string, gen: number, i: number, texto: string, creado: string) =>
    db.query('INSERT INTO document_chunks VALUES ($1,$2,$3,$4,$5,$6)', [id, org, gen, i, texto, creado]);
  for (let i = 0; i < 6; i++) await trozo(N10, ORG, 1, i, 'generación vieja ' + i, '2026-10-20T00:00:00Z');
  const creado4 = o.trozoNuevo ? '2026-10-30T07:00:00Z' : o.trozoEnElLimite ? '2026-10-29T18:30:00Z' : '2026-10-28T09:00:00Z';
  for (let i = 0; i < 6; i++) {
    const texto = i === 4 ? (o.sinFrase ? 'un 2.4 sin la frase' : '2.4 Responsables. ' + FRASE_N10) : 'nor10 ' + i;
    await trozo(N10, ORG, 2, i, texto, i === 4 ? creado4 : '2026-10-28T09:00:00Z');
  }
  for (let i = 0; i < 5; i++) {
    if (o.sinTrozo && i === 3) continue;
    await trozo(C12, ORG, 1, i, i === 3 ? '3.1 ' + FRASE_C12 : 'cli12 ' + i, '2026-10-27T12:00:00Z');
  }
  await trozo(XN10, OTRA, 1, 4, FRASE_N10, '2026-10-30T07:00:00Z');
  // una fila INCONSISTENTE: el documento es el nuestro y la organización otra. La herramienta filtra los trozos por
  // organización (lib/read-chunks.ts) y no la leería; la consulta tampoco, ni como trozo ni al contar generaciones
  await trozo(N10, OTRA, 2, 4, 'fila de otra organización con la frase: ' + FRASE_N10, '2026-10-30T07:00:00Z');
  await trozo(XC12, OTRA, 1, 3, FRASE_C12, '2026-10-30T07:00:00Z');
  await db.query('INSERT INTO document_staged VALUES ($1,$2,2,$3)', [C12, ORG, '2026-10-29T20:00:00Z']);
}

async function correr(o: Opciones = {}): Promise<Fila[]> {
  await sembrar(o);
  const sql = readFileSync('SQL_34_04_el_texto_de_los_dos_trozos.sql', 'utf8').replaceAll('public.', '');
  return (await db.query<Fila>(sql)).rows;
}
const veredictos = (f: Fila[]) => f.filter(x => x.bloque === '1 · el trozo').map(x => [x.a, x.d]);
const MISMO = 'EL TEXTO ES EL MISMO: el trozo existe desde antes de las 18:30 UTC del 29/10 y el documento no se ha tocado desde entonces';
const md5 = (t: string) => db.query<{ h: string }>('SELECT md5($1) AS h', [t]).then(r => r.rows[0].h);

describe('SQL_34_04, el texto de los dos trozos de E3', () => {
  it('LA BASE DE PARTIDA: la organización primero, los dos trozos de la generación ACTIVA, y los dos «EL TEXTO ES EL MISMO»', async () => {
    const f = await correr();
    expect(f[0]).toEqual({ bloque: 'organización leída', a: `organización leída: ${ORG} · «Mi workspace» · 3 documentos`, b: null, c: null, d: null });
    const t4 = '2.4 Responsables. ' + FRASE_N10, t3 = '3.1 ' + FRASE_C12;
    expect(f.filter(x => x.bloque === '1 · el trozo').map(x => [x.a, x.b, x.c, x.d])).toEqual([
      ['NOR-10 · trozo 4', 'NOR-10_protocolo-esterilizacion-instrumental.docx · generación activa 2 · documento tocado por última vez: 28/10/2026 09:00:00 UTC',
        `creado 28/10/2026 09:00:00 UTC · ${t4.length} caracteres · md5 ${await md5(t4)} · contiene su frase: sí`, MISMO],
      ['CLI-12 · trozo 3', 'CLI-12_manual-calidad-clinica.docx · generación activa 1 · documento tocado por última vez: 29/10/2026 10:00:00 UTC',
        `creado 27/10/2026 12:00:00 UTC · ${t3.length} caracteres · md5 ${await md5(t3)} · contiene su frase: sí`, MISMO],
    ]);
  });

  it('LAS GENERACIONES Y LA VERSIÓN EN ESPERA se enseñan, de la organización leída y no de la otra', async () => {
    expect((await correr()).filter(x => x.bloque === '2 · las generaciones').map(x => [x.a, x.b, x.c])).toEqual([
      ['NOR-10', 'generación 1: 6 trozos, creados de 20/10 00:00 a 20/10 00:00 UTC · generación 2: 6 trozos, creados de 28/10 09:00 a 28/10 09:00 UTC', 'sin versión en espera'],
      ['CLI-12', 'generación 1: 5 trozos, creados de 27/10 12:00 a 27/10 12:00 UTC', 'versión en espera: generación 2, creada 29/10 20:00 UTC'],
    ]);
  });

  it('EL DOCUMENTO TOCADO DESPUÉS, o justo en el límite, o sin fecha: NO SE PUEDE AFIRMAR, y dice por qué', async () => {
    const despues = 'NO SE PUEDE AFIRMAR CON ESTA CONSULTA: el documento se tocó a las 18:30 UTC del 29/10 o después (puede no ser el texto: mirar el bloque 2)';
    expect(veredictos(await correr({ tocadoDespues: true }))).toEqual([['NOR-10 · trozo 4', MISMO], ['CLI-12 · trozo 3', despues]]);
    expect(veredictos(await correr({ tocadoEnElLimite: true }))).toEqual([['NOR-10 · trozo 4', MISMO], ['CLI-12 · trozo 3', despues]]);
    expect(veredictos(await correr({ sinFechaDeTocado: true }))).toEqual([['NOR-10 · trozo 4', MISMO],
      ['CLI-12 · trozo 3', 'NO SE PUEDE AFIRMAR CON ESTA CONSULTA: el documento no tiene fecha de última modificación']]);
  });

  it('EL TROZO CREADO DESPUÉS, o justo en el límite: NO SE PUEDE AFIRMAR', async () => {
    const nuevo = 'NO SE PUEDE AFIRMAR CON ESTA CONSULTA: el trozo se creó a las 18:30 UTC del 29/10 o después';
    expect(veredictos(await correr({ trozoNuevo: true }))).toEqual([['NOR-10 · trozo 4', nuevo], ['CLI-12 · trozo 3', MISMO]]);
    expect(veredictos(await correr({ trozoEnElLimite: true }))).toEqual([['NOR-10 · trozo 4', nuevo], ['CLI-12 · trozo 3', MISMO]]);
  });

  it('LO QUE NO ES EL TROZO MEDIDO no da veredicto: sin la frase, sin el trozo, o con dos documentos para el código', async () => {
    expect(veredictos(await correr({ sinFrase: true }))).toEqual([['NOR-10 · trozo 4', '⚠️ NO SE PUEDE: el trozo no contiene su frase, y no es el que se midió'], ['CLI-12 · trozo 3', MISMO]]);
    expect(veredictos(await correr({ sinTrozo: true }))).toEqual([['NOR-10 · trozo 4', MISMO], ['CLI-12 · trozo 3', '⚠️ NO SE PUEDE: la generación activa no tiene el trozo 3']]);
    expect(veredictos(await correr({ dosDocumentos: true }))).toEqual([['NOR-10 · trozo 4', '⚠️ NO SE PUEDE: el código resuelve a 2 documentos, y tiene que ser uno'], ['CLI-12 · trozo 3', MISMO]]);
  });

  it('SIN ORGANIZACIÓN RESUELTA, la primera fila lo grita y no hay un solo «EL TEXTO ES EL MISMO»', async () => {
    const f = await correr({ dosPertenencias: true });
    expect(f[0].a).toBe(`⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ${USUARIO} tiene 2 pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.`);
    expect(veredictos(f)).toEqual([
      ['NOR-10 · trozo 4', '⚠️ NO SE PUEDE: el código resuelve a 0 documentos, y tiene que ser uno'],
      ['CLI-12 · trozo 3', '⚠️ NO SE PUEDE: el código resuelve a 0 documentos, y tiene que ser uno'],
    ]);
  });
});
