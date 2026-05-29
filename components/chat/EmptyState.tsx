'use client';

import { useTranslations } from 'next-intl';

interface EmptyStateProps {
  hasDocuments: boolean;
}

export default function EmptyState({ hasDocuments }: EmptyStateProps) {
  const t = useTranslations('chat.empty');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 16px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: 'var(--brand-light)', border: '0.5px solid var(--brand)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /></svg>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t('title')}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400 }}>
        {hasDocuments ? t('subtitleReady') : t('subtitleNoDocuments')}
      </p>
    </div>
  );
}
