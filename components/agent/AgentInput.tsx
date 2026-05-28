'use client';

import { useState, useRef } from 'react';
import VoiceInput from '@/components/VoiceInput';
import type { ConfirmationMode, PendingRequest } from '@/lib/agent/types';

interface AgentInputProps {
  creating: boolean;
  onCreateTask: (goal: string, mode: ConfirmationMode) => Promise<string | null>;
  activeTaskId: string | null;
  pendingRequest: PendingRequest | null;
  onConfirm: (
    taskId: string,
    response: string,
    options?: { modification?: string; userInput?: string },
  ) => Promise<void>;
}

const MODE_OPTIONS: { value: ConfirmationMode; label: string; description: string }[] = [
  { value: 'step_by_step', label: 'Paso a paso',  description: 'Confirmar cada acción' },
  { value: 'milestones',   label: 'Hitos',         description: 'Confirmar en puntos clave' },
  { value: 'autonomous',   label: 'Autónomo',      description: 'Sin interrupciones' },
];

export default function AgentInput({
  creating, onCreateTask,
  activeTaskId, pendingRequest, onConfirm,
}: AgentInputProps) {
  const [goal, setGoal]             = useState('');
  const [mode, setMode]             = useState<ConfirmationMode>('milestones');
  const [userInput, setUserInput]   = useState('');
  const [modification, setModification] = useState('');
  const [showModify, setShowModify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleGoalChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setGoal(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  }

  async function handleCreateTask() {
    if (!goal.trim() || creating) return;
    const taskId = await onCreateTask(goal.trim(), mode);
    if (taskId) {
      setGoal('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }

  async function handleConfirm(response: string, options?: { modification?: string; userInput?: string }) {
    if (!activeTaskId || submitting) return;
    setSubmitting(true);
    await onConfirm(activeTaskId, response, options);
    setUserInput('');
    setModification('');
    setShowModify(false);
    setSubmitting(false);
  }

  const containerStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderTop: '0.5px solid var(--border)',
    background: 'var(--bg)',
    flexShrink: 0,
  };

  // ── Pending request: user_input ─────────────────────────────────────────────
  if (pendingRequest?.type === 'user_input' && activeTaskId) {
    return (
      <div style={containerStyle}>
        <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>
          {pendingRequest.question}
        </p>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '8px 10px',
        }}>
          <input
            autoFocus type="text" value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && userInput.trim() && !submitting) handleConfirm('user_input', { userInput }); }}
            placeholder="Tu respuesta…"
            style={{
              flex: 1, outline: 'none', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)',
            }}
          />
          <VoiceInput onTranscript={text => setUserInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text)} disabled={submitting} />
          <button
            onClick={() => handleConfirm('user_input', { userInput })}
            disabled={submitting || !userInput.trim()}
            aria-label="Enviar"
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none', flexShrink: 0,
              background: userInput.trim() ? 'var(--brand)' : 'var(--bg-tertiary)',
              color: userInput.trim() ? '#fff' : 'var(--text-muted)',
              cursor: userInput.trim() && !submitting ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {submitting
              ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            }
          </button>
        </div>
      </div>
    );
  }

  // ── Pending request: escalation ─────────────────────────────────────────────
  if (pendingRequest?.type === 'escalation' && activeTaskId) {
    const OPT: Record<string, { label: string; brand?: boolean; danger?: boolean }> = {
      stop:      { label: 'Detener',            danger: true },
      ask_more:  { label: 'Permitir preguntas', brand: true  },
      improvise: { label: 'Improvisar' },
    };
    return (
      <div style={containerStyle}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
          <strong>El agente no puede continuar:</strong> {pendingRequest.reason}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pendingRequest.options.map(opt => {
            const cfg = OPT[opt] ?? { label: opt };
            return (
              <button key={opt} onClick={() => handleConfirm(opt)} disabled={submitting}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: cfg.danger ? '0.5px solid rgba(220,38,38,0.3)' : '0.5px solid var(--border)',
                  background: cfg.brand ? 'var(--brand)' : 'transparent',
                  color: cfg.brand ? '#fff' : cfg.danger ? 'var(--danger)' : 'var(--text-secondary)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Pending request: confirmation ───────────────────────────────────────────
  if (pendingRequest?.type === 'confirmation' && activeTaskId) {
    return (
      <div style={containerStyle}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
          El agente quiere:
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: pendingRequest.preview ? 8 : 10, lineHeight: 1.5 }}>
          {pendingRequest.pending_action}
        </p>
        {pendingRequest.preview && (
          <pre style={{
            fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
            borderRadius: 6, padding: '8px 10px', marginBottom: 10,
            whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 80, overflow: 'auto',
          }}>
            {pendingRequest.preview}
          </pre>
        )}
        {showModify ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus type="text" value={modification}
              onChange={e => setModification(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && modification.trim() && !submitting) handleConfirm('modify', { modification }); }}
              placeholder="Describe el cambio que quieres…"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, outline: 'none',
                border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                fontSize: 12, color: 'var(--text-primary)',
              }}
            />
            <button onClick={() => handleConfirm('modify', { modification })}
              disabled={submitting || !modification.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: modification.trim() ? 'var(--brand)' : 'var(--bg-tertiary)',
                color: modification.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600,
                cursor: modification.trim() && !submitting ? 'pointer' : 'not-allowed',
              }}>
              {submitting ? '…' : 'Enviar'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => handleConfirm('approve')} disabled={submitting}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'var(--brand)', color: '#fff',
                fontSize: 12, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
              Aprobar
            </button>
            <button onClick={() => setShowModify(true)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              Modificar
            </button>
            <button onClick={() => handleConfirm('reject')} disabled={submitting}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '0.5px solid rgba(220,38,38,0.3)',
                background: 'transparent', color: 'var(--danger)',
                fontSize: 12, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── New task ────────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <div style={{
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '8px 10px', marginBottom: 8,
      }}>
        <textarea
          ref={textareaRef} value={goal} onChange={handleGoalChange} rows={2}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleCreateTask(); }}
          placeholder="Describe el objetivo de la tarea para el agente…"
          disabled={creating}
          style={{
            width: '100%', resize: 'none', outline: 'none', border: 'none',
            background: 'transparent', color: 'var(--text-primary)',
            fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.5,
            minHeight: 44, maxHeight: 160,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {/* Mode selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                title={opt.description}
                style={{
                  padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  border: mode === opt.value ? 'none' : '0.5px solid var(--border)',
                  background: mode === opt.value ? 'var(--brand)' : 'transparent',
                  color: mode === opt.value ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          {/* Send button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <VoiceInput
              onTranscript={text => {
                setGoal(prev => {
                  const next = prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text;
                  setTimeout(() => {
                    const t = textareaRef.current;
                    if (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }
                  }, 0);
                  return next;
                });
              }}
              disabled={creating}
            />
            <button
              onClick={handleCreateTask}
              disabled={creating || !goal.trim()}
              aria-label="Crear tarea"
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none', flexShrink: 0,
                background: goal.trim() && !creating ? 'var(--brand)' : 'var(--bg-tertiary)',
                color: goal.trim() && !creating ? '#fff' : 'var(--text-muted)',
                cursor: goal.trim() && !creating ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {creating
                ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              }
            </button>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 10, textAlign: 'center', color: 'var(--text-muted)' }}>
        ⌘ + Enter para enviar · El agente solo usa tu documentación
      </p>
    </div>
  );
}
