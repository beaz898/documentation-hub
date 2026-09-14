import { NextResponse } from 'next/server';
import type { ResolucionDeOrg } from '@/lib/org';

/**
 * LA RESPUESTA HTTP DE UNA ORGANIZACIÓN NO RESUELTA — 14/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUÉ ESTO ES UNA FUNCIÓN Y NO UNA LÍNEA EN CADA ENDPOINT: porque era una
 * línea en cada endpoint. El 14/09/2026 había **64 apariciones de la misma
 * frase en 52 ficheros**, todas con 403, y el día que hizo falta cambiarlas
 * hubo que cambiarlas una a una. Un criterio se implementa UNA VEZ y quien lo
 * necesita PREGUNTA.
 *
 * ⚠️ Y EL CÓDIGO IMPORTA MÁS QUE EL TEXTO. Un 403 le dice al cliente «no tienes
 * derecho, no insistas»; un 503 le dice «vuelve a intentarlo». Con los dos
 * motivos aplastados en 403, ningún cliente —ni el navegador, ni un reintento
 * futuro, ni quien lea los registros— podía distinguir a un usuario sin
 * organización de la base de datos caída. El texto engañaba a una persona; el
 * código engañaba a todo lo demás.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type OrgNoResuelta = Extract<ResolucionDeOrg, { resuelta: false }>;

/** Lo que se le dice al usuario, por motivo. Dos frases, y ninguna afirma lo
 *  que no se sabe: la de `indisponible` NO habla de su pertenencia. */
const MENSAJES: Record<OrgNoResuelta['motivo'], string> = {
  sin_organizacion:
    'No perteneces a ninguna organización. Contacta con el administrador.',
  indisponible:
    'No se ha podido comprobar tu organización ahora mismo. Es un problema temporal: vuelve a intentarlo en unos segundos.',
};

const CODIGOS: Record<OrgNoResuelta['motivo'], number> = {
  sin_organizacion: 403,
  indisponible:     503,
};

export function respuestaDeOrgNoResuelta(r: OrgNoResuelta): NextResponse {
  const status = CODIGOS[r.motivo];
  const cuerpo = {
    error: MENSAJES[r.motivo],
    // ⚠️ EL MOTIVO VIAJA EN EL CUERPO, no sólo en el código. Un cliente que
    // quiera reaccionar distinto no tiene que adivinar leyendo el texto, que es
    // justo lo que hace que un mensaje no se pueda cambiar nunca más.
    motivo: r.motivo,
  };

  // `Retry-After` es la mitad accionable del 503: sin ella, «vuelve a
  // intentarlo» es una sugerencia que nadie automatiza.
  const cabeceras = r.motivo === 'indisponible' ? { 'Retry-After': '5' } : undefined;

  return NextResponse.json(cuerpo, { status, ...(cabeceras ? { headers: cabeceras } : {}) });
}
