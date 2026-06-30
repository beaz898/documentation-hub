'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from './SessionContext';
import type { CreditsInfo } from '@/hooks/chat/types';
import type { AccountContextValue, AccountFeatures } from './types';

/**
 * AccountContext holds plan + credits + plan features, all derived from a
 * single /api/usage/summary response.
 *
 * Key design requirements (agreed during planning):
 *  - Plan and credits live together (same source of truth, same fetch).
 *  - Credits are a LIVE value: `refresh` must be called after every
 *    credit-consuming operation and on return from Stripe.
 *  - Failure is explicit (`error`), never a silent catch, so a transient
 *    network blip cannot quietly degrade every screen at once.
 */
const AccountContext = createContext<AccountContextValue | null>(null);

interface SummaryResponse {
  creditsRemaining: number;
  creditsExtra: number;
  plan: string;
  subscriptionStatus?: string;
  gracePeriodEndsAt?: string | null;
  hasAgent: boolean;
  hasAnalyticsPanel: boolean;
  hasDrive?: boolean;
}

function toCredits(data: SummaryResponse): CreditsInfo {
  return {
    remaining: data.creditsRemaining + data.creditsExtra,
    extra: data.creditsExtra,
    plan: data.plan,
    subscriptionStatus: data.subscriptionStatus || 'active',
    gracePeriodEndsAt: data.gracePeriodEndsAt || null,
  };
}

function toFeatures(data: SummaryResponse): AccountFeatures {
  return {
    hasAgent: data.hasAgent,
    hasAnalyticsPanel: data.hasAnalyticsPanel,
    hasDrive: data.hasDrive,
    plan: data.plan,
  };
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [features, setFeatures] = useState<AccountFeatures | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const res = await fetch('/api/usage/summary', { credentials: 'include' });
      if (!res.ok) {
        setError(`No se pudo cargar la información de tu cuenta (HTTP ${res.status}).`);
        return;
      }
      const data = (await res.json()) as SummaryResponse;
      setCredits(toCredits(data));
      setFeatures(toFeatures(data));
    } catch {
      setError('No se pudo cargar la información de tu cuenta. Comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Initial load once a session is available.
  useEffect(() => {
    if (session) {
      void refresh();
    }
  }, [session, refresh]);

  const value: AccountContextValue = {
    credits,
    features,
    loading,
    error,
    refresh,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

/**
 * Read account data (plan, credits, features) from context.
 * Throws if used outside <AccountProvider>.
 */
export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (ctx === null) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return ctx;
}
