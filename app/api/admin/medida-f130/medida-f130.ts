/**
 * LAS DOS HERRAMIENTAS TEMPORALES DE MEDIDA DE F-130 (29/10/2026). INSTRUMENTO, NO PRODUCTO.
 *
 * Esta carpeta entera se borra en UN commit cuando acabe la semana 0 de F-130: la página, las dos rutas, este módulo
 * y su prueba. Mientras tanto, pasada la fecha de `CADUCA_EL` las dos rutas responden 410 y no tocan ni la base, ni
 * Pinecone, ni el modelo: si alguien se olvida de borrarla, se apaga sola.
 *   · vecindad (P-F130-9): ¿son vecinos vectoriales el trozo 4 de NOR-10 y los trozos 3 y 6 de CLI-12, y comparten
 *     las dos figuras? Lee la base y Pinecone; no llama a ningún modelo ni embebe nada.
 *   · pregunta (E3): la pregunta cerrada sobre la pareja de D, siete veces, con la configuración exacta del juez
 *     (`modeloDelJuez()`). Gasta en la API y NO cobra créditos (arquitecto, 29/10): el gasto queda en el registro por
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
 * ⚠️ PENDIENTE DEL ARQUITECTO. El texto de la pregunta cerrada lo escribe él (29/10): tres criterios con respuesta
 * obligatoria a cada uno, y el TERCERO se mueve LITERAL desde `lib/analysis/excepcion-de-las-reglas.ts`, sin
 * reescribirlo, porque reescribirlo daría dos definiciones del conflicto normativo. Tiene que llevar `{{TEXTO_1}}` y
 * `{{TEXTO_2}}` una vez cada uno, donde van los dos trozos, y pedir la respuesta en JSON (se lee con `callLLMJson`).
 * Mientras esté vacío, la ruta de E3 responde 409 y no llama al modelo.
 */
export const PREGUNTA_CERRADA = '';

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
 * E3 EN LA CONDICIÓN REALISTA (arquitecto, 29/10): los dos trozos ENTEROS, con A dentro, y no las dos frases de D
 * solas. La condición limpia daría 7 de 7 y no mediría nada, porque el enumerador entregará trozos, no frases. Y el par
 * NOR-10·4 ↔ CLI-12·3 lleva una mitad de A y una de D en cada lado.
 */
export const PAREJA_DE_E3: { analizado: ClaveDeTrozo; candidato: ClaveDeTrozo } = { analizado: 'nor10_4', candidato: 'cli12_3' };
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

/** El prompt de E3: la pregunta con los dos trozos en sus marcas. Cada marca tiene que estar exactamente una vez. */
export function construirPrompt(pregunta: string, texto1: string, texto2: string): { ok: true; prompt: string } | { ok: false; motivo: string } {
  if (pregunta.trim() === '') return { ok: false, motivo: 'la pregunta cerrada está vacía: pendiente del arquitecto' };
  for (const marca of ['{{TEXTO_1}}', '{{TEXTO_2}}']) {
    const n = pregunta.split(marca).length - 1;
    if (n !== 1) return { ok: false, motivo: `la marca ${marca} sale ${n} veces y tiene que salir una` };
  }
  return { ok: true, prompt: pregunta.replace('{{TEXTO_1}}', () => texto1).replace('{{TEXTO_2}}', () => texto2) };
}

/** El puesto (desde 1) de cada id objetivo en una lista de resultados ordenada, o null si no salió. */
export function puestos(ids: string[], objetivos: string[]): Record<string, number | null> {
  return Object.fromEntries(objetivos.map(o => { const i = ids.indexOf(o); return [o, i === -1 ? null : i + 1]; }));
}
