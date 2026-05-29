'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import VoiceInput from '@/components/VoiceInput';
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
  onDismissProblem: (p: Problem) => void;
}

export default function ChatPanel({
  messages, sending, sendMessage, setMessages,
  currentText, onApplyText, chatInput, setChatInput,
  onReanalyzeStyle, onReanalyzeAll, styleLoading, reanalyzingAll,
  problems, visibleProblems, allTypes, activeTypes, typeMeta,
  onToggleType, onSelectAllTypes, onClearTypes,
  getDocSourceBadge, onGoToProblem, onSolveOne, onSolveGroup, onDismissProblem,
}: ChatPanelProps) {
  const t = useTranslations('analysis');

  // Translated labels for group headers (plural) and type badges
  const groupLabels: Record<ProblemType, string> = {
    contradiccion: t('contradictions'),
    inconsistencia_menor: t('inconsistencies'),
    duplicidad: t('duplicates'),
    ortografia: t('spelling'),
    ambiguedad: t('ambiguities'),
    sugerencia: t('suggestions'),
  };

  const typeLabels: Record<ProblemType, string> = {
    contradiccion: t('contradictionLabel'),
    inconsistencia_menor: t('inconsistenciaLabel'),
    duplicidad: t('duplicidadLabel'),
    ortografia: t('spelling'),
    ambiguedad: t('ambiguities'),
    sugerencia: t('suggestions'),
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<ProblemType>>(new Set());
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Set<string>>(new Set());

  const toggleSubGroup = (key: string) => {
    setCollapsedSubGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleGroupCollapse = (type: ProblemType) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    const prev = prevMsgCountRef.current;
    const curr = messages.length;
    if (curr > prev) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    prevMsgCountRef.current = curr;
  }, [messages]);

  useEffect(() => {
    if (sending) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sending]);

  useEffect(() => {
    if (!sending) setTimeout(() => inputRef.current?.focus(), 50);
  }, [sending]);

  // Labels for FilterMenu checkboxes (use group/plural labels)
  const filterLabels = allTypes.reduce((acc, type) => {
    acc[type] = groupLabels[type];
    return acc;
  }, {} as Record<ProblemType, string>);

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
      alert(t('cannotLocate'));
      return;
    }
    onApplyText(next);
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.replacements) return m;
      return { ...m, replacements: m.replacements.map((r, i) => i === idx ? { ...r, applied: true, failed: false } : r) };
    }));
  };

  return (
    <div className="flex-1 min-h-0" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', minWidth: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 120 }}>
          {t('improvementAssistant')}
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
          labels={filterLabels}
          totalCount={problems.length}
        />
      </div>

      {visibleProblems.length > 0 && (
        <div style={{
          padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 10,
          flexShrink: 0, maxHeight: 300, overflowY: 'auto',
        }}>
          {groupedProblems.map(({ type, items }) => {
            const meta = typeMeta[type];
            const isCollapsed = collapsedGroups.has(type);
            return (
              <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Group header: collapsible + solve button */}
                <div
                  onClick={() => toggleGroupCollapse(type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 0',
                    borderBottom: `0.5px solid ${meta.border}`,
                    marginBottom: 2,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <svg
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke={meta.color} strokeWidth="3"
                    style={{
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: meta.color,
                    textTransform: 'uppercase', letterSpacing: 0.4, flex: 1,
                  }}>
                    {groupLabels[type]} ({items.filter(({ p }) => !p.dismissed).length}{items.some(({ p }) => p.dismissed) ? `/${items.length}` : ''})
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const activeItems = items.filter(({ p }) => !p.dismissed).map(({ p }) => p);
                      if (activeItems.length > 0) onSolveGroup(type, activeItems);
                    }}
                    disabled={sending || items.every(({ p }) => p.dismissed)}
                    title={`${t('solveAll')} - ${groupLabels[type].toLowerCase()}`}
                    style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 4,
                      border: `0.5px solid ${meta.color}`,
                      background: meta.bg, color: meta.color,
                      cursor: sending ? 'not-allowed' : 'pointer',
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
                      opacity: sending ? 0.5 : 1, flexShrink: 0,
                    }}
                  >{t('solveAll')}</button>
                </div>

                {/* Group cards */}
                {!isCollapsed && (() => {
                  const activeItems = items.filter(({ p }) => !p.dismissed);

                  if (type === 'duplicidad') {
                    const subGroupMap = new Map<string, typeof activeItems>();
                    for (const item of activeItems) {
                      const key = item.p.relatedDoc || 'Sin documento';
                      if (!subGroupMap.has(key)) subGroupMap.set(key, []);
                      subGroupMap.get(key)!.push(item);
                    }
                    return [...subGroupMap.entries()].map(([docName, subItems]) => {
                      const subKey = `dup-sg-${docName}`;
                      const isSubCollapsed = collapsedSubGroups.has(subKey);
                      return (
                        <div key={docName} style={{ marginBottom: 3 }}>
                          <div
                            onClick={() => toggleSubGroup(subKey)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '4px 8px', borderRadius: 5, cursor: 'pointer', userSelect: 'none',
                              background: meta.bg, marginBottom: 2,
                            }}
                          >
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="3"
                              style={{ transform: isSubCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, flex: 1 }}>
                              {t('withDocument', { doc: docName })} ({t('fragmentCount', { count: subItems.length })})
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); onSolveGroup(type, subItems.map(({ p }) => p)); }}
                              disabled={sending}
                              style={{
                                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                border: `0.5px solid ${meta.color}`, background: 'transparent', color: meta.color,
                                cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600, flexShrink: 0, opacity: sending ? 0.5 : 1,
                              }}
                            >{t('solveAll')}</button>
                          </div>
                          {!isSubCollapsed && subItems.map(({ p }) => {
                            const srcBadge = getDocSourceBadge(p.relatedDoc);
                            const isClickable = !!p.textRef;
                            return (
                              <div
                                key={p.id}
                                onClick={isClickable ? () => onGoToProblem(p) : undefined}
                                title={isClickable ? t('goToFragment') : undefined}
                                style={{
                                  padding: '7px 10px', borderRadius: 7, marginBottom: 3,
                                  background: meta.bg, borderLeft: `3px solid ${meta.color}`,
                                  cursor: isClickable ? 'pointer' : 'default', transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = meta.border; }}
                                onMouseLeave={e => { if (isClickable) e.currentTarget.style.background = meta.bg; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
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
                                    onClick={(e) => { e.stopPropagation(); onDismissProblem(p); }}
                                    title={t('markNotError')}
                                    style={{
                                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                      border: '0.5px solid var(--text-muted)', background: 'transparent', color: 'var(--text-muted)',
                                      cursor: 'pointer', fontWeight: 500, flexShrink: 0,
                                    }}
                                  >{t('dismiss')}</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onSolveOne(p); }}
                                    disabled={sending}
                                    title={t('solve')}
                                    style={{
                                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                      border: `0.5px solid ${meta.color}`, background: 'transparent', color: meta.color,
                                      cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600, flexShrink: 0, opacity: sending ? 0.5 : 1,
                                    }}
                                  >{t('solve')}</button>
                                </div>
                                <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{p.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  }

                  return activeItems.map(({ p }) => {
                    const srcBadge = getDocSourceBadge(p.relatedDoc);
                    const isClickable = !!p.textRef;
                    return (
                      <div
                        key={p.id}
                        onClick={isClickable ? () => onGoToProblem(p) : undefined}
                        title={isClickable ? t('goToFragment') : undefined}
                        style={{
                          padding: '8px 10px', borderRadius: 7,
                          background: meta.bg, borderLeft: `3px solid ${meta.color}`,
                          cursor: isClickable ? 'pointer' : 'default',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = meta.border; }}
                        onMouseLeave={e => { if (isClickable) e.currentTarget.style.background = meta.bg; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: meta.color, letterSpacing: 0.3 }}>
                            {typeLabels[type]}
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
                            onClick={(e) => { e.stopPropagation(); onDismissProblem(p); }}
                            title={t('markNotError')}
                            style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 4,
                              border: '0.5px solid var(--text-muted)', background: 'transparent', color: 'var(--text-muted)',
                              cursor: 'pointer', fontWeight: 500, flexShrink: 0,
                            }}
                          >{t('dismiss')}</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSolveOne(p); }}
                            disabled={sending}
                            title={t('solve')}
                            style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 4,
                              border: `0.5px solid ${meta.color}`, background: 'transparent', color: meta.color,
                              cursor: sending ? 'not-allowed' : 'pointer',
                              fontWeight: 600, flexShrink: 0, opacity: sending ? 0.5 : 1,
                            }}
                          >{t('solve')}</button>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{p.description}</p>
                      </div>
                    );
                  });
                })()}

                {/* Dismissed subsection */}
                {!isCollapsed && items.some(({ p }) => p.dismissed) && (() => {
                  const dismissedItems = items.filter(({ p }) => p.dismissed);
                  const dismissedKey = `dismissed-${type}`;
                  const isDismissedCollapsed = collapsedGroups.has(dismissedKey as ProblemType);
                  return (
                    <div style={{ marginTop: 4 }}>
                      <div
                        onClick={() => toggleGroupCollapse(dismissedKey as ProblemType)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0',
                          cursor: 'pointer', userSelect: 'none',
                        }}
                      >
                        <svg
                          width="8" height="8" viewBox="0 0 24 24"
                          fill="none" stroke="var(--text-muted)" strokeWidth="3"
                          style={{
                            transform: isDismissedCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease', flexShrink: 0,
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {t('discardedCount', { count: dismissedItems.length })}
                        </span>
                      </div>
                      {!isDismissedCollapsed && dismissedItems.map(({ p }) => (
                        <div
                          key={p.id}
                          style={{
                            padding: '6px 10px', borderRadius: 7, marginTop: 3,
                            background: 'var(--bg-tertiary)', borderLeft: '3px solid var(--text-muted)',
                            opacity: 0.6,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 500, flex: 1, minWidth: 0,
                              color: 'var(--text-muted)', textDecoration: 'line-through',
                            }}>{p.title}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDismissProblem(p); }}
                              title={t('restoreError')}
                              style={{
                                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                border: '0.5px solid #059669',
                                background: 'rgba(5,150,105,0.08)', color: '#059669',
                                cursor: 'pointer', fontWeight: 500, flexShrink: 0,
                              }}
                            >{t('restore')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                          {r.applied ? t('applied') : r.failed ? t('failed') : t('proposedChange')}
                        </p>
                        {r.find && (
                          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '0 0 2px', textDecoration: 'line-through' }}>
                            {r.find.slice(0, 140)}{r.find.length > 140 ? '…' : ''}
                          </p>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--text-primary)', margin: 0 }}>
                          {r.replace ? `→ ${r.replace.slice(0, 140)}${r.replace.length > 140 ? '…' : ''}` : t('toDelete')}
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
                            >{t('applyText')}</button>
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
            placeholder={t('instructionPlaceholder')}
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
          <VoiceInput onTranscript={text => setChatInput(chatInput + (chatInput && !chatInput.endsWith(' ') ? ' ' : '') + text)} disabled={sending} />
          <button
            onClick={handleSend}
            disabled={sending || !chatInput.trim()}
            aria-label={t('instructionPlaceholder')}
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
