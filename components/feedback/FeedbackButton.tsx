'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  accessToken: string | null;
}

export default function FeedbackButton({ accessToken }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const close = () => { setOpen(false); setError(null); };

  const send = async () => {
    const message = text.trim();
    if (!message || sending || !accessToken) return;
    setSending(true); setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('fail');
      setJustSent(true);
      setTimeout(() => { setOpen(false); setJustSent(false); setText(''); }, 2000);
    } catch {
      setError('No se pudo enviar. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Enviar feedback"
        title="Enviar feedback"
        style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div role="dialog" aria-label="Enviar feedback"
          style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          {justSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-primary)', fontSize: 14 }}>
              ¡Gracias! Lo tendremos en cuenta 💚
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Cuéntanos qué piensas</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Tu mensaje nos ayuda a mejorar la aplicación</div>
                </div>
                <button onClick={close} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, 5000))}
                placeholder="¿Qué echas en falta? ¿Qué te ha dado problemas? ¿Qué harías diferente?"
                rows={5}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontSize: 12, padding: 8, borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', marginTop: 6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{text.length} / 5000</span>
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: !text.trim() || sending ? 'var(--border)' : 'var(--brand)', color: 'white', cursor: !text.trim() || sending ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>{error}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
