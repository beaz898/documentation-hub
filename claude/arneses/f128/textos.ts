import { readFileSync } from 'node:fs';
import { extractSegments, chunkSegments, joinSegments, stripSegmentationMarkers } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';

/**
 * EL TEXTO DE LOS CUATRO DOCUMENTOS DE F-128, sacado de `corpus-pruebas/` en cada pasada de la
 * suite y no copiado a un fixture: los documentos del corpus SON el fixture, y la cabecera de
 * `vitest.config.mts` manda no duplicar datos de prueba. Se trocean y se escribe el `full_text`
 * igual que en la indexación: `stripSegmentationMarkers(joinSegments(segmentos))`, como
 * `lib/documents/reparar.ts`.
 */
export const NOR11 = 'NOR-11_gestion-de-residuos-sanitarios.docx';
export const CLI13 = 'CLI-13_instrucciones-clinicas-residuos.docx';
export const NOR10 = 'NOR-10_protocolo-esterilizacion-instrumental.docx';
export const CLI12 = 'CLI-12_manual-calidad-clinica.docx';

export interface Trozo { chunkIndex: number; chunkType: string; text: string }
export interface TextoDelDocumento { fullText: string; trozos: Trozo[] }

const cache = new Map<string, TextoDelDocumento>();

export async function textoDe(fichero: string): Promise<TextoDelDocumento> {
  const hecho = cache.get(fichero);
  if (hecho) return hecho;
  const segmentos = await extractSegments(readFileSync(`corpus-pruebas/${fichero}`), fichero);
  const trozos = toStoredChunks(chunkSegments(segmentos, 'd', fichero, 'o'))
    .map(c => ({ chunkIndex: c.chunkIndex, chunkType: c.chunkType, text: c.text }));
  const texto = { fullText: stripSegmentationMarkers(joinSegments(segmentos)), trozos };
  cache.set(fichero, texto);
  return texto;
}

/** La fila que devuelven `SQL_F128_01` y `SQL_F128_02`: seis columnas de texto. */
export interface Fila { bloque: string; pasada: string | null; a: string | null; b: string | null; c: string | null; texto: string | null }

/** Una contradicción publicada, con los campos que leen los dos SQL. */
export interface Publicada { topic: string; newDocSays: string; existingDocSays: string; existingDocument: string; severity: string; confirmedBy: string }

export const publicada = (existingDocument: string) => (topic: string, newDocSays: string, existingDocSays: string): Publicada =>
  ({ topic, newDocSays, existingDocSays, existingDocument, severity: 'contradiction', confirmedBy: 'juicio' });

/** Los seis contadores de la puerta y el de la glosa, a cero: lo que los dos SQL exigen que esté. */
export function contadoresACero(): Record<string, number> {
  const o: Record<string, number> = { 'juez.citas_rescatadas_quitando_glosa': 0 };
  for (const k of ['juez.citas_recompuestas', 'juez.citas_recompuestas_en_trozos_distintos', 'juez.citas_empalme_multiple',
    'juez.citas_sin_tramo_literal', 'juez.recompuestas_bloqueadas_al_reclasificar', 'juez.recompuestas_sin_contexto_del_resto']) o[k] = 0;
  return o;
}

/** Pone un valor de la constante `parametros`; si el patrón no está, el SQL cambió y la prueba no vale. */
export function poner(sql: string, patron: RegExp, valor: string): string {
  if (!patron.test(sql)) throw new Error(`no encuentro ${patron} en el SQL`);
  return sql.replace(patron, () => valor);
}

/** La especie por la cita (columna `a`) y por la frase (el principio de `b`) de una fila del bloque 2. */
export function especies(f: Fila): { cita: string; frase: string; nuevo: string; existente: string } {
  const m = /^POR LA FRASE: ([^·]+) ·/.exec(f.b ?? '');
  const lineas = (f.texto ?? '').split('\n');
  return {
    cita: f.a ?? '', frase: m ? m[1].trim() : '(sin columna de la frase)',
    nuevo: (lineas.find(l => l.startsWith('NUEVO: ')) ?? '').slice('NUEVO: '.length),
    existente: (lineas.find(l => l.startsWith('EXISTENTE: ')) ?? '').slice('EXISTENTE: '.length),
  };
}

export function fraseDe(f: Fila, lado: 'NUEVO' | 'EXISTENTE'): string {
  const pre = `FRASE DEL ${lado}: `;
  return ((f.texto ?? '').split('\n').find(l => l.startsWith(pre)) ?? '').slice(pre.length);
}
