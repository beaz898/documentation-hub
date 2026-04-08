'use client';

import { useState, useRef, useMemo, useEffect } from 'react';

// ============================================================
// Types
// ============================================================

export type ProblemType = 'contradiccion' | 'duplicidad' | 'ortografia' | 'ambiguedad' | 'sugerencia';

export interface Problem {
  id: string;
  type: ProblemType;
  title: string;
  description: string;
  textRef?: string;
  relatedDoc?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  replacements?: Array<{ find: string; replace: string; applied?: boolean; failed?: boolean }>;
}

interface RawAnalysis {
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateConfidence?: number;
  overlaps?: Array<{ existingDocument: string; description: string; severity: string }>;
  discrepancies?: Array<{ topic: string; newDocSays: string; existingDocSays: string; existingDocument: string }>;
  newInformation?: string;
  recommendation?: string;
  suggestedActions?: Array<{ action: string; target: string; reason: string }>;
  summary?: string;
}

interface ExistingDocForDialog {
  id: string;
  name: string;
}

interface ImprovementModalProps {
  fileName: string;
  initialText: string;
  analysis: RawAnalysis;
  storagePath: string;
  existingDocWithSameName?: ExistingDocForDialog | null;
  accessToken: string;
  onClose: () => void;
  onIndexed: (docName: string, wasReplaced: boolean) => void;
}

// ============================================================
// Color palette per problem type
// ============================================================
const TYPE_META: Record<ProblemType, { label: string; color: string; bg: string; border: string }> = {
  contradiccion: { label: 'Contradicción',     color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.35)' },
  duplicidad:    { label: 'Duplicidad',        color: '#ea580c', bg: 'rgba(234,88,12,0.08)',  border: 'rgba(234,88,12,0.35)' },
  ortografia:    { label: 'Ortografía',        color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.35)' },
  ambiguedad:    { label: 'Ambigüedad',        color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.35)' },
  sugerencia:    { label: 'Sugerencia',        color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.35)' },
};

// ============================================================
// Tolerant matching: tries exact, then whitespace-normalized, then fuzzy
// ============================================================
function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Tries to find `find` inside `text` using progressively more tolerant strategies.
 * Returns the match range in the ORIGINAL text, or null if nothing works.
 */
function findMatchRange(text: string, find: string): { start: number; end: number } | null {
  if (!find) return null;

  // 1. Exact match
  const exactIdx = text.indexOf(find);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + find.length };
  }

  // 2. Whitespace-normalized match
  //    Normalize both sides but keep a mapping back to original offsets in `text`.
  //    Strategy: walk `text`, build a normalized version with an index map,
  //    search the normalized `find` inside it, then map back.
  const normFind = normalizeWhitespace(find);
  if (!normFind) return null;

  const mapping: number[] = []; // mapping[i] = original index of normalized char i
  let normText = '';
  let lastWasSpace = false;
  let started = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isSpace = /\s/.test(ch);
    if (isSpace) {
      if (!started) continue; // skip leading whitespace
      if (!lastWasSpace) {
        normText += ' ';
        mapping.push(i);
        lastWasSpace = true;
      }
    } else {
      normText += ch;
      mapping.push(i);
      lastWasSpace = false;
      started = true;
    }
  }
  // Trim trailing space from normText
  while (normText.endsWith(' ')) {
    normText = normText.slice(0, -1);
    mapping.pop();
  }

  const normIdx = normText.indexOf(normFind);
  if (normIdx !== -1 && mapping[normIdx] !== undefined) {
    const start = mapping[normIdx];
    const lastNormCharIdx = normIdx + normFind.length - 1;
    const endInOriginal = (mapping[lastNormCharIdx] ?? start) + 1;
    return { start, end: endInOriginal };
  }

  // 3. Fuzzy match: first ~15 chars + last ~15 chars of find
  //    Useful when the middle got paraphrased but the anchors are still there.
  if (normFind.length >= 30) {
    const head = normFind.slice(0, 15);
    const tail = normFind.slice(-15);
    const headIdx = normText.indexOf(head);
    if (headIdx !== -1) {
      const tailIdx = normText.indexOf(tail, headIdx + head.length);
      if (tailIdx !== -1) {
        const start = mapping[headIdx];
        const endInOriginal = (mapping[tailIdx + tail.length - 1] ?? start) + 1;
        // Only accept if the fuzzy span is not absurdly larger than the expected length
        if (endInOriginal - start < find.length * 2.5) {
          return { start, end: endInOriginal };
        }
      }
    }
  }

  return null;
}

function problemsFromAnalysis(analysis: RawAnalysis): Problem[] {
  const out: Problem[] = [];

  if (analysis.isDuplicate && analysis.duplicateOf) {
    out.push({
      id: `dup-main`,
      type: 'duplicidad',
      title: `Posible duplicado de "${analysis.duplicateOf}"`,
      description: `Confianza ${analysis.duplicateConfidence ?? 0}%. Gran parte del contenido ya existe en el otro documento.`,
      relatedDoc: analysis.duplicateOf,
    });
  }

  if (analysis.overlaps) {
    analysis.overlaps.forEach((o, i) => {
      out.push({
        id: `ovl-${i}`,
        type: 'duplicidad',
        title: `Solapamiento con "${o.existingDocument}"`,
        description: `${o.description} (severidad: ${o.severity})`,
        relatedDoc: o.existingDocument,
      });
    });
  }

  if (analysis.discrepancies) {
    analysis.discrepancies.forEach((d, i) => {
      out.push({
        id: `disc-${i}`,
        type: 'contradiccion',
        title: d.topic || `Contradicción con "${d.existingDocument}"`,
        description: `En este documento: "${d.newDocSays}". En "${d.existingDocument}": "${d.existingDocSays}".`,
        textRef: d.newDocSays,
        relatedDoc: d.existingDocument,
      });
    });
  }

  return out;
}

// ============================================================
// Component
// ============================================================
export default function ImprovementModal({
  fileName,
  initialText,
  analysis,
  storagePath,
  existingDocWithSameName,
  accessToken,
  onClose,
  onIndexed,
}: ImprovementModalProps) {
  const [text, setText] = useState(initialText);
  const [problems] = useState<Problem[]>(() => problemsFromAnalysis(analysis));
  const [activeTypes, setActiveTypes] = useState<Set<ProblemType>>(
    () => new Set(problemsFromAnalysis(analysis).map(p => p.type))
  );
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  // Initial assistant message
  useEffect(() => {
    if (chatMessages.length > 0 || problems.length === 0) return;
    const summary = problems.map((p, i) => `${i + 1}. [${TYPE_META[p.type].label}] ${p.title}`).join('\n');
    setChatMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `He detectado ${problems.length} problema${problems.length !== 1 ? 's' : ''} en el documento:\n\n${summary}\n\n¿Por dónde quieres empezar? Puedo proponer correcciones concretas, explicarte cualquier punto, borrar fragmentos o reescribir partes a tu gusto.`,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close filter menu on outside click
  useEffect(() => {
    if (!filterMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [filterMenuOpen]);

  const visibleProblems = useMemo(
    () => problems.filter(p => activeTypes.has(p.type)),
    [problems, activeTypes]
  );

  const countsByType = useMemo(() => {
    const c: Record<ProblemType, number> = {
      contradiccion: 0, duplicidad: 0, ortografia: 0, ambiguedad: 0, sugerencia: 0,
    };
    for (const p of problems) c[p.type]++;
    return c;
  }, [problems]);

  function toggleType(t: ProblemType) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function goToProblem(p: Problem) {
    if (!p.textRef || !textareaRef.current) return;
    const range = findMatchRange(text, p.textRef);
    if (!range) {
      alert('Ese fragmento ya no se encuentra en el texto (quizá lo editaste).');
      return;
    }
    const ta = textareaRef.current;
    ta.focus();
    ta.setSelectionRange(range.start, range.end);
    const beforeText = text.slice(0, range.start);
    const lineNumber = beforeText.split('\n').length;
    const lineHeight = 20;
    ta.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert('No se pudo copiar al portapapeles');
    }
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_corregido.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Apply a single replacement using tolerant matching
  function applyReplacement(msgId: string, replacementIdx: number) {
    const msg = chatMessages.find(m => m.id === msgId);
    if (!msg || !msg.replacements) return;
    const r = msg.replacements[replacementIdx];
    if (!r || r.applied) return;

    const range = findMatchRange(text, r.find);
    if (!range) {
      // Mark as failed so the user knows
      setChatMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        const newReplacements = m.replacements!.map((rr, i) =>
          i === replacementIdx ? { ...rr, failed: true } : rr
        );
        return { ...m, replacements: newReplacements };
      }));
      alert('No se pudo localizar el fragmento exacto en el texto. Prueba a pedirle al chat que te indique el fragmento literal o edítalo a mano.');
      return;
    }

    const newText = text.slice(0, range.start) + r.replace + text.slice(range.end);
    setText(newText);

    setChatMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const newReplacements = m.replacements!.map((rr, i) =>
        i === replacementIdx ? { ...rr, applied: true, failed: false } : rr
      );
      return { ...m, replacements: newReplacements };
    }));
  }

  async function handleSendChat() {
    const userMessage = chatInput.trim();
    if (!userMessage || chatSending) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatSending(true);

    try {
      const problemsSummary = problems
        .map((p, i) => `${i + 1}. [${TYPE_META[p.type].label}] ${p.title} — ${p.description}`)
        .join('\n');

      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          currentText: text,
          fileName,
          problemsSummary,
          history,
          userMessage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }));
        setChatMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Error: ${err.error || 'no se pudo contactar con el asistente'}.`,
        }]);
        return;
      }

      const data = await res.json();
      setChatMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || '(sin respuesta)',
        replacements: (data.replacements || []).map((r: { find: string; replace: string }) => ({ ...r, applied: false })),
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Error de conexión con el asistente de mejora.',
      }]);
    } finally {
      setChatSending(false);
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  }

  function handleCloseRequest() {
    if (window.confirm('¿Descartar los cambios y cerrar? El archivo original se eliminará.')) {
      onClose();
    }
  }

  function handleIndexClick() {
    if (existingDocWithSameName) {
      setShowReplaceDialog(true);
    } else {
      doIndex(false);
    }
  }

  async function doIndex(replaceExisting: boolean) {
    setShowReplaceDialog(false);
    setIndexing(true);
    try {
      const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const finalName = replaceExisting
        ? fileName
        : `${fileName} (corregido ${today})`;

      const res = await fetch('/api/index-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          text,
          name: finalName,
          originalStoragePath: storagePath,
          replaceExistingId: replaceExisting ? existingDocWithSameName?.id : undefined,
          sizeBytes: new Blob([text]).size,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }));
        alert(`Error al indexar: ${err.error || 'desconocido'}`);
        return;
      }

      const data = await res.json();
      onIndexed(data.document?.name || finalName, replaceExisting);
    } catch {
      alert('Error de conexión al indexar.');
    } finally {
      setIndexing(false);
    }
  }

  const allTypes: ProblemType[] = ['contradiccion', 'duplicidad', 'ortografia', 'ambiguedad', 'sugerencia'];

  // ============================================================
  // Render — STRICT flex layout so footer never moves
  // ============================================================
  return (
    <div
      className="modal-overlay"
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
          width: '100%', maxWidth: 1200,
          height: '90vh',                       // FIXED height
          maxHeight: 900,
          background: 'var(--bg-primary)', borderRadius: 14,
          border: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* HEADER — fixed height */}
        <div style={{
          padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0, flexGrow: 0,
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

        {/* BODY — flex: 1, cannot overflow */}
        <div style={{
          flex: '1 1 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          minHeight: 0,
          overflow: 'hidden',
        }}>

          {/* LEFT: editor */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            borderRight: '0.5px solid var(--border)',
            minWidth: 0, minHeight: 0,
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, flexGrow: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Texto del documento
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {text.length.toLocaleString('es-ES')} caracteres
              </span>
            </div>

            <div style={{
              flex: '1 1 auto', padding: '10px 16px',
              minHeight: 0, display: 'flex', overflow: 'hidden',
            }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, width: '100%', height: '100%',
                  resize: 'none',
                  background: 'var(--bg-secondary)',
                  border: '0.5px solid var(--border)', borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 13, lineHeight: 1.6,
                  fontFamily: 'var(--font-mono, ui-monospace), Consolas, monospace',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{
              padding: '10px 16px', borderTop: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0, flexGrow: 0,
            }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, padding: '6px 10px', borderRadius: 6,
                  border: '0.5px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copiar texto
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1, lineHeight: 1.4 }}>
                Recuerda actualizar tu PDF/Word original con los cambios que hagas aquí.
              </span>
            </div>
          </div>

          {/* RIGHT: chat column — STRICT flex so footer cannot be pushed */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg-secondary)',
            minWidth: 0, minHeight: 0, overflow: 'hidden',
          }}>

            {/* Chat header with filter — fixed */}
            <div style={{
              padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0, flexGrow: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                Asistente de mejora
              </span>

              <div style={{ position: 'relative' }}>
                <button
                  ref={filterBtnRef}
                  onClick={() => setFilterMenuOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, padding: '5px 9px', borderRadius: 6,
                    border: '0.5px solid var(--border)', background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filtrar ({activeTypes.size}/{allTypes.filter(t => countsByType[t] > 0).length})
                </button>

                {filterMenuOpen && (
                  <div
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 4,
                      background: 'var(--bg-primary)',
                      border: '0.5px solid var(--border)', borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                      padding: 6, minWidth: 200, zIndex: 10,
                    }}
                  >
                    {allTypes.map(t => {
                      const count = countsByType[t];
                      const meta = TYPE_META[t];
                      const active = activeTypes.has(t);
                      const disabled = count === 0;
                      return (
                        <div
                          key={t}
                          onClick={() => !disabled && toggleType(t)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 8px', borderRadius: 5,
                            cursor: disabled ? 'default' : 'pointer',
                            opacity: disabled ? 0.4 : 1,
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: 14, height: 14, borderRadius: 3,
                            border: `1.5px solid ${meta.color}`,
                            background: active ? meta.color : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {active && (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{meta.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Problems list — fixed max height, independent scroll */}
            {visibleProblems.length > 0 && (
              <div style={{
                padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 6,
                flexShrink: 0, flexGrow: 0,
                maxHeight: 160, overflowY: 'auto',
              }}>
                {visibleProblems.map((p, i) => {
                  const meta = TYPE_META[p.type];
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '8px 10px', borderRadius: 7,
                        background: meta.bg,
                        borderLeft: `3px solid ${meta.color}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                          color: meta.color, letterSpacing: 0.3,
                        }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
                          {p.title}
                        </span>
                        {p.textRef && (
                          <button
                            onClick={() => goToProblem(p)}
                            title="Ir al fragmento en el texto"
                            style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 4,
                              border: `0.5px solid ${meta.color}`,
                              background: 'transparent', color: meta.color,
                              cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            Ir al problema {i + 1}
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {p.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chat messages — the ONLY element that takes the remaining space */}
            <div style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 10,
              minHeight: 0,
            }}>
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex', gap: 8,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
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
                    }}>
                      {msg.content}
                    </div>
                    {msg.replacements && msg.replacements.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {msg.replacements.map((r, i) => {
                          const stateBg = r.applied
                            ? 'rgba(5,150,105,0.08)'
                            : r.failed
                              ? 'rgba(220,38,38,0.08)'
                              : 'var(--bg-tertiary)';
                          const stateBorder = r.applied
                            ? 'rgba(5,150,105,0.4)'
                            : r.failed
                              ? 'rgba(220,38,38,0.4)'
                              : 'var(--border)';
                          return (
                            <div
                              key={i}
                              style={{
                                padding: '6px 9px', borderRadius: 7,
                                background: stateBg,
                                border: `0.5px solid ${stateBorder}`,
                              }}
                            >
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
                                    onClick={() => applyReplacement(msg.id, i)}
                                    style={{
                                      fontSize: 10, padding: '3px 8px', borderRadius: 5,
                                      border: 'none', background: '#059669', color: '#fff',
                                      cursor: 'pointer', fontWeight: 500,
                                    }}
                                  >
                                    Aplicar al texto
                                  </button>
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
              {chatSending && (
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
              <div ref={chatEndRef} />
            </div>

            {/* Chat input — fixed */}
            <div style={{
              padding: '10px 14px', borderTop: '0.5px solid var(--border)',
              flexShrink: 0, flexGrow: 0,
              background: 'var(--bg-primary)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 6,
                background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border)', borderRadius: 9, padding: '6px 9px',
              }}>
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Escribe una instrucción..."
                  rows={1}
                  disabled={chatSending}
                  style={{
                    flex: 1, resize: 'none', outline: 'none', border: 'none',
                    background: 'transparent', color: 'var(--text-primary)',
                    fontSize: 12, fontFamily: 'var(--font-sans)',
                    lineHeight: 1.5, maxHeight: 80, minHeight: 18,
                  }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={chatSending || !chatInput.trim()}
                  aria-label="Enviar"
                  style={{
                    width: 26, height: 26, borderRadius: 6, border: 'none',
                    background: chatSending || !chatInput.trim() ? 'var(--bg-tertiary)' : 'var(--brand)',
                    color: chatSending || !chatInput.trim() ? 'var(--text-muted)' : '#fff',
                    cursor: chatSending || !chatInput.trim() ? 'not-allowed' : 'pointer',
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
        </div>

        {/* FOOTER — fixed, never moves, redesigned buttons with distinct colors */}
        <div style={{
          padding: '12px 20px', borderTop: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0, flexGrow: 0,
          background: 'var(--bg-primary)',
        }}>
          {/* Volver y descartar — red outline */}
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

          {/* Descargar .txt — neutral outline */}
          <button
            onClick={handleDownload}
            disabled={indexing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, padding: '9px 14px', borderRadius: 8,
              border: '0.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: indexing ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!indexing) e.currentTarget.style.background = 'var(--surface-hover)'; }}
            onMouseLeave={e => { if (!indexing) e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar .txt
          </button>

          {/* Indexar versión corregida — prominent green */}
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

        {/* Replace/Keep dialog */}
        {showReplaceDialog && existingDocWithSameName && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', inset: 0, zIndex: 110,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
          >
            <div style={{
              background: 'var(--bg-primary)', borderRadius: 12,
              border: '0.5px solid var(--border)',
              padding: 20, maxWidth: 460, width: '100%',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Ya existe una versión manual de este documento
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
                El documento manual <strong>{existingDocWithSameName.name}</strong> ya está indexado. ¿Qué quieres hacer con la versión corregida?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => doIndex(false)}
                  style={{
                    padding: '10px 14px', borderRadius: 8,
                    border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <strong>Conservar ambos</strong>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    La versión corregida se añade como documento nuevo con el sufijo &quot;(corregido)&quot;.
                  </p>
                </button>
                <button
                  onClick={() => doIndex(true)}
                  style={{
                    padding: '10px 14px', borderRadius: 8,
                    border: '0.5px solid rgba(220,38,38,0.5)',
                    background: 'rgba(220,38,38,0.08)',
                    color: '#b91c1c', fontSize: 13, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <strong>Reemplazar el original</strong>
                  <p style={{ fontSize: 11, margin: '2px 0 0', opacity: 0.85 }}>
                    La versión corregida sustituye a la existente. La anterior se borra.
                  </p>
                </button>
                <button
                  onClick={() => setShowReplaceDialog(false)}
                  style={{
                    marginTop: 4, padding: '8px 14px', borderRadius: 8,
                    border: 'none', background: 'transparent',
                    color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
