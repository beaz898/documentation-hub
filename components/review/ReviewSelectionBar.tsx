'use client';

import { useEffect, useState } from 'react';

/**
 * TOPE DEL EXHAUSTIVO (F-71 paso 2). Tres documentos, no veinte como el rápido.
 *
 * Cada exhaustivo tarda entre 1 y 6 minutos y el bucle es EN SERIE por
 * obligación —el semáforo de concurrencia es por organización, así que el
 * siguiente no puede ni encolarse hasta que el anterior termine—. Tres son ya
 * hasta un cuarto de hora con la pestaña abierta, y si se cierra la tanda queda
 * a medias sin forma de retomarla. Más que eso no es un producto, es una
 * trampa.
 *
 * El tope se sube el día que exista cola persistente.
 */
const MAX_EXHAUSTIVE_SELECTION = 3;

interface Props {
  selectedCount: number;
  estimatedCost: number;
  /** F-71 paso 2: coste de la misma selección en exhaustivo (30/documento). */
  exhaustiveCost: number;
  creditsRemaining: number | null;
  /**
   * F-71 paso 2: si el plan admite análisis exhaustivo. `null` = todavía no se
   * sabe (el resumen de cuenta aún no ha cargado) y se trata como permitido:
   * el endpoint tiene la última palabra, y deshabilitar por un dato que aún no
   * ha llegado sería peor que dejar que el 403 lo explique.
   *
   * OJO, deuda consciente: esto DUPLICA el veto del backend
   * (analyze-v2/route.ts:135-147, `plan === 'free'`). Lo limpio sería un
   * `hasExhaustive` en PLAN_FEATURES expuesto por /api/usage/summary, como
   * hasDrive o hasAnalyticsPanel — hoy no existe, y crearlo es otra pieza.
   * Mientras no exista, este espejo es lo que evita ofrecer algo que el
   * usuario no puede comprar.
   */
  planAllowsExhaustive: boolean | null;
  maxSelection: number;
  analyzing: boolean;
  progress?: { current: number; total: number; currentName: string; phase?: string } | null;
  onAnalyze?: () => void;
  onAnalyzeExhaustive?: () => void;
}

export default function ReviewSelectionBar({
  selectedCount,
  estimatedCost,
  exhaustiveCost,
  creditsRemaining,
  planAllowsExhaustive,
  maxSelection,
  analyzing,
  progress,
  onAnalyze,
  onAnalyzeExhaustive,
}: Props) {
  // Doble clic: el primer clic ARMA el botón, el segundo lanza. 30 créditos por
  // documento contra 5 no puede irse en un clic despistado.
  const [exhaustiveArmed, setExhaustiveArmed] = useState(false);

  // Un botón armado no se queda armado: cambiar la selección lo desarma,
  // porque el importe que mostraba ya no es el que se cobraría.
  useEffect(() => {
    setExhaustiveArmed(false);
  }, [selectedCount]);

  // Y pinchar fuera también. Sin esto, el botón se queda esperando un segundo
  // clic que puede llegar diez minutos después, sobre otra intención.
  useEffect(() => {
    if (!exhaustiveArmed) return;
    const disarm = () => setExhaustiveArmed(false);
    window.addEventListener('click', disarm);
    return () => window.removeEventListener('click', disarm);
  }, [exhaustiveArmed]);

  if (selectedCount === 0) return null;

  const insufficient =
    creditsRemaining !== null && estimatedCost > creditsRemaining;
  const canAnalyze = !!onAnalyze && !analyzing && !insufficient;

  const exhaustiveInsufficient =
    creditsRemaining !== null && exhaustiveCost > creditsRemaining;
  const overExhaustiveLimit = selectedCount > MAX_EXHAUSTIVE_SELECTION;
  // null (aun cargando) cuenta como permitido: ver el comentario de la prop.
  const planBlocked = planAllowsExhaustive === false;
  const canAnalyzeExhaustive =
    !!onAnalyzeExhaustive && !analyzing && !planBlocked && !exhaustiveInsufficient && !overExhaustiveLimit;

  // El plan va PRIMERO: si no puedes comprarlo, el coste y el tope sobran.
  const exhaustiveHint = planBlocked
    ? 'El analisis exhaustivo requiere un plan superior (desde Starter)'
    : overExhaustiveLimit
    ? `El exhaustivo admite ${MAX_EXHAUSTIVE_SELECTION} documentos como maximo (tarda minutos por documento)`
    : exhaustiveInsufficient
      ? `Exhaustivo: ${exhaustiveCost} creditos · no te alcanzan`
      : `Exhaustivo: ${exhaustiveCost} creditos · tarda minutos por documento y hay que dejar la pestana abierta`;

  const buttonBase = {
    flexShrink: 0,
    padding: '9px 16px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        marginTop: 8,
        borderRadius: 10,
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {selectedCount} seleccionado{selectedCount === 1 ? '' : 's'}
          {selectedCount >= maxSelection && (
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
              {' '}(maximo por tanda)
            </span>
          )}
        </span>
        {analyzing && progress ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Analizando {progress.current} de {progress.total}: {progress.currentName}
            {progress.phase && ` · ${progress.phase}`}
          </span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: insufficient ? '#991b1b' : 'var(--text-muted)' }}>
              Coste estimado: {estimatedCost} credito{estimatedCost === 1 ? '' : 's'}
              {' · '}
              Disponibles: {creditsRemaining === null ? '—' : creditsRemaining}
              {insufficient && ' · creditos insuficientes'}
            </span>
            <span style={{
              fontSize: 11,
              color: planBlocked || overExhaustiveLimit || exhaustiveInsufficient ? '#991b1b' : 'var(--text-muted)',
            }}>
              {exhaustiveHint}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onAnalyze?.()}
          disabled={!canAnalyze}
          style={{
            ...buttonBase,
            border: 'none',
            background: canAnalyze ? 'var(--brand)' : 'var(--bg-tertiary)',
            color: canAnalyze ? '#fff' : 'var(--text-muted)',
            cursor: canAnalyze ? 'pointer' : 'not-allowed',
          }}
        >
          {analyzing
            ? progress
              ? `Analizando ${progress.current}/${progress.total}...`
              : 'Analizando...'
            : `Analizar seleccionados (${selectedCount})`}
        </button>

        <button
          onClick={(e) => {
            // stopPropagation: sin esto, el listener de window que desarma
            // atraparia este mismo clic y el boton nunca llegaria a armarse.
            e.stopPropagation();
            if (!canAnalyzeExhaustive) return;
            if (!exhaustiveArmed) {
              setExhaustiveArmed(true);
              return;
            }
            setExhaustiveArmed(false);
            onAnalyzeExhaustive?.();
          }}
          disabled={!canAnalyzeExhaustive}
          title={exhaustiveHint}
          style={{
            ...buttonBase,
            border: `0.5px solid ${canAnalyzeExhaustive ? (exhaustiveArmed ? '#991b1b' : 'var(--border)') : 'var(--border)'}`,
            background: exhaustiveArmed ? '#991b1b' : 'transparent',
            color: exhaustiveArmed
              ? '#fff'
              : canAnalyzeExhaustive ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: canAnalyzeExhaustive ? 'pointer' : 'not-allowed',
          }}
        >
          {exhaustiveArmed
            ? `Confirmar · ${exhaustiveCost} creditos`
            : 'Analisis exhaustivo'}
        </button>
      </div>
    </div>
  );
}
