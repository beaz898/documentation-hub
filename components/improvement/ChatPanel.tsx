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
    setTimeout(() => inputRef.current?.focus(), 0);
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
                  borderBottom: `0.5px solid ${meta.bord
