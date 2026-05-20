import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

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
 * Obtiene el usuario autenticado del request.
 *
 * Históricamente esta función aceptaba tanto cookies como
 * Authorization: Bearer. Tras la migración completa de auth, solo
 * se usan cookies. El nombre se mantiene para no romper imports
 * en los endpoints; conceptualmente equivale a getAuthenticatedUser.
 *
 * @param _req Solo se mantiene por compatibilidad de firma. No se usa.
 */
export async function getAuthenticatedUserHybrid(
  _req: NextRequest
): Promise<User | null> {
  return getAuthenticatedUser();
}
