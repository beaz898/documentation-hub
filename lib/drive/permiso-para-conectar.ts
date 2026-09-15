/**
 * ¿SE PUEDE EMPEZAR UN FLUJO DE CONEXIÓN? — B.232, 15/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ CIERRA. `drive_connections` tiene `UNIQUE (org_id)` y el callback hace
 * `upsert` por esa columna, así que **conectar una cuenta distinta SOBRESCRIBE
 * la que había, sin desconectar y sin avisar**. El daño no se ve en ese momento:
 * llega en la sincronización siguiente, que lista la cuenta nueva, no encuentra
 * ni uno de los documentos viejos y **los borra todos** — sin tope y sin
 * preguntar, porque el `folder_id` sigue siendo `'root'` y la guarda del cambio
 * de carpeta es ciega a un cambio de CUENTA.
 *
 * ⚠️ Y NO HACÍA FALTA TECLEAR NINGUNA URL PARA LLEGAR. La barra lateral sólo
 * pinta los botones de conectar cuando cree que no hay conexión, y ese estado
 * **arranca en `false` y sólo se corrige si la llamada de estado responde**. Un
 * timeout de los ya fichados —`resolveOrg` devolviendo `indisponible`, 503— deja
 * los botones pintados con la conexión viva. Un clic, y la conexión se pisa.
 *
 * La guarda va EN EL SERVIDOR, y por eso cierra las tres puertas a la vez: el
 * botón fantasma, la URL escrita a mano y el botón de atrás del navegador.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type PermisoParaConectar =
  | { puede: true }
  /** Ya hay una cuenta conectada. Se dice CUÁL, porque «ya hay una conexión» sin
   *  nombre no le dice al usuario qué tiene que ir a desconectar. */
  | { puede: false; motivo: 'ya_conectado'; email: string | null; provider: string }
  /** ⚠️ NO SE PUDO COMPROBAR, Y ESO NO ES «NO HAY». Esta rama es la razón de que
   *  esta función exista en vez de un `if` en la ruta.
   *
   *  Si la consulta falla y se leyera como «no hay conexión», la guarda dejaría
   *  pasar exactamente en el momento en que la base va mal — que es el momento en
   *  que el botón fantasma aparece. Estaría reproduciendo el agujero que viene a
   *  cerrar, y de la misma forma: **un fallo leído como un hecho**. Es la tercera
   *  vez esta semana con esa forma (`resolveOrg` devolviendo el mismo `null` para
   *  dos cosas; la barra lateral leyendo «no lo sé» como «no conectado»).
   *
   *  Falla CERRADA: si no se sabe, no se conecta. El coste es molestar a quien
   *  quería conectar mientras la base va mal; el coste del otro lado es el corpus. */
  | { puede: false; motivo: 'no_se_pudo_comprobar' };

/** Lo mínimo de la lectura de `drive_connections`: deliberadamente NO la fila
 *  entera, para que nadie acabe decidiendo esto con otra columna. */
export interface LecturaDeConexion {
  data: { provider?: unknown; email?: unknown } | null;
  error: { message?: string } | null;
}

export function decidirSiSePuedeConectar(lectura: LecturaDeConexion): PermisoParaConectar {
  // ⚠️ EL CÓDIGO DE «CERO FILAS» NO ES UN ERROR AQUÍ. `.maybeSingle()` devuelve
  // `data: null, error: null` cuando no hay fila, que es justo el caso bueno.
  // Cualquier `error` de verdad significa que no se pudo mirar.
  if (lectura.error) return { puede: false, motivo: 'no_se_pudo_comprobar' };
  if (!lectura.data) return { puede: true };

  const provider = typeof lectura.data.provider === 'string' ? lectura.data.provider : 'desconocido';
  const email = typeof lectura.data.email === 'string' && lectura.data.email.length > 0
    ? lectura.data.email
    : null;

  return { puede: false, motivo: 'ya_conectado', email, provider };
}

const NOMBRES: Record<string, string> = {
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
};

/**
 * ⚠️ EL MENSAJE MANDA A DESCONECTAR, Y ESO NO ES PASARLE EL MUERTO AL USUARIO:
 * es mandarlo por el único camino que ya le dice lo que va a perder. El diálogo
 * de desconectar avisa, literal, de que «se eliminarán todos los documentos
 * sincronizados». Conectar encima no avisaba de nada y borraba igual, un rato
 * después y sin relacionarlo con el clic.
 */
export function mensajeDeConexionExistente(email: string | null, provider: string): string {
  const nombre = NOMBRES[provider] ?? 'otro proveedor';
  const cuenta = email ? ` (${email})` : '';
  return (
    `Ya tienes ${nombre} conectado${cuenta}. Solo puede haber una cuenta conectada a la vez, ` +
    `así que conectar otra sustituiría ésta y la próxima sincronización borraría los documentos ` +
    `que trajo. Si quieres cambiar de cuenta, desconecta primero desde el panel de documentos.`
  );
}
