'use client';

import { useState, useCallback, useEffect } from 'react';
import type { UserPreferences } from '@/lib/agent/types';
import type { SessionInfo } from '@/hooks/chat/types';

export interface UseUserPreferencesResult {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserPreferences(session: SessionInfo | null): UseUserPreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/preferences', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = await res.json();
      setPreferences(data.preferences ?? {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando preferencias');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    if (!session) return;
    setError(null);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = await res.json();
      setPreferences(data.preferences ?? {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando preferencias');
    }
  }, [session]);

  return { preferences, isLoading, error, updatePreferences, refresh };
}
