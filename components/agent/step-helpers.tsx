'use client';

// Helpers puros para renderizar un AgentStep individual.

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentStep, ToolName, ToolResultStep, ThinkStep, ToolCallStep,
  UserMessageStep, WarningStep, EscalationStep,
  ConfirmationRequestStep, ConfirmationResponseStep, FinalOutputStep,
} from '@/lib/agent/types';

// ── Etiquetas de herramientas ─────────────────────────────────────────────────

export const TOOL_LABELS: Record<ToolName, string> = {
  search_docs:  'Buscando en documentos',
  read_doc:     'Leyendo documento',
  ask_user:     'Pregunta al usuario',
  escalate:     'Solicitando instrucciones',
  warn:         'Advertencia',
  finalize:     'Finalizando',
  list_docs:    'Consultando documentos',
  usage_stats:  'Consultando estadísticas',
};

export function toolCallDetail(tool: ToolName, input: Record<string, unknown>): string {
  switch (tool) {
    case 'search_docs': return `"${String(input.query ?? '')}"`;
    case 'read_doc':    return String(input.doc_name ?? input.doc_id ?? '');
    case 'ask_user':    return String(input.question ?? '');
    case 'escalate':    return String(input.reason ?? '');
    case 'warn':        return String(input.message ?? '');
    case 'finalize':    return 'Generando resultado final…';
    case 'list_docs': {
      const parts: string[] = [];
      if (input.source)      parts.push(String(input.source));
      if (input.folder_path) parts.push(String(input.folder_path));
      return parts.length ? parts.join(' · ') : 'todos los documentos';
    }
    case 'usage_stats': {
      const parts: string[] = [];
      if (input.doc_name) parts.push(String(input.doc_name));
      if (input.days)     parts.push(`${String(input.days)} días`);
      return parts.length ? parts.join(' · ') : 'corpus completo';
    }
    default:            return '';
  }
}

export function toolResultDetail(
  tool: ToolName,
  output: Record<string, unknown>,
  isError?: boolean,
): string {
  if (isError) return String(output.error ?? 'Error desconocido');
  switch (tool) {
    case 'search_docs': {
      const n = (output.results as unknown[] | undefined)?.length ?? 0;
      return n > 0
        ? `${n} fragmento${n > 1 ? 's' : ''} encontrado${n > 1 ? 's' : ''}`
        : 'Sin resultados relevantes';
    }
    case 'read_doc':  return 'Documento leído';
    case 'finalize':  return 'Listo';
    default:          return 'Completado';
  }
}

// ── ImprovisedWarnBadge ───────────────────────────────────────────────────────

function ImprovisedWarnBadge({ message }: { message: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#d97706" strokeWidth="2" style={{ cursor: 'default' }}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        {hover && (
          <div style={{
            position: 'absolute', bottom: '120%', left: 0,
            background: '#1c1917', color: '#fef3c7',
            padding: '8px 12px', borderRadius: 8,
            fontSize: 11, lineHeight: 1.5,
            width: 260, whiteSpace: 'normal',
            zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}>
            {message}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: '#d97706', fontStyle: 'italic' }}>
        Conocimiento general
      </span>
    </div>
  );
}

// ── StepRow ───────────────────────────────────────────────────────────────────

export function StepRow({ step }: { step: AgentStep }) {
  if (step.type === 'think') {
    const s = step as ThinkStep;
    const preview = s.content.length > 200 ? s.content.slice(0, 200) + '…' : s.content;
    return (
      <div style={{ padding: '4px 16px 8px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
          {preview}
        </p>
      </div>
    );
  }

  if (step.type === 'tool_call') {
    const s      = step as ToolCallStep;
    const detail = toolCallDetail(s.tool_name, s.input);
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
            {TOOL_LABELS[s.tool_name]}
          </p>
          {detail && (
            <p style={{
              fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {detail}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step.type === 'tool_result') {
    const s      = step as ToolResultStep;
    const detail = toolResultDetail(s.tool_name, s.output, s.is_error);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 16px 8px', paddingLeft: 47 }}>
        {s.is_error ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        <p style={{ fontSize: 10, color: s.is_error ? 'var(--danger)' : 'var(--text-muted)', margin: 0 }}>
          {detail}
        </p>
      </div>
    );
  }

  if (step.type === 'user_message') {
    const s = step as UserMessageStep;
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 16px 8px' }}>
        <div style={{
          maxWidth: '78%', padding: '8px 12px', borderRadius: '10px 10px 2px 10px',
          background: 'var(--brand)', color: '#fff', fontSize: 12, lineHeight: 1.5,
        }}>
          {s.content}
        </div>
      </div>
    );
  }

  if (step.type === 'warning') {
    const s = step as WarningStep;
    if (s.kind === 'improvised') return <ImprovisedWarnBadge message={s.message} />;
    return (
      <div style={{
        margin: '4px 16px 8px', padding: '8px 12px', borderRadius: 8,
        background: 'rgba(217,119,6,0.08)', border: '0.5px solid rgba(217,119,6,0.3)',
        fontSize: 11, color: '#92400e', lineHeight: 1.5,
      }}>
        ⚠️ {s.message}
      </div>
    );
  }

  if (step.type === 'escalation') {
    const s = step as EscalationStep;
    const choiceLabel = s.user_choice === 'stop'      ? 'Detenido'
                      : s.user_choice === 'ask_more'  ? 'Permitir preguntas'
                      : s.user_choice === 'improvise' ? 'Improvisar'
                      : null;
    return (
      <div style={{
        margin: '4px 16px 8px', padding: '8px 12px', borderRadius: 8,
        background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        <strong>Sin información suficiente:</strong> {s.reason}
        {choiceLabel && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>→ {choiceLabel}</span>}
      </div>
    );
  }

  if (step.type === 'confirmation_request') {
    const s = step as ConfirmationRequestStep;
    return (
      <div style={{
        margin: '4px 16px 8px', padding: '8px 12px', borderRadius: 8,
        background: 'rgba(99,102,241,0.06)', border: '0.5px solid rgba(99,102,241,0.2)',
        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        <strong>Confirmación solicitada:</strong> {s.pending_action}
      </div>
    );
  }

  if (step.type === 'confirmation_response') {
    const s      = step as ConfirmationResponseStep;
    const labels = { approve: 'Aprobado', reject: 'Rechazado', modify: 'Modificado' } as const;
    const colors = { approve: '#059669', reject: 'var(--danger)', modify: 'var(--brand)' } as const;
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 16px 6px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: colors[s.response] }}>
          ✓ {labels[s.response]}{s.modification ? `: "${s.modification}"` : ''}
        </span>
      </div>
    );
  }

  if (step.type === 'final_output') {
    const s = step as FinalOutputStep;
    return (
      <div style={{
        margin: '8px 16px', padding: '14px 16px', borderRadius: 10,
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Resultado</p>
        <div className="prose-chat" style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.output}</ReactMarkdown>
        </div>
        {s.citations.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>Fuentes</p>
            {s.citations.map((c, i) => (
              <p key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0' }}>· {c.doc_name}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
