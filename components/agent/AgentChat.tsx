'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AgentTask, AgentStep, PendingRequest, ToolName } from '@/lib/agent/types';

interface AgentChatProps {
  task: AgentTask;
  onConfirm: (
    taskId: string,
    response: string,
    options?: { modification?: string; userInput?: string },
  ) => Promise<void>;
  onCancel: (taskId: string) => Promise<void>;
}

// ─── Tool display helpers ────────────────────────────────────────────────────

const TOOL_LABELS: Record<ToolName, string> = {
  search_docs:  'Buscando en documentos',
  read_doc:     'Leyendo documento',
  ask_user:     'Pregunta al usuario',
  escalate:     'Solicitando instrucciones',
  warn:         'Advertencia',
  finalize:     'Finalizando',
  list_docs:    'Consultando documentos',
  usage_stats:  'Consultando estadísticas',
};

function toolCallDetail(tool: ToolName, input: Record<string, unknown>): string {
  switch (tool) {
    case 'search_docs': return `"${String(input.query ?? '')}"`;
    case 'read_doc':    return String(input.doc_name ?? input.doc_id ?? '');
    case 'ask_user':    return String(input.question ?? '');
    case 'escalate':    return String(input.reason ?? '');
    case 'warn':        return String(input.message ?? '');
    case 'finalize':    return 'Generando resultado final…';
    default:            return '';
  }
}

function toolResultDetail(tool: ToolName, output: Record<string, unknown>, isError?: boolean): string {
  if (isError) return String(output.error ?? 'Error desconocido');
  switch (tool) {
    case 'search_docs': {
      const n = (output.results as unknown[] | undefined)?.length ?? 0;
      return n > 0 ? `${n} fragmento${n > 1 ? 's' : ''} encontrado${n > 1 ? 's' : ''}` : 'Sin resultados relevantes';
    }
    case 'read_doc':  return 'Documento leído';
    case 'finalize':  return 'Listo';
    default:          return 'Completado';
  }
}

// ─── Step renderer ───────────────────────────────────────────────────────────

function StepRow({ step }: { step: AgentStep }) {
  if (step.type === 'think') {
    const preview = step.content.length > 200 ? step.content.slice(0, 200) + '…' : step.content;
    return (
      <div style={{ padding: '4px 16px 8px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
          {preview}
        </p>
      </div>
    );
  }

  if (step.type === 'tool_call') {
    const detail = toolCallDetail(step.tool_name, step.input);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '6px 16px 2px' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1px' }}>
            {TOOL_LABELS[step.tool_name]}
          </p>
          {detail && (
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {detail}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step.type === 'tool_result') {
    const detail = toolResultDetail(step.tool_name, step.output, step.is_error);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 16px 8px', paddingLeft: 47 }}>
        {step.is_error ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        <p style={{ fontSize: 10, color: step.is_error ? 'var(--danger)' : 'var(--text-muted)', margin: 0 }}>
          {detail}
        </p>
      </div>
    );
  }

  if (step.type === 'user_message') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 16px 8px' }}>
        <div style={{
          maxWidth: '78%', padding: '8px 12px', borderRadius: '10px 10px 2px 10px',
          background: 'var(--brand)', color: '#fff', fontSize: 12, lineHeight: 1.5,
        }}>
          {step.content}
        </div>
      </div>
    );
  }

  if (step.type === 'warning') {
    return (
      <div style={{
        margin: '4px 16px 8px', padding: '8px 12px', borderRadius: 8,
        background: 'rgba(217,119,6,0.08)', border: '0.5px solid rgba(217,119,6,0.3)',
        fontSize: 11, color: '#92400e', lineHeight: 1.5,
      }}>
        ⚠️ {step.message}
      </div>
    );
  }

  if (step.type === 'escalation') {
    const choiceLabel = step.user_choice === 'stop' ? 'Detenido'
      : step.user_choice === 'ask_more' ? 'Permitir preguntas'
      : step.user_choice === 'improvise' ? 'Improvisar'
      : null;
    return (
      <div style={{
        margin: '4px 16px 8px', padding: '8px 12px', borderRadius: 8,
        background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        <strong>Sin información suficiente:</strong> {step.reason}
        {choiceLabel && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>→ {choiceLabel}</span>}
      </div>
    );
  }

  if (step.type === 'confirmation_request') {
    return (
      <div style={{
        margin: '4px 16px 8px', padding: '8px 12px', borderRadius: 8,
        background: 'rgba(99,102,241,0.06)', border: '0.5px solid rgba(99,102,241,0.2)',
        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        <strong>Confirmación solicitada:</strong> {step.pending_action}
      </div>
    );
  }

  if (step.type === 'confirmation_response') {
    const labels = { approve: 'Aprobado', reject: 'Rechazado', modify: 'Modificado' };
    const colors = { approve: '#059669', reject: 'var(--danger)', modify: 'var(--brand)' };
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 16px 6px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: colors[step.response] }}>
          ✓ {labels[step.response]}{step.modification ? `: "${step.modification}"` : ''}
        </span>
      </div>
    );
  }

  if (step.type === 'final_output') {
    return (
      <div style={{
        margin: '8px 16px', padding: '14px 16px', borderRadius: 10,
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Resultado</p>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
          <ReactMarkdown>{step.output}</ReactMarkdown>
        </div>
        {step.citations.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>Fuentes</p>
            {step.citations.map((c, i) => (
              <p key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0' }}>· {c.doc_name}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Pending request panel ───────────────────────────────────────────────────

function PendingRequestPanel({ taskId, request, onConfirm }: {
  taskId: string;
  request: PendingRequest;
  onConfirm: AgentChatProps['onConfirm'];
}) {
  const [userInput, setUserInput]     = useState('');
  const [modification, setModification] = useState('');
  const [showModify, setShowModify]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  async function submit(response: string, options?: { modification?: string; userInput?: string }) {
    setSubmitting(true);
    await onConfirm(taskId, response, options);
    setSubmitting(false);
  }

  const panelStyle: React.CSSProperties = {
    padding: '12px 16px', borderTop: '0.5px solid var(--border)',
    background: 'var(--bg)', flexShrink: 0,
  };

  if (request.type === 'user_input') {
    return (
      <div style={panelStyle}>
        <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.5 }}>
          {request.question}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus type="text" value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && userInput.trim() && !submitting) submit('user_input', { userInput }); }}
            placeholder="Tu respuesta…"
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, outline: 'none',
              border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
              fontSize: 12, color: 'var(--text-primary)',
            }}
          />
          <button onClick={() => submit('user_input', { userInput })}
            disabled={submitting || !userInput.trim()}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: userInput.trim() ? 'var(--brand)' : 'var(--bg-tertiary)',
              color: userInput.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600,
              cursor: userInput.trim() && !submitting ? 'pointer' : 'not-allowed',
            }}>
            {submitting ? '…' : 'Enviar'}
          </button>
        </div>
      </div>
    );
  }

  if (request.type === 'escalation') {
    const OPT: Record<string, { label: string; brand?: boolean }> = {
      stop:      { label: 'Detener' },
      ask_more:  { label: 'Permitir preguntas', brand: true },
      improvise: { label: 'Improvisar' },
    };
    return (
      <div style={panelStyle}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
          <strong>El agente no puede continuar:</strong> {request.reason}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {request.options.map(opt => {
            const cfg = OPT[opt] ?? { label: opt };
            return (
              <button key={opt} onClick={() => submit(opt)} disabled={submitting}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: cfg.brand ? 'none' : '0.5px solid var(--border)',
                  background: cfg.brand ? 'var(--brand)' : 'var(--bg-tertiary)',
                  color: cfg.brand ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                }}>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (request.type === 'confirmation') {
    return (
      <div style={panelStyle}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>El agente quiere:</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: request.preview ? 8 : 12, lineHeight: 1.5 }}>
          {request.pending_action}
        </p>
        {request.preview && (
          <pre style={{
            fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)',
            borderRadius: 6, padding: '8px 10px', marginBottom: 12,
            whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 100, overflow: 'auto',
          }}>
            {request.preview}
          </pre>
        )}
        {showModify ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus type="text" value={modification}
              onChange={e => setModification(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && modification.trim() && !submitting) submit('modify', { modification }); }}
              placeholder="Describe el cambio que quieres…"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, outline: 'none',
                border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                fontSize: 12, color: 'var(--text-primary)',
              }}
            />
            <button onClick={() => submit('modify', { modification })}
              disabled={submitting || !modification.trim()}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
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
            <button onClick={() => submit('approve')} disabled={submitting}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: 'var(--brand)', color: '#fff',
                fontSize: 12, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
              Aprobar
            </button>
            <button onClick={() => setShowModify(true)} disabled={submitting}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              Modificar
            </button>
            <button onClick={() => submit('reject')} disabled={submitting}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '0.5px solid rgba(220,38,38,0.3)',
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

  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────

const TERMINAL = new Set(['completed', 'failed', 'cancelled']);

export default function AgentChat({ task, onConfirm, onCancel }: AgentChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.steps.length, task.status]);

  const isTerminal = TERMINAL.has(task.status);
  const steps: AgentStep[] = Array.isArray(task.steps) ? task.steps : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Goal header */}
      <div style={{
        padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
            Objetivo
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
            {task.goal}
          </p>
        </div>
        {!isTerminal && (
          <button onClick={() => onCancel(task.id)}
            style={{
              padding: '5px 12px', borderRadius: 7, flexShrink: 0,
              border: '0.5px solid rgba(220,38,38,0.3)', background: 'transparent',
              color: 'var(--danger)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
            Cancelar
          </button>
        )}
      </div>

      {/* Steps scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>

        {steps.length === 0 && !isTerminal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '28px 20px', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{
              width: 14, height: 14, border: '2px solid var(--brand)',
              borderTopColor: 'transparent', borderRadius: '50%', flexShrink: 0,
            }} />
            <span style={{ fontSize: 12 }}>Iniciando…</span>
          </div>
        )}

        {steps.map((step, i) => <StepRow key={i} step={step} />)}

        {task.status === 'running' && steps.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
            <div className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trabajando…</span>
          </div>
        )}

        {task.status === 'failed' && task.error_message && (
          <div style={{
            margin: '8px 16px', padding: '12px 14px', borderRadius: 10,
            background: 'rgba(220,38,38,0.06)', border: '0.5px solid rgba(220,38,38,0.25)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>Error</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {task.error_message}
            </p>
          </div>
        )}

        {task.status === 'cancelled' && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
            Tarea cancelada
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Pending request */}
      {task.pending_request && (
        <PendingRequestPanel taskId={task.id} request={task.pending_request} onConfirm={onConfirm} />
      )}

    </div>
  );
}
