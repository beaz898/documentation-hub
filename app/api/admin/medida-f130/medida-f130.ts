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
 * ⚠️ EL TERCER CRITERIO, PENDIENTE (arquitecto, 28/10). Se MUEVE LITERAL desde `lib/analysis/excepcion-de-las-reglas.ts`, el
 * bloque del criterio del conflicto normativo, sin reescribir ni una palabra: reescribirlo daría dos definiciones del
 * conflicto normativo, que es lo que el dictamen de F-130 prohíbe. Si no cabe como pregunta, lo recorta el arquitecto,
 * no Code. Mientras esté vacío, la ruta de E3 responde 409 y no llama al modelo.
 */
export const CRITERIO_TRES = '';

/**
 * LA PREGUNTA CERRADA, texto del arquitecto (28/10), literal salvo dos cosas de Code: las marcas {{…}} donde él escribió
 * «<…>», y los dos trozos en párrafos separados (en su texto venían en una línea, «<texto del trozo a> <texto del trozo b>»).
 * Una pareja por llamada, así que la pareja es siempre la 1. ⚠️ Las dos últimas frases son la pieza del hueco por
 * pareja Y POR CRITERIO: «No las quites al implementar» (arquitecto).
 */
export const PREGUNTA_CERRADA = [
  'PAREJA {{N}}: {{DOCUMENTO_1}}, trozo {{TROZO_A}} ↔ {{DOCUMENTO_2}}, trozo {{TROZO_B}}',
  '',
  '{{TEXTO_A}}',
  '',
  '{{TEXTO_B}}',
  '',
  'Contesta a LAS TRES preguntas. Las tres son obligatorias y «no» es la respuesta normal.',
  '',
  '¿Dicen las dos cosas DISTINTAS sobre el MISMO dato?',
  '¿Se pueden CUMPLIR LAS DOS A LA VEZ?',
  '{{CRITERIO_TRES}}',
  '',
  'Para cada una: sí o no. Si es sí, la cita literal de cada lado. CONTESTAR «SÍ» A UNA NO TE EXIME DE CONTESTAR A LAS OTRAS DOS. CONTESTAR «NO» A UNA NO TE EXIME DE CONTESTAR A LAS OTRAS DOS.',
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
 */
export const PAREJAS_DE_E3: Array<{ analizado: ClaveDeTrozo; candidato: ClaveDeTrozo }> = [
  { analizado: 'nor10_4', candidato: 'cli12_3' },
  { analizado: 'nor10_4', candidato: 'cli12_6' },
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

/** El prompt de E3 para una pareja. Sin el tercer criterio no se arma: el criterio es del arquitecto, y vacío es «pendiente». */
export function construirPrompt(pareja: DatosDeLaPareja, criterioTres: string): { ok: true; prompt: string } | { ok: false; motivo: string } {
  if (criterioTres.trim() === '') return { ok: false, motivo: 'el tercer criterio está vacío: pendiente de moverlo literal desde excepcion-de-las-reglas.ts' };
  const valores: Record<string, string> = {
    '{{N}}': '1', '{{DOCUMENTO_1}}': pareja.documento1, '{{TROZO_A}}': String(pareja.trozoA), '{{DOCUMENTO_2}}': pareja.documento2,
    '{{TROZO_B}}': String(pareja.trozoB), '{{TEXTO_A}}': pareja.textoA, '{{TEXTO_B}}': pareja.textoB, '{{CRITERIO_TRES}}': criterioTres,
  };
  // una sola pasada por la plantilla: un texto del cliente que contuviera una marca no se sustituye
  return { ok: true, prompt: PREGUNTA_CERRADA.replace(/\{\{[A-Z_0-9]+\}\}/g, m => valores[m] ?? m) };
}

/** El puesto (desde 1) de cada id objetivo en una lista de resultados ordenada, o null si no salió. */
export function puestos(ids: string[], objetivos: string[]): Record<string, number | null> {
  return Object.fromEntries(objetivos.map(o => { const i = ids.indexOf(o); return [o, i === -1 ? null : i + 1]; }));
}
