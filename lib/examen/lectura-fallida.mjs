/**
 * EL CRUDO DE UNA LECTURA DE FRAGMENTOS QUE FALLÓ (27/09/2026).
 *
 * ⚠️ POR QUÉ EXISTE: la primera tanda (27/09) dio 45 veces «HTTP 404 pidiendo
 * fragmentos» y no dejó el MOTIVO en ningún sitio — el ejecutor tiraba el
 * cuerpo de la respuesta. Hizo falta una llamada aparte para saber que era
 * `DEPLOYMENT_NOT_FOUND` de Vercel y no nuestro 404 de «documentos sin
 * resolver». Una tanda que muere sin dejar el motivo es lo mismo que el
 * análisis que se agota sin rastro.
 *
 * Así que el cuerpo se guarda ENTERO en el crudo y su motivo sube al informe.
 * Batería en `lectura-fallida.test.mjs`.
 */

/** Tope del motivo que se imprime en el informe. El crudo guarda el cuerpo entero. */
const MOTIVO_MAXIMO = 160;

/**
 * Una línea legible con el motivo: el `error` y los `problemas` de nuestro
 * endpoint si el cuerpo es JSON, o el texto plano (el de la plataforma) si no.
 */
export function motivoDelCuerpo(cuerpo) {
  let motivo;
  if (cuerpo && typeof cuerpo === 'object') {
    motivo = [cuerpo.error, ...(Array.isArray(cuerpo.problemas) ? cuerpo.problemas : [])].filter(Boolean).join(' · ');
    if (!motivo) motivo = JSON.stringify(cuerpo);
  } else {
    motivo = String(cuerpo ?? '');
  }
  motivo = motivo.replace(/\s+/g, ' ').trim();
  if (!motivo) return 'cuerpo vacío';
  return motivo.length <= MOTIVO_MAXIMO ? motivo : `${motivo.slice(0, MOTIVO_MAXIMO)}…`;
}

/** El crudo que se escribe como `<caso>_pasada<n>.json` cuando falla la lectura. */
export function crudoDeLecturaFallida({ casoId, pasada, http, cuerpo, renovaciones }) {
  return {
    casoId,
    pasada,
    fase: 'fragmentos',
    veredicto: 'LECTURA_FALLIDA',
    http,
    cuando: new Date().toISOString(),
    motivo: motivoDelCuerpo(cuerpo),
    renovacionesDeCredencial: renovaciones ?? [],
    cuerpo,
  };
}
