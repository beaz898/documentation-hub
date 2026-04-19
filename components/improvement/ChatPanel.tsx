'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import ReanalyzeButtons from './ReanalyzeButtons';
import FilterMenu from './FilterMenu';
import type { ProblemType, Problem } from './problems';
import type { ChatMessage } from './useImprovementChat';
import { applyReplacement } from './useImprovementChat';

interface TypeMeta { label: string; color: string; bg: string; border: string }

interface ChatPanelProps {
  messages: ChatMessage[];
  sending: boolean;
  sendMessage: (userText: string, currentEditorText: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  currentText: string;
  onApplyText: (newText: string) => void;
  chatInput: string;
  setChatInput: (v: string) => void;

  onReanalyzeStyle: () => void;
  onReanalyzeAll: () => void;
  styleLoading: boolean;
  reanalyzingAll: boolean;

  problems: Problem[];
  visibleProblems: Problem[];
  allTypes: ProblemType[];
  activeTypes: Set<ProblemType>;
  typeMeta: Record<ProblemType, TypeMeta>;
  onToggleType: (t: ProblemType) => void;
  onSelectAllTypes: () => void;
  onClearTypes: () => void;
  getDocSourceBadge: (docName?: string) => { label: string; color: string } | null;
  onGoToProblem: (p: Problem) => void;
  onSolveOne: (p: Problem) => void;
  onSolveGroup: (type: ProblemType, problems: Problem[]) => void;
}

const GROUP_LABELS: Record<ProblemType, string> = {
  contradiccion: 'Contradicciones',
  duplicidad: 'Duplicidades',
  ortografia: 'Ortografía',
  ambiguedad: 'Ambigüedades',
  sugerencia: 'Sugerencias',
};

export default function ChatPanel({
  messages, sending, sendMessage, setMessages,
  currentText, onApplyText, chatInput, setChatInput,
  onReanalyzeStyle, onReanalyzeAll, styleLoading, reanalyzingAll,
  problems, visibleProblems, allTypes, activeTypes, typeMeta,
  onToggleType, onSelectAllTypes, onClearTypes,
  getDocSourceBadge, onGoToProblem, onSolveOne, onSolveGroup,
}: ChatPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  // Devolver el foco al textarea cuando el asistente termina de responder
  useEffect(() => {
    if (!sending) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [sending]);
  
  const labels = allTypes.reduce((acc, t) => { acc[t] = typeMeta[t].label; return acc; }, {} as Record<ProblemType, string>);

  const groupedProblems = useMemo(() => {
    const indexed = visibleProblems.map((p, globalIndex) => ({ p, globalIndex }));
    return allTypes
      .map(type => ({
        type,
        items: indexed.filter(({ p }) => p.type === type),
      }))
      .filter(g => g.items.length > 0);
  }, [visibleProblems, allTypes]);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || sending) return;
    setChatInput('');
    await sendMessage(text, currentText);
  };

  const handleApply = (msgId: string, idx: number, find: string, replace: string) => {
    const next = applyReplacement(currentText, find, replace);
    if (next === null) {
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId || !m.replacements) return m;
        return { ...m, replacements: m.replacements.map((r, i) => i === idx ? { ...r, failed: true } : r) };
      }));
      alert('No se pudo localizar el fragmento exacto en el texto.');
      return;
    }
    onApplyText(next);
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.replacements) return m;
      return { ...m, replacements: m.replacements.map((r, i) => i === idx ? { ...r, applied: true, failed: false } : r) };
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 120 }}>
          Asistente de mejora
        </span>
        <ReanalyzeButtons
          onReanalyzeStyle={onReanalyzeStyle}
          onReanalyzeAll={onReanalyzeAll}
          styleLoading={styleLoading}
          reanalyzingAll={reanalyzingAll}
        />
        <FilterMenu
          allTypes={allTypes}
          activeTypes={activeTypes}
          onToggle={onToggleType}
          onSelectAll={onSelectAllTypes}
          onClear={onClearTypes}
          labels={labels}
          totalCount={problems.length}
        />
      </div>

      {visibleProblems.length > 0 && (
        <div style={{
          padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 10,
          flexShrink: 0, maxHeight: 200, overflowY: 'auto',
        }}>
          {groupedProblems.map(({ type, items }) => {
            const meta = typeMeta[type];
            return (
              <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Encabezado de grupo con botón Resolver */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '2px 0',
                  borderBottom: `0.5px solid ${meta.border}`,
                  marginBottom: 2,
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: meta.color,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    flex: 1,
                  }}>
                    {GROUP_LABELS[type]} ({items.length})
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSolveGroup(type, items.map(({ p }) => p));
                    }}
                    disabled={sending}
                    title={`Resolver todos los problemas de ${GROUP_LABELS[type].toLowerCase()}`}
                    style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 4,
                      border: `0.5px solid ${meta.color}`,
                      background: meta.bg, color: meta.color,
                      cursor: sending ? 'not-allowed' : 'pointer',
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
                      opacity: sending ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >Resolver</button>
                </div>

                {/* Tarjetas del grupo */}
                {items.map(({ p, globalIndex }) => {
                  const srcBadge = getDocSourceBadge(p.relatedDoc);
                  const isClickable = !!p.textRef;
                  return (
                    <div
                      key={p.id}
                      onClick={isClickable ? () => onGoToProblem(p) : undefined}
                      title={isClickable ? 'Ir al fragmento en el texto' : undefined}
                      style={{
                        padding: '8px 10px', borderRadius: 7,
                        background: meta.bg, borderLeft: `3px solid ${meta.color}`,
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => {
                        if (isClickable) e.currentTarget.style.background = meta.border;
                      }}
                      onMouseLeave={e => {
                        if (isClickable) e.currentTarget.style.background = meta.bg;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: meta.color, letterSpacing: 0.3 }}>
                          {meta.label}
                        </span>
                        {srcBadge && (
                          <span style={{
                            fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
                            padding: '1px 5px', borderRadius: 3,
                            background: `${srcBadge.color}1a`, color: srcBadge.color,
                            border: `0.5px solid ${srcBadge.color}66`,
                          }}>{srcBadge.label}</span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>{p.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSolveOne(p); }}
                          disabled={sending}
                          title="Pedir solución al asistente"
                          style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                            border: `0.5px solid ${meta.color}`, background: 'transparent', color: meta.color,
                            cursor: sending ? 'not-allowed' : 'pointer',
                            fontWeight: 600, flexShrink: 0,
                            opacity: sending ? 0.5 : 1,
                          }}
                        >Solventar</button>
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{p.description}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        flex: '1 1 auto', overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 8, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'var(--brand-light)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, color: 'var(--brand)',
              }}>IA</div>
            )}
            <div style={{ maxWidth: '82%' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--brand)' : 'var(--bg-primary)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '0.5px solid var(--border)' : 'none',
                borderRadius: 10, padding: '8px 11px',
                fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{msg.content}</div>

              {msg.replacements && msg.replacements.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.replacements.map((r, i) => {
                    const stateBg = r.applied ? 'rgba(5,150,105,0.08)' : r.failed ? 'rgba(220,38,38,0.08)' : 'var(--bg-tertiary)';
                    const stateBorder = r.applied ? 'rgba(5,150,105,0.4)' : r.failed ? 'rgba(220,38,38,0.4)' : 'var(--border)';
                    return (
                      <div key={i} style={{ padding: '6px 9px', borderRadius: 7, background: stateBg, border: `0.5px solid ${stateBorder}` }}>
                        <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '0 0 3px', textTransform: 'uppercase', fontWeight: 600 }}>
                          {r.applied ? '✓ Aplicado' : r.failed ? '✗ No se pudo aplicar' : 'Propuesta de cambio'}
                        </p>
                        {r.find && (
                          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '0 0 2px', textDecoration: 'line-through' }}>
                            {r.find.slice(0, 140)}{r.find.length > 140 ? '…' : ''}
                          </p>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--text-primary)', margin: 0 }}>
                          {r.replace ? `→ ${r.replace.slice(0, 140)}${r.replace.length > 140 ? '…' : ''}` : '→ (eliminar)'}
                        </p>
                        {!r.applied && !r.failed && (
                          <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                            <button
                              onClick={() => handleApply(msg.id, i, r.find, r.replace)}
                              style={{
                                fontSize: 10, padding: '3px 8px', borderRadius: 5,
                                border: 'none', background: '#059669', color: '#fff',
                                cursor: 'pointer', fontWeight: 500,
                              }}
                            >Aplicar al texto</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--brand-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 600, color: 'var(--brand)',
            }}>IA</div>
            <div className="animate-spin" style={{
              width: 12, height: 12, border: '2px solid var(--brand)',
              borderTopColor: 'transparent', borderRadius: '50%',
            }} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--border)', flexShrink: 0, background: 'var(--bg-primary)' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 6,
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)', borderRadius: 9, padding: '6px 9px',
        }}>
          <textarea
            ref={inputRef}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Escribe una instrucción..."
            rows={1}
            disabled={sending}
            autoFocus
            style={{
              flex: 1, resize: 'none', outline: 'none', border: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: 12, fontFamily: 'var(--font-sans)',
              lineHeight: 1.5, maxHeight: 80, minHeight: 18,
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !chatInput.trim()}
            aria-label="Enviar"
            style={{
              width: 26, height: 26, borderRadius: 6, border: 'none',
              background: sending || !chatInput.trim() ? 'var(--bg-tertiary)' : 'var(--brand)',
              color: sending || !chatInput.trim() ? 'var(--text-muted)' : '#fff',
              cursor: sending || !chatInput.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
