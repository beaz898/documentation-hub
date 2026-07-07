// lib/learning/rules.ts
//
// Capa de datos del dominio "learning" (aprendizaje Tipo 1).
// Único punto del código que lee/escribe la tabla public.learned_rules.
// - Mapea snake_case (Postgres) <-> camelCase (TS) en un solo lugar.
// - Impone el tope de reglas activas por organización en servidor.
// - getActiveRulesText() es tolerante a fallos: nunca lanza; ante error
//   devuelve '' para que la inyección en el prompt degrade con elegancia.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type LearnedRule,
  type CreateRuleInput,
  type UpdateRuleInput,
  MAX_ACTIVE_RULES_PER_ORG,
} from './types';

const TABLE = 'learned_rules';

// Fila cruda tal como vive en Postgres (snake_case).
interface LearnedRuleRow {
  id: string;
  org_id: string;
  kind: LearnedRule['kind'];
  rule_text: string;
  source: LearnedRule['source'];
  status: LearnedRule['status'];
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
}

// Mapeo único fila -> dominio. Si cambia el esquema, se toca solo aquí.
function rowToRule(row: LearnedRuleRow): LearnedRule {
  return {
    id: row.id,
    orgId: row.org_id,
    kind: row.kind,
    ruleText: row.rule_text,
    source: row.source,
    status: row.status,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
  };
}

/**
 * Lista TODAS las reglas de una organización (cualquier estado),
 * ordenadas por fecha de creación descendente. Para la página de admin.
 * Lanza si la consulta falla (el endpoint traduce el error a HTTP).
 */
export async function listRules(
  supabase: SupabaseClient,
  orgId: string,
): Promise<LearnedRule[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('No se pudieron listar las reglas: ' + error.message);
  return (data as LearnedRuleRow[]).map(rowToRule);
}

/**
 * Cuenta cuántas reglas ACTIVAS tiene una organización.
 * Se usa para imponer MAX_ACTIVE_RULES_PER_ORG en servidor.
 */
export async function countActiveRules(
  supabase: SupabaseClient,
  orgId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'activa');

  if (error) throw new Error('No se pudo contar las reglas activas: ' + error.message);
  return count ?? 0;
}

/**
 * Crea una regla nueva. Nace en estado 'activa' (la crea un admin que la aprueba
 * implícitamente). kind por defecto 'convencion'. source siempre 'manual' en v1.
 * 'pendiente' se reserva para la fase A.2 (reglas auto-destiladas).
 * createdBy = id del admin que la crea (registrado como created_by y approved_by).
 */
export async function createRule(
  supabase: SupabaseClient,
  orgId: string,
  createdBy: string,
  input: CreateRuleInput,
): Promise<LearnedRule> {
  const ruleText = input.ruleText.trim();
  if (!ruleText) throw new Error('El texto de la regla no puede estar vacío.');

  const active = await countActiveRules(supabase, orgId);
  if (active >= MAX_ACTIVE_RULES_PER_ORG) {
    throw new Error(
      'Límite alcanzado: máximo ' + MAX_ACTIVE_RULES_PER_ORG +
      ' reglas activas por organización. Archiva alguna antes de activar otra.',
    );
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      org_id: orgId,
      kind: input.kind ?? 'convencion',
      rule_text: ruleText,
      source: 'manual',
      status: 'activa',
      created_by: createdBy,
      approved_by: createdBy,
    })
    .select('*')
    .single();

  if (error) throw new Error('No se pudo crear la regla: ' + error.message);
  return rowToRule(data as LearnedRuleRow);
}

/**
 * Actualiza el texto y/o el estado de una regla existente de la organización.
 * Si se pasa a 'activa', valida el tope de activas ANTES de escribir
 * (defensa en profundidad; la UI también lo impide).
 * approvedBy se registra cuando la transición es hacia 'activa'.
 */
export async function updateRule(
  supabase: SupabaseClient,
  orgId: string,
  ruleId: string,
  input: UpdateRuleInput,
  approvedBy: string,
): Promise<LearnedRule> {
  // Si se está activando, comprobar el tope primero.
  if (input.status === 'activa') {
    const active = await countActiveRules(supabase, orgId);
    // Puede que esta regla ya estuviera activa; el tope aplica al conjunto final.
    if (active >= MAX_ACTIVE_RULES_PER_ORG) {
      throw new Error(
        'Límite alcanzado: máximo ' + MAX_ACTIVE_RULES_PER_ORG +
        ' reglas activas por organización. Archiva alguna antes de activar otra.',
      );
    }
  }

  const patch: Record<string, unknown> = {};
  if (typeof input.ruleText === 'string') {
    const t = input.ruleText.trim();
    if (!t) throw new Error('El texto de la regla no puede estar vacío.');
    patch.rule_text = t;
  }
  if (input.status) {
    patch.status = input.status;
    if (input.status === 'activa') patch.approved_by = approvedBy;
  }
  if (Object.keys(patch).length === 0) {
    throw new Error('No hay cambios que aplicar.');
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', ruleId)
    .eq('org_id', orgId)   // aislamiento por org: no se toca otra org ni por error
    .select('*')
    .single();

  if (error) throw new Error('No se pudo actualizar la regla: ' + error.message);
  return rowToRule(data as LearnedRuleRow);
}

/**
 * Borra una regla de la organización de forma permanente.
 * (Archivar es la vía blanda; esto es el borrado real desde la UI de admin.)
 */
export async function deleteRule(
  supabase: SupabaseClient,
  orgId: string,
  ruleId: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', ruleId)
    .eq('org_id', orgId);

  if (error) throw new Error('No se pudo borrar la regla: ' + error.message);
}

/**
 * Devuelve el bloque de texto con las reglas ACTIVAS de la organización,
 * ya formateado para inyectar en un system prompt, o '' si no hay ninguna.
 *
 * TOLERANTE A FALLOS A PROPÓSITO: esta función la llaman el chat RAG y el
 * agente en caliente. Si la lectura falla, NO debe tumbar la respuesta:
 * captura el error, lo loggea y devuelve '' (el LLM sigue con solo documentos).
 */
export async function getActiveRulesText(
  supabase: SupabaseClient,
  orgId: string,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('rule_text')
      .eq('org_id', orgId)
      .eq('status', 'activa')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[learning] getActiveRulesText fallo de lectura:', error.message);
      return '';
    }
    const rows = (data as { rule_text: string }[]) ?? [];
    if (rows.length === 0) return '';

    const bullets = rows
      .map((r) => '- ' + r.rule_text.trim())
      .filter((line) => line.length > 2)
      .join('\n');

    return bullets;
  } catch (e) {
    console.error('[learning] getActiveRulesText excepción:', e);
    return '';
  }
}
