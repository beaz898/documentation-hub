/**
 * LAS DOS HERRAMIENTAS TEMPORALES DE MEDIDA DE F-130 (28/10/2026). INSTRUMENTO, NO PRODUCTO.
 *
 * Esta carpeta entera se borra en UN commit cuando acabe la semana 0 de F-130: la página, las dos rutas, este módulo
 * y su prueba. Mientras tanto, pasada la fecha de `CADUCA_EL` las dos rutas responden 410 y no tocan ni la base, ni
 * Pinecone, ni el modelo: si alguien se olvida de borrarla, se apaga sola.
 *   · vecindad (P-F130-9): ¿son vecinos vectoriales el trozo 4 de NOR-10 y los trozos 3 y 6 de CLI-12, y comparten
 *     las dos figuras? Lee la base y Pinecone; no llama a ningún modelo ni embebe nada.
 *   · pregunta (E3): la pregunta cerrada sobre la pareja de D, siete veces, con la configuración exacta del juez
 *     (`modeloDelJuez()`). Gasta en la API y NO cobra créditos (arquitecto, 28/10): el gasto queda en el registro por
 *     llamada que devuelve.
 * Las dos: POST, sólo administradores, organización resuelta por el usuario, nada del cliente en la entrada (los
 * pasajes se leen de la base) y ninguna tabla nueva. Lo que devuelven lo pega el director y se archiva en `claude/`.
 */

/** Pasada esta fecha, las dos rutas responden 410. Fecha del arquitecto: la semana 0 de F-130 más margen. */
export const CADUCA_EL = '2026-11-15T00:00:00+01:00';

export function estaCaducada(ahora: Date): boolean {
  return ahora.getTime() >= new Date(CADUCA_EL).getTime();
}

/**
 * LA PREGUNTA CERRADA, texto del arquitecto (29/10), literal salvo las marcas {{…}} y la sangría de su mensaje. DOS
 * preguntas, no tres (su corrección del 29/10: el bloque del juez no es un tercer criterio, es la pregunta del
 * cumplimiento con sus guardas): A va al hueco 1, el dato; D al 2, el cumplimiento; y no compiten. El criterio del
 * cumplimiento entra en {{CRITERIO_DEL_CUMPLIMIENTO}}, recortado del bloque del juez (`criterio-del-cumplimiento.ts`).
 * Una pareja por llamada, así que la pareja es siempre la 1.
 * ⚠️ «CONTESTAR A UNA NO TE EXIME…» y las dos líneas «HAY HALLAZGO SI LA RESPUESTA ES…» son las piezas que, si alguien
 * las simplifica, devuelven el fallo; llevan mutante cada una. La pregunta del cumplimiento le ha fallado dos veces al
 * arquitecto por su polaridad («sí» es lo normal y «no» es el hallazgo): por eso se marca qué respuesta es el hallazgo.
 * La cita y la etiqueta de la 2 (29/10): sin cita, E3 NO MIDE —un «no» sin cita no dice si encontró D o cualquier otra
 * cosa—; la etiqueta es parte de la respuesta de la 2 cuando dispara, NO un tercer hueco. Llevan mutante cada una.
 * ⚠️ LA LÍNEA DEL MISMO PAR DE FRASES SE BORRÓ (arquitecto, 29/10, tras la segunda tanda): sin ella, nunca medido; ancha,
 * 5 de 7; estrecha, 3 de 7. Hacía daño en las dos versiones, y más cuanto más se apretaba; y su sitio no era el prompt:
 * Fable la puso en el VALIDADOR, en código, y así queda como requisito de la pasada 2. En E3 el validador es el arquitecto.
 * Y LA PREGUNTA 2 SE DESACOPLA en el mismo cambio: «ESTA PREGUNTA SE CONTESTA SOLA, COMO SI LA 1 NO EXISTIERA…», que mata
 * las dos salidas que el modelo usó («ya queda recogido en la pregunta 1», «no encuentro otro par de frases»). Son dos
 * cambios en dos sitios pero UNA SOLA COSA: los dos quitan el acoplamiento entre las preguntas, y uno sin el otro dejaría
 * una salida abierta. La frase lleva mutante por cada una de sus partes.
 * ⚠️ CORREGIDA ANTES DE LANZAR LA TERCERA TANDA (29/10), por una marca de Code: la primera versión terminaba en «aunque las
 * frases sean las mismas que citaste en la 1», y chocaba con el criterio recortado, que manda a la 1 lo que versa sobre
 * la misma cosa. Y en las vueltas 1, 3 y 4 de la segunda tanda el modelo no se escurría: OBEDECÍA ese criterio, juzgando
 * el par de trozos ENTERO, cuando ese par manda a la vez sobre la misma cosa (A) y sobre cosas distintas (D). Ahora la
 * pregunta 2 se hace SOBRE FRASES, no sobre los dos textos en bloque; el recorte del criterio no se toca.
 * Y CADA TEXTO LLEVA SU DOCUMENTO Y SU TROZO DELANTE (29/10): sin etiqueta, el modelo deducía cuál era cuál por la
 * numeración. Para E3 es inocuo; para la pasada 2 intercambiaría quién dice qué. Tercer defecto del mismo formato.
 * ⚠️ La respuesta va en TEXTO LLANO a propósito: son catorce respuestas que el arquitecto lee a ojo. ES DECISIÓN DE E3,
 * NO DEL PRODUCTO: el formato estructurado de la pasada 2 se decide cuando se construya, y no se copia de aquí.
 */
export const PREGUNTA_CERRADA = [
  'PAREJA {{N}}: {{DOC_1}}, trozo {{TROZO_A}} ↔ {{DOC_2}}, trozo {{TROZO_B}}',
  '',
  'TEXTO 1 · {{DOC_1}}, trozo {{TROZO_A}}:',
  '{{TEXTO_A}}',
  '',
  'TEXTO 2 · {{DOC_2}}, trozo {{TROZO_B}}:',
  '{{TEXTO_B}}',
  '',
  'Contesta a LAS DOS preguntas. Las dos son obligatorias.',
  'CONTESTAR A UNA NO TE EXIME DE CONTESTAR A LA OTRA, ni cuando tu respuesta señale un hallazgo ni cuando no lo señale.',
  '',
  'PREGUNTA 1 · EL DATO',
  '¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?',
  'HAY HALLAZGO SI LA RESPUESTA ES «SÍ». Si es sí, cita la frase literal de cada lado. Si es no, contesta «no» y pasa a la 2.',
  '',
  'PREGUNTA 2 · EL CUMPLIMIENTO',
  '{{CRITERIO_DEL_CUMPLIMIENTO}}',
  'HAY HALLAZGO SI LA RESPUESTA ES «NO»: si NO se pueden cumplir las dos a la vez. Si es «no», cita la frase literal de cada lado y di cuál de las dos etiquetas es, "norma_contra_norma" o "norma_contra_practica". Si se pueden cumplir, contesta «sí» y no cites nada.',
  'ESTA PREGUNTA SE CONTESTA SOLA, COMO SI LA 1 NO EXISTIERA, Y SE PREGUNTA SOBRE FRASES, NO SOBRE LOS DOS TEXTOS EN BLOQUE. Un mismo par de trozos puede mandar a la vez sobre la misma cosa y sobre cosas distintas, así que no decidas eso del par entero: la distinción de arriba se aplica AL PAR DE FRASES que estés considerando. Recorre las frases y busca si hay ALGUNA de un texto y ALGUNA del otro que no se puedan cumplir a la vez. NO VALE RESPONDER «ya queda recogido en la pregunta 1» NI «no encuentro otro par de frases».',
].join('\n');

/**
 * Los trozos que se miden, por código de documento y número de trozo de la generación activa. Cada uno lleva una
 * frase que tiene que contener: es lo que comprueba que el número de trozo es el que creemos, por el TEXTO y no por
 * el número (la advertencia del troceador, 28/10).
 */
export const TROZOS = {
  nor10_4: { codigo: 'NOR-10', trozo: 4, frase: 'puede recaer en el propio Director Clínico' },
  cli12_3: { codigo: 'CLI-12', trozo: 3, frase: 'separar la responsabilidad de un proceso crítico de seguridad del paciente' },
  cli12_6: { codigo: 'CLI-12', trozo: 6, frase: 'nunca por el Director Clínico del propio centro' },
} as const;
export type ClaveDeTrozo = keyof typeof TROZOS;

/**
 * E3 EN LA CONDICIÓN REALISTA (arquitecto, 28/10): los dos trozos ENTEROS, con A dentro, y no las dos frases de D
 * solas. La condición limpia daría 7 de 7 y no mediría nada, porque el enumerador entregará trozos, no frases. Y el par
 * NOR-10·4 ↔ CLI-12·3 lleva una mitad de A y una de D en cada lado. LAS DOS PAREJAS, siete veces cada una (arquitecto,
 * 28/10, a partir de P-F130-9, que nombra §2.4–§3.1 y §2.4–§3.5): la condición realista no la especifica el dictamen.
 * ⚠️ LA REPETICIÓN DEL 29/10 CORRE SÓLO LA DE §3.1, siete llamadas (arquitecto): la de §3.5 ya dio 6 de 7 en la primera
 * tanda, con el formato de entonces, y no se toca.
 */
export const PAREJAS_DE_E3: Array<{ analizado: ClaveDeTrozo; candidato: ClaveDeTrozo }> = [
  { analizado: 'nor10_4', candidato: 'cli12_3' },
];
export const VECES_DE_E3 = 7;

export const FIGURAS = ['Coordinador de Calidad', 'Director Clínico'] as const;

/** Cuántas veces sale cada figura en el texto del trozo, y cuántas fuera de las líneas de encabezado. */
export function contarFiguras(texto: string): Record<string, { total: number; fueraDeEncabezados: number }> {
  const cuerpo = texto.split('\n').filter(l => !l.startsWith('#')).join('\n');
  const veces = (t: string, f: string) => t.split(f).length - 1;
  return Object.fromEntries(FIGURAS.map(f => [f, { total: veces(texto, f), fueraDeEncabezados: veces(cuerpo, f) }]));
}

export function coseno(a: number[], b: number[]): number | null {
  if (a.length === 0 || a.length !== b.length) return null;
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa === 0 || bb === 0 ? null : ab / Math.sqrt(aa * bb);
}

/** El texto que guarda el vector frente al de la base: iguales, o dónde se separan. */
export function correspondencia(delVector: string | undefined, deLaBase: string):
  { estado: 'igual' } | { estado: 'sin_texto_en_el_vector' } | { estado: 'distinto'; separaEn: number; largoVector: number; largoBase: number } {
  if (typeof delVector !== 'string') return { estado: 'sin_texto_en_el_vector' };
  if (delVector === deLaBase) return { estado: 'igual' };
  let i = 0;
  while (i < delVector.length && i < deLaBase.length && delVector[i] === deLaBase[i]) i++;
  return { estado: 'distinto', separaEn: i, largoVector: delVector.length, largoBase: deLaBase.length };
}

export interface DatosDeLaPareja { documento1: string; trozoA: number; textoA: string; documento2: string; trozoB: number; textoB: string }

/** El prompt de E3 para una pareja. Sin el criterio del cumplimiento no se arma: vacío es que el recorte no se pudo hacer. */
export function construirPrompt(pareja: DatosDeLaPareja, criterioDelCumplimiento: string): { ok: true; prompt: string } | { ok: false; motivo: string } {
  if (criterioDelCumplimiento.trim() === '') return { ok: false, motivo: 'el criterio del cumplimiento está vacío' };
  const valores: Record<string, string> = {
    '{{N}}': '1', '{{DOC_1}}': pareja.documento1, '{{TROZO_A}}': String(pareja.trozoA), '{{DOC_2}}': pareja.documento2,
    '{{TROZO_B}}': String(pareja.trozoB), '{{TEXTO_A}}': pareja.textoA, '{{TEXTO_B}}': pareja.textoB,
    '{{CRITERIO_DEL_CUMPLIMIENTO}}': criterioDelCumplimiento,
  };
  // una sola pasada por la plantilla: un texto del cliente que contuviera una marca no se sustituye
  return { ok: true, prompt: PREGUNTA_CERRADA.replace(/\{\{[A-Z_0-9]+\}\}/g, m => valores[m] ?? m) };
}

/** El puesto (desde 1) de cada id objetivo en una lista de resultados ordenada, o null si no salió. */
export function puestos(ids: string[], objetivos: string[]): Record<string, number | null> {
  return Object.fromEntries(objetivos.map(o => { const i = ids.indexOf(o); return [o, i === -1 ? null : i + 1]; }));
}
