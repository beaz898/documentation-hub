import { buildAnalyzedDocumentText, leerLaPareja, piezasDelAnalizado } from '@/lib/analysis/judge';
import { finesDePiezas } from '@/lib/analysis/corte-del-analizado';
import type { LecturaDeLaPareja } from '@/lib/analysis/types';
import type { StoredChunk } from '@/lib/read-chunks';
import { construirPrompt, PREGUNTA_CERRADA } from './medida-f130';
import { LINEAS_DE_HALLAZGO } from './lineas-de-hallazgo';

/**
 * LA PAREJA ENTERA, RUTA `d3` (10/11/2026). TEMPORAL como toda la carpeta (cabecera de `medida-f130.ts`).
 *
 * El juez de la herramienta lee lo MISMO que el rápido del producto: los dos documentos ENTEROS. Así la herramienta se diferencia
 * del producto sólo en que le entrega la pareja ya emparejada (arquitecto, 10/11). `SQL_34_12` leyó que el interruptor
 * `ANALYSIS_PAREJA_ENTERA` estuvo encendido en los 118 rápidos del 26/10 al 03/11.
 *
 * ⚠️ EL TEXTO SALE DE LAS FUNCIONES DEL PRODUCTO, NO DE UNA NUESTRA: `leerLaPareja` (`lib/analysis/judge.ts`), la que decide en el
 * rápido qué entra de cada lado y llama por dentro a `repartoDeLaPareja`; y el analizado, montado como lo monta el juez
 * (`buildAnalyzedDocumentText` y `finesDePiezas`, como en `judgeAllDocuments`). Contrapartida: si el producto cambia su montaje,
 * la entrada de `d3` cambia con él y la huella de este fichero no lo nota. Por eso el ensayo y la tanda devuelven la HUELLA DEL
 * PROMPT ARMADO.
 * ⚠️ LA NEGATIVA DURA DEL RÉGIMEN: si `leerLaPareja` no da `pareja_entera` (los documentos ya no caben en la ventana, o un lado sin
 * trozos), no se mide: la condición no sería la que se quiere. La ruta responde 409 y no llama al modelo.
 */

/**
 * 14 POR PULSACIÓN, TRES PULSACIONES: 42, como en `d` y `d2` (arquitecto, 10/11). El sondeo midió 24 s por llamada con 49.409 tokens
 * de entrada, y `preguntarAlJuez` va de 4 en 4 (`batchSize: 4`): cada ronda tarda lo que su llamada más lenta. 21 son 6 rondas, que
 * con la cola alta (unos 40 s por ronda) son 240 s contra los 300 de `maxDuration`, y si se pasa se pierde la pulsación entera.
 * 14 son 4 rondas: unos 96 s, y unos 160 en el peor caso.
 */
export const VECES_DE_D3 = 14;

/** Las líneas de la plantilla que nombran un trozo, y por qué se cambian. Es la ÚNICA diferencia con `d2`. */
export const ENCABEZADOS_D3: ReadonlyArray<{ de: string; a: string }> = [
  { de: 'PAREJA {{N}}: {{DOC_1}}, trozo {{TROZO_A}} ↔ {{DOC_2}}, trozo {{TROZO_B}}', a: 'PAREJA {{N}}: {{DOC_1}} (documento completo) ↔ {{DOC_2}} (documento completo)' },
  { de: 'TEXTO 1 · {{DOC_1}}, trozo {{TROZO_A}}:', a: 'TEXTO 1 · {{DOC_1}} (documento completo):' },
  { de: 'TEXTO 2 · {{DOC_2}}, trozo {{TROZO_B}}:', a: 'TEXTO 2 · {{DOC_2}} (documento completo):' },
];

/** La plantilla de `d3`: la de siempre con los encabezados cambiados, cada uno exactamente UNA vez; si no, no hay plantilla. */
export function plantillaD3(base: string = PREGUNTA_CERRADA): { ok: true; plantilla: string } | { ok: false; motivo: string } {
  const lineas = base.split('\n');
  for (const { de, a } of ENCABEZADOS_D3) {
    const i = lineas.indexOf(de);
    if (i === -1 || lineas.indexOf(de, i + 1) !== -1) return { ok: false, motivo: `el encabezado «${de}» no está una sola vez en la plantilla` };
    lineas[i] = a;
  }
  return { ok: true, plantilla: lineas.join('\n') };
}

/** El prompt de `d3`: la plantilla de arriba, los dos documentos enteros, una línea en blanco y las dos líneas de hallazgo de `d2`. */
export function construirPromptD3(p: { documento1: string; textoA: string; documento2: string; textoB: string }, criterioDelCumplimiento: string):
  { ok: true; prompt: string } | { ok: false; motivo: string } {
  const pl = plantillaD3();
  if (!pl.ok) return pl;
  // los números de trozo no los usa la plantilla de d3; van a 0 porque la firma de `construirPrompt` los pide
  const base = construirPrompt({ documento1: p.documento1, trozoA: 0, textoA: p.textoA, documento2: p.documento2, trozoB: 0, textoB: p.textoB }, criterioDelCumplimiento, pl.plantilla);
  return base.ok ? { ok: true, prompt: `${base.prompt}\n\n${LINEAS_DE_HALLAZGO}` } : base;
}

/** Cuánto de cada documento enseña el resumen del ensayo, por cada lado del empalme. */
export const CARACTERES_DEL_RESUMEN = 300;

/**
 * EL ENSAYO RECORTADO (arquitecto, 10/11): el prompt de `d3` tiene unos 127.000 caracteres y no cruza el chat entero (ese día se
 * cortaron tres pegados de 9.000). Se devuelve lo que hace falta para revisarlo: su huella y su longitud; la cabeza (la línea
 * PAREJA, el encabezado TEXTO 1 y el principio del documento 1); el empalme (el final del 1, el encabezado TEXTO 2 y el principio
 * del 2); y la cola entera, desde «Contesta a LAS DOS preguntas» (el criterio y las dos líneas). `enSuSitio` dice si cada documento
 * está entero y en su sitio dentro del prompt: si no lo está, los cortes de arriba no enseñarían lo que dicen.
 */
export function resumenDelPromptD3(prompt: string, textoA: string, textoB: string, huella: string) {
  const n = CARACTERES_DEL_RESUMEN;
  const finDeLinea = (desde: number) => { const i = prompt.indexOf('\n', desde); return i === -1 ? prompt.length : i + 1; };
  const t1 = prompt.indexOf('\nTEXTO 1 · '), t2 = prompt.indexOf('\nTEXTO 2 · '), cola = prompt.indexOf('Contesta a LAS DOS preguntas');
  const inicioA = t1 === -1 ? -1 : finDeLinea(t1 + 1), inicioB = t2 === -1 ? -1 : finDeLinea(t2 + 1);
  const enSuSitio = {
    documento1: inicioA !== -1 && prompt.slice(inicioA, inicioA + textoA.length) === textoA,
    documento2: inicioB !== -1 && prompt.slice(inicioB, inicioB + textoB.length) === textoB,
  };
  const finA = inicioA + textoA.length;
  return {
    huellaDelPrompt: huella,
    longitudDelPrompt: prompt.length,
    enSuSitio,
    cabeza: inicioA === -1 ? null : prompt.slice(0, inicioA + Math.min(n, textoA.length)),
    empalme: inicioA === -1 || inicioB === -1 ? null : prompt.slice(Math.max(inicioA, finA - n), inicioB + Math.min(n, textoB.length)),
    cola: cola === -1 ? null : prompt.slice(cola),
  };
}

/**
 * La pareja tal como la lee el rápido con el interruptor encendido, por `leerLaPareja`. Sólo vale `pareja_entera`: cualquier
 * otro régimen se devuelve como error, con el régimen, para que la ruta responda 409 sin llamar al modelo.
 */
export function leerParejaEntera(a: {
  analizado: { nombre: string; trozos: StoredChunk[] };
  candidato: { documentId: string; nombre: string; trozos: StoredChunk[] };
}): { ok: true; textoAnalizado: string; bloqueCandidato: string; lectura: LecturaDeLaPareja } | { ok: false; regimen: string; motivo: string } {
  const completo = buildAnalyzedDocumentText(a.analizado.trozos, a.analizado.nombre);
  const pareja = leerLaPareja({
    parejaEntera: true,
    documentId: a.candidato.documentId,
    documentName: a.candidato.nombre,
    analizadoCompleto: completo,
    finesDelAnalizado: finesDePiezas(piezasDelAnalizado(a.analizado.trozos, a.analizado.nombre)),
    analizadoConTrozos: a.analizado.trozos.length > 0,
    // sólo lo leen la tijera vieja y `sin_fuente_comun`, que aquí son un 409: no se manda nunca al modelo
    analizadoViejo: { texto: completo, lado: { caracteres: completo.length, mostrados: completo.length, dejoFuera: false } },
    candidatoChunks: a.candidato.trozos,
    fragmentosEnviados: [],
    // la reserva del bloque por relevancia sólo cuenta cuando la pareja NO cabe, y entonces es un 409
    bloqueRelevancia: '',
  });
  const r = pareja.lectura.regimen;
  if (r !== 'pareja_entera') {
    return { ok: false, regimen: r, motivo: `la pareja sale «${r}», no «pareja_entera»: ${pareja.lectura.analizado.caracteres} + ${pareja.lectura.candidato.caracteres ?? '?'} caracteres con una ventana de ${pareja.lectura.presupuesto ?? '?'}` };
  }
  return { ok: true, textoAnalizado: pareja.textoAnalizado, bloqueCandidato: pareja.bloqueCandidato, lectura: pareja.lectura };
}
