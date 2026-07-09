import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteAllVectors } from './pinecone/vectors';

/**
 * Resultado del borrado completo de una organización.
 */
export interface PurgeResult {
  orgId: string;
  pineconeNamespaceDeleted: boolean;
  deletedStorageFiles: number;
  deletedDocuments: number;
  deletedChatQueries: number;
  deletedAnalysisResults: number;
  deletedAnalysisJobs: number;
  deletedUsageLogs: number;
  deletedFeedback: number;
  deletedCreditPurchases: number;
  anonymizedBillingEvents: number;
  deletedInvitations: number;
  deletedDriveConnections: number;
  deletedMemberships: number;
  deletedUsers: number;
  errors: string[];
}

/**
 * Borra todos los datos de una organización.
 *
 * Cada paso se ejecuta de forma independiente: si uno falla, se registra el error
 * y se continúa con el resto para no dejar el borrado a medias.
 *
 * Tablas borradas:   documents, chat_queries, analysis_results, analysis_jobs,
 *                    usage_logs, feedback, credit_purchases, invitations,
 *                    drive_connections, memberships.
 * Tabla anonimizada: billing_events (se pone org_id = null para contabilidad).
 * Tabla marcada:     organizations.purged_at = now() (nunca se borra la fila).
 * Storage:           archivos del bucket 'documents' de cada miembro.
 * Pinecone:          namespace completo del orgId.
 */
export async function purgeOrganization(
  supabase: SupabaseClient,
  orgId: string,
): Promise<PurgeResult> {
  const result: PurgeResult = {
    orgId,
    pineconeNamespaceDeleted: false,
    deletedStorageFiles: 0,
    deletedDocuments: 0,
    deletedChatQueries: 0,
    deletedAnalysisResults: 0,
    deletedAnalysisJobs: 0,
    deletedUsageLogs: 0,
    deletedFeedback: 0,
    deletedCreditPurchases: 0,
    anonymizedBillingEvents: 0,
    deletedInvitations: 0,
    deletedDriveConnections: 0,
    deletedMemberships: 0,
    deletedUsers: 0,
    errors: [],
  };

  const log = (msg: string) => console.log(`[purge-org] ${orgId}: ${msg}`);
  const fail = (step: string, e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[purge-org] ${orgId}: ${step} falló — ${msg}`);
    result.errors.push(`${step}: ${msg}`);
  };

  log('Iniciando purga');

  // Obtener user_ids de los miembros antes de borrar memberships
  // (necesario para Storage, feedback, drive_connections)
  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('org_id', orgId);
  const memberIds = (memberships || []).map(m => m.user_id as string);

  // ── 1. Pinecone: borrar namespace completo ─────────────────────────────
  try {
    await deleteAllVectors(orgId);
    result.pineconeNamespaceDeleted = true;
    log('Pinecone: namespace borrado');
  } catch (e) { fail('Pinecone', e); }

  // ── 2. Storage: borrar archivos por usuario ────────────────────────────
  for (const userId of memberIds) {
    try {
      const { data: files } = await supabase.storage.from('documents').list(userId);
      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`);
        const { error: storageErr } = await supabase.storage.from('documents').remove(paths);
        if (storageErr) throw new Error(storageErr.message);
        result.deletedStorageFiles += paths.length;
      }
    } catch (e) { fail(`Storage(${userId})`, e); }
  }
  log(`Storage: ${result.deletedStorageFiles} archivos borrados`);

  // ── 3. Documents ───────────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('documents').delete().eq('org_id', orgId).select('id');
    result.deletedDocuments = data?.length ?? 0;
    log(`Documents: ${result.deletedDocuments} borrados`);
  } catch (e) { fail('Documents', e); }

  // ── 4. Chat queries ────────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('chat_queries').delete().eq('org_id', orgId).select('id');
    result.deletedChatQueries = data?.length ?? 0;
    log(`ChatQueries: ${result.deletedChatQueries} borradas`);
  } catch (e) { fail('ChatQueries', e); }

  // ── 5. Analysis results ────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('analysis_results').delete().eq('org_id', orgId).select('id');
    result.deletedAnalysisResults = data?.length ?? 0;
    log(`AnalysisResults: ${result.deletedAnalysisResults} borrados`);
  } catch (e) { fail('AnalysisResults', e); }

  // ── 6. Analysis jobs ───────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('analysis_jobs').delete().eq('org_id', orgId).select('id');
    result.deletedAnalysisJobs = data?.length ?? 0;
    log(`AnalysisJobs: ${result.deletedAnalysisJobs} borrados`);
  } catch (e) { fail('AnalysisJobs', e); }

  // ── 7. Usage logs ──────────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('usage_logs').delete().eq('org_id', orgId).select('id');
    result.deletedUsageLogs = data?.length ?? 0;
    log(`UsageLogs: ${result.deletedUsageLogs} borrados`);
  } catch (e) { fail('UsageLogs', e); }

  // ── 8. Feedback ────────────────────────────────────────────────────────
  if (memberIds.length > 0) {
    try {
      const { data } = await supabase.from('feedback').delete().in('user_id', memberIds).select('id');
      result.deletedFeedback = data?.length ?? 0;
      log(`Feedback: ${result.deletedFeedback} borrados`);
    } catch (e) { fail('Feedback', e); }
  }

  // ── 9. Credit purchases ────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('credit_purchases').delete().eq('org_id', orgId).select('id');
    result.deletedCreditPurchases = data?.length ?? 0;
    log(`CreditPurchases: ${result.deletedCreditPurchases} borrados`);
  } catch (e) { fail('CreditPurchases', e); }

  // ── 10. Billing events: anonimizar (no borrar — necesario para contabilidad) ──
  try {
    const { data } = await supabase
      .from('billing_events')
      .update({ org_id: null })
      .eq('org_id', orgId)
      .select('id');
    result.anonymizedBillingEvents = data?.length ?? 0;
    log(`BillingEvents: ${result.anonymizedBillingEvents} anonimizados`);
  } catch (e) { fail('BillingEvents', e); }

  // ── 11. Invitations ────────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('invitations').delete().eq('org_id', orgId).select('id');
    result.deletedInvitations = data?.length ?? 0;
    log(`Invitations: ${result.deletedInvitations} borradas`);
  } catch (e) { fail('Invitations', e); }

  // ── 12. Drive connections ──────────────────────────────────────────────
  if (memberIds.length > 0) {
    try {
      const { data } = await supabase.from('drive_connections').delete().in('user_id', memberIds).select('id');
      result.deletedDriveConnections = data?.length ?? 0;
      log(`DriveConnections: ${result.deletedDriveConnections} borradas`);
    } catch (e) { fail('DriveConnections', e); }
  }

  // ── 13. Memberships ────────────────────────────────────────────────────
  try {
    const { data } = await supabase.from('memberships').delete().eq('org_id', orgId).select('id');
    result.deletedMemberships = data?.length ?? 0;
    log(`Memberships: ${result.deletedMemberships} borradas`);
  } catch (e) { fail('Memberships', e); }

  // ── 14. Supabase Auth: borrar cuentas de usuario ──────────────────────
  for (const userId of memberIds) {
    try {
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
      if (authErr) throw new Error(authErr.message);
      result.deletedUsers++;
      log(`Auth: usuario ${userId} borrado`);
    } catch (e) { fail(`Auth.deleteUser(${userId})`, e); }
  }
  log(`Auth: ${result.deletedUsers}/${memberIds.length} usuarios borrados`);

  // ── 15. Marcar organización como purgada (nunca borrar la fila) ────────
  try {
    await supabase.from('organizations').update({ purged_at: new Date().toISOString() }).eq('id', orgId);
    log('Organization: purged_at marcado');
  } catch (e) { fail('Org.purged_at', e); }

  log(`Purga completada. Errores: ${result.errors.length}`);
  return result;
}
