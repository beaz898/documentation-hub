import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { leerLaPareja, lecturaDeLaPareja } from './judge';

/**
 * EL TEXTO DE CADA TROZO LLEGA AL PROMPT TAL CUAL (vía 2 de F-122; 09/10/2026).
 *
 * ⚠️ PROTEGE LOS DESPLAZAMIENTOS DE LA VÍA 2. Las unidades de cita
 * (`unidades-de-cita.ts`) se numeran sobre el texto GUARDADO de cada trozo, y la
 * etiqueta que emita el juez sólo señala la frase correcta si lo que el juez lee
 * de ese trozo es ese mismo texto, byte a byte. Si alguien recorta, normaliza o
 * añade algo dentro del texto de un trozo al montar el prompt
 * (`buildAnalyzedDocumentText`), esta prueba se pone roja.
 *
 * Fija tres cosas: cada trozo de texto aparece TAL CUAL, en orden de
 * `chunkIndex`, y entre dos trozos hay exactamente "\n\n", ni más ni menos.
 *
 * Se llega a `buildAnalyzedDocumentText` —que no está exportada— a través de
 * `leerLaPareja`, que la usa para el candidato cuando la pareja cabe entera.
 *
 * LA CADENA ES LA DE PRODUCCIÓN: medido el 09/10, el render local de NOR-11 mide
 * 14.704 caracteres y el de CLI-13 9.817, las cifras de producción del 06 y el
 * 07/10. Lo que se pueda medir en local con los .docx de `corpus-pruebas/` se
 * mide aquí: sin clave, sin red y sin gastar.
 */

async function trozosDe(nombre: string): Promise<StoredChunk[]> {
  const segmentos = await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre);
  return toStoredChunks(chunkSegments(segmentos, 'prueba', nombre, 'prueba'));
}

/** Lo que tiene que salir: los trozos de texto en orden de chunkIndex, unidos por "\n\n". */
function loEsperado(trozos: StoredChunk[]): string {
  return [...trozos].sort((a, b) => a.chunkIndex - b.chunkIndex).map(c => c.text).join('\n\n');
}

function renderEntero(nombre: string, trozos: StoredChunk[]) {
  return leerLaPareja({
    parejaEntera: true, documentId: 'd', documentName: nombre,
    analizadoCompleto: 'x', analizadoConTrozos: true,
    analizadoViejo: { texto: 'x', lado: { caracteres: 1, mostrados: 1, dejoFuera: false } },
    candidatoChunks: trozos, fragmentosEnviados: [], bloqueRelevancia: '(no se usa)',
  });
}

describe('el texto de cada trozo llega al prompt tal cual', () => {
  it.each([
    ['NOR-11_gestion-de-residuos-sanitarios.docx', 14704],
    ['CLI-13_instrucciones-clinicas-residuos.docx', 9817],
  ])('%s: byte a byte, en orden y con "\\n\\n" entre trozos', { timeout: 30_000 }, async (nombre, longitudEnProduccion) => {
    const trozos = await trozosDe(nombre);
    // Control: hay material, y todo es prosa (sin tablas, el render es sólo la unión).
    expect(trozos.length).toBeGreaterThan(1);
    expect(trozos.every(c => c.chunkType === 'text')).toBe(true);
    const pareja = renderEntero(nombre, trozos);
    expect(pareja.lectura.regimen).toBe('pareja_entera');
    expect(pareja.bloqueCandidato).toBe(loEsperado(trozos));
    expect(pareja.bloqueCandidato.length).toBe(longitudEnProduccion);
  });

  // ⚠️ SÓLO LA LONGITUD: estos dos no caben enteros en una pareja, así que
  // `leerLaPareja` no los pinta enteros, y comprobar los bytes exigiría exportar
  // `buildAnalyzedDocumentText`. La longitud llega por `lecturaDeLaPareja`, que sí
  // la calcula con esa función.
  it.each([
    'CLI-12_manual-calidad-clinica.docx',
    'NOR-10_protocolo-esterilizacion-instrumental.docx',
  ])('%s: la longitud del render es la de los trozos más "\\n\\n" entre ellos', { timeout: 30_000 }, async nombre => {
    const trozos = await trozosDe(nombre);
    expect(trozos.every(c => c.chunkType === 'text')).toBe(true);
    const lectura = lecturaDeLaPareja({
      documentId: 'd', documentName: nombre,
      analizado: { caracteres: 1, mostrados: 1, dejoFuera: false },
      candidatoChunks: trozos, fragmentosEnviados: [], textoEnviado: '',
    });
    expect(lectura.candidato.caracteres).toBe(loEsperado(trozos).length);
  });
});
