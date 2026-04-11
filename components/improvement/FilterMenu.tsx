'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ProblemType } from './problems';

interface FilterMenuProps {
  allTypes: ProblemType[];
  activeTypes: Set<ProblemType>;
  onToggle: (type: ProblemType) => void;
  onSelectAll: () => void;
  onClear: () => void;
  labels: Record<ProblemType, string>;
  totalCount: number;
}

export default function FilterMenu({
  allTypes,
  activeTypes,
  onToggle,
  onSelectAll,
  onClear,
  labels,
  totalCount,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const activeCount = activeTypes.size;
  const allActive = activeCount === allTypes.length;
  const label = allActive ? `Todos (${totalCount})` : `${activeCount} de ${allTypes.length} tipos`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 12,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>Filtrar: {label}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 50,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-md)',
            padding: 6,
            minWidth: 200,
          }}
        >
          <div style={{ display: 'flex', gap: 6, padding: '4px 6px 8px', borderBottom: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onSelectAll}
              style={{
                flex: 1, fontSize: 11, padding: '4px 6px', borderRadius: 4,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={onClear}
              style={{
                flex: 1, fontSize: 11, padding: '4px 6px', borderRadius: 4,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              Ninguno
            </button>
          </div>
          <div style={{ paddingTop: 4 }}>
            {allTypes.map(t => {
              const active = activeTypes.has(t);
              return (
                <label
                  key={t}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 4, cursor: 'pointer',
                    fontSize: 12, color: 'var(--text-primary)',
                    background: active ? 'var(--bg-secondary)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(t)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{labels[t]}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
