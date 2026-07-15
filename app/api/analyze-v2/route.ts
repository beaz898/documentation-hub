import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { chunkText, extractText } from '@/lib/chunking';
import { runAnalysisPipeline } from '@/lib/analysis/pipeline';
import { logUsage } from '@/lib/usage-logger';
import { checkRateLimit } from '@/lib/rate-limiter';
import { resolveOrg } from '@/lib/org';
import { consumeCredits, getCreditCost } from '@/lib/credits';
import { checkUploadLock } from '@/lib/upload-lock';
import { saveAnalysisResult } from '@/lib/persist-analysis';
import { usageContext } from '@/lib/observability/usage-context';
import { persistLLMUsage } from '@/lib/observability/record-usage';
import { generateContentHash } from '@/lib/analysis/hash-check';

// Un job en 'pending'/'processing' mas viejo que esto se considera muerto: el
// worker cayo sin marcarlo 'failed' y bloqueaba el 409 de toda la organizacion
// (B.51; ocurrio en produccion el 13/07/2026 al quedarse Railway sin saldo).
// 20 min con margen: el analisis exhaustivo mas largo registrado tardo 6,1 min.
// Hoy no puede haber 'pending' viejos legitimos: el propio 409 impide encolar
// detras de un analisis vivo, asi que un 'pending' de 20 min significa que el
// worker no lo recogio.
// FASE D: al construir la cola (D8), ELIMINAR el umbral de 'pending' y
// sustituirlo por semantica de cola (encolar varios pending sera lo normal),
// y cambiar este umbral grueso por el heartbeat que el worker toque por etapa.
const STALE_JOB_THRESHOLD_MS = 20 * 60 * 1000;

export const maxDuration = 120;

/**
 * Analyze v2 — pipeline de 4 etapas con LLM-as-judge.
 * Body: { storagePath?, fileName, text?, exhaustive?, excludeFingerprints? }
 *
 * Modo rápido: ejecuta el pipeline síncrono y devuelve el resultado.
 * Modo exhaustivo: crea un job en analysis_jobs y devuelve el jobId.
 *   El worker de Railway procesa el job en segundo plano.
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId = '';
  let orgId = '';
  let creditsConsumed = 0;
  const supabase = createServiceClient();

  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    userId = user.id;

    // Resolver organización
    const org = await resolveOrg(supabase, userId);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    orgId = org.orgId;

    // Verificar bloqueo de subidas
    const lockCheck = await checkUploadLock(supabase, orgId, userId);
    if (lockCheck.locked) {
      return NextResponse.json(
        { error: `La subida de documentos está bloqueada por ${lockCheck.lockedByEmail || 'otro usuario'}. Espera a que termine.`, errorType: 'upload_locked' },
        { status: 423 }
      );
    }
    
    const body = await req.json();
    const { storagePath, fileName, text: directText, exhaustive, excludeFingerprints: rawExcludeFps, documentId } = body;

    // Convertir array de huellas descartadas a Set (si viene del frontend)
    const excludeFingerprints = Array.isArray(rawExcludeFps)
      ? new Set<string>(rawExcludeFps)
      : new Set<string>();

    if (!fileName) {
      return NextResponse.json({ error: 'fileName requerido' }, { status: 400 });
    }

    // Rate limiting (límite separado para rápido y exhaustivo)
    const isExhaustive = exhaustive === true;

    // El análisis exhaustivo no está disponible en el plan free
    if (isExhaustive) {
      const { data: orgPlan } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', orgId)
        .single();
      if (orgPlan?.plan === 'free') {
        return NextResponse.json(
          { error: 'El análisis exhaustivo está disponible a partir del plan Starter.' },
          { status: 403 }
        );
      }
    }

    const rateCheck = await checkRateLimit(supabase, userId, '/api/analyze-v2', isExhaustive);
    if (!rateCheck.allowed) {
      const modeLabel = isExhaustive ? 'análisis exhaustivos' : 'análisis';
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de ${modeLabel} (${rateCheck.limit}). Inténtalo mañana.`, remaining: 0 },
        { status: 429 }
      );
    }

    // Verificar y descontar créditos
    const creditResult = await consumeCredits(supabase, orgId, '/api/analyze-v2', isExhaustive);
    if (!creditResult.success) {
      return NextResponse.json(
        {
          error: 'Se han agotado los créditos de tu plan. Contacta con el administrador para recargar o cambiar de plan.',
          errorType: 'no_credits',
          creditsRemaining: creditResult.creditsRemaining,
          creditsExtra: creditResult.creditsExtra,
        },
        { status: 402 }
      );
    }
    creditsConsumed = getCreditCost('/api/analyze-v2', isExhaustive);

    // Obtener texto: desde storage o directo
    let text: string;
    if (directText && typeof directText === 'string') {
      text = directText;
    } else if (storagePath) {
      // El archivo puede no estar completamente escrito en Storage justo tras el upload;
      // reintentamos con espera creciente para evitar falsos "bad XRef" por lectura prematura.
      let extracted: string | null = null;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 400));
        try {
          const { data: fileData, error: dlErr } = await supabase.storage.from('documents').download(storagePath);
          if (dlErr || !fileData) { lastErr = dlErr; continue; }
          const buffer = Buffer.from(await fileData.arrayBuffer());
          extracted = await extractText(buffer, fileName);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (extracted === null) {
        const detail = lastErr instanceof Error ? lastErr.message : 'desconocido';
        console.error('[analyze-v2] extracción falló tras reintentos:', detail);
        return NextResponse.json({ error: 'No se pudo leer el archivo para analizarlo.' }, { status: 400 });
      }
      text = extracted;
    } else {
      return NextResponse.json({ error: 'storagePath o text requeridos' }, { status: 400 });
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente' }, { status: 400 });
    }

    // Chunking
    const chunks = chunkText(text, 'temp-id', fileName, orgId);

    if (isExhaustive) {
      // ── EXHAUSTIVO: crear job y devolver inmediatamente ──────

      // B.51 — Barrer jobs zombis de esta org antes de nada: si el worker murio
      // sin cerrarlos, bloquearian el semaforo indefinidamente. Se marcan
      // 'failed' (no solo se ignoran) para que un worker resucitado no los
      // recoja y acabemos con dos analisis en paralelo de la misma org.
      const staleCutoff = new Date(Date.now() - STALE_JOB_THRESHOLD_MS).toISOString();

      const { data: sweptProcessing } = await supabase
        .from('analysis_jobs')
        .update({ status: 'failed', error_message: 'stale_timeout' })
        .eq('org_id', orgId)
        .eq('status', 'processing')
        .lt('started_at', staleCutoff)
        .select('id');

      const { data: sweptPending } = await supabase
        .from('analysis_jobs')
        .update({ status: 'failed', error_message: 'stale_timeout' })
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .lt('created_at', staleCutoff)
        .select('id');

      const sweptCount = (sweptProcessing?.length ?? 0) + (sweptPending?.length ?? 0);
      if (sweptCount > 0) {
        console.log(`[analyze-v2] B.51: ${sweptCount} job(s) zombi marcados como failed (org: ${orgId})`);
      }

      // Semáforo: verificar que no hay otro exhaustivo activo en esta org
      const { data: activeJobs } = await supabase
        .from('analysis_jobs')
        .select('id, document_name')
        .eq('org_id', orgId)
        .in('status', ['pending', 'processing'])
        .limit(1);

      if (activeJobs && activeJobs.length > 0) {
        return NextResponse.json(
          {
            error: `Ya hay un análisis exhaustivo en curso ("${activeJobs[0].document_name}"). Espera a que termine antes de lanzar otro.`,
            errorType: 'analysis_in_progress',
            activeJobId: activeJobs[0].id,
          },
          { status: 409 }
        );
      }

      // Todos los chunks para exhaustivo
      const sampleTexts = chunks.map(c => c.text);

      // Crear el job
      const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .insert({
          org_id: orgId,
          user_id: userId,
          status: 'pending',
          document_name: fileName,
          document_text: text,
          sample_texts: JSON.stringify(sampleTexts),
          exclude_document_id: body.excludeDocumentId || null,
          exclude_fingerprints: JSON.stringify(Array.from(excludeFingerprints)),
          credits_consumed: creditsConsumed,
        })
        .select('id')
        .single();

      if (jobError || !job) {
        console.error('[analyze-v2] Error creando job:', jobError);
        return NextResponse.json({ error: 'Error al encolar el análisis' }, { status: 500 });
      }

      console.log(`[analyze-v2] Job exhaustivo creado: ${job.id} para "${fileName}" (org: ${orgId})`);

      await logUsage(supabase, {
        userId,
        orgId,
        endpoint: '/api/analyze-v2',
        model: 'haiku',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        success: true,
        creditsConsumed,
        userQuery: `${fileName} (exhaustivo → job ${job.id})`,
      });

      return NextResponse.json({
        success: true,
        async: true,
        jobId: job.id,
        message: 'Análisis exhaustivo en cola. Puedes seguir trabajando mientras se procesa.',
      });
    }

    // ── RÁPIDO: ejecutar síncrono como siempre ──────────────────

    const sampleTexts = pickSampledTexts(chunks);

    console.log(`[analyze-v2] "${fileName}" — ${chunks.length} chunks, ${sampleTexts.length} samples (rápido)`);

    const llmAcc = new Map();
    const analysis = await usageContext.run(llmAcc, () =>
      runAnalysisPipeline({
        newDocumentText: text,
        newDocumentName: fileName,
        sampleTexts,
        orgId,
        supabase,
      })
    );
    void persistLLMUsage({
      accumulator:    llmAcc,
      orgId,
      userId,
      operation:      'analyze_quick',
      creditsCharged: creditsConsumed,
    });

    // Construir documentSources para compatibilidad con frontend
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
      creditsConsumed,
      userQuery: `${fileName} (rápido)`,
    });

    void saveAnalysisResult(supabase, {
      orgId,
      userId,
      documentName: fileName,
      analysis,
      analysisType: 'quick',
      documentId: typeof documentId === 'string' ? documentId : null,
    });

    // B.5-hash-a: si el analisis vino de la bandeja (hay documentId), el
    // documento ya existe: registramos que ESTE texto es el analizado. En el
    // flujo de subida no hay documentId (el doc aun no existe) y lo escribe
    // ingest al indexar.
    if (typeof documentId === 'string') {
      const { error: hashError } = await supabase
        .from('documents')
        .update({ analyzed_content_hash: generateContentHash(text) })
        .eq('id', documentId)
        .eq('org_id', orgId);
      if (hashError) {
        console.error('[analyze-v2] analyzed_content_hash:', hashError.message);
      }
    }

    return NextResponse.json({
      success: true,
      async: false,
      hasIssues,
      analysisMode: analysis.analysisMode,
      analysis: {
        isDuplicate: analysis.isDuplicate,
        duplicateOf: analysis.duplicateOf,
        duplicateConfidence: analysis.duplicateConfidence,
        overlaps: analysis.overlaps,
        discrepancies: analysis.discrepancies,
        minorInconsistencies: analysis.minorInconsistencies,
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
        creditsConsumed,
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
