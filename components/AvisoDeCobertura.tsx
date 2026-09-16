'use client';

import SelectionLimitNotice, { type SelectionLimitItem } from './SelectionLimitNotice';
import { resumirCobertura, textoDeCobertura, type CoberturaDeCandidatos } from '@/lib/analysis/cobertura-de-candidatos';

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
 *   · **Documentos** — comportamiento NORMAL. Se comparó contra los que el
 *     análisis priorizó —por confianza del modelo, y luego por parecido; no
 *     «los más afines», que no siempre es verdad (§5.71)—. No es un límite que
 *     lamentar, es cómo está hecho. Va en tono informativo.
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

  // ⚠️ SALE SIEMPRE, por decisión del director (16/09/2026). Antes llevaba un
  // `&& frase.hayResto` y sólo aparecía cuando se descartaba algo — o sea,
  // nunca en su corpus, porque su filtro deja uno o dos candidatos.
  //
  // LA RAZÓN, que es suya y no estaba en la lista que yo escribí: hoy **no
  // tiene ninguna forma de saber contra cuántos documentos se comparó un
  // análisis**. Ver «se comparó con 2» le dice de un vistazo que su corpus
  // efectivo es minúsculo, que es lo que costó tres días descubrir con SQL.
  // Un aviso que sale siempre pierde fuerza; el silencio de hoy no tiene
  // ninguna.
  //
  // `frase` sigue siendo `null` cuando no hay dato o no hubo comparación: eso
  // no ha cambiado y es lo que evita escribir «se comparó con 0».
  const pintarCobertura = frase !== null;
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
            {/* ⚠️ LA FRASE NO SE ESCRIBE AQUÍ: viene de `textoDeCobertura`, que
                tiene batería. Una redacción dentro del JSX es una redacción sin
                prueba, y ésta tiene dos casos que no son el mismo texto con un
                cero — ver la cabecera de cobertura-de-candidatos.ts. */}
            {textoDeCobertura(frase)}
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
