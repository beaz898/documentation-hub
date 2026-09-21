import { createClient } from '@supabase/supabase-js';
import { runExhaustiveAnalysisPipeline } from '../../lib/analysis/pipeline';
import type { ExhaustivePipelineInput } from '../../lib/analysis/pipeline';
import type { StoredChunk } from '../../lib/read-chunks';
import { saveAnalysisResult } from '../../lib/persist-analysis';
import { propietariosDelJob } from '../../lib/analysis/propietarios';
import { leerDescartes } from '../../lib/analysis/descartes';
import { purgeOrganization, type PurgeResult } from '../../lib/purge-org';
import { refundCredits } from '../../lib/credits';
import { claseDeclarada, claseParaCobrar } from '../../lib/analysis/clase-de-coste';
import { PLANS_WITH_VARIABLE_PRICING } from '../../lib/stripe';
import { pollConversationTurns } from './conv-handler';
import { startTriggerServer } from './trigger-server';
import { usageContext, type UsageAccumulator } from '@/lib/observability/usage-context';
import { reembolsoDelTrabajoFallido } from '../../lib/reembolso-por-etapa';
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
  /** F-101 — PROPIETARIO ADOPTIVO del análisis que produzca este job. */
  document_id: string | null;
  /** F-101 — PROPIETARIO PRIMARIO: la ruta del fichero que se analizó. Nula en
   *  los jobs de la bandeja, donde el dueño es el documento. */
  storage_path: string | null;
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

  // ⚠️ B.205 — EL REEMBOLSO POR ETAPA (decisión del director, 17/09/2026). Las
  // dos piezas viven FUERA del `try` porque las lee el `catch`:
  //   · `llmAcc` — si se llegó a llamar al modelo. Antes se declaraba junto al
  //     pipeline, dentro del `try`, y el `catch` no podía verlo.
  //   · `destinoDelDineroDecidido` — pasa a true en cuanto el `try` decide qué
  //     se hace con los créditos (incompleto, reanálisis o precio variable).
  //     Desde ahí el `catch` no toca dinero: un incompleto cuyas llamadas
  //     fallaron TODAS deja el acumulador vacío y, sin esto, se devolvería dos veces.
  const llmAcc: UsageAccumulator = new Map();
  let destinoDelDineroDecidido = false;

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
      // B.244 paso 2 — LA TERCERA DE ESTA LISTA CERRADA, y añadida a los DOS
      // sitios a la vez. Los comentarios de arriba cuentan que a `stageFailures`
      // le pasó justo esto: se añadió al tipo y al jsonb y no aquí, y el aviso
      // sólo salía por una de las dos puertas.
      coberturaDeCandidatos: analysis.coberturaDeCandidatos,
      // F-114: `termometro` NO ENTRA en esta lista, y la omisión es DELIBERADA —
      // igual que `pipelineCounters`, y por la misma razón: es telemetría de la
      // recuperación y ningún componente la pinta. Va dentro del jsonb
      // `analysis` por `saveAnalysisResult` y se lee desde ahí.
      //
      // ⚠️ Se declara aquí porque esta lista es la gemela de
      // `app/api/analyze-v2/route.ts` y ya se comió tres campos entre las dos.
      // El día que el termómetro haya que enseñarlo, se añade en los DOS sitios
      // a la vez — que es la lección que los comentarios de arriba cuentan.
    };

    const latencyMs = Date.now() - t0;

    // F-71: si alguna etapa cayó a su fallback, el job NO queda 'completed'.
    // 'failed' tampoco sirve: el job SÍ produjo un resultado utilizable y con
    // 'failed' el endpoint de polling devolvería result:null y el frontend lo
    // trataría como error, tirando el análisis parcial. Estado propio.
    const stageFailures = analysis.stageFailures ?? [];
    const incomplete = stageFailures.length > 0;

    // ⚠️ B.143 (02/09): GUARDAR PRIMERO, ESCRIBIR EL JOB DESPUES. Antes era al
    // reves y por eso `result_saved` no se sabia cuando se escribia la fila.
    //
    // EL REORDENAMIENTO ES SEGURO, y se dice por contraste con B.140: NO BORRA
    // NADA. Si el guardado falla, el job se escribe igual —con
    // `result_saved: false`— y el usuario recibe su analisis. Lo unico que
    // cambia es que un dato que ya se calculaba llega a tiempo de escribirse.
    // Lo que si cambia: entre el final del pipeline y el update hay ahora un
    // INSERT mas. Si el proceso muere justo ahi, el job se queda en
    // 'processing' — igual que si moria entre el pipeline y el update de antes.
    // La ventana se mueve, no se abre, y la barre el umbral de jobs zombis.
    const propietarios = propietariosDelJob(job);
    if (!propietarios.tienePropietario) {
      // No debería ocurrir: todo job nuevo trae uno de los dos. Si ocurre, es un
      // job encolado ANTES de la migración, y se dice en voz alta en vez de
      // dejar que la base lo rechace con el nombre de un CHECK.
      console.error(`[worker] Job ${job.id}: SIN PROPIETARIO (ni ruta ni documento) — el análisis no se podrá persistir`);
    }

    // ⚠️ EL CONTADOR VA AQUÍ, ANTES DE GUARDAR, Y ÉSE ES TODO EL PUNTO.
    //
    // `pipeline_counters` es una columna `jsonb` que YA existe (F-82) y que
    // `saveAnalysisResult` persiste en cada análisis, así que esto **no necesita
    // ningún cambio de esquema**. Y persistido es la diferencia entre un
    // contador y una nota: un número que sólo vive en los registros de Vercel es
    // lo mismo que no tenerlo — quien decide el precio no entra ahí.
    //
    // Se lee con una consulta:
    //   select count(*) from analysis_results
    //   where pipeline_counters ? 'averia.exhaustivo_sin_clasificar';
    //
    // ⚠️ Y NO CAMBIA EL PRECIO. Marca los trabajos a los que se les cobró el
    // máximo POR DEFECTO y no por medida, que hoy son indistinguibles de los que
    // de verdad fueron pesados.
    if (claseDeclarada(analysis.estimatedCost) === null) {
      analysis.pipelineCounters = {
        ...(analysis.pipelineCounters ?? {}),
        'averia.exhaustivo_sin_clasificar': 1,
      };
    }

    const saveResult = await saveAnalysisResult(supabase, {
      orgId: job.org_id,
      userId: job.user_id,
      documentName: job.document_name,
      analysis,
      analysisType: 'exhaustive',
      // F-101: el worker YA NO DECIDE el propietario por su cuenta. Hasta hoy
      // ponía `job.document_id ?? undefined`, que para un job del chat es NULO —
      // y ahí nacieron los dieciséis análisis pagados sin dueño.
      documentId: propietarios.documentId,
      storagePath: propietarios.storagePath,
    });
    if (!saveResult.ok) {
      // Se loguea con contexto (F-10) en vez de tragar, y ADEMAS viaja en la
      // fila del job: el exhaustivo cuesta 30 creditos y hasta hoy el usuario
      // cerraba creyendo que lo tenia guardado.
      console.error(`[worker] Job ${job.id}: no se pudo persistir el analisis: ${saveResult.error}`);
    }

    await supabase
      .from('analysis_jobs')
      .update({
        status: incomplete ? 'completed_with_errors' : 'completed',
        result,
        // Columna PROPIA y no un estado nuevo: `status` dice COMO FUE EL
        // ANALISIS y esto dice si quedo guardado. Son dos dimensiones que se
        // combinan de verdad —un analisis puede estar incompleto Y sin
        // guardar—, y meterlas en la misma columna obligaria a cuatro valores
        // para dos booleanos. Ver supabase-b143-job-result-saved.sql.
        result_saved: saveResult.ok,
        ...(incomplete
          ? { error_message: `Análisis incompleto: ${stageFailures.length} etapa(s) fallaron (${[...new Set(stageFailures.map(f => f.stage))].join(', ')})` }
          : {}),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Precio variable / descuento reanálisis
    const isReanalysis = job.exclude_fingerprints !== '[]';
    const confirmedCount = analysis.discrepancies?.length ?? 0;

    // Desde aquí el dinero de este job lo decide una de las tres ramas de abajo.
    destinoDelDineroDecidido = true;
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

    // ⚠️ B.205 — HASTA EL 17/09/2026 ESTE `catch` NO TOCABA CRÉDITOS: un job
    // que moría antes de hacer nada se quedaba los 30. Regla por etapa: si no
    // llegó a llamar al modelo se devuelve todo; si llamó, nada.
    const aDevolver = reembolsoDelTrabajoFallido({
      cobrado: job.credits_consumed,
      yaDevuelto: destinoDelDineroDecidido,
      acumulador: llmAcc,
    });
    if (aDevolver > 0) {
      const r = await refundCredits(supabase, job.org_id, aDevolver);
      if (r.success) {
        console.warn(`[worker] Job ${job.id}: falló antes de llamar al modelo — devueltos ${aDevolver} créditos`);
      } else {
        console.error(`[worker] Job ${job.id}: falló antes de llamar al modelo — FALLO al devolver ${aDevolver} créditos`);
      }
    } else {
      console.warn(`[worker] Job ${job.id}: falló ${destinoDelDineroDecidido ? 'con el dinero ya decidido' : 'tras llamar al modelo'} — no se devuelve`);
    }

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

    // ⚠️ DOS PREGUNTAS DISTINTAS, Y HASTA HOY LAS CONTESTABA UN SOLO `??`.
    // `claseDeclarada` dice qué declaró el análisis —o `null` si no declaró
    // nada—; `claseParaCobrar` dice qué se cobra. El precio NO cambia: el
    // defecto sigue siendo `heavy` y sigue sin reembolso. Lo que cambia es que
    // el registro deja de decir lo mismo en los dos casos.
    const declarada = claseDeclarada(estimatedCost);
    const cost = claseParaCobrar(estimatedCost);
    const refund = REFUND_BY_COST[cost] ?? 0;

    if (declarada === null) {
      console.warn(
        `[worker] Job ${jobId}: SIN CLASIFICAR — se cobra el máximo por defecto ` +
        `(${cost}), no por medida. Contado en averia.exhaustivo_sin_clasificar.`,
      );
    }

    if (refund === 0) {
      console.log(`[worker] Job ${jobId}: precio variable — coste ${cost}${declarada === null ? ' (POR DEFECTO)' : ''}, sin reembolso (plan ${org.plan})`);
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
      // ⚠️ `storage_path` ENTRA AQUÍ PORQUE DECIDE: es el propietario del análisis
      // en los jobs del chat. Séptima vez que esta tubería pierde un campo en un
      // select (B.144) — y aquí el defecto silencioso sería un análisis de 30
      // créditos que la base rechaza por no tener dueño.
      .select('id, org_id, user_id, document_name, document_text, sample_texts, exclude_document_id, document_id, storage_path, exclude_fingerprints, batch_document_ids, credits_consumed, new_document_chunks')
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
