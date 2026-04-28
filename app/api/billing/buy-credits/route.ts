import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { getStripe, CREDIT_PACK_PRICE_IDS } from '@/lib/stripe';

/**
 * POST /api/billing/buy-credits
 *
 * Crea una sesión de Stripe Checkout para comprar créditos extra.
 * Solo accesible por Admin.
 *
 * Body: { pack: 'pack_500' }
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
      return NextResponse.json({ error: 'Solo los administradores pueden comprar créditos.' }, { status: 403 });
    }

    const body = await req.json();
    const packId = body.pack as string;

    const pack = CREDIT_PACK_PRICE_IDS[packId];
    if (!pack) {
      return NextResponse.json({ error: `Pack inválido: ${packId}` }, { status: 400 });
    }

    // Obtener o crear customer de Stripe
    const { data: orgData } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', org.orgId)
      .single();

    const stripe = getStripe();
    let customerId = orgData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { org_id: org.orgId },
      });
      customerId = customer.id;
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.orgId);
    }

    const origin = req.headers.get('origin') || 'https://documentation-hub-zeta.vercel.app';

    // Crear sesión de Checkout para pago único
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${origin}/settings/billing?credits=success&amount=${pack.credits}`,
      cancel_url: `${origin}/settings/billing?credits=cancelled`,
      locale: 'es',
      metadata: {
        org_id: org.orgId,
        type: 'credit_pack',
        pack_id: packId,
        credits: pack.credits.toString(),
      },
    });

    console.log(`[billing/buy-credits] Session created for org ${org.orgId}, pack ${packId} (${pack.credits} credits)`);

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('Error in /api/billing/buy-credits:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
