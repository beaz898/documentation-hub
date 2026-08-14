'use client';

import { useState } from 'react';

interface ReviewActionsProps {
  onMarkAnalyzed: () => void | Promise<void>;
  onImprove: () => void;
  onRemove: () => void | Promise<void>;
  onClose: () => void;
  // Documento con version staged frenada por el portero (F-4-rev): marcar-analizado
  // devolveria 409 y quitar-del-corpus borraria el documento entero en vez de la
  // version nueva. Se ocultan y en su lugar salen las dos salidas de la decision.
  stagedDecision?: boolean;
  // Activar la version nueva: mark-analyzed con approveStaged:true (swap + revisado).
  onApprove?: () => void | Promise<void>;
  // Descartar la version nueva: discard-staged (la activa sigue sirviendo).
  onDiscard?: () => void | Promise<void>;
}

export default function ReviewActions({
  onMarkAnalyzed,
  onImprove,
  onRemove,
  onClose,
  stagedDecision = false,
  onApprove,
  onDiscard,
}: ReviewActionsProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleMarkAnalyzed = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onMarkAnalyzed();
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onRemove();
    } finally {
      setBusy(false);
      setConfirmingRemove(false);
    }
  };

  const handleApprove = async () => {
    if (busy || !onApprove) return;
    setBusy(true);
    try {
      await onApprove();
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = async () => {
    if (busy || !onDiscard) return;
    setBusy(true);
    try {
      await onDiscard();
    } finally {
      setBusy(false);
    }
  };

  // Estado de confirmacion de borrado: sustituye la fila normal.
  if (confirmingRemove) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Esto eliminara el documento del corpus de forma permanente. No se puede deshacer.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setConfirmingRemove(false)}
            disabled={busy}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '0.5px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleRemove}
            disabled={busy}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: busy ? 'var(--bg-tertiary)' : '#dc2626',
              color: busy ? 'var(--text-muted)' : '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Quitando...' : 'Confirmar borrado'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
      <button
        onClick={onClose}
        disabled={busy}
        style={{
          flex: 1,
          padding: '10px 12px',
          borderRadius: 10,
          border: '0.5px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 500,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        Cerrar
      </button>

      <button
        onClick={onImprove}
        disabled={busy}
        style={{
          flex: 1.3,
          padding: '10px 12px',
          borderRadius: 10,
          border: '0.5px solid var(--brand)',
          background: 'var(--brand-light)',
          color: 'var(--brand)',
          fontSize: 12,
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.3 5.8 22l2.4-8.1L2 9.4h7.6L12 2z" />
        </svg>
        Mejorar con IA
      </button>

      {!stagedDecision && (
        <button
          onClick={() => setConfirmingRemove(true)}
          disabled={busy}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: '0.5px solid #dc2626',
            background: 'transparent',
            color: '#dc2626',
            fontSize: 12,
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          Quitar del corpus
        </button>
      )}

      {!stagedDecision && (
        <button
          onClick={handleMarkAnalyzed}
          disabled={busy}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: busy ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: busy ? 'var(--text-muted)' : '#fff',
            fontSize: 12,
            fontWeight: 500,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Guardando...' : 'Marcar como analizado'}
        </button>
      )}

      {stagedDecision && onDiscard && (
        <button
          onClick={handleDiscard}
          disabled={busy}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: '0.5px solid #dc2626',
            background: 'transparent',
            color: '#dc2626',
            fontSize: 12,
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Descartando...' : 'Descartar versión nueva'}
        </button>
      )}

      {stagedDecision && onApprove && (
        <button
          onClick={handleApprove}
          disabled={busy}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: busy ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: busy ? 'var(--text-muted)' : '#fff',
            fontSize: 12,
            fontWeight: 500,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Activando...' : 'Activar esta versión'}
        </button>
      )}
    </div>
  );
}
