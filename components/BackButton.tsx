'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        padding: '6px 12px',
        borderRadius: 8,
        border: '0.5px solid var(--border)',
        background: 'var(--bg-secondary)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Volver
    </button>
  );
}
