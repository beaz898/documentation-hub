import { marcasDe } from './brazos';

/**
 * LA TANDA DE CLARIDAD, EL PASO 1 DEL PLAN DE FABLE (adenda 3, 12/11/2026; `claude/consultas-fable/F-130_2026-11-12_adenda-3-y-respuesta.md`).
 * TEMPORAL como toda la carpeta. NO ES UN DIAGNÓSTICO NI UN CAMBIO CANDIDATO: mide una propiedad del CASO, no del juez. Mide si D
 * se deduce sin duda con las dos frases delante, no si el juez la encuentra. Regla del director, la del producto desde el 01/11:
 * sólo se firma lo que se deduce sin duda leyendo las dos frases; en caso de duda, no se marca.
 * MONTAJE (Fable): el mismo modelo y el mismo esfuerzo que el juez (`modeloDelJuez`), SIN el prompt del juez, una llamada nueva por
 * tirada; sólo los dos párrafos (NOR-10 §2.4 y CLI-12 §3.5), SIN las frases de A; dos brazos de 42 tiradas, el mismo día.
 *   · Brazo N, neutro: `PREGUNTA_N`. Positivo: CONFLICTO.
 *   · Brazo R, con la regla del producto: `PREGUNTA_R`. Positivo: NO PUEDE.
 * LAS DOS PREGUNTAS SON DE FABLE, LITERALES, SIN TOCAR UNA PALABRA (una prueba las busca en el texto archivado).
 * ⚠️ LO QUE ES NUESTRO, y se declara: el encuadre de los dos textos («Texto 1:» y «Texto 2:», entre comillas triples; el brazo R
 * habla de «Texto 1» y «Texto 2», así que las etiquetas hacen falta, y el Texto 1 es el permiso); que de cada sección va SÓLO EL
 * PÁRRAFO que contiene el ancla de D, sin el título; y la regla con que se quitan las frases de A (`sinFrasesDeA`).
 * LA CUENTA (Fable): sólo la primera línea. Positivo es CONFLICTO en N y NO PUEDE en R; todo lo demás cuenta en contra, incluidos
 * DEPENDE y cualquier respuesta sin la palabra. No se piden citas, así que no hay indecidibles. ⚠️ Nuestra concreción, escrita antes
 * de pulsar: la primera línea NO VACÍA, quitando marcas de formato (* _ # ` >), comillas y la puntuación del final, sin tildes y en
 * mayúsculas, TIENE QUE SER EXACTAMENTE la palabra. «Respuesta: CONFLICTO» cuenta en contra.
 */

export const PREGUNTA_N = 'Los dos textos son de la misma organización y están vigentes a la vez. ¿Hay un conflicto entre lo que establecen? Responde en la primera línea con una sola palabra: CONFLICTO, COMPATIBLES o DEPENDE. Después explica tu respuesta en tres frases como máximo.';
export const PREGUNTA_R = 'El Texto 1 permite algo. Si una clínica hace uso de ese permiso, ¿puede cumplir al mismo tiempo lo que establece el Texto 2? No vale responder que basta con no usar el permiso. Responde en la primera línea con una sola de estas opciones: NO PUEDE, SÍ PUEDE o DEPENDE. Después explica tu respuesta en tres frases como máximo.';

export type BrazoDeClaridad = 'n' | 'r';
export const TIRADAS_POR_BRAZO = 42;
export const POSITIVO: Record<BrazoDeClaridad, string> = { n: 'CONFLICTO', r: 'NO PUEDE' };
export const OPCIONES: Record<BrazoDeClaridad, readonly string[]> = { n: ['CONFLICTO', 'COMPATIBLES', 'DEPENDE'], r: ['NO PUEDE', 'SI PUEDE', 'DEPENDE'] };

/** Las anclas de D, una por lado: el párrafo que la contiene es el que entra. */
export const ANCLAS = { texto1: 'puede recaer en el propio Director Clínico', texto2: 'nunca por el Director Clínico del propio centro' } as const;

/** El párrafo (lo que va entre dos saltos de línea) que contiene el ancla. Tiene que salir una vez. */
export function parrafoQueContiene(texto: string, ancla: string): { ok: true; parrafo: string } | { ok: false; motivo: string } {
  const parrafos = texto.split(/\n+/).map(p => p.trim()).filter(p => p.includes(ancla));
  if (parrafos.length !== 1) return { ok: false, motivo: `«${ancla}» sale en ${parrafos.length} párrafos, y tiene que salir en uno` };
  return { ok: true, parrafo: parrafos[0] };
}

/** El párrafo sin las frases que llevan una marca de A (`brazos.ts`). Una frase acaba en punto seguido de espacio, o al final. */
export function sinFrasesDeA(parrafo: string): { texto: string; quitadas: string[] } {
  // se corta sólo en el espacio que sigue a un punto: «apartado 3.1.» no parte la frase en «3.» y «1.»
  const frases = parrafo.split(/(?<=\.)\s+/).map(f => f.trim()).filter(Boolean);
  const deA = (f: string) => marcasDe(f).some(m => m.startsWith('A:'));
  return { texto: frases.filter(f => !deA(f)).join(' '), quitadas: frases.filter(deA) };
}

/** Los dos textos de la tanda, o la negativa: cada uno con su ancla de D y SIN ninguna marca de A. */
export function textosDeClaridad(trozoNor: string, trozoCli: string):
  { ok: true; texto1: string; texto2: string; quitadas: string[] } | { ok: false; motivo: string } {
  const p1 = parrafoQueContiene(trozoNor, ANCLAS.texto1), p2 = parrafoQueContiene(trozoCli, ANCLAS.texto2);
  if (!p1.ok) return { ok: false, motivo: `Texto 1: ${p1.motivo}` };
  if (!p2.ok) return { ok: false, motivo: `Texto 2: ${p2.motivo}` };
  const t1 = sinFrasesDeA(p1.parrafo), t2 = sinFrasesDeA(p2.parrafo);
  for (const [n, t, ancla] of [['Texto 1', t1.texto, ANCLAS.texto1], ['Texto 2', t2.texto, ANCLAS.texto2]] as const) {
    if (!t.includes(ancla)) return { ok: false, motivo: `${n}: al quitar las frases de A se ha ido el ancla de D` };
    const deA = marcasDe(t).filter(m => m.startsWith('A:'));
    if (deA.length) return { ok: false, motivo: `${n}: sigue llevando marcas de A (${deA.join(', ')})` };
  }
  return { ok: true, texto1: t1.texto, texto2: t2.texto, quitadas: [...t1.quitadas, ...t2.quitadas] };
}

/** El prompt de una tirada: los dos textos y la pregunta del brazo. */
export function promptDeClaridad(brazo: BrazoDeClaridad, texto1: string, texto2: string): string {
  return `Texto 1:\n"""\n${texto1}\n"""\n\nTexto 2:\n"""\n${texto2}\n"""\n\n${brazo === 'n' ? PREGUNTA_N : PREGUNTA_R}`;
}

/** La primera línea no vacía, limpia como dice la cabecera. */
export function primeraLinea(respuesta: string): string {
  const linea = respuesta.split('\n').map(l => l.trim()).find(l => l !== '') ?? '';
  return linea.replace(/[*_#`>«»"'“”]/g, '').trim().replace(/[.:;,!]+$/, '').trim()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().replace(/\s+/g, ' ');
}

/** El veredicto de una tirada: positivo sólo si la primera línea es exactamente la palabra del positivo. */
export function veredicto(brazo: BrazoDeClaridad, respuesta: string): { linea: string; opcion: string; positivo: boolean } {
  const linea = primeraLinea(respuesta);
  const opcion = OPCIONES[brazo].includes(linea) ? linea : 'OTRA';
  return { linea, opcion, positivo: linea === POSITIVO[brazo] };
}

/** La banda de una tanda de 42 (Fable): ≥37 clara · ≤30 no clara · 31–36 se repite otro día y se decide sobre 84 con ≥68. */
export function banda(positivos: number): 'clara' | 'no_clara' | 'se_repite' {
  return positivos >= 37 ? 'clara' : positivos <= 30 ? 'no_clara' : 'se_repite';
}

/** La cuenta de una tanda: positivos, por opción, y la banda. */
export function contarClaridad(brazo: BrazoDeClaridad, respuestas: string[]) {
  const v = respuestas.map(r => veredicto(brazo, r));
  const porOpcion: Record<string, number> = {};
  for (const x of v) porOpcion[x.opcion] = (porOpcion[x.opcion] ?? 0) + 1;
  const positivos = v.filter(x => x.positivo).length;
  return { tiradas: v.length, positivos, porOpcion, banda: v.length === TIRADAS_POR_BRAZO ? banda(positivos) : 'tanda_incompleta' as const };
}
