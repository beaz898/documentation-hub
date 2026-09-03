import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { chunkText, extractSegments, joinSegments, chunkSegments, stripSegmentationMarkers } from '@/lib/chunking';
import type { ExtractedSegment } from '@/lib/chunking';
import { runAnalysisPipeline } from '@/lib/analysis/pipeline';
import { logUsage, registrarAveriaDeLimitador } from '@/lib/usage-logger';
import { checkRateLimit } from '@/lib/rate-limiter';
import { resolveOrg } from '@/lib/org';
import { consumeCredits, getCreditCost, refundCredits } from '@/lib/credits';
import { checkUploadLock } from '@/lib/upload-lock';
import { saveAnalysisResult } from '@/lib/persist-analysis';
import { leerDescartes, marcarDescartadas } from '@/lib/analysis/descartes';
import { usageContext } from '@/lib/observability/usage-context';
import { persistLLMUsage } from '@/lib/observability/record-usage';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { getStagedForDocument } from '@/lib/document-staged';
import { swapDocumentVectors } from '@/lib/document-swap';
import { checkAndAcquireAnalysisLock, releaseAnalysisLock, analysisLockMessage } from '@/lib/analysis-lock';
import { getDocumentChunks, getActiveGeneration, toStoredChunks } from '@/lib/read-chunks';
import type { StoredChunk } from '@/lib/read-chunks';
import { sujetosDelAnalisis, unicoExcluido } from '@/lib/analysis/sujetos';

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
  let lockAcquired = false;
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
    const { storagePath, fileName, text: directText, exhaustive, excludeFingerprints: rawExcludeFps, batchDocumentIds: rawBatchDocumentIds } = body;

    // ════════════════════════════════════════════════════════════════════
    // LOS TRES SUJETOS (F-100 P2, B.163). Hasta el 03/09/2026 esto era UN
    // `documentId` que contestaba a las tres preguntas a la vez. Coincidían
    // siempre… menos en el reanálisis desde el chat, donde el valor es EL
    // HOMÓNIMO: respuesta correcta a «¿contra quién no compararme?» y falsa a
    // «¿de quién es este análisis?».
    //
    // El cliente manda DOS REFERENCIAS y el servidor deriva los tres sujetos —
    // la lista de excluidos NO viaja desde el cliente, que es la cláusula de
    // ORIGEN de F-97.
    // ════════════════════════════════════════════════════════════════════
    const sujetos = sujetosDelAnalisis({
      documentoEnRevision: body.documentoEnRevision,
      documentoAReemplazar: body.documentoAReemplazar,
    });
    /** ¿DE QUIÉN ES EL RESULTADO? Solo lo posee un documento que ya existe. */
    const documentoPropietario = sujetos.documentoPropietario;
    /** ¿QUÉ DOCUMENTO REVISO? Gobierna su staged, el veto del exhaustivo, su
     *  generación, sus chunks, su hash y el swap. Vacío = no toco a nadie. */
    const documentoEnRevision = sujetos.documentoEnRevision;

    // Auto-exclusión derivada del endpoint (no del caller): un documento que YA
    // existe en el corpus NUNCA se compara consigo mismo.
    // La garantía vive aquí, no en el frontend, para que todo llamador la herede:
    // la bandeja, la cola de Fase D, y el reemplazo manual de D5 ("el análisis de
    // una versión nueva excluye los vectores de su propia versión anterior").
    // En la subida no hay a quién excluir (el doc aún no está indexado) → undefined.
    // ⚠️ CORTE DECLARADO: `documentosExcluidos` es una lista y el pipeline recibe
    // UNO. Se puede hoy porque nunca hay más de uno —las dos referencias son
    // excluyentes por construcción—, y `unicoExcluido` lo grita si deja de serlo.
    const excludeDocumentId = unicoExcluido(sujetos);

    // IDs de otros documentos de la misma tanda de la bandeja de revisión
    // (aún sin validar, pero ya indexados). Solo la bandeja los manda; si el
    // body no trae un array de strings, queda undefined = comportamiento
    // idéntico al de hoy (solo corpus validado).
    const batchDocumentIds: string[] | undefined =
      Array.isArray(rawBatchDocumentIds) && rawBatchDocumentIds.every((v: unknown): v is string => typeof v === 'string')
        ? (rawBatchDocumentIds as string[])
        : undefined;

    // Convertir array de huellas descartadas a Set (si viene del frontend)
    const excludeFingerprints = Array.isArray(rawExcludeFps)
      ? new Set<string>(rawExcludeFps)
      : new Set<string>();

    if (!fileName) {
      return NextResponse.json({ error: 'fileName requerido' }, { status: 400 });
    }

    // Rate limiting (límite separado para rápido y exhaustivo)
    const isExhaustive = exhaustive === true;

    // d-2b: ¿el documento tiene una versión nueva en vuelo (staged)? Se lee una
    // sola vez aquí (arriba, antes de cobrar créditos) y sirve para las dos ramas:
    // la exhaustiva la niega (más abajo) y la rápida disparará el swap (C.4d-2b).
    // Solo puede haber staged si el documento ya existe (hay documento en revisión).
    // ⚠️ Y ES `documentoEnRevision`, NO el excluido: con el excluido, un reanálisis
    // desde el chat leería el staged del HOMÓNIMO — vetaría el exhaustivo por una
    // versión en vuelo ajena y, abajo, promocionaría la versión de otro documento.
    const staged = documentoEnRevision
      ? await getStagedForDocument(supabase, documentoEnRevision, orgId)
      : null;

    // d-2b (F-8): con una versión staged pendiente, el exhaustivo queda vetado.
    // El exhaustivo se completa en el worker, que no sabe de swaps: dejaría el
    // staged atascado sin promoción. Mientras haya versión en vuelo, solo el
    // análisis rápido (que sí dispara el swap). Se veta ANTES de consumir
    // créditos para no cobrar por un análisis que rechazamos.
    if (isExhaustive && staged) {
      return NextResponse.json(
        {
          error:
            'Este documento tiene una versión nueva pendiente. El análisis exhaustivo no está disponible mientras haya una versión en vuelo; usa el análisis rápido.',
          errorType: 'staged_pending',
        },
        { status: 409 },
      );
    }

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
    // El limitador falla ABIERTO cuando su consulta falla, y eso está bien
    // elegido. Lo que no puede es ser mudo: si dejó de limitar, queda una fila
    // en `usage_logs` con el motivo. No hace nada cuando no hubo avería.
    await registrarAveriaDeLimitador(supabase, {
      averia: rateCheck.averia, orgId, userId, endpoint: '/api/analyze-v2',
    });
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

    // Semaforo de concurrencia (F-13/F-14): un solo analisis activo por org. Se
    // adquiere aqui, cuando el analisis ya va a ocurrir (pasados los vetos baratos
    // y el cobro), y se libera en el finally. La auto-expiracion por timestamp es la
    // garantia real; el finally es cortesia de latencia. Reemplaza al viejo veto del
    // exhaustivo (que solo miraba analysis_jobs); este cubre rapido Y exhaustivo.
    const lockResult = await checkAndAcquireAnalysisLock(
      supabase,
      orgId,
      userId,
      isExhaustive ? 'exhaustive' : 'quick',
    );
    if (!lockResult.acquired) {
      return NextResponse.json(
        { error: analysisLockMessage(lockResult), errorType: 'analysis_in_progress' },
        { status: 409 },
      );
    }
    lockAcquired = true;

    // Obtener texto: desde storage o directo
    let text: string;
    let extractedSegments: ExtractedSegment[] | null = null;
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
          const segments = await extractSegments(buffer, fileName);
          extracted = joinSegments(segments);
          extractedSegments = segments;
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

    // F-20 paso 4b: si el documento ya está indexado y tiene chunks
    // persistidos, esos son la fuente buena — vienen separados fila a fila
    // desde chunkSegments. El chunkText de arriba trabaja sobre full_text, que
    // se guardó sin el marcador de segmentación, así que reagrupa las filas de
    // tabla por longitud (~13 por chunk) y degrada la búsqueda. Cuando no hay
    // chunks (documento nuevo aún sin indexar, o indexado antes de F-20) se
    // sigue usando el troceado de chunkText: mismo comportamiento que antes.
    let storedChunkTexts: string[] | null = null;
    let storedChunks: StoredChunk[] | null = null;
    if (documentoEnRevision) {
      const documentId = documentoEnRevision;
      const activeGeneration = await getActiveGeneration(supabase, { orgId, documentId });
      const fetchedChunks = await getDocumentChunks(supabase, {
        orgId,
        documentId,
        generation: activeGeneration,
      });
      if (fetchedChunks.length > 0) {
        storedChunkTexts = fetchedChunks.map(c => c.text);
        storedChunks = fetchedChunks;
      }
      console.log(`[analyze-v2] chunks persistidos | doc=${documentId} | gen=${activeGeneration} | encontrados=${fetchedChunks.length} | fallback=${storedChunkTexts === null}`);
    }

    // F-24 "el cable": chunks tipados del documento analizado, para que el
    // verificador de hallazgos pueda comparar `cells` de los dos lados. Si el
    // documento ya está indexado, storedChunks (arriba) es la fuente. Si es un
    // documento nuevo aún sin indexar, se derivan aquí de los segments ya
    // extraídos con el mismo camino que usa el indexado (chunkSegments), para
    // no duplicar la lógica de troceado tipado en un segundo sitio.
    let newDocChunks: StoredChunk[] | null = null;
    if (!storedChunks && extractedSegments) {
      const typedChunks = chunkSegments(extractedSegments, 'temp-id', fileName, orgId);
      newDocChunks = toStoredChunks(typedChunks);
    }

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

      // (El veto de "un analisis a la vez" ya lo hizo el semaforo de concurrencia
      // arriba, que cubre rapido Y exhaustivo — F-13/F-14. El barrido B.51 de arriba
      // se mantiene: limpia jobs zombis de analysis_jobs, cosa distinta del semaforo.)

      // Todos los chunks para exhaustivo
      const sampleTexts = storedChunkTexts ?? chunks.map(c => c.text);

      // Crear el job
      const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .insert({
          org_id: orgId,
          user_id: userId,
          status: 'pending',
          document_name: fileName,
          // F-101: LA RUTA VIAJA AL JOB porque el exhaustivo lo escribe el WORKER,
          // en otro proceso, y su única fuente es esta fila. Sin ella, el análisis
          // más caro del sistema nacería sin dueño — que es donde nacieron los
          // dieciséis. Nula desde la bandeja: allí el dueño es el documento.
          storage_path: typeof storagePath === 'string' ? storagePath : null,
          document_text: stripSegmentationMarkers(text),
          sample_texts: JSON.stringify(sampleTexts),
          exclude_document_id: excludeDocumentId ?? null,
          // ⚠️ LAS DOS COLUMNAS YA EXISTÍAN Y EL WORKER YA LAS LEÍA POR SEPARADO;
          // lo único que estaba mal es que se rellenaban de la MISMA variable.
          // Por eso el worker no se toca en este commit.
          document_id: documentoPropietario,
          exclude_fingerprints: JSON.stringify(Array.from(excludeFingerprints)),
          // F-71 paso 2: la tanda viaja también al exhaustivo. Hasta aquí solo
          // la usaba el rápido (más abajo, en runAnalysisPipeline), así que los
          // dos modos veían conjuntos distintos de documentos. Misma semántica
          // que en el rápido: AMPLÍA el corpus consultado con estos ids aunque
          // estén en 'pendiente'; no lo restringe. `?? []` para que un job sin
          // tanda escriba lista vacía, que es lo que buildCorpusFilter trata
          // como "sin cambio de filtro".
          batch_document_ids: JSON.stringify(batchDocumentIds ?? []),
          credits_consumed: creditsConsumed,
          new_document_chunks: JSON.stringify(storedChunks ?? newDocChunks ?? null),
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

    const sampleTexts = storedChunkTexts
      ? pickSampledTexts(storedChunkTexts.map(text => ({ text })))
      : pickSampledTexts(chunks);

    const avgChunkSize = chunks.length > 0
      ? Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length)
      : 0;
    console.log(`[analyze-v2] "${fileName}" — ${chunks.length} chunks, ${sampleTexts.length} samples, ${text.length} chars totales, ${avgChunkSize} chars/chunk de media, ${batchDocumentIds?.length ?? 0} ids de tanda (rápido)`);

    const llmAcc = new Map();
    const analysis = await usageContext.run(llmAcc, () =>
      runAnalysisPipeline({
        newDocumentText: stripSegmentationMarkers(text),
        newDocumentName: fileName,
        sampleTexts,
        orgId,
        excludeDocumentId,
        batchDocumentIds,
        supabase,
        newDocumentChunks: storedChunks ?? newDocChunks ?? undefined,
      })
    );
    void persistLLMUsage({
      accumulator:    llmAcc,
      orgId,
      userId,
      operation:      'analyze_quick',
      creditsCharged: creditsConsumed,
    });

    // F-71: si alguna etapa cayó a su fallback, el análisis está incompleto y
    // NO se cobra. Íntegro, sin proporción al número de etapas caídas: un fallo
    // del proveedor no lo paga el cliente, y un reembolso parcial sería
    // imposible de explicar en una factura.
    // Va aquí, después del pipeline y antes de responder, para que el cliente
    // reciba el aviso y el saldo ya devuelto en la misma respuesta.
    if (analysis.stageFailures && analysis.stageFailures.length > 0 && creditsConsumed > 0) {
      const stages = analysis.stageFailures.map(f => f.stage).join(', ');
      const refund = await refundCredits(supabase, orgId, creditsConsumed);
      if (refund.success) {
        console.warn(`[analyze-v2] Análisis INCOMPLETO (${analysis.stageFailures.length} caídas: ${stages}) — devueltos ${creditsConsumed} créditos (credits_extra ahora: ${refund.creditsExtra})`);
      } else {
        console.error(`[analyze-v2] Análisis INCOMPLETO (${stages}) — FALLO al devolver ${creditsConsumed} créditos a la org ${orgId}`);
      }
    }

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

    // Portero de calidad (F-4-rev / F-11): que frena la activacion automatica de
    // una version nueva. Solo cuentan los problemas de CORPUS (coherencia con el
    // resto de documentos): duplicados, solapamientos, contradicciones y una
    // recomendacion que no sea INDEXAR. Los problemas de ESTILO NO frenan: una
    // falta de ortografia no hace la version incoherente con el corpus, y frenar
    // por estilo dejaria casi todo atascado. Si hay problemas de corpus, la vieja
    // sigue sirviendo (coherente) y la nueva espera decision humana en la bandeja.
    const hasCorpusIssues =
      analysis.isDuplicate ||
      analysis.overlaps.length > 0 ||
      analysis.discrepancies.length > 0 ||
      analysis.recommendation !== 'INDEXAR';

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

    const saveResult = await saveAnalysisResult(supabase, {
      orgId,
      userId,
      documentName: fileName,
      analysis,
      analysisType: 'quick',
      documentId: documentoPropietario,
      // F-101: el propietario PRIMARIO. En el camino del chat el documento no
      // existe todavía, pero el FICHERO sí — y el análisis es suyo desde que
      // ocurre. Desde la bandeja llega ausente y manda el documento.
      storagePath: typeof storagePath === 'string' ? storagePath : null,
    });
    if (!saveResult.ok) {
      // Camino sin staged: el usuario recibe su analisis igual (lo tiene en
      // pantalla); perder la fila se loguea con contexto (F-10). El camino CON
      // staged usara saveResult.ok para decidir el swap en el Commit 5b.
      console.error('[analyze-v2] no se pudo persistir el analisis:', saveResult.error);
    }

    // B.5-hash-a: si el analisis vino de la bandeja (hay documentId), el
    // documento ya existe: registramos que ESTE texto es el analizado. En el
    // flujo de subida no hay documentId (el doc aun no existe) y lo escribe
    // ingest al indexar.
    // d-2b (F-7/F-8): con staged, este hash NO se escribe aqui; lo escribe la P2
    // del swap con staged.content_hash (unico escritor). Escribirlo aqui pondria
    // el hash del texto nuevo sobre la fila que aun describe la generacion vieja.
    if (documentoEnRevision && !staged) {
      const { error: hashError } = await supabase
        .from('documents')
        .update({ analyzed_content_hash: generateContentHash(stripSegmentationMarkers(text)) })
        .eq('id', documentoEnRevision)
        .eq('org_id', orgId);
      if (hashError) {
        console.error('[analyze-v2] analyzed_content_hash:', hashError.message);
      }
    }

    // d-2b (F-8/F-10): el disparador. Si el documento tiene version en vuelo
    // (staged) y el analisis SE PERSISTIO, promovemos la version nueva a activa
    // con un swap atomico. El swap solo se dispara sobre analisis persistido
    // (si el save fallo, no se promueve: los hallazgos no existirian). staged y
    // documentId ya estan resueltos arriba (Commit 2). versionPromoted informa
    // al cliente; si el swap falla, respondemos 200 honesto (el analisis SI se
    // hizo y guardo) con versionPromoted:false y mensaje — el staged persiste
    // como marcador reparable y cleanup lo remata (sin boton de reintento, F-6/F-9).
    let versionPromoted: boolean | undefined;
    let versionPromotedMessage: string | undefined;
    if (staged && documentoEnRevision) {
      if (!saveResult.ok) {
        versionPromoted = false;
        versionPromotedMessage =
          'El análisis se completó pero no pudo guardarse. Reinténtalo.';
      } else if (hasCorpusIssues) {
        // El portero frena: hay problemas de corpus. NO se activa. La version
        // vieja sigue sirviendo (coherente); la nueva espera en la bandeja a que
        // el humano decida (aprobar y activar, corregir en Drive, o reanalizar
        // con descartes — F-11). El staged persiste como esa version en espera.
        versionPromoted = false;
        versionPromotedMessage =
          'La nueva versión tiene hallazgos en el corpus y no se ha activado todavía. Revísala en la bandeja para decidir si activarla.';
        // d-2b (F-12): vincular el staged con el analisis que lo freno, para que la
        // bandeja muestre los contadores de ESTE analisis exacto (no "el ultimo por
        // fecha"). saveResult.ok esta garantizado aqui (esta rama vive dentro del
        // bloque donde el save fue ok). Fallo del update: se loguea, no bloquea (la
        // bandeja caeria a la heuristica por fecha, degradacion suave).
        if (saveResult.ok) {
          const { error: ptrError } = await supabase
            .from('document_staged')
            .update({ analysis_result_id: saveResult.id })
            .eq('document_id', documentoEnRevision)
            .eq('org_id', orgId);
          if (ptrError) {
            console.error('[analyze-v2] puntero staged->analisis:', ptrError.message);
          }
        }
      } else {
        const swapResult = await swapDocumentVectors(supabase, orgId, documentoEnRevision);
        if (swapResult.swapped) {
          versionPromoted = true;
        } else {
          versionPromoted = false;
          if (!swapResult.ok) {
            console.error('[analyze-v2] swap fallo:', swapResult.error);
            versionPromotedMessage =
              'El análisis se guardó, pero la nueva versión no se pudo activar. Sigue pendiente y se reintentará automáticamente.';
          }
        }
      }
    }

    // ── LA LECTURA EN EL MODO RÁPIDO (F-86 paso 3) ────────────────────
    //
    // MARCA, NO FILTRA, y va DESPUÉS de saveAnalysisResult a propósito: lo que
    // se persiste en el jsonb es EL ANÁLISIS, y el descarte es estado del
    // USUARIO. Escribirlo dentro de `analysis_results.analysis` mezclaría las
    // dos cosas para siempre — y un reanálisis futuro no podría distinguir lo
    // que el sistema encontró de lo que una persona decidió sobre ello.
    //
    // El exhaustivo no pasa por aquí: allí el descarte se aplica antes, en el
    // double-check, saltándose a Sonnet — que es lo que ya hacía con los de
    // sesión y lo que este commit se comprometió a no cambiar.
    const descartesOrg = await leerDescartes(supabase, orgId);
    const marcarSalida = <T extends { newDocSays?: string; existingDocSays?: string; existingDocumentId?: string }>(
      lista: T[] | undefined,
    ): T[] | undefined =>
      lista && lista.length > 0
        // ⚠️ LA IDENTIDAD DE UNA HUELLA ES EL DOCUMENTO EN REVISIÓN, no el excluido.
        // Colgaba de `excludeDocumentId` y funcionaba solo porque en la bandeja
        // los dos coinciden — en el chat ya no.
        ? marcarDescartadas(lista, { documentoEnRevision, descartes: descartesOrg })
        : lista;

    return NextResponse.json({
      success: true,
      async: false,
      // ⚠️ REGLA 6, MEMORIA DEL FALLO (02/09): si la fila no se pudo escribir, el
      // análisis se entrega igual —el usuario pagó y la información es
      // verdadera— pero MARCADO. Hasta hoy el fallo solo iba a consola y el
      // usuario cerraba creyendo que su análisis estaba en la bandeja.
      //
      // VA EN EL SOBRE Y NO DENTRO DE `analysis`, por dos razones: no es una
      // propiedad del análisis sino del intento de guardarlo —dentro del jsonb
      // solo podría valer `true`, porque si valiera `false` no habría jsonb— y
      // esa lista de abajo es CERRADA, con dos campos ya olvidados en ella
      // (stageFailures y selectionLimits).
      //
      // Qué se hace con esto lo decide `avisosDelAnalisis`, no el pintado.
      guardado: saveResult.ok,
      hasIssues,
      analysisMode: analysis.analysisMode,
      analysis: {
        isDuplicate: analysis.isDuplicate,
        duplicateOf: analysis.duplicateOf,
        duplicateConfidence: analysis.duplicateConfidence,
        overlaps: analysis.overlaps,
        discrepancies: marcarSalida(analysis.discrepancies),
        minorInconsistencies: marcarSalida(analysis.minorInconsistencies),
        // F-88 paso 2: la estructura agrupada del diff. ENTRA EN ESTA LISTA
        // CERRADA a la vez que nace, que es lo que F-71 documentó no haber
        // hecho con stageFailures — aquel se añadió a FinalAnalysis y al jsonb
        // pero no aquí, y el aviso solo aparecía por la bandeja.
        tableDiffs: analysis.tableDiffs,
        newInformation: analysis.newInformation,
        recommendation: analysis.recommendation,
        summary: analysis.summary,
        analysisMode: analysis.analysisMode,
        styleProblems: analysis.styleProblems,
        discardedFindings: analysis.discardedFindings,
        // F-71: esta lista es CERRADA. 38d3fd22 añadió stageFailures a
        // FinalAnalysis y al jsonb pero no aquí, así que el aviso de análisis
        // incompleto solo aparecía por la bandeja —que relee el jsonb entero—
        // y nunca tras una subida.
        stageFailures: analysis.stageFailures,
        // F-74 P2: el alcance declarado, por el mismo camino que el aviso de
        // incompleto — y añadido a la vez para no repetir el olvido de arriba.
        selectionLimits: analysis.selectionLimits,
        // F-82: `pipelineCounters` NO entra en esta lista, y la omisión es
        // DELIBERADA — no el olvido que documenta el comentario de arriba. Son
        // contadores de incidencia (claude/Contrato_Contadores.md): telemetría
        // para agregar entre análisis, no algo que ningún componente pinte. Van
        // a su columna propia por saveAnalysisResult y se leen desde ahí.
        // Si algún día la UI tiene que enseñarlos, añadirlos aquí es lo
        // correcto; hasta entonces, meterlos sería enviar al cliente un objeto
        // que nadie lee en cada respuesta de análisis.
      },
      documentSources,
      versionPromoted,
      versionPromotedMessage,
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
  } finally {
    // Cortesia de latencia: libera el semaforo al acabar (bien o mal) para que nadie
    // espere el umbral entero. Solo si lo adquirimos (una salida por veto temprano no
    // lo tomo). La auto-expiracion cubre el caso de que este finally no llegue a correr
    // (serverless puede matar la funcion tras responder) — F-14.
    if (lockAcquired) {
      await releaseAnalysisLock(supabase, orgId, userId);
    }
  }
}

// ============================================================
// Helpers
// ============================================================

/** Extrae textos muestreados de los chunks para el análisis rápido. */
function pickSampledTexts(chunks: Array<{ text: string }>): string[] {
  const total = chunks.length;
  // B.77 — Tras el paso 4b un chunk de hoja de cálculo es UNA FILA, y saltarse
  // una fila es perder un dato entero, no un matiz (a diferencia de la prosa,
  // donde párrafos vecinos se solapan). Se sube el tope para que los documentos
  // tabulares del corpus entren completos: OPE-06, el mayor medido, tiene 114
  // chunks. Cada muestra cuesta una consulta a Pinecone y su parte de un lote de
  // embeddings, pero CERO llamadas a LLM (el rerank y el judge trabajan sobre
  // newDocumentText, no sobre las muestras), así que el tope lo pone el tiempo
  // de la función (maxDuration 120s), no el coste.
  const targetSamples = total <= 120
    ? total
    : 120;
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
