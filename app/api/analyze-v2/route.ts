import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { chunkText, extractText } from '@/lib/chunking';
import { runAnalysisPipeline } from '@/lib/analysis/pipeline';

export const maxDuration = 120;

/**
 * Analyze v2 — pipeline de 4 etapas con LLM-as-judge.
 * Body: { storagePath?, fileName, text? }
 * Mismo shape de respuesta que /api/analyze para compatibilidad con el frontend.
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
    const orgId = user.user_metadata?.org_id || user.id;

    const body = await req.json();
    const { storagePath, fileName, text: directText } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName requerido' }, { status: 400 });
    }

    // Obtener texto: desde storage o directo
    let text: string;
    if (directText && typeof directText === 'string') {
      text = directText;
    } else if (storagePath) {
      const { data: fileData, error: dlErr } = await supabase.storage.from('documents').download(storagePath);
      if (dlErr || !fileData) return NextResponse.json({ error: 'Error descargando archivo' }, { status: 500 });
      const buffer = Buffer.from(await fileData.arrayBuffer());
      text = await extractText(buffer, fileName);
    } else {
      return NextResponse.json({ error: 'storagePath o text requeridos' }, { status: 400 });
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente' }, { status: 400 });
    }

    // Muestreo: chunks representativos
    const chunks = chunkText(text, 'temp-id', fileName, orgId);
    const sampleIndices = pickSampleIndices(chunks.length, Math.min(8, chunks.length));
    const sampleTexts = sampleIndices.map(i => chunks[i].text);

    console.log(`[analyze-v2] "${fileName}" — ${chunks.length} chunks, ${sampleTexts.length} samples`);

    // Ejecutar pipeline
    const analysis = await runAnalysisPipeline({
      newDocumentText: text,
      newDocumentName: fileName,
      sampleTexts,
      orgId,
    });

    // Construir documentSources (mapa nombre → fuente) para compatibilidad con frontend actual
    const documentSources: Record<string, 'manual' | 'google_drive'> = {};
    for (const j of analysis.judgments) {
      documentSources[j.documentName] = j.source;
    }

    const hasIssues =
      analysis.isDuplicate ||
      analysis.overlaps.length > 0 ||
      analysis.discrepancies.length > 0 ||
      analysis.recommendation !== 'INDEXAR';

    return NextResponse.json({
      success: true,
      hasIssues,
      analysis: {
        isDuplicate: analysis.isDuplicate,
        duplicateOf: analysis.duplicateOf,
        duplicateConfidence: analysis.duplicateConfidence,
        overlaps: analysis.overlaps,
        discrepancies: analysis.discrepancies,
        newInformation: analysis.newInformation,
        recommendation: analysis.recommendation,
        summary: analysis.summary,
      },
      documentSources,
    });
  } catch (error: unknown) {
    console.error('[analyze-v2] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function pickSampleIndices(total: number, count: number): number[] {
  if (total <= count) return Array.from({ length: total }, (_, i) => i);
  const indices: number[] = [];
  const step = (total - 1) / (count - 1);
  for (let i = 0; i < count; i++) indices.push(Math.round(i * step));
  return [...new Set(indices)];
}
