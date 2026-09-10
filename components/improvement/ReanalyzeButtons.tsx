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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

      {/* ⚠️ B.180 SIGUE CUMPLIDA, Y ESTO ES LO QUE LA CUMPLE (10/09/2026).
          El precio salió de las dos etiquetas y NO se fue a un `title`: está
          aquí, en la pantalla, debajo de los botones que cobran. Lo que B.180
          prohíbe es que el precio dependa de PASAR EL RATÓN —un tooltip no
          existe en un táctil, y sería invisible justo para quien no tiene otra
          forma de verlo—; una línea de texto en reposo no es eso. Lo que cambia
          es dónde se pinta, no si se ve ni de dónde sale.

          ⚠️ Y SIGUE DERIVADO de `sufijoDeCoste` → `CREDIT_COSTS`, que es lo que
          el servidor cobra de verdad. Escribir «2 créditos» a mano aquí sería la
          segunda definición del precio que `coste-visible.ts` existe para
          impedir, y el nombre de cada acción sale del mismo `t()` que su botón:
          ni el precio ni la etiqueta se copian, se preguntan.

          LA FORMA es la de la bandeja (`ReviewSelectionBar`): `fontSize: 11` y
          `var(--text-muted)`, la misma con la que allí se pinta «Coste estimado:
          N créditos». No se comparte el componente porque no hay componente que
          compartir —allí es un `span` dentro de un bloque de información con
          otras tres líneas, aquí es una línea suelta bajo dos botones—; lo que
          SÍ se comparte es la única pieza que importa que no se separe, que es
          el origen del número. */}
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {`${t('reanalyzeStyle')}: ${sufijoDeCoste('/api/analyze-style')}`}
        {' · '}
        {`${t('reanalyzeCorpus')}: ${sufijoDeCoste('/api/analyze-v2:exhaustive')}`}
      </span>
    </div>
  );
}
