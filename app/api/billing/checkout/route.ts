import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { getStripe, PLAN_PRICE_IDS, PLAN_LABELS } from '@/lib/stripe';

/**
 * POST /api/billing/checkout
 *
 * Crea una sesión de Stripe Checkout para contratar un plan.
 * Solo accesible por Admin.
 *
 * Body: { plan: 'starter' | 'pro' | 'business' | 'business_plus' }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden gestionar la suscripción.' }, { status: 403 });
    }

    const body = await req.json();
    const plan = body.plan as string;

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: `Plan inválido: ${plan}. Planes disponibles: ${Object.keys(PLAN_PRICE_IDS).join(', ')}` }, { status: 400 });
    }

    // Obtener datos de la organización
    const { data: orgData } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', org.orgId)
      .single();

    const stripe = getStripe();

    // Crear o reutilizar cliente de Stripe
    let customerId = orgData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          org_id: org.orgId,
        },
      });
      customerId = customer.id;

      // Guardar customer ID en la organización
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.orgId);
    }

    // Determinar la URL base
    const origin = req.headers.get('origin') || 'https://documentation-hub-zeta.vercel.app';

    // Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/chat?billing=success&plan=${plan}`,
      cancel_url: `${origin}/chat?billing=cancelled`,
      locale: 'es',
      metadata: {
        org_id: org.orgId,
        plan,
      },
      subscription_data: {
        metadata: {
          org_id: org.orgId,
          plan,
        },
      },
    });

    console.log(`[billing/checkout] Session created for org ${org.orgId}, plan ${PLAN_LABELS[plan] || plan}`);

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('Error in /api/billing/checkout:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
