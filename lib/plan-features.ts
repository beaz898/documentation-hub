import type { SupabaseClient } from '@supabase/supabase-js';
import { PLAN_FEATURES } from './stripe';

export interface OrgFeatures {
  hasDrive: boolean;
  hasAnalyticsPanel: boolean;
  hasVariablePricing: boolean;
  maxUsers: number | null;
  plan: string;
}

const FALLBACK: Omit<OrgFeatures, 'plan'> = {
  hasDrive: false,
  hasAnalyticsPanel: false,
  hasVariablePricing: false,
  maxUsers: 1,
};

/**
 * Devuelve las funcionalidades del plan de una organización.
 * Si no se encuentra el plan, aplica el fallback más restrictivo.
 */
export async function getOrgFeatures(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgFeatures> {
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const plan = org?.plan ?? 'free';
  return { ...(PLAN_FEATURES[plan] ?? FALLBACK), plan };
}
