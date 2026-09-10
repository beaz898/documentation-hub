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

/**
 * ⚠️ EL MENSAJE, EN UN SOLO SITIO — B.202. Lo leen el `aria-label`, el `title`
 * y el globo. Tres copias del mismo texto se separan en cuanto alguien retoque
 * una, y entonces el lector de pantalla diría una cosa y la pantalla otra.
 *
 * Dice las DOS cosas que el usuario necesita: por qué no se puede guardar, y
 * qué hacer en su lugar. Sin la segunda, es un «no» sin salida.
 */
const MENSAJE_ORIGEN_NUBE =
  'Este documento tiene su original en la nube, así que no puede guardarse aquí: la próxima sincronización lo sobrescribiría con la versión sin corregir. Copia el texto corregido, súbelo a tu nube y se procesará en la siguiente sincronización.';

interface ImprovementModalProps {
  fileName: string;
  initialText: string;
  analysis: RawAnalysis & { styleProblems?: AnalysisStyleProblem[] };
  documentSources?: Record<string, string[]>;
  storagePath?: string;   // ausente en documentos ya indexados (Drive): no hay archivo temporal
  /** B.204 — la referencia firmada de la subida. Se llama `refDeSubida` y NO
   *  `ref` a proposito: `ref` es nombre reservado de prop en React y lo
   *  interceptaria el runtime en vez de llegar al componente. */
  refDeSubida?: string;
  /**
   * F-86 paso 3 — EL ID DEL DOCUMENTO QUE SE ESTÁ REVISANDO.
   *
   * PROP PROPIA, y no `existingDocWithSameName.id`, aunque en la bandeja
   * valgan lo mismo: esa prop significa DOS COSAS distintas según quién abra el
   * modal. Desde la bandeja es el documento en revisión; desde el chat es OTRO
   * documento que casualmente comparte nombre. Usarla aquí escribiría la
   * identidad del descarte contra el documento equivocado.
   *
   * Ausente = el documento aún no existe (la subida desde el chat). Sus
   * descartes viajan a la indexación.
   */
  reviewedDocumentId?: string;
  existingDocWithSameName?: ExistingDocForDialog | null;
  /**
   * ⚠️ B.202 — ¿HAY UN ORIGINAL EN LA NUBE QUE PUEDA PISAR ESTE DOCUMENTO?
   *
   * Lo contesta el SERVIDOR con `tieneOriginalEnLaNube`, la misma línea que
   * usa el veto de `index-text`. Aquí no se deriva de `source` ni de nada:
   * dos criterios para una pregunta es como el botón y el veto acaban
   * discrepando — el botón diría que se puede guardar y el servidor
   * contestaría 409, o al revés, que es peor.
   */
  tieneOriginalEnLaNube?: boolean;
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
    return <ImprovementMobileNotice onClose={props.onClose} />;
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
  refDeSubida,
  reviewedDocumentId,
  existingDocWithSameName,
  tieneOriginalEnLaNube = false,
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
  } = useImprovementChat();
  const [chatInput, setChatInput] = useState('');

  const {
    crossDocProblems,
    setCrossDocProblems,
    reanalyzeAll,
    reanalyzingAll,
    reanalyzePhase,
    stageFailureCount,
    noGuardado,
    selectionLimits,
    dismissProblem,
    coordenadasDescartadas,
  } = useCrossDocAnalysis(analysis, storagePath, refDeSubida, reviewedDocumentId);

  const {
    styleProblems,
    setStyleProblems,
    reanalyzeStyle,
    styleLoading,
  } = useStyleAnalysis({
    initialText,
    fileName,
    initialStyleProblems: analysis.styleProblems,
    storagePath,
    // F-100: el propietario del análisis de estilo. La MISMA prop que usan los
    // descartes desde F-86 —la que existe justamente para no confundirla con
    // `existingDocWithSameName`—, ahora también aquí.
    reviewedDocumentId,
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
      const isDismissing = dismissProblem(p);
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
    const result = await reanalyzeAll(textRef.current, fileName, existingDocWithSameName?.id);
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
  }, [reanalyzeAll, fileName, existingDocWithSameName?.id, styleProblems.length, addAssistantMessage, t]);

  const {
    indexing,
    showReplaceDialog,
    pendienteDeAplanar,
    cancelarAplanado,
    setShowReplaceDialog,
    doIndex,
  } = useIndexing({
    fileName,
    storagePath,
    existingDocWithSameName,
    onIndexed,
    // F-86 paso 3: se pasa la FUNCIÓN, no la lista. El usuario puede seguir
    // marcando y desmarcando hasta el momento de pulsar indexar, y una lista
    // capturada antes sería la de un instante anterior a su última decisión.
    dismissedFindings: coordenadasDescartadas,
  });

  const [mostrarPorQueNoSeGuarda, setMostrarPorQueNoSeGuarda] = useState(false);

  const handleIndexClick = useCallback(() => {
    if (existingDocWithSameName) {
      setShowReplaceDialog(true);
    } else {
      doIndex(text, false);
    }
  }, [existingDocWithSameName, setShowReplaceDialog, doIndex, text]);

  const handleCloseRequest = useCallback(() => {
    // Con storagePath es una subida manual sin confirmar: cerrar SI borra el
    // temporal de Storage. Sin storagePath el documento ya esta indexado
    // (p. ej. abierto desde la bandeja) y no se elimina nada.
    const message = storagePath ? t('discardConfirm') : t('discardConfirmNoDelete');
    if (window.confirm(message)) {
      onClose();
    }
  }, [onClose, storagePath, t]);

  return (
    <div
      className="p-0 md:p-5"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* ⚠️ 1400 DE ANCHO (10/09/2026) — Y LO QUE HAY QUE SABER ES POR QUÉ ESTUVO
          EN 900, PORQUE ES LO QUE EVITA EL PRÓXIMO ARRASTRE.

          ESTE MODAL Y EL DE ANÁLISIS PREVIO NUNCA ESTUVIERON ACOPLADOS EN EL
          CÓDIGO: aquél va por `.modal-content` (`globals.css`), cuyo único
          consumidor es `AnalysisModal`, y éste va por esta línea. Lo que sí
          estuvieron es acoplados EN LA HISTORIA: los cambios de ancho del 08/09
          movieron los dos números en el mismo commit, 1400 → 1100 → 900.
          Y la razón que quedó escrita —«1400 quedaba ancho para una LISTA DE UNA
          SOLA COLUMNA»— describe al de análisis. **Éste es de dos columnas
          (`md:grid-cols-2`), así que esa razón nunca le aplicó**: se estrechó de
          paquete, no por un juicio sobre él.

          De dónde sale el 1400 y no otro: el ancho real es
          `min(pantalla − 40, techo)`, y cada panel es la mitad. En un portátil de
          1366 —el más común— manda la pantalla y cualquier techo por encima de
          ~1326 da lo mismo; el número solo se nota de 1440 para arriba, y ahí
          1400 deja 700 por panel frente a los 450 de antes. 1600 solo cambiaría
          algo en pantallas de 1640+, y sin techo un 1920 daría 940 por panel,
          que es donde volvería el «demasiado ancho» ya juzgado una vez.

          ⚠️ EL ALTO NO SE TOCA (95vh, sin tope en píxeles) y `globals.css`
          tampoco: este cambio es de una línea a propósito.

          ⚠️ Y LA MITAD SIN `md:` DE ESTA CLASE ES CÓDIGO MUERTO en la práctica:
          por debajo de 768px el componente ya salió por `ImprovementMobileNotice`
          y esta rama no se renderiza. Se deja porque describe la intención y
          cubre el instante de hidratación, pero quien la lea que sepa que no es
          el camino del móvil. */}
      <div
        onClick={e => e.stopPropagation()}
        className="w-full h-full rounded-none md:max-w-[1400px] md:h-[95vh] md:rounded-[14px]"
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
          {/* F-88 ficha A: las tarjetas del diff salen del análisis tal cual lo
              devolvió el servidor. `fileName` es el documento EN REVISIÓN, que
              es lo que el indicativo de las filas ajenas necesita para nombrar
              SU montón — el grupo solo trae el nombre del candidato. */}
          <ChatPanel
            stageFailureCount={stageFailureCount}
            noGuardado={noGuardado}
            selectionLimits={selectionLimits}
            tableDiffs={analysis.tableDiffs}
            documentName={fileName}
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

          {/* ⚠️ B.202 — NO DESAPARECE SIN MÁS. Un botón que falta se lee como un
              fallo de la aplicación; uno que explica por qué no está, y ofrece
              la salida, es una decisión. La salida es la única que de verdad
              arregla el documento: llevar el texto corregido a la nube, porque
              la nube es su fuente de verdad y el próximo sync manda. */}
          {/* ⚠️ B.202 — UN ICONO, NO UN BLOQUE. La primera versión ponía aquí un
              párrafo y un botón de «copiar texto corregido», y pesaban más que
              el botón que sustituían: el usuario ya tiene el texto delante y
              puede copiarlo él. Lo que NO se pierde es el mensaje — por qué no
              se puede guardar y qué hacer en su lugar—, solo cambia de sitio.

              ⚠️ RESPONDE A PULSACIÓN ADEMÁS DE A HOVER, y no es un adorno: en un
              táctil no hay «pasar por encima», así que con solo `title` el
              mensaje sería invisible justo para quien no puede leerlo de otra
              forma. */}
          {tieneOriginalEnLaNube ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                aria-label={MENSAJE_ORIGEN_NUBE}
                title={MENSAJE_ORIGEN_NUBE}
                onClick={() => setMostrarPorQueNoSeGuarda(v => !v)}
                onBlur={() => setMostrarPorQueNoSeGuarda(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'transparent', color: '#0284c7', cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
              {mostrarPorQueNoSeGuarda && (
                <div style={{
                  position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
                  width: 320, padding: '10px 12px', borderRadius: 8, zIndex: 20,
                  background: 'var(--bg-primary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', boxShadow: '0 6px 24px rgba(0,0,0,.18)',
                  fontSize: 12, lineHeight: 1.5,
                }}>
                  {MENSAJE_ORIGEN_NUBE}
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>

        <ReplaceDialog
          open={showReplaceDialog}
          existingDocName={existingDocWithSameName?.name || ''}
          busy={indexing}
          onKeepBoth={() => doIndex(text, false)}
          onReplace={() => doIndex(text, true)}
          onCancel={() => setShowReplaceDialog(false)}
        />

        {/* ⚠️ B.201 — EL AVISO DE APLANADO. Sale solo cuando el servidor dice que
            guardar este texto le quitaría las filas y columnas al documento, y
            NO se recuerda la respuesta: cada documento es distinto, y ésta es la
            única vez que el usuario ve qué va a dejar de funcionar. */}
        {pendienteDeAplanar && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
          }}>
            <div style={{
              background: 'var(--bg-primary)', borderRadius: 12, padding: 24,
              maxWidth: 460, margin: 16, boxShadow: '0 10px 40px rgba(0,0,0,.3)',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
                Este documento es una tabla
              </h3>
              {/* ⚠️ SE DICE QUÉ SE PIERDE, EN CONCRETO. Un genérico sobre
                  «formato» o «estructura» no le sirve al usuario para decidir:
                  lo que deja de funcionar es la comparación fila a fila. */}
              <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5 }}>
                Has cambiado el texto, así que ya no se corresponde con las filas y
                columnas del original. Si lo guardas así, <strong>este documento
                dejará de compararse por filas y columnas</strong>: los análisis
                futuros no podrán señalar qué celda concreta discrepa de otro
                documento, solo leerlo como texto corrido.
              </p>
              <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                No tiene vuelta atrás: al guardar se borra el fichero original.
                Para conservar la tabla, descarta los cambios o vuelve a subir el
                fichero corregido desde tu equipo.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const p = pendienteDeAplanar;
                    cancelarAplanado();
                    doIndex(p.texto, p.reemplazar, true);
                  }}
                  disabled={indexing}
                  style={{
                    fontSize: 13, padding: '9px 16px', borderRadius: 8, border: 'none',
                    background: '#059669', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  }}
                >Guardar como texto</button>
                <button
                  onClick={() => { cancelarAplanado(); onClose(); }}
                  disabled={indexing}
                  style={{
                    fontSize: 13, padding: '9px 16px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-primary)', cursor: 'pointer',
                  }}
                >Descartar los cambios</button>
                <button
                  onClick={cancelarAplanado}
                  disabled={indexing}
                  style={{
                    fontSize: 13, padding: '9px 16px', borderRadius: 8,
                    border: 'none', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
