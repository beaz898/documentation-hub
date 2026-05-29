'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { CreditsInfo } from '@/hooks/chat/types';

interface SubscriptionBannersProps {
  credits: CreditsInfo | null;
}

export default function SubscriptionBanners({ credits }: SubscriptionBannersProps) {
  const t = useTranslations('billing');
  const locale = useLocale();

  if (!credits) return null;

  return (
    <>
      {credits.subscriptionStatus === 'canceled' && (
        <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', borderBottom: '0.5px solid rgba(245,158,11,0.3)', fontSize: 12, color: '#b45309', textAlign: 'center', flexShrink: 0 }}>
          {credits.gracePeriodEndsAt
            ? t('canceledBanner', { date: new Date(credits.gracePeriodEndsAt).toLocaleDateString(locale) })
            : t('canceledBannerFallback')}
          <a href="/settings/billing" style={{ marginLeft: 8, color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}>{t('reactivate')}</a>
        </div>
      )}
      {credits.subscriptionStatus === 'expired' && (
        <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '0.5px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#dc2626', textAlign: 'center', flexShrink: 0 }}>
          {t('expiredBanner')}
          <a href="/settings/billing" style={{ marginLeft: 8, color: '#dc2626', fontWeight: 600, textDecoration: 'underline' }}>{t('manageSubscription')}</a>
        </div>
      )}
    </>
  );
}
