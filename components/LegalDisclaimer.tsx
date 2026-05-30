'use client';

import { useTranslations } from 'next-intl';

export default function LegalDisclaimer() {
  const t = useTranslations('legal');

  function switchToSpanish() {
    document.cookie = `locale=es; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  return (
    <div style={{
      marginBottom: 28,
      padding: '10px 14px',
      borderRadius: 8,
      background: 'rgba(99,102,241,0.06)',
      border: '0.5px solid rgba(99,102,241,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
        {t('disclaimer')}
      </p>
      <button
        onClick={switchToSpanish}
        style={{
          flexShrink: 0,
          padding: '5px 10px',
          borderRadius: 6,
          border: '0.5px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {t('viewOriginal')}
      </button>
    </div>
  );
}
