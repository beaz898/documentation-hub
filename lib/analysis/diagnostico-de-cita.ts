import type { ComprobadorDeLado } from './coincidencia-de-cita';

/**
 * LO QUE SE ESCRIBE DE UNA CITA, PASE O NO (B.299, B.312, B.313).
 *
 * Partido de `coincidencia-de-cita.ts` el 02/10/2026, que llegaba al tope de 400
 * líneas: allí se decide si una cita está; aquí se cuenta lo que pasó con ella.
 * Ninguna función de este fichero decide nada.
 */

// ═══════════════════════════════════════════════════════════════════════════
// B.312 — EL DETECTOR DE CITAS CRUZADAS (02/10/2026). OBSERVA, NO CORRIGE.
// ═══════════════════════════════════════════════════════════════════════════
//
// En las sondas del 01/10 el juez puso las citas de los solapamientos en el
// campo del otro documento 5 veces de 5. El arreglo es del prompt (cada campo
// nombra su lado, el nuevo primero) y de la frontera, que lo traduce. Esto sólo
// lo VIGILA: si una cita no está en su lado y sí en el otro, el log lo dice.
// El hallazgo se descarta igual — darlo por bueno dándole la vuelta sería
// adivinar qué quiso decir el juez. Su coste es una comprobación más, y sólo
// en las citas que ya fallaron.

/** El diagnóstico de un descarte: longitud, paso y pajar de cada lado que
 *  falló y, si su cita SÍ está en el otro lado, «cruzada». */
export function diagnosticoDelDescarte(
  lados: { nuevo: ComprobadorDeLado; existente: ComprobadorDeLado },
  citas: { nuevo: string | undefined; existente: string | undefined },
  fallo: 'nuevo' | 'existente' | 'ambos',
): string {
  const delLado = (lado: 'nuevo' | 'existente'): string => {
    const otro = lado === 'nuevo' ? 'existente' : 'nuevo';
    const cruzada = lados[otro].comprobar(citas[lado]) !== null;
    return `${lado}: ${lados[lado].describir(citas[lado])}${cruzada ? `, cruzada: la cita del ${lado} está en el ${otro}` : ''}`;
  };
  return fallo === 'ambos' ? `${delLado('nuevo')} · ${delLado('existente')}` : delLado(fallo);
}

/** B.313 (02/10/2026): el registro de una cita que PASÓ, por lado. Sólo
 *  números y nombres de paso, como el de los descartes: es el denominador que
 *  le faltaba a «el juez deja de ser literal cuando la cita se alarga». */
export function diagnosticoDelAcierto(
  lados: { nuevo: ComprobadorDeLado; existente: ComprobadorDeLado },
  citas: { nuevo: string | undefined; existente: string | undefined },
): string {
  return `nuevo: ${lados.nuevo.describirAcierto(citas.nuevo)} · existente: ${lados.existente.describirAcierto(citas.existente)}`;
}
