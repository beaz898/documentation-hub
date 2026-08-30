'use client';

import { useState, ReactNode } from 'react';

/**
 * Sección plegable. Título, recuento opcional y contenido.
 *
 * EXTRAÍDA DE AnalysisModal.tsx (F-88, ficha A), donde vivía como función
 * privada. El movimiento es MECÁNICO —mismo estado local, mismas props, mismo
 * marcado— y no cambia nada de cómo se pinta el modal de análisis: se saca
 * porque la ficha del diff de tablas necesita exactamente esto y copiarlo
 * habría dejado dos plegados que se separan a la primera.
 *
 * `defaultOpen` en false a propósito: las secciones informativas de la ficha
 * (cobertura, variantes de escritura) nacen plegadas — F-83 P2 lo pide para no
 * enterrar la alarma bajo lo que no lo es.
 */
export interface CollapsibleSectionProps {
  title: string;
  count?: number;
  color?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  count,
  color = 'var(--text-secondary)',
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', borderRadius: 6,
          border: 'none', background: 'transparent',
          cursor: 'pointer', textAlign: 'left',
          color, fontSize: 12, fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 10, width: 12, display: 'inline-block' }}>
          {open ? '▾' : '▸'}
        </span>
        <span>
          {title}{typeof count === 'number' ? ` (${count})` : ''}
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 4px 0 22px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
