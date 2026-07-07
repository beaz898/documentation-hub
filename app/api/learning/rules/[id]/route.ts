import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { updateRule, deleteRule } from '@/lib/learning/rules';
import type { UpdateRuleInput, RuleStatus } from '@/lib/learning/types';

const VALID_STATUSES: RuleStatus[] = ['pendiente', 'activa', 'archivada'];

// PATCH /api/learning/rules/[id] — edita texto y/o estado (solo admin).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();

  const org = await resolveOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  }
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden gestionar las reglas.' }, { status: 403 });
  }

  const { id: ruleId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const raw = (body ?? {}) as { ruleText?: unknown; status?: unknown };
  const input: UpdateRuleInput = {};
  if (typeof raw.ruleText === 'string') input.ruleText = raw.ruleText;
  if (typeof raw.status === 'string' && VALID_STATUSES.includes(raw.status as RuleStatus)) {
    input.status = raw.status as RuleStatus;
  }

  if (input.ruleText === undefined && input.status === undefined) {
    return NextResponse.json({ error: 'No hay cambios válidos que aplicar.' }, { status: 400 });
  }

  try {
    const rule = await updateRule(supabase, org.orgId, ruleId, input, user.id);
    return NextResponse.json({ success: true, rule });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al actualizar la regla.';
    // Validación (texto vacío / tope de activas / sin cambios) → 400; el resto, 500.
    const isValidation = message.includes('no puede estar vacío')
      || message.includes('Límite alcanzado')
      || message.includes('No hay cambios');
    console.error('[learning] PATCH /rules/[id]:', message);
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 });
  }
}

// DELETE /api/learning/rules/[id] — borra la regla de forma permanente (solo admin).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();

  const org = await resolveOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  }
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden gestionar las reglas.' }, { status: 403 });
  }

  const { id: ruleId } = await params;

  try {
    await deleteRule(supabase, org.orgId, ruleId);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al borrar la regla.';
    console.error('[learning] DELETE /rules/[id]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
