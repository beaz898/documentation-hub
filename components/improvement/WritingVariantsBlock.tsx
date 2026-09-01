'use client';

import { useTranslations } from 'next-intl';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import { tieneVariantes } from './table-coverage';

/**
 * EL CONTENIDO DEL GRUPO «DIFERENCIAS SOLO DE ESCRITURA» (decisión de producto,
 * 01/09/2026).
 *
 * QUÉ ES: la cuarta clase que F-88 P4 especificó. La fila difiere, pero en nada
 * que signifique algo distinto — «Chamberí» contra «CHAMBERI». No es una
 * discrepancia y no reclama juicio.
 *
 * POR QUÉ SALE A RANURA PROPIA Y NO SIGUE DENTRO DE «SIN CORRESPONDENCIA»:
 * aquel titular cuenta FILAS AJENAS, así que un par cuyo único resultado fueran
 * variantes anunciaba «Sin correspondencia (0)» con cosas debajo. Un cero en un
 * titular con contenido se lee como avería. Las otras dos salidas —renombrar el
 * grupo, o contar en el titular todo lo informativo— o no arreglaban nada o
 * rompían la regla que hace fiable el número (F-84 P1b: los recuentos miden lo
 * que dicen medir). Cada grupo cuenta lo suyo.
 *
 * SIGUE VIGENTE TODO LO DE F-88 P4: no son discrepancias, no entran en el array
 * de contradicciones, no suman en los contadores planos, no llevan huella y no
 * tienen botones. Son información, y va plegada.
 *
 * ⚠️ Y EL CÁLCULO NO SE TOCA. `diff.clasificacion.variantes_escritura` tiene
 * lector: es la medida de incidencia que B.97 espera del mundo real y que el
 * corpus no puede dar —cero en 10.174 comparaciones—. F-94 P7 fue explícito:
 * si la pantalla cambia, se retira la carga, nunca el contador.
 *
 * EL PINTADO NO TIENE BATERÍA (el alcance de la suite prohíbe React). Lo que
 * DECIDE algo —`tieneVariantes`, el recuento y el orden— vive en
 * `table-coverage.ts`, que sí la tiene.
 */
export default function WritingVariantsBlock({ grupos }: { grupos: GrupoDeTablas[] }) {
  const t = useTranslations('analysis');

  // EL MISMO FILTRO QUE ABRE LA RANURA. `hayRanuraDeVariantes` es
  // `.some(tieneVariantes)`, así que si hay ranura hay al menos un grupo aquí:
  // la ranura no puede pintarse vacía sin que la batería se entere.
  const conVariantes = grupos.filter(tieneVariantes);
  if (conVariantes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
        {t('tableCardWritingVariantsHint')}
      </p>

      {conVariantes.map(grupo => (
        <div key={grupo.groupId}>
          {/* EL INDICATIVO (F-83 P2): de qué documento del corpus se habla.
              Nunca «nueva» ni «anterior» — eso presupondría un linaje temporal
              que el sistema no conoce. */}
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 3px 0' }}>
            {t('tableCoverageTitle', { doc: grupo.documentoExistente })}
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
        </div>
      ))}
    </div>
  );
}
