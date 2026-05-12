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

const SETUP_RETRIES = 3;
const SETUP_RETRY_DELAY_MS = 1000;

async function tryOrgSetup(token: string): Promise<void> {
  const res = await fetch('/api/org/setup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
}

export function useAuth() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [orgSetupError, setOrgSetupError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }

      // Retry org/setup up to SETUP_RETRIES times before allowing the app to render.
      // setSession is intentionally called AFTER this loop so the existing loading
      // spinner covers the setup time — the user never sees a partially-working UI.
      let lastError = '';
      for (let attempt = 1; attempt <= SETUP_RETRIES; attempt++) {
        try {
          await tryOrgSetup(s.access_token);
          lastError = '';
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          console.warn(`[useAuth] org/setup attempt ${attempt}/${SETUP_RETRIES} failed:`, lastError);
          if (attempt < SETUP_RETRIES) {
            await new Promise(r => setTimeout(r, SETUP_RETRY_DELAY_MS));
          }
        }
      }

      if (lastError) {
        console.error('[useAuth] org/setup failed permanently:', lastError);
        setOrgSetupError(
          'No se pudo configurar tu cuenta. Por favor, recarga la página o contacta con soporte.'
        );
      }

      // Unblock the UI — either to show the app (success) or the error screen (failure).
      setSession(sessionFromSupabase(s));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) {
        router.replace('/login');
        return;
      }
      // Update session on token refresh or any other auth state change.
      // Do NOT re-run org/setup here — it already ran on initial load.
      setSession(sessionFromSupabase(s));
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return { session, supabase, handleLogout, orgSetupError };
}
