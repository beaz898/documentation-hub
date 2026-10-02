import type { ComprobadorDeLado } from './coincidencia-de-cita';
import type { DescarteDeCita, DiscardedFindings, DocumentJudgment } from './types';

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

// ═══════════════════════════════════════════════════════════════════════════
// B.313 — SE GUARDA LO QUE SE DESCARTA (02/10/2026)
// ═══════════════════════════════════════════════════════════════════════════
//
// «Una puerta que descarta tiene que guardar lo que descartó» (protocolo). Hasta
// hoy, de un hallazgo descartado por cita no verificable quedaban un contador y
// los primeros 200 caracteres en un log que caduca. Su lector es
// `SQL_B313_citas_descartadas.sql`; ninguna pantalla lo pinta. La decisión, con
// su fecha de revisión, en B.313.

/** ⚠️ TOPE DECLARADO (arquitecto, 02/10): lo más visto en una pareja son 4. Los
 *  que no caben se cuentan en `descartesPorCitaOmitidos`, y que esa cuenta no
 *  sea cero es un hallazgo. */
export const TOPE_DE_DESCARTES_POR_PAREJA = 10;

/** B.318: las citas que antes del puesto 1 habrían pasado por cabeza y cola y
 *  ya no pasan. Por CITA (por lado que falló), no por hallazgo, y sin tope. */
export const CITA_SOLO_POR_CABEZA_Y_COLA = 'frontera.cita_solo_por_cabeza_y_cola';

/** Lo que se lleva de una pareja: anota cada descarte y devuelve la línea de log
 *  que ya se escribía (`diagnosticoDelDescarte`). Ninguna decisión pasa por
 *  aquí: el descarte ya está decidido cuando se anota. */
export function registroDeDescartes() {
  const guardados: DescarteDeCita[] = [];
  let omitidos = 0;
  let soloPorCabezaYCola = 0;
  return {
    descartar(
      lados: { nuevo: ComprobadorDeLado; existente: ComprobadorDeLado },
      d: { tipo: DescarteDeCita['tipo']; hash: string; tema: string; citas: { nuevo: string | undefined; existente: string | undefined }; fallo: DescarteDeCita['ladoFallido'] },
    ): string {
      for (const lado of ['nuevo', 'existente'] as const) {
        const fallo = d.fallo === 'ambos' || d.fallo === lado;
        if (fallo && lados[lado].datos(d.citas[lado], false).paso === 'cabeza_y_cola') soloPorCabezaYCola++;
      }
      if (guardados.length < TOPE_DE_DESCARTES_POR_PAREJA) {
        const ladoDe = (lado: 'nuevo' | 'existente') => {
          const verificada = d.fallo !== 'ambos' && d.fallo !== lado;
          return { verificada, ...lados[lado].datos(d.citas[lado], verificada) };
        };
        guardados.push({
          hash: d.hash, tema: d.tema, tipo: d.tipo,
          citaNuevo: d.citas.nuevo ?? '', citaExistente: d.citas.existente ?? '',
          ladoFallido: d.fallo, nuevo: ladoDe('nuevo'), existente: ladoDe('existente'),
        });
      } else {
        omitidos++;
      }
      return diagnosticoDelDescarte(lados, d.citas, d.fallo);
    },
    /** El contador de B.318, sumado a los de la pareja. */
    contar(discarded: DiscardedFindings): void {
      if (soloPorCabezaYCola > 0) discarded[CITA_SOLO_POR_CABEZA_Y_COLA] = (discarded[CITA_SOLO_POR_CABEZA_Y_COLA] ?? 0) + soloPorCabezaYCola;
    },
    /** Lo que va al juicio: nada si no hubo descartes. */
    resultado(): Pick<DocumentJudgment, 'descartesPorCita' | 'descartesPorCitaOmitidos'> {
      return {
        ...(guardados.length > 0 ? { descartesPorCita: guardados } : {}),
        ...(omitidos > 0 ? { descartesPorCitaOmitidos: omitidos } : {}),
      };
    },
  };
}
