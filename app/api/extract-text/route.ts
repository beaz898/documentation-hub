import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { extractText } from '@/lib/chunking';

export const maxDuration = 60;

/**
 * Downloads a file from Storage and returns its extracted plain text.
 * Used by the improvement modal to load the initial editor content.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { storagePath, fileName } = body;

    if (!storagePath || !fileName) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Error descargando archivo' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, fileName);

    if (!text || text.trim().length < 1) {
      return NextResponse.json({ error: 'No se pudo extraer texto del archivo' }, { status: 400 });
    }

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    console.error('Error in /api/extract-text:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
