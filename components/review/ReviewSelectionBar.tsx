'use client';

interface Props {
  selectedCount: number;
  estimatedCost: number;
  creditsRemaining: number | null;
  maxSelection: number;
  analyzing: boolean;
  progress?: { current: number; total: number; currentName: string } | null;
  onAnalyze?: () => void;
}

export default function ReviewSelectionBar({
  selectedCount,
  estimatedCost,
  creditsRemaining,
  maxSelection,
  analyzing,
  progress,
  onAnalyze,
}: Props) {
  if (selectedCount === 0) return null;

  const insufficient =
    creditsRemaining !== null && estimatedCost > creditsRemaining;
  const canAnalyze = !!onAnalyze && !analyzing && !insufficient;

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        marginTop: 8,
        borderRadius: 10,
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {selectedCount} seleccionado{selectedCount === 1 ? '' : 's'}
          {selectedCount >= maxSelection && (
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
              {' '}(maximo por tanda)
            </span>
          )}
        </span>
        {analyzing && progress ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Analizando {progress.current} de {progress.total}: {progress.currentName}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: insufficient ? '#991b1b' : 'var(--text-muted)' }}>
            Coste estimado: {estimatedCost} credito{estimatedCost === 1 ? '' : 's'}
            {' · '}
            Disponibles: {creditsRemaining === null ? '—' : creditsRemaining}
            {insufficient && ' · creditos insuficientes'}
          </span>
        )}
      </div>

      <button
        onClick={() => onAnalyze?.()}
        disabled={!canAnalyze}
        style={{
          flexShrink: 0,
          padding: '9px 16px',
          borderRadius: 8,
          border: 'none',
          background: canAnalyze ? 'var(--brand)' : 'var(--bg-tertiary)',
          color: canAnalyze ? '#fff' : 'var(--text-muted)',
          fontSize: 12,
          fontWeight: 600,
          cursor: canAnalyze ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
        }}
      >
        {analyzing
          ? progress
            ? `Analizando ${progress.current}/${progress.total}...`
            : 'Analizando...'
          : `Analizar seleccionados (${selectedCount})`}
      </button>
    </div>
  );
}
