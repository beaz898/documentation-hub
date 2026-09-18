import { mergeCounters, type PipelineCounters } from './counters';
import type { ResultadoDelEstilo, StyleProblem } from './style-check';

/**
 * LO QUE EL ESTILO APORTA AL OBJETO QUE SE PERSISTE — 18/09/2026.
 *
 * ⚠️ EL CERO INVISIBLE QUE ESTO CIERRA, y duraba desde el 15/09. `analyzeStyle`
 * emitía sus tres contadores correctamente —siempre, también en cero, corregido
 * ese mismo día—, y el pipeline exhaustivo se quedaba con `r.problemas` y TIRABA
 * `r.contadores`. Resultado: en el camino de 30 créditos, que es donde el estilo
 * corre de verdad, las tres cifras nunca llegaron a la base. Sólo las guardaba
 * el endpoint suelto `/api/analyze-style`, de 2 créditos.
 *
 * Lo encontró un censo por CAPACIDAD —qué módulos emiten contadores y cuáles de
 * esos emisores están cableados a lo que se persiste—, no una búsqueda por
 * nombre: el emisor estaba bien y la clave estaba en el catálogo, así que
 * ninguna prueba del emisor ni del catálogo podía verlo. **Un test de unidad no
 * ve una tubería cortada aguas abajo.**
 *
 * ⚠️ POR QUÉ EL RESULTADO ENTERO Y NO LOS CONTADORES SUELTOS: para que el fallo
 * no se pueda repetir en silencio. `conContadoresDelEstilo` exige el
 * `ResultadoDelEstilo` completo, así que volver a quedarse sólo con la lista de
 * problemas **no compila** — es el estado ilegal hecho irrepresentable, en vez
 * de un comentario pidiendo que nadie lo haga.
 *
 * ⚠️ AUSENTE Y CERO NO SIGNIFICAN LO MISMO, y aquí la distinción es la noticia:
 * si el estilo no se pudo mirar, las tres claves quedan **ausentes** —la etapa no
 * corrió—; si se miró, van las tres, **incluido el cero**, que es justo lo que
 * dice «se miró y no se descartó nada».
 */

/** Los tres del estilo, o nada si no se llegó a mirar. */
export function contadoresDelEstilo(estilo: ResultadoDelEstilo): PipelineCounters {
  return estilo.estado === 'mirado' ? estilo.contadores : {};
}

/** Los problemas que se publican. La lista vacía de un estilo no mirado no es
 *  «documento limpio»: el análisis sale marcado como incompleto por su caída. */
export function problemasDelEstilo(estilo: ResultadoDelEstilo): StyleProblem[] {
  return estilo.estado === 'mirado' ? estilo.problemas : [];
}

/**
 * Funde los contadores del estilo en el análisis que se va a guardar.
 *
 * Se aplica al FINAL, sobre el objeto que recibe `saveAnalysisResult`, porque es
 * ahí donde se comprueba —y donde falló—. No suma nada si no hay nada: un
 * `pipeline_counters` de `{}` diría «se contó y salió vacío» donde la verdad es
 * que no había contadores.
 */
export function conContadoresDelEstilo<T extends { pipelineCounters?: PipelineCounters }>(
  analisis: T,
  estilo: ResultadoDelEstilo,
): T {
  const fundidos = mergeCounters(analisis.pipelineCounters, contadoresDelEstilo(estilo));
  if (Object.keys(fundidos).length === 0) return analisis;
  return { ...analisis, pipelineCounters: fundidos };
}
