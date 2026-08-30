import type { SelectionLimit } from './types';

/**
 * EL ALCANCE DECLARADO, DESPUÉS DE QUE EL DIFF EXISTA (B.122, primera mitad).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * QUÉ PROBLEMA RESUELVE. El aviso de alcance (F-74 P2) declara cuántas filas
 * no cupieron en el PROMPT DEL JUEZ. Su medida siempre fue correcta, pero su
 * frase —«no se han comparado»— hablaba del análisis EN CONJUNTO cuando solo
 * sabía de una etapa. Desde que el diff de tablas emite, eso dejó de ser
 * verdad: el diff NO pasa por ese presupuesto —lee `document_chunks` entero—
 * así que comparaba las sesenta filas mientras el aviso decía que treinta y
 * ocho se habían quedado sin mirar.
 *
 * EL ARGUMENTO QUE DECIDE, y conviene tenerlo delante al tocar esto: el aviso
 * existe para convertir un recorte INVISIBLE en un límite DECLARADO. Si el
 * recorte ya no implica ceguera —porque otra etapa cubrió ese terreno, y
 * mejor— declararlo es el FALLO INVERSO: una promesa de más sobre nuestra
 * propia incompetencia. Decir que no miramos algo que sí miramos es tan falso
 * como callar lo que no miramos.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ LA RESTA SE APLICA AL ANALIZAR, NO AL LEER — y por eso los análisis
 * VIEJOS SIGUEN ENSEÑANDO SU AVISO PARA SIEMPRE. Es correcto que lo enseñen:
 * se hicieron sin la resta, así que sus `selectionLimits` guardados en el jsonb
 * son los de entonces y describen fielmente lo que aquel análisis miró.
 *
 * Costó un susto el 30/08 —el aviso seguía en pantalla y parecía un fallo— y
 * conviene saberlo antes de buscar un fallo que no está: reabrir un análisis
 * de la bandeja NO recalcula nada. Para ver el efecto de la resta hay que
 * LANZAR UN ANÁLISIS NUEVO. La misma naturaleza que el marcado de descartes de
 * F-86: lo que se persiste es EL ANÁLISIS; lo que se decide al vuelo es otra
 * cosa.
 *
 * ⚠️ ES POR TABLA, NO POR DOCUMENTO. Es la parte delicada y la razón de que
 * esto sea una función con nombre y no un `filter` en línea: el diff solo
 * cubre LAS TABLAS QUE EMPAREJÓ. Las filas de otras tablas del mismo documento
 * siguen fuera del prompt del juez y nadie las ha mirado — restar por documento
 * apagaría un aviso VERDADERO.
 */

/** Una tabla que el diff comparó celda a celda. El documento va dentro porque
 *  un `tableId` solo es único dentro del suyo: dos documentos pueden tener
 *  ambos una hoja «Tarifas#0», y confundirlas es exactamente el fallo que la
 *  regla «por tabla, no por documento» viene a evitar. */
export interface TablaCubierta {
  documentId: string;
  tableId: string;
}

function clave(documentId: string, tableId: string): string {
  return `${documentId}␟${tableId}`;
}

/**
 * Quita del alcance declarado las tablas que el diff sí comparó.
 *
 * `limits` llega con su documento porque `SelectionLimit` no lo lleva dentro —
 * el mapa de retrieval está indexado por `documentId` y el tipo solo guarda el
 * NOMBRE del documento, que no sirve como clave (dos documentos pueden
 * llamarse igual en organizaciones distintas, y el nombre es dato del cliente).
 */
export function restarTablasCubiertas(
  limits: Array<{ documentId: string; limit: SelectionLimit }>,
  cubiertas: TablaCubierta[],
): SelectionLimit[] {
  if (cubiertas.length === 0) return limits.map(l => l.limit);

  const cubiertasSet = new Set(cubiertas.map(c => clave(c.documentId, c.tableId)));

  return limits
    .filter(({ documentId, limit }) => !cubiertasSet.has(clave(documentId, limit.tableId)))
    .map(l => l.limit);
}
