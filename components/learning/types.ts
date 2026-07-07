// components/learning/types.ts
//
// Tipos de UI del dominio learning. La vista solo maneja dos estados visibles
// ("activa" / "en pausa"), aunque la BD tenga tres (pendiente/activa/archivada):
// - "activa"   -> status 'activa'
// - "en pausa" -> status 'archivada'  (incluye tanto pausadas como retiradas)
// El estado 'pendiente' de la BD NO se muestra aquí (reservado para A.2).

import type { LearnedRule } from '@/lib/learning/types';

/** Vista de una regla en la UI, derivada de su status de BD. */
export type RuleView = 'active' | 'paused';

/** Traduce el status de BD a la vista de la UI. 'pendiente' se trata como 'paused'
 *  por seguridad, aunque esta pantalla no lo listará. */
export function statusToView(status: LearnedRule['status']): RuleView {
  return status === 'activa' ? 'active' : 'paused';
}
