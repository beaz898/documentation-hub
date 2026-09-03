/**
 * LA TRAZA DEL DIFF: POR CANDIDATO Y EN TOTAL (F-102).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUÉ EXISTE, y es una regla pagada con una medición mal dada por buena: la
 * línea del diff se imprimía UNA VEZ POR CANDIDATO. Con un candidato esa línea
 * ERA el total; con dos, la primera decía 15, la segunda decía otra cosa, y el
 * total no lo imprimía nadie. Quien leyó la primera dio la pasada por buena.
 *
 * «Un registro que era completo cuando se escribió deja de serlo cuando cambia
 * lo que describe, y no avisa.»
 *
 * LA REGLA QUE SALE DE AHÍ: **todo registro por-unidad imprime además su
 * AGREGADO, o no imprime cifras.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ ESTO NO SUSTITUYE A LEER LA TABLA. La cifra que vale es la que se guarda —
 * el log describe el camino, la base describe el resultado—. Lo que estas líneas
 * evitan es que el log INVITE a concluir: con el acumulado delante, nadie
 * confunde la parte con el todo.
 */

/**
 * La línea de un candidato, con lo suyo Y lo que va acumulado.
 *
 * ⚠️ EL ACUMULADO VA EN LA MISMA LÍNEA, no en una posterior: quien lee un log
 * lee lo que tiene delante, y una cifra que solo aparece al final se pierde en
 * cuanto el log se filtra o se trunca — que es como se leyó mal la primera vez.
 */
export function lineaDeCandidato(p: {
  candidato: string;
  parejas: number;
  emitidas: number;
  emitidasAcumuladas: number;
  candidatoNumero: number;
}): string {
  return (
    `Diff de tablas contra "${p.candidato}" (candidato ${p.candidatoNumero}): ` +
    `${p.parejas} pareja(s), ${p.emitidas} discrepancia(s) emitida(s) ` +
    `— acumuladas: ${p.emitidasAcumuladas}`
  );
}

/**
 * EL AGREGADO, al terminar todos los candidatos.
 *
 * ⚠️ SE IMPRIME AUNQUE SOLO HAYA UN CANDIDATO. La tentación es callarlo cuando
 * es redundante, y es justo entonces cuando enseña a leer mal: si el agregado
 * solo aparece con dos o más, el lector aprende que la línea suelta es el total
 * — y vuelve el fallo, con el log dándole la razón.
 */
export function lineaDeAgregado(p: {
  candidatos: number;
  parejasTotales: number;
  emitidasTotales: number;
}): string {
  return (
    `Diff de tablas — TOTAL: ${p.emitidasTotales} discrepancia(s) emitida(s) ` +
    `sobre ${p.parejasTotales} pareja(s) en ${p.candidatos} candidato(s)`
  );
}
