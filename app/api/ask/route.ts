import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { queryRAG } from '@/lib/rag';

export async function POST(req: NextRequest) {
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
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Obtener orgId del usuario (usamos el user.id como orgId por simplicidad)
    const orgId = user.user_metadata?.org_id || user.id;

    // Validar body
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return NextResponse.json(
        { error: 'La pregunta debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Ejecutar RAG
    const result = await queryRAG(question.trim(), orgId);

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

    if (message.includes('rate_limit') || message.includes('429')) {
      return NextResponse.json(
        { error: 'Límite de peticiones excedido. Espera unos segundos.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Error procesando la pregunta' },
      { status: 500 }
    );
  }
}
