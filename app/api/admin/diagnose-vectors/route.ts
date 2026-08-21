import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { fetchVectors, buildAllVectorIds } from '@/lib/pinecone/vectors';

/**
 * Diagnóstico de solo lectura — B.6
 * Compara analysis_status en Supabase vs analysisStatus real en metadata de Pinecone.
 * Solo-admin, opera ÚNICAMENTE sobre la organización del usuario autenticado.
 *
 * GET /api/admin/diagnose-vectors?names=doc1.txt,doc2.txt
 *   names: nombres de documentos separados por coma (se buscan en la org del admin).
 *   No escribe nada ni en Supabase ni en Pinecone.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') return NextResponse.json({ error: 'Solo los administradores pueden usar esta herramienta.' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const namesParam = searchParams.get('names') ?? '';
    const names = namesParam.split(',').map(n => n.trim()).filter(Boolean);

    if (names.length === 0) {
      return NextResponse.json({ error: 'Parámetro names requerido (nombres separados por coma).' }, { status: 400 });
    }

    const { data: rows, error: dbErr } = await supabase
      .from('documents')
      .select('id, name, source, chunk_count, analysis_status, active_generation')
      .eq('org_id', org.orgId)
      .in('name', names);

    if (dbErr) throw new Error('Error leyendo Supabase: ' + dbErr.message);

    const results = [];

    for (const doc of rows ?? []) {
      const chunkCount = (doc.chunk_count as number | null) ?? 0;
      // B.73: con `${doc.id}-${i}` (generación 1 implícita) esta herramienta
      // reportaba existe:false para vectores que SÍ existen en cualquier
      // documento ya promocionado por un swap. Es la herramienta con la que se
      // investigaría precisamente ese fallo, así que mentir aquí es lo peor que
      // podía hacer: cerraría la vía de diagnóstico.
      const generation = (doc.active_generation as number | null) ?? 1;
      const vectorIds = buildAllVectorIds(doc.id as string, chunkCount, generation);

      let fetched: Record<string, { id: string; values: number[]; metadata?: Record<string, unknown> }> = {};
      if (vectorIds.length > 0) {
        fetched = await fetchVectors(org.orgId, vectorIds) as typeof fetched;
      }

      const vectors = vectorIds.map(vid => {
        const rec = fetched[vid];
        return {
          vectorId: vid,
          existe: !!rec,
          analysisStatus_pinecone: (rec?.metadata?.analysisStatus as string | undefined) ?? null,
        };
      });

      results.push({
        name: doc.name,
        source: doc.source ?? 'manual',
        documentId: doc.id,
        analysis_status_supabase: doc.analysis_status,
        chunk_count: chunkCount,
        generation,
        vectors,
      });
    }

    return NextResponse.json({ org: org.orgId, documents: results });
  } catch (error: unknown) {
    console.error('[diagnose-vectors] error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
