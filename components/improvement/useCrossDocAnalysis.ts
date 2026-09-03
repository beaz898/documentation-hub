'use client';

import { useState, useCallback, useRef } from 'react';
import { guardadoDeJob } from '@/lib/analysis/avisos';
import { problemsFromAnalysis, type Problem, type RawAnalysis } from './problems';
import { describeJobPhase } from '@/hooks/chat/useJobPolling';

/**
 * Genera huella para una discrepancia/duplicidad descartada.
 * Combina texto del documento nuevo + nombre del documento del corpus.
 * Debe coincidir con makeDiscrepancyFingerprint en double-check.ts.
 */
function makeDiscrepancyFingerprint(newDocSays: string, existingDocument: string): string {
  const textNorm = newDocSays
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?""''«»()[\]{}]/g, '')
    .trim()
    .slice(0, 80);
  const docNorm = existingDocument.toLowerCase().trim();
  return `${docNorm}|${textNorm}`;
}

/**
 * Marca problemas como dismissed si su huella está en la memoria de descartados.
 */
function applyDismissedState(problems: Problem[], dismissed: Set<string>): Problem[] {
  if (dismissed.size === 0) return problems;
  return problems.map(p => {
    if (p.textRef && p.relatedDoc) {
      const fp = makeDiscrepancyFingerprint(p.textRef, p.relatedDoc);
      if (dismissed.has(fp)) {
        return { ...p, dismissed: true };
      }
    }
    return p;
  });
}

/** Intervalo de polling en ms. */
const POLL_INTERVAL = 5000;

/** Tiempo máximo de espera en ms (10 minutos). */
const MAX_POLL_WAIT = 600_000;

export interface ReanalyzeResult {
  activeCount: number;
  dismissedCount: number;
  totalCount: number;
}

/**
 * LAS COORDENADAS DE UN DESCARTE (F-86 paso 3). Lo que el servidor necesita
 * para calcular la huella, y lo único que el cliente puede aportar: nunca la
 * huella, que es de servidor.
 */
export interface CoordenadasDeDescarte {
  existingDocumentId: string;
  newDocSays: string;
  existingDocSays: string;
}

export function useCrossDocAnalysis(
  initialAnalysis: RawAnalysis,
  /** F-101: la ruta del fichero — propietario primario del análisis en revisión. */
  storagePath: string | undefined,
  /** F-86 paso 3: el id del documento EN REVISIÓN, presente solo en los caminos
   *  que lo tienen (la bandeja). Con él, cada descarte se registra en el
   *  momento; sin él —la subida desde el chat— se acumulan y viajan a la
   *  indexación, que es cuando el documento nace y su identidad con él. */
  reviewedDocumentId?: string,
) {
  const [crossDocProblems, setCrossDocProblems] = useState<Problem[]>(
    () => problemsFromAnalysis(initialAnalysis)
  );
  // F-71: el aviso de análisis incompleto. Arranca con lo que traiga el
  // análisis inicial y se reemplaza en cada reanálisis, igual que los problemas.
  const [stageFailureCount, setStageFailureCount] = useState<number>(
    () => initialAnalysis.stageFailures?.length ?? 0
  );
  // B.143: el aviso de NO GUARDADO, mismo ciclo de vida que el de arriba y
  // decidido por el mismo sitio. Arranca en `false` porque lo que abre este
  // modal ya venia guardado; lo que puede cambiarlo es un reanalisis.
  const [noGuardado, setNoGuardado] = useState(false);
  // F-74 P2: el alcance declarado, mismo ciclo de vida que stageFailureCount.
  const [selectionLimits, setSelectionLimits] = useState<RawAnalysis['selectionLimits']>(
    () => initialAnalysis.selectionLimits
  );
  const [reanalyzingAll, setReanalyzingAll] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [reanalyzePhase, setReanalyzePhase] = useState<string | null>(null);

  /**
   * Huellas de problemas que el usuario marcó como "no es un error".
   * Se acumulan durante toda la sesión del modal de mejora.
   * Se envían al backend para que el double-check no los re-verifique.
   */
  const dismissedFingerprintsRef = useRef<Set<string>>(new Set());

  /**
   * F-86 paso 3 — LAS COORDENADAS DE LO DESCARTADO, por huella de sesión.
   *
   * Existe ADEMÁS del Set de arriba y no en su lugar: aquél identifica dentro
   * de la sesión (y es lo que sigue viajando en `excludeFingerprints`), éste
   * guarda lo que el SERVIDOR necesitará para construir la identidad
   * permanente. Son dos preguntas distintas y por eso son dos estructuras.
   */
  const coordenadasDescartadasRef = useRef<Map<string, CoordenadasDeDescarte>>(new Map());

  const reanalyzeAll = useCallback(
    async (currentText: string, fileName: string, documentId?: string | null): Promise<ReanalyzeResult | null> => {
      setReanalyzingAll(true);
      setLastError(null);
      setReanalyzePhase('Enviando reanálisis...');

      try {
        const crossRes = await fetch('/api/analyze-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            text: currentText,
            fileName,
            exhaustive: true,
            excludeFingerprints: Array.from(dismissedFingerprintsRef.current),
            // ⚠️ F-100 / B.163: esto es «a quién va a SUSTITUIR este texto», no
            // «de quién es este análisis». Se llamaba `documentId` y el servidor
            // lo usaba para las dos cosas, así que el análisis del texto nuevo se
            // guardaba bajo el id del documento VIEJO.
            documentoAReemplazar: documentId ?? undefined,
            // ⚠️ F-101: SIN ESTO ESTE REANÁLISIS NO TIENE PROPIETARIO NINGUNO —
            // el documento nuevo no existe y el homónimo no es su dueño—, y la
            // fila la rechaza el CHECK de la base. El dueño es el fichero.
            storagePath: storagePath ?? undefined,
          }),
        });

        if (!crossRes.ok) {
          const errData = await crossRes.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errData.error || `HTTP ${crossRes.status}`);
        }

        const crossData = await crossRes.json();

        let analysis: RawAnalysis;

        if (crossData.async && crossData.jobId) {
          // ── Reanálisis asíncrono: polling hasta que termine ──────
          setReanalyzePhase('Reanálisis en curso...');

          // F-71 paso 2: las frases por tramos salen ahora de describeJobPhase
          // (hooks/chat/useJobPolling.ts). Mismo texto, un solo sitio — la
          // bandeja necesita las mismas y dos copias se habrían separado.
          const job = await pollJobUntilDone(crossData.jobId, (status, elapsed) => {
            setReanalyzePhase(describeJobPhase(status, elapsed));
          });

          const result = job.result as Record<string, unknown> | null;
          if (!result) {
            throw new Error('El reanálisis terminó pero no devolvió resultados.');
          }
          analysis = result as unknown as RawAnalysis;
          // Del SOBRE del job. El otro consumidor de polling hace lo mismo en
          // `useDocuments`: si solo lo hiciera uno, el aviso saldria en la
          // subida y no en el reanalisis, que es el fallo que esto evita.
          setNoGuardado(!guardadoDeJob(job.guardado));
        } else {
          // Respuesta síncrona (fallback)
          analysis = crossData?.analysis || crossData || {};
        }

        setReanalyzePhase(null);

        // Recoger huellas de "posibles" descartadas por Sonnet
        if (analysis.discrepancies) {
          for (const d of analysis.discrepancies) {
            if (d.confidence === 'posible' && d.newDocSays && d.existingDocument) {
              const fp = makeDiscrepancyFingerprint(d.newDocSays, d.existingDocument);
              dismissedFingerprintsRef.current.add(fp);
            }
          }
        }

        // Generar lista nueva de problemas (reemplazo completo, sin merge)
        const newProblems = problemsFromAnalysis(analysis);

        // Marcar como dismissed los que están en la memoria
        const withDismissed = applyDismissedState(newProblems, dismissedFingerprintsRef.current);

        const activeCount = withDismissed.filter(p => !p.dismissed).length;
        const dismissedCount = withDismissed.filter(p => p.dismissed).length;

        setStageFailureCount(analysis.stageFailures?.length ?? 0);
        setSelectionLimits(analysis.selectionLimits);
        setCrossDocProblems(withDismissed);

        return { activeCount, dismissedCount, totalCount: withDismissed.length };
      } catch (err) {
        console.warn('[useCrossDocAnalysis] reanalyzeAll failed', err);
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setLastError(`No se pudo reanalizar: ${message}`);
        setReanalyzePhase(null);
        return null;
      } finally {
        setReanalyzingAll(false);
      }
    },
    []
  );

  /**
   * Toggle de "no es un error" en un problema.
   * Añade o quita su huella de la memoria de descartados.
   */
  const dismissProblem = useCallback((problem: Problem) => {
    const { id: problemId, textRef, relatedDoc, relatedDocId, relatedDocSays, huella } = problem;
    let isDismissing = false;

    setCrossDocProblems(prev => {
      const target = prev.find(p => p.id === problemId);
      if (!target) return prev;

      isDismissing = !target.dismissed;

      // Actualizar memoria de descartados
      if (textRef && relatedDoc) {
        const fp = makeDiscrepancyFingerprint(textRef, relatedDoc);
        if (isDismissing) {
          dismissedFingerprintsRef.current.add(fp);
        } else {
          dismissedFingerprintsRef.current.delete(fp);
        }

        // F-86 paso 3: las coordenadas, por si este descarte tiene que
        // sobrevivir. Solo si están COMPLETAS — un hallazgo de un análisis
        // anterior a d13e125f no trae `relatedDocId`, y sin él no hay
        // identidad posible. Se descarta en pantalla igualmente: perder la
        // memoria es peor que no poder guardarla.
        // ── LA RAMA TABULAR (F-94, ficha B) ──────────────────────────
        //
        // Se manda LA HUELLA QUE VINO CON EL HALLAZGO, no el texto de la
        // fila. La calculó el diff con la clave cruda de los dos lados y su
        // columna; aquí solo se devuelve. Mandar el texto sería atar el
        // juicio del usuario al orden de las filas y a columnas que no le
        // importaban — la identidad frágil que F-88 P2 impidió suprimiendo
        // el botón, y que ahora no hace falta impedir porque ya no se usa.
        if (reviewedDocumentId && huella) {
          void fetch('/api/findings/dismiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              documentId: reviewedDocumentId,
              tipo: 'tabular',
              huella,
              dismissed: isDismissing,
            }),
          }).catch(() => { /* el descarte de sesión ya está aplicado */ });
        }

        if (relatedDocId && relatedDocSays) {
          if (isDismissing) {
            coordenadasDescartadasRef.current.set(fp, {
              existingDocumentId: relatedDocId,
              newDocSays: textRef,
              existingDocSays: relatedDocSays,
            });
          } else {
            coordenadasDescartadasRef.current.delete(fp);
          }

          // LA ENTRADA DIRECTA: solo cuando el documento en revisión ya existe.
          // Sin `await` a propósito — el usuario no debe esperar a la red para
          // ver tachado lo que acaba de marcar, y si la petición falla lo tiene
          // igualmente en pantalla durante la sesión.
          if (reviewedDocumentId) {
            void fetch('/api/findings/dismiss', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                documentId: reviewedDocumentId,
                existingDocumentId: relatedDocId,
                newDocSays: textRef,
                existingDocSays: relatedDocSays,
                dismissed: isDismissing,
              }),
            }).catch(() => { /* el descarte de sesión ya está aplicado */ });
          }
        }
      }

      return prev.map(p => p.id === problemId ? { ...p, dismissed: isDismissing } : p);
    });

    return isDismissing;
  }, [reviewedDocumentId]);

  /** F-86 paso 3: lo que la indexación tiene que llevarse. Vacío en la bandeja,
   *  donde cada descarte ya se registró en el momento. */
  const coordenadasDescartadas = useCallback(
    (): CoordenadasDeDescarte[] => (reviewedDocumentId ? [] : [...coordenadasDescartadasRef.current.values()]),
    [reviewedDocumentId],
  );

  return { crossDocProblems, setCrossDocProblems, reanalyzeAll, reanalyzingAll, reanalyzePhase, lastError, dismissProblem, coordenadasDescartadas, stageFailureCount, noGuardado, selectionLimits };
}

// ============================================================
// Polling interno (no usa el hook porque estamos dentro de un hook)
// ============================================================

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  result: Record<string, unknown> | null;
  /** B.143: `false` si el worker no pudo guardar el resultado. AUSENTE = se
   *  asume guardado (ver `guardadoDeJob`). UNO DE LOS DOS CONSUMIDORES DE
   *  POLLING — el otro es el de `useCrossDocAnalysis`, y los dos tienen que
   *  recogerlo o el aviso existiria por un camino y no por el otro. */
  guardado?: boolean;
  errorMessage: string | null;
}

async function pollJobUntilDone(
  jobId: string,
  onProgress?: (status: JobStatus['status'], elapsed: number) => void,
): Promise<JobStatus> {
  const start = Date.now();

  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed > MAX_POLL_WAIT) {
      throw new Error('El reanálisis ha superado el tiempo máximo de espera.');
    }

    try {
      const res = await fetch(`/api/analysis-jobs/${jobId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Error consultando estado (HTTP ${res.status})`);
      }

      const job: JobStatus = await res.json();

      // F-71: incompleto también termina el polling; el aviso va en el result.
      if (job.status === 'completed' || job.status === 'completed_with_errors') return job;
      if (job.status === 'failed') {
        throw new Error(job.errorMessage || 'El reanálisis falló.');
      }

      onProgress?.(job.status, elapsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('tiempo máximo') || message.includes('falló')) throw err;
      console.warn('[useCrossDocAnalysis] Error transitorio en polling:', message);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}
