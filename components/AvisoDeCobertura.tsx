'use client';

import SelectionLimitNotice, { type SelectionLimitItem } from './SelectionLimitNotice';
import { resumirCobertura, type CoberturaDeCandidatos } from '@/lib/analysis/cobertura-de-candidatos';

/**
 * LOS AVISOS DE COBERTURA, EN UN SOLO SITIO — B.244 paso 2.
 *
 * ⚠️ POR QUÉ UN COMPONENTE Y NO DOS SUELTOS. Ya había un aviso de cobertura —el
 * de filas, «28 de 39 quedaron fuera por tamaño»— y el director lo ha visto en
 * pantalla. Meter otro al lado, con otra forma y otro color, daría **dos avisos
 * de cobertura con dos formatos distintos en la misma pantalla**, que es peor
 * que tener uno solo. Van juntos, en el mismo bloque y en el mismo hueco donde
 * ya estaba el de filas: el primero de todos, antes de los hallazgos.
 *
 * ⚠️ Y POR QUÉ NO COMPARTEN COLOR. Dicen cosas de distinta especie:
 *
 *   · **Documentos** — comportamiento NORMAL. Se comparó contra los más afines
 *     porque así funciona cualquier recuperación. No es un límite que lamentar,
 *     es cómo está hecho. Va en tono informativo.
 *   · **Filas** — un límite REAL. Esas filas no las miró nadie por presupuesto
 *     de prompt. Va en tono de aviso, que es el que ya tenía.
 *
 * Pintar el primero en amarillo sembraría desconfianza sobre algo correcto, que
 * es exactamente lo que la redacción del director evita.
 */
export default function AvisoDeCobertura({
  cobertura,
  limits,
}: {
  cobertura?: CoberturaDeCandidatos;
  limits?: SelectionLimitItem[];
}) {
  const frase = resumirCobertura(cobertura);

  // ⚠️ AQUÍ VIVE LA DECISIÓN PENDIENTE DEL DIRECTOR, y está a una condición de
  // distancia a propósito. Hoy sólo se pinta si quedó alguno fuera. Enseñarlo
  // TAMBIÉN cuando no queda ninguno —«se compararon los N documentos afines», a
  // secas— es lo único que se vería hoy en su corpus, porque su filtro deja uno
  // o dos candidatos y nunca hay resto. `resumirCobertura` ya calcula el caso:
  // cambiar de idea es quitar `&& frase.hayResto` de esta línea, y nada más.
  const pintarCobertura = frase !== null && frase.hayResto;
  const hayFilas = Boolean(limits && limits.length > 0);

  if (!pintarCobertura && !hayFilas) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      {pintarCobertura && (
        <div
          role="note"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 6,
            marginBottom: hayFilas ? 6 : 0,
            background: 'var(--bg-secondary)',
            border: '0.5px solid var(--border)',
          }}
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            {/* LA REDACCIÓN DEL DIRECTOR, literal en su intención: se compararon
                los MÁS AFINES, y los otros tienen MENOR AFINIDAD. Nunca «no se
                tuvieron en cuenta», que insinúa descuido donde hubo ranking. */}
            Se compararon los <strong>{frase.comparados}</strong> documentos más afines a éste.
            {' '}Otros <strong>{frase.conMenorAfinidad}</strong> tienen menor afinidad con este
            documento y no entraron en la comparación.
            {' '}
            <span style={{ color: 'var(--text-muted)' }}>
              {/* ⚠️ EL MATIZ QUE NO SE PUEDE PROMETER DE MÁS: los documentos NO
                  bajan en el ranking por tener sus problemas arreglados — el
                  ranking es de PARECIDO, no de salud. Lo que cambia al corregir
                  es el contenido, y por eso cambia el mapa de afinidades. El
                  texto dice eso y no promete que «ya estarán bien». */}
              Tras aplicar correcciones conviene reanalizar: al cambiar el contenido cambia
              también qué documentos son más afines, y la comparación puede incorporar otros.
            </span>
          </p>
        </div>
      )}
      <SelectionLimitNotice limits={limits} />
    </div>
  );
}
