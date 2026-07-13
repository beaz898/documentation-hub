'use client';

import { useTranslations } from 'next-intl';

interface UploadActionsProps {
  isExhaustive: boolean;
  onCancel: () => void;
  onImprove: () => void;
  onConfirm: () => void;
  onExhaustive?: () => void;
}

export default function UploadActions({
  isExhaustive,
  onCancel,
  onImprove,
  onConfirm,
  onExhaustive,
}: UploadActionsProps) {
  const t = useTranslations('analysis');

  return (
    <>
      {/* Exhaustive analysis button */}
      {!isExhaustive && onExhaustive && (
        <button
          onClick={onExhaustive}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            border: '0.5px dashed var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 12, transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {t('exhaustiveButton')}
        </button>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
        >
          {t('discard')}
        </button>
        <button
          onClick={onImprove}
          style={{
            flex: 1.3, padding: '10px 12px', borderRadius: 10,
            border: '0.5px solid var(--brand)', background: 'var(--brand-light)',
            color: 'var(--brand)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.3 5.8 22l2.4-8.1L2 9.4h7.6L12 2z" />
          </svg>
          {t('improveWithAI')}
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            border: 'none', background: 'var(--brand)', color: '#fff',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {t('addToCorpus')}
        </button>
      </div>
    </>
  );
}
