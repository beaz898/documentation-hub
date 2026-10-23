/**
 * EL CORTE DEL ANALIZADO EN EL CORTE HONESTO — la primera mitad del 3.1.2 (F-127 P3, P7 paso 2 y adenda Q3;
 * plan aprobado por el arquitecto el 23/10/2026).
 *
 * Hasta aquí el analizado se cortaba por POSICIÓN —\`completo.slice(0, tope)\`—, a mitad de frase o de tabla, y
 * eso pide al juez citar tramos contiguos literales de un texto que no le llega entero. Ahora:
 *   · el corte AVANZA hasta el final de la pieza en curso, pasándose del tope como mucho una pieza («el
 *     presupuesto en caracteres es vuestro, no del modelo», adenda Q3);
 *   · si esa pieza pasa de \`AVANCE_MAXIMO_DEL_CORTE\` (3.000), RETROCEDE al límite anterior;
 *   · si no hay límite anterior —la primera pieza ya pasa de 3.000—, se queda en la POSICIÓN de siempre: retroceder
 *     ahí dejaría el analizado vacío, que es peor que media frase. Es la única rama por posición, y se declara.
 * Las piezas son las de \`piezasDelAnalizado\` (\`judge.ts\`), unidas con \`SEPARADOR\`: el mismo criterio que monta el
 * texto decide dónde puede cortarse, y aquí no se recalcula.
 *
 * ⚠️ DÓNDE SE PUEDE MEDIR: con la ventana de 150.000 ninguna pareja del corpus tiene corte del analizado, y con
 * 80.000 tampoco (el reparto le dio a NOR-10 sus 66.801 enteros; lo que se recortó fue el candidato). El caso
 * medido es el de 40.000 (F-128, 19/10): el corte caía en 37.143, dentro del trozo 36, y B empieza hacia el
 * 36.553. Las pruebas lo ejercen con esa ventana; en una tanda de este corpus, esta mitad sale «NO APLICA: sin
 * corte» y no cuenta como acierto.
 * ⚠️ Y LA RAMA DE RETROCEDER SÓLO LA PUEDE DISPARAR UNA TABLA: la prosa se subdivide por encima de 1.500
 * caracteres (\`lib/chunking.ts\`), así que sólo una tabla, que se monta como una pieza entera, pasa de 3.000.
 */
export const AVANCE_MAXIMO_DEL_CORTE = 3_000;
export const SEPARADOR = '\n\n';

export type ModoDelCorte = 'limite_exacto' | 'avanza' | 'retrocede' | 'posicion';

export interface CorteDelAnalizado {
  texto: string;
  /** Cómo se cortó; ausente si el analizado cabía entero. */
  modo?: ModoDelCorte;
}

/** Dónde acaba cada pieza en el texto unido con \`SEPARADOR\` (fin exclusivo), en orden. */
export function finesDePiezas(piezas: string[]): number[] {
  const fines: number[] = [];
  let pos = 0;
  piezas.forEach((p, i) => { pos += (i > 0 ? SEPARADOR.length : 0) + p.length; fines.push(pos); });
  return fines;
}

/**
 * Corta \`completo\` por un límite de pieza cerca de \`tope\`. \`fines\` son los de \`finesDePiezas\` sobre las mismas
 * piezas que forman \`completo\`; con una sola pieza (o sin piezas, el texto plano) el corte es por posición.
 */
export function cortarEnLimiteDePieza(completo: string, fines: number[], tope: number): CorteDelAnalizado {
  if (completo.length <= tope) return { texto: completo };
  const limite = Math.max(0, tope);
  const i = fines.findIndex(f => f >= limite);
  if (i < 0) return { texto: completo.slice(0, limite), modo: 'posicion' };   // fines que no cubren el texto: no se adivina
  if (fines[i] === limite) return { texto: completo.slice(0, limite), modo: 'limite_exacto' };
  const anterior = i > 0 ? fines[i - 1] : null;
  const inicio = anterior === null ? 0 : anterior + SEPARADOR.length;
  // el tope cae en el separador entre dos piezas: la anterior ya acabó
  if (anterior !== null && limite < inicio) return { texto: completo.slice(0, anterior), modo: 'limite_exacto' };
  if (fines[i] - inicio <= AVANCE_MAXIMO_DEL_CORTE) return { texto: completo.slice(0, fines[i]), modo: 'avanza' };
  if (anterior !== null) return { texto: completo.slice(0, anterior), modo: 'retrocede' };
  return { texto: completo.slice(0, limite), modo: 'posicion' };
}
