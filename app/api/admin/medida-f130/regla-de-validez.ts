/**
 * LA PUERTA DE VALIDEZ DEL BRAZO N, CONGELADA (12/11/2026; el arreglo de Fable, adoptado por el arquitecto). Vive sola en este fichero
 * para que su huella cubra la regla y nada más; `regla-de-validez.test.ts` la fija. Cambiar una letra la pone en rojo.
 * EL DEFECTO QUE VIGILA: los dos textos también difieren en QUÉ HACE el Coordinador (supervisión documental en uno, responsable último de
 * la esterilización en el otro), y un CONFLICTO por ese motivo contaría como D sin serlo.
 * LA REGLA (de Code, sobre la explicación: todo lo que va DESPUÉS de la primera línea): un CONFLICTO se explica por D si la explicación,
 * en minúsculas y sin tildes, contiene alguna de `MARCAS_DE_D_EN_LA_EXPLICACION` —la misma persona, la separación, el propio Director
 * Clínico en el cargo—. Si no contiene ninguna, va a «otra cosa»: el sesgo va CONTRA nosotros.
 * LA PUERTA (arquitecto): si MÁS DE UNO DE CADA CINCO conflictos se explica por otra cosa, N NO ESTÁ MIDIENDO D y su cifra no se lee,
 * diga lo que diga. Se lee PRIMERO la puerta y DESPUÉS la cuenta de N.
 */
export const MARCAS_DE_D_EN_LA_EXPLICACION = [
  'misma persona', 'separacion', 'separar', 'separad', 'el propio director clinico', 'ser el director clinico', 'sea el director clinico',
  'recaer en el', 'recae en el', 'acumul', 'ambos cargos', 'los dos cargos', 'doble rol', 'dos roles',
] as const;

/** La explicación de una respuesta: todo lo que va después de la primera línea no vacía. */
export function explicacion(respuesta: string): string {
  const lineas = respuesta.split('\n');
  const i = lineas.findIndex(l => l.trim() !== '');
  return i === -1 ? '' : lineas.slice(i + 1).join('\n').trim();
}

/** La clase de un CONFLICTO: «d» si su explicación lleva alguna marca de D; si no, «otra». */
export function claseDelConflicto(respuesta: string): { clase: 'd' | 'otra'; marcas: string[] } {
  const t = explicacion(respuesta).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const marcas = MARCAS_DE_D_EN_LA_EXPLICACION.filter(m => t.includes(m));
  return { clase: marcas.length > 0 ? 'd' : 'otra', marcas };
}

/** La puerta sobre los CONFLICTO de una tanda: válida si los de «otra cosa» no pasan de uno de cada cinco. */
export function puertaDeValidez(conflictos: string[]): { conflictos: number; porD: number; porOtraCosa: number; valida: boolean } {
  const porOtraCosa = conflictos.filter(r => claseDelConflicto(r).clase === 'otra').length;
  return { conflictos: conflictos.length, porD: conflictos.length - porOtraCosa, porOtraCosa, valida: porOtraCosa * 5 <= conflictos.length };
}
