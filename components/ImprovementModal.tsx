'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import EditorPanel from './improvement/EditorPanel';
import ChatPanel from './improvement/ChatPanel';
import ReplaceDialog from './improvement/ReplaceDialog';
import { useImprovementChat, findTolerant } from './improvement/useImprovementChat';
import { useStyleAnalysis } from './improvement/useStyleAnalysis';
import { useCrossDocAnalysis } from './improvement/useCrossDocAnalysis';
import { useIndexing } from './improvement/useIndexing';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Problem, ProblemType, RawAnalysis } from './improvement/problems';

/** Returns the full paragraph (bounded by \n\n) that contains `fragment`. */
function findParagraphContaining(text: string, fragment: string): string | null {
  const range = findTolerant(text, fragment);
  if (!range) return null;
  const beforeSlice = text.lastIndexOf('\n\n', range.start);
  const start = beforeSlice === -1 ? 0 : beforeSlice + 2;
  const afterSlice = text.indexOf('\n\n', range.end);
  const end = afterSlice === -1 ? text.length : afterSlice;
  return text.slice(start, end).trim() || null;
}

interface ExistingDocForDialog {
  id: string;
  name: string;
}

interface AnalysisStyleProblem {
  type: Problem['type'];
  title: string;
  description: string;
  textRef: string;
}

interface ImprovementModalProps {
  fileName: string;
  initialText: string;
  analysis: RawAnalysis & { styleProblems?: AnalysisStyleProblem[] };
  documentSources?: Record<string, string[]>;
  storagePath: string;
  existingDocWithSameName?: ExistingDocForDialog | null;
  accessToken: string;
  onClose: () => void;
  onIndexed: (docName: string, wasReplaced: boolean) => void;
  onMinimize?: () => void;
  onReanalysisChange?: (running: boolean, phase: string) => void;
}

// TYPE_META labels kept in Spanish — used in buildProblemsSummary which is passed to the LLM
const TYPE_META: Record<ProblemType, { label: string; color: string; bg: string; border: string }> = {
  contradiccion:        { label: 'Contradicción',        color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.35)' },
  inconsistencia_menor: { label: 'Inconsistencia menor', color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.35)' },
  duplicidad:           { label: 'Duplicidad',           color: '#ea580c', bg: 'rgba(234,88,12,0.08)',  border: 'rgba(234,88,12,0.35)' },
  ortografia:           { label: 'Ortografía',           color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.35)' },
  ambiguedad:           { label: 'Ambigüedad',           color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.35)' },
  sugerencia:           { label: 'Sugerencia',           color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.35)' },
};

const ALL_TYPES: ProblemType[] = ['contradiccion', 'inconsistencia_menor', 'duplicidad', 'ortografia', 'ambiguedad', 'sugerencia'];

function buildProblemsSummary(problems: Problem[]): string {
  if (problems.length === 0) return '(ningún problema detectado)';
  return problems
    .map((p, i) => `${i + 1}. [${TYPE_META[p.type].label}] ${p.title}: ${p.description}`)
    .join('\n');
}

export default function ImprovementModal(props: ImprovementModalProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  if (isMobile) {
    return <ImprovementMobileNotice onClose={props.onMinimize ?? props.onClose} />;
  }
  return <ImprovementModalDesktop {...props} />;
}

function ImprovementMobileNotice({ onClose }: { onClose: () => void }) {
  const t = useTranslations('improvement');
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 12px 30px rgba(0,0,0,0.25)',
          padding: '28px 24px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'var(--brand-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>

        <h2 style={{
          fontSize: 17, fontWeight: 600, color: 'var(--text-primary)',
          margin: '0 0 10px',
        }}>
          {t('mobileNoticeTitle')}
        </h2>

        <p style={{
          fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)',
          margin: '0 0 22px', maxWidth: 340,
        }}>
          {t('mobileNoticeBody')}
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 9,
            border: 'none', background: 'var(--brand)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {t('mobileNoticeButton')}
        </button>
      </div>
    </div>
  );
}

function ImprovementModalDesktop({
  fileName,
  initialText,
  analysis,
  documentSources,
  storagePath,
  existingDocWithSameName,
  accessToken,
  onClose,
  onIndexed,
  onMinimize,
  onReanalysisChange,
}: ImprovementModalProps) {
  const t = useTranslations('improvement');
  const ta = useTranslations('analysis');

  const [text, setText] = useState(initialText);
  const editorRef = useRef<HTMLDivElement>(null);

  const textRef = useRef(text);
  textRef.current = text;

  const {
    messages: chatMessages,
    sending: chatSending,
    sendMessage,
    addAssistantMessage,
    setMessages: setChatMessages,
  } = useImprovementChat(accessToken);
  const [chatInput, setChatInput] = useState('');

  const {
    crossDocProblems,
    setCrossDocProblems,
    reanalyzeAll,
    reanalyzingAll,
    reanalyzePhase,
    dismissProblem,
  } = useCrossDocAnalysis(analysis, accessToken);

  const {
    styleProblems,
    setStyleProblems,
    reanalyzeStyle,
    styleLoading,
  } = useStyleAnalysis({
    initialText,
    fileName,
    accessToken,
    initialStyleProblems: analysis.styleProblems,
  });

  useEffect(() => {
    const running = reanalyzingAll || styleLoading;
    const phase = reanalyzingAll
      ? (reanalyzePhase ?? 'Reanalizando corpus...')
      : styleLoading
        ? 'Reanalizando estilo...'
        : '';
    onReanalysisChange?.(running, phase);
  }, [reanalyzingAll, styleLoading, reanalyzePhase, onReanalysisChange]);

  const problems = useMemo<Problem[]>(
    () => [...crossDocProblems, ...styleProblems],
    [crossDocProblems, styleProblems]
  );

  const problemsSummary = useMemo(
    () => buildProblemsSummary(problems),
    [problems]
  );

  const [activeTypes, setActiveTypes] = useState<Set<ProblemType>>(
    () => new Set(ALL_TYPES)
  );

  const visibleProblems = useMemo(
    () => problems.filter(p => activeTypes.has(p.type)),
    [problems, activeTypes]
  );

  const toggleType = useCallback((type: ProblemType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const selectAllTypes = useCallback(() => setActiveTypes(new Set(ALL_TYPES)), []);
  const clearTypes = useCallback(() => setActiveTypes(new Set()), []);

  const didWelcomeRef = useRef(false);
  useEffect(() => {
    if (didWelcomeRef.current) return;
    const allInitial = [...crossDocProblems, ...styleProblems];
    if (allInitial.length === 0) {
      didWelcomeRef.current = true;
      return;
    }
    didWelcomeRef.current = true;
    const summary = allInitial
      .map((p, i) => `${i + 1}. [${TYPE_META[p.type].label}] ${p.title}`)
      .join('\n');
    addAssistantMessage(
      `He detectado ${allInitial.length} problema${allInitial.length !== 1 ? 's' : ''} en el documento:\n\n${summary}\n\n¿Por dónde quieres empezar? Puedo proponer correcciones concretas, explicarte cualquier punto, borrar fragmentos o reescribir partes a tu gusto.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDocSourceBadge = useCallback(
    (docName?: string): { label: string; color: string } | null => {
      if (!docName || !documentSources) return null;
      const sources = documentSources[docName];
      if (!sources || sources.length === 0) return null;
      if (sources.length > 1) return { label: 'Drive+Manual', color: '#6b7280' };
      return sources[0] === 'google_drive'
        ? { label: 'Drive', color: '#2563eb' }
        : { label: 'Manual', color: '#7c3aed' };
    },
    [documentSources]
  );

  const goToProblem = useCallback((p: Problem) => {
    if (!p.textRef) return;
    const currentText = textRef.current;
    const range = findTolerant(currentText, p.textRef);
    if (!range) {
      alert(ta('fragmentNotFound'));
      return;
    }
    const ta2 = editorRef.current?.querySelector('textarea') as HTMLTextAreaElement | null;
    if (!ta2) return;
    ta2.focus();
    ta2.setSelectionRange(range.start, range.end);

    const ratio = range.start / Math.max(1, currentText.length);
    const maxScroll = ta2.scrollHeight - ta2.clientHeight;
    const targetScroll = ratio * ta2.scrollHeight - ta2.clientHeight / 3;
    ta2.scrollTop = Math.max(0, Math.min(maxScroll, targetScroll));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSolveOne = useCallback((p: Problem) => {
    if (p.type === 'duplicidad') {
      const fragment = p.textRef;
      if (!fragment) {
        addAssistantMessage(t('duplicateMissingRef'));
        return;
      }
      const paragraph = findParagraphContaining(textRef.current, fragment);
      if (!paragraph) {
        addAssistantMessage(t('duplicateNotFound'));
        return;
      }
      setChatMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: 'user', content: `Resolver duplicidad: ${p.title}` },
        {
          id: `a-${Date.now()}-${Math.random()}`, role: 'assistant',
          content: `Para resolver la duplicidad con "${p.relatedDoc || 'documento externo'}", propongo eliminar el siguiente párrafo:`,
          replacements: [{ find: paragraph, replace: '', applied: false, failed: false }],
        },
      ]);
      return;
    }
    const typeLabel = TYPE_META[p.type].label.toLowerCase();
    const message = `Resuelve el siguiente problema de tipo ${typeLabel} en el TEXTO_ACTUAL. Propón los cambios necesarios con bloques REPLACEMENT:\n\nTítulo: ${p.title}\nDescripción: ${p.description}${p.relatedDoc ? `\nDocumento relacionado: ${p.relatedDoc}` : ''}`;
    sendMessage(message, textRef.current, fileName, problemsSummary);
  }, [sendMessage, fileName, problemsSummary, addAssistantMessage, setChatMessages, t]);

  const handleSolveGroup = useCallback((type: ProblemType, groupProblems: Problem[]) => {
    if (type === 'duplicidad') {
      const currentText = textRef.current;
      const replacements: Array<{ find: string; replace: string; applied: boolean; failed: boolean }> = [];
      for (const p of groupProblems) {
        if (!p.textRef) continue;
        const paragraph = findParagraphContaining(currentText, p.textRef);
        if (paragraph && !replacements.some(r => r.find === paragraph)) {
          replacements.push({ find: paragraph, replace: '', applied: false, failed: false });
        }
      }
      if (replacements.length === 0) {
        addAssistantMessage('No se pudieron localizar los fragmentos duplicados en el texto.');
        return;
      }
      setChatMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: 'user', content: `Resolver todas las duplicidades (${replacements.length} fragmento${replacements.length !== 1 ? 's' : ''})` },
        {
          id: `a-${Date.now()}-${Math.random()}`, role: 'assistant',
          content: `He generado ${replacements.length} propuesta${replacements.length !== 1 ? 's' : ''} para eliminar el contenido duplicado. Aplica cada cambio:`,
          replacements,
        },
      ]);
      return;
    }
    const typeLabel = TYPE_META[type].label.toLowerCase();
    const list = groupProblems
      .map((p, i) => `${i + 1}. ${p.title}: ${p.description}${p.relatedDoc ? ` (doc: ${p.relatedDoc})` : ''}`)
      .join('\n');
    const message = `Resuelve TODOS los problemas de tipo ${typeLabel} detectados en el TEXTO_ACTUAL. Genera UN BLOQUE REPLACEMENT POR CADA cambio necesario, no resumas en uno solo:\n\n${list}`;
    sendMessage(message, textRef.current, fileName, problemsSummary);
  }, [sendMessage, fileName, problemsSummary, addAssistantMessage, setChatMessages]);

  const handleDismissProblem = useCallback((p: Problem) => {
    if (p.type === 'ortografia' || p.type === 'ambiguedad' || p.type === 'sugerencia') {
      setStyleProblems(prev =>
        prev.map(sp => sp.id === p.id ? { ...sp, dismissed: !sp.dismissed } : sp)
      );
      const isDismissing = !p.dismissed;
      addAssistantMessage(isDismissing
        ? t('problemDismissed', { title: p.title })
        : t('problemRestored', { title: p.title })
      );
    } else {
      const isDismissing = dismissProblem(p.id, p.textRef, p.relatedDoc);
      addAssistantMessage(isDismissing
        ? t('problemDismissedPersist', { title: p.title })
        : t('problemRestoredPersist', { title: p.title })
      );
    }
  }, [dismissProblem, setStyleProblems, addAssistantMessage, t]);

  const handleManualSend = useCallback(async (userText: string, currentEditorText: string) => {
    await sendMessage(userText, currentEditorText, fileName, problemsSummary);
  }, [sendMessage, fileName, problemsSummary]);

  const handleReanalyzeStyle = useCallback(async () => {
    const prevCount = styleProblems.length;
    await reanalyzeStyle(textRef.current, fileName);
    setStyleProblems(curr => {
      const diff = curr.length - prevCount;
      let msg: string;
      if (diff === 0) {
        msg = 'He reanalizado el estilo. No hay cambios respecto al análisis anterior.';
      } else if (diff > 0) {
        msg = `He reanalizado el estilo. ${diff} problema${diff !== 1 ? 's' : ''} nuevo${diff !== 1 ? 's' : ''}, ${curr.length} pendiente${curr.length !== 1 ? 's' : ''} en total.`;
      } else {
        msg = `He reanalizado el estilo. ${Math.abs(diff)} problema${Math.abs(diff) !== 1 ? 's' : ''} resuelto${Math.abs(diff) !== 1 ? 's' : ''}, ${curr.length} pendiente${curr.length !== 1 ? 's' : ''} en total.`;
      }
      addAssistantMessage(msg);
      return curr;
    });
  }, [styleProblems.length, reanalyzeStyle, setStyleProblems, addAssistantMessage, fileName]);

  const handleReanalyzeAll = useCallback(async () => {
    const result = await reanalyzeAll(textRef.current, fileName);
    if (!result) {
      addAssistantMessage(t('reanalyzeFailed'));
      return;
    }

    const parts: string[] = ['He reanalizado contradicciones y duplicados contra el corpus.'];
    parts.push(`📋 ${result.activeCount} problema${result.activeCount !== 1 ? 's' : ''} activo${result.activeCount !== 1 ? 's' : ''}.`);
    if (result.dismissedCount > 0) {
      parts.push(`🚫 ${result.dismissedCount} descartado${result.dismissedCount !== 1 ? 's' : ''} anteriormente.`);
    }
    if (styleProblems.length > 0) {
      parts.push(`\n💡 ${styleProblems.length} problema${styleProblems.length !== 1 ? 's' : ''} de estilo pendiente${styleProblems.length !== 1 ? 's' : ''}. Usa "Reanalizar estilo" para actualizarlos.`);
    }
    addAssistantMessage(parts.join('\n'));
  }, [reanalyzeAll, fileName, styleProblems.length, addAssistantMessage, t]);

  const {
    indexing,
    showReplaceDialog,
    setShowReplaceDialog,
    doIndex,
  } = useIndexing({
    fileName,
    storagePath,
    accessToken,
    existingDocWithSameName,
    onIndexed,
  });

  const handleIndexClick = useCallback(() => {
    if (existingDocWithSameName) {
      setShowReplaceDialog(true);
    } else {
      doIndex(text, false);
    }
  }, [existingDocWithSameName, setShowReplaceDialog, doIndex, text]);

  const handleCloseRequest = useCallback(() => {
    if (window.confirm(t('discardConfirm'))) {
      onClose();
    }
  }, [onClose, t]);

  return (
    <div
      className="p-0 md:p-5"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full h-full rounded-none md:max-w-[1200px] md:h-[90vh] md:max-h-[900px] md:rounded-[14px]"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 12px 30px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
          background: 'var(--bg)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--brand-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t('titleWithFile', { fileName })}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {t('problemsDetected', { count: problems.length })}
            </p>
          </div>
          <button
            onClick={onMinimize ?? handleCloseRequest}
            aria-label={t('minimize')}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* MAIN GRID */}
        <div
          className="flex-1 flex flex-col md:grid md:grid-cols-2 min-h-0 overflow-hidden"
          style={{ background: 'var(--bg)' }}
        >
          {/* EDITOR PANEL */}
          <div
            ref={editorRef}
            className="order-2 md:order-1 flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden"
            style={{
              borderRight: '0.5px solid var(--border)',
              padding: '10px 16px',
              background: 'var(--bg)',
            }}
          >
            <EditorPanel value={text} onChange={setText} fileName={fileName} />
          </div>

          {/* CHAT PANEL */}
          <div className="order-1 md:order-2 flex flex-col flex-1 min-h-0 overflow-hidden">
          <ChatPanel
            messages={chatMessages}
            sending={chatSending}
            sendMessage={handleManualSend}
            setMessages={setChatMessages}
            currentText={text}
            onApplyText={setText}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onReanalyzeStyle={handleReanalyzeStyle}
            onReanalyzeAll={handleReanalyzeAll}
            styleLoading={styleLoading}
            reanalyzingAll={reanalyzingAll}
            problems={problems}
            visibleProblems={visibleProblems}
            allTypes={ALL_TYPES}
            activeTypes={activeTypes}
            typeMeta={TYPE_META}
            onToggleType={toggleType}
            onSelectAllTypes={selectAllTypes}
            onClearTypes={clearTypes}
            getDocSourceBadge={getDocSourceBadge}
            onGoToProblem={goToProblem}
            onSolveOne={handleSolveOne}
            onSolveGroup={handleSolveGroup}
            onDismissProblem={handleDismissProblem}
          />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{
          padding: '12px 20px', borderTop: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
          background: 'var(--bg)',
        }}>
          <button
            onClick={handleCloseRequest}
            disabled={indexing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, padding: '9px 16px', borderRadius: 8,
              border: 'none',
              background: indexing ? 'var(--bg-tertiary)' : '#dc2626',
              color: indexing ? 'var(--text-muted)' : '#fff',
              cursor: indexing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              boxShadow: indexing ? 'none' : '0 1px 3px rgba(220,38,38,0.3)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!indexing) e.currentTarget.style.background = '#b91c1c'; }}
            onMouseLeave={e => { if (!indexing) e.currentTarget.style.background = '#dc2626'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {t('discardAndClose')}
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={handleIndexClick}
            disabled={indexing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, padding: '9px 16px', borderRadius: 8,
              border: 'none',
              background: indexing ? 'var(--bg-tertiary)' : '#059669',
              color: indexing ? 'var(--text-muted)' : '#fff',
              cursor: indexing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              boxShadow: indexing ? 'none' : '0 1px 3px rgba(5,150,105,0.3)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!indexing) e.currentTarget.style.background = '#047857'; }}
            onMouseLeave={e => { if (!indexing) e.currentTarget.style.background = '#059669'; }}
          >
            {indexing ? (
              <>
                <div className="animate-spin" style={{
                  width: 13, height: 13, border: '2px solid currentColor',
                  borderTopColor: 'transparent', borderRadius: '50%',
                }} />
                {t('indexing')}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t('indexCorrected')}
              </>
            )}
          </button>
        </div>

        <ReplaceDialog
          open={showReplaceDialog}
          existingDocName={existingDocWithSameName?.name || ''}
          busy={indexing}
          onKeepBoth={() => doIndex(text, false)}
          onReplace={() => doIndex(text, true)}
          onCancel={() => setShowReplaceDialog(false)}
        />
      </div>
    </div>
  );
}
