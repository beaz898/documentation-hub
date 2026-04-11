import React, { useMemo } from 'react';
import type { Problem, ProblemType } from './problems';

const TYPE_META: Record<ProblemType, { label: string; color: string; bg: string; border: string }> = {
  contradiccion: { label: 'Contradicción', color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.35)' },
  duplicidad:    { label: 'Duplicidad',    color: '#ea580c', bg: 'rgba(234,88,12,0.08)',  border: 'rgba(234,88,12,0.35)' },
  ortografia:    { label: 'Ortografía',    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.35)' },
  ambiguedad:    { label: 'Ambigüedad',    color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.35)' },
  sugerencia:    { label: 'Sugerencia',    color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.35)' },
};

const SOURCE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  google_drive: { label: 'Drive',  color: '#1a73e8', bg: 'rgba(26,115,232,0.08)', border: 'rgba(26,115,232,0.35)' },
  manual:       { label: 'Manual', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.35)' },
};

export interface ProblemsListProps {
  problems: Problem[];
  activeTypes: Set<ProblemType>;
  documentSources?: Record<string, string[]>;
  onGoToProblem: (textRef: string) => void;
}

const ProblemsList: React.FC<ProblemsListProps> = ({
  problems,
  activeTypes,
  documentSources,
  onGoToProblem,
}) => {
  const visibleProblems = useMemo(
    () => problems.filter(p => activeTypes.has(p.type)),
    [problems, activeTypes]
  );

  if (visibleProblems.length === 0) {
    return (
      <div style={{ padding: 16, color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
        No hay problemas que mostrar con los filtros activos.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
      {visibleProblems.map((p) => {
        const meta = TYPE_META[p.type];
        const sources = (p.relatedDoc && documentSources?.[p.relatedDoc]) || [];

        return (
          <div
            key={p.id}
            style={{
              border: `1px solid ${meta.border}`,
              background: meta.bg,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: meta.color,
                  background: '#fff',
                  border: `1px solid ${meta.border}`,
                  padding: '2px 8px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                {meta.label}
              </span>

              {sources.map((src) => {
                const sm = SOURCE_META[src] ?? {
                  label: src,
                  color: '#374151',
                  bg: 'rgba(55,65,81,0.08)',
                  border: 'rgba(55,65,81,0.35)',
                };
                return (
                  <span
                    key={src}
                    title={p.relatedDoc}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: sm.color,
                      background: sm.bg,
                      border: `1px solid ${sm.border}`,
                      padding: '2px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {sm.label}
                  </span>
                );
              })}
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.title}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.45 }}>{p.description}</div>

            {p.relatedDoc && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Documento relacionado: <strong>{p.relatedDoc}</strong>
              </div>
            )}

            {p.textRef && (
              <div>
                <button
                  type="button"
                  onClick={() => onGoToProblem(p.textRef!)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: meta.color,
                    background: '#fff',
                    border: `1px solid ${meta.border}`,
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Ir al problema →
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProblemsList;
