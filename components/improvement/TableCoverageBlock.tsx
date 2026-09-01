'use client';

import { useTranslations } from 'next-intl';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import CollapsibleSection from '../CollapsibleSection';
import { etiquetasDeMontones, indiceDeColumnas, tieneCobertura } from './table-coverage';

/**
 * EL CONTENIDO DEL GRUPO «SIN CORRESPONDENCIA» (F-88, ficha A, 2ª revisión).
 *
 * VIVE DENTRO DE LA LISTA DE PROBLEMAS, como un grupo más al lado de
 * Contradicciones, Duplicidades y las demás: plegable igual que ellos y con su
 * recuento en el titular. Antes era un bloque aparte debajo, y le comía sitio
 * al chat — que es la otra mitad útil del modal.
 *
 * EL CRITERIO GENERAL DE ESTA PANTALLA, para no repetirlo: todo lo que produce
 * el análisis va DENTRO de la caja de problemas. El chat no cede más espacio.
 *
 * Aquí solo va lo INFORMATIVO — lo que no reclama juicio:
 *
 *   · el índice de columnas: dónde están las diferencias, de un vistazo;
 *   · presente solo en X: los dos montones, cada uno con SU documento;
 *
 * ⚠️ Y LAS IDÉNTICAS SALIERON DETRÁS, la misma tarde, a una LÍNEA al final de la
 * lista —no a un grupo plegable: son solo un número y un desplegable no tendría
 * qué desplegar—. Con su salida el titular de este bloque cuenta exactamente lo
 * que hay dentro, que era el objeto de las dos decisiones.
 *
 * ⚠️ LAS DIFERENCIAS SOLO DE ESCRITURA SALIERON DE AQUÍ el 01/09/2026, a ranura
 * propia (`WritingVariantsBlock`). Vivían dentro y eran la causa del defecto que
 * la decisión cierra: el titular de este grupo cuenta FILAS AJENAS, así que un
 * par cuyo único resultado fueran variantes anunciaba «Sin correspondencia (0)»
 * con cosas debajo. El cálculo y su contador siguen intactos — se retiró la
 * carga, nunca la medida (F-94 P7).
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
          // SIN CAJA PROPIA: ya está dentro del grupo de la lista, y una caja
          // dentro de otra solo añade ruido. El título queda para distinguir
          // parejas cuando hay más de una.
          <div key={grupo.groupId} style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 2px 0' }}>
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

          </div>
        );
      })}
    </div>
  );
}
