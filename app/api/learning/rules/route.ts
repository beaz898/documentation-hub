import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { listRules, createRule } from '@/lib/learning/rules';
import type { CreateRuleInput, RuleKind } from '@/lib/learning/types';

// GET /api/learning/rules — lista todas las reglas de la org (solo admin).
export async function GET(req: NextRequest) {
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

  try {
    const rules = await listRules(supabase, org.orgId);
    return NextResponse.json({ success: true, rules });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al listar las reglas.';
    console.error('[learning] GET /rules:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/learning/rules — crea una regla nueva en estado 'pendiente' (solo admin).
export async function POST(req: NextRequest) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const raw = (body ?? {}) as { ruleText?: unknown; kind?: unknown };
  const ruleText = typeof raw.ruleText === 'string' ? raw.ruleText : '';
  const kind: RuleKind | undefined = raw.kind === 'hecho_dominio' ? 'hecho_dominio'
    : raw.kind === 'convencion' ? 'convencion'
    : undefined;

  const input: CreateRuleInput = { ruleText, kind };

  try {
    const rule = await createRule(supabase, org.orgId, user.id, input);
    return NextResponse.json({ success: true, rule });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al crear la regla.';
    // Errores de validación (texto vacío) → 400; el resto, 500.
    const isValidation = message.includes('no puede estar vacío');
    console.error('[learning] POST /rules:', message);
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 });
  }
}
