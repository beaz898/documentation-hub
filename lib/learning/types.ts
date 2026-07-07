// lib/learning/types.ts
//
// Dominio "learning" — Aprendizaje Tipo 1 (convenciones de organización).
// Tipos compartidos entre la capa de datos (lib/learning/rules.ts),
// los endpoints (app/api/learning/*) y la UI (components/learning/*).
//
// Espejo de la tabla public.learned_rules (ver supabase-learned-rules.sql).

/**
 * Tipo de conocimiento aprendido.
 * - 'convencion'    : convención de organización (Tipo 1). Único usado en v1.
 * - 'hecho_dominio' : hecho de dominio (Tipo 2). Reservado; aún no se usa.
 *   Nace en el esquema desde el día 1 para evitar una migración dolorosa después.
 */
export type RuleKind = 'convencion' | 'hecho_dominio';

/**
 * Origen de la regla.
 * - 'manual'    : la escribió un admin a mano (v1).
 * - 'destilada' : la propuso el sistema destilando una corrección del chat.
 *   Reservado para la subfase A.2; aún no se genera.
 */
export type RuleSource = 'manual' | 'destilada';

/**
 * Estado de la regla en su ciclo de vida.
 * - 'pendiente' : creada, aún no aplicada al prompt. (Útil sobre todo para A.2.)
 * - 'activa'    : se inyecta en el system prompt del chat y del agente.
 * - 'archivada' : retirada; se conserva como historial pero no se inyecta.
 * Solo 'activa' afecta al comportamiento del LLM.
 */
export type RuleStatus = 'pendiente' | 'activa' | 'archivada';

/**
 * Una regla aprendida, tal cual vive en la base de datos.
 * Los campos coinciden 1:1 con las columnas de public.learned_rules.
 */
export interface LearnedRule {
  id: string;                 // uuid
  orgId: string;              // text (mismo criterio que documents/analysis_results)
  kind: RuleKind;
  ruleText: string;
  source: RuleSource;
  status: RuleStatus;
  createdBy: string | null;   // auth.users.id de quien la creó
  approvedBy: string | null;  // auth.users.id de quien la activó
  createdAt: string;          // ISO 8601
}

/**
 * Datos para crear una regla nueva desde la UI de admin.
 * kind por defecto será 'convencion' en la capa de datos si se omite.
 */
export interface CreateRuleInput {
  ruleText: string;
  kind?: RuleKind;
}

/**
 * Datos para editar una regla existente.
 * Todos opcionales: se actualiza solo lo que venga.
 */
export interface UpdateRuleInput {
  ruleText?: string;
  status?: RuleStatus;
}

/**
 * Tope de reglas ACTIVAS por organización.
 * Se impone en dos capas: la UI lo muestra/bloquea y la capa de datos
 * (lib/learning/rules.ts) lo valida en servidor como defensa en profundidad.
 */
export const MAX_ACTIVE_RULES_PER_ORG = 20;
