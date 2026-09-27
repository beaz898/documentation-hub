/**
 * LA SESIÓN DEL EJECUTOR DEL EXAMEN (27/09/2026).
 *
 * `/api/admin/examen` acepta el token de sesión de Supabase por cabecera —la
 * única ruta que lo hace— y el token caduca a la hora. Una tanda puede no caber,
 * así que el ejecutor inicia sesión él mismo y RENUEVA cuando le llega un 401.
 *
 * Inicia sesión exactamente como la pantalla de login (`app/login/page.tsx`,
 * `signInWithPassword`): con el correo y la contraseña del usuario
 * administrador, leídos de `.env.examen.local`, que git ignora (`.env*.local`).
 * La contraseña no se imprime, no se guarda en el crudo y no sale de esta
 * función más que hacia Supabase.
 *
 * ⚠️ LA REGLA DEL ARQUITECTO PARA UN 401 A MITAD DE TANDA: se renueva y se
 * REINTENTA la pasada, y ese reintento NO cuenta como pasada fallida —fue la
 * credencial, no el sistema—. Queda anotado como renovación en el crudo. Si no
 * se puede renovar, SE PARA LA TANDA ENTERA: seguir acumulando 401 no mide nada.
 *
 * Batería en `sesion.test.mjs`, sin red: la llamada y la sesión se inyectan.
 */

/** Error que PARA la tanda. Cualquier otro error se queda en su pasada. */
export class CredencialPerdida extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'CredencialPerdida';
  }
}

/** `CLAVE=valor` por línea; ignora vacías y `#`. Sin dependencias (no dotenv). */
export function leerFicheroDeEntorno(texto) {
  const salida = {};
  for (const linea of texto.split(/\r?\n/)) {
    const l = linea.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i <= 0) continue;
    let valor = l.slice(i + 1).trim();
    if (/^(['"]).*\1$/.test(valor)) valor = valor.slice(1, -1);
    salida[l.slice(0, i).trim()] = valor;
  }
  return salida;
}

/**
 * Una sesión de Supabase por su API de autenticación, la misma que usa el SDK.
 * `renovar()` prueba primero el refresh token y, si falla, vuelve a entrar con
 * contraseña. Si las dos fallan, lanza `CredencialPerdida`.
 */
export function crearSesion({ supabaseUrl, anonKey, correo, contrasena, fetchImpl = fetch }) {
  let acceso = null;
  let refresco = null;

  async function pedir(grant, cuerpo) {
    const res = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=${grant}`, {
      method: 'POST',
      headers: { apikey: anonKey, 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.access_token) {
      // El motivo de Supabase, nunca el cuerpo enviado: ahí va la contraseña.
      return { ok: false, motivo: `HTTP ${res.status} ${json.error_description ?? json.msg ?? json.error ?? ''}`.trim() };
    }
    acceso = json.access_token;
    refresco = json.refresh_token ?? null;
    return { ok: true };
  }

  const entrar = () => pedir('password', { email: correo, password: contrasena });

  return {
    token: () => acceso,
    async iniciar() {
      const r = await entrar();
      if (!r.ok) throw new CredencialPerdida(`no se pudo iniciar sesión como ${correo}: ${r.motivo}`);
    },
    async renovar() {
      if (refresco) {
        const r = await pedir('refresh_token', { refresh_token: refresco });
        if (r.ok) return;
      }
      const r = await entrar();
      if (!r.ok) throw new CredencialPerdida(`no se pudo renovar la sesión de ${correo}: ${r.motivo}`);
    },
  };
}

/**
 * Llama; ante un 401, renueva y reintenta UNA vez. `registro` recibe una
 * entrada por renovación, que el ejecutor escribe en el crudo de la pasada.
 *
 * ⚠️ Un 401 con el token RECIÉN renovado no es caducidad: es que el servidor no
 * acepta a este usuario. Se para, en vez de renovar en bucle.
 */
export async function conRenovacion(llamar, sesion, registro) {
  const r = await llamar(sesion.token());
  if (r.http !== 401) return r;

  await sesion.renovar();   // lanza CredencialPerdida si no puede
  registro.push({
    cuando: new Date().toISOString(),
    motivo: 'HTTP 401 — token de sesión caducado o rechazado',
    resultado: 'renovado y reintentado: NO es un fallo del análisis',
  });

  const r2 = await llamar(sesion.token());
  if (r2.http === 401) {
    throw new CredencialPerdida(
      '401 también con el token recién renovado: no es caducidad, el endpoint no acepta a este usuario. Se para la tanda.',
    );
  }
  return r2;
}
