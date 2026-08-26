'use client';

import { useTranslations } from 'next-intl';

/**
 * Aviso de análisis incompleto (F-71).
 *
 * Se pinta cuando `stageFailures` no viene vacío: alguna etapa del pipeline
 * cayó a su fallback por fallo del LLM y el resultado NO es una foto completa
 * del corpus. Sin este aviso, un análisis con todas las etapas caídas se ve
 * exactamente igual que uno bueno — cero contradicciones, cero solapamientos —
 * y el cliente lo lee como "está limpio".
 *
 * Va ARRIBA DEL TODO y en rojo a propósito: no es un hallazgo más de la lista,
 * es una advertencia sobre la fiabilidad de toda la lista.
 *
 * No enumera las etapas caídas: al cliente no le dice nada que fallara "el
 * rerank" o "el double-check". El detalle técnico vive en
 * `FinalAnalysis.stageFailures` (persistido en el jsonb) y en los logs.
 */
export default function IncompleteAnalysisNotice({ count }: { count: number }) {
  const t = useTranslations('analysis');

  if (count <= 0) return null;

  return (
    <div
      role="alert"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        marginBottom: 10,
        background: 'var(--danger-light)',
        border: '0.5px solid var(--danger)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger-text)', margin: '0 0 3px 0' }}>
        {t('incompleteTitle')}
      </p>
      <p style={{ fontSize: 11, color: 'var(--danger-text)', margin: 0, lineHeight: 1.45 }}>
        {t('incompleteBody', { count })}
      </p>
    </div>
  );
}
