'use client';

import { RefObject } from 'react';

interface ChatInputProps {
  input: string;
  sending: boolean;
  hasDocuments: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
}

export default function ChatInput({ input, sending, hasDocuments, inputRef, onInputChange, onKeyDown, onSend }: ChatInputProps) {
  return (
    <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--border)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '8px 10px' }}>
        <textarea ref={inputRef} value={input} onChange={onInputChange} onKeyDown={onKeyDown}
          placeholder={hasDocuments ? 'Escribe tu pregunta...' : 'Sube documentos primero...'} disabled={sending} rows={1}
          style={{ flex: 1, resize: 'none', outline: 'none', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.5, maxHeight: 140, minHeight: 20 }} />
        <button onClick={onSend} disabled={sending || !input.trim()} aria-label="Enviar"
          style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: sending || !input.trim() ? 'var(--bg-tertiary)' : 'var(--brand)', color: sending || !input.trim() ? 'var(--text-muted)' : '#fff', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {sending
            ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          }
        </button>
      </div>
      <p style={{ fontSize: 10, marginTop: 6, textAlign: 'center', color: 'var(--text-muted)' }}>Las respuestas se basan exclusivamente en tu documentación</p>
    </div>
  );
}
