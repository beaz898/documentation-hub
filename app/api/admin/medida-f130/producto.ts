import { judgeAllDocuments, interruptorParejaEntera, promptDelJuez, huellaDelPrompt } from '@/lib/analysis/judge';
import { avisoDeLoOmitido } from '@/lib/analysis/corte-del-analizado';
import type { DocumentJudgment, LecturaDeLaPareja, RerankedCandidate } from '@/lib/analysis/types';
import type { StoredChunk } from '@/lib/read-chunks';
import { leerParejaEntera } from './pareja-entera';

/**
 * LA RUTA d4: EL JUEZ DEL PRODUCTO, CON EL PROMPT DEL PRODUCTO (11/11/2026). TEMPORAL como toda la carpeta (cabecera de
 * `medida-f130.ts`).
 *
 * Llama a `judgeAllDocuments` (lib/analysis/judge.ts) en modo RÁPIDO, con NOR-10 como documento nuevo y CLI-12 como único
 * candidato: el prompt, la llamada, la frontera y la PUERTA DE CITAS son las del producto, sin tocar. Lo que la herramienta NO hace
 * y el producto sí: recuperar y elegir el candidato (aquí la pareja se entrega hecha y el candidato llega SIN fragmentos de la
 * recuperación, que con la pareja entera no cambian el texto: sólo pesan cuando no cabe, y eso es un 409), el verificador, R2, la
 * cascada, la síntesis y la publicación. Y no persiste nada.
 * ⚠️ LAS NEGATIVAS DURAS, antes de llamar al modelo: el interruptor `ANALYSIS_PAREJA_ENTERA` tiene que estar a «1» en este
 * despliegue (si no, el juez leería con la tijera vieja), y la pareja tiene que salir `pareja_entera` por `leerLaPareja` (la misma
 * comprobación de d3). Después, cada respuesta trae su régimen y la huella del prompt que se le envió de verdad
 * (`LecturaDeLaPareja.huellaDelPrompt`), y se comparan con las del ensayo.
 */

/** Cuántas por pulsación: PROVISIONAL hasta el sondeo de d4 (el prompt es otro y la latencia se vuelve a medir). */
export const VECES_DE_D4 = 14;

/** La fuente con que el producto presenta a un candidato: la regla de `criba-de-matches.ts` (google_drive, o manual). */
export function fuenteDelProducto(source: string | null | undefined): RerankedCandidate['source'] {
  return source === 'google_drive' ? 'google_drive' : 'manual';
}

export interface LadoDelProducto { nombre: string; trozos: StoredChunk[] }
export interface CandidatoDelProducto extends LadoDelProducto { documentId: string; fuente: RerankedCandidate['source'] }

/**
 * El prompt que el juez del producto va a recibir, armado SIN llamar al modelo, con las mismas piezas que `judgeSingleDocument`:
 * la pareja de `leerLaPareja` y `promptDelJuez`. Sólo vale `pareja_entera`.
 */
export function promptDeLaPareja(a: { analizado: LadoDelProducto; candidato: CandidatoDelProducto }):
  { ok: true; prompt: string; huella: string; textoAnalizado: string; bloqueCandidato: string; lectura: LecturaDeLaPareja } | { ok: false; regimen: string; motivo: string } {
  const p = leerParejaEntera({ analizado: a.analizado, candidato: { documentId: a.candidato.documentId, nombre: a.candidato.nombre, trozos: a.candidato.trozos } });
  if (!p.ok) return p;
  const prompt = promptDelJuez({
    nombreDelAnalizado: a.analizado.nombre, textoAnalizado: p.textoAnalizado, avisoDeLoOmitido: avisoDeLoOmitido(p.lectura),
    nombreDelCandidato: a.candidato.nombre, fuenteDelCandidato: a.candidato.fuente, bloqueCandidato: p.bloqueCandidato,
  });
  return { ok: true, prompt, huella: huellaDelPrompt(prompt), textoAnalizado: p.textoAnalizado, bloqueCandidato: p.bloqueCandidato, lectura: p.lectura };
}

/** El interruptor de la pareja entera, tal como lo leerá el juez en este despliegue. */
export function interruptorEncendido(): boolean {
  return interruptorParejaEntera();
}

/** Lo que devuelve una llamada: el juicio de la pareja DESPUÉS de la puerta (con lo que la puerta tiró, con texto) y su lectura. */
export interface JuicioDelProducto {
  judgment: Pick<DocumentJudgment, 'contradictions' | 'overlappingContent' | 'uniqueToNewDoc' | 'descartesPorCita' | 'descartesPorCitaOmitidos' | 'discarded' | 'verdict' | 'overlapPercent'>;
  lectura: LecturaDeLaPareja;
}

/** UNA llamada al juez del producto, por `judgeAllDocuments` en rápido. `textoDelAnalizado` es lo que el producto le pasa como
 *  `newDocumentSample`: el texto del documento (`documents.full_text`). */
export async function juzgarConElProducto(a: { analizado: LadoDelProducto & { textoDelAnalizado: string }; candidato: CandidatoDelProducto }): Promise<JuicioDelProducto> {
  const r = await judgeAllDocuments({
    newDocumentName: a.analizado.nombre,
    newDocumentSample: a.analizado.textoDelAnalizado,
    newDocumentChunks: a.analizado.trozos,
    chunksByDocument: new Map([[a.candidato.documentId, a.candidato.trozos]]),
    candidates: [{ documentId: a.candidato.documentId, documentName: a.candidato.nombre, source: a.candidato.fuente, fragments: [], rerankReason: '', rerankConfidence: 'sin_declarar' }],
    options: { exhaustive: false },
  });
  const j = r.judgments[0];
  return {
    judgment: {
      contradictions: j.contradictions, overlappingContent: j.overlappingContent, uniqueToNewDoc: j.uniqueToNewDoc,
      descartesPorCita: j.descartesPorCita, descartesPorCitaOmitidos: j.descartesPorCitaOmitidos, discarded: j.discarded,
      verdict: j.verdict, overlapPercent: j.overlapPercent,
    },
    lectura: r.lecturaDeLasParejas[0],
  };
}

/** Cuánto de cada documento enseña el resumen del ensayo, por cada lado del empalme. */
export const CARACTERES_DEL_RESUMEN_D4 = 300;

/**
 * EL ENSAYO RECORTADO de d4: el prompt del producto, con los dos documentos enteros, no cruza el chat. Su huella y su longitud; la
 * cabeza (hasta el principio del documento nuevo); el empalme (el final del nuevo, la cabecera del existente y su principio); y de la
 * cola —las instrucciones del producto, que no dependen de la pareja— su longitud, su huella y sus dos extremos. `enSuSitio` dice si
 * cada documento está entero y en su sitio.
 */
export function resumenDelPromptD4(prompt: string, textoA: string, textoB: string, huella: string) {
  const n = CARACTERES_DEL_RESUMEN_D4;
  const marcaA = '\n"""\n', iA = prompt.indexOf('DOCUMENTO NUEVO: '), iB = prompt.indexOf('\nDOCUMENTO EXISTENTE: ');
  const inicioA = iA === -1 ? -1 : prompt.indexOf(marcaA, iA) + marcaA.length;
  const inicioB = iB === -1 ? -1 : prompt.indexOf(marcaA, iB) + marcaA.length;
  const enSuSitio = {
    documento1: inicioA > 0 && prompt.slice(inicioA, inicioA + textoA.length) === textoA,
    documento2: inicioB > 0 && prompt.slice(inicioB, inicioB + textoB.length) === textoB,
  };
  const finA = inicioA + textoA.length, finB = inicioB + textoB.length;
  const cola = inicioB > 0 ? prompt.slice(finB) : '';
  return {
    huellaDelPrompt: huella,
    longitudDelPrompt: prompt.length,
    enSuSitio,
    cabeza: inicioA > 0 ? prompt.slice(0, inicioA + Math.min(n, textoA.length)) : null,
    empalme: inicioA > 0 && inicioB > 0 ? prompt.slice(Math.max(inicioA, finA - n), inicioB + Math.min(n, textoB.length)) : null,
    cola: { longitud: cola.length, huella: huellaDelPrompt(cola), principio: cola.slice(0, n), final: cola.slice(-n) },
  };
}
