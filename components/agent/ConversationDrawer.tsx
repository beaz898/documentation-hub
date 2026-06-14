'use client';

import { useEffect } from 'react';

interface ConversationDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ConversationDrawer({ open, onClose, children }: ConversationDrawerProps) {

  // Cierre con Escape — listener activo solo cuando el drawer está abierto
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Bloqueo del scroll del fondo mientras está abierto; restaura al valor previo
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      {/* Backdrop — invisible e inactivo cuando está cerrado */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Panel — siempre montado; entra/sale con translateX */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Conversaciones"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: 'min(260px, 85vw)',
          zIndex: 1001,
          background: 'var(--bg-secondary)',
          borderRight: '0.5px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </>
  );
}
