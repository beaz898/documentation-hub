/**
 * LA REGLA DE ESTABILIDAD DE FABLE (decidida el 25/09/2026, aplicada el 28/09).
 *
 * `consultas-fable/CONSULTA-RAPIDA_2026-09-25_el-montaje-del-arnes.md:196-197`:
 *   «cada contradicción tiene tres estados posibles: estable-acierto (5/5),
 *   estable-fallo (0/5), inestable (entre 1 y 4). La alarma solo debe saltar
 *   por una estable-acierto que baja a 2/5 o menos. Un 3/5 no es rojo: es
 *   "repetir 5 más antes de decir nada". El número de inestables es una
 *   métrica en sí.»
 *
 * Hasta hoy el marcador juntaba las pasadas: un acierto en UNA contaba, y un
 * 5/5 que caía a 1/5 seguía en PASA.
 *
 * ⚠️ «ERA estable-acierto» lo declara una persona en el esperado
 * (`estabilidadDeBase`), nunca el marcador: «la base se fija … solo después de
 * que una persona la mire. Nunca se congela sola» (misma consulta, `:173`).
 */

export const ESTABLE_ACIERTO = 'estable-acierto';
export const ESTABLE_FALLO = 'estable-fallo';
export const INESTABLE = 'inestable';

/** La alarma: k/n ≤ 2/5. Con cinco pasadas, 2 salta y 3 no. */
export const ALARMA_HASTA = 2;
export const ALARMA_SOBRE = 5;

export const REPETIR = 'repetir 5 más antes de decir nada';

export function estadoDeEstabilidad(k, n) {
  if (k === n) return ESTABLE_ACIERTO;
  if (k === 0) return ESTABLE_FALLO;
  return INESTABLE;
}

const bajaHastaLaAlarma = (k, n) => k * ALARMA_SOBRE <= ALARMA_HASTA * n;

/**
 * `hechas`: las marcas de las pasadas ejecutadas. Devuelve lo que impide el
 * veredicto (`razones`), lo que es rojo (`fallos`) y el detalle por esperado.
 */
export function juzgarEstabilidad(caso, hechas) {
  const n = hechas.length;
  const porEsperado = (caso.debenSalir ?? [])
    .filter(e => e.cuentaParaElUmbral !== false)
    .map(e => {
      const k = hechas.filter(m => m.aciertos.includes(e.id)).length;
      return { id: e.id, k, n, estado: estadoDeEstabilidad(k, n), base: e.estabilidadDeBase ?? null };
    });

  const razones = [];
  const fallos = [];

  for (const p of porEsperado) {
    if (p.base !== ESTABLE_ACIERTO || p.k === n) continue;
    if (bajaHastaLaAlarma(p.k, n)) {
      fallos.push(`ALARMA: ${p.id} era estable-acierto y sale ${p.k}/${n}`);
    } else {
      razones.push(`${p.id} era estable-acierto y sale ${p.k}/${n}: ${REPETIR}`);
    }
  }

  const estables = porEsperado.filter(p => p.estado === ESTABLE_ACIERTO).length;
  const inestables = porEsperado.filter(p => p.estado === INESTABLE).length;
  const minimo = caso.umbralDeAlarma?.minimoDeAciertos;
  if (typeof minimo === 'number' && estables < minimo) {
    if (estables + inestables >= minimo) {
      razones.push(`${estables} estable(s)-acierto y el umbral exige ${minimo}, con ${inestables} inestable(s): ${REPETIR}`);
    } else {
      fallos.push(`${estables} estable(s)-acierto (${n}/${n}) y el umbral exige ${minimo}`);
    }
  }

  return { porEsperado, estables, inestables, razones, fallos };
}
