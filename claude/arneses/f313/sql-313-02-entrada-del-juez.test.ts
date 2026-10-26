import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * EL ARNÉS DE `SQL_313_02_la_entrada_del_juez_contra_cli13.sql` (3.1.3, 22/10/2026), en PGlite. Filas
 * sintéticas y sólo números. Cuatro situaciones —la misma entrada en las dos ventanas, una que difiere en la
 * caché, otra en el modelo, y una ventana vacía— y ruido que no tiene que contar: la petición del juez a CLI-12
 * en la misma pasada, otra organización, otro documento y un reintento fallido.
 */
// La organización se RESUELVE por el USUARIO (26/10/2026). USUARIO y ORG son DISTINTOS a propósito: en la base son el
// mismo número (código de antes del 27/04), y con el mismo número aquí, volver a leer el id del piloto como
// organización pasaría sin que nada lo notara. `pertenencias` es para los casos de la guarda, al final.
const USUARIO = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
const ORG = '68bf28c3-8352-4052-8eb4-3a7e31b74b53';
const OTRA_ORG = '99999999-9999-9999-9999-999999999999';
let pertenencias = 1;
const CLI13 = '13131313-1313-1313-1313-131313131313', CLI12 = '12121212-1212-1212-1212-121212121212';
const H55 = 'claude-haiku-5-5';
const juez = (pareja: string, extra: Record<string, unknown> = {}) => ({
  etapa: 'juez', pareja, modelo: H55, resultado: 'ok', entradaEstimada: 7000,
  tokens: { entrada: 6500, salida: 3000, escrituraCache: 0, lecturaCache: 0 }, ...extra,
});
const lectura = (documentId: string) => ({
  documentId, regimen: 'pareja_entera', modelo: H55,
  analizado: { caracteres: 14704, mostrados: 14704 }, candidato: { caracteres: 9817, mostrados: 9817 },
});
interface Pasada { dia: 21 | 22; hora: number; peticiones: unknown[] }
const pasada = (dia: 21 | 22, hora: number, j13: Record<string, unknown> = {}): Pasada =>
  ({ dia, hora, peticiones: [{ etapa: 'rerank', modelo: 'claude-haiku-4-5-20251001', resultado: 'ok', tokens: { entrada: 900 } }, juez(CLI13, j13), juez(CLI12, { tokens: { entrada: 20000 } })] });

interface Fila { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null }
/** UNA base de PGlite por fichero (22/10/2026), vaciada entre caso y caso: levantar una por caso ponía el
 *  primero de cada fichero por encima de su tope de 60 s con la CPU cargada (113 s medidos), y un rojo que
 *  depende de la CPU no vale (protocolo: la suite tiene que ser determinista). */
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE TABLE analysis_results (id uuid DEFAULT gen_random_uuid(), org_id text, created_at timestamptz, document_name text, analysis jsonb);
                 CREATE TABLE documents (id uuid, org_id text, name text);`);
  await db.query('INSERT INTO documents VALUES ($1, $2, $3), ($4, $2, $5)', [CLI13, ORG, 'CLI-13_instrucciones.docx', CLI12, 'CLI-12_manual.docx']);
}, 120_000);
afterAll(async () => { await db.close(); });
async function correr(pasadas: Pasada[]): Promise<Fila[]> {
  await db.exec('DELETE FROM analysis_results');
  const meter = (org: string, cuando: string, nombre: string, analysis: unknown) =>
    db.query('INSERT INTO analysis_results (org_id, created_at, document_name, analysis) VALUES ($1,$2,$3,$4)', [org, cuando, nombre, analysis]);
  for (const p of pasadas)
    await meter(ORG, new Date(Date.UTC(2026, 9, p.dia, p.hora, 0)).toISOString(), 'NOR-11_x.docx',
      { llamadasAlModelo: { peticiones: p.peticiones }, lecturaDeLasParejas: [lectura(CLI13), lectura(CLI12)] });
  // ruido: otra organización y otro documento, con entradas distintas
  await meter('otra', '2026-10-22T10:00:00Z', 'NOR-11_x.docx', { llamadasAlModelo: { peticiones: [juez(CLI13, { tokens: { entrada: 1 } })] } });
  await meter(ORG, '2026-10-22T10:00:00Z', 'NOR-10_x.docx', { llamadasAlModelo: { peticiones: [juez(CLI13, { tokens: { entrada: 2 } })] } });
  // LA PERTENENCIA (26/10/2026): la consulta resuelve la organización por el USUARIO; las tablas y la columna que
  // la guarda cuenta, por si el arnés no las tenía, y `pertenencias` filas de membresía, ni una más.
  await db.exec('CREATE TABLE IF NOT EXISTS memberships (user_id uuid, org_id uuid); CREATE TABLE IF NOT EXISTS organizations (id uuid, name text); ' +
    'CREATE TABLE IF NOT EXISTS documents (id uuid, org_id text); ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id text; ' +
    'DELETE FROM memberships; DELETE FROM organizations;');
  await db.query("INSERT INTO organizations VALUES ($1, 'Mi workspace')", [ORG]);
  for (let i = 0; i < pertenencias; i++) await db.query('INSERT INTO memberships VALUES ($1, $2)', [USUARIO, i === 0 ? ORG : OTRA_ORG]);
  const sql = readFileSync('SQL_313_02_la_entrada_del_juez_contra_cli13.sql', 'utf8').replaceAll('public.', '');
  return (await db.query<Fila>(sql)).rows;
}
const veredicto = (f: Fila[]) => f.find(x => x.bloque.startsWith('3 ·'))!;
const fallas = (f: Fila[]) => f.filter(x => x.bloque.startsWith('0') && x.a !== 'OK').map(x => `${x.a} · ${x.b}`);

describe('SQL_313_02, la entrada del juez contra CLI-13', () => {
  it('la misma entrada en las dos ventanas: LA MISMA ENTRADA, y la petición a CLI-12 no cuenta', async () => {
    const f = await correr([pasada(21, 12), pasada(22, 7), pasada(22, 8)]);
    expect(fallas(f)).toEqual([]);
    expect(veredicto(f).a).toBe('LA MISMA ENTRADA');
    expect(veredicto(f).b).toBe('entrada real · base: 6500 · tanda: 6500');
    expect(f.find(x => x.pasada === 'tanda 2')!.b).toBe('entrada 6500 + caché escrita 0 + caché leída 0 = 6500 · estimada ÷4 7000 · salida 3000');
    expect(f.find(x => x.pasada === 'tanda 2')!.c).toBe('pareja_entera · analizado 14704/14704 · candidato 9817/9817 · modelo claude-haiku-5-5');
  }, 60_000);

  it('un reintento fallido no cuenta como petición, y la entrada que llega por caché se suma', async () => {
    const t = [pasada(21, 12), pasada(22, 7)];
    t[1].peticiones.push(juez(CLI13, { resultado: 'error', tokens: {} }));
    (t[1].peticiones[1] as { tokens: Record<string, number> }).tokens = { entrada: 500, salida: 3000, escrituraCache: 6000, lecturaCache: 0 };
    const f = await correr(t);
    expect(fallas(f)).toEqual([]);
    // 500 + 6.000 = 6.500: la misma entrada real, aunque partida de otro modo
    expect(veredicto(f).a).toBe('LA MISMA ENTRADA');
    expect(f.find(x => x.bloque.startsWith('2 ·') && x.pasada === 'tanda')!.b).toBe('entrada + caché escrita + caché leída: 500+6000+0');
  }, 60_000);

  it('DISTINTA por la entrada, y DISTINTA por el modelo aunque la entrada coincida', async () => {
    const porEntrada = await correr([pasada(21, 12), pasada(22, 7, { tokens: { entrada: 6600 } })]);
    expect(veredicto(porEntrada).a).toBe('DISTINTA');
    expect(veredicto(porEntrada).b).toBe('entrada real · base: 6500 · tanda: 6600');
    const porModelo = await correr([pasada(21, 12, { modelo: 'claude-haiku-4-5-20251001' }), pasada(22, 7)]);
    expect(veredicto(porModelo).a).toBe('DISTINTA');
    expect(veredicto(porModelo).c).toBe('modelo · base: claude-haiku-4-5-20251001 · tanda: claude-haiku-5-5');
  }, 60_000);

  it('sin pasadas en la línea base: el 2 FALLA y el veredicto es SIN COMPARACIÓN, nunca LA MISMA', async () => {
    const f = await correr([pasada(22, 7)]);
    expect(fallas(f)).toEqual(['FALLA · pasadas de NOR-11 con registro en la línea base (21/10): 0']);
    expect(veredicto(f).a).toBe('SIN COMPARACIÓN (una ventana sin peticiones)');
  }, 60_000);

  it('una pasada sin su petición del juez a CLI-13 hace caer el 4', async () => {
    const t = [pasada(21, 12), pasada(22, 7)];
    t[1].peticiones.splice(1, 1);
    const f = await correr(t);
    expect(fallas(f)).toEqual(['FALLA · pasadas sin exactamente una petición del juez a CLI-13 que saliera bien: 1 de 2']);
  }, 60_000);
});

describe('LA ORGANIZACIÓN LEÍDA (26/10/2026): se resuelve por el usuario, y la primera fila lo dice', () => {
  it('va primera: la del usuario, con su nombre y sus documentos', async () => {
    const f = await correr([]);
    expect(f[0].bloque).toBe('organización leída');
    expect(f[0].a).toMatch(new RegExp('^organización leída: ' + ORG + ' · «Mi workspace» · \\d+ documentos$'));
  }, 240_000);

  it('sin pertenencia, o con dos, lo grita en la primera fila', async () => {
    for (const n of [0, 2]) {
      pertenencias = n;
      try {
        const f = await correr([]);
        expect(f[0].bloque).toBe('organización leída');
        expect(f[0].a).toBe('⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' + USUARIO + ' tiene ' + n +
            ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.');
      } finally {
        pertenencias = 1;
      }
    }
  }, 240_000);
});
