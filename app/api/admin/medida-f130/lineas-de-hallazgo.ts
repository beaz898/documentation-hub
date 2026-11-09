import { construirPrompt, type DatosDeLaPareja } from './medida-f130';

/**
 * LAS DOS LÍNEAS DE HALLAZGO (09/11/2026). TEMPORAL como toda la carpeta (cabecera de `medida-f130.ts`).
 *
 * El cambio de diseño del director: en vez de seguir arreglando el lector de la prosa, la pregunta cerrada termina con dos líneas
 * obligatorias que dicen si HAY HALLAZGO en cada pregunta, con la MISMA polaridad las dos («SÍ» = hay hallazgo), y el lector
 * lee sólo esas líneas. Texto aprobado por el arquitecto el 09/11, carácter a carácter: no se toca.
 *
 * ⚠️ VIVE EN SU PROPIO FICHERO A PROPÓSITO: `PREGUNTA_CERRADA` y `construirPrompt` (`medida-f130.ts`) no cambian, así que la ruta
 * `d` sigue mandando el MISMO prompt que en las tandas del 06/11 y el 09/11 (4.155 tokens de entrada). Lo vigila la prueba que lo
 * compara byte a byte con el prompt del ensayo archivado. La ruta `d2` usa `construirPromptConLineas`, que es ese prompt y,
 * detrás, una línea en blanco y este bloque. Ruta nueva y no parámetro: un error al leer un parámetro podría cambiar la tanda de
 * referencia sin que nadie lo notara (arquitecto, 09/11).
 */
export const LINEAS_DE_HALLAZGO = [
  'AL TERMINAR, ESCRIBE ESTAS DOS LÍNEAS, PONIENDO «SÍ» O «NO» EN LUGAR DE LO QUE VA ENTRE CORCHETES, Y NADA DETRÁS. Cada línea dice si HAY HALLAZGO en esa pregunta, no qué has contestado a la pregunta: en la 1, «SÍ» quiere decir que los dos textos dicen cosas distintas sobre el mismo dato; en la 2, «SÍ» quiere decir que NO se pueden cumplir las dos a la vez.',
  'HALLAZGO EN LA 1: [escribe SÍ o escribe NO]',
  'HALLAZGO EN LA 2: [escribe SÍ o escribe NO]',
].join('\n');

/** El prompt de la ruta `d`, idéntico, y detrás una línea en blanco y las dos líneas de hallazgo. */
export function construirPromptConLineas(pareja: DatosDeLaPareja, criterioDelCumplimiento: string): { ok: true; prompt: string } | { ok: false; motivo: string } {
  const base = construirPrompt(pareja, criterioDelCumplimiento);
  return base.ok ? { ok: true, prompt: `${base.prompt}\n\n${LINEAS_DE_HALLAZGO}` } : base;
}
