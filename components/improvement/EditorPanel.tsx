'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface EditorPanelProps {
  value: string;
  onChange: (v: string) => void;
  fileName: string;
}

const SECONDARY_BUTTON_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 12, padding: '7px 12px', borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)',
  cursor: 'pointer', fontWeight: 500,
  transition: 'background 0.15s, color 0.15s',
};

export default function EditorPanel({ value, onChange, fileName }: EditorPanelProps) {
  const t = useTranslations('improvement');
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
    e.currentTarget.style.background = 'var(--bg-secondary)';
    e.currentTarget.style.color = 'var(--text-primary)';
  };
  const onHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--bg-tertiary)';
    e.currentTarget.style.color = 'var(--text-secondary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* ⚠️ AQUÍ NO VA UN `maxWidth`, Y SE PROBÓ ANTES DE DECIDIRLO (11/09/2026).
          Es el sitio donde alguien pondría un tope de columna, así que la razón
          vive aquí y no en un documento aparte.

          LO QUE SE MIDIÓ: con el modal a 1400 el panel queda en ~700 px y el
          texto en ~643, que a 13 px de Inter son **~95-99 caracteres por línea**.
          La banda cómoda de lectura que cita toda la tipografía es 45-75, con 66
          de óptimo. O sea: un tercio por encima del techo teórico.

          LO QUE SE PREDIJO: incomodidad de lectura, y por tanto un tope de
          columna en este `textarea` dejando el sobrante en márgenes o en el otro
          panel.

          ⚠️ **LO QUE DIJO EL LECTOR REAL: que se lee bien.** Mirado en pantalla,
          a 1400, con ancho suficiente. **Predicción fallada, y gana el lector.**

          LA HIPÓTESIS DE POR QUÉ, y va como hipótesis porque nadie la ha medido:
          esto no es prosa continua. Es un documento que se REVISA A SALTOS
          —buscando el fragmento que el panel de al lado señala— y no una novela
          que se lee de arriba abajo. La banda de 45-75 se estableció para lo
          segundo.

          ⚠️ QUIEN QUIERA REABRIRLO NECESITA UN LECTOR, NO LA BANDA. Citar los
          45-75 otra vez no añade nada: ya se citaron, ya perdieron. */}
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
        <span>{t('characters', { count: value.length })}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={SECONDARY_BUTTON_STYLE}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          {copied ? t('copiedButton') : t('copyButton')}
        </button>
        <button
          onClick={handleDownload}
          style={SECONDARY_BUTTON_STYLE}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          {t('downloadTxt')}
        </button>
      </div>
    </div>
  );
}
