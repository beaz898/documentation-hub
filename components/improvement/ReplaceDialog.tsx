'use client';

import React from 'react';

interface ReplaceDialogProps {
  open: boolean;
  existingDocName: string;
  busy: boolean;
  onKeepBoth: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export default function ReplaceDialog({
  open,
  existingDocName,
  busy,
  onKeepBoth,
  onReplace,
  onCancel,
}: ReplaceDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={busy ? undefined : onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-md)',
          padding: 24,
          maxWidth: 480,
          width: '100%',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
          Documento ya existente
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          El documento manual <strong style={{ color: 'var(--text-primary)' }}>{existingDocName}</strong> ya está indexado.
          ¿Qué quieres hacer con la versión corregida?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={onKeepBoth}
            disabled={busy}
            style={{
              padding: '10px 14px', borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1, textAlign: 'left',
            }}
          >
            <strong>Conservar ambos</strong>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Se indexa como un documento nuevo con sufijo "(corregido …)".
            </div>
          </button>
          <button
            type="button"
            onClick={onReplace}
            disabled={busy}
            style={{
              padding: '10px 14px', borderRadius: 6,
              border: '1px solid var(--brand)',
              background: 'var(--brand)',
              color: 'var(--brand-text)',
              fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1, textAlign: 'left',
            }}
          >
            <strong>Reemplazar el original</strong>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              Sustituye el documento existente conservando el mismo nombre.
            </div>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '8px 14px', borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
