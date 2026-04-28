import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getStripe, PRICE_ID_TO_PLAN, PLAN_CONFIG } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * POST /api/billing/webhook
 *
 * Recibe webhooks de Stripe. No usa autenticación JWT — usa la firma
 * de Stripe para verificar que el evento es legítimo.
 *
 * Eventos procesados:
 * - checkout.session.completed → activa plan tras pago inicial
 * - invoice.paid → renueva créditos al inicio de cada ciclo
 * - customer.subscription.updated → cambio de plan (upgrade/downgrade)
 * - customer.subscription.deleted → cancelación
 * - invoice.payment_failed → marca fallo de pago
 */
export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (webhookSecret) {
      // Verificar firma en producción
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('[webhook] Signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // En desarrollo sin webhook secret, parsear directamente
      console.warn('[webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification');
      event = JSON.parse(body) as Stripe.Event;
    }

    // Idempotencia: verificar si ya procesamos este evento
    const { data: existingEvent } = await supabase
      .from('billing_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .limit(1);

    if (existingEvent && existingEvent.length > 0) {
      console.log(`[webhook] Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    console.log(`[webhook] Processing event: ${event.type} (${event.id})`);

    // Procesar según tipo de evento
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    // Registrar evento procesado
    const orgId = extractOrgId(event);
    await supabase.from('billing_events').insert({
      org_id: orgId,
      event_type: event.type,
      stripe_event_id: event.id,
      payload: {
        type: event.type,
        id: event.id,
        created: event.created,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('[webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ============================================================
// Event handlers
// ============================================================

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const orgId = session.metadata?.org_id;
  const plan = session.metadata?.plan;

  if (!orgId || !plan) {
    console.error('[webhook] checkout.session.completed missing org_id or plan in metadata');
    return;
  }

  const config = PLAN_CONFIG[plan];
  if (!config) {
    console.error(`[webhook] Unknown plan: ${plan}`);
    return;
  }

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  await supabase
    .from('organizations')
    .update({
      plan,
      credits_remaining: config.credits,
      max_users: config.maxUsers,
      stripe_subscription_id: subscriptionId || null,
      billing_cycle_start: new Date().toISOString(),
      canceled_at: null,
      grace_period_ends_at: null,
    })
    .eq('id', orgId);

  console.log(`[webhook] Org ${orgId} activated plan: ${plan} (${config.credits} credits, ${config.maxUsers} users)`);
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: Stripe.Invoice
) {
  // Solo renovar créditos en facturas de suscripción (no la primera, que ya se maneja en checkout)
  if (!invoice.subscription) return;

  // billing_reason: 'subscription_cycle' es renovación, 'subscription_create' es la primera
  const billingReason = invoice.billing_reason;
  if (billingReason === 'subscription_create') {
    console.log('[webhook] invoice.paid for initial subscription, skipping (handled by checkout)');
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) return;

  // Buscar organización por subscription ID
  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!org) {
    console.error(`[webhook] No org found for subscription ${subscriptionId}`);
    return;
  }

  const config = PLAN_CONFIG[org.plan];
  if (!config) return;

  // Renovar créditos del plan (los extras NO se tocan)
  await supabase
    .from('organizations')
    .update({
      credits_remaining: config.credits,
      billing_cycle_start: new Date().toISOString(),
    })
    .eq('id', org.id);

  console.log(`[webhook] Org ${org.id} credits renewed: ${config.credits} (plan: ${org.plan})`);
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const orgId = subscription.metadata?.org_id;
  if (!orgId) return;

  // Determinar el nuevo plan a partir del price ID
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newPlan = PRICE_ID_TO_PLAN[priceId];
  if (!newPlan) {
    console.warn(`[webhook] Unknown price ID in subscription update: ${priceId}`);
    return;
  }

  const config = PLAN_CONFIG[newPlan];
  if (!config) return;

  // Obtener plan actual
  const { data: org } = await supabase
    .from('organizations')
    .select('plan, credits_remaining')
    .eq('id', orgId)
    .single();

  if (!org) return;

  // Si cambió de plan, actualizar créditos y límites
  if (org.plan !== newPlan) {
    const oldConfig = PLAN_CONFIG[org.plan];
    const isUpgrade = config.credits > (oldConfig?.credits || 0);

    await supabase
      .from('organizations')
      .update({
        plan: newPlan,
        max_users: config.maxUsers,
        // En upgrade: dar los créditos completos del nuevo plan
        // En downgrade: mantener los que le quedan (no quitar)
        credits_remaining: isUpgrade ? config.credits : Math.min(org.credits_remaining, config.credits),
      })
      .eq('id', orgId);

    console.log(`[webhook] Org ${orgId} plan changed: ${org.plan} → ${newPlan} (${isUpgrade ? 'upgrade' : 'downgrade'})`);
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const orgId = subscription.metadata?.org_id;
  if (!orgId) return;

  // Marcar como cancelado con 90 días de gracia
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 90);

  await supabase
    .from('organizations')
    .update({
      canceled_at: new Date().toISOString(),
      grace_period_ends_at: gracePeriodEnd.toISOString(),
      stripe_subscription_id: null,
    })
    .eq('id', orgId);

  console.log(`[webhook] Org ${orgId} subscription cancelled. Grace period until ${gracePeriodEnd.toISOString()}`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) return;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!org) return;

  // Registramos el fallo. Por ahora no bloqueamos al usuario — Stripe reintentará.
  // En el futuro se puede mostrar un banner de aviso en la UI.
  console.warn(`[webhook] Payment failed for org ${org.id}`);
}

// ============================================================
// Helpers
// ============================================================

function extractOrgId(event: Stripe.Event): string | null {
  const obj = event.data.object as Record<string, unknown>;

  // Intentar desde metadata
  if (obj.metadata && typeof obj.metadata === 'object') {
    const meta = obj.metadata as Record<string, string>;
    if (meta.org_id) return meta.org_id;
  }

  return null;
}
