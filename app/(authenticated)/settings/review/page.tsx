'use client';

import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight';
import { useAccount } from '@/contexts/AccountContext';
import { useReviewList } from '@/hooks/review/useReviewList';
import ReviewFolderGroup from '@/components/review/ReviewFolderGroup';
import ReviewSelectionBar from '@/components/review/ReviewSelectionBar';
import FeedbackButton from '@/components/feedback/FeedbackButton';

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
                />
              ))}
            </div>

            {/* Barra de accion (boton inerte en 2C; la logica de analisis llega en 2D) */}
            <ReviewSelectionBar
              selectedCount={selectedCount}
              estimatedCost={estimatedCost}
              creditsRemaining={creditsRemaining}
              maxSelection={maxSelection}
              analyzing={false}
              onAnalyze={undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
