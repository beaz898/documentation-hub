import { createClient } from '@supabase/supabase-js';
import { runExhaustiveAnalysisPipeline } from '../../lib/analysis/pipeline';
import type { ExhaustivePipelineInput } from '../../lib/analysis/pipeline';
import type { StoredChunk } from '../../lib/read-chunks';
import { saveAnalysisResult } from '../../lib/persist-analysis';
import { leerDescartes } from '../../lib/analysis/descartes';
import { purgeOrganization, type PurgeResult } from '../../lib/purge-org';
import { refundCredits } from '../../lib/credits';
import { PLANS_WITH_VARIABLE_PRICING } from '../../lib/stripe';
import { pollConversationTurns } from './conv-handler';
import { startTriggerServer } from './trigger-server';
import { usageContext } from '@/lib/observability/usage-context';
import { persistLLMUsage } from '@/lib/observability/record-usage';

// ============================================================
// Configuración
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Intervalo de polling a la tabla analysis_jobs (ms). */
const POLL_INTERVAL = 10_000;

/** Máximo de jobs simultáneos de cualquier tipo (analysis_jobs + conv turns). */
const MAX_CONCURRENT = 8;

/** Intervalo del check de purgado de orgs expiradas (6 horas). */
const PURGE_INTERVAL = 6 * 60 * 60 * 1000;

/** Un job en 'processing' con started_at mas antiguo que esto se considera
 *  muerto (worker caido): deja de bloquear a su organizacion y puede
 *  reclamarse de nuevo. Coherente con EXHAUSTIVE_LOCK_MS del endpoint. */
const STUCK_JOB_MS = 20 * 60 * 1000;

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
  document_id: string | null;
  exclude_fingerprints: string;
  /** F-71 paso 2: jsonb con los ids de los otros documentos de la tanda.
   *  `string | null` porque un job encolado ANTES de la migración no tiene
   *  la columna en su fila y Supabase la devuelve null. */
  batch_document_ids: string | null;
  credits_consumed: number;
  new_document_chunks: string | null;
}

// ============================================================
// Procesamiento de un job
// ============================================================

async function processJob(job: AnalysisJob): Promise<void> {
  const supabase = createServiceClient();
  const t0 = Date.now();

  console.log(`[worker] Procesando job ${job.id}: "${job.document_name}" (org: ${job.org_id})`);

  // El job ya viene reclamado por pollAndProcess (status='processing' +
  // started_at fijados de forma atomica). No se re-marca aqui.

  try {
    const sampleTexts: string[] = JSON.parse(job.sample_texts);
    const excludeFpArray: string[] = JSON.parse(job.exclude_fingerprints);
    const excludeFingerprints = new Set<string>(excludeFpArray);
    const newDocumentChunks: StoredChunk[] | undefined = job.new_document_chunks
      ? JSON.parse(job.new_document_chunks) ?? undefined
      : undefined;

    // F-71 paso 2: los ids de la tanda. `ExhaustivePipelineInput` ya declaraba
    // el campo desde que existe —lo hereda del input base—, pero llegaba
    // siempre undefined porque nadie lo leía. Lista vacía → undefined, para que
    // buildCorpusFilter reciba lo mismo que recibía antes (CORPUS_ACTIVO sin
    // ampliar) y un job sin tanda no cambie de conducta.
    const batchIdsArray: string[] = job.batch_document_ids
      ? JSON.parse(job.batch_document_ids)
      : [];
    const batchDocumentIds = batchIdsArray.length > 0 ? batchIdsArray : undefined;
    console.log(`[worker] Job ${job.id}: ${batchIdsArray.length} ids de tanda (exhaustivo)`);

    // F-86 paso 3: los descartes permanentes de la organización. El exhaustivo
    // corre AQUÍ, así que si no se leen en el worker no se leen en absoluto —
    // la ruta que encola el job no llega a este punto del pipeline.
    const descartesPersistidos = await leerDescartes(supabase, job.org_id);
    console.log(`[worker] Job ${job.id}: ${descartesPersistidos.size} descartes permanentes de la org`);

    const input: ExhaustivePipelineInput = {
      newDocumentText: job.document_text,
      newDocumentName: job.document_name,
      sampleTexts,
      orgId: job.org_id,
      excludeDocumentId: job.exclude_document_id || undefined,
      batchDocumentIds,
      supabase,
      excludeFingerprints,
      descartesPersistidos,
      newDocumentChunks,
    };

    const llmAcc = new Map();
    const analysis = await usageContext.run(llmAcc, () =>
      runExhaustiveAnalysisPipeline(input)
    );
    // Fire-and-forget: si falla no afecta al resultado ni a los créditos
    void persistLLMUsage({
      accumulator:    llmAcc,
      orgId:          job.org_id,
      userId:         job.user_id,
      operation:      'analyze_exhaustive',
      creditsCharged: job.credits_consumed,
    });

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
      // F-88 paso 2: mismo hueco que en el endpoint, y por eso se añade en el
      // mismo commit que crea el campo. Es la lista que F-71 no amplió.
      tableDiffs: analysis.tableDiffs,
      newInformation: analysis.newInformation,
      recommendation: analysis.recommendation,
      summary: analysis.summary,
      analysisMode: analysis.analysisMode,
      styleProblems: analysis.styleProblems,
      earlyStop: analysis.earlyStop,
      documentSources,
      discardedFindings: analysis.discardedFindings,
      // F-71: mismo hueco que en el endpoint — lista cerrada que 38d3fd22 no
      // amplió con stageFailures, así que el aviso de análisis incompleto no
      // salía tras un reanálisis desde el modal de mejora.
      stageFailures: analysis.stageFailures,
      // F-74 P2: el alcance declarado, por el mismo camino.
      selectionLimits: analysis.selectionLimits,
    };

    const latencyMs = Date.now() - t0;

    // F-71: si alguna etapa cayó a su fallback, el job NO queda 'completed'.
    // 'failed' tampoco sirve: el job SÍ produjo un resultado utilizable y con
    // 'failed' el endpoint de polling devolvería result:null y el frontend lo
    // trataría como error, tirando el análisis parcial. Estado propio.
    const stageFailures = analysis.stageFailures ?? [];
    const incomplete = stageFailures.length > 0;

    await supabase
      .from('analysis_jobs')
      .update({
        status: incomplete ? 'completed_with_errors' : 'completed',
        result,
        ...(incomplete
          ? { error_message: `Análisis incompleto: ${stageFailures.length} etapa(s) fallaron (${[...new Set(stageFailures.map(f => f.stage))].join(', ')})` }
          : {}),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    const saveResult = await saveAnalysisResult(supabase, {
      orgId: job.org_id,
      userId: job.user_id,
      documentName: job.document_name,
      analysis,
      analysisType: 'exhaustive',
      documentId: job.document_id ?? undefined,
    });
    if (!saveResult.ok) {
      // El exhaustivo no dispara swap: perder la fila es malo pero no bloquea el
      // job (ya marcado completed). Se loguea con contexto (F-10) en vez de tragar.
      console.error(`[worker] Job ${job.id}: no se pudo persistir el analisis: ${saveResult.error}`);
    }

    // Precio variable / descuento reanálisis
    const isReanalysis = job.exclude_fingerprints !== '[]';
    const confirmedCount = analysis.discrepancies?.length ?? 0;

    if (incomplete) {
      // F-71: análisis incompleto → devolución ÍNTEGRA de lo consumido, y ni
      // reembolso de reanálisis ni precio variable: los dos son descuentos
      // sobre un análisis que sí se hizo, y aquí no se hizo entero. Un fallo
      // del proveedor no lo paga el cliente.
      const refundResult = await refundCredits(supabase, job.org_id, job.credits_consumed);
      if (refundResult.success) {
        console.warn(`[worker] Job ${job.id}: INCOMPLETO (${stageFailures.length} caídas) — devueltos ${job.credits_consumed} créditos íntegros (credits_extra ahora: ${refundResult.creditsExtra})`);
      } else {
        console.error(`[worker] Job ${job.id}: INCOMPLETO — FALLO al devolver ${job.credits_consumed} créditos a la org ${job.org_id}`);
      }
    } else if (isReanalysis && confirmedCount < 2) {
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

async function pollAndProcessConversationTurns(): Promise<void> {
  if (activeJobs >= MAX_CONCURRENT) return;

  const slotsAvailable = MAX_CONCURRENT - activeJobs;

  try {
    const claimed = await pollConversationTurns(slotsAvailable, () => { activeJobs--; });
    activeJobs += claimed;
  } catch (err) {
    console.error('[worker] Error en polling de conv turns:', err);
  }
}

async function pollAndProcess(): Promise<void> {
  if (activeJobs >= MAX_CONCURRENT) return;

  const supabase = createServiceClient();

  try {
    const slotsAvailable = MAX_CONCURRENT - activeJobs;
    const stuckBefore = new Date(Date.now() - STUCK_JOB_MS).toISOString();

    // Candidatos: mas 'pending' de los que caben, porque algunos se
    // descartaran por tener su organizacion ocupada.
    const { data: candidates, error } = await supabase
      .from('analysis_jobs')
      .select('id, org_id, user_id, document_name, document_text, sample_texts, exclude_document_id, document_id, exclude_fingerprints, batch_document_ids, credits_consumed, new_document_chunks')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(slotsAvailable * 4);

    if (error) {
      console.error('[worker] Error consultando jobs:', error.message);
      return;
    }

    if (!candidates || candidates.length === 0) return;

    // Orgs que ya tienen un job vivo en esta misma vuelta: evita reclamar dos
    // del mismo cliente cuando ambos son candidatos a la vez.
    const orgsClaimedNow = new Set<string>();
    let launched = 0;

    for (const job of candidates) {
      if (launched >= slotsAvailable) break;
      if (orgsClaimedNow.has(job.org_id)) continue;

      // VETO POR ORGANIZACION: ¿tiene ya un job corriendo de verdad?
      // Un 'processing' con started_at viejo es un zombi y no cuenta.
      const { data: running, error: runningError } = await supabase
        .from('analysis_jobs')
        .select('id')
        .eq('org_id', job.org_id)
        .eq('status', 'processing')
        .gte('started_at', stuckBefore)
        .limit(1);

      if (runningError) {
        console.error('[worker] Error comprobando jobs en curso:', runningError.message);
        continue;
      }
      if (running && running.length > 0) {
        // Cascada: espera su turno en 'pending', se recogera en otra vuelta.
        continue;
      }

      // RECLAMO ATOMICO: solo se lo lleva quien consiga cambiar el estado.
      // Si otro sondeo (u otra instancia del worker) se adelanto, devuelve
      // cero filas y lo descartamos sin procesarlo.
      const { data: claimed } = await supabase
        .from('analysis_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', job.id)
        .eq('status', 'pending')
        .select('id');

      if (!claimed || claimed.length === 0) continue;

      orgsClaimedNow.add(job.org_id);
      launched++;
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

  console.log('[worker] Doclity Analysis Worker iniciado');
  console.log(`[worker] Polling cada ${POLL_INTERVAL / 1000}s, max ${MAX_CONCURRENT} jobs simultáneos (analysis + conv)`);
  console.log(`[worker] Purga de orgs expiradas cada ${PURGE_INTERVAL / 3600000}h`);

  async function pollAll(): Promise<void> {
    await pollAndProcess();                   // 1. analysis_jobs (exhaustive)
    await pollAndProcessConversationTurns();  // 2. conv turns (agente)
  }

  startTriggerServer(() => { void pollAndProcessConversationTurns(); });

  setInterval(pollAll, POLL_INTERVAL);
  pollAll();

  setInterval(purgeExpiredOrgs, PURGE_INTERVAL);
  purgeExpiredOrgs();
}

start();
