import type { SessionInfo, CreditsInfo } from '@/hooks/chat/types';
import type { OrgFeatures } from '@/lib/plan-features';

/**
 * Shape exposed by SessionContext.
 * Wraps the existing useAuth logic (session + org/setup + logout) so that
 * the whole authenticated area reads the session from a single place
 * instead of each page calling useAuth on its own.
 */
export interface SessionContextValue {
  session: SessionInfo | null;
  /** Permanent failure of /api/org/setup after retries. Null when healthy. */
  orgSetupError: string | null;
  /** Sign the user out and redirect to /login. */
  logout: () => Promise<void>;
}

/**
 * Account-level data: plan, credits and plan features.
 * Plan and credits live together because they both come from the same
 * /api/usage/summary response. Credits are a LIVE value: `refresh` is called
 * after every credit-consuming operation and on return from Stripe.
 */
export interface AccountData {
  /** Total spendable credits (remaining + extra) and related plan info. */
  credits: CreditsInfo | null;
  /** Plan feature flags (hasAgent, hasAnalyticsPanel, ...). */
  features: AccountFeatures | null;
}

/**
 * Subset of OrgFeatures consumed by the frontend. Mirrors the fields the
 * /api/usage/summary endpoint already returns. `hasDrive` is included for
 * forward-compatibility; the endpoint starts returning it in a later phase,
 * so it may be undefined until then.
 */
export interface AccountFeatures {
  hasAgent: boolean;
  hasAnalyticsPanel: boolean;
  hasDrive?: boolean;
  plan: string;
}

export interface AccountContextValue extends AccountData {
  /** True while the first load is in flight and we have no data yet. */
  loading: boolean;
  /** Non-null when the summary fetch failed. UI can show a retry. */
  error: string | null;
  /** Re-fetch the summary. Call after spending credits or returning from Stripe. */
  refresh: () => Promise<void>;
}

// Re-export the underlying types for convenience so consumers can import
// everything account-related from one place.
export type { SessionInfo, CreditsInfo, OrgFeatures };
