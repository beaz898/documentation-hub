/**
 * EL CONFLICTO NORMATIVO, COMO CAMPO PROPIO DE UNA CONTRADICCIÓN (3.4, fase 1 · 26/10/2026).
 *
 * F-129 generalizó el 3.4: además de la contradicción de siempre —dos valores imposibles a la vez para el mismo dato—,
 * existe el conflicto entre una norma y otra (`norma_contra_norma`, el caso D) o entre una norma y una práctica
 * (`norma_contra_practica`). Es una CATEGORÍA con dos subtipos, y va en un campo propio, `conflictoNormativo`:
 *   · presente, dice la categoría y el subtipo a la vez;
 *   · ausente, la contradicción es la de siempre (la de todos los análisis guardados hasta hoy).
 *
 * ⚠️ NO ES UN VALOR MÁS DE `severity`, y no puede serlo: el verificador convierte cualquier severidad que no sea
 * 'contradiction' en 'minor_inconsistency' (verify-findings.ts, `toOutcome`), y pipeline.ts la escribe encima de la
 * del juez. Dentro de `severity`, la especie se perdería en la primera etapa que la mira.
 *
 * El tipo y la lista de valores válidos viven AQUÍ y sólo aquí: los tipos y la frontera (llm-boundary.ts) los
 * importan, para que el criterio de qué es un conflicto normativo válido no exista dos veces.
 */
export const CONFLICTOS_NORMATIVOS = ['norma_contra_norma', 'norma_contra_practica'] as const;

export type ConflictoNormativo = (typeof CONFLICTOS_NORMATIVOS)[number];

export function esConflictoNormativo(valor: unknown): valor is ConflictoNormativo {
  return typeof valor === 'string' && (CONFLICTOS_NORMATIVOS as readonly string[]).includes(valor);
}
