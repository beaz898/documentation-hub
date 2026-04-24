import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { chunkText, extractText } from '@/lib/chunking';
import { runAnalysisPipeline, runExhaustiveAnalysisPipeline } from '@/lib/analysis/pipeline';
import { logUsage } from '@/lib/usage-logger';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 120;

/**
 * Analyze v2 — pipeline de 4 etapas con LLM-as-judge.
 * Body: { storagePath?, fileName, text?, exhaustive? }
 *
 * Cuando exhaustive=true se usa el pipeline exhaustivo:
 * - Hash SHA-256 para duplicados exactos (coste cero, 100% precisión).
 * - Todos los chunks del documento (sin muestreo).
 * - Capas adicionales de verificación (se irán activando en fases futuras).
 */
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

    const body = await req.json();
    const { storagePath, fileName, text: directText, exhaustive } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName requerido' }, { status: 400 });
    }

    // Rate limiting (límite separado para rápido y exhaustivo)
    const isExhaustive = exhaustive === true;
    const rateCheck = await checkRateLimit(supabase, userId, '/api/analyze-v2', isExhaustive);
    if (!rateCheck.allowed) {
      const modeLabel = isExhaustive ? 'análisis exhaustivos' : 'análisis';
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de ${modeLabel} (${rateCheck.limit}). Inténtalo mañana.`, remaining: 0 },
        { status: 429 }
      );
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

    // Chunking
    const chunks = chunkText(text, 'temp-id', fileName, orgId);

    // Selección de fragmentos: muestreo para rápido, todos para exhaustivo
    const sampleTexts = isExhaustive
      ? chunks.map(c => c.text)
      : pickSampledTexts(chunks);

    const modeLabel = isExhaustive ? 'exhaustivo' : 'rápido';
    console.log(`[analyze-v2] "${fileName}" — ${chunks.length} chunks, ${sampleTexts.length} samples (${modeLabel})`);

    // Ejecutar pipeline correspondiente
    const analysis = isExhaustive
      ? await runExhaustiveAnalysisPipeline({
          newDocumentText: text,
          newDocumentName: fileName,
          sampleTexts,
          orgId,
          supabase,
        })
      : await runAnalysisPipeline({
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
      analysis.recommendation !== 'INDEXAR' ||
      (analysis.styleProblems && analysis.styleProblems.length > 0);

    const latencyMs = Date.now() - startedAt;

    await logUsage(supabase, {
      userId,
      orgId,
      endpoint: '/api/analyze-v2',
      model: 'haiku',
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      success: true,
      userQuery: `${fileName} (${modeLabel})`,
    });

    return NextResponse.json({
      success: true,
      hasIssues,
      analysisMode: analysis.analysisMode,
      analysis: {
        isDuplicate: analysis.isDuplicate,
        duplicateOf: analysis.duplicateOf,
        duplicateConfidence: analysis.duplicateConfidence,
        overlaps: analysis.overlaps,
        discrepancies: analysis.discrepancies,
        newInformation: analysis.newInformation,
        recommendation: analysis.recommendation,
        summary: analysis.summary,
        analysisMode: analysis.analysisMode,
        styleProblems: analysis.styleProblems,
      },
      documentSources,
    });
  } catch (error: unknown) {
    console.error('[analyze-v2] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';

    if (userId) {
      await logUsage(supabase, {
        userId,
        orgId,
        endpoint: '/api/analyze-v2',
        model: 'haiku',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: message,
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
// Helpers
// ============================================================

/** Extrae textos muestreados de los chunks para el análisis rápido. */
function pickSampledTexts(chunks: Array<{ text: string }>): string[] {
  const total = chunks.length;
  const targetSamples = total <= 20
    ? Math.min(8, total)
    : total <= 60
      ? 15
      : 25;
  const indices = pickSampleIndices(total, targetSamples);
  return indices.map(i => chunks[i].text);
}

/** Selecciona índices distribuidos uniformemente por el documento. */
function pickSampleIndices(total: number, count: number): number[] {
  if (total <= count) return Array.from({ length: total }, (_, i) => i);
  const indices: number[] = [];
  const step = (total - 1) / (count - 1);
  for (let i = 0; i < count; i++) indices.push(Math.round(i * step));
  return [...new Set(indices)];
}
