import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { getStagedForDocument } from '@/lib/document-staged';

/**
 * GET /api/documents/[id]/text
 * Devuelve el texto completo de un documento de la organización del usuario.
 * Lo usa la bandeja de revisión para analizar/mejorar documentos ya indexados,
 * que no tienen archivo en Supabase Storage.
 * No es solo-admin: cualquier miembro de la organización puede revisar sus documentos.
 *
 * Staged-first (C.4d-2a): si el documento tiene una versión en vuelo en
 * document_staged (nueva versión pendiente de análisis), se devuelve el texto del
 * staged, no el de la generación activa. textSource distingue el origen del texto
 * ('staged' | 'principal') y generation indica la generación servida.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });

  const { id } = await params;
  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, name, full_text, analysis_status, source, chunk_count, active_generation')
    .eq('id', id)
    .eq('org_id', org.orgId)   // aislamiento: solo documentos de la propia organización
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  // Staged-first: si hay una versión en vuelo con texto, es la que se revisa.
  const staged = await getStagedForDocument(supabase, id, org.orgId);
  if (staged && staged.fullText) {
    return NextResponse.json({
      id: doc.id,
      name: doc.name,
      text: staged.fullText,
      analysisStatus: doc.analysis_status,
      source: doc.source,
      chunkCount: staged.chunkCount,
      textSource: 'staged',
      generation: staged.generation,
    });
  }

  if (!doc.full_text) {
    // Documentos antiguos (anteriores a que se guardara full_text) o vacíos.
    return NextResponse.json(
      { error: 'Este documento no tiene texto guardado. No se puede analizar ni mejorar desde la bandeja.', errorType: 'no_full_text' },
      { status: 422 },
    );
  }

  return NextResponse.json({
    id: doc.id,
    name: doc.name,
    text: doc.full_text,
    analysisStatus: doc.analysis_status,
    source: doc.source,
    chunkCount: doc.chunk_count,
    textSource: 'principal',
    generation: doc.active_generation,
  });
}
