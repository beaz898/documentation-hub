'use client';

import type { CreditsInfo } from '@/hooks/chat/types';

interface SubscriptionBannersProps {
  credits: CreditsInfo | null;
}

export default function SubscriptionBanners({ credits }: SubscriptionBannersProps) {
  if (!credits) return null;

  return (
    <>
      {credits.subscriptionStatus === 'canceled' && (
        <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', borderBottom: '0.5px solid rgba(245,158,11,0.3)', fontSize: 12, color: '#b45309', textAlign: 'center', flexShrink: 0 }}>
          Tu suscripción está cancelada. Tienes acceso hasta el {credits.gracePeriodEndsAt ? new Date(credits.gracePeriodEndsAt).toLocaleDateString('es-ES') : 'fin del período'}.
          <a href="/settings/billing" style={{ marginLeft: 8, color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}>Reactivar</a>
        </div>
      )}
      {credits.subscriptionStatus === 'expired' && (
        <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '0.5px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#dc2626', textAlign: 'center', flexShrink: 0 }}>
          Tu suscripción ha expirado. Contrata un plan para seguir usando la app.
          <a href="/settings/billing" style={{ marginLeft: 8, color: '#dc2626', fontWeight: 600, textDecoration: 'underline' }}>Ver planes</a>
        </div>
      )}
    </>
  );
}
