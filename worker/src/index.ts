import { createClient } from '@supabase/supabase-js';
import { runExhaustiveAnalysisPipeline } from '../../lib/analysis/pipeline';
import type { ExhaustivePipelineInput } from '../../lib/analysis/pipeline';
import { saveAnalysisResult } from '../../lib/persist-analysis';

// ============================================================
// Configuración
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Intervalo de polling a la tabla analysis_jobs (ms). */
const POLL_INTERVAL = 5000;

/** Máximo de análisis exhaustivos procesándose a la vez. */
const MAX_CONCURRENT = 2;

/** Contador de jobs activos. */
let activeJobs = 0;

// ============================================================
// Supabase client (service role)
// ============================================================

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================
// Tipos
// ============================================================

interface AnalysisJob {
  id: string;
  org_id: string;
  user_id: string;
  document_name: string;
  document_text: string;
  sample_texts: string;
  exclude_document_id: string | null;
  exclude_fingerprints: string;
  credits_consumed: number;
}

// ============================================================
// Procesamiento de un job
// ============================================================

async function processJob(job: AnalysisJob): Promise<void> {
  const supabase = createServiceClient();
  const t0 = Date.now();

  console.log(`[worker] Procesando job ${job.id}: "${job.document_name}" (org: ${job.org_id})`);

  // Marcar como processing
  await supabase
    .from('analysis_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    // Parsear datos de entrada
    const sampleTexts: string[] = JSON.parse(job.sample_texts);
    const excludeFpArray: string[] = JSON.parse(job.exclude_fingerprints);
    const excludeFingerprints = new Set<string>(excludeFpArray);

    // Preparar input del pipeline
    const input: ExhaustivePipelineInput = {
      newDocumentText: job.document_text,
      newDocumentName: job.document_name,
      sampleTexts,
      orgId: job.org_id,
      excludeDocumentId: job.exclude_document_id || undefined,
      supabase,
      excludeFingerprints,
    };

    // Ejecutar el pipeline exhaustivo completo
    const analysis = await runExhaustiveAnalysisPipeline(input);

    // Construir documentSources
    const documentSources: Record<string, string> = {};
    for (const j of analysis.judgments) {
      documentSources[j.documentName] = j.source;
    }

    // Construir resultado completo (mismo formato que devolvía el endpoint síncrono)
    const result = {
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
      earlyStop: analysis.earlyStop,
      documentSources,
    };

    const latencyMs = Date.now() - t0;

    // Marcar como completed con el resultado
    await supabase
      .from('analysis_jobs')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    void saveAnalysisResult(supabase, {
      orgId: job.org_id,
      userId: job.user_id,
      documentName: job.document_name,
      analysis,
      analysisType: 'exhaustive',
    });

    const discCount = analysis.discrepancies?.length ?? 0;
    const styleCount = analysis.styleProblems?.length ?? 0;
    console.log(`[worker] Job ${job.id} completado en ${latencyMs}ms — ${discCount} discrepancias, ${styleCount} estilo`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`[worker] Job ${job.id} falló:`, errorMessage);

    // Marcar como failed
    await supabase
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}

// ============================================================
// Bucle principal de polling
// ============================================================

async function pollAndProcess(): Promise<void> {
  if (activeJobs >= MAX_CONCURRENT) return;

  const supabase = createServiceClient();

  try {
    // Buscar jobs pendientes, ordenados por antigüedad
    const slotsAvailable = MAX_CONCURRENT - activeJobs;
    const { data: jobs, error } = await supabase
      .from('analysis_jobs')
      .select('id, org_id, user_id, document_name, document_text, sample_texts, exclude_document_id, exclude_fingerprints, credits_consumed')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(slotsAvailable);

    if (error) {
      console.error('[worker] Error consultando jobs:', error.message);
      return;
    }

    if (!jobs || jobs.length === 0) return;

    // Procesar cada job en paralelo (hasta MAX_CONCURRENT)
    for (const job of jobs) {
      activeJobs++;
      processJob(job as AnalysisJob)
        .catch(err => console.error(`[worker] Error no capturado en job ${job.id}:`, err))
        .finally(() => { activeJobs--; });
    }
  } catch (err) {
    console.error('[worker] Error en polling:', err);
  }
}

// ============================================================
// Inicio
// ============================================================

function validateEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_INDEX',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[worker] Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function start(): void {
  validateEnv();

  console.log('[worker] Documentation Hub Analysis Worker iniciado');
  console.log(`[worker] Polling cada ${POLL_INTERVAL / 1000}s, max ${MAX_CONCURRENT} jobs simultáneos`);

  // Polling periódico
  setInterval(pollAndProcess, POLL_INTERVAL);

  // Primera ejecución inmediata
  pollAndProcess();
}

start();
