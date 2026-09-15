/**
 * ¿ES UN DUPLICADO EXACTO, O SÓLO UN PARECIDO? — 15/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA, Y COSTÓ 30 CRÉDITOS. El 15/09/2026 el director subió un fichero
 * que ya estaba en el corpus, el análisis rápido lo detectó —el servidor devolvió
 * «este documento es **idéntico** a X. No aporta información nueva», con
 * `duplicateConfidence: 100` y `recommendation: NO_INDEXAR`— y aun así pulsó el
 * análisis exhaustivo, que se cortó a los **76 milisegundos** por ese mismo
 * motivo. Treinta créditos por que el sistema le dijera lo que ya sabía.
 *
 * **No fue un descuido suyo: la pantalla no se lo dijo.** Lo que veía era:
 *
 *   · la palabra **«Similar a X (100% confianza)»** donde el servidor decía
 *     IDÉNTICO — un texto que suaviza lo que el sistema afirma;
 *   · dentro de una sección **plegada por defecto**, y un aviso que hay que
 *     desplegar para verlo no es un aviso.
 *
 * ⚠️ Y NO SE APAGA EL BOTÓN DEL EXHAUSTIVO, que era la otra salida: desde la
 * bandeja se analizan VARIOS documentos a la vez, y apagarlo porque uno sea
 * duplicado impediría analizar los demás. Excluir ese documento del lote es otra
 * pieza. Lo que esta arregla es que, si alguien lo pulsa igual, **ya sea su
 * decisión**.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Lo mínimo del análisis que hace falta para decidir. NO el objeto entero: con
 *  él a mano, alguien acabaría mirando otro campo y la pregunta cambiaría sin
 *  que nadie lo decidiera. */
export interface SeñalDeDuplicado {
  isDuplicate?: boolean;
  duplicateConfidence?: number;
  recommendation?: string;
}

/**
 * EXACTO = las TRES cosas a la vez.
 *
 * ⚠️ NO basta con `duplicateConfidence === 100`. Ese número lo produce también el
 * camino de solapamientos, donde 100 significa «se parecen mucho», no «son el
 * mismo texto». Lo que distingue al corte por hash es que llega con las tres:
 * marca de duplicado, confianza total y la recomendación de no indexar. Pedir las
 * tres es lo que impide que un parecido muy alto se anuncie como identidad —que
 * sería el mismo fallo de hoy con el signo cambiado.
 */
export function esDuplicadoExacto(analisis: SeñalDeDuplicado | null | undefined): boolean {
  if (!analisis) return false;
  return (
    analisis.isDuplicate === true &&
    analisis.duplicateConfidence === 100 &&
    analisis.recommendation === 'NO_INDEXAR'
  );
}
