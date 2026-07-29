import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

// GET: Lista las lápidas (exclusiones) de la organización. Solo administradores.
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    if (org.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden usar esta herramienta.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    const { data: tombstones, error } = await supabase
      .from('document_tombstones')
      .select('id, source, provider_file_id, original_name, excluded_at')
      .eq('org_id', orgId)
      .order('excluded_at', { ascending: false });

    if (error) {
      console.error(`[TOMBSTONES] select fallo | org=${orgId} | code=${error.code ?? '?'} | ${error.message}`);
      return NextResponse.json({ error: 'Error leyendo exclusiones' }, { status: 500 });
    }

    return NextResponse.json({ tombstones: tombstones ?? [] });
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/tombstones:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Borra una lápida por id (la puerta de salida — recuperar un archivo
// excluido para que el próximo sync lo vuelva a importar). Solo administradores.
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    if (org.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden usar esta herramienta.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    const { searchParams } = new URL(req.url);
    const tombstoneId = searchParams.get('id');
    if (!tombstoneId) {
      return NextResponse.json({ error: 'ID de exclusión requerido' }, { status: 400 });
    }

    // El .eq('org_id', orgId) evita que un admin borre lápidas de otra organización.
    const { error } = await supabase
      .from('document_tombstones')
      .delete()
      .eq('id', tombstoneId)
      .eq('org_id', orgId);

    if (error) {
      console.error(`[TOMBSTONES] delete fallo | org=${orgId} | id=${tombstoneId} | code=${error.code ?? '?'} | ${error.message}`);
      return NextResponse.json({ error: 'No se pudo recuperar el archivo (borrar la exclusión)' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/admin/tombstones:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
