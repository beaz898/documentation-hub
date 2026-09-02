'use client';

import { useTranslations } from 'next-intl';

/**
 * Aviso de análisis NO GUARDADO (regla 6, memoria del fallo, 02/09/2026).
 *
 * QUÉ ARREGLA: si la fila de `analysis_results` no se pudo escribir, hasta hoy
 * el fallo iba a consola y el usuario cerraba el modal creyendo que su análisis
 * estaba en la bandeja y en la analítica. No estaba en ninguna parte.
 *
 * ⚠️ NO ES EL AVISO DE INCOMPLETO, Y POR ESO ES OTRO COMPONENTE. Aquél dice que
 * el resultado está DEGRADADO —y dispara el reembolso automático—; éste dice
 * que el resultado es BUENO y no se ha conservado. El usuario recibió lo que
 * pagó, así que aquí no hay nada que devolver.
 *
 * EN NARANJA Y NO EN ROJO, por lo mismo: lo que tiene delante es correcto. Lo
 * que ha fallado es la memoria, no el análisis.
 *
 * NO SE OFRECE REINTENTAR, y es una decisión (02/09), no una falta: el reintento
 * exigiría un endpoint que acepta un análisis del cliente y lo persiste, y eso
 * abre dos agujeros —escritura fabricada en la tabla con la que nos medimos, y
 * filas duplicadas cuando el guardado sí funcionó pero la respuesta se perdió—.
 * Está anotado como pendiente con la salida que los cierra (payload firmado).
 */
export default function UnsavedAnalysisNotice({ visible }: { visible: boolean }) {
  const t = useTranslations('analysis');

  if (!visible) return null;

  return (
    <div
      role="status"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        marginBottom: 10,
        background: 'var(--warning-light, rgba(255,176,32,0.12))',
        border: '0.5px solid var(--warning, #d98324)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning-text, #8a5200)', margin: '0 0 3px 0' }}>
        {t('unsavedTitle')}
      </p>
      <p style={{ fontSize: 11, color: 'var(--warning-text, #8a5200)', margin: 0, lineHeight: 1.45 }}>
        {t('unsavedBody')}
      </p>
    </div>
  );
}
