import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinalAnalysis } from './analysis/types';
import { propietariosDelAnalisis } from '@/lib/analysis/propietarios';

interface AnalysisResultInput {
  orgId: string;
  userId: string;
  documentName: string;
  analysis: FinalAnalysis;
  analysisType: 'quick' | 'exhaustive';
  /** F-101 — PROPIETARIO ADOPTIVO. Nulo mientras el documento no existe. */
  documentId?: string | null;
  /** F-101 — PROPIETARIO PRIMARIO: la ruta del fichero en almacenamiento. El
   *  análisis del chat pertenece al FICHERO desde que ocurre. Al menos uno de
   *  los dos, siempre — lo exige el CHECK de la base y lo comprueba antes
   *  `propietariosDelAnalisis`. */
  storagePath?: string | null;
}

interface StyleResultInput {
  orgId: string;
  userId: string;
  documentName: string;
  problemsCount: number;
  /** F-101: el propietario PRIMARIO — la ruta del fichero en almacenamiento.
   *  Presente en el camino del chat, ausente desde la bandeja. */
  storagePath?: string | null;
  /** F-100: DE QUIÉN ES ESTE ANÁLISIS. `null` = de nadie todavía (el camino del
   *  chat, donde el documento aún no existe). Lo resuelve
   *  `documentoPropietario` en la ruta, que además comprueba la pertenencia a la
   *  organización: aquí llega ya decidido. */
  documentoPropietario: string | null;
}

interface ChatQueryInput {
  orgId: string;
  userId: string;
  question: string;
  sources: Array<{ documentId: string; documentName: string; score: number; chunks: number[]; totalChunks: number }>;
  answerLength: number;
}

// Resultado de una escritura persistida con comprobacion. Ver la nota de
// convencion sobre por que analysis_results NO es fire-and-forget (F-10).
export type PersistResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveAnalysisResult(
  supabase: SupabaseClient,
  input: AnalysisResultInput,
): Promise<PersistResult> {
  const { analysis, orgId, userId, documentName, analysisType } = input;

  // F-101: los DOS propietarios, normalizados en un solo sitio. La base ya impide
  // la fila sin dueño (`analysis_results_tiene_propietario`); esto hace que el
  // fallo se vea donde se origina en vez de volver como un CHECK críptico.
  const propietarios = propietariosDelAnalisis({
    storagePath: input.storagePath,
    documentId: input.documentId,
  });
  if (!propietarios.tienePropietario) {
    const error = 'análisis sin propietario: ni ruta de fichero ni documento. No se persiste.';
    console.error(`[persist-analysis] ${error} | doc=${documentName}`);
    return { ok: false, error };
  }

  const involvedSet = new Set<string>();
  if (analysis.isDuplicate && analysis.duplicateOf) involvedSet.add(analysis.duplicateOf);
  for (const d of analysis.discrepancies) involvedSet.add(d.existingDocument);
  for (const o of analysis.overlaps) involvedSet.add(o.existingDocument);
  if (analysis.minorInconsistencies) {
    for (const d of analysis.minorInconsistencies) involvedSet.add(d.existingDocument);
  }

  const { data, error } = await supabase.from('analysis_results').insert({
    org_id: orgId,
    user_id: userId,
    document_name: documentName,
    analysis_type: analysisType,
    contradictions_found: analysis.discrepancies.length,
    contradictions_confirmed: analysis.discrepancies.filter(d => d.confirmedBy !== undefined).length,
    minor_inconsistencies_found: analysis.minorInconsistencies?.length ?? 0,
    duplicates_found: analysis.isDuplicate ? 1 : 0,
    overlaps_found: analysis.overlaps.length,
    style_problems_found: analysis.styleProblems?.length ?? 0,
    recommendation: analysis.recommendation,
    involved_documents: involvedSet.size > 0 ? [...involvedSet] : null,
    // F-101 — LOS DOS PROPIETARIOS. `storage_path` es el PRIMARIO: el análisis
    // del chat pertenece al FICHERO desde que ocurre, mucho antes de que exista
    // ningún documento. `document_id` es el ADOPTIVO y se rellena cuando el
    // documento nace. Al menos uno, siempre.
    storage_path: propietarios.storagePath,
    document_id: propietarios.documentId,
    // F-82: la octava columna izada desde `analysis`, y la unica que se iza
    // LITERAL en vez de calculada — las siete de arriba se derivan del objeto,
    // esta ya viene contada del pipeline. Va a columna propia y no solo dentro
    // del jsonb para poder agregarse entre analisis sin abrir cada `analysis`.
    // Su contrato esta en claude/Contrato_Contadores.md.
    pipeline_counters: analysis.pipelineCounters ?? null,
    analysis,
  }).select('id').single();

  if (error || !data) {
    const msg = error?.message ?? 'insert sin datos';
    console.error('[persist-analysis] saveAnalysisResult:', msg);
    return { ok: false, error: msg };
  }
  return { ok: true, id: data.id as string };
}

// Convencion de persistencia (F-10): void/fire-and-forget SOLO para telemetria
// pura (metricas, logs de uso) cuya perdida no altera lo que el usuario ve ni lo
// que el sistema decide. Todo lo que la UI lista, otra logica lee, o el usuario
// paga, se persiste con resultado comprobado (como saveAnalysisResult). La linea
// es el criterio, no la lista: saveChatQuery/saveStyleResult son telemetria hoy;
// si algun dia la UI los enseña o se facturan, cruzan la linea y se les aplica
// la misma vara.
export async function saveStyleResult(
  supabase: SupabaseClient,
  input: StyleResultInput,
): Promise<void> {
  const propietariosEstilo = propietariosDelAnalisis({
    storagePath: input.storagePath,
    documentId: input.documentoPropietario,
  });
  if (!propietariosEstilo.tienePropietario) {
    console.error(`[persist-analysis] estilo sin propietario, no se persiste | doc=${input.documentName}`);
    return;
  }

  const { error } = await supabase.from('analysis_results').insert({
    org_id: input.orgId,
    user_id: input.userId,
    document_name: input.documentName,
    analysis_type: 'style',
    contradictions_found: 0,
    contradictions_confirmed: 0,
    duplicates_found: 0,
    overlaps_found: 0,
    style_problems_found: input.problemsCount,
    recommendation: null,
    involved_documents: null,
    storage_path: propietariosEstilo.storagePath,
    // F-100: hasta el 03/09/2026 esta columna NO se escribía aquí — ni siquiera
    // estaba en el tipo de entrada—, así que TODO análisis de estilo nacía
    // huérfano, también desde la bandeja, donde el documento sí existe. No era
    // el problema de F-99 (no es que no hubiera id): es que no se pasaba.
    document_id: propietariosEstilo.documentId,
  });

  if (error) console.error('[persist-analysis] saveStyleResult:', error.message);
}

export async function saveChatQuery(
  supabase: SupabaseClient,
  input: ChatQueryInput,
): Promise<void> {
  const { error } = await supabase.from('chat_queries').insert({
    org_id: input.orgId,
    user_id: input.userId,
    question: input.question,
    documents_used: input.sources,
    answer_length: input.answerLength,
  });

  if (error) console.error('[persist-analysis] saveChatQuery:', error.message);
}
