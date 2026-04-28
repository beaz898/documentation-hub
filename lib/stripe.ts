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
  starter: 'price_1TR7KXQJlzJPB7cCr8rQ9lqN',
  pro: 'price_1TR7KuQJlzJPB7cC84w0zhUK',
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
  pack_500: { priceId: 'price_1TR7MFQJlzJPB7cC9556NDv7', credits: 500 },
};

/**
 * Mapeo inverso: Price ID de recarga → datos del pack.
 */
export const PRICE_ID_TO_PACK: Record<string, { credits: number }> = Object.fromEntries(
  Object.entries(CREDIT_PACK_PRICE_IDS).map(([, pack]) => [pack.priceId, { credits: pack.credits }])
);

/**
 * Configuración de cada plan: créditos mensuales y máximo de usuarios.
 */
export const PLAN_CONFIG: Record<string, { credits: number; maxUsers: number }> = {
  free: { credits: 100, maxUsers: 1 },
  starter: { credits: 800, maxUsers: 5 },
  pro: { credits: 3000, maxUsers: 15 },
  business: { credits: 8000, maxUsers: 40 },
  business_plus: { credits: 18000, maxUsers: 80 },
};

/**
 * Nombres legibles de cada plan.
 */
export const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  business_plus: 'Business+',
  enterprise: 'Enterprise',
};
