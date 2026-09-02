'use client';

import { useState, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import UploadActions from './AnalysisModal/UploadActions';
import ReviewActions from './AnalysisModal/ReviewActions';
import IncompleteAnalysisNotice from './IncompleteAnalysisNotice';
import UnsavedAnalysisNotice from './UnsavedAnalysisNotice';
import { avisosDelAnalisis } from '@/lib/analysis/avisos';
import SelectionLimitNotice from './SelectionLimitNotice';
// F-88 ficha A: extraida a componente propio — la ficha del diff necesita el
// mismo plegado, y copiarlo habria dejado dos que se separan a la primera.
import CollapsibleSection from './CollapsibleSection';
import type { SelectionLimitItem } from './SelectionLimitNotice';

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
    severity?: 'contradiction' | 'minor_inconsistency';
  }>;
  minorInconsistencies?: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
  }>;
  newInformation?: string;
  recommendation?: string;
  suggestedActions?: Array<{ action: string; target: string; reason: string }>;
  summary?: string;
  analysisMode?: 'quick' | 'exhaustive';
  styleProblems?: Array<{
    type: 'ortografia' | 'ambiguedad' | 'sugerencia';
    title: string;
    description: string;
    textRef: string;
  }>;
  earlyStop?: 'high_overlap' | 'too_many_contradictions';
  /** F-71: etapas que cayeron a su fallback. No vacío = el resultado no es
   *  una foto completa del corpus. */
  stageFailures?: Array<{ stage: string; detail?: string }>;
  /** F-74 P2: tablas cuyas filas no cupieron enteras. Alcance, no hallazgo. */
  selectionLimits?: SelectionLimitItem[];
}

interface AnalysisModalProps {
  fileName: string;
  analysis: AnalysisResult;
  /** Regla 6 (02/09): `false` si el análisis no se pudo guardar. AUSENTE = se
   *  asume guardado, que es lo que corresponde a la bandeja —lo que ella lee
   *  está guardado por definición— y a cualquier cliente anterior. */
  guardado?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onImprove: () => void;
  onExhaustive?: () => void;
  onMinimize?: () => void;
  mode?: 'upload' | 'review';
  onMarkAnalyzed?: () => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  stagedDecision?: boolean;
  onApproveStaged?: () => void | Promise<void>;
  onDiscardStaged?: () => void | Promise<void>;
}

// ============================================================
// Block header
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
// Analysis mode badge
// ============================================================
function AnalysisModeBadge({ mode }: { mode: 'quick' | 'exhaustive' }) {
  const t = useTranslations('analysis');
  const isExhaustive = mode === 'exhaustive';
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: 0.4, padding: '2px 7px', borderRadius: 4,
      background: isExhaustive ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
      color: isExhaustive ? 'var(--success-text)' : 'var(--info-text)',
      border: `0.5px solid ${isExhaustive ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
    }}>
      {isExhaustive ? t('exhaustiveBadge') : t('quickBadge')}
    </span>
  );
}

// ============================================================
// Main modal
// ============================================================
export default function AnalysisModal({ fileName, analysis, guardado, onConfirm, onCancel, onImprove, onExhaustive, onMinimize, mode = 'upload', onMarkAnalyzed, onRemove, stagedDecision = false, onApproveStaged, onDiscardStaged }: AnalysisModalProps) {
  const t = useTranslations('analysis');

  // Los dos avisos se deciden en un solo sitio y con batería (lib/analysis/
  // avisos.ts). Aquí no se recalcula ninguno: son independientes y mezclarlos
  // dispararía el reembolso automático sobre un análisis que no lo merece.
  const avisos = avisosDelAnalisis({ guardado, stageFailures: analysis.stageFailures });

  const recColor = analysis.recommendation === 'NO_INDEXAR'
    ? { bg: 'var(--danger-light)', text: 'var(--danger-text)', border: 'var(--danger)' }
    : analysis.recommendation === 'REVISAR'
      ? { bg: 'var(--warning-light)', text: 'var(--warning-text)', border: 'var(--warning)' }
      : { bg: 'var(--success-light)', text: 'var(--success-text)', border: 'var(--success)' };

  const hasProblems =
    analysis.isDuplicate ||
    (analysis.discrepancies && analysis.discrepancies.length > 0) ||
    (analysis.minorInconsistencies && analysis.minorInconsistencies.length > 0) ||
    (analysis.overlaps && analysis.overlaps.length > 0) ||
    (analysis.styleProblems && analysis.styleProblems.length > 0);

  const hasSummaryItems =
    !!analysis.newInformation ||
    (analysis.suggestedActions && analysis.suggestedActions.length > 0) ||
    !!analysis.recommendation;

  const isExhaustive = analysis.analysisMode === 'exhaustive';

  return (
    <div className="modal-overlay" onClick={onMinimize ?? onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                {t('reportTitle')}
              </h2>
              {analysis.analysisMode && (
                <AnalysisModeBadge mode={analysis.analysisMode} />
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fileName}</p>
          </div>
          <button
            onClick={onMinimize ?? onCancel}
            aria-label={t('minimizeModal')}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* F-71: el aviso va ANTES del resumen — si el análisis está incompleto,
            el resumen que sigue habla de algo que no se llegó a comprobar. */}
        <IncompleteAnalysisNotice count={avisos.etapasCaidas} />

        {/* Regla 6 (02/09): DESPUÉS del de incompleto. Si el análisis está
            degradado, eso es peor noticia que dónde ha quedado guardado. Los
            dos avisos son INDEPENDIENTES y los decide `avisosDelAnalisis`, que
            sí tiene batería: aquí no se recalcula ninguno. */}
        <UnsavedAnalysisNotice visible={avisos.noGuardado} />

        {/* F-74 P2: DESPUES del de incompleto. Si el analisis fallo, lo que no
            se miro por presupuesto es lo de menos. */}
        <SelectionLimitNotice limits={analysis.selectionLimits} />

        {/* General summary */}
        {analysis.summary && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {analysis.summary}
          </p>
        )}

        {/* ============================================================ */}
        {/* DETECTED PROBLEMS */}
        {/* ============================================================ */}
        {hasProblems && (
          <>
            <BlockHeader>{t('detectedProblems')}</BlockHeader>

            {analysis.isDuplicate && (
              <CollapsibleSection
                title={t('possibleDuplicate')}
                count={1}
                color="var(--warning-text)"
                defaultOpen={false}
              >
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--warning-light)', border: '0.5px solid var(--warning)',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--warning-text)' }}>
                    {t('duplicateSimilarTo', { doc: analysis.duplicateOf ?? '', confidence: analysis.duplicateConfidence ?? 0 })}
                  </p>
                </div>
              </CollapsibleSection>
            )}

            {analysis.discrepancies && analysis.discrepancies.length > 0 && (
              <CollapsibleSection
                title={t('contradictions')}
                count={isExhaustive ? analysis.discrepancies.filter(d => d.confidence !== 'posible').length : analysis.discrepancies.length}
                color="var(--danger)"
                defaultOpen={false}
              >
                {!isExhaustive ? (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--danger-light)', border: '0.5px solid var(--danger)',
                  }}>
                    <p style={{ fontSize: 12, color: 'var(--danger-text)', lineHeight: 1.5, margin: 0 }}>
                      {t('quickContradictionsDesc', { count: analysis.discrepancies.length })}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--danger-text)', lineHeight: 1.5, margin: '6px 0 0 0' }}>
                      {t('quickExhaustivePrompt')}
                    </p>
                  </div>
                ) : (
                  analysis.discrepancies.filter(d => d.confidence !== 'posible').map((d, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                      background: 'var(--danger-light)', border: '0.5px solid var(--danger)',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--danger-text)', margin: '0 0 4px 0' }}>{d.topic}</p>
                      <p style={{ fontSize: 11, color: 'var(--danger-text)' }}>
                        {t('labelNew')}: &quot;{d.newDocSays}&quot;
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--danger-text)' }}>
                        {t('labelExisting', { doc: d.existingDocument })}: &quot;{d.existingDocSays}&quot;
                      </p>
                    </div>
                  ))
                )}
              </CollapsibleSection>
            )}

            {isExhaustive && analysis.minorInconsistencies && analysis.minorInconsistencies.length > 0 && (
              <CollapsibleSection
                title={t('inconsistencies')}
                count={analysis.minorInconsistencies.length}
                color="var(--warning-text)"
                defaultOpen={false}
              >
                {analysis.minorInconsistencies.map((d, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                    background: 'var(--warning-light)', border: '0.5px solid var(--warning)',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--warning-text)', margin: '0 0 4px 0' }}>{d.topic}</p>
                    <p style={{ fontSize: 11, color: 'var(--warning-text)' }}>
                      {t('labelNew')}: &quot;{d.newDocSays}&quot;
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--warning-text)' }}>
                      {t('labelExisting', { doc: d.existingDocument })}: &quot;{d.existingDocSays}&quot;
                    </p>
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {analysis.overlaps && analysis.overlaps.length > 0 && (() => {
              const overlaps = analysis.overlaps!;
              const byDoc = new Map<string, typeof overlaps>();
              for (const o of overlaps) {
                if (!byDoc.has(o.existingDocument)) byDoc.set(o.existingDocument, []);
                byDoc.get(o.existingDocument)!.push(o);
              }
              return (
                <CollapsibleSection
                  title={t('duplicates')}
                  count={overlaps.length}
                  color="var(--info)"
                  defaultOpen={false}
                >
                  {[...byDoc.entries()].map(([docName, items]) => (
                    <CollapsibleSection
                      key={docName}
                      title={`${t('overlapWith', { doc: docName })} (${t('fragmentCount', { count: items.length })})`}
                      color="var(--info)"
                      defaultOpen={false}
                    >
                      {items.map((o, i) => (
                        <div key={i} style={{
                          padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                          background: 'var(--info-light)', border: '0.5px solid var(--info)',
                        }}>
                          <p style={{ fontSize: 12, color: 'var(--info-text)' }}>{o.description}</p>
                          <p style={{ fontSize: 11, color: 'var(--info-text)', opacity: 0.8 }}>{t('severityLabel')}: {o.severity}</p>
                        </div>
                      ))}
                    </CollapsibleSection>
                  ))}
                </CollapsibleSection>
              );
            })()}

            {analysis.styleProblems && analysis.styleProblems.length > 0 && (() => {
              const ortografia = analysis.styleProblems!.filter(p => p.type === 'ortografia');
              const ambiguedad = analysis.styleProblems!.filter(p => p.type === 'ambiguedad');
              const sugerencia = analysis.styleProblems!.filter(p => p.type === 'sugerencia');

              const styleColors: Record<string, { color: string; bg: string }> = {
                ortografia: { color: 'var(--danger)', bg: 'var(--danger-light)' },
                ambiguedad: { color: 'var(--warning-text)', bg: 'var(--warning-light)' },
                sugerencia: { color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' },
              };

              const groups: Array<{ label: string; type: string; items: typeof ortografia }> = [];
              if (ortografia.length > 0) groups.push({ label: t('spelling'), type: 'ortografia', items: ortografia });
              if (ambiguedad.length > 0) groups.push({ label: t('ambiguities'), type: 'ambiguedad', items: ambiguedad });
              if (sugerencia.length > 0) groups.push({ label: t('suggestions'), type: 'sugerencia', items: sugerencia });

              return (
                <CollapsibleSection
                  title={t('styleSectionTitle')}
                  count={analysis.styleProblems!.length}
                  color="var(--warning-text)"
                  defaultOpen={false}
                >
                  {groups.map(group => (
                    <div key={group.type} style={{ marginBottom: 8 }}>
                      <p style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                        color: styleColors[group.type].color, letterSpacing: 0.3,
                        marginBottom: 4,
                      }}>
                        {group.label} ({group.items.length})
                      </p>
                      {group.items.map((p, i) => (
                        <div key={i} style={{
                          padding: '6px 10px', borderRadius: 7, marginBottom: 4,
                          background: styleColors[group.type].bg,
                          borderLeft: `2px solid ${styleColors[group.type].color}`,
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {p.title}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                            {p.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </CollapsibleSection>
              );
            })()}
          </>
        )}

        {/* ============================================================ */}
        {/* ANALYSIS SUMMARY */}
        {/* ============================================================ */}
        {hasSummaryItems && (
          <>
            <BlockHeader>{t('analysisSummary')}</BlockHeader>

            {analysis.newInformation && (
              <CollapsibleSection
                title={t('newInformation')}
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
                title={t('recommendedActions')}
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
                title={t('recommendationLabel')}
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
                      ? t('recommendationNoIndexar')
                      : analysis.recommendation === 'REVISAR'
                        ? t('recommendationRevisar')
                        : t('recommendationIndexar')}
                  </p>
                </div>
              </CollapsibleSection>
            )}
          </>
        )}

        {mode === 'review' ? (
          <ReviewActions
            onMarkAnalyzed={onMarkAnalyzed ?? (() => {})}
            onImprove={onImprove}
            onRemove={onRemove ?? (() => {})}
            onClose={onCancel}
            stagedDecision={stagedDecision}
            onApprove={onApproveStaged}
            onDiscard={onDiscardStaged}
          />
        ) : (
          <UploadActions
            isExhaustive={isExhaustive}
            onCancel={onCancel}
            onImprove={onImprove}
            onConfirm={onConfirm}
            onExhaustive={onExhaustive}
          />
        )}
      </div>
    </div>
  );
}
