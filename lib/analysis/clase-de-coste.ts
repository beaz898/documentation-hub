/**
 * ¿DECLARÓ ESTE ANÁLISIS SU CLASE DE COSTE? — 15/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA, Y NO ES EL PRECIO. Hasta hoy el worker hacía
 * `const cost = estimatedCost ?? 'heavy'`, y eso hacía DOS cosas a la vez:
 *
 *   1. resolvía en silencio una pregunta que no puede contestar —«¿cuánto
 *      trabajó esto?»— hacia el lado más caro;
 *   2. y **borraba la prueba de haberlo hecho**: el registro imprimía
 *      «coste heavy» EXACTAMENTE IGUAL para un exhaustivo que de verdad fue
 *      pesado y para uno que terminó sin clasificar.
 *
 * ⚠️ LA SEGUNDA ES LA QUE SE ARREGLA HOY, Y EL PRECIO NO CAMBIA. `heavy` sigue
 * siendo el valor por defecto, se sigue sin reembolsar y nadie paga distinto.
 * Lo que cambia es que **queda registrado como lo que es**: sin clasificar.
 *
 * Es la regla del cero de la casa aplicada aquí: hoy el sistema **no puede
 * demostrar cuántas veces ha cobrado el máximo sin haber clasificado nada**. Con
 * el contador, dentro de un tiempo se mira la cifra y se decide el precio con
 * ella delante — si es raro, da igual hacia dónde caiga; si es frecuente, el
 * dato dice hacia dónde. Decidirlo ahora sería elegir entre cobrar de más a quien
 * acertó y cobrar de menos a un camino caro, sin saber cuál de los dos ocurre.
 *
 * ⚠️ Y VIVE AQUÍ, EN UNA SOLA FUNCIÓN, PORQUE SI NO SERÍAN DOS: el defecto lo
 * aplica el worker y el contador lo emite quien guarda el análisis. Dos sitios
 * decidiendo «¿está clasificado?» por su cuenta se separan el día que aparezca
 * una clase nueva, y los dos seguirían pareciendo correctos.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type ClaseDeCoste = 'light' | 'medium' | 'heavy';

const CLASES: readonly ClaseDeCoste[] = ['light', 'medium', 'heavy'];

/**
 * ⚠️ EL DEFECTO NO CAMBIA HOY, y está aquí con nombre para que se vea que es una
 * DECISIÓN y no el resultado de un `??` perdido en una línea. El día que la cifra
 * del contador diga algo, éste es el sitio donde se cambia.
 */
export const CLASE_POR_DEFECTO: ClaseDeCoste = 'heavy';

/**
 * La clase que el análisis DECLARÓ, o `null` si no declaró ninguna.
 *
 * ⚠️ Devuelve `null` también para un valor que no sea una clase conocida, y eso
 * no es celo: un `estimatedCost` con una cadena inventada es exactamente igual de
 * «sin clasificar» que uno ausente, y tratarlo como clase válida lo metería en
 * `REFUND_BY_COST`, que devolvería `undefined` y acabaría en cero por otro
 * camino — sin que nadie contara nada.
 */
export function claseDeclarada(valor: unknown): ClaseDeCoste | null {
  return typeof valor === 'string' && (CLASES as readonly string[]).includes(valor)
    ? (valor as ClaseDeCoste)
    : null;
}

/** Lo que de verdad se cobra: la declarada, o el defecto. */
export function claseParaCobrar(valor: unknown): ClaseDeCoste {
  return claseDeclarada(valor) ?? CLASE_POR_DEFECTO;
}
