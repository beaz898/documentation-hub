'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { SessionInfo } from './types';

function sessionFromSupabase(s: { access_token: string; user: { email?: string; id: string } }): SessionInfo {
  return {
    access_token: s.access_token,
    user: { email: s.user.email, id: s.user.id },
  };
}

export function useAuth() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession(sessionFromSupabase(s));

      // Ensure user has an organization (creates one if needed, idempotent)
      try {
        await fetch('/api/org/setup', {
          method: 'POST',
          headers: { Authorization: `Bearer ${s.access_token}` },
        });
      } catch {
        // Non-blocking: if org/setup fails, endpoints return 403
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) {
        router.replace('/login');
        return;
      }
      // Actualizar session con el nuevo token cada vez que Supabase
      // refresca la sesión (evento TOKEN_REFRESHED) o cualquier otro
      // cambio de estado de autenticación.
      setSession(sessionFromSupabase(s));
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return { session, supabase, handleLogout };
}
