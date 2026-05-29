'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const COOKIE_NAME = 'doclity_cookie_notice';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieValue(COOKIE_NAME) !== '1') {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    document.cookie = `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t('ariaLabel')}
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: 720,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        padding: '14px 18px',
        borderRadius: 12,
        background: 'rgba(15, 15, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        color: '#fff',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <p style={{ flex: 1, minWidth: 200, color: 'rgba(255,255,255,0.85)' }}>
        {t('bannerMessage')}{' '}
        <Link
          href="/legal/cookies"
          style={{ color: 'var(--brand)', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          {t('moreInfo')}
        </Link>
      </p>
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0,
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--brand)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {t('understood')}
      </button>
    </div>
  );
}
