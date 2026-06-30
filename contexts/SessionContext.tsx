'use client';

import { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/chat/useAuth';
import type { SessionContextValue } from './types';

/**
 * SessionContext formalises the existing useAuth hook as a single shared
 * source of session state for the whole authenticated area.
 *
 * Design note: the provider does NOT reimplement auth. It calls the existing
 * useAuth (session retrieval, org/setup retries, auth-state subscription,
 * logout) and re-exposes its result through context, so the delicate auth
 * logic keeps living in exactly one place.
 */
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { session, orgSetupError, handleLogout } = useAuth();

  const value: SessionContextValue = {
    session,
    orgSetupError,
    logout: handleLogout,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Read the current session from context.
 * Throws if used outside <SessionProvider>, which surfaces wiring mistakes
 * during development instead of silently returning null.
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
