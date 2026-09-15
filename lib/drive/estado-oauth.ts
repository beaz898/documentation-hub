import { firmarCarga, verificarCarga } from '@/lib/analysis/firma';

/**
 * EL `state` DE OAUTH, FIRMADO Y ATADO A SU SESIÓN — B.227, 15/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA, Y ERA EL MÁS GRAVE DE LOS TRES QUE DESTAPÓ EL CENSO. Hasta hoy
 * `GET /api/drive/callback` **no tenía autenticación ninguna** —ni sesión, ni
 * `resolverOrg`— y hacía esto:
 *
 *     state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
 *     await supabase.from('drive_connections').upsert({
 *       org_id: state.orgId, … }, { onConflict: 'org_id' });
 *
 * El `state` viajaba como **base64 de un JSON, sin firma**: cualquiera compone
 * uno. Con el `orgId` de otra organización, el atacante completaba el flujo con
 * SU cuenta de Drive y el `upsert` **sobrescribía** la conexión de esa
 * organización con sus tokens.
 *
 * ⚠️ Y NO ERA UNA COMPROBACIÓN QUE FALTARA POR DISEÑAR: EL `state` YA LLEVABA UN
 * CAMPO `token` CON LA SESIÓN, EL CALLBACK LO DECLARABA EN SU TIPO, Y NO LO LEÍA
 * EN NINGUNA LÍNEA. Existía y nadie lo conectó — el patrón de la semana en el
 * sitio donde más duele.
 *
 * ⚠️ POR QUÉ SE FIRMA EN VEZ DE LEER AQUEL TOKEN, que era la otra salida: porque
 * leerlo habría dejado **el token de sesión viajando en la barra de
 * direcciones** —historial, registros del proveedor, cualquier `Referer`— y eso
 * es un problema por sí solo, no un detalle de implementación. La firma no
 * necesita que viaje ninguna credencial: sólo demuestra que **este `state` lo
 * emitimos nosotros**, para esta organización, hace poco.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ⚠️ QUINCE MINUTOS, Y NO DOS HORAS COMO LA REFERENCIA DE SUBIDA. No es el mismo
 * problema: una subida espera a que una persona revise un documento —puede tardar
 * una tarde—, y esto es un ida y vuelta a la pantalla de Google, que son segundos.
 * Una ventana larga aquí sólo alarga el tiempo en que un `state` capturado sirve.
 */
export const VIDA_DEL_ESTADO_MS = 15 * 60 * 1000;

export type MotivoDeEstado =
  /** No llegó ningún `state`. */
  | 'ausente'
  /** No es un `state` de los nuestros: no descodifica o le faltan campos. */
  | 'malformado'
  /** La firma no casa: o lo compuso otro, o se manipuló por el camino. */
  | 'firma'
  /** Lo emitimos nosotros, pero hace demasiado. */
  | 'caducado'
  /** ⚠️ Lo emitimos nosotros y está vivo, pero **para OTRA sesión**. Es la
   *  cláusula que mata el reintento de un `state` capturado. */
  | 'ajeno';

export interface DatosDelEstado {
  userId: string;
  orgId: string;
  provider: string;
}

export type EstadoVerificado =
  | { ok: true; datos: DatosDelEstado }
  | { ok: false; motivo: MotivoDeEstado };

interface CargaFirmada extends DatosDelEstado {
  /** Cuándo se emitió, en milisegundos. */
  t: number;
}

export function firmarEstadoDeOAuth(
  datos: DatosDelEstado,
  secreto: string,
  ahora: number = Date.now(),
): string {
  const carga: CargaFirmada = { ...datos, t: ahora };
  return firmarCarga(carga, secreto);
}

/**
 * ⚠️ EL `userId` DE LA SESIÓN SE PIDE, NO SE DEDUCE DEL `state`. Si se leyera del
 * propio `state` la comprobación sería circular: el documento se estaría
 * verificando a sí mismo. Quien llama tiene que haber autenticado ANTES.
 */
export function verificarEstadoDeOAuth(
  bruto: unknown,
  sesion: { userId: string },
  secreto: string,
  ahora: number = Date.now(),
): EstadoVerificado {
  if (typeof bruto !== 'string' || bruto.length === 0) {
    return { ok: false, motivo: 'ausente' };
  }

  const carga = verificarCarga(bruto, secreto);
  if (carga === null) return { ok: false, motivo: 'firma' };

  if (typeof carga !== 'object' || carga === null) {
    return { ok: false, motivo: 'malformado' };
  }
  const c = carga as Partial<CargaFirmada>;
  if (
    typeof c.userId !== 'string' || c.userId.length === 0 ||
    typeof c.orgId !== 'string' || c.orgId.length === 0 ||
    typeof c.provider !== 'string' || c.provider.length === 0 ||
    typeof c.t !== 'number' || !Number.isFinite(c.t)
  ) {
    return { ok: false, motivo: 'malformado' };
  }

  if (ahora - c.t > VIDA_DEL_ESTADO_MS || c.t > ahora + 60_000) {
    // La segunda mitad —emitido «en el futuro»— cubre un reloj desajustado y
    // un `t` manipulado si algún día se filtrara el secreto.
    return { ok: false, motivo: 'caducado' };
  }

  if (c.userId !== sesion.userId) return { ok: false, motivo: 'ajeno' };

  return { ok: true, datos: { userId: c.userId, orgId: c.orgId, provider: c.provider } };
}

/**
 * Qué se le dice al usuario, por motivo, EN UN SOLO SITIO — igual que la
 * referencia de subida. Y va como código de la redirección, no como texto: esta
 * respuesta es un `redirect` a `/chat`, no un JSON.
 *
 * El `switch` es exhaustivo a propósito: un motivo nuevo sin código NO COMPILA.
 */
export function codigoDeEstadoRechazado(motivo: MotivoDeEstado): string {
  switch (motivo) {
    case 'ausente':    return 'missing_params';
    case 'malformado': return 'invalid_state';
    case 'firma':      return 'invalid_state';
    case 'caducado':   return 'state_expired';
    case 'ajeno':      return 'state_not_yours';
  }
}
