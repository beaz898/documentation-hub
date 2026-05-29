'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface ReanalyzeButtonsProps {
  onReanalyzeStyle: () => void;
  onReanalyzeAll: () => void;
  styleLoading: boolean;
  reanalyzingAll: boolean;
}

export default function ReanalyzeButtons({
  onReanalyzeStyle,
  onReanalyzeAll,
  styleLoading,
  reanalyzingAll,
}: ReanalyzeButtonsProps) {
  const t = useTranslations('analysis');
  const anyLoading = styleLoading || reanalyzingAll;

  const baseStyle: React.CSSProperties = {
    fontSize: 12,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    cursor: anyLoading ? 'not-allowed' : 'pointer',
    opacity: anyLoading ? 0.6 : 1,
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        type="button"
        onClick={onReanalyzeStyle}
        disabled={anyLoading}
        style={baseStyle}
        title={t('reanalyzeStyleTitle')}
      >
        {styleLoading ? t('reanalyzingStyle') : t('reanalyzeStyle')}
      </button>
      <button
        type="button"
        onClick={onReanalyzeAll}
        disabled={anyLoading}
        style={baseStyle}
        title={t('reanalyzeAllTitle')}
      >
        {reanalyzingAll ? t('reanalyzingAll') : t('reanalyzeCorpus')}
      </button>
    </div>
  );
}
