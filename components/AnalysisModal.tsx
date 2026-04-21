'use client';

import { useState, ReactNode } from 'react';

interface AnalysisResult {
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateConfidence?: number;
  overlaps?: Array<{ existingDocument: string; description: string; severity: string }>;
  discrepancies?: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
    confidence?: 'alta' | 'posible';
  }>;
  newInformation?: string;
  recommendation?: string;
  suggestedActions?: Array<{ action: string; target: string; reason: string }>;
  summary?: string;
  analysisMode?: 'quick' | 'exhaustive';
}

interface AnalysisModalProps {
  fileName: string;
  analysis: AnalysisResult;
  onConfirm: () => void;
  onCancel: () => void;
  onImprove: () => void;
  onExhaustive?: () => void;
}

// ============================================================
// Componente plegable interno
// ============================================================
interface CollapsibleSectionProps {
  title: string;
  count?: number;
  color?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function CollapsibleSection({
  title,
  count,
  color = 'var(--text-secondary)',
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', borderRadius: 6,
          border: 'none', background: 'transparent',
          cursor: 'pointer', textAlign: 'left',
          color, fontSize: 12, fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 10, width: 12, display: 'inline-block' }}>
          {open ? '▾' : '▸'}
        </span>
        <span>
          {title}{typeof count === 'number' ? ` (${count})` : ''}
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 4px 0 22px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Encabezado de bloque (Problemas / Resumen)
// ============================================================
function BlockHeader({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 0.5, color: 'var(--text-muted)',
      margin: '14px 0 6px',
      paddingBottom: 4, borderBottom: '0.5px solid var(--border)',
    }}>
      {children}
    </p>
  );
}

// ============================================================
// Badge de modo de análisis
// ============================================================
function AnalysisModeBadge({ mode }: { mode: 'quick' | 'exhaustive' }) {
  const isExhaustive = mode === 'exhaustive';
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: 0.4, padding: '2px 7px', borderRadius: 4,
      background: isExhaustive ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
      color: isExhaustive ? 'var(--success-text)' : 'var(--info-text)',
      border: `0.5px solid ${isExhaustive ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
    }}>
      {isExhaustive ? '✓ Exhaustivo' : 'Rápido'}
    </span>
  );
}

// ============================================================
// Badge de confianza de contradicción
// ============================================================
function ConfidenceBadge({ confidence }: { confidence: 'alta' | 'posible' }) {
  const isHigh = confidence === 'alta';
  return (
    <span style={{
      fontSize: 8, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: 0.3, padding: '1px 5px', borderRadius: 3,
      background: isHigh ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)',
      color: isHigh ? 'var(--danger-text)' : 'var(--warning-text)',
      border: `0.5px solid ${isHigh ? 'rgba(220,38,38,0.3)' : 'rgba(245,158,11,0.3)'}`,
      flexShrink: 0,
    }}>
      {isHigh ? 'Confirmada' : 'Posible'}
    </span>
  );
}

// ============================================================
// Modal principal
// ============================================================
export default function AnalysisModal({ fileName, analysis, onConfirm, onCancel, onImprove, onExhaustive }: AnalysisModalProps) {
  const recColor = analysis.recommendation === 'NO_INDEXAR'
    ? { bg: 'var(--danger-light)', text: 'var(--danger-text)', border: 'var(--danger)' }
    : analysis.recommendation === 'REVISAR'
      ? { bg: 'var(--warning-light)', text: 'var(--warning-text)', border: 'var(--warning)' }
      : { bg: 'var(--success-light)', text: 'var(--success-text)', border: 'var(--success)' };

  const hasProblems =
    analysis.isDuplicate ||
    (analysis.discrepancies && analysis.discrepancies.length > 0) ||
    (analysis.overlaps && analysis.overlaps.length > 0);

  const hasSummaryItems =
    !!analysis.newInformation ||
    (analysis.suggestedActions && analysis.suggestedActions.length > 0) ||
    !!analysis.recommendation;

  const isExhaustive = analysis.analysisMode === 'exhaustive';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                Informe de análisis
              </h2>
              {analysis.analysisMode && (
                <AnalysisModeBadge mode={analysis.analysisMode} />
              )}
            </div>
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

        {/* Summary general */}
        {analysis.summary && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {analysis.summary}
          </p>
        )}

        {/* ============================================================ */}
        {/* PROBLEMAS DETECTADOS — plegados por defecto */}
        {/* ============================================================ */}
        {hasProblems && (
          <>
            <BlockHeader>Problemas detectados</BlockHeader>

            {analysis.isDuplicate && (
              <CollapsibleSection
                title="Posible duplicado"
                count={1}
                color="var(--warning-text)"
                defaultOpen={false}
              >
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--warning-light)', border: '0.5px solid var(--warning)',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--warning-text)' }}>
                    Similar a &quot;{analysis.duplicateOf}&quot; ({analysis.duplicateConfidence}% confianza)
                  </p>
                </div>
              </CollapsibleSection>
            )}

            {analysis.discrepancies && analysis.discrepancies.length > 0 && (
              <CollapsibleSection
                title="Contradicciones"
                count={analysis.discrepancies.length}
                color="var(--danger)"
                defaultOpen={false}
              >
                {analysis.discrepancies.map((d, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                    background: 'var(--danger-light)', border: '0.5px solid var(--danger)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--danger-text)', flex: 1, margin: 0 }}>{d.topic}</p>
                      {d.confidence && <ConfidenceBadge confidence={d.confidence} />}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--danger-text)' }}>
                      Nuevo: &quot;{d.newDocSays}&quot;
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--danger-text)' }}>
                      Existente ({d.existingDocument}): &quot;{d.existingDocSays}&quot;
                    </p>
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {analysis.overlaps && analysis.overlaps.length > 0 && (
              <CollapsibleSection
                title="Duplicidades"
                count={analysis.overlaps.length}
                color="var(--info)"
                defaultOpen={false}
              >
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
              </CollapsibleSection>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* RESUMEN DEL ANÁLISIS — desplegado por defecto */}
        {/* ============================================================ */}
        {hasSummaryItems && (
          <>
            <BlockHeader>Resumen del análisis</BlockHeader>

            {analysis.newInformation && (
              <CollapsibleSection
                title="Información nueva"
                color="var(--success-text)"
                defaultOpen={true}
              >
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--success-light)', border: '0.5px solid var(--success)',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--success-text)' }}>
                    {analysis.newInformation}
                  </p>
                </div>
              </CollapsibleSection>
            )}

            {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
              <CollapsibleSection
                title="Acciones recomendadas"
                count={analysis.suggestedActions.length}
                color="var(--text-secondary)"
                defaultOpen={true}
              >
                <div>
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
              </CollapsibleSection>
            )}

            {analysis.recommendation && (
              <CollapsibleSection
                title="Recomendación"
                color={recColor.text}
                defaultOpen={true}
              >
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: recColor.bg, borderLeft: `3px solid ${recColor.border}`,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: recColor.text }}>
                    {analysis.recommendation}
                  </p>
                  <p style={{ fontSize: 12, color: recColor.text, marginTop: 4, lineHeight: 1.5 }}>
                    {analysis.recommendation === 'NO_INDEXAR'
                      ? 'Este documento es prácticamente idéntico a uno existente. Indexarlo crearía duplicidad.'
                      : analysis.recommendation === 'REVISAR'
                        ? 'Se detectaron diferencias que podrían causar respuestas contradictorias. Verifica qué versión es correcta.'
                        : 'El documento aporta valor y puede indexarse con confianza.'}
                  </p>
                </div>
              </CollapsibleSection>
            )}
          </>
        )}

        {/* Botón de análisis exhaustivo (solo si aún no es exhaustivo) */}
        {!isExhaustive && onExhaustive && (
          <button
            onClick={onExhaustive}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '0.5px dashed var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 12, transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Análisis exhaustivo — verificación profunda (~1 min)
          </button>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
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
