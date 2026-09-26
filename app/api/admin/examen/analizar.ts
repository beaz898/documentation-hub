import { NextResponse } from 'next/server';
import type { createServiceClient } from '@/lib/supabase';
import { runAnalysisPipeline } from '@/lib/analysis/pipeline';
import { pickSampledTexts } from '@/lib/analysis/muestras';
import { stripSegmentationMarkers } from '@/lib/chunking';
import { getDocumentChunks } from '@/lib/read-chunks';
import { checkUploadLock } from '@/lib/upload-lock';
import { consumeCredits, devolverSiNoSeEntrego, getCreditCost, refundCredits } from '@/lib/credits';
import { reembolsoDelAnalisis } from '@/lib/reembolso-por-etapa';
import { checkAndAcquireAnalysisLock, releaseAnalysisLock, analysisLockMessage } from '@/lib/analysis-lock';
import { logUsage } from '@/lib/usage-logger';
import { usageContext, type UsageAccumulator } from '@/lib/observability/usage-context';
import { persistLLMUsage } from '@/lib/observability/record-usage';

/**
 * LA OPERACIÓN `analizar` DEL EXAMEN (26/09/2026).
 *
 * Es el análisis RÁPIDO del producto, por el camino de la bandeja —texto del
 * documento y fragmentos persistidos de su generación activa—, con UNA sola
 * diferencia: `idsDelCorpusExacto`. Todo lo demás se pregunta a las mismas
 * piezas que usa `analyze-v2` (muestreo, pipeline, cobro, reembolso).
 *
 * ⚠️ LO QUE HACE DISTINTO DE `analyze-v2`, Y POR QUÉ:
 *   · REGISTRA el uso como `/api/admin/examen`, no como `/api/analyze-v2`.
 *     `usage_logs` es lo que cuenta el limitador (B.145): con el nombre del
 *     producto, una tanda de 45 pasadas chocaría con el tope diario de 30 y
 *     además se comería la cuota del día de quien la lanza.
 *   · NO GUARDA en `analysis_results`. Una pasada del examen no es un análisis
 *     del cliente: meterla ahí contaminaría la analítica y los contadores con
 *     los que la casa se mide. Su registro es el crudo de `examen/resultados/`.
 *   · COBRA lo mismo que un rápido (la tarifa de `/api/analyze-v2`), y
 *     `llm_usage` lo apunta como `analyze_quick` porque es exactamente eso.
 */

type Supabase = ReturnType<typeof createServiceClient>;
type Resuelto = { nombre: string; id: string; generacion: number; nombreEnLaBase: string };

const TARIFA = '/api/analyze-v2';
const REGISTRO = '/api/admin/examen';

export async function analizarCaso(p: {
  supabase: Supabase;
  orgId: string;
  userId: string;
  casoId: unknown;
  pasada: unknown;
  analizado: Resuelto;
  corpus: Resuelto[];
}): Promise<NextResponse> {
  const { supabase, orgId, userId, analizado, corpus } = p;
  const etiqueta = `examen ${String(p.casoId)} pasada ${String(p.pasada)}`;

  // ── LECTURAS, ANTES DE COBRAR: si falta algo, no se paga ────────────────
  const lock = await checkUploadLock(supabase, orgId, userId);
  if (lock.locked) {
    return NextResponse.json({ error: 'Subida en curso en la organización (423): no se analiza.' }, { status: 423 });
  }

  const { data: fila, error: errTexto } = await supabase
    .from('documents')
    .select('full_text')
    .eq('id', analizado.id)
    .eq('org_id', orgId)
    .maybeSingle();
  const texto = (fila as { full_text: string | null } | null)?.full_text ?? null;
  // ⚠️ FALLA CERRADO: sin `full_text` el producto reconstruiría desde los
  // fragmentos, y eso ya no sería el camino de la bandeja que el examen mide.
  if (errTexto || !texto || texto.trim().length < 50) {
    return NextResponse.json(
      { error: `Sin full_text utilizable para "${analizado.nombre}"${errTexto ? `: ${errTexto.message}` : ''}.` },
      { status: 409 },
    );
  }

  // `getDocumentChunks` devuelve [] también cuando la lectura FALLA, así que
  // aquí vacío no se distingue de fallo: en los dos casos se para sin cobrar.
  const fragmentos = await getDocumentChunks(supabase, { orgId, documentId: analizado.id, generation: analizado.generacion });
  if (fragmentos.length === 0) {
    return NextResponse.json(
      { error: `Sin fragmentos en la generación ${analizado.generacion} de "${analizado.nombre}" (o no se pudieron leer).` },
      { status: 409 },
    );
  }

  // ── COBRO ────────────────────────────────────────────────────────────────
  const cobro = await consumeCredits(supabase, orgId, TARIFA, false);
  if (!cobro.success) {
    return NextResponse.json({ error: 'Créditos insuficientes.', creditsRemaining: cobro.creditsRemaining }, { status: 402 });
  }
  const cobrado = getCreditCost(TARIFA, false);
  let cobroPendiente = cobrado;
  let analisisIniciado = false;
  let terminoEnExcepcion = false;
  let lockAdquirido = false;
  const llmAcc: UsageAccumulator = new Map();
  const t0 = Date.now();

  try {
    const semaforo = await checkAndAcquireAnalysisLock(supabase, orgId, userId, 'quick');
    if (!semaforo.acquired) {
      return NextResponse.json({ error: analysisLockMessage(semaforo), errorType: 'analysis_in_progress' }, { status: 409 });
    }
    lockAdquirido = true;

    analisisIniciado = true;
    const analisis = await usageContext.run(llmAcc, () =>
      runAnalysisPipeline({
        newDocumentText: stripSegmentationMarkers(texto),
        newDocumentName: analizado.nombreEnLaBase,
        sampleTexts: pickSampledTexts(fragmentos),
        orgId,
        excludeDocumentId: analizado.id,
        idsDelCorpusExacto: corpus.map(c => c.id),
        supabase,
        newDocumentChunks: fragmentos,
      }),
    );
    void persistLLMUsage({ accumulator: llmAcc, orgId, userId, operation: 'analyze_quick', creditsCharged: cobrado });

    // F-71, igual que el producto: un incompleto no se cobra.
    if (analisis.stageFailures && analisis.stageFailures.length > 0) {
      const r = await refundCredits(supabase, orgId, cobrado);
      if (r.success) cobroPendiente = 0;
    }

    await logUsage(supabase, {
      userId, orgId, endpoint: REGISTRO, model: 'haiku', inputTokens: 0, outputTokens: 0,
      latencyMs: Date.now() - t0, success: true,
      creditsConsumed: cobroPendiente === 0 ? 0 : cobrado, userQuery: etiqueta,
    });

    return NextResponse.json({
      casoId: p.casoId,
      pasada: p.pasada,
      operacion: 'analizar',
      orgId,
      // Contra QUÉ se midió, por id y generación — no sólo por nombre.
      analizado: { nombre: analizado.nombre, documentId: analizado.id, generacion: analizado.generacion, fragmentos: fragmentos.length },
      corpus: corpus.map(c => ({ nombre: c.nombre, documentId: c.id, generacion: c.generacion })),
      analisis,
    });
  } catch (err: unknown) {
    terminoEnExcepcion = true;
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error(`[examen] ${etiqueta}:`, err);
    // Lo que el `finally` va a devolver no se anota como consumido.
    const seDevolvera = reembolsoDelAnalisis({
      cobroPendiente, trabajoEncolado: false, analisisIniciado, terminoEnExcepcion, acumulador: llmAcc,
    });
    await logUsage(supabase, {
      userId, orgId, endpoint: REGISTRO, model: 'haiku', inputTokens: 0, outputTokens: 0,
      latencyMs: Date.now() - t0, success: false, creditsConsumed: seDevolvera > 0 ? 0 : cobrado,
      errorMessage: mensaje, userQuery: etiqueta,
    });
    return NextResponse.json({ error: mensaje }, { status: 500 });
  } finally {
    if (lockAdquirido) await releaseAnalysisLock(supabase, orgId, userId);
    // B.205, la misma regla por etapa que `analyze-v2`, en el mismo sitio.
    const aDevolver = reembolsoDelAnalisis({
      cobroPendiente, trabajoEncolado: false, analisisIniciado, terminoEnExcepcion, acumulador: llmAcc,
    });
    await devolverSiNoSeEntrego(supabase, { orgId, creditosCobrados: aDevolver, entregado: false, contexto: REGISTRO });
  }
}
