'use client';

import { useState } from 'react';

interface EditorPanelProps {
  value: string;
  onChange: (v: string) => void;
  fileName: string;
}

/**
 * Estilo unificado para los botones secundarios del editor (Copiar, Descargar).
 * Antes eran transparentes y costaban verlos. Ahora usan un fondo sólido suave
 * con borde, igualando el estilo del botón Cerrar de la cabecera del modal.
 */
const SECONDARY_BUTTON_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 12, padding: '7px 12px', borderRadius: 8,
  border: '0.5px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  cursor: 'pointer', fontWeight: 500,
  transition: 'background 0.15s, color 0.15s',
};

export default function EditorPanel({ value, onChange, fileName }: EditorPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, '') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onHoverEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--bg-tertiary)';
    e.currentTarget.style.color = 'var(--text-primary)';
  };
  const onHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--bg-secondary)';
    e.currentTarget.style.color = 'var(--text-secondary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, width: '100%', resize: 'none', outline: 'none',
          border: '0.5px solid var(--border)', borderRadius: 8, padding: 12,
          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
          fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.6,
        }}
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 2px 0', fontSize: 11, color: 'var(--text-muted)',
      }}>
        <span>{value.length.toLocaleString()} caracteres</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={SECONDARY_BUTTON_STYLE}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
        <button
          onClick={handleDownload}
          style={SECONDARY_BUTTON_STYLE}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          Descargar .txt
        </button>
      </div>
    </div>
  );
}
