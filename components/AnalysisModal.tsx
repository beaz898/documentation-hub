'use client';

interface AnalysisResult {
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateConfidence?: number;
  overlaps?: Array<{ existingDocument: string; description: string; severity: string }>;
  discrepancies?: Array<{ topic: string; newDocSays: string; existingDocSays: string; existingDocument: string }>;
  newInformation?: string;
  recommendation?: string;
  suggestedActions?: Array<{ action: string; target: string; reason: string }>;
  summary?: string;
}

interface AnalysisModalProps {
  fileName: string;
  analysis: AnalysisResult;
  onConfirm: () => void;
  onCancel: () => void;
  onImprove: () => void;
}

export default function AnalysisModal({ fileName, analysis, onConfirm, onCancel, onImprove }: AnalysisModalProps) {
  const recColor = analysis.recommendation === 'NO_INDEXAR'
    ? { bg: 'var(--danger-light)', text: 'var(--danger-text)', border: 'var(--danger)' }
    : analysis.recommendation === 'REVISAR'
      ? { bg: 'var(--warning-light)', text: 'var(--warning-text)', border: 'var(--warning)' }
      : { bg: 'var(--success-light)', text: 'var(--success-text)', border: 'var(--success)' };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Informe de análisis
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fileName}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cerrar"
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        {analysis.summary && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {analysis.summary}
          </p>
        )}

        {/* Duplicate warning */}
        {analysis.isDuplicate && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 10,
            background: 'var(--warning-light)', border: '0.5px solid var(--warning)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--warning-text)', marginBottom: 2 }}>
              Posible duplicado
            </p>
            <p style={{ fontSize: 12, color: 'var(--warning-text)' }}>
              Similar a &quot;{analysis.duplicateOf}&quot; ({analysis.duplicateConfidence}% confianza)
            </p>
          </div>
        )}

        {/* Discrepancies */}
        {analysis.discrepancies && analysis.discrepancies.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>
              Discrepancias ({analysis.discrepancies.length})
            </p>
            {analysis.discrepancies.map((d, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                background: 'var(--danger-light)', border: '0.5px solid var(--danger)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--danger-text)', marginBottom: 4 }}>{d.topic}</p>
                <p style={{ fontSize: 11, color: 'var(--danger-text)' }}>
                  Nuevo: &quot;{d.newDocSays}&quot;
                </p>
                <p style={{ fontSize: 11, color: 'var(--danger-text)' }}>
                  Existente ({d.existingDocument}): &quot;{d.existingDocSays}&quot;
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Overlaps */}
        {analysis.overlaps && analysis.overlaps.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--info)', marginBottom: 8 }}>
              Solapamientos ({analysis.overlaps.length})
            </p>
            {analysis.overlaps.map((o, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                background: 'var(--info-light)', border: '0.5px solid var(--info)',
              }}>
                <p style={{ fontSize: 12, color: 'var(--info-text)' }}>
                  {o.description}
                </p>
                <p style={{ fontSize: 11, color: 'var(--info-text)', opacity: 0.8 }}>
                  Con &quot;{o.existingDocument}&quot; — severidad: {o.severity}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* New information */}
        {analysis.newInformation && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 12,
            background: 'var(--success-light)', border: '0.5px solid var(--success)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--success-text)', marginBottom: 2 }}>
              Información nueva
            </p>
            <p style={{ fontSize: 12, color: 'var(--success-text)' }}>
              {analysis.newInformation}
            </p>
          </div>
        )}

        {/* Suggested actions */}
        {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Acciones recomendadas
            </p>
            {analysis.suggestedActions.map((a, i) => {
              const icons: Record<string, string> = {
                'REEMPLAZAR': '↻', 'FUSIONAR': '⊕', 'CORREGIR_EXISTENTE': '✎',
                'CORREGIR_NUEVO': '✎', 'IGNORAR': '→',
              };
              return (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '6px 0', borderBottom: i < analysis.suggestedActions!.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' }}>
                    {icons[a.action] || '•'}
                  </span>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                      <strong>{a.action}</strong> — {a.target}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recommendation badge */}
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: recColor.bg, borderLeft: `3px solid ${recColor.border}`,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: recColor.text }}>
            Recomendación: {analysis.recommendation}
          </p>
          <p style={{ fontSize: 12, color: recColor.text, marginTop: 4, lineHeight: 1.5 }}>
            {analysis.recommendation === 'NO_INDEXAR'
              ? 'Este documento es prácticamente idéntico a uno existente. Indexarlo crearía duplicidad.'
              : analysis.recommendation === 'REVISAR'
                ? 'Se detectaron diferencias que podrían causar respuestas contradictorias. Verifica qué versión es correcta.'
                : 'El documento aporta valor y puede indexarse con confianza.'}
          </p>
        </div>

        {/* Action buttons: Cancel | Improve | Index anyway */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10,
              border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            Cancelar subida
          </button>
          <button
            onClick={onImprove}
            style={{
              flex: 1.3, padding: '10px 12px', borderRadius: 10,
              border: '0.5px solid var(--brand)', background: 'var(--brand-light)',
              color: 'var(--brand)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.3 5.8 22l2.4-8.1L2 9.4h7.6L12 2z" />
            </svg>
            Mejorar con IA
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10,
              border: 'none', background: 'var(--brand)', color: '#fff',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Indexar igualmente
          </button>
        </div>
      </div>
    </div>
  );
}
