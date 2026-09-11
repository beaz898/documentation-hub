'use client';

import React from 'react';
import { sufijoDeCoste } from '@/lib/coste-visible';
import { useTranslations } from 'next-intl';

interface ReanalyzeButtonsProps {
  onReanalyzeStyle: () => void;
  onReanalyzeAll: () => void;
  styleLoading: boolean;
  reanalyzingAll: boolean;
}

export default function ReanalyzeButtons({
  onReanalyzeStyle,
  onReanalyzeAll,
  styleLoading,
  reanalyzingAll,
}: ReanalyzeButtonsProps) {
  const t = useTranslations('analysis');
  const anyLoading = styleLoading || reanalyzingAll;

  const baseStyle: React.CSSProperties = {
    fontSize: 12,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    cursor: anyLoading ? 'not-allowed' : 'pointer',
    opacity: anyLoading ? 0.6 : 1,
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        type="button"
        onClick={onReanalyzeStyle}
        disabled={anyLoading}
        style={baseStyle}
        title={t('reanalyzeStyleTitle')}
      >
        {styleLoading ? t('reanalyzingStyle') : t('reanalyzeStyle')}
      </button>
      <button
        type="button"
        onClick={onReanalyzeAll}
        disabled={anyLoading}
        style={baseStyle}
        title={t('reanalyzeAllTitle')}
      >
        {reanalyzingAll ? t('reanalyzingAll') : t('reanalyzeCorpus')}
      </button>
    </div>
  );
}

/**
 * EL PRECIO DE LOS DOS REANÁLISIS — segundo export del MISMO fichero, y por eso.
 *
 * ⚠️ VIVE AQUÍ Y LO COLOCA EL PADRE, que son dos cosas distintas y las dos
 * importan. Vive aquí porque nombra a los botones de arriba y su texto sale del
 * mismo `t()` que sus etiquetas: separarlo de fichero sería invitar a que un día
 * alguien renombre un botón y no la línea que lo explica. Lo coloca el padre
 * porque el 10/09 estaba DENTRO del componente de los botones, lo convirtió en
 * una caja de dos alturas dentro de una fila de una, y dejó los dos reanálisis a
 * distinta altura que el filtro. La cohesión era correcta; el sitio, no.
 *
 * ⚠️ B.180 SIGUE CUMPLIDA. El precio está en la PANTALLA y no en un `title`: lo
 * que B.180 prohíbe es que dependa de pasar el ratón, porque un tooltip no
 * existe en un táctil y sería invisible justo para quien no tiene otra forma de
 * verlo. Una línea de texto en reposo no es eso.
 *
 * ⚠️ Y SIGUE DERIVADO de `sufijoDeCoste` → `CREDIT_COSTS`, que es lo que el
 * servidor cobra de verdad. Escribir «2 créditos» a mano sería la segunda
 * definición del precio que `coste-visible.ts` existe para impedir. Ni el precio
 * ni la etiqueta se copian: se preguntan.
 *
 * LA FORMA es la de la bandeja (`ReviewSelectionBar`): `fontSize: 11` y
 * `var(--text-muted)`, la misma con la que allí se pinta «Coste estimado: N
 * créditos». No se comparte componente porque no hay componente que compartir
 * —allí es un `span` dentro de un bloque con otras tres líneas—; lo que sí se
 * comparte es la única pieza que importa que no se separe: el origen del número.
 */
export function CosteDeReanalisis() {
  const t = useTranslations('analysis');
  return (
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
      {`${t('reanalyzeStyle')}: ${sufijoDeCoste('/api/analyze-style')}`}
      {' · '}
      {`${t('reanalyzeCorpus')}: ${sufijoDeCoste('/api/analyze-v2:exhaustive')}`}
    </span>
  );
}
