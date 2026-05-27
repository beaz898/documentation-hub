import Stripe from 'stripe';

/**
 * Cliente de Stripe (server-side only).
 * Usa la secret key de las variables de entorno.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

/**
 * Mapeo de plan interno → Price ID de Stripe (modo test).
 * Cuando pases a producción, actualiza estos IDs con los de modo live.
 */
export const PLAN_PRICE_IDS: Record<string, string> = {
  starter: 'price_1TWY7rQJlzJPB7cCGDrOZNb3',
  pro: 'price_1TWY6pQJlzJPB7cC5D9RVVDt',
  business: 'price_1TR7LCQJlzJPB7cCs1LJp4Xp',
  business_plus: 'price_1TR7LXQJlzJPB7cCvXtF0XPP',
};

/**
 * Mapeo inverso: Price ID → plan interno.
 */
export const PRICE_ID_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_PRICE_IDS).map(([plan, priceId]) => [priceId, plan])
);

/**
 * Price IDs de recargas de créditos (pagos únicos).
 */
export const CREDIT_PACK_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  pack_500: { priceId: 'price_1TWY5YQJlzJPB7cCqm5CeJ7R', credits: 500 },
};

/**
 * Mapeo inverso: Price ID de recarga → datos del pack.
 */
export const PRICE_ID_TO_PACK: Record<string, { credits: number }> = Object.fromEntries(
  Object.entries(CREDIT_PACK_PRICE_IDS).map(([, pack]) => [pack.priceId, { credits: pack.credits }])
);

/**
 * Configuración de cada plan: créditos mensuales, máximo de usuarios
 * y si tiene precio variable en análisis exhaustivos.
 */
export const PLAN_CONFIG: Record<string, { credits: number; maxUsers: number | null; hasVariablePricing?: boolean }> = {
  free: { credits: 50, maxUsers: 1 },
  starter: { credits: 400, maxUsers: 3 },
  pro: { credits: 1500, maxUsers: 5 },
  business: { credits: 4000, maxUsers: 15, hasVariablePricing: true },
  business_plus: { credits: 10000, maxUsers: 25, hasVariablePricing: true },
};

/**
 * Planes con precio variable en análisis exhaustivos.
 * En estos planes, al completar el job se devuelven créditos
 * según el coste real del análisis.
 */
export const PLANS_WITH_VARIABLE_PRICING = new Set(['business', 'business_plus']);

/**
 * Funcionalidades disponibles por plan.
 * maxUsers: null = ilimitados (Enterprise).
 */
export const PLAN_FEATURES: Record<string, {
  hasDrive: boolean;
  hasAnalyticsPanel: boolean;
  hasVariablePricing: boolean;
  hasAgent: boolean;
  maxUsers: number | null;
}> = {
  free:          { hasDrive: false, hasAnalyticsPanel: false, hasVariablePricing: false, hasAgent: false, maxUsers: 1 },
  starter:       { hasDrive: false, hasAnalyticsPanel: false, hasVariablePricing: false, hasAgent: false, maxUsers: 3 },
  pro:           { hasDrive: true,  hasAnalyticsPanel: false, hasVariablePricing: false, hasAgent: false, maxUsers: 5 },
  business:      { hasDrive: true,  hasAnalyticsPanel: true,  hasVariablePricing: true,  hasAgent: true,  maxUsers: 15 },
  business_plus: { hasDrive: true,  hasAnalyticsPanel: true,  hasVariablePricing: true,  hasAgent: true,  maxUsers: 25   },
  enterprise:    { hasDrive: true,  hasAnalyticsPanel: true,  hasVariablePricing: true,  hasAgent: true,  maxUsers: null },
};

/**
 * Nombres legibles de cada plan.
 */
export const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  business_plus: 'Business+',
  enterprise: 'Enterprise',
};
