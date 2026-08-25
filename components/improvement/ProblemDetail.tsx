'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Problem } from './problems';

/**
 * Cuerpo de la ficha de un problema en el panel de mejora (F-70).
 *
 * Componente de PRESENTACIÓN puro: no calcula nada, no llama a nada, no toca
 * `p.description` — que sigue siendo la única cadena que leen los tres prompts
 * de ImprovementModal. Aquí solo se decide cómo se enseña.
 *
 * Dos formas, una sola entrada:
 *   - SIN comparedValues (prosa, hallazgos sin estructura, y todos los
 *     análisis guardados antes de d384a315): el `<p>` de siempre con
 *     `p.description`, con los mismos estilos exactos que tenía en
 *     ChatPanel.tsx. Nada cambia para ellos.
 *   - CON comparedValues: una entrada por columna discrepante, con los dos
 *     valores enfrentados y las filas completas plegadas debajo.
 */

/** Estilo literal del `<p>` que este componente sustituye en ChatPanel. Se
 *  copia tal cual —no se "mejora"— para que la forma degradada se vea
 *  exactamente igual que antes de este commit. */
const DESCRIPTION_STYLE = {
  fontSize: 10,
  color: 'var(--text-secondary)',
  margin: 0,
  lineHeight: 1.4,
} as const;

/** Un valor puede llegar vacío (celda ausente en esa fila). El backend manda
 *  cadena vacía a propósito y deja la presentación del hueco aquí. */
function displayValue(v: string): string {
  return v.trim() === '' ? '—' : v;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="8" height="8" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-secondary)" strokeWidth="3"
      style={{
        transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 0.15s ease',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Etiqueta tenue + valor destacado, en líneas separadas. Nunca en una sola
 *  línea con un separador: un valor real del corpus es "Implantólogo /
 *  Cirujano oral", y cualquier "/" o "|" de adorno se leería como parte del
 *  dato. */
function SideLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ marginTop: 2 }}>
      <span style={{ fontSize: 9, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
        {label}
      </span>
      <div style={{
        fontSize: 10,
        // El valor enfrentado manda: se lee primero, más fuerte que su
        // etiqueta. La fila completa es contexto y va atenuada.
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        lineHeight: 1.4,
        wordBreak: 'break-word',
        // Las filas se persisten en una línea, pero si alguna trajera saltos
        // se respetan en vez de colapsarse.
        whiteSpace: 'pre-wrap',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function ProblemDetail({ p }: { p: Problem }) {
  const t = useTranslations('analysis');
  const [rowsOpen, setRowsOpen] = useState(false);

  const compared = p.comparedValues;
  if (!compared || compared.length === 0) {
    return <p style={DESCRIPTION_STYLE}>{p.description}</p>;
  }

  // El nombre del otro documento hace de etiqueta. Es un nombre de fichero
  // largo: envuelve (wordBreak en SideLine), no se recorta con puntos
  // suspensivos — recortarlo escondería justo la parte que lo distingue.
  const otherLabel = p.relatedDoc || t('detailOtherDoc');
  const hasRows = Boolean(p.newDocRow || p.existingDocRow);

  return (
    <div>
      {compared.map((cv, i) => (
        <div key={`${cv.column}-${i}`} style={{ marginTop: i === 0 ? 0 : 6 }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-primary)' }}>
            {cv.column}
          </div>
          <SideLine label={t('detailThisDoc')} value={displayValue(cv.newDocValue)} />
          <SideLine label={otherLabel} value={displayValue(cv.existingDocValue)} />
        </div>
      ))}

      {hasRows && (
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            // La tarjeta entera es clicable y lleva al fragmento en el editor
            // (onGoToProblem). Sin stopPropagation, desplegar la fila te
            // sacaría de sitio — mismo motivo que en "No es error" y
            // "Solventar".
            onClick={(e) => { e.stopPropagation(); setRowsOpen(o => !o); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: 0, border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 10, color: 'var(--text-secondary)',
            }}
          >
            <Chevron open={rowsOpen} />
            <span>{t('viewFullRow')}</span>
          </button>

          {rowsOpen && (
            <div style={{ marginTop: 4 }}>
              {p.newDocRow && <SideLine label={t('detailThisDoc')} value={p.newDocRow} muted />}
              {p.existingDocRow && <SideLine label={otherLabel} value={p.existingDocRow} muted />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
