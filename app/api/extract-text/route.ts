import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { extractText } from '@/lib/chunking';
import { resolveOrg } from '@/lib/org';
import { resolverOrigenDelFichero } from '@/lib/subida/referencia';
import { secretoDeFirma } from '@/lib/analysis/secreto';

export const maxDuration = 60;

/**
 * Downloads a file from Storage and returns its extracted plain text.
 * Used by the improvement modal to load the initial editor content.
 *
 * ⚠️ B.204 — hasta el 10/09/2026 este endpoint AUTENTICABA y no comparaba la
 * ruta con nadie: descargaba con el cliente de servicio lo que le mandaran. El
 * `User` ya llegaba aquí; simplemente se tiraba (`if (!await getAuth...)`).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ref, storagePath, fileName: fileNameDelCuerpo } = body;

    // B.204 commit 2 — LECTURA DUAL CON CADUCIDAD. Si viene `ref`, manda ella y
    // el nombre sale de dentro de la firma; si no, sigue el camino viejo con la
    // guarda de pertenencia del commit 1. El camino viejo se retira en el 4.
    const origen = resolverOrigenDelFichero(
      { ref, storagePath }, { userId: user.id, orgId: org.orgId },
      'extract-text', secretoDeFirma,
    );
    if (!origen.ok) {
      return NextResponse.json({ error: 'Ruta no autorizada' }, { status: 403 });
    }

    // Por la ref el nombre lo puso el servidor; por el camino viejo sigue
    // viniendo del cuerpo, que es lo que se acaba en el commit 4.
    const fileName = origen.via === 'ref' ? origen.fileName : fileNameDelCuerpo;
    if (!fileName) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(origen.ruta);

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
