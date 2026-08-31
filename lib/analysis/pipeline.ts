import type { FinalAnalysis, PipelineOptions, DiscardedFindings, ComparedValue, ConfirmedBy } from './types';
import { mergeCounters } from './counters';
import type { PipelineCounters } from './counters';
import { stageFailureContext } from './stage-failures';
import { retrieveCandidates } from './retrieval';
import type { StructuralOverlap } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments, verifyQuote } from './judge';
import type { JudgmentEvidence } from './judge';
import { synthesizeFinalAnalysis, markIncompleteAnalysis } from './synthesize';
import { checkContentHash } from './hash-check';
import { extractAtomicClaims } from './extract-claims';
import { verifyClaimsAgainstCorpus } from './verify-claims';
import { emparejarTablas } from './table-pairing';
import { emitirDiffDeTablas } from './diff-emision';
import { restarTablasCubiertas, type TablaCubierta } from './alcance';
import { veredictoDeEmparejamiento } from './emparejamiento-juez';
import type { ParDeTablas } from './table-pairing';
import { groupChunksByTable } from './table-structure';
import { doubleCheckContradictions } from './double-check';
import type { DoubleCheckedDiscrepancy } from './double-check';
import { analyzeStyle } from './style-check';
import { loadFragmentContexts, fragmentContextKey } from './fragment-context';
import { applyDeterministicRules, buildStructuralTopic } from './finding-rules';
import { getOrderedColumns } from './table-structure';
import { verifyFindings } from './verify-findings';
import type { FindingToVerify, FindingNeighbours } from './verify-findings';
import type { StoredChunk } from '@/lib/read-chunks';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentJudgment } from './types';

/**
 * Carga full_text de un lote de documentos. Réplica local del patrón de
 * fetchFullTexts en lib/rag.ts: no se importa de ahí para no acoplar el
 * pipeline de análisis al del chat.
 *
 * F-27: los chunks (chunksByDocument, más abajo — desde F-41, lo trae
 * retrieveCandidates, no una llamada propia de este fichero) son el haystack
 * contra el que se verifican las citas del juez — esta función ya NO es la
 * fuente primaria. Queda como FALLBACK, y se llama solo con los documentIds
 * de los candidatos que volvieron sin chunks (documento indexado antes de
 * F-20, o sin chunks por cualquier otro motivo).
 *
 * Un documento sin full_text (o si la consulta entera falla) simplemente
 * no entra en el mapa — el llamador debe caer a su propio fallback, nunca
 * romper el análisis por esto.
 */
async function fetchFallbackFullTexts(
  supabase: SupabaseClient,
  documentIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (documentIds.length === 0) return result;

  const { data, error } = await supabase
    .from('documents')
    .select('id, full_text')
    .in('id', documentIds);

  if (error) {
    console.warn('[pipeline] Error cargando full_text de candidatos:', error.message);
    return result;
  }

  for (const row of data || []) {
    if (row.full_text && row.full_text.trim().length > 0) {
      result.set(row.id, row.full_text);
    }
  }

  return result;
}

export interface AnalyzePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
  /**
   * IDs de otros documentos de la misma tanda de la bandeja de revisión,
   * aún sin validar (analysisStatus='pendiente') pero ya indexados. Se
   * incluyen en el corpus consultado SOLO para este análisis, para que los
   * documentos de una tanda se comparen entre sí sin esperar a que cada
   * uno se valide.
   */
  batchDocumentIds?: string[];
  supabase: SupabaseClient;
  /**
   * Huellas de contradicciones descartadas en reanálisis anteriores.
   * Se pasan al double-check para no gastar Sonnet re-verificándolas.
   */
  excludeFingerprints?: Set<string>;
  /** F-86 paso 3: los descartes PERMANENTES de la organización
   *  (`finding_dismissals`). Van aparte de `excludeFingerprints` porque son
   *  otra especie de huella —sha256 bidireccional en vez de la vieja
   *  `nombre|texto`— y mezclarlos en un solo Set haría que ninguno de los dos
   *  emparejara. Mismo destino, distinta memoria. */
  descartesPersistidos?: Set<string>;
  /** Chunks del documento analizado, en su forma persistida (la misma que
   *  devuelve getDocumentChunks y que escribe document_chunks). Es el
   *  haystack contra el que se verifican las citas del lado nuevo (F-27), y
   *  el que permite al verificador de hallazgos comparar `cells` de los dos
   *  lados (F-24). Opcional: el camino de mejora sobre texto no indexado no
   *  tiene estructura de tabla que aportar; sin ellos, verifyQuote cae al
   *  fallback de newDocumentText. */
  newDocumentChunks?: StoredChunk[];
}

export type ExhaustivePipelineInput = AnalyzePipelineInput;

const HIGH_OVERLAP_THRESHOLD = 30;

/** Máximo de candidatas enviadas al double-check en modo exhaustivo. */
const MAX_DOUBLE_CHECK_CANDIDATES = 50;

/**
 * Rama atómica — MEDICIÓN, NO FUNCIONALIDAD (F-74).
 *
 * Sus hallazgos DEJAN DE PUBLICARSE (F-72 P2): ya no entran en la fusión, así
 * que no llegan al cliente por ninguna vía. Lo medido que lo motiva: 4 de 4
 * inventaban afirmaciones sobre la ESTRUCTURA del documento ("la tabla contiene
 * 15 filas y 10 columnas") en vez de citar su contenido, ninguno citaba texto
 * existente, y en las tandas del 27/08 produjo 1, 3 y 5 sobre los mismos
 * documentos. El modo caro estaba publicando eso como contradicción de
 * confianza alta.
 *
 * PERO LA RAMA NO SE BORRA: lo que la justificaba —encontrar contradicciones
 * con documentos que el retrieval nunca emparejaría— es valor real que ESTA
 * implementación no entrega. Queda tras el portero, contada, hasta que se
 * decida si se rediseña o se retira.
 *
 * Y APAGADA POR DEFECTO, que es lo que decide esta variable. La rama es la
 * etapa más cara del tramo exclusivo del exhaustivo —hasta 40 llamadas a Haiku,
 * decenas de segundos— y va a estar desconectada semanas, hasta que exista el
 * corpus nuevo. Dejarla corriendo sería cobrarle a cada cliente una medición
 * NUESTRA. Se enciende en el harness y solo ahí.
 *
 * Se retira, con la variable, el día que se decida rediseñar o retirar la rama.
 */
const ATOMIC_MEASURE_ENV = 'ANALYSIS_ATOMIC_MEASURE';

function atomicBranchEnabled(): boolean {
  const raw = process.env[ATOMIC_MEASURE_ENV];
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

// ============================================================
// Verificador de hallazgos: la cascada (F-35)
// ============================================================

/**
 * Texto del chunk inmediatamente anterior/posterior a `chunk` dentro de
 * `chunks` (mismo documento y generación), buscando por chunkIndex ± 1. Sin
 * lectura nueva: `chunks` ya viene cargado completo (chunksByDocument /
 * newDocumentChunks, cargados más abajo para el paso 2a). null si no hay
 * chunk, o si es el primero/último del documento.
 */
function buildNeighbours(chunks: StoredChunk[], chunk: StoredChunk | null): FindingNeighbours {
  if (!chunk) return { previous: null, next: null };
  const previous = chunks.find(c => c.chunkIndex === chunk.chunkIndex - 1);
  const next = chunks.find(c => c.chunkIndex === chunk.chunkIndex + 1);
  return { previous: previous?.text ?? null, next: next?.text ?? null };
}

function bumpCount(counts: DiscardedFindings, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

interface CascadeTally {
  total: number;
  confirmados: number;
  /** De los confirmados: cuántos por la capa determinista (F-36, 'confirm'). */
  confirmadosPorEstructura: number;
  /** De los confirmados: cuántos por la llamada corta. F-36: "es la métrica
   *  que os dirá cuánto trabajo hace cada capa". */
  confirmadosPorJuicio: number;
  descartados: number;
  reclasificados: number;
}

export interface CascadeOutcome {
  judgment: DocumentJudgment;
  tally: CascadeTally;
}

/**
 * Aplica la cascada F-25 (procedencia → determinista → llamada corta) a las
 * CONTRADICCIONES de un candidato. F-35: como etapa de runCorePipeline,
 * después de que judgeAllDocuments termina — nunca dentro de
 * judgeSingleDocument, para que generar y verificar no compartan ámbito de
 * ejecución.
 *
 * Solo contradictions[] pasa por verifyFindings, no overlappingContent[]: la
 * pregunta de verifyFindings ("¿se oponen sobre el mismo dato?") encaja con
 * lo que una contradicción afirma — no con lo que afirma un solapamiento
 * (acuerdo, no oposición). Extender la VERIFICACIÓN a solapamientos es una
 * decisión de diseño aparte, no tomada aquí. overlappingContent sí gana
 * entradas nuevas aquí, por dos vías que no pasan por esa pregunta: la
 * reclasificación de 'reclassify' (contradicción→solapamiento, como antes) y,
 * desde F-45, el solapamiento estructural que ya trae `structuralOverlaps` —
 * ninguna de las dos necesita verifyFindings porque ninguna es un veredicto
 * del juez sobre el que dudar: una viene de la capa determinista, la otra del
 * colapso de filas idénticas (F-44), verificado celda a celda antes de llegar
 * aquí.
 *
 * `evidence` muere al final de esta función: no sale en el `judgment` que
 * devuelve, que es la única pieza que sigue viaje hacia synthesize.
 *
 * F-36: la capa determinista gana una cuarta salida, 'confirm' — misma
 * columna, valores distintos, ya no queda nada que la llamada corta pueda
 * decidir. Sobrevive directamente, sin pasar por verifyFindings.
 *
 * F-38: el topic que sobrevive es el del juez, sin tocar — ninguna etapa
 * reescribe un campo que identifica el hallazgo (costó día y medio de
 * diagnóstico: se buscaba por el nombre de una persona y daba negativo porque
 * una etapa posterior había sustituido ese campo por una plantilla).
 * buildStructuralTopic queda solo como respaldo para cuando el topic del juez
 * venga vacío.
 */
/**
 * EXPORTADA SOLO PARA PODER PROBAR EL CABLEADO (F-89 frente 1, 30/08).
 *
 * No la llama nadie más que `runCorePipeline`. Se exporta porque la decisión de
 * descartar un emparejamiento inválido se podía probar en su función pura pero
 * NO en su camino — y un arreglo cuyo camino no se puede ejercer depende de que
 * el juez repita el fallo, que es justo lo que B.82 dice que no hace.
 *
 * SE PUEDE LLAMAR DESDE LA SUITE sin tocar ningún modelo: esta función solo
 * llega a `verifyFindings` —la única llamada al LLM que tiene— si algún hallazgo
 * sobrevive hasta `toVerify`. Un caso construido para que su único hallazgo se
 * descarte antes no la alcanza nunca.
 */
export async function applyCascadeToCandidate(
  judgment: DocumentJudgment,
  evidence: JudgmentEvidence,
  newDocumentChunks: StoredChunk[],
  existingChunks: StoredChunk[],
  newDocumentName: string,
  label: string,
  structuralOverlaps: StructuralOverlap[],
  /**
   * LAS DOS LISTAS DEL EMPAREJADOR, EN UN OBJETO Y NO SUELTAS.
   *
   * ⚠️ NO ES ESTILO: son dos `ParDeTablas[]` con el MISMO TIPO y destinos
   * OPUESTOS, así que pasarlas posicionalmente permitiría intercambiarlas sin
   * que el compilador dijera nada — y el resultado sería suprimir hallazgos
   * donde hay que verificarlos y al revés. Con nombres, el error tiene que
   * escribirse a propósito.
   * Se hizo tras una mutación que confirmó que el cableado de `runCorePipeline`
   * no lo puede vigilar ninguna batería: esa línea vive donde la suite no llega.
   */
  tablasDelDiff: {
    /** F-89 P4: los que el diff EMITIÓ, o sea sobre los que comparó celda a
     *  celda. Ahí tiene DOMINANCIA y el juez no emite fila-contra-fila.
     *  Vacío = el diff no comparó nada (prosa, tablas sin clave). */
    emitidos: ParDeTablas[];
    /** F-90 P1: los caídos por la TERCERA puerta — clave descubierta y cero
     *  filas comunes. El diff NO comparó nada ahí, así que no hay dominancia
     *  que invocar; lo que hay es una clave que VERIFICA. */
    sinInterseccion: ParDeTablas[];
  },
): Promise<CascadeOutcome> {
  const counts: DiscardedFindings = {};
  const tally: CascadeTally = {
    total: judgment.contradictions.length,
    confirmados: 0,
    confirmadosPorEstructura: 0,
    confirmadosPorJuicio: 0,
    descartados: 0,
    reclasificados: 0,
  };

  const keptContradictions: DocumentJudgment['contradictions'] = [];
  const movedToOverlaps: DocumentJudgment['overlappingContent'] = [];
  const toVerify: Array<{
    contradiction: DocumentJudgment['contradictions'][number];
    // Índice en judgment.contradictions/evidence.contradictions (F-40):
    // toVerify es un array COMPACTADO (solo lo que cayó a 'pass'), así que su
    // propia posición diverge de ese índice en cuanto un hallazgo anterior
    // tomó otra rama. Sin esto, no hay forma de recuperar el hash correcto
    // más abajo, en results.forEach.
    sourceIndex: number;
    finding: FindingToVerify;
  }> = [];

  // F-51: orden de columnas para describeSide (verify-findings.ts), cacheado
  // por tabla — varios hallazgos de este candidato pueden citar la misma
  // tabla, y sin caché se recalcularía (y se volvería a loggear
  // orden_no_parseable) una vez por hallazgo. 'new'/'existing' porque son dos
  // documentos distintos y un mismo tableId literal no podría darse en los
  // dos a la vez, pero el prefijo lo deja explícito igualmente.
  const columnOrderCache = new Map<string, string[]>();
  function orderedColumnsFor(chunk: StoredChunk | null, docChunks: StoredChunk[], side: 'new' | 'existing'): string[] | null {
    if (!chunk || chunk.chunkType !== 'table_row' || !chunk.tableId) return null;
    const cacheKey = `${side}:${chunk.tableId}`;
    let order = columnOrderCache.get(cacheKey);
    if (!order) {
      order = getOrderedColumns(chunk.tableId, docChunks);
      columnOrderCache.set(cacheKey, order);
    }
    return order;
  }

  judgment.contradictions.forEach((c, i) => {
    // '????????' salta a la vista si esto alguna vez dispara: significa que
    // evidence.contradictions se desalineó con judgment.contradictions, no que
    // no hay chunks. No se hace opcional en silencio (F-38).
    const ev = evidence.contradictions[i] ?? {
      hash: '????????',
      newChunk: null,
      existingChunk: null,
      newColumns: null,
      existingColumns: null,
    };

    // 2.2 — capa determinista, con las cells de los dos lados (null si el
    // chunk falta o si no es una fila de tabla: applyDeterministicRules trata
    // ambos casos igual, ya que solo le importan las cells, no si el chunk
    // existe).
    // F-70: se izan a constantes porque ahora las leen dos cosas — la regla y,
    // si confirma, el emparejamiento de valores. Un solo origen para las dos.
    const newCells = ev.newChunk?.cells ?? null;
    const existingCells = ev.existingChunk?.cells ?? null;

    // ── EL DIFF ES LA AUTORIDAD SOBRE LO QUE COMPARÓ (F-89 P4) ─────────
    //
    // SE SUPRIME TODO FILA-CONTRA-FILA SOBRE UN PAR EMITIDO, no solo lo falso,
    // y el argumento es de DOMINANCIA ESTRICTA: sobre ese par el diff vio
    // SESENTA filas completas y el juez VEINTIDÓS truncadas. Todo lo verdadero
    // que el juez pueda decir ahí, el diff ya lo dijo con mejor evidencia; todo
    // lo que añada es, en el mejor caso, un DUPLICADO —el «diecisiete donde hay
    // quince» medido en producción el 30/08— y en el peor, un emparejamiento
    // inventado (B.124). Un segundo opinador que solo puede empatar o fabricar
    // no aporta: resta.
    //
    // ANTES DE R2, como la comprobación que sustituye: si el hallazgo no va a
    // publicarse, no hay nada que R2 tenga que decidir sobre él — y decidirlo
    // primero contaría un `confirmado.por_estructura` que nadie va a ver.
    //
    // ⚠️ LA CONDICIÓN ES «CUBIERTO», NO «NO ES PAREJA». 'sin_cobertura'
    // significa que ningún par EMITIDO cubre esas dos tablas, y ahí el juez
    // conserva su hallazgo: es el territorio que F-78 y F-90 le reservan
    // —prosa, cruces tabla-prosa, tablas sin clave— y suprimir ahí sería tirar
    // hallazgos de terreno que el diff nunca miró, un fallo peor que el que
    // esto cura.
    // Los cruces TABLA-PROSA quedan fuera SOLOS, sin condición aparte:
    // `veredictoDeEmparejamiento` ya devuelve 'sin_cobertura' cuando un lado no
    // es fila de tabla.
    //
    // ⚠️ MEDIDO EL 31/08, Y CONVIENE SABERLO ANTES DE TOCAR CUALQUIERA DE LAS
    // DOS GUARDAS: EL FALSO POSITIVO DE B.124 MUERE AQUÍ, POR DOMINANCIA, Y NO
    // ABAJO POR VERIFICACIÓN. El juez volvió a emitirlo en producción —hash
    // dc678e1b, el mismo del original— y salió por `cubierto_por_diff`, porque
    // el par EST/OPE-10 está emitido y la supresión se lo lleva antes de que
    // nadie verifique nada.
    // O sea que la guarda de identidad de abajo NO está cazando el caso que
    // motivó el frente: está de reserva. Si algún día se suprimiera menos —una
    // 3ª puerta más estricta, un emparejador que emita menos— sería ella la que
    // lo cazaría, y por eso no sobra. Pero su contador a cero NO significa que
    // el falso positivo no ocurra: significa que muere antes.
    const cobertura = veredictoDeEmparejamiento(tablasDelDiff.emitidos, ev.newChunk, ev.existingChunk);
    if (cobertura !== 'sin_cobertura') {
      bumpCount(counts, 'descartado.cubierto_por_diff');
      tally.descartados++;
      console.log(
        `[${label}] · [${ev.hash}] "${(c.topic ?? '(sin titulo)').slice(0, 60)}" → descartado: ` +
        `cubierto_por_diff (el diff ya comparó esas dos tablas celda a celda)`
      );
      return;
    }

    // ── LA VERIFICACIÓN DE IDENTIDAD, DONDE HAY CLAVE PERO NO HUBO
    //    COMPARACIÓN (F-90 P1) ────────────────────────────────────────────
    //
    // Un par caído por la TERCERA puerta tiene clave descubierta y CERO filas
    // comunes: dos poblaciones distintas que comparten estructura. El diff no
    // comparó nada ahí, así que NO hay dominancia que invocar — pero la
    // estructura sabe muchísimo: sabe que ninguna fila de una tabla es la misma
    // entidad que ninguna de la otra. Si el juez empareja dos de esas filas, la
    // clave lo desmiente SIEMPRE, por definición de la puerta.
    //
    // ⚠️ POR QUÉ NO ES LO MISMO QUE LA SUPRESIÓN DE ARRIBA, aunque en la
    // práctica todo muera igual: allí no se comprueba nada del hallazgo —el
    // diff comparó mejor, punto—; aquí cada hallazgo muere VERIFICADO, con su
    // razón y su contador. Es «supresión por la vía limpia» (F-90 P1), y la
    // distinción vive en el contador: quien lea emparejamiento_invalido sabe
    // que se comprobó, y quien lea cubierto_por_diff sabe que no hizo falta.
    //
    // LAS DOS LISTAS SON EXCLUYENTES por construcción —un par o pasó las tres
    // puertas o cayó en la tercera, nunca las dos— así que el orden entre las
    // dos comprobaciones no cambia el resultado. La supresión va primera por
    // ser la más barata de leer y la del caso frecuente.
    const identidad = veredictoDeEmparejamiento(tablasDelDiff.sinInterseccion, ev.newChunk, ev.existingChunk);
    if (identidad === 'no_pareja') {
      bumpCount(counts, 'descartado.emparejamiento_invalido');
      tally.descartados++;
      console.log(
        `[${label}] · [${ev.hash}] "${(c.topic ?? '(sin titulo)').slice(0, 60)}" → descartado: ` +
        `emparejamiento_invalido (la clave dice que esas dos filas no son la misma entidad)`
      );
      return;
    }

    const verdict = applyDeterministicRules({
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      newCells,
      existingCells,
      newColumns: ev.newColumns,
      existingColumns: ev.existingColumns,
    });

    if (verdict.outcome === 'discard') {
      bumpCount(counts, `descartado.${verdict.reason}`);
      tally.descartados++;
      console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → descartado: ${verdict.reason}`);
      return;
    }

    // ── SIN CLAVE, LA ESTRUCTURA NO FIRMA (F-90 P2/P3) ─────────────────
    //
    // TODO `confirm` QUE LLEGA AQUÍ ES YA SIN CLAVE, y no hace falta
    // comprobarlo aparte: las dos puertas de arriba devolvieron
    // 'sin_cobertura' —si no, habrían salido por `return`— y 'pareja' es
    // imposible en la lista de la 3ª puerta, cuya lista de parejas está vacía
    // por definición. Luego llegar aquí significa que NINGÚN par cubre esas
    // dos tablas: cayeron por la PRIMERA puerta, y no hay clave.
    //
    // Y SIN CLAVE LA ESTRUCTURA NO PUEDE VERIFICAR IDENTIDAD, luego no puede
    // confirmar. No es que la guarda del ancla sea débil —medido: caza el
    // 22,6% de los emparejamientos falsos en tablas anchas— es que la
    // pretensión era ilegítima. El sello significa exactamente lo verificado,
    // y aquí la tercera condición de R2 no se verificó.
    //
    // EL ANCLA QUEDA COMO FILTRO QUE DESCARTA, no como guarda que confirma:
    // si NINGUNA columna compartida coincide, las dos filas no exhiben ni un
    // punto fijo y el hallazgo se va SIN GASTAR MODELO. Todo lo demás baja a
    // la llamada corta y saldrá, como mucho, con 'juicio' — que es la verdad:
    // lo confirmó un juicio, no una estructura.
    //
    // ⚠️ LO QUE SE RETIRÓ AQUÍ, y hay que saber leerlo: este bloque construía
    // el hallazgo confirmado por estructura del JUEZ, con su título por
    // plantilla (F-36) y sus valores enfrentados (F-69/F-70). Deja de existir
    // porque el juez YA NO TIENE NINGÚN CAMINO a ese sello: par emitido →
    // suprimido; 3ª puerta → verificado y muerto; sin clave → esto.
    // `confirmedBy: 'estructura'` pasa a ser EXCLUSIVO de lo que emite el
    // diff, que lo construye por su cuenta con mejor evidencia
    // (diff-emision.ts) — así que ni el título ni los valores enfrentados se
    // pierden: cambian de productor.
    // CONSECUENCIA MEDIBLE: `verificador.confirmados_por_estructura` vale CERO
    // SIEMPRE desde este commit. No es una regresión, es el diseño. El
    // contador NO se retira: si algún día vuelve a moverse, algo está mal.
    if (verdict.outcome === 'confirm') {
      if (verdict.anclas.length === 0) {
      // ⚠️ `r2.` Y NO `descartado.` COMO SUS VECINOS, y es deliberado: el
      // nombre lo fijó F-91 P2 al declararlo CENTINELA y así está escrito en
      // `claude/Contrato_Contadores.md`. Renombrarlo dejaría el contrato
      // mintiendo. La bolsa donde caen los dos —`DiscardedFindings`— no
      // impone prefijo (por eso B.110 sigue abierto), así que conviven.
        bumpCount(counts, 'r2.sin_ancla');
        tally.descartados++;
        console.log(
          `[${label}] · [${ev.hash}] "${(c.topic ?? '(sin titulo)').slice(0, 60)}" → descartado: ` +
          `r2.sin_ancla (sin clave y sin ninguna columna que coincida: no hay identidad que oponer)`
        );
        return;
      }

      bumpCount(counts, 'a_juicio.sin_clave');
      tally.reclasificados++;
      console.log(
        `[${label}] · [${ev.hash}] "${(c.topic ?? '(sin titulo)').slice(0, 60)}" → baja a juicio: ` +
        `sin_clave (${verdict.anclas.length} columna(s) de ancla, pero la estructura no puede firmar)`
      );
      toVerify.push({
        contradiction: c,
        sourceIndex: i,
        finding: {
          topic: c.topic,
          newDocSays: c.newDocSays,
          existingDocSays: c.existingDocSays,
          existingDocumentName: judgment.documentName,
          newChunk: ev.newChunk,
          existingChunk: ev.existingChunk,
          newNeighbours: buildNeighbours(newDocumentChunks, ev.newChunk),
          existingNeighbours: buildNeighbours(existingChunks, ev.existingChunk),
          newColumnOrder: orderedColumnsFor(ev.newChunk, newDocumentChunks, 'new'),
          existingColumnOrder: orderedColumnsFor(ev.existingChunk, existingChunks, 'existing'),
        },
      });
      return;
    }

    if (verdict.outcome === 'reclassify') {
      bumpCount(counts, 'descartado.equivalentes');
      tally.reclasificados++;
      console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → reclasificado a solapamiento`);
      // Se mueve de contradicción a solapamiento: no hay "description" propia
      // en una contradicción, así que el topic hace ese papel — es lo más
      // cercano a una frase que resuma qué comparten los dos lados.
      movedToOverlaps.push({ description: c.topic, evidence: c.existingDocSays, evidenceInNewDoc: c.newDocSays });
      return;
    }

    // 'pass' -> baja a juicio (2.3): motivo solo si aplica, nunca los dos a
    // la vez (columna_indeterminada exige cells en los dos lados, que nunca
    // se da si falta un chunk).
    if (!ev.newChunk || !ev.existingChunk) {
      bumpCount(counts, 'a_juicio.chunk_no_localizado');
      console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → baja a juicio: chunk_no_localizado`);
    } else if (ev.newChunk.cells && ev.existingChunk.cells) {
      // F-55: LEE las columnas que trae la evidencia; no las recalcula. Antes
      // repetía aquí la búsqueda por texto de findCitedColumns, con el riesgo
      // de que el log dijera una cosa y la regla hubiera decidido con otra.
      if (!ev.newColumns?.length || !ev.existingColumns?.length) {
        bumpCount(counts, 'a_juicio.columna_indeterminada');
        console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → baja a juicio: columna_indeterminada`);
      }
    }

    toVerify.push({
      contradiction: c,
      sourceIndex: i,
      finding: {
        topic: c.topic,
        newDocSays: c.newDocSays,
        existingDocSays: c.existingDocSays,
        existingDocumentName: judgment.documentName,
        newChunk: ev.newChunk,
        existingChunk: ev.existingChunk,
        newNeighbours: buildNeighbours(newDocumentChunks, ev.newChunk),
        existingNeighbours: buildNeighbours(existingChunks, ev.existingChunk),
        newColumnOrder: orderedColumnsFor(ev.newChunk, newDocumentChunks, 'new'),
        existingColumnOrder: orderedColumnsFor(ev.existingChunk, existingChunks, 'existing'),
      },
    });
  });

  // 2.4 — llamada corta, solo con lo que pasó la capa determinista.
  if (toVerify.length > 0) {
    const { results, counts: verifyCounts } = await verifyFindings(toVerify.map(t => t.finding));
    for (const [key, n] of Object.entries(verifyCounts)) {
      counts[key] = (counts[key] ?? 0) + n;
    }
    results.forEach((r, i) => {
      const original = toVerify[i].contradiction;
      // Hash leído, no recalculado (F-40): mismo sitio que las otras cinco
      // líneas (evidence.contradictions), pero indexado por sourceIndex —
      // el índice de toVerify[i] no sirve aquí, es el de un array compactado.
      const hash = evidence.contradictions[toVerify[i].sourceIndex]?.hash ?? '????????';
      if (r.verdict === 'confirmado') {
        bumpCount(counts, 'confirmado.por_juicio');
        tally.confirmados++;
        tally.confirmadosPorJuicio++;
        console.log(`[${label}] · [${hash}] "${original.topic.slice(0, 60)}" → confirmado por juicio`);
        keptContradictions.push({ ...original, severity: r.severity ?? original.severity, confirmedBy: 'juicio' });
      } else {
        // 'mismo_dato_sin_oposicion' y 'sin_relacion' mueren aquí — sus
        // motivos ya están contados dentro de verifyCounts.
        tally.descartados++;
        console.log(`[${label}] · [${hash}] "${original.topic.slice(0, 60)}" → descartado: ${r.verdict}`);
      }
    });
  }

  // 2.5 — fusión de conteos con el discarded que ya traía el judgment
  // (narracionEnCita / citaNoVerificable, de fixQuotesInJudgment). Mismo
  // campo, DocumentJudgment no gana ninguno nuevo — solo se le llena más.
  const mergedDiscarded: DiscardedFindings = { ...(judgment.discarded ?? {}) };
  for (const [key, n] of Object.entries(counts)) {
    mergedDiscarded[key] = (mergedDiscarded[key] ?? 0) + n;
  }

  // F-45: un solapamiento por tabla colapsada (retrieval.ts F-44) — nunca
  // pasó por el juez, así que tampoco pasa por fixQuotesInJudgment (esa
  // verificación ya corrió antes, dentro de judgeSingleDocument, sobre lo que
  // el juez emitió). `evidence`/`evidenceInNewDoc` quedan vacíos a propósito:
  // no hay una cita única que resuma N filas colapsadas — el texto que sí
  // sostiene el hallazgo va en `description`, con las columnas y el valor de
  // cada fila que coincidió.
  const structuralEntries: DocumentJudgment['overlappingContent'] = structuralOverlaps.map(s => {
    const structuralPercent = s.rowsTotal > 0 ? Math.round((s.collapsedCount / s.rowsTotal) * 100) : 0;
    const tableLabel = s.sheetName ? `"${s.sheetName}"` : 'una tabla';
    return {
      description:
        `${s.collapsedCount} de ${s.rowsTotal} filas de ${tableLabel} de "${judgment.documentName}" ` +
        `coinciden exactamente, celda a celda, en ${s.columns.join(' y ')} con filas de "${newDocumentName}": ` +
        `${s.labels.join(', ')}.`,
      evidence: '',
      evidenceInNewDoc: '',
      confirmedBy: 'estructura',
      structuralPercent,
    };
  });

  return {
    judgment: {
      ...judgment,
      contradictions: keptContradictions,
      overlappingContent: [...judgment.overlappingContent, ...movedToOverlaps, ...structuralEntries],
      ...(Object.keys(mergedDiscarded).length > 0 ? { discarded: mergedDiscarded } : {}),
    },
    tally,
  };
}

/**
 * LA FRONTERA DEL DOUBLE-CHECK (F-71 paso 3), con nombre para poder probarla.
 *
 * REGLA DEL PIPELINE: ninguna llamada a un modelo puede revertir un veredicto
 * DETERMINISTA. Un `confirmedBy: 'estructura'` es un teorema sobre celdas, y que
 * Sonnet opine lo contrario no es información sobre el hallazgo: es información
 * sobre Sonnet.
 *
 * POR QUÉ ES UNA FUNCIÓN Y NO DOS `filter` EN SU SITIO (F-86): la frontera
 * estaba viva POR CONSTRUCCIÓN —dos filtros correctos escritos en línea— y sin
 * un solo caso que la vigilara. Un filtro en línea no se puede probar sin
 * ejecutar el pipeline entero, que el alcance de la suite prohíbe. Con nombre,
 * la frontera pasa a ser verdad POR CONTRATO.
 *
 * FILTRA POR EL VALOR DEL CAMPO, no por el tipo ni por la procedencia del
 * hallazgo: cualquier cosa que llegue con `confirmedBy: 'estructura'` queda
 * fuera de Sonnet automáticamente, incluidos los hallazgos del diff de tablas
 * cuando la emisión los conecte. Eso NO es casualidad y no debe «mejorarse»
 * enumerando tipos conocidos: enumerar tipos es lo que haría que un tipo nuevo
 * se colara.
 */
export function particionDoubleCheck<T extends { confirmedBy?: ConfirmedBy }>(
  candidatas: T[],
): { estructurales: T[]; aJuicio: T[] } {
  return {
    estructurales: candidatas.filter(d => d.confirmedBy === 'estructura'),
    aJuicio: candidatas.filter(d => d.confirmedBy !== 'estructura'),
  };
}
// ============================================================
// Núcleo compartido: retrieve → rerank → judge → verificar → synthesize
// ============================================================

/**
 * F-82: un `FinalAnalysis` que YA lleva contadores, y el tipo que impide
 * repetir el fallo que motivó este arreglo.
 *
 * La primera versión colgaba los contadores del único punto donde el pipeline
 * «termina bien», así que las dos salidas tempranas de `runCorePipeline`
 * devolvían el objeto de synthesize sin ellos — medido en producción: tres
 * análisis seguidos con `pipeline_counters` en null.
 *
 * Ahora `runCorePipeline` declara que devuelve esto, y `pipelineCounters` es
 * OBLIGATORIO aquí (no opcional, como en `FinalAnalysis`). Consecuencia: un
 * `return` que no pase por `withCounters` NO COMPILA. La garantía no depende de
 * que alguien se acuerde de mirar las salidas, igual que el `satisfies` del
 * catálogo no depende de que alguien se acuerde del prefijo.
 */
type CountedAnalysis = FinalAnalysis & { pipelineCounters: PipelineCounters };

/** Único constructor de CountedAnalysis, y por tanto el único camino a las
 *  salidas de runCorePipeline. Pasa por mergeCounters —el punto de
 *  estrangulamiento de la cláusula 4— aunque hoy el acumulador venga de un solo
 *  sitio: así el día que otra etapa aporte contadores, se añade como argumento
 *  y no como un sitio nuevo por el que colarse. */
function withCounters(analysis: FinalAnalysis, counters: PipelineCounters): CountedAnalysis {
  return { ...analysis, pipelineCounters: mergeCounters(counters) };
}

async function runCorePipeline(
  input: AnalyzePipelineInput,
  options: PipelineOptions,
  label: string,
): Promise<CountedAnalysis> {
  const t0 = Date.now();

  // F-82: EL ACUMULADOR, creado al principio y adjuntado en LAS TRES salidas.
  // No se construye al final: eso fue el fallo. Cada etapa deja aquí lo que
  // decidió en cuanto lo decide, así que un análisis que se para antes conserva
  // lo que sí llegó a decidirse — que es justo lo más informativo.
  const counters: PipelineCounters = {};

  const { candidates, chunksByDocument: chunksFromRetrieval, structuralOverlaps, selectionLimits } = await retrieveCandidates({
    sampleTexts: input.sampleTexts,
    orgId: input.orgId,
    excludeDocumentId: input.excludeDocumentId,
    batchDocumentIds: input.batchDocumentIds,
    options,
    supabase: input.supabase,
    newDocumentChunks: input.newDocumentChunks,
  });
  console.log(`[${label}] Retrieval: ${candidates.length} candidatos (${Date.now() - t0}ms)`);
  counters['seleccion.candidatos_recuperados'] = candidates.length;

  // SALIDA TEMPRANA 1 — el corpus activo no tenía nada que comparar. Es la
  // decisión más informativa que puede tomar un análisis, y hasta F-82 no
  // dejaba rastro fuera del console.log de arriba.
  if (candidates.length === 0) {
    return withCounters(
      await synthesizeFinalAnalysis({ newDocumentName: input.newDocumentName, judgments: [] }),
      counters,
    );
  }

  const t1 = Date.now();
  const reranked = await rerankCandidates({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates,
    options,
  });
  console.log(`[${label}] Rerank: ${reranked.length} seleccionados (${Date.now() - t1}ms)`);
  counters['seleccion.candidatos_seleccionados'] = reranked.length;

  // SALIDA TEMPRANA 2 — había candidatos y el rerank no dejó ninguno. Se
  // distingue de la anterior por los DOS contadores: aquí `recuperados` es > 0
  // y `seleccionados` es 0; allí `seleccionados` ni siquiera existe, porque
  // esta etapa no llegó a correr.
  if (reranked.length === 0) {
    return withCounters(
      await synthesizeFinalAnalysis({ newDocumentName: input.newDocumentName, judgments: [] }),
      counters,
    );
  }

  // F-27: los chunks son el haystack contra el que se verifican las citas del
  // juez. F-41: ya no se vuelve a consultar — retrieveCandidates hace
  // exactamente esta misma lectura, con getChunksForDocuments, para TODOS sus
  // candidatos (necesaria para el reparto por unidades); reranked es siempre
  // un subconjunto de esos candidatos, así que el mapa que ya trajo retrieval
  // los cubre sin una segunda ida a Supabase. Solo se lee full_text para los
  // documentos que vuelvan SIN chunks (indexados antes de F-20, o sin chunks
  // por cualquier otro motivo) — fallback, no fuente primaria.
  const chunksByDocument = chunksFromRetrieval;
  const documentsWithoutChunks = reranked
    .map(c => c.documentId)
    .filter(id => !chunksByDocument.get(id)?.length);
  const fallbackTexts = await fetchFallbackFullTexts(input.supabase, documentsWithoutChunks);
  console.log(`[${label}] Chunks para verificación: ${chunksByDocument.size}/${reranked.length} documentos con chunks (${documentsWithoutChunks.length} por full_text de respaldo)`);

  // F-20 4d: enriquecer los fragmentos con su contexto de document_chunks
  // (tipo de chunk, hoja/fila si es tabla, y texto vecino). No-fatal: si la
  // carga falla o el documento no tiene chunks persistidos, los fragmentos se
  // quedan sin `context` y todo sigue como antes.
  const fragmentRefs = reranked.flatMap(c =>
    c.fragments.map(f => ({
      documentId: f.documentId,
      generation: f.generation ?? 1,
      chunkIndex: f.chunkIndex,
    })),
  );
  const contexts = await loadFragmentContexts(input.supabase, {
    orgId: input.orgId,
    refs: fragmentRefs,
  });
  if (contexts.size > 0) {
    for (const candidate of reranked) {
      candidate.fragments = candidate.fragments.map(f => {
        const ctx = contexts.get(
          fragmentContextKey(f.documentId, f.generation ?? 1, f.chunkIndex),
        );
        return ctx ? { ...f, context: ctx } : f;
      });
    }
  }
  console.log(`[${label}] Contexto de fragmentos: ${contexts.size}/${fragmentRefs.length} resueltos`);

  const t2 = Date.now();
  const { judgments: rawJudgments, evidences } = await judgeAllDocuments({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates: reranked,
    options,
    newDocumentChunks: input.newDocumentChunks ?? [],
    chunksByDocument,
    fallbackTexts,
  });
  console.log(`[${label}] Judge: ${rawJudgments.length} juicios emitidos (${Date.now() - t2}ms)`);

  // Cascada del verificador (F-35): un candidato, un lote — sale gratis
  // porque rawJudgments ya viene un elemento por candidato. Secuencial, no en
  // paralelo entre candidatos: mantiene el alcance de este commit acotado;
  // paralelizar esta etapa (como ya hacen retrieval/judge, F-31) queda para
  // cuando haga falta medido, no aquí.
  const t2b = Date.now();
  const newDocumentChunksForCascade = input.newDocumentChunks ?? [];
  const judgments: DocumentJudgment[] = [];
  // B.122: las tablas que el diff SÍ comparó, para restarlas del alcance
  // declarado. Se acumulan aquí porque es donde se sabe: la emisión ocurre
  // candidato a candidato, y el bloque de F-74 P2 corre mucho después.
  const tablasCubiertas: TablaCubierta[] = [];
  let totalHallazgos = 0;
  let totalConfirmados = 0;
  let totalConfirmadosPorEstructura = 0;
  let totalConfirmadosPorJuicio = 0;
  let totalDescartados = 0;
  let totalReclasificados = 0;
  for (let i = 0; i < rawJudgments.length; i++) {
    const judgment = rawJudgments[i];
    const evidence = evidences[i];
    const existingChunksForCascade = chunksByDocument.get(judgment.documentId) ?? [];

    // ── EL EMPAREJAMIENTO DE TABLAS, ANTES DE LA CASCADA (F-89, frente 1) ──
    //
    // SUBE AQUÍ Y LA EMISIÓN NO SE MUEVE. Son dos cosas y solo una tiene que
    // adelantarse, así que conviene decir cuál y por qué:
    //
    //   · EL EMPAREJAMIENTO (esto) sube porque R2 lo necesita DELANTE al
    //     decidir. F-89 P2 le encarga verificar que las dos filas de un
    //     hallazgo son la misma fila, y eso se comprueba con la CLAVE
    //     descubierta — que hasta ahora no existía cuando la cascada corría.
    //     Es puro y barato (13,9 ms medidos para 48 pares), así que
    //     adelantarlo no cuesta nada.
    //
    //   · LA EMISIÓN se queda DESPUÉS, y su razón sigue intacta: la cascada
    //     verifica citas y aplica reglas pensadas para hallazgos del JUEZ, y
    //     meter por ahí un veredicto determinista sería exponerlo a que una
    //     etapa lo degrade — lo que F-64 prohíbe y lo que la frontera del
    //     double-check ya evita río abajo.
    //
    // LO QUE RECIBE LA EMISIÓN NO CAMBIA, y se comprobó leyendo antes de
    // mover: `applyCascadeToCandidate` no muta ninguna de las dos entradas del
    // emparejamiento. Las lee para los vecinos (`buildNeighbours`: find) y
    // para el orden de columnas (`getOrderedColumns`: filter/find/some), y
    // nada más. Entradas idénticas, salida idéntica.
    //
    // Los dos lados salen de aquí sin buscar nada: las tablas del documento
    // analizado de sus chunks, las del candidato de los suyos.
    const emparejamiento = emparejarTablas(
      groupChunksByTable(newDocumentChunksForCascade),
      groupChunksByTable(existingChunksForCascade),
    );

    const outcome = await applyCascadeToCandidate(
      judgment,
      evidence,
      newDocumentChunksForCascade,
      existingChunksForCascade,
      input.newDocumentName,
      label,
      structuralOverlaps.get(judgment.documentId) ?? [],
      // F-89 P2 y F-90 P1: por esto subió el emparejamiento antes de la
      // cascada, y por esto la traza devuelve los caídos con su clave.
      { emitidos: emparejamiento.pares, sinInterseccion: emparejamiento.sinInterseccion },
    );

    // La emisión, con los ids: `input.excludeDocumentId` (el analizado, que
    // puede faltar — F-87) y `judgment.documentId` (el del corpus, que nunca).
    const emision = emitirDiffDeTablas(
      emparejamiento.pares,
      {
        nuevo: { id: input.excludeDocumentId, nombre: input.newDocumentName },
        existente: { id: judgment.documentId, nombre: judgment.documentName },
      },
    );

    const conDiff: DocumentJudgment = emision.contradicciones.length > 0 || emision.grupos.length > 0
      ? {
          ...outcome.judgment,
          contradictions: [...outcome.judgment.contradictions, ...emision.contradicciones],
          tableDiffs: [...(outcome.judgment.tableDiffs ?? []), ...emision.grupos],
        }
      : outcome.judgment;

    if (emision.grupos.length > 0) {
      console.log(
        `[${label}] Diff de tablas contra "${judgment.documentName}": ` +
        `${emision.grupos.length} pareja(s), ${emision.contradicciones.length} discrepancia(s) emitida(s)`
      );
    }

    // LOS CONTADORES DEL DIFF, sumados candidato a candidato. Van al mismo
    // acumulador que el resto: `mergeCounters` los funde por nombre y descarta
    // lo no declarado (cláusula 4). Se suman AQUÍ, en cuanto se conocen, por
    // el mismo criterio que los de la cascada — quien salga antes no los lleva,
    // y no llevarlos es la verdad.
    for (const [k, v] of Object.entries({ ...emparejamiento.counts, ...emision.counts })) {
      const clave = k as keyof typeof counters;
      counters[clave] = (counters[clave] ?? 0) + (v as number);
    }

    // B.122: solo las de los pares EMITIDOS. Un par que cayó por alguna de las
    // tres puertas no comparó nada, así que sus tablas siguen sin mirar y su
    // aviso sigue siendo verdad.
    for (const par of emparejamiento.pares) {
      tablasCubiertas.push({ documentId: judgment.documentId, tableId: par.existente.tableId });
    }

    judgments.push(conDiff);
    totalHallazgos += outcome.tally.total;
    totalConfirmados += outcome.tally.confirmados;
    totalConfirmadosPorEstructura += outcome.tally.confirmadosPorEstructura;
    totalConfirmadosPorJuicio += outcome.tally.confirmadosPorJuicio;
    totalDescartados += outcome.tally.descartados;
    totalReclasificados += outcome.tally.reclasificados;
  }
  console.log(
    `[${label}] Verificador: ${totalHallazgos} hallazgos → ${totalConfirmados} confirmados ` +
    `(${totalConfirmadosPorEstructura} por estructura, ${totalConfirmadosPorJuicio} por juicio), ` +
    `${totalDescartados} descartados, ${totalReclasificados} reclasificados (${Date.now() - t2b}ms)`
  );

  const t3 = Date.now();
  const synthesized = await synthesizeFinalAnalysis({
    newDocumentName: input.newDocumentName,
    judgments,
    excludeDocumentId: input.excludeDocumentId,
  });
  console.log(`[${label}] Synthesize (${Date.now() - t3}ms). Total: ${Date.now() - t0}ms`);

  // F-82: los seis recuentos de la cascada, que hasta este commit se imprimían
  // en el console.log de arriba y se tiraban. Son recuentos de DECISIÓN
  // —cuántos hallazgos tomaron cada salida—, lo único que el contrato admite
  // (claude/Contrato_Contadores.md, cláusula 2). Entran en el acumulador AQUÍ,
  // que es cuando se conocen: quien salga antes no los lleva, y no llevarlos es
  // la verdad — la cascada no corrió.
  counters['verificador.hallazgos_entrantes'] = totalHallazgos;
  counters['verificador.confirmados'] = totalConfirmados;
  counters['verificador.confirmados_por_estructura'] = totalConfirmadosPorEstructura;
  counters['verificador.confirmados_por_juicio'] = totalConfirmadosPorJuicio;
  counters['verificador.descartados'] = totalDescartados;
  counters['verificador.reclasificados'] = totalReclasificados;

  // SALIDA 3 (la normal). Se adjuntan aquí, antes del bloque de F-74 P2,
  // porque aquel tiene un `return final` temprano cuando no hay límites;
  // hacerlo después los perdería en el caso corriente.
  const final = withCounters(synthesized, counters);

  // F-74 P2: EL ALCANCE DECLARADO. Se funde DESPUÉS del return de synthesize —
  // mismo criterio que exhaustiveCounts en el exhaustivo, para no tocar la
  // firma de synthesizeFinalAnalysis. Vale para LOS DOS MODOS: el rápido
  // recorta igual, y desde F-73 con la misma maquinaria.
  //
  // SOLO de los candidatos que llegaron al JUEZ. retrieveCandidates devuelve
  // límites de todos los que recuperó, pero el rerank descarta antes de juzgar:
  // avisar de que no se compararon filas de un documento que nunca se comparó
  // con nada sería una nota sobre un análisis que no ocurrió.
  const judgedIds = new Set(reranked.map(c => c.documentId));

  // B.122: el alcance se declara SOBRE LO QUE NADIE MIRÓ. Las tablas que el
  // diff comparó celda a celda —que es MÁS de lo que hace el juez— dejan de
  // tener filas «sin mirar», así que salen del aviso. Ver la cabecera de
  // alcance.ts sobre por qué es POR TABLA y no por documento: restar por
  // documento apagaría el aviso de las otras tablas, que sí es verdad.
  const limits = restarTablasCubiertas(
    [...selectionLimits.entries()]
      .filter(([documentId]) => judgedIds.has(documentId))
      .flatMap(([documentId, ls]) => ls.map(limit => ({ documentId, limit }))),
    tablasCubiertas,
  );

  if (limits.length === 0) return final;

  const rowsLeftOut = limits.reduce((sum, l) => sum + l.rowsLeftOut, 0);
  console.log(`[${label}] Alcance: ${rowsLeftOut} fila(s) recuperada(s) fuera por tamaño, en ${limits.length} tabla(s)`);

  // El contador va con prefijo `seleccion.` porque es MATERIAL descartado, no
  // un hallazgo: lo separa de descartado.* (hallazgos que la cascada tiró) y de
  // exhaustivo.* (lo que se pierde en el tramo caro).
  const withLimits: DiscardedFindings = { ...(final.discardedFindings ?? {}) };
  withLimits['seleccion.filas_fuera_por_tamano'] =
    (withLimits['seleccion.filas_fuera_por_tamano'] ?? 0) + rowsLeftOut;

  return { ...final, selectionLimits: limits, discardedFindings: withLimits };
}

// ============================================================
// Helper: duplicado exacto
// ============================================================

function buildExactDuplicateResponse(
  duplicateOfName: string,
  mode: 'quick' | 'exhaustive',
): FinalAnalysis {
  return {
    isDuplicate: true,
    duplicateOf: duplicateOfName,
    duplicateConfidence: 100,
    overlaps: [],
    discrepancies: [],
    newInformation: '',
    recommendation: 'NO_INDEXAR',
    summary: `Este documento es idéntico a "${duplicateOfName}" que ya está indexado. No aporta información nueva.`,
    judgments: [],
    analysisMode: mode,
  };
}

// ============================================================
// Pipeline rápido
// ============================================================

export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();

  const hashResult = await checkContentHash(
    input.supabase, input.newDocumentText, input.orgId, input.excludeDocumentId,
  );

  if (hashResult.isDuplicateExact) {
    console.log(`[pipeline-v2] Hash match: duplicado exacto de "${hashResult.duplicateOfName}" (${Date.now() - t0}ms)`);
    return buildExactDuplicateResponse(hashResult.duplicateOfName!, 'quick');
  }

  console.log(`[pipeline-v2] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  // F-71: el contexto de caídas se abre AQUÍ, no en el llamador, para que cada
  // análisis tenga el suyo sin que route.ts ni el worker tengan que saber que
  // existe. AsyncLocalStorage lo aísla por árbol de llamadas: dos análisis
  // simultáneos no comparten array.
  return stageFailureContext.run([], async () => {
    const result = await runCorePipeline(input, { exhaustive: false }, 'pipeline-v2');
    return { ...result, analysisMode: 'quick' };
  });
}

// ============================================================
// Pipeline exhaustivo
// ============================================================

export async function runExhaustiveAnalysisPipeline(input: ExhaustivePipelineInput): Promise<FinalAnalysis> {
  // F-71: mismo motivo que en el rápido — un contexto de caídas por análisis,
  // abierto aquí para que el worker no tenga que conocerlo. El cuerpo va en una
  // función aparte solo para no indentar noventa líneas.
  return stageFailureContext.run([], () => runExhaustivePipelineInner(input));
}

async function runExhaustivePipelineInner(input: ExhaustivePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();
  console.log(`[pipeline-exhaustive] Iniciando análisis exhaustivo de "${input.newDocumentName}" con ${input.sampleTexts.length} fragmentos`);

  const hashResult = await checkContentHash(
    input.supabase, input.newDocumentText, input.orgId, input.excludeDocumentId,
  );

  if (hashResult.isDuplicateExact) {
    console.log(`[pipeline-exhaustive] Hash match: duplicado exacto de "${hashResult.duplicateOfName}" (${Date.now() - t0}ms)`);
    return buildExactDuplicateResponse(hashResult.duplicateOfName!, 'exhaustive');
  }

  console.log(`[pipeline-exhaustive] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  const [pipelineResult, styleProblems] = await Promise.all([
    runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive'),
    analyzeStyle(input.newDocumentText, input.newDocumentName),
  ]);

  const excludeFps = input.excludeFingerprints || new Set<string>();

  // F-71 paso 1: recuento de todo lo que se pierde en el tramo exclusivo del
  // exhaustivo. Se funde al final con el discardedFindings que ya trae
  // pipelineResult (el del núcleo, calculado en synthesize).
  const exhaustiveCounts: DiscardedFindings = {};

  // ── Rama atómica: MEDIDA, NO PUBLICADA (F-74) ────────────────
  // Ver ATOMIC_MEASURE_ENV arriba. Apagada, ni se ejecuta: son las dos etapas
  // más caras del tramo exclusivo y ya no alimentan nada que el cliente vea.
  if (atomicBranchEnabled()) {
    const atomicClaims = await extractAtomicClaims(input.newDocumentText, input.newDocumentName);
    const atomicContradictions = await verifyClaimsAgainstCorpus(atomicClaims, input.orgId, input.excludeDocumentId, input.batchDocumentIds);

    // EL PORTERO. La misma pregunta que se le hace a las citas del juez: ¿esta
    // cita EXISTE en el documento? Se comprueba el lado NUEVO (`newDocSays`,
    // que es `result.claim` en verify-claims.ts) contra los chunks del
    // documento analizado, porque es justo ahí donde está el fallo medido: las
    // afirmaciones inventan la ESTRUCTURA del documento que se analiza.
    //
    // Solo ese lado, y no por comodidad: los chunks de los documentos del
    // corpus (`chunksByDocument`) viven DENTRO de runCorePipeline y no salen de
    // ahí —devuelve un FinalAnalysis—, así que `existingDocSays` no tiene
    // haystack disponible en este ámbito. Comprobar la mitad que sí se puede
    // responde la pregunta que se hizo; comprobar la otra exigiría cambiar lo
    // que runCorePipeline devuelve, y eso es rediseño, no medición.
    let confirmadas = 0;
    let noVerificables = 0;
    for (const c of atomicContradictions) {
      const match = verifyQuote(
        input.newDocumentChunks ?? [],
        input.newDocumentText,
        c.newDocSays,
      );
      if (match) {
        bumpCount(exhaustiveCounts, 'atomica.confirmado');
        confirmadas++;
      } else {
        bumpCount(exhaustiveCounts, 'atomica.cita_no_verificable');
        noVerificables++;
        console.log(`[pipeline-exhaustive] · atomica sin cita verificable: "${c.topic.slice(0, 60)}" — "${(c.newDocSays ?? '').slice(0, 80)}"`);
      }
    }
    console.log(
      `[pipeline-exhaustive] Rama atomica (MEDICION, no se publica): ${atomicContradictions.length} producidas, ` +
      `${confirmadas} con cita verificable, ${noVerificables} sin`
    );
  } else {
    console.log(`[pipeline-exhaustive] Rama atomica APAGADA (${ATOMIC_MEASURE_ENV} sin poner): 0 llamadas al LLM por esta via`);
  }

  // F-74: la fusión se queda SOLO con lo del núcleo. Aquí entraban las atómicas
  // por un .map() de cinco campos que además les quitaba la procedencia —
  // llegaban sin confirmedBy, indistinguibles de las del juez río abajo.
  const mergedDiscrepancies = mergeContradictions(
    pipelineResult.discrepancies,
    [],
    exhaustiveCounts,
  );

  console.log(`[pipeline-exhaustive] Candidatas al double-check: ${mergedDiscrepancies.length} (solo del nucleo; la rama atomica ya no se fusiona)`);

  const totalCandidates = mergedDiscrepancies.length;
  const cappedCandidates = mergedDiscrepancies.slice(0, MAX_DOUBLE_CHECK_CANDIDATES);
  const candidatesOverLimit = totalCandidates > MAX_DOUBLE_CHECK_CANDIDATES ? totalCandidates : undefined;

  if (candidatesOverLimit !== undefined) {
    console.log(`[pipeline-exhaustive] Candidatas limitadas a ${MAX_DOUBLE_CHECK_CANDIDATES} (había ${totalCandidates})`);
    // F-71 paso 1 [1]: `candidatesOverLimit` dice cuántas HABÍA; esto dice
    // cuántas se QUEDARON FUERA, que es el dato que faltaba, y cuáles.
    for (const d of mergedDiscrepancies.slice(MAX_DOUBLE_CHECK_CANDIDATES)) {
      bumpCount(exhaustiveCounts, 'exhaustivo.sobre_tope_double_check');
      console.log(`[pipeline-exhaustive] · sobre el tope: "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
    }
  }

  // ── LA FRONTERA DEL DOUBLE-CHECK (F-71 paso 3) ───────────────
  //
  // REGLA DEL PIPELINE: ninguna llamada a un modelo puede revertir un veredicto
  // DETERMINISTA. Un `confirmedBy: 'estructura'` es un teorema sobre celdas —
  // R2 comprobó que la misma columna de la misma fila tiene dos valores
  // distintos—, y que Sonnet opine lo contrario no es información sobre el
  // hallazgo: es información sobre Sonnet.
  //
  // Medido el 28/08 sobre 5fa72955, tres pasadas seguidas: la contradicción del
  // Puesto de Pablo Reyes llega confirmada por estructura y Sonnet la degrada a
  // 'posible' en DOS de las tres. El hallazgo mejor verificado del sistema
  // desaparecía por opinión de un modelo.
  //
  // Ni se le envían: además de la corrección, es el ahorro directo de las
  // llamadas más caras del pipeline. A Sonnet solo va lo confirmado por JUICIO,
  // que es donde una segunda opinión de un modelo superior vale lo que cuesta.
  const { estructurales: structuralCandidates, aJuicio: toDoubleCheck } = particionDoubleCheck(cappedCandidates);
  console.log(
    `[pipeline-exhaustive] Frontera del double-check: ${structuralCandidates.length} por estructura NO se envian a Sonnet, ` +
    `${toDoubleCheck.length} por juicio si`
  );

  const { results: checked, counts: doubleCheckCounts, alreadyDismissed } = await doubleCheckContradictions(
    toDoubleCheck,
    0, // sin objetivo → verificar todas
    excludeFps,
    // F-86 paso 3: `excludeDocumentId` ES el id del documento en revisión —
    // analyze-v2 lo fija con el `documentId` del cuerpo (route.ts:86) para que
    // un documento no se compare consigo mismo. Que sea además la mitad de la
    // identidad de la huella no es casualidad: es el mismo documento.
    { conjunto: input.descartesPersistidos ?? new Set(), documentoEnRevision: input.excludeDocumentId },
  );
  for (const [key, count] of Object.entries(doubleCheckCounts)) {
    exhaustiveCounts[key] = (exhaustiveCounts[key] ?? 0) + count;
  }

  // Y VUELVEN A JUNTARSE AQUÍ, con su confianza puesta.
  //
  // `confidence: 'alta'` explícita porque HOY NO LA TIENEN: DocumentJudgment
  // no declara el campo y el .map() de synthesize tampoco lo añade, así que
  // quien se la asignaba era justo la línea del double-check que acaban de
  // esquivar. Sin esto saldrían con `confidence: undefined` y los dos filtros
  // de abajo —uno exige 'alta', el otro 'posible'— los dejarían fuera de los
  // dos arrays: el hallazgo mejor verificado del sistema desaparecería del
  // todo, que es lo contrario de lo que esta frontera persigue.
  // Y el valor no es una elección: si 'estructura' es un teorema sobre celdas,
  // 'alta' es su confianza POR DEFINICIÓN, no una opinión que haya que pedir.
  //
  // ANTES de los tres filtros, nunca después: si se juntaran al final
  // quedarían fuera del cálculo de huérfanos y perderíamos la garantía de
  // F-71 paso 1 —«sale publicado o sale contado»— justo para este grupo.
  const structuralPassthrough: DoubleCheckedDiscrepancy[] = structuralCandidates.map(d => ({
    ...d,
    confidence: 'alta',
  }));
  const doubleChecked: DoubleCheckedDiscrepancy[] = [...checked, ...structuralPassthrough];

  // Separar contradicciones confirmadas de inconsistencias menores
  const confirmedContradictions = doubleChecked.filter(d => d.confidence === 'alta');
  const minorInconsistencies = doubleChecked
    .filter(d => d.confidence === 'posible' && d.severity === 'minor_inconsistency')
    .map(aInconsistenciaMenor);

  // F-71 paso 1 [6][7]: EL RESTO. La regla que este paso hace cierta es que
  // toda candidata que entra al double-check sale publicada o contada, sin
  // tercera puerta. Se calcula por DIFERENCIA —lo que no cayó en ninguno de
  // los dos arrays— y no con un tercer filtro con su propia condición: un
  // filtro más sería otra lista de casos que acertar, y la lista es justo lo
  // que ha fallado hasta ahora. Así, una combinación nueva de
  // confidence+severity se cuenta sola en vez de evaporarse.
  // NO se publican: contarlas es visibilidad, publicarlas sería cambiar una
  // decisión, y este commit no cambia decisiones.
  //
  // Las de huella ya descartada quedan FUERA del resto, y no por comodidad:
  // «sin destino» significa "nadie decidió nada sobre esto", y sobre ellas SÍ
  // se decidió — lo hizo el usuario. Ya tienen su motivo propio
  // (exhaustivo.huella_ya_descartada); contarlas otra vez aquí las duplicaría
  // y describiría mal lo que pasó. Las de [4] y [5] sí entran: su contador
  // dice por qué se quedaron sin veredicto, no que alguien decidiera tirarlas.
  const published = new Set<typeof doubleChecked[number]>(confirmedContradictions);
  const decided = new Set<typeof doubleChecked[number]>(alreadyDismissed);

  // F-71 paso 3: EL DESACUERDO, contado con su nombre. Hasta ahora un hallazgo
  // confirmado por la llamada corta y degradado por Sonnet caía en
  // `exhaustivo.sin_destino.*`, y ese nombre miente — dice literalmente "nadie
  // decidió nada sobre esto" y aquí SÍ decidió alguien. Mismo argumento por el
  // que las de huella ya descartada salieron de ese cálculo.
  //
  // Con la frontera puesta el contador tiene un sentido limpio que antes no
  // podía tener: a Sonnet solo le llega lo confirmado por JUICIO, así que
  // cualquier resultado suyo que no salga 'alta' es exactamente eso, un juicio
  // degradado. No hace falta emparejar nada con la lista de entrada.
  //
  // OJO al leerlo: un lote que FALLÓ vuelve también como 'posible' y cuenta
  // aquí, aunque Sonnet no llegara a opinar. `exhaustivo.lote_sin_veredicto` es
  // el desambiguador — si los dos números coinciden, no hubo desacuerdo real,
  // hubo avería.
  const degradedByDoubleCheck = checked.filter(d => d.confidence !== 'alta' && !decided.has(d));
  for (const d of degradedByDoubleCheck) {
    bumpCount(exhaustiveCounts, 'exhaustivo.juicio_degradado_por_sonnet');
    console.log(`[pipeline-exhaustive] · juicio degradado por Sonnet: "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
  }
  const degraded = new Set<typeof doubleChecked[number]>(degradedByDoubleCheck);

  const orphans = doubleChecked.filter(
    d => !published.has(d)
      && !decided.has(d)
      && !degraded.has(d)
      && !(d.confidence === 'posible' && d.severity === 'minor_inconsistency'),
  );
  if (orphans.length > 0) {
    console.warn(`[pipeline-exhaustive] ${orphans.length} hallazgo(s) SIN DESTINO: nadie los publicó y nadie decidió tirarlos`);
    for (const d of orphans) {
      bumpCount(exhaustiveCounts, `exhaustivo.sin_destino.${d.confidence}_${d.severity ?? 'sin_severidad'}`);
      console.warn(`[pipeline-exhaustive] · sin destino (${d.confidence}/${d.severity ?? 'sin severidad'}): "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
    }
  }

  let recommendation = pipelineResult.recommendation;
  if (recommendation === 'INDEXAR' && (confirmedContradictions.length > 0 || minorInconsistencies.length > 0)) {
    recommendation = 'REVISAR';
  }

  const totalTime = Date.now() - t0;
  console.log(`[pipeline-exhaustive] Completo en ${totalTime}ms — ${styleProblems.length} problemas de estilo, ${confirmedContradictions.length} contradicciones, ${minorInconsistencies.length} inconsistencias menores`);

  const n = confirmedContradictions.length;
  const estimatedCost: 'light' | 'medium' | 'heavy' =
    candidatesOverLimit !== undefined || n > 30 ? 'heavy'
    : n >= 10 ? 'medium'
    : 'light';

  console.log(`[pipeline-exhaustive] estimatedCost: ${estimatedCost} (${n} contradicciones, candidatesOverLimit=${candidatesOverLimit ?? 'no'})`);

  // F-71: SEGUNDA aplicación, y hace falta. synthesize ya marcó lo que había
  // caído hasta él, pero el estilo, la rama atómica y el double-check corren
  // DESPUÉS: sus caídas no existían cuando synthesize miró. markIncompleteAnalysis
  // recalcula desde la lista completa, así que llamarla dos veces no acumula.
  // F-71 paso 1: los contadores del tramo exclusivo se FUNDEN con los del
  // núcleo (que synthesize ya dejó en pipelineResult.discardedFindings), no lo
  // sustituyen. Mismo criterio de fusión que judge.ts:546 y pipeline.ts:385.
  const mergedDiscardedFindings: DiscardedFindings = { ...(pipelineResult.discardedFindings ?? {}) };
  for (const [key, count] of Object.entries(exhaustiveCounts)) {
    mergedDiscardedFindings[key] = (mergedDiscardedFindings[key] ?? 0) + count;
  }

  return markIncompleteAnalysis({
    ...pipelineResult,
    discrepancies: confirmedContradictions,
    ...(minorInconsistencies.length > 0 && { minorInconsistencies }),
    recommendation,
    analysisMode: 'exhaustive',
    styleProblems,
    estimatedCost,
    ...(candidatesOverLimit !== undefined && { candidatesOverLimit }),
    ...(Object.keys(mergedDiscardedFindings).length > 0 ? { discardedFindings: mergedDiscardedFindings } : {}),
  }, stageFailureContext.getStore() ?? []);
}

// ============================================================
// Helpers
// ============================================================

interface Discrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  /** F-86 paso 0: mismo motivo que todos los de abajo. El runtime ya lo trae
   *  (synthesize lo pone y mergeContradictions conserva el objeto entero), pero
   *  este tipo local lo borraría al entrar al double-check, que SÍ reconstruye.
   *  Cuarto campo que pasa por esta puerta después de los de F-69, F-70 y F-71:
   *  el listado de abajo es el historial de todo lo que casi muere aquí. */
  existingDocumentId?: string;
  severity?: 'contradiction' | 'minor_inconsistency';
  /** F-71 paso 3: mismo motivo que los de abajo — el runtime ya lo traía
   *  (viene de FinalAnalysis['discrepancies'], que sí lo declara), pero este
   *  tipo local lo borraba. Sin declararlo aquí, la frontera del double-check
   *  no puede preguntar por él. */
  confirmedBy?: ConfirmedBy;
  /** F-69: mergeContradictions conserva el objeto entero (spread + push), así
   *  que en tiempo de ejecución el campo ya pasaba; declararlo evita que el
   *  tipo lo borre al entrar en el double-check, que sí reconstruye. */
  columns?: string[];
  /** F-70: mismo motivo que columns — el runtime ya los conserva, el tipo los
   *  declara para que no desaparezcan del contrato al pasar por aquí. */
  comparedValues?: ComparedValue[];
  newDocRow?: string;
  existingDocRow?: string;
}

/**
 * ÚLTIMO ESLABÓN DE LAS INCONSISTENCIAS MENORES (F-86 paso 0), con nombre para
 * poder probarlo.
 *
 * ESTA ES LA PUERTA QUE MÁS CAMPOS HA MATADO. Era un destructuring de lista
 * CERRADA —`.map(({ topic, newDocSays, existingDocSays, existingDocument }) =>
 * ({ topic, newDocSays, existingDocSays, existingDocument }))`— y un campo que
 * no se nombrara ahí moría sin ruido y sin error de tipos, porque el tipo de
 * destino también lo tenía todo opcional. F-69, F-70 y F-71 pasaron por aquí.
 *
 * SIGUE SIENDO UNA LISTA CERRADA, y a propósito: `minorInconsistencies` publica
 * MENOS que `discrepancies` (no lleva confirmedBy, ni columns, ni las filas) y
 * un spread lo cambiaría. Lo que cambia es que ahora la lista tiene nombre, un
 * tipo de retorno explícito y una batería que la vigila.
 */
export function aInconsistenciaMenor(
  d: DoubleCheckedDiscrepancy,
): NonNullable<FinalAnalysis['minorInconsistencies']>[number] {
  return {
    topic: d.topic,
    newDocSays: d.newDocSays,
    existingDocSays: d.existingDocSays,
    existingDocument: d.existingDocument,
    ...(d.existingDocumentId !== undefined ? { existingDocumentId: d.existingDocumentId } : {}),
  };
}

/** Exportada SOLO para que la batería pueda recorrer la cadena entera (F-86
 *  paso 0). No la llama nadie más: es un helper del pipeline. */
export function mergeContradictions(
  listA: Discrepancy[],
  listB: Discrepancy[],
  counts?: DiscardedFindings,
): Discrepancy[] {
  const result = [...listA];
  const existingKeys = new Set(listA.map(d => makeContradictionKey(d)));

  for (const d of listB) {
    const key = makeContradictionKey(d);
    if (!existingKeys.has(key)) {
      result.push(d);
      existingKeys.add(key);
    } else if (counts) {
      // F-71 paso 1 [8]: la clave usa solo los 50 primeros caracteres de la
      // cita, así que dos hallazgos distintos pueden colapsar en uno. La
      // decisión no cambia —se sigue quedando el primero— pero deja de ser
      // muda: hasta ahora un hallazgo atómico podía desaparecer aquí sin log.
      bumpCount(counts, 'exhaustivo.duplicada_por_clave');
      console.log(`[pipeline-exhaustive] · duplicada por clave: "${d.topic.slice(0, 60)}" contra "${d.existingDocument}"`);
    }
  }

  return result;
}

function makeContradictionKey(d: Discrepancy): string {
  const normTopic = d.topic.toLowerCase().replace(/\s+/g, ' ').trim();
  const normDoc = d.existingDocument.toLowerCase().trim();
  const normClaim = d.newDocSays.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 50);
  return `${normDoc}|${normTopic}|${normClaim}`;
}
