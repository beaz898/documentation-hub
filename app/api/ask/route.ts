import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { queryRAG } from '@/lib/rag';
import { logUsage } from '@/lib/usage-logger';

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId = '';
  let orgId = '';
  let question = '';
  const supabase = createServiceClient();

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    userId = user.id;
    orgId = user.user_metadata?.org_id || user.id;

    // Validar body
    const body = await req.json();
    question = body.question;
    const { history } = body;

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return NextResponse.json(
        { error: 'La pregunta debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Ejecutar RAG con historial de conversación
    const conversationHistory = Array.isArray(history) ? history : [];
    const result = await queryRAG(question.trim(), orgId, conversationHistory);

    const latencyMs = Date.now() - startedAt;

    // Registrar uso exitoso
    await logUsage(supabase, {
      userId,
      orgId,
      endpoint: '/api/ask',
      model: 'haiku',
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs,
      success: true,
      userQuery: question.trim(),
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      sources: result.sources.map(s => ({
        documentName: s.documentName,
        score: Math.round(s.score * 100),
      })),
      usage: result.usage,
    });
  } catch (error: unknown) {
    console.error('Error in /api/ask:', error);

    const message = error instanceof Error ? error.message : 'Error interno';
    const latencyMs = Date.now() - startedAt;

    // Registrar uso fallido
    if (userId) {
      await logUsage(supabase, {
        userId,
        orgId,
        endpoint: '/api/ask',
        model: 'haiku',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs,
        success: false,
        errorMessage: message,
        userQuery: question?.trim() || undefined,
      });
    }

    // Errores categorizados desde rag.ts
    if (message === 'SERVICE_OVERLOADED') {
      return NextResponse.json(
        {
          error: 'El servicio de IA está experimentando alta demanda en este momento. Esto es temporal y no es un problema con tu consulta ni con tus documentos. Por favor, espera unos segundos e inténtalo de nuevo.',
          errorType: 'overloaded',
        },
        { status: 503 }
      );
    }

    if (message === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        {
          error: 'Se ha superado el límite de consultas por minuto. Por favor, espera un momento antes de hacer otra pregunta.',
          errorType: 'rate_limit',
        },
        { status: 429 }
      );
    }

    if (message === 'AUTH_ERROR') {
      return NextResponse.json(
        {
          error: 'Hay un problema de autenticación con el servicio de IA. Si el problema persiste, contacta con el administrador.',
          errorType: 'auth',
        },
        { status: 500 }
      );
    }

    if (message === 'SERVICE_ERROR') {
      return NextResponse.json(
        {
          error: 'El servicio de IA está temporalmente no disponible. Esto no es un problema de tu cuenta. Por favor, inténtalo de nuevo en unos minutos.',
          errorType: 'service',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error procesando la pregunta. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
