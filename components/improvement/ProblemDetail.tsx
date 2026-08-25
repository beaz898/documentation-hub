'use client';

import { useState, type ReactNode } from 'react';
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
 *   - CON comparedValues: una FRASE por columna discrepante, con la columna y
 *     los dos valores resaltados dentro, y las filas completas plegadas
 *     debajo. Va en prosa y con el mismo estilo de párrafo que la forma
 *     degradada para que se lea como un solapamiento, no como una tabla.
 *
 * La frase la compone next-intl a partir de su plantilla: los trozos NUNCA se
 * concatenan en el código, porque el orden de las partes cambia entre idiomas
 * ("figura como X; en DOC, como Y" no se traduce pieza a pieza). El resaltado
 * entra por `t.rich` con la etiqueta <hl> dentro de la propia plantilla, por
 * lo mismo: partir la frase en fragmentos para pegarlos en el JSX ataría el
 * orden al castellano.
 *
 * Todo el texto sale de datos ya verificados en origen (comparedValues, F-70)
 * y de las plantillas de traducción. Ninguna palabra viene de un modelo.
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

/** Extensiones que el sistema ingiere (ver lib/chunking.ts). Se quitan solo
 *  estas, no "lo que haya detrás del último punto": un documento llamado
 *  "Protocolo v1.2" perdería el ".2". */
const KNOWN_EXTENSION = /\.(xlsx|xls|docx|doc|pdf|txt|md|csv|json|pptx)$/i;

/** Código del documento al principio del nombre: LETRAS-DÍGITOS seguido de
 *  "_" o "-". */
const DOCUMENT_CODE = /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+-\d+)[_-]/;

/**
 * Nombre corto del documento para meterlo DENTRO de la frase, donde cae justo
 * entre los dos valores que hay que comparar y compite con ellos.
 *
 * Es una CONVENCIÓN DE NOMBRES DEL CLIENTE, no del sistema: nada en Doclity
 * obliga a llamar a un fichero "OPE-02_...". Por eso el respaldo devuelve el
 * nombre ÍNTEGRO (solo sin su extensión) en vez de recortarlo: un cliente que
 * nombre sus documentos de otra forma debe seguir leyendo un nombre completo,
 * no un muñón con puntos suspensivos. Nunca se corta por longitud.
 */
function shortDocumentName(name: string): string {
  const withoutExtension = name.replace(KNOWN_EXTENSION, '');
  const code = DOCUMENT_CODE.exec(withoutExtension);
  return code ? code[1] : withoutExtension;
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

/** Etiqueta tenue + valor debajo, en líneas separadas. La usan las filas
 *  completas del plegado: son largas y van una encima de otra, nunca en una
 *  sola línea con un separador — un valor real del corpus es "Implantólogo /
 *  Cirujano oral", y cualquier "/" o "|" de adorno se leería como dato. */
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

  // Dos formas del mismo nombre, cada una donde corresponde:
  //  - `otherLabel`, íntegro, para el plegado: ahí hay sitio y sirve para
  //    identificar el fichero sin ambigüedad. Envuelve (wordBreak en
  //    SideLine), no se recorta.
  //  - `otherShort`, el código, para la frase: ahí cae entre los dos valores
  //    que hay que comparar y el nombre completo se los come.
  const otherLabel = p.relatedDoc || t('detailOtherDoc');
  const otherShort = p.relatedDoc ? shortDocumentName(p.relatedDoc) : t('detailOtherDoc');
  const hasRows = Boolean(p.newDocRow || p.existingDocRow);

  // Un valor puede llegar vacío (celda ausente en esa fila). El backend manda
  // cadena vacía a propósito y deja aquí cómo se presenta el hueco: dentro de
  // una frase, un guion suelto no se entiende — hace falta una palabra.
  const valueOrEmpty = (v: string) => (v.trim() === '' ? t('detailEmptyValue') : v);

  const highlight = {
    hl: (chunks: ReactNode) => (
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{chunks}</span>
    ),
  };

  return (
    <div>
      {compared.map((cv, i) => (
        <p key={`${cv.column}-${i}`} style={{ ...DESCRIPTION_STYLE, marginTop: i === 0 ? 0 : 4 }}>
          {t.rich('detailSentence', {
            ...highlight,
            column: cv.column,
            newValue: valueOrEmpty(cv.newDocValue),
            doc: otherShort,
            existingValue: valueOrEmpty(cv.existingDocValue),
          })}
        </p>
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
