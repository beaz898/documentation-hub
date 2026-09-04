import { generateContentHash } from '@/lib/analysis/hash-check';
import { stripSegmentationMarkers } from '@/lib/chunking';

/**
 * ¿PUEDE ESTE REANÁLISIS USAR LA ESTRUCTURA DEL FICHERO ORIGINAL? (B.175)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL PROBLEMA. El reanálisis del modal de mejora manda TEXTO, no fichero. Con
 * texto no se llama a `extractSegments`, así que no hay `cells` — y sin celdas
 * `emparejarTablas` recibe cero grupos y el diff no emite nada. Medido: el mismo
 * documento en el mismo modo exhaustivo daba **15 discrepancias por la subida y
 * 4 por el modal**, y las 4 eran todas del juez leyendo texto aplanado.
 * Lo grave no era el número: era que **nadie lo declaraba**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LA SALIDA. El modal SÍ manda la ruta del fichero. Así que se extraen los
 * segmentos del original y se usan… con una condición.
 *
 * ⚠️ LA CONDICIÓN ES EL ARREGLO, NO UN ADORNO: solo si el texto que se va a
 * analizar es EL MISMO que el del fichero. Si el usuario editó, los segmentos
 * describen el original y el texto describe la edición — el diff emitiría
 * diferencias sobre celdas QUE EL USUARIO YA CORRIGIÓ. Eso no es medio arreglo:
 * es un informe falso con sello de estructura, que es peor que no emitir nada.
 *
 * ⚠️ Y SE COMPARA POR EL MISMO HASH QUE USA TODO LO DEMÁS. No por igualdad de
 * cadenas: `generateContentHash` normaliza saltos, tabuladores, espacios
 * repetidos y mayúsculas, así que abrir el modal y guardar sin tocar nada —que
 * puede reescribir un salto de línea— NO cuenta como edición. Reimplementar aquí
 * una comparación propia sería una segunda definición de «el mismo texto».
 */
export function puedeUsarLaEstructura(
  textoAAnalizar: string,
  textoDelFichero: string,
): boolean {
  if (typeof textoAAnalizar !== 'string' || typeof textoDelFichero !== 'string') return false;
  // ⚠️ SE RECORTA ANTES DE MEDIR, y lo cazó una mutación que sobrevivió: con
  // `length === 0` a secas, `'   '` pasa la guarda y luego normaliza a vacío —
  // dos textos en blanco tendrían el mismo hash y esto diría que SÍ se puede
  // usar la estructura de un fichero que no dio texto.
  if (textoAAnalizar.trim().length === 0 || textoDelFichero.trim().length === 0) return false;
  return generateContentHash(stripSegmentationMarkers(textoAAnalizar))
      === generateContentHash(stripSegmentationMarkers(textoDelFichero));
}
