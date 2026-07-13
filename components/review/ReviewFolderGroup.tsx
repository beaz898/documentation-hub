'use client';

import type { ReviewFolderGroup as FolderGroup } from '@/hooks/review/useReviewList';
import ReviewDocumentRow from './ReviewDocumentRow';

interface Props {
  group: FolderGroup;
  selectedIds: Set<string>;
  limitReached: boolean;
  onToggleDocument: (id: string) => void;
  onToggleFolder: (folderPath: string | null) => void;
}

export default function ReviewFolderGroup({
  group,
  selectedIds,
  limitReached,
  onToggleDocument,
  onToggleFolder,
}: Props) {
  const folderLabel = group.folderPath ?? 'Sin carpeta';
  const total = group.documents.length;
  const selectedInGroup = group.documents.filter((d) => selectedIds.has(d.id)).length;
  const allSelected = selectedInGroup === total && total > 0;
  const someSelected = selectedInGroup > 0 && !allSelected;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Cabecera de la carpeta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 2px',
          marginBottom: 8,
        }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={() => onToggleFolder(group.folderPath)}
          style={{ width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {folderLabel}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          ({total} {total === 1 ? 'documento' : 'documentos'})
        </span>
      </div>

      {/* Filas de documentos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {group.documents.map((doc) => {
          const selected = selectedIds.has(doc.id);
          return (
            <ReviewDocumentRow
              key={doc.id}
              document={doc}
              selected={selected}
              disabled={limitReached && !selected}
              onToggle={onToggleDocument}
            />
          );
        })}
      </div>
    </div>
  );
}
