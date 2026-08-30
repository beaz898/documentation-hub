'use client';

import { useTranslations } from 'next-intl';

import CollapsibleSection from '../CollapsibleSection';
import ProblemDetail from './ProblemDetail';
import { etiquetasDeMontones, indiceDeColumnas, type TarjetaDeTablas } from './table-diff-card';

/**
 * LA TARJETA AGRUPADA DE UNA PAREJA DE TABLAS (F-83 P2 + F-88 P4).
 *
 * CUATRO SECCIONES, y el orden no es decorativo — va de lo que reclama juicio a
 * lo que solo informa:
 *
 *   1. DISCREPANTES — la alarma. Abierta. Son las mismas filas que están en el
 *      array de contradicciones («quince fuera, quince dentro, una tarjeta»,
 *      F-84 P1): aquí se vuelven a juntar para verlas con su contexto.
 *   2. DIFERENCIAS SOLO DE ESCRITURA — información. Plegada. La fila difiere,
 *      pero en nada que signifique algo distinto (F-88 P4).
 *   3. PRESENTE SOLO EN X — información. Plegada, una por documento.
 *   4. IDÉNTICAS — solo el recuento.
 *
 * SIN ACCIONES POR FILA, y sigue siendo deliberado: la tarjeta NO reintroduce
 * por la puerta de atrás los botones que F-88 P2 mandó suprimir. Llegan en la
 * ficha B, sobre huella TABULAR — hasta entonces, verdad sin promesa de
 * memoria.
 *
 * EL PINTADO NO TIENE BATERÍA (el alcance de la suite prohíbe React). Todo lo
 * que DECIDE algo vive en `table-diff-card.ts`, que sí la tiene.
 */
export default function TableDiffCard({
  tarjeta,
  nombreDocumentoAnalizado,
}: {
  tarjeta: TarjetaDeTablas;
  nombreDocumentoAnalizado: string;
}) {
  const t = useTranslations('analysis');
  const { grupo, filas } = tarjeta;

  const columnas = indiceDeColumnas(grupo.porColumna);
  const montones = etiquetasDeMontones(grupo, nombreDocumentoAnalizado);

  return (
    <div
      style={{
        border: '0.5px solid var(--border)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 10,
        background: 'var(--surface)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
        {t('tableCardTitle', { doc: grupo.documentoExistente })}
      </p>

      {/* EL REPARTO POR COLUMNA COMO ÍNDICE (F-83 P2): dice de un vistazo dónde
          está el problema. Sale del RESULTADO y no de los contadores, porque
          sus claves son nombres de columna del cliente (cláusula 5). */}
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
        {columnas.length > 0
          ? t('tableCardColumnIndex', { index: columnas.map(c => `${c.columna} (${c.filas})`).join(', ') })
          : t('tableCardNoColumns')}
      </p>

      {filas.length > 0 && (
        <CollapsibleSection
          title={t('tableCardDiscrepancies')}
          count={filas.length}
          color="#dc2626"
          defaultOpen
        >
          {filas.map(p => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                {p.title}
              </p>
              {/* La pieza de F-70, tal cual: ya pinta los valores enfrentados y
                  trae su propio plegado de las dos filas completas. */}
              <ProblemDetail p={p} />
            </div>
          ))}
        </CollapsibleSection>
      )}

      {grupo.variantesDeEscritura.length > 0 && (
        <CollapsibleSection
          title={t('tableCardWritingVariants')}
          count={grupo.variantesDeEscritura.length}
        >
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0', lineHeight: 1.45 }}>
            {t('tableCardWritingVariantsHint')}
          </p>
          {grupo.variantesDeEscritura.map((v, i) => (
            <div key={`${v.clave}-${i}`} style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {t('tableCardRowsColumns', { columns: v.columnas.join(', ') })}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                {v.enNuevo}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                {v.enOtro}
              </p>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* ⚠️ EL INDICATIVO (F-83 P2, innegociable): cada montón lleva EL NOMBRE
          DEL DOCUMENTO al que pertenece. Jamás «nueva» ni «eliminada» — eso
          presupondría un linaje temporal que el sistema no conoce.
          De quién es cada montón lo decide `etiquetasDeMontones`, que tiene su
          caso con montones ASIMÉTRICOS: con 25 y 25, como da el corpus,
          intercambiarlos no movería ni un número (B.121). */}
      {montones.map(m => (
        <CollapsibleSection
          key={m.documento}
          title={t('tableCardOnlyIn', { doc: m.documento })}
          count={m.filas.length}
        >
          {m.filas.map((f, i) => (
            <p
              key={`${f.clave}-${i}`}
              style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '0 0 3px 0', lineHeight: 1.45, wordBreak: 'break-word' }}
            >
              {f.texto}
            </p>
          ))}
        </CollapsibleSection>
      ))}

      {grupo.identicas > 0 && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0 8px', lineHeight: 1.45 }}>
          {t('tableCardIdentical', { count: grupo.identicas })}
        </p>
      )}
    </div>
  );
}
