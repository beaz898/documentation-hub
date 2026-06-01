'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { StepRow } from './step-helpers';
import type { AgentConversation, AgentMessage, ConfirmationMode } from '@/lib/agent/types';

// ── Constantes ────────────────────────────────────────────────────────────────

const MODE_OPTIONS: { value: ConfirmationMode; label: string; title: string }[] = [
  { value: 'step_by_step', label: 'Paso a paso', title: 'Confirmar cada acción' },
  { value: 'milestones',   label: 'Hitos',        title: 'Confirmar en puntos clave' },
  { value: 'autonomous',   label: 'Autónomo',     title: 'Sin interrupciones' },
];

const ACTIVE_STATUSES = new Set(['running', 'awaiting_user', 'awaiting_confirmation']);

// ── Burbuja del usuario ───────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 20px 12px' }}>
      <div style={{
        maxWidth: '72%', padding: '10px 14px', borderRadius: '14px 14px 2px 14px',
        background: 'var(--brand)', color: '#fff', fontSize: 13,
        lineHeight: 1.6, whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>
    </div>
  );
}

// ── Burbuja del asistente ─────────────────────────────────────────────────────

// Stagger de pasos nuevos: delay = posición_dentro_del_batch × 60ms.
// Solo los pasos de mensajes 'running' se animan; los históricos se renderizan
// sin animación dentro del <details> colapsado.
function LiveSteps({
  steps,
  prevCountRef,
  msgId,
}: {
  steps: AgentMessage['steps'];
  prevCountRef: React.MutableRefObject<Record<string, number>>;
  msgId: string;
}) {
  const prevCount = prevCountRef.current[msgId] ?? 0;

  return (
    <div style={{ paddingTop: 4 }}>
      {steps.map((step, i) => {
        const isNew   = i >= prevCount;
        const newIdx  = isNew ? i - prevCount : 0;
        return (
          <div
            key={i}
            className={isNew ? 'animate-step-in' : undefined}
            style={isNew ? { animationDelay: `${newIdx * 60}ms` } : undefined}
          >
            <StepRow step={step} />
          </div>
        );
      })}
    </div>
  );
}

function AssistantBubble({
  msg,
  prevCountRef,
}: {
  msg: AgentMessage;
  prevCountRef: React.MutableRefObject<Record<string, number>>;
}) {
  const stepCount = msg.steps.length;

  // ── running: pasos en vivo ─────────────────────────────────────────────────
  if (msg.status === 'running') {
    return (
      <div className="animate-fade-in-up" style={{ padding: '4px 20px 12px' }}>
        <div style={{
          padding: '12px 0', borderRadius: 12,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        }}>
          {stepCount === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px 4px' }}>
              <div className="animate-spin" style={{
                width: 13, height: 13, flexShrink: 0,
                border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%',
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Iniciando…</span>
            </div>
          ) : (
            <LiveSteps steps={msg.steps} prevCountRef={prevCountRef} msgId={msg.id} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 0' }}>
            <div className="animate-pulse" style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Trabajando…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── awaiting_*: pasos visibles (pending_request se gestiona en ConversationInput) ──
  if (msg.status === 'awaiting_user' || msg.status === 'awaiting_confirmation') {
    return (
      <div className="animate-fade-in-up" style={{ padding: '4px 20px 12px' }}>
        <div style={{
          padding: '12px 0', borderRadius: 12,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        }}>
          {stepCount > 0 && (
            <div>
              {msg.steps.map((step, i) => <StepRow key={i} step={step} />)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 0' }}>
            <div className="animate-pulse" style={{
              width: 6, height: 6, borderRadius: '50%', background: '#d97706', flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, color: '#92400e' }}>
              {msg.status === 'awaiting_user' ? 'Esperando tu respuesta' : 'Esperando tu aprobación'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── failed ─────────────────────────────────────────────────────────────────
  if (msg.status === 'failed') {
    return (
      <div className="animate-fade-in-up" style={{ padding: '4px 20px 12px' }}>
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(220,38,38,0.05)', border: '0.5px solid rgba(220,38,38,0.2)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', marginBottom: msg.error_message ? 4 : 0 }}>
            El agente encontró un error
          </p>
          {msg.error_message && (
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {msg.error_message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── completed: pasos colapsables + contenido Markdown ─────────────────────
  return (
    <div className="animate-fade-in-up" style={{ padding: '4px 20px 12px' }}>
      {stepCount > 0 && (
        <details style={{ marginBottom: 8 }}>
          <summary style={{
            fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none',
            padding: '4px 0', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {stepCount} {stepCount === 1 ? 'paso' : 'pasos'}
          </summary>
          <div style={{
            marginTop: 6, padding: '10px 0', borderRadius: 10,
            background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          }}>
            {msg.steps.map((step, i) => <StepRow key={i} step={step} />)}
          </div>
        </details>
      )}

      {msg.content && (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-tertiary)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div
            className="prose-chat"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
              fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.65,
            }}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ConversationThread ────────────────────────────────────────────────────────

interface ConversationThreadProps {
  conversation: AgentConversation;
  messages:     AgentMessage[];
  onCancel:     () => void;
  onUpdateMode: (mode: ConfirmationMode) => void;
}

export default function ConversationThread({
  conversation, messages, onCancel, onUpdateMode,
}: ConversationThreadProps) {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  // Registra cuántos steps conocía cada mensaje en el render anterior.
  // Permite que LiveSteps identifique cuáles son nuevos y les aplique stagger.
  const prevStepCountsRef = useRef<Record<string, number>>({});

  const isActive = ACTIVE_STATUSES.has(conversation.status);

  // Auto-scroll suave: solo si el usuario está cerca del fondo (≤150px de margen)
  // Evita interrumpir el scroll manual hacia el historial.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 150;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  });

  // Actualizar prevStepCountsRef DESPUÉS de que React renderice, no durante.
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        prevStepCountsRef.current[msg.id] = msg.steps.length;
      }
    }
  }, [messages]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Modo
          </span>
          <select
            value={conversation.confirmation_mode}
            onChange={e => onUpdateMode(e.target.value as ConfirmationMode)}
            disabled={isActive}
            title={isActive ? 'Solo se puede cambiar el modo entre turnos' : 'Modo de confirmación'}
            style={{
              fontSize: 11, fontWeight: 600, border: '0.5px solid var(--border)',
              borderRadius: 6, padding: '3px 7px', outline: 'none',
              background: isActive ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              color: isActive ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: isActive ? 'not-allowed' : 'pointer',
              appearance: 'auto',
            }}
          >
            {MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} title={opt.title}>{opt.label}</option>
            ))}
          </select>
        </div>

        {isActive && (
          <button
            onClick={onCancel}
            style={{
              padding: '5px 12px', borderRadius: 7, flexShrink: 0,
              border: '0.5px solid rgba(220,38,38,0.3)', background: 'transparent',
              color: 'var(--danger)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 0 8px' }}>

        {messages.length === 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--text-muted)', fontSize: 12,
          }}>
            Escribe tu primer mensaje para comenzar.
          </div>
        )}

        {messages.map(msg => (
          msg.role === 'user'
            ? <UserBubble key={msg.id} content={msg.content} />
            : <AssistantBubble key={msg.id} msg={msg} prevCountRef={prevStepCountsRef} />
        ))}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
