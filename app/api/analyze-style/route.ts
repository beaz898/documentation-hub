import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { analyzeStyle } from '@/lib/analysis/style-check';
import { logUsage } from '@/lib/usage-logger';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId = '';
  let orgId = '';
  const supabase = createServiceClient();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    userId = user.id;
    orgId = user.user_metadata?.org_id || user.id;

    // Rate limiting
    const rateCheck = await checkRateLimit(supabase, userId, '/api/analyze-style');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de análisis de estilo (${rateCheck.limit}). Inténtalo mañana.`, remaining: 0 },
        { status: 429 }
      );
    }

    const { text, fileName } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente' }, { status: 400 });
    }

    const problems = await analyzeStyle(text, fileName || 'sin nombre');

    const latencyMs = Date.now() - startedAt;

    await logUsage(supabase, {
      userId,
      orgId,
      endpoint: '/api/analyze-style',
      model: 'haiku',
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      success: true,
    });

    console.log(`[ANALYZE-STYLE] OK — problems=${problems.length} latency=${latencyMs}ms`);
    return NextResponse.json({ success: true, problems });
  } catch (error: unknown) {
    console.error('Error in /api/analyze-style:', error);

    if (userId) {
      await logUsage(supabase, {
        userId,
        orgId,
        endpoint: '/api/analyze-style',
        model: 'haiku',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error interno',
      });
    }

    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
