'use client';

import { useTranslations } from 'next-intl';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import CollapsibleSection from '../CollapsibleSection';
import { etiquetasDeMontones, indiceDeColumnas, tieneCobertura } from './table-coverage';

/**
 * EL BLOQUE DE COBERTURA de una comparación de tablas (F-88, ficha A revisada).
 *
 * VA DEBAJO DE LAS DISCREPANCIAS, que se pintan como cajas sueltas en la lista
 * de siempre. Aquí solo va lo INFORMATIVO — lo que no reclama juicio:
 *
 *   · el índice de columnas: dónde están las diferencias, de un vistazo;
 *   · presente solo en X: los dos montones, cada uno con SU documento;
 *   · diferencias solo de escritura: la fila difiere en nada que signifique
 *     algo distinto (F-88 P4);
 *   · idénticas: el recuento.
 *
 * TODO PLEGADO POR DEFECTO. Es información, no alarma, y desplegada enterraría
 * lo que sí lo es.
 *
 * POR QUÉ EXISTE ESTE BLOQUE: las cincuenta filas ajenas no tienen otro
 * domicilio. F-84 P1 las dejó fuera de todos los contadores planos —«la
 * cobertura es información sin botón»— y sin este bloque no habría dónde
 * enseñarlas. Es lo único que la tarjeta agrupada aportaba y que no se pierde
 * al volver a las cajas sueltas.
 *
 * EL PINTADO NO TIENE BATERÍA (el alcance de la suite prohíbe React). Lo que
 * DECIDE algo vive en `table-coverage.ts`, que sí la tiene.
 */
export default function TableCoverageBlock({
  grupos,
  nombreDocumentoAnalizado,
}: {
  grupos: GrupoDeTablas[];
  nombreDocumentoAnalizado: string;
}) {
  const t = useTranslations('analysis');

  const conAlgoQueEnsenar = grupos.filter(tieneCobertura);
  if (conAlgoQueEnsenar.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {conAlgoQueEnsenar.map(grupo => {
        const columnas = indiceDeColumnas(grupo.porColumna);
        const montones = etiquetasDeMontones(grupo, nombreDocumentoAnalizado);

        return (
          <div
            key={grupo.groupId}
            style={{
              border: '0.5px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              background: 'var(--surface)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('tableCoverageTitle', { doc: grupo.documentoExistente })}
            </p>

            {/* EL REPARTO POR COLUMNA (F-83 P2): dice de un vistazo dónde está
                el problema. Sale del RESULTADO y no de los contadores, porque
                sus claves son nombres de columna del cliente (cláusula 5). */}
            {columnas.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                {t('tableCardColumnIndex', { index: columnas.map(c => `${c.columna} (${c.filas})`).join(', ') })}
              </p>
            )}

            {/* ⚠️ EL INDICATIVO (F-83 P2, innegociable): cada montón lleva EL
                NOMBRE DEL DOCUMENTO al que pertenece. Jamás «nueva» ni
                «eliminada» — eso presupondría un linaje temporal que el sistema
                no conoce. De quién es cada montón lo decide
                `etiquetasDeMontones`, que tiene su caso con montones
                ASIMÉTRICOS: con 25 y 25, como da el corpus, intercambiarlos no
                movería ni un número (B.121). */}
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

            {grupo.identicas > 0 && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0 8px', lineHeight: 1.45 }}>
                {t('tableCardIdentical', { count: grupo.identicas })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
