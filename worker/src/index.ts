import { createClient } from '@supabase/supabase-js';
import { runExhaustiveAnalysisPipeline } from '../../lib/analysis/pipeline';
import type { ExhaustivePipelineInput } from '../../lib/analysis/pipeline';
import { saveAnalysisResult } from '../../lib/persist-analysis';
import { purgeOrganization, type PurgeResult } from '../../lib/purge-org';
import { refundCredits } from '../../lib/credits';
import { PLANS_WITH_VARIABLE_PRICING } from '../../lib/stripe';

// ============================================================
// Configuración
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Intervalo de polling a la tabla analysis_jobs (ms). */
const POLL_INTERVAL = 5000;

/** Máximo de análisis exhaustivos procesándose a la vez. */
const MAX_CONCURRENT = 2;

/** Intervalo del check de purgado de orgs expiradas (6 horas). */
const PURGE_INTERVAL = 6 * 60 * 60 * 1000;

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
    const sampleTexts: string[] = JSON.parse(job.sample_texts);
    const excludeFpArray: string[] = JSON.parse(job.exclude_fingerprints);
    const excludeFingerprints = new Set<string>(excludeFpArray);

    const input: ExhaustivePipelineInput = {
      newDocumentText: job.document_text,
      newDocumentName: job.document_name,
      sampleTexts,
      orgId: job.org_id,
      excludeDocumentId: job.exclude_document_id || undefined,
      supabase,
      excludeFingerprints,
    };

    const analysis = await runExhaustiveAnalysisPipeline(input);

    const documentSources: Record<string, string> = {};
    for (const j of analysis.judgments) {
      documentSources[j.documentName] = j.source;
    }

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

    // Precio variable / descuento reanálisis
    const isReanalysis = job.exclude_fingerprints !== '[]';
    const confirmedCount = analysis.discrepancies?.length ?? 0;

    if (isReanalysis && confirmedCount < 2) {
      // Reanálisis con pocos errores → reembolso fijo para todos los planes
      const refundResult = await refundCredits(supabase, job.org_id, 20);
      if (refundResult.success) {
        console.log(`[worker] Reanálisis con ${confirmedCount} contradicciones, devolviendo 20 créditos (coste final 10)`);
      } else {
        console.error(`[worker] Job ${job.id}: fallo al devolver créditos de reanálisis`);
      }
    } else {
      // Análisis inicial o reanálisis con >=2 contradicciones → precio variable por plan
      void applyVariablePricingRefund(supabase, job.org_id, job.id, analysis.estimatedCost);
    }

    const discCount = analysis.discrepancies?.length ?? 0;
    const styleCount = analysis.styleProblems?.length ?? 0;
    console.log(`[worker] Job ${job.id} completado en ${latencyMs}ms — ${discCount} discrepancias, ${styleCount} estilo`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`[worker] Job ${job.id} falló:`, errorMessage);

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
// Precio variable: reembolso parcial para Business / Enterprise
// ============================================================

const REFUND_BY_COST: Record<string, number> = {
  light: 10,  // coste final: 20 créditos
  medium: 5,  // coste final: 25 créditos
  heavy: 0,   // coste final: 30 créditos (sin reembolso)
};

async function applyVariablePricingRefund(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string,
  jobId: string,
  estimatedCost: string | undefined,
): Promise<void> {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single();

    if (!org || !PLANS_WITH_VARIABLE_PRICING.has(org.plan)) return;

    const cost = estimatedCost ?? 'heavy';
    const refund = REFUND_BY_COST[cost] ?? 0;

    if (refund === 0) {
      console.log(`[worker] Job ${jobId}: precio variable — coste ${cost}, sin reembolso (plan ${org.plan})`);
      return;
    }

    const refundResult = await refundCredits(supabase, orgId, refund);
    if (refundResult.success) {
      console.log(`[worker] Job ${jobId}: precio variable — coste ${cost}, devueltos ${refund} créditos (plan ${org.plan}, credits_extra ahora: ${refundResult.creditsExtra})`);
    } else {
      console.error(`[worker] Job ${jobId}: precio variable — fallo al devolver ${refund} créditos (plan ${org.plan})`);
    }
  } catch (err) {
    console.error(`[worker] Job ${jobId}: error en applyVariablePricingRefund:`, err);
  }
}

// ============================================================
// Bucle principal de polling
// ============================================================

async function pollAndProcess(): Promise<void> {
  if (activeJobs >= MAX_CONCURRENT) return;

  const supabase = createServiceClient();

  try {
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
// Purga de organizaciones con período de gracia expirado
// ============================================================

async function purgeExpiredOrgs(): Promise<void> {
  const supabase = createServiceClient();

  try {
    const { data: expiredOrgs, error } = await supabase
      .from('organizations')
      .select('id')
      .lt('grace_period_ends_at', new Date().toISOString())
      .is('purged_at', null);

    if (error) {
      console.error('[worker] Error consultando orgs expiradas:', error.message);
      return;
    }

    if (!expiredOrgs || expiredOrgs.length === 0) return;

    console.log(`[worker] Purgando ${expiredOrgs.length} organización(es) expirada(s)`);

    for (const org of expiredOrgs) {
      try {
        const result: PurgeResult = await purgeOrganization(supabase, org.id);
        console.log(`[worker] Org ${org.id} purgada — errores: ${result.errors.length}`, result.errors);
      } catch (err) {
        console.error(`[worker] Error purgando org ${org.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[worker] Error en purgeExpiredOrgs:', err);
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
  console.log(`[worker] Purga de orgs expiradas cada ${PURGE_INTERVAL / 3600000}h`);

  setInterval(pollAndProcess, POLL_INTERVAL);
  pollAndProcess();

  setInterval(purgeExpiredOrgs, PURGE_INTERVAL);
  purgeExpiredOrgs();
}

start();
