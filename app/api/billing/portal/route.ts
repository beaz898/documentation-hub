import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/billing/portal
 *
 * Crea una sesión del portal de cliente de Stripe.
 * Permite al usuario ver facturas, cambiar método de pago y cancelar.
 * Solo accesible por Admin.
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
      return NextResponse.json({ error: 'Solo los administradores pueden gestionar la facturación.' }, { status: 403 });
    }

    // Obtener customer ID
    const { data: orgData } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', org.orgId)
      .single();

    if (!orgData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No hay suscripción activa. Contrata un plan primero.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin = req.headers.get('origin') || 'https://documentation-hub-zeta.vercel.app';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: orgData.stripe_customer_id,
      return_url: `${origin}/chat`,
      locale: 'es',
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error: unknown) {
    console.error('Error in /api/billing/portal:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
