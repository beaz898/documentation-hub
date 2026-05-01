'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { SessionInfo } from './types';

export function useAuth() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ access_token: s.access_token, user: { email: s.user.email, id: s.user.id } });

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
      if (!s) router.replace('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return { session, supabase, handleLogout };
}
