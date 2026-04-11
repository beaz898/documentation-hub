'use client';

import React from 'react';

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
        title="Volver a analizar solo el estilo del texto actual"
      >
        {styleLoading ? 'Analizando estilo…' : 'Reanalizar estilo'}
      </button>
      <button
        type="button"
        onClick={onReanalyzeAll}
        disabled={anyLoading}
        style={baseStyle}
        title="Volver a analizar contra los demás documentos y el estilo"
      >
        {reanalyzingAll ? 'Reanalizando…' : 'Reanalizar todo'}
      </button>
    </div>
  );
}
