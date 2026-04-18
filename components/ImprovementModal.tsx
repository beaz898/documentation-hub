'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import EditorPanel from './improvement/EditorPanel';
import ChatPanel from './improvement/ChatPanel';
import ReplaceDialog from './improvement/ReplaceDialog';
import { useImprovementChat, findTolerant } from './improvement/useImprovementChat';
import { useStyleAnalysis } from './improvement/useStyleAnalysis';
import { useCrossDocAnalysis } from './improvement/useCrossDocAnalysis';
import { useIndexing } from './improvement/useIndexing';
import type { Problem, ProblemType, RawAnalysis } from './improvement/problems';

interface ExistingDocForDialog {
  id: string;
  name: string;
}

interface ImprovementModalProps {
  fileName: string;
  initialText: string;
  analysis: RawAnalysis;
  documentSources?: Record<string, string[]>;
  storagePath: string;
  existingDocWithSameName?: ExistingDocForDialog | null;
  accessToken: string;
  onClose: () => void;
  onIndexed: (docName: string, wasReplaced: boolean) => void;
}

const TYPE_META: Record<ProblemType, { label: string; color: string; bg: string; border: string }> = {
  contradiccion: { label: 'Contradicción', color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.35)' },
  duplicidad:    { label: 'Duplicidad',    color: '#ea580c', bg: 'rgba(234,88,12,0.08)',  border: 'rgba(234,88,12,0.35)' },
  ortografia:    { label: 'Ortografía',    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.35)' },
  ambiguedad:    { label: 'Ambigüedad',    color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.35)' },
  sugerencia:    { label: 'Sugerencia',    color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.35)' },
};

const ALL_TYPES: ProblemType[] = ['contradiccion', 'duplicidad', 'ortografia', 'ambiguedad', 'sugerencia'];

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildTitleSet(problems: Problem[]): Set<string> {
  return new Set(problems.map(p => normalizeTitle(p.title)));
}

function buildDeltaMessage(
  prev: Problem[],
  next: Problem[],
  scopeLabel: 'estilo' | 'todo'
): string {
  const prevSet = buildTitleSet(prev);
  const nextSet = buildTitleSet(next);

  let resolved = 0;
  for (const t of prevSet) if (!nextSet.has(t)) resolved++;

  let added = 0;
  for (const t of nextSet) if (!prevSet.has(t)) added++;

  const pending = next.length;

  return `He reanalizado ${scopeLabel === 'estilo' ? 'el estilo' : 'todo'} y este es el resumen:\n\n` +
    `• Resueltos: ${resolved}\n` +
    `• Nuevos: ${added}\n` +
    `• Pendientes: ${pending}`;
}

/**
 * Construye un resumen textual de todos los problemas detectados para inyectar
 * en el prompt del chat. Así Claude sabe exactamente qué problemas hay sin
 * tener que redescubrirlos.
 */
function buildProblemsSummary(problems: Problem[]): string {
  if (problems.length === 0) return '(ningún problema detectado)';
  return problems
    .map((p, i) => `${i + 1}. [${TYPE_META[p.type].label}] ${p.title}: ${p.description}`)
    .join('\n');
}

export default function ImprovementModal({
  fileName,
  initialText,
  analysis,
  documentSources,
  storagePath,
  existingDocWithSameName,
  accessToken,
  onClose,
  onIndexed,
}: ImprovementModalProps) {
  const [text, setText] = useState(initialText);
  const editorRef = useRef<HTMLDivElement>(null);

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
  });

  const problems = useMemo<Problem[]>(
    () => [...crossDocProblems, ...styleProblems],
    [crossDocProblems, styleProblems]
  );

  // Resumen de problemas para inyectar en el prompt del chat
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

  const toggleType = useCallback((t: ProblemType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const selectAllTypes = useCallback(() => setActiveTypes(new Set(ALL_TYPES)), []);
  const clearTypes = useCallback(() => setActiveTypes(new Set()), []);

  const didWelcomeRef = useRef(false);
  useEffect(() => {
    if (didWelcomeRef.current) return;
    if (crossDocProblems.length === 0) {
      didWelcomeRef.current = true;
      return;
    }
    didWelcomeRef.current = true;
    const summary = crossDocProblems
      .map((p, i) => `${i + 1}. [${TYPE_META[p.type].label}] ${p.title}`)
      .join('\n');
    addAssistantMessage(
      `He detectado ${crossDocProblems.length} problema${crossDocProblems.length !== 1 ? 's' : ''} en el documento:\n\n${summary}\n\n¿Por dónde quieres empezar? Puedo proponer correcciones concretas, explicarte cualquier punto, borrar fragmentos o reescribir partes a tu gusto.`
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
    const range = findTolerant(text, p.textRef);
    if (!range) {
      alert('Ese fragmento ya no se encuentra en el texto (quizá lo editaste).');
      return;
    }
    const ta = editorRef.current?.querySelector('textarea') as HTMLTextAreaElement | null;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(range.start, range.end);
    const beforeText = text.slice(0, range.start);
    const lineNumber = beforeText.split('\n').length;
    const lineHeight = 20;
    ta.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
  }, [text]);

  // -------- Solventar un problema individual ----------
  const handleSolveOne = useCallback((p: Problem) => {
    const typeLabel = TYPE_META[p.type].label.toLowerCase();
    const message = `Resuelve el siguiente problema de tipo ${typeLabel} en el TEXTO_ACTUAL. Propón los cambios necesarios con bloques REPLACEMENT:\n\nTítulo: ${p.title}\nDescripción: ${p.description}${p.relatedDoc ? `\nDocumento relacionado: ${p.relatedDoc}` : ''}`;
    sendMessage(message, text, fileName, problemsSummary);
  }, [sendMessage, text, fileName, problemsSummary]);

  // -------- Resolver todos los problemas de un grupo ----------
  const handleSolveGroup = useCallback((type: ProblemType, groupProblems: Problem[]) => {
    const typeLabel = TYPE_META[type].label.toLowerCase();
    const list = groupProblems
      .map((p, i) => `${i + 1}. ${p.title}: ${p.description}${p.relatedDoc ? ` (doc: ${p.relatedDoc})` : ''}`)
      .join('\n');
    const message = `Resuelve TODOS los problemas de tipo ${typeLabel} detectados en el TEXTO_ACTUAL. Genera UN BLOQUE REPLACEMENT POR CADA cambio necesario, no resumas en uno solo:\n\n${list}`;
    sendMessage(message, text, fileName, problemsSummary);
  }, [sendMessage, text, fileName, problemsSummary]);

  // -------- Wrapper del sendMessage manual para incluir fileName y problemsSummary ----------
  const handleManualSend = useCallback(async (userText: string, currentEditorText: string) => {
    await sendMessage(userText, currentEditorText, fileName, problemsSummary);
  }, [sendMessage, fileName, problemsSummary]);

  const handleReanalyzeStyle = useCallback(async () => {
    const prev = styleProblems;
    await reanalyzeStyle(text, fileName);
    setStyleProblems(curr => {
      const msg = buildDeltaMessage(prev, curr, 'estilo');
      addAssistantMessage(msg);
      return curr;
    });
  }, [styleProblems, reanalyzeStyle, text, setStyleProblems, addAssistantMessage]);

  const handleReanalyzeAll = useCallback(async () => {
    const prev = problems;
    const result = await reanalyzeAll(text, fileName);
    if (!result) {
      addAssistantMessage('No se pudo reanalizar, prueba de nuevo en unos segundos.');
      return;
    }
    setStyleProblems(result.styleProblems);
    setCrossDocProblems(currCross => {
      const next = [...currCross, ...result.styleProblems];
      const msg = buildDeltaMessage(prev, next, 'todo');
      addAssistantMessage(msg);
      return currCross;
    });
  }, [problems, reanalyzeAll, text, fileName, setStyleProblems, setCrossDocProblems, addAssistantMessage]);

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
    if (window.confirm('¿Descartar los cambios y cerrar? El archivo original se eliminará.')) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 1200,
          height: '90vh',
          maxHeight: 900,
          background: 'var(--bg-primary)', borderRadius: 14,
          border: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        <div style={{
          padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
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
              Mejora con IA — {fileName}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {problems.length} problema{problems.length !== 1 ? 's' : ''} detectado{problems.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCloseRequest}
            aria-label="Cerrar"
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{
          flex: '1 1 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div
            ref={editorRef}
            style={{
              display: 'flex', flexDirection: 'column',
              borderRight: '0.5px solid var(--border)',
              minWidth: 0, minHeight: 0,
              padding: '10px 16px',
              overflow: 'hidden',
            }}
          >
            <EditorPanel value={text} onChange={setText} fileName={fileName} />
          </div>

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
          />
        </div>

        <div style={{
          padding: '12px 20px', borderTop: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
          background: 'var(--bg-primary)',
        }}>
          <button
            onClick={handleCloseRequest}
            disabled={indexing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, padding: '9px 14px', borderRadius: 8,
              border: '0.5px solid rgba(220,38,38,0.5)',
              background: 'rgba(220,38,38,0.06)',
              color: '#dc2626',
              cursor: indexing ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!indexing) e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; }}
            onMouseLeave={e => { if (!indexing) e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Descartar y cerrar
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
                Indexando...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Indexar versión corregida
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
