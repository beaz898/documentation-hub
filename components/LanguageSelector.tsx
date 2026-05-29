'use client';

import { useLocale, useTranslations } from 'next-intl';

const LOCALES = [
  { value: 'es', label: 'ES' },
  { value: 'en', label: 'EN' },
] as const;

export default function LanguageSelector() {
  const t = useTranslations('language');
  const currentLocale = useLocale();

  async function handleChange(locale: string) {
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ locale }),
      });
    } catch {
      // Non-fatal: cookie is enough for locale resolution
    }
    window.location.reload();
  }

  return (
    <div
      title={t('selectLanguage')}
      style={{ display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'center' }}
    >
      {LOCALES.map(l => (
        <button
          key={l.value}
          onClick={() => handleChange(l.value)}
          aria-label={t(l.value)}
          aria-pressed={currentLocale === l.value}
          style={{
            padding: '2px 5px',
            borderRadius: 4,
            border: currentLocale === l.value ? '0.5px solid var(--brand)' : '0.5px solid transparent',
            background: currentLocale === l.value ? 'var(--brand-light)' : 'transparent',
            color: currentLocale === l.value ? 'var(--brand)' : 'var(--text-muted)',
            fontSize: 10,
            fontWeight: 700,
            cursor: currentLocale === l.value ? 'default' : 'pointer',
            lineHeight: 1,
            letterSpacing: 0.3,
            width: 26,
            textAlign: 'center',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
