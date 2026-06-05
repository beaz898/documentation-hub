'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceInput from '@/components/VoiceInput';
import type { AgentConversation, ConfirmationMode } from '@/lib/agent/types';
import type { SendMessageBody } from '@/hooks/agent/useConversation';

// ── Constantes ────────────────────────────────────────────────────────────────

const MODE_OPTIONS: { value: ConfirmationMode; label: string; description: string }[] = [
  { value: 'step_by_step', label: 'Paso a paso', description: 'Confirmar cada acción' },
  { value: 'milestones',   label: 'Hitos',       description: 'Confirmar en puntos clave' },
  { value: 'autonomous',   label: 'Autónomo',    description: 'Sin interrupciones' },
];

const WRAP: React.CSSProperties = {
  padding: '12px 16px', borderTop: '0.5px solid var(--border)',
  background: 'var(--bg)', flexShrink: 0,
};

const INPUT_BOX: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-end', gap: 8,
  background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
  borderRadius: 12, padding: '8px 10px',
};

const HINT: React.CSSProperties = {
  fontSize: 10, marginTop: 6, textAlign: 'center', color: 'var(--text-muted)',
};

// ── Componentes pequeños ──────────────────────────────────────────────────────

function SendBtn({ disabled, busy, onClick }: { disabled: boolean; busy: boolean; onClick?: () => void }) {
  return (
    <button type="button" disabled={disabled} aria-label="Enviar" onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 8, border: 'none', flexShrink: 0,
      background: disabled ? 'var(--bg-tertiary)' : 'var(--brand)',
      color: disabled ? 'var(--text-muted)' : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {busy
        ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
      }
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ConversationInputProps {
  conversation:    AgentConversation | null;
  sending:         boolean;
  creating:        boolean;
  error:           string | null;
  onSendMessage:   (convId: string, body: SendMessageBody) => Promise<boolean>;
  onCreateAndSend: (mode: ConfirmationMode, content: string) => Promise<void>;
  onCancel:        () => void;
  onClearError:    () => void;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ConversationInput({
  conversation, sending, creating, error,
  onSendMessage, onCreateAndSend, onCancel, onClearError,
}: ConversationInputProps) {
  const [content,    setContent]    = useState('');
  const [mode,       setMode]       = useState<ConfirmationMode>('milestones');
  const [modif,      setModif]      = useState('');
  const [showModify, setShowModify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const prevStateRef = useRef<{
    id:     string | undefined;
    status: AgentConversation['status'] | undefined;
  }>({ id: undefined, status: undefined });

  // Limpiar estado local al cambiar de conversación (no contaminar entre hilos)
  useEffect(() => {
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowModify(false);
    setModif('');
  }, [conversation?.id]);

  // Cerrar el panel "Modificar" cuando la conversación vuelve a idle / running
  useEffect(() => {
    if (conversation?.status !== 'awaiting_confirmation') {
      setShowModify(false);
      setModif('');
    }
  }, [conversation?.status]);

  // Auto-foco: devolver el cursor al textarea solo cuando la misma conversación
  // transiciona de running → idle (el agente terminó). No aplica al cargar o
  // seleccionar una conversación desde el sidebar (evita teclado emergente en móvil).
  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = { id: conversation?.id, status: conversation?.status };
    prevStateRef.current = curr;
    if (prev.id === curr.id && prev.status === 'running' && curr.status === 'idle') {
      textareaRef.current?.focus();
    }
  }, [conversation?.id, conversation?.status]);

  // ── Helpers de textarea ────────────────────────────────────────────────────

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  }

  function clearTextarea() {
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function appendVoice(text: string) {
    setContent(prev => {
      const next = prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text;
      setTimeout(() => {
        const t = textareaRef.current;
        if (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }
      }, 0);
      return next;
    });
  }

  function handleKeyDown(onEnter: () => void) {
    return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnter(); }
    };
  }

  // ── Handlers de envío ──────────────────────────────────────────────────────

  async function handleNewConvSend() {
    const text = content.trim();
    if (!text || creating || submitting) return;
    setSubmitting(true);
    await onCreateAndSend(mode, text);
    // onCreateAndSend gestiona su propio error vía el hook; limpiamos siempre
    clearTextarea();
    setSubmitting(false);
  }

  async function handleTextSend(convId: string) {
    const text = content.trim();
    if (!text || sending || submitting) return;
    setSubmitting(true);
    const ok = await onSendMessage(convId, { content: text });
    // Solo limpiamos el textarea si el envío tuvo éxito.
    // Si falla, preservamos el texto para que el usuario pueda reintentar sin reescribir.
    if (ok) clearTextarea();
    setSubmitting(false);
  }

  async function handleConfirmSend(body: SendMessageBody) {
    if (!conversation || submitting) return;
    setSubmitting(true);
    await onSendMessage(conversation.id, body);
    // Si falla, el error aparece en el banner; el estado 'awaiting_confirmation' se mantiene
    // y los botones vuelven a estar activos al hacer setSubmitting(false).
    setShowModify(false);
    setModif('');
    setSubmitting(false);
  }

  // ── Banner de error recuperable ────────────────────────────────────────────

  const errorBanner = error ? (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '8px 12px', marginBottom: 8, borderRadius: 8,
      background: 'rgba(220,38,38,0.06)', border: '0.5px solid rgba(220,38,38,0.2)',
      fontSize: 11, color: 'var(--danger)', gap: 8,
    }}>
      <span style={{ lineHeight: 1.5 }}>{error}</span>
      <button
        onClick={onClearError}
        aria-label="Cerrar error"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, lineHeight: 1, flexShrink: 0, padding: 0 }}
      >×</button>
    </div>
  ) : null;

  // ── Estado: sin conversación (nueva) ──────────────────────────────────────

  if (!conversation) {
    const isBusy = creating || submitting;
    return (
      <div style={WRAP}>
        {errorBanner}
        <div style={{ ...INPUT_BOX, flexDirection: 'column', gap: 6 }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown(handleNewConvSend)}
            placeholder="Describe en qué quieres que te ayude el agente…"
            disabled={isBusy}
            rows={2}
            style={{
              width: '100%', resize: 'none', outline: 'none', border: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.5,
              minHeight: 44, maxHeight: 160,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {MODE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  title={opt.description}
                  disabled={isBusy}
                  style={{
                    padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    border: mode === opt.value ? 'none' : '0.5px solid var(--border)',
                    background: mode === opt.value ? 'var(--brand)' : 'transparent',
                    color: mode === opt.value ? '#fff' : 'var(--text-muted)',
                    cursor: isBusy ? 'not-allowed' : 'pointer', transition: 'background 0.1s',
                  }}
                >{opt.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <VoiceInput onTranscript={appendVoice} disabled={isBusy} />
              <SendBtn disabled={isBusy || !content.trim()} busy={isBusy} onClick={handleNewConvSend} />
            </div>
          </div>
        </div>
        <p style={HINT}>Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    );
  }

  const { status, pending_request: pr } = conversation;

  // ── Estado: running ───────────────────────────────────────────────────────

  if (status === 'running') {
    return (
      <div style={WRAP}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>El agente está trabajando…</span>
          </div>
          <button
            onClick={onCancel}
            style={{
              padding: '5px 12px', borderRadius: 7, flexShrink: 0,
              border: '0.5px solid rgba(220,38,38,0.3)', background: 'transparent',
              color: 'var(--danger)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >Cancelar</button>
        </div>
      </div>
    );
  }

  // ── Estado: idle ──────────────────────────────────────────────────────────

  if (status === 'idle') {
    const isBusy = sending || submitting;
    return (
      <div style={WRAP}>
        {errorBanner}
        <div style={INPUT_BOX}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown(() => handleTextSend(conversation.id))}
            placeholder="Escribe tu siguiente mensaje…"
            disabled={isBusy}
            rows={1}
            style={{
              flex: 1, resize: 'none', outline: 'none', border: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.5, maxHeight: 160, minHeight: 20,
            }}
          />
          <VoiceInput onTranscript={appendVoice} disabled={isBusy} />
          <SendBtn disabled={isBusy || !content.trim()} busy={isBusy} onClick={() => handleTextSend(conversation.id)} />
        </div>
        <p style={HINT}>Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    );
  }

  // ── Estado: awaiting_user (user_input) ────────────────────────────────────

  if (status === 'awaiting_user' && pr?.type === 'user_input') {
    const isBusy = sending || submitting;
    return (
      <div style={WRAP}>
        {errorBanner}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
          💬 {pr.question}
        </p>
        <div style={INPUT_BOX}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown(() => handleTextSend(conversation.id))}
            placeholder="Tu respuesta…"
            disabled={isBusy}
            rows={1}
            autoFocus
            style={{
              flex: 1, resize: 'none', outline: 'none', border: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.5, maxHeight: 160, minHeight: 20,
            }}
          />
          <VoiceInput onTranscript={appendVoice} disabled={isBusy} />
          <SendBtn disabled={isBusy || !content.trim()} busy={isBusy} onClick={() => handleTextSend(conversation.id)} />
        </div>
        <p style={HINT}>Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    );
  }

  // ── Estado: awaiting_confirmation (confirmation) ──────────────────────────

  if (status === 'awaiting_confirmation' && pr?.type === 'confirmation') {
    return (
      <div style={WRAP}>
        {errorBanner}
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>El agente quiere:</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: pr.preview ? 8 : 10, lineHeight: 1.5 }}>
          {pr.pending_action}
        </p>
        {pr.preview && (
          <pre style={{
            fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
            borderRadius: 6, padding: '8px 10px', marginBottom: 10,
            whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 80, overflow: 'auto',
          }}>{pr.preview}</pre>
        )}
        {showModify ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus type="text" value={modif}
              onChange={e => setModif(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && modif.trim() && !submitting)
                  handleConfirmSend({ response: 'modify', modification: modif.trim() });
              }}
              placeholder="Describe el cambio que quieres…"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, outline: 'none',
                border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                fontSize: 12, color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={() => handleConfirmSend({ response: 'modify', modification: modif.trim() })}
              disabled={submitting || !modif.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                background: modif.trim() && !submitting ? 'var(--brand)' : 'var(--bg-tertiary)',
                color: modif.trim() && !submitting ? '#fff' : 'var(--text-muted)',
                cursor: submitting || !modif.trim() ? 'not-allowed' : 'pointer',
              }}
            >{submitting ? '…' : 'Enviar'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => handleConfirmSend({ response: 'approve' })} disabled={submitting}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              Aprobar
            </button>
            <button onClick={() => setShowModify(true)} disabled={submitting}
              style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Modificar
            </button>
            <button onClick={() => handleConfirmSend({ response: 'reject' })} disabled={submitting}
              style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid rgba(220,38,38,0.3)', background: 'transparent', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Estado: awaiting_confirmation (escalation) ────────────────────────────

  if (status === 'awaiting_confirmation' && pr?.type === 'escalation') {
    const OPTS: Record<string, { label: string; brand?: boolean; danger?: boolean }> = {
      stop:             { label: 'Detener',                        danger: true },
      ask_more:         { label: 'Permitir preguntas',             brand: true  },
      improvise:        { label: 'Improvisar'                                   },
      expert_judgment:  { label: 'Resolver con criterio experto',  brand: true  },
      mark_gap:         { label: 'Esto debería estar documentado'               },
      search_again:     { label: 'Buscar de nuevo'                              },
    };
    return (
      <div style={WRAP}>
        {errorBanner}
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
          <strong>
            {pr.escalation_type === 'undocumented'
              ? 'No he encontrado esto en vuestra documentación:'
              : 'El agente no puede continuar:'}
          </strong>{' '}{pr.reason}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pr.options.map(opt => {
            const cfg = OPTS[opt] ?? { label: opt };
            return (
              <button
                key={opt}
                onClick={() => handleConfirmSend({ response: opt })}
                disabled={submitting}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: cfg.danger ? '0.5px solid rgba(220,38,38,0.3)' : '0.5px solid var(--border)',
                  background: cfg.brand ? 'var(--brand)' : 'transparent',
                  color: cfg.brand ? '#fff' : cfg.danger ? 'var(--danger)' : 'var(--text-secondary)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >{cfg.label}</button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
