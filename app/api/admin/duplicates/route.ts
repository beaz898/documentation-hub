import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

interface DuplicateCopy {
  id: string;
  name: string;
  source: string;
  provider_file_id: string | null;
  created_at: string;
}

interface DuplicateGroup {
  contentHash: string;
  copies: DuplicateCopy[];
}

// GET: Devuelve los grupos de documentos duplicados exactos (mismo content_hash)
// de la organización, solo los que tienen más de una copia. Solo lectura.
// Reservado a administradores (mismo gate que cleanup-orphans).
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización.' },
        { status: 403 }
      );
    }
    if (org.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden usar esta herramienta.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    // Traer todos los documentos con hash de la organización.
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, name, source, provider_file_id, created_at, content_hash')
      .eq('org_id', orgId)
      .not('content_hash', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`[DUPLICATES] select fallo | org=${orgId} | code=${error.code ?? '?'} | ${error.message}`);
      return NextResponse.json({ error: 'Error leyendo documentos' }, { status: 500 });
    }

    // Agrupar por content_hash en memoria y quedarnos solo con los grupos > 1.
    const byHash = new Map<string, DuplicateCopy[]>();
    for (const doc of documents ?? []) {
      const hash = doc.content_hash as string;
      const copy: DuplicateCopy = {
        id: doc.id,
        name: doc.name,
        source: doc.source,
        provider_file_id: doc.provider_file_id,
        created_at: doc.created_at,
      };
      const existing = byHash.get(hash);
      if (existing) {
        existing.push(copy);
      } else {
        byHash.set(hash, [copy]);
      }
    }

    const groups: DuplicateGroup[] = [];
    for (const [contentHash, copies] of byHash.entries()) {
      if (copies.length > 1) {
        groups.push({ contentHash, copies });
      }
    }

    return NextResponse.json({
      groups,
      totalGroups: groups.length,
      totalDuplicateDocuments: groups.reduce((acc, g) => acc + g.copies.length, 0),
    });
  } catch (error: unknown) {
    console.error('Error in /api/admin/duplicates:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
