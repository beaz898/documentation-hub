import type { ConfirmationMode, ToolName } from './types';

export interface ShouldConfirmParams {
  mode: ConfirmationMode;
  tool_name: ToolName;
  is_improvising: boolean;       // El agente va a improvisar fuera de doc
  is_over_estimate: boolean;     // Va a superar la estimación de créditos
  has_external_effect: boolean;  // Acción con efecto externo (Fase C+)
}

const READ_ONLY_TOOLS = new Set<ToolName>(['search_docs', 'read_doc', 'list_docs']);

export function shouldConfirm(params: ShouldConfirmParams): boolean {
  const { mode, tool_name, is_improvising, is_over_estimate, has_external_effect } = params;

  // Herramientas de solo lectura: nunca requieren confirmación
  if (READ_ONLY_TOOLS.has(tool_name)) return false;

  // Reglas no negociables: SIEMPRE confirman, en todos los modos
  if (is_improvising) return true;
  if (is_over_estimate) return true;
  if (has_external_effect) return true;

  // ask_user y escalate ya son pausas naturales, no requieren confirmación previa
  if (tool_name === 'ask_user' || tool_name === 'escalate') return false;
  // warn no pausa nunca
  if (tool_name === 'warn') return false;

  if (mode === 'autonomous') return false;

  if (mode === 'milestones') {
    // Solo confirma antes del output final
    return tool_name === 'finalize';
  }

  if (mode === 'step_by_step') {
    // Confirma antes del output final; búsquedas y lecturas son solo lectura
    return tool_name === 'finalize';
  }

  return false;
}
