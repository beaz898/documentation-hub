'use client';

import { useState } from 'react';

interface DocGapButtonProps {
  question: string;
  answer: string;
  noContext: boolean;
}

type Status = 'idle' | 'open' | 'saving' | 'saved' | 'error';

export default function DocGapButton({ question, answer, noContext }: DocGapButtonProps) {
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
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar');
      setStatus('error');
    }
  }

  if (status === 'saved') {
    return (
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        Registrado ✓
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
            {noContext ? 'Marcar que falta esta documentación' : '¿Faltaba documentación para esto?'}
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
            Reportar laguna de documentación
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 5000))}
            placeholder="Nota opcional (ej: necesito esto para completar un albarán)"
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
              Cancelar
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
              {status === 'saving' ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
