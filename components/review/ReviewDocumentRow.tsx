'use client';

import type { ReviewDocument } from '@/hooks/review/useReviewList';

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Sin analizar',
  en_analisis: 'Analizando',
  desactualizado: 'Desactualizado',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pendiente: { bg: '#fef3c7', fg: '#92400e' },
  en_analisis: { bg: '#dbeafe', fg: '#1e40af' },
  desactualizado: { bg: '#fee2e2', fg: '#991b1b' },
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Subido',
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
};

function buildCountsSummary(doc: ReviewDocument): string | null {
  const a = doc.lastAnalysis;
  if (!a) return null;
  const parts: string[] = [];
  const c = a.counts;
  if (c.contradictions > 0) parts.push(`${c.contradictions} contradiccion${c.contradictions === 1 ? '' : 'es'}`);
  if (c.duplicates > 0) parts.push(`${c.duplicates} duplicado${c.duplicates === 1 ? '' : 's'}`);
  if (c.overlaps > 0) parts.push(`${c.overlaps} solapamiento${c.overlaps === 1 ? '' : 's'}`);
  if (c.minorInconsistencies > 0) parts.push(`${c.minorInconsistencies} menor${c.minorInconsistencies === 1 ? '' : 'es'}`);
  if (c.styleProblems > 0) parts.push(`${c.styleProblems} de estilo`);
  if (parts.length === 0) return 'Sin incidencias';
  return parts.join(' · ');
}

interface Props {
  document: ReviewDocument;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}

export default function ReviewDocumentRow({ document: doc, selected, disabled, onToggle }: Props) {
  const status = doc.analysis_status;
  const statusColor = STATUS_COLORS[status] ?? { bg: 'var(--bg-tertiary)', fg: 'var(--text-muted)' };
  const statusLabel = STATUS_LABELS[status] ?? status;
  const sourceLabel = SOURCE_LABELS[doc.source] ?? doc.source;
  const countsSummary = buildCountsSummary(doc);
  const hasDetail = doc.lastAnalysis?.hasDetail ?? true;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        opacity: disabled && !selected ? 0.55 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled && !selected}
        onChange={() => onToggle(doc.id)}
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={doc.name}
        >
          {doc.name}
        </div>
        {countsSummary && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              opacity: hasDetail ? 1 : 0.7,
            }}
            title={hasDetail ? undefined : 'Analisis anterior: no se guardo el detalle de las incidencias.'}
          >
            {countsSummary}
            {!hasDetail && ' (sin detalle)'}
          </div>
        )}
      </div>

      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {sourceLabel}
      </span>

      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 999,
          background: statusColor.bg,
          color: statusColor.fg,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {statusLabel}
      </span>
    </div>
  );
}
