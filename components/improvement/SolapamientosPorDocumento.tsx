'use client';

// Los solapamientos (y el duplicado), agrupados por el documento con el que
// coinciden. Sacado de ChatPanel.tsx el 05/10/2026 sin cambio de comportamiento,
// antes de B.314 commit B: ChatPanel iba por 800 líneas y el cambio es aquí.
//
// B.314 commit B: cada entrada del juez enseña una tarjeta por punto, y cada
// documento sale plegado salvo severidad alta. Lo que decide, en solapamientos.ts.

import { useTranslations } from 'next-intl';
import type { Problem, ProblemType } from './problems';
import { mostrarAccionesDeFila } from './problems';
import type { TypeMeta } from './ChatPanel';
import { cabeceraDelDocumento, tarjetasDeLaEntrada, type TarjetaDePunto } from './solapamientos';

interface Props {
  activeItems: Array<{ p: Problem; globalIndex: number }>;
  type: ProblemType;
  meta: TypeMeta;
  sending: boolean;
  /** Los documentos que el usuario ha plegado o desplegado a mano, al revés
   *  de como salían por defecto (`abiertoPorDefecto`). */
  subgruposInvertidos: Set<string>;
  toggleSubGroup: (key: string) => void;
  getDocSourceBadge: (docName?: string) => { label: string; color: string } | null;
  onGoToProblem: (p: Problem) => void;
  onSolveOne: (p: Problem) => void;
  onSolveGroup: (type: ProblemType, problems: Problem[]) => void;
  onDismissProblem: (p: Problem) => void;
}

export default function SolapamientosPorDocumento({
  activeItems, type, meta, sending, subgruposInvertidos, toggleSubGroup,
  getDocSourceBadge, onGoToProblem, onSolveOne, onSolveGroup, onDismissProblem,
}: Props) {
  const t = useTranslations('analysis');
    const subGroupMap = new Map<string, typeof activeItems>();
    for (const item of activeItems) {
      const key = item.p.relatedDoc || 'Sin documento';
      if (!subGroupMap.has(key)) subGroupMap.set(key, []);
      subGroupMap.get(key)!.push(item);
    }
    return <>{[...subGroupMap.entries()].map(([docName, subItems]) => {
      const subKey = `dup-sg-${docName}`;
      const cabecera = cabeceraDelDocumento(subItems.map(({ p }) => p));
      const isSubCollapsed = cabecera.abiertoPorDefecto === subgruposInvertidos.has(subKey);
      return (
        <div key={docName} style={{ marginBottom: 3 }}>
          <div
            onClick={() => toggleSubGroup(subKey)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 8px', borderRadius: 5, cursor: 'pointer', userSelect: 'none',
              background: meta.bg, marginBottom: 2,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="3"
              style={{ transform: isSubCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, flex: 1 }}>
              {t('withDocument', { doc: docName })}
              {cabecera.puntos !== null && ` · ${t('pointCount', { count: cabecera.puntos })}`}
              {cabecera.severidad && ` · ${t('overlapSeverity', { severidad: cabecera.severidad })}`}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onSolveGroup(type, subItems.map(({ p }) => p)); }}
              disabled={sending}
              style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                border: `0.5px solid ${meta.color}`, background: 'transparent', color: meta.color,
                cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600, flexShrink: 0, opacity: sending ? 0.5 : 1,
              }}
            >{t('solveAll')}</button>
          </div>
          {!isSubCollapsed && subItems.map(({ p }) => {
            const srcBadge = getDocSourceBadge(p.relatedDoc);
            // Con lista, el salto es de cada punto y la entrada no se clica entera.
            const tarjetas = tarjetasDeLaEntrada(p);
            const isClickable = !tarjetas && !!p.textRef;
            return (
              <div
                key={p.id}
                onClick={isClickable ? () => onGoToProblem(p) : undefined}
                title={isClickable ? t('goToFragment') : undefined}
                style={{
                  padding: '7px 10px', borderRadius: 7, marginBottom: 3,
                  background: meta.bg, borderLeft: `3px solid ${meta.color}`,
                  cursor: isClickable ? 'pointer' : 'default', transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = meta.border; }}
                onMouseLeave={e => { if (isClickable) e.currentTarget.style.background = meta.bg; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  {srcBadge && (
                    <span style={{
                      fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
                      padding: '1px 5px', borderRadius: 3,
                      background: `${srcBadge.color}1a`, color: srcBadge.color,
                      border: `0.5px solid ${srcBadge.color}66`,
                    }}>{srcBadge.label}</span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>{p.title}</span>
                  {/* F-88 P2: sin acciones por fila en los
                      hallazgos del diff. El porqué, y por qué la
                      condición no vive aquí dentro, en
                      mostrarAccionesDeFila. */}
                  {mostrarAccionesDeFila(p) && (
                    <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDismissProblem(p); }}
                    title={t('markNotError')}
                    style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      border: '0.5px solid var(--text-muted)', background: 'transparent', color: 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 500, flexShrink: 0,
                    }}
                  >{t('dismiss')}</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSolveOne(p); }}
                    disabled={sending}
                    title={t('solve')}
                    style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      border: `0.5px solid ${meta.color}`, background: 'transparent', color: meta.color,
                      cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600, flexShrink: 0, opacity: sending ? 0.5 : 1,
                    }}
                  >{t('solve')}</button>
                    </>
                  )}
                </div>
                {tarjetas
                  ? tarjetas.map(tj => (
                      <TarjetaDelPunto key={tj.clave} tarjeta={tj} otroDocumento={docName} meta={meta} onGoToProblem={onGoToProblem} />
                    ))
                  : <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{p.description}</p>}
              </div>
            );
          })}
        </div>
      );
    })}</>;
}

/** Un punto: qué comparten, y las dos citas con su dueño. Sin botones: los de
 *  la entrada actúan sobre todos sus puntos (ver solapamientos.ts). */
function TarjetaDelPunto({ tarjeta, otroDocumento, meta, onGoToProblem }: {
  tarjeta: TarjetaDePunto; otroDocumento: string; meta: TypeMeta; onGoToProblem: (p: Problem) => void;
}) {
  const t = useTranslations('analysis');
  const salto = tarjeta.salto;
  const sinCita = <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{t('noQuote')}</span>;
  return (
    <div style={{ marginTop: 5, padding: '5px 8px', borderRadius: 5, border: `0.5px solid ${meta.border}` }}>
      <p style={{ fontSize: 10.5, color: 'var(--text-primary)', margin: '0 0 3px', lineHeight: 1.4 }}>{tarjeta.descripcion}</p>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '0 0 2px', lineHeight: 1.4 }}>
        {t('detailThisDoc')}:{' '}
        {salto
          ? <span
              onClick={(e) => { e.stopPropagation(); onGoToProblem(salto); }}
              title={t('goToFragment')}
              style={{ cursor: 'pointer', textDecoration: 'underline dotted', color: meta.color }}
            >&quot;{tarjeta.citaNuevo}&quot;</span>
          : sinCita}
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
        {t('inDocument', { doc: otroDocumento })}:{' '}
        {tarjeta.citaExistente.trim() ? <>&quot;{tarjeta.citaExistente}&quot;</> : sinCita}
      </p>
    </div>
  );
}
