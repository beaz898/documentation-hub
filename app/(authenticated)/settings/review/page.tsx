'use client';

import { useState } from 'react';
import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight';
import { useAccount } from '@/contexts/AccountContext';
import { useReviewList } from '@/hooks/review/useReviewList';
import type { ReviewDocument } from '@/hooks/review/useReviewList';
import { useReviewAnalysis } from '@/hooks/review/useReviewAnalysis';
import AnalysisModal from '@/components/AnalysisModal';
import ImprovementModal from '@/components/ImprovementModal';
import ReviewFolderGroup from '@/components/review/ReviewFolderGroup';
import ReviewSelectionBar from '@/components/review/ReviewSelectionBar';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { uploadLockMessage } from '@/lib/upload-lock-message';

export default function ReviewPage() {
  const vvHeight = useVisualViewportHeight();
  const { credits } = useAccount();
  const {
    groups,
    loading,
    error,
    selectedIds,
    selectedCount,
    estimatedCost,
    limitReached,
    totalPending,
    maxSelection,
    toggleDocument,
    toggleFolder,
    toggleAll,
    refetch,
  } = useReviewList();

  const creditsRemaining = credits?.remaining ?? null;

  const { analyze, analyzing, progress, summary, clearSummary } = useReviewAnalysis();

  // Modal de revision: documento abierto y su analisis guardado.
  const [reviewDoc, setReviewDoc] = useState<{ id: string; name: string } | null>(null);
  const [reviewAnalysis, setReviewAnalysis] = useState<Record<string, unknown> | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewStagedDecision, setReviewStagedDecision] = useState(false);

  // Modal de mejora abierto desde la bandeja (el documento ya esta indexado).
  const [improveTarget, setImproveTarget] = useState<{
    id: string;
    name: string;
    text: string;
    analysis: Record<string, unknown>;
  } | null>(null);

  const handleOpenDocument = async (doc: { id: string; name: string }) => {
    setActionError(null);
    setReviewStagedDecision(false);
    setLoadingAnalysis(true);
    setReviewDoc(doc);
    setReviewAnalysis(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}/analysis`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (!data.analysis) {
        setActionError(
          'Este analisis es anterior y no guardo el detalle de las incidencias. Puedes reanalizar el documento para verlas.',
        );
        setReviewDoc(null);
        return;
      }
      setReviewAnalysis(data.analysis);
    } catch (err) {
      console.error('[review] cargar analisis:', err);
      setActionError('No se pudo cargar el analisis de este documento.');
      setReviewDoc(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleDecideDocument = async (doc: ReviewDocument) => {
    const resultId = doc.stagedAnalysisResultId;
    if (!resultId) {
      setActionError('No se encontro el analisis de la version nueva de este documento.');
      return;
    }
    setActionError(null);
    setLoadingAnalysis(true);
    setReviewStagedDecision(true);
    setReviewDoc({ id: doc.id, name: doc.name });
    setReviewAnalysis(null);
    try {
      const res = await fetch(`/api/analysis-results/${resultId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (!data.analysis) {
        setActionError('El analisis de la version nueva no guardo el detalle de las incidencias.');
        setReviewDoc(null);
        setReviewStagedDecision(false);
        return;
      }
      setReviewAnalysis(data.analysis);
    } catch (err) {
      console.error('[review] cargar analisis del staged:', err);
      setActionError('No se pudo cargar el analisis de la version nueva.');
      setReviewDoc(null);
      setReviewStagedDecision(false);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const closeReviewModal = () => {
    setReviewDoc(null);
    setReviewAnalysis(null);
    setReviewStagedDecision(false);
  };

  const handleMarkAnalyzed = async () => {
    if (!reviewDoc) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/documents/${reviewDoc.id}/mark-analyzed`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      closeReviewModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo marcar como analizado.');
    }
  };

  const handleRemoveDocument = async () => {
    if (!reviewDoc) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/documents?id=${reviewDoc.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const lockMsg = uploadLockMessage(res.status, data);
        throw new Error(lockMsg ?? (data.error || `Error ${res.status}`));
      }
      closeReviewModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo quitar el documento.');
    }
  };

  // Activar la version nueva (F-11): mark-analyzed con approveStaged:true. El endpoint
  // dispara swapDocumentVectors (la generacion staged pasa a activa, la vieja se borra)
  // y rellena reviewed_at DESPUES del swap, que lo habia reseteado a NULL en su P2: el
  // humano SI reviso esta version, la aprobo con sus hallazgos a la vista. Por eso el
  // documento sale de la bandeja en vez de reaparecer.
  const handleApproveStaged = async () => {
    if (!reviewDoc) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/documents/${reviewDoc.id}/mark-analyzed`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveStaged: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      closeReviewModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo activar la nueva versión.');
    }
  };

  // Descartar la version nueva (F-11): borra sus vectores y su fila staged. La version
  // activa (vieja) no se toca y sigue sirviendo el chat. Ademas sella el cerrojo del
  // sync (F-16 Q5), asi que la version rechazada no renace en el siguiente sync; si el
  // usuario edita el archivo en Drive, el ciclo empieza de nuevo con normalidad.
  const handleDiscardStaged = async () => {
    if (!reviewDoc) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/documents/${reviewDoc.id}/discard-staged`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      closeReviewModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo descartar la versión nueva.');
    }
  };

  const handleImprove = async () => {
    if (!reviewDoc || !reviewAnalysis) return;
    const doc = reviewDoc;
    const analysis = reviewAnalysis;
    setActionError(null);
    setLoadingAnalysis(true);
    closeReviewModal();
    try {
      const res = await fetch(`/api/documents/${doc.id}/text`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const data = await res.json();
      if (!data.text) throw new Error('El documento no tiene texto guardado.');
      setImproveTarget({ id: doc.id, name: doc.name, text: data.text, analysis });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo abrir el editor de mejora.',
      );
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleAnalyze = async () => {
    // Documentos seleccionados, en el orden de la lista.
    const selectedDocs = groups
      .flatMap((g) => g.documents)
      .filter((d) => selectedIds.has(d.id));
    if (selectedDocs.length === 0) return;
    clearSummary();
    await analyze(selectedDocs);
    await refetch();
  };

  return (
    <div style={{ height: vvHeight != null ? `${vvHeight}px` : '100dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera */}
      <div
        style={{
          padding: '16px 20px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Bandeja de revision
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>
            Documentos pendientes de analizar. Selecciona los que quieras revisar y analizalos.
          </p>
        </div>
        <FeedbackButton />
      </div>

      {/* Contenido */}
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Cargando documentos...
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#991b1b', marginBottom: 12 }}>{error}</p>
            <button
              onClick={() => refetch()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && totalPending === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              No hay documentos por revisar
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Todos tus documentos estan analizados.
            </p>
          </div>
        )}

        {!loading && !error && totalPending > 0 && (
          <>
            {actionError && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '0.5px solid var(--border)',
                }}
              >
                {actionError}
              </div>
            )}

            {summary && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: summary.failed > 0 ? '#fef3c7' : summary.blocked > 0 ? '#dbeafe' : '#dcfce7',
                  color: summary.failed > 0 ? '#92400e' : summary.blocked > 0 ? '#1e40af' : '#166534',
                  border: '0.5px solid var(--border)',
                }}
              >
                {summary.analyzed} analizado{summary.analyzed === 1 ? '' : 's'}
                {summary.failed > 0 && `, ${summary.failed} con error`}
                {summary.blocked > 0 && `, ${summary.blocked} sin analizar (hay un análisis en curso)`}
                {summary.blocked > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {summary.errors.find((e) => e.blocked)?.message}
                  </div>
                )}
                {summary.errors.filter((e) => !e.blocked).length > 0 && (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {summary.errors.filter((e) => !e.blocked).map((e) => (
                      <li key={e.documentId}>
                        {e.documentName}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Controles superiores */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {totalPending} documento{totalPending === 1 ? '' : 's'} pendiente{totalPending === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => toggleAll()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '0.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {selectedCount > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>

            {/* Grupos por carpeta */}
            <div style={{ flex: 1 }}>
              {groups.map((group) => (
                <ReviewFolderGroup
                  key={group.folderPath ?? '__no_folder__'}
                  group={group}
                  selectedIds={selectedIds}
                  limitReached={limitReached}
                  onToggleDocument={toggleDocument}
                  onToggleFolder={toggleFolder}
                  onOpenDocument={handleOpenDocument}
                  onDecideDocument={handleDecideDocument}
                />
              ))}
            </div>

            <ReviewSelectionBar
              selectedCount={selectedCount}
              estimatedCost={estimatedCost}
              creditsRemaining={creditsRemaining}
              maxSelection={maxSelection}
              analyzing={analyzing}
              progress={progress}
              onAnalyze={handleAnalyze}
            />
          </>
        )}
      </div>

      {loadingAnalysis && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)',
            fontSize: 13,
            color: '#fff',
            zIndex: 50,
          }}
        >
          Cargando analisis...
        </div>
      )}

      {reviewDoc && reviewAnalysis && (
        <AnalysisModal
          fileName={reviewDoc.name}
          analysis={reviewAnalysis}
          mode="review"
          onConfirm={() => {}}
          onCancel={closeReviewModal}
          onImprove={handleImprove}
          onMarkAnalyzed={handleMarkAnalyzed}
          onRemove={handleRemoveDocument}
          stagedDecision={reviewStagedDecision}
          onApproveStaged={handleApproveStaged}
          onDiscardStaged={handleDiscardStaged}
        />
      )}

      {improveTarget && (
        <ImprovementModal
          fileName={improveTarget.name}
          initialText={improveTarget.text}
          analysis={improveTarget.analysis as never}
          existingDocWithSameName={{ id: improveTarget.id, name: improveTarget.name }}
          onClose={() => setImproveTarget(null)}
          onIndexed={async () => {
            setImproveTarget(null);
            await refetch();
          }}
        />
      )}
    </div>
  );
}
