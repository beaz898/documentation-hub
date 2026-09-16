/**
 * QUÉ PASÓ AL REANALIZAR EL ESTILO, Y QUÉ SE LE DICE AL USUARIO — B.237,
 * puerta 3 (17/09/2026).
 *
 * ⚠️ LO QUE HABÍA: el hook devolvía `[]` ante cualquier respuesta no correcta y
 * NO tocaba la lista, y el modal comparaba longitudes. Así, un 402 sin créditos,
 * un 429 de límite o un fallo del modelo se leían en pantalla como «He
 * reanalizado el estilo. No hay cambios respecto al análisis anterior.» — una
 * frase que afirma haber reanalizado cuando no se hizo. Y antes del commit del
 * servidor, un fallo del modelo llegaba como ÉXITO con lista vacía y la pantalla
 * decía «N problemas resueltos».
 *
 * La regla de la casa (§5.66): un mensaje puede afirmar QUÉ pasó; la causa, sólo
 * si está medida. Aquí la causa la dice el servidor con su código.
 *
 * Lógica pura y no JSX, para que tenga batería.
 */

export type ResultadoDelReanalisisDeEstilo<P> =
  | { estado: 'ok'; problemas: P[] }
  | { estado: 'no_se_pudo_mirar' }
  | { estado: 'sin_creditos' }
  | { estado: 'limite' }
  | { estado: 'texto_insuficiente' }
  /** Cualquier otro fallo, incluida la red: no se sabe qué pasó, y no se dice. */
  | { estado: 'error' };

/** Traduce la respuesta HTTP del servidor a lo que pasó. */
export function clasificarRespuestaDeEstilo(
  status: number,
  cuerpo: unknown,
): { estado: Exclude<ResultadoDelReanalisisDeEstilo<unknown>['estado'], 'ok'> } | { estado: 'ok' } {
  if (status >= 200 && status < 300) return { estado: 'ok' };
  const errorType = typeof cuerpo === 'object' && cuerpo !== null
    ? (cuerpo as { errorType?: unknown }).errorType
    : undefined;
  if (status === 503 && errorType === 'estilo_no_analizado') return { estado: 'no_se_pudo_mirar' };
  if (status === 402) return { estado: 'sin_creditos' };
  if (status === 429) return { estado: 'limite' };
  if (status === 400) return { estado: 'texto_insuficiente' };
  return { estado: 'error' };
}

/**
 * LA FRASE. Sólo `ok` puede decir «he reanalizado»: es el único caso en que se
 * reanalizó. En los demás la lista anterior se conserva, y se dice.
 */
export function mensajeDelReanalisisDeEstilo(
  resultado: ResultadoDelReanalisisDeEstilo<unknown>,
  pendientesAntes: number,
): string {
  switch (resultado.estado) {
    case 'ok': {
      const ahora = resultado.problemas.length;
      const diff = ahora - pendientesAntes;
      if (diff === 0) return 'He reanalizado el estilo. No hay cambios respecto al análisis anterior.';
      if (diff > 0) {
        return `He reanalizado el estilo. ${diff} problema${diff !== 1 ? 's' : ''} nuevo${diff !== 1 ? 's' : ''}, ` +
          `${ahora} pendiente${ahora !== 1 ? 's' : ''} en total.`;
      }
      const resueltos = Math.abs(diff);
      return `He reanalizado el estilo. ${resueltos} problema${resueltos !== 1 ? 's' : ''} resuelto${resueltos !== 1 ? 's' : ''}, ` +
        `${ahora} pendiente${ahora !== 1 ? 's' : ''} en total.`;
    }
    case 'no_se_pudo_mirar':
      return 'No he podido reanalizar el estilo: el análisis ha fallado. No se te ha cobrado y tu lista anterior sigue aquí.';
    case 'sin_creditos':
      return 'No he podido reanalizar el estilo: no quedan créditos en tu plan. Tu lista anterior sigue aquí.';
    case 'limite':
      return 'No he podido reanalizar el estilo: has alcanzado el límite diario de análisis de estilo. Tu lista anterior sigue aquí.';
    case 'texto_insuficiente':
      return 'No he podido reanalizar el estilo: el texto es demasiado corto (mínimo 50 caracteres). No se te ha cobrado.';
    case 'error':
      return 'No he podido reanalizar el estilo por un error. Tu lista anterior sigue aquí.';
  }
}
