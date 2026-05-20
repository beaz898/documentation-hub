import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';

/**
 * Crea un cliente Supabase server-side que lee las cookies del request actual.
 * Úsalo en Route Handlers y Server Components cuando necesites validar la sesión.
 *
 * Para operaciones administrativas que necesitan service role (bypass de RLS),
 * usa createServiceClient() de lib/supabase.ts.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // En Route Handlers Next.js permite setear cookies; en Server Components
          // fuera del middleware no es posible. El try/catch evita un crash en ese
          // caso — el middleware ya se encarga del refresh en cada request.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // No-op
          }
        },
      },
    }
  );
}

/**
 * Obtiene el usuario autenticado a partir de las cookies del request.
 * Devuelve null si no hay sesión válida o el token es inválido.
 *
 * Usa getUser() (no getSession()) porque getUser() valida el token contra
 * el servidor de Supabase — la única opción segura para autenticación real.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Adaptador de compatibilidad durante la migración de auth.
 *
 * Intenta autenticar al usuario por:
 *   1. Cookies de sesión (método nuevo con @supabase/ssr).
 *   2. Si falla, header Authorization: Bearer (método viejo).
 *
 * Devuelve el usuario autenticado o null si ninguno funciona.
 *
 * Cuando todos los endpoints estén migrados (Paso 5) y el frontend
 * deje de mandar Bearer (Paso 6), esta función se simplificará para
 * solo usar cookies (Paso 7).
 */
export async function getAuthenticatedUserHybrid(
  req: NextRequest
): Promise<User | null> {
  // Método 1: cookies (preferido — orden importa para futuras simplificaciones).
  const userFromCookie = await getAuthenticatedUser();
  if (userFromCookie) return userFromCookie;

  // Método 2: fallback al Bearer header (compatibilidad con frontend viejo).
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return null;

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}
