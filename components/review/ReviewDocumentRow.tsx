'use client';

import type { ReviewDocument, ReviewAnalysisSummary } from '@/hooks/review/useReviewList';
import { seleccionIndexable } from '@/lib/documents/seleccion-indexable';

/**
 * LAS ETIQUETAS DE ESTADO QUE ESTA PANTALLA PUEDE PINTAR — B.217, 12/09/2026.
 *
 * ⚠️ SOLO QUEDA `pendiente`, Y NO ES UNA PODA COSMÉTICA. Había tres entradas y
 * **dos eran imposibles de alcanzar**: `en_analisis` y `desactualizado` no los
 * escribe nadie desde julio de 2026 —está dicho en `lib/documents/estado.ts:20`—
 * así que eran etiquetas para estados que no existen. Un mapa que promete
 * estados que nadie escribe es una promesa sin nada detrás.
 *
 * ⚠️ Y NO SE TOCA `ESTADOS_DE_ANALISIS`, que es otra cosa: aquella lista es el
 * ESPEJO del `CHECK` de la base y tiene que admitir lo que la base admita, o una
 * fila legítima fallaría su guarda. Esto es un mapa de ETIQUETAS de una pantalla.
 * Retirar lo muerto de la base es otra migración y no se mezcla.
 *
 * ⚠️ `en_revision` NO TIENE ETIQUETA, y es deliberado: hoy tampoco lo escribe
 * nadie. Si algún día alguien empieza a escribirlo, **esta pantalla pintaría la
 * cadena `en_revision` en crudo** por el `?? status` de abajo. Queda declarado
 * aquí y avisado en `lib/documents/estado.ts`, junto al valor.
 */
const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Sin analizar',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pendiente: { bg: '#fef3c7', fg: '#92400e' },
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Subido',
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
};

function buildCountsSummary(doc: ReviewDocument): string | null {
  const a = doc.lastAnalysis;
  if (!a) return null;
  const parts: string[] = [];
  const c = a.counts;
  if (c.contradictions > 0) parts.push(`${c.contradictions} contradiccion${c.contradictions === 1 ? '' : 'es'}`);
  if (c.duplicates > 0) parts.push(`${c.duplicates} duplicado${c.duplicates === 1 ? '' : 's'}`);
  if (c.overlaps > 0) parts.push(`${c.overlaps} solapamiento${c.overlaps === 1 ? '' : 's'}`);
  if (c.minorInconsistencies > 0) parts.push(`${c.minorInconsistencies} menor${c.minorInconsistencies === 1 ? '' : 'es'}`);
  if (c.styleProblems > 0) parts.push(`${c.styleProblems} de estilo`);
  if (parts.length === 0) return 'Sin incidencias';
  return parts.join(' · ');
}

// Detalle de hallazgos de CORPUS de la version staged (los que frenaron el portero).
// Estilo NO entra: no es lo que bloquea la activacion (F-4-rev).
function buildStagedCorpusSummary(a: ReviewAnalysisSummary): string {
  const c = a.counts;
  const parts: string[] = [];
  if (c.contradictions > 0) parts.push(`${c.contradictions} contradiccion${c.contradictions === 1 ? '' : 'es'}`);
  if (c.duplicates > 0) parts.push(`${c.duplicates} duplicado${c.duplicates === 1 ? '' : 's'}`);
  if (c.overlaps > 0) parts.push(`${c.overlaps} solapamiento${c.overlaps === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' · ') : 'hallazgos en el corpus';
}

interface Props {
  document: ReviewDocument;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
  onOpen?: (doc: ReviewDocument) => void;
  onDecide?: (doc: ReviewDocument) => void;
}

export default function ReviewDocumentRow({ document: doc, selected, disabled, onToggle, onOpen, onDecide }: Props) {
  const status = doc.analysis_status;
  const statusColor = STATUS_COLORS[status] ?? { bg: 'var(--bg-tertiary)', fg: 'var(--text-muted)' };
  const statusLabel = STATUS_LABELS[status] ?? status;

  /**
   * ⚠️ LA INSIGNIA PREGUNTA «¿TIENE ANÁLISIS?», NO «¿QUÉ ESTADO TIENE?» — B.217.
   *
   * Hasta el 12/09/2026 salía de `analysis_status`, y eso la volvía una
   * CONSTANTE: la bandeja solo lista lo que no está `analizado`, y el único valor
   * no-`analizado` que alguien escribe es `pendiente`. Así que **toda fila sin
   * versión pendiente decía «Sin analizar»**, tuviera quince contradicciones al
   * lado o ninguna. No es que mintiera a veces: es que no podía decir otra cosa,
   * y una etiqueta que no puede cambiar no avisa de nada el día que haga falta.
   *
   * Es el mismo patrón que `analysis_status` respondiendo a dos preguntas —está
   * escrito en `seleccion-indexable.ts:27-31`, a diez líneas de aquí— y el mismo
   * que un campo llamado «total» que no era el total.
   *
   * ⚠️ SE PREGUNTA A `lastAnalysis`, que ya llega en el payload y que desde B.212
   * apunta al documento correcto. No hace falta pedir nada nuevo.
   *
   * ⚠️ Y DICE QUÉ HACER, NO QUÉ ES: un documento analizado que sigue en la
   * bandeja es exactamente uno que ya se puede añadir al corpus, así que lo útil
   * es «Pendiente de decidir». El color es el que liberó `en_analisis`, no uno
   * nuevo.
   */
  const insignia = doc.lastAnalysis !== null
    ? { texto: 'Pendiente de decidir', bg: '#dbeafe', fg: '#1e40af' }
    : { texto: statusLabel, bg: statusColor.bg, fg: statusColor.fg };
  const sourceLabel = SOURCE_LABELS[doc.source] ?? doc.source;
  const countsSummary = buildCountsSummary(doc);
  const hasDetail = doc.lastAnalysis?.hasDetail ?? true;
  const stagedPending = doc.stagedPending;
  // Staged ya analizado y frenado por el portero (F-12): mostramos "requiere
  // decision" con sus hallazgos exactos, en vez de "pendiente de analisis".
  const stagedDecided = stagedPending && doc.stagedAnalyzed && doc.stagedAnalysis != null;

  /**
   * ⚠️ LA MISMA PREGUNTA QUE EL BOTÓN DE INDEXAR EN LOTE, Y SE LE PREGUNTA A ÉL.
   * Esta condición —analizado y sin versión pendiente— estaba escrita a mano
   * aquí, en dos sitios de este mismo componente (el cursor y el onClick). El
   * botón del lote la necesitaba también, y una tercera copia habría sido la
   * tercera implementación del mismo criterio.
   *
   * Se pregunta por UN documento porque la función contesta igual de bien a uno
   * que a veinte: es el mismo criterio, no una versión reducida.
   */
  const revisable = seleccionIndexable([doc]).puede;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        opacity: disabled && !selected ? 0.55 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled && !selected}
        onChange={() => onToggle(doc.id)}
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        }}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          cursor: (stagedDecided && onDecide) || (revisable && onOpen) ? 'pointer' : 'default',
        }}
        onClick={() => {
          // Un staged AUN NO analizado (stagedPending sin stagedDecided) sigue inerte:
          // su analisis guardado (si lo hay) es de la generacion vieja y "Mejorar con
          // IA" sobre el crearia una tercera identidad (F-9). La via correcta es
          // seleccionarlo y pulsar "Analizar" (rapido, que al completar dispara el
          // swap o, si hay hallazgos de corpus, deja la fila en "Requiere decision").
          // Un staged YA analizado y frenado por el portero (stagedDecided) SI abre,
          // pero en modo decision: el modal muestra los hallazgos de la version nueva
          // para que el humano decida activarla o descartarla.
          if (stagedDecided) {
            if (onDecide) onDecide(doc);
            return;
          }
          if (revisable && onOpen) onOpen(doc);
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={doc.name}
        >
          {doc.name}
        </div>
        {stagedDecided && doc.stagedAnalysis && (
          <div
            style={{
              fontSize: 11,
              color: '#b45309',
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            Versión nueva con hallazgos: {buildStagedCorpusSummary(doc.stagedAnalysis)}
          </div>
        )}
        {stagedPending && !stagedDecided && (
          <div
            style={{
              fontSize: 11,
              color: '#5b21b6',
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            Nueva versión pendiente de análisis
          </div>
        )}
        {!stagedPending && countsSummary && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              opacity: hasDetail ? 1 : 0.7,
            }}
            title={hasDetail ? undefined : 'Analisis anterior: no se guardo el detalle de las incidencias.'}
          >
            {countsSummary}
            {!hasDetail && ' (sin detalle)'}
          </div>
        )}
      </div>

      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {sourceLabel}
      </span>

      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 999,
          background: stagedDecided ? '#fef3c7' : stagedPending ? '#ede9fe' : insignia.bg,
          color: stagedDecided ? '#b45309' : stagedPending ? '#5b21b6' : insignia.fg,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {stagedDecided ? 'Requiere decisión' : stagedPending ? 'Versión nueva' : insignia.texto}
      </span>
    </div>
  );
}
