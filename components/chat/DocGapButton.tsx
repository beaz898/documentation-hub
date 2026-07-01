'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface DocGapButtonProps {
  question: string;
  answer: string;
  noContext: boolean;
}

type Status = 'idle' | 'open' | 'saving' | 'saved' | 'error';

export default function DocGapButton({ question, answer, noContext }: DocGapButtonProps) {
  const t = useTranslations('chat');
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSave() {
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/documentation-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question,
          answer: answer.slice(0, 5000),
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      setStatus('saved');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('docGap.saveError'));
      setStatus('error');
    }
  }

  if (status === 'saved') {
    return (
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        {t('docGap.registered')}
      </div>
    );
  }

  const showPanel = status === 'open' || status === 'saving';

  return (
    <div style={{ marginTop: 8 }}>
      {!showPanel && (
        <>
          <button
            onClick={() => { setStatus('open'); setErrorMsg(''); }}
            style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 8,
              border: '0.5px solid var(--warning)', background: 'var(--warning-light)',
              color: 'var(--warning-text)', cursor: 'pointer',
            }}
          >
            {noContext ? t('docGap.markMissing') : t('docGap.wasMissing')}
          </button>
          {status === 'error' && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626' }}>{errorMsg}</div>
          )}
        </>
      )}

      {showPanel && (
        <div style={{
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          borderRadius: 10, padding: '10px 12px', maxWidth: 360,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {t('docGap.panelTitle')}
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 5000))}
            placeholder={t('docGap.notePlaceholder')}
            rows={3}
            disabled={status === 'saving'}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              fontSize: 12, padding: '6px 8px', borderRadius: 8,
              border: '0.5px solid var(--border)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
            <button
              onClick={() => { setStatus('idle'); setNote(''); }}
              disabled={status === 'saving'}
              style={{
                fontSize: 12, padding: '5px 10px', borderRadius: 8,
                border: '0.5px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', cursor: status === 'saving' ? 'not-allowed' : 'pointer',
              }}
            >
              {t('docGap.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none',
                background: status === 'saving' ? 'var(--border)' : 'var(--brand)',
                color: 'white', cursor: status === 'saving' ? 'not-allowed' : 'pointer', fontWeight: 500,
              }}
            >
              {status === 'saving' ? t('docGap.submitting') : t('docGap.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
