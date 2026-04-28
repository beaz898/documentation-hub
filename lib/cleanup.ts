import { SupabaseClient } from '@supabase/supabase-js';
import { getIndex } from '@/lib/pinecone';

/**
 * Resultado del borrado de una organización.
 */
export interface PurgeResult {
  orgId: string;
  deletedDocuments: number;
  deletedStorageFiles: number;
  deletedDriveConnections: number;
  anonymizedFeedback: number;
  anonymizedUsageLogs: number;
  deletedInvitations: number;
  deletedCreditPurchases: number;
  deletedBillingEvents: number;
  deletedMemberships: number;
  pineconeNamespaceDeleted: boolean;
  errors: string[];
}

/**
 * Borra todos los datos de una organización.
 *
 * Anonimiza usage_logs y feedback (conservando datos analíticos).
 * Borra todo lo demás: documentos, embeddings, storage, tokens, invitaciones, etc.
 * Marca la organización con purged_at.
 *
 * Diseñada para ser llamada desde:
 *  - /api/org/purge (borrado voluntario por admin)
 *  - /api/admin/purge-expired (borrado automático de gracias expiradas)
 */
export async function purgeOrganization(
  supabase: SupabaseClient,
  orgId: string
): Promise<PurgeResult> {
  const result: PurgeResult = {
    orgId,
    deletedDocuments: 0,
    deletedStorageFiles: 0,
    deletedDriveConnections: 0,
    anonymizedFeedback: 0,
    anonymizedUsageLogs: 0,
    deletedInvitations: 0,
    deletedCreditPurchases: 0,
    deletedBillingEvents: 0,
    deletedMemberships: 0,
    pineconeNamespaceDeleted: false,
    errors: [],
  };

  // Obtener los user_ids de los miembros (necesario para borrar por usuario)
  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('org_id', orgId);

  const memberIds = (memberships || []).map(m => m.user_id);

  // 1. Borrar namespace completo en Pinecone
  try {
    const index = getIndex();
    await index.namespace(orgId).deleteAll();
    result.pineconeNamespaceDeleted = true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Pinecone: ${msg}`);
  }

  // 2. Borrar archivos del bucket de Supabase Storage
  if (memberIds.length > 0) {
    for (const userId of memberIds) {
      try {
        const { data: files } = await supabase.storage
          .from('documents')
          .list(userId);

        if (files && files.length > 0) {
          const paths = files.map(f => `${userId}/${f.name}`);
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove(paths);

          if (storageError) {
            result.errors.push(`Storage (${userId}): ${storageError.message}`);
          } else {
            result.deletedStorageFiles += paths.length;
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        result.errors.push(`Storage (${userId}): ${msg}`);
      }
    }
  }

  // 3. Borrar registros de la tabla documents
  try {
    const { data: deleted } = await supabase
      .from('documents')
      .delete()
      .eq('org_id', orgId)
      .select('id');

    result.deletedDocuments = deleted?.length || 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Documents: ${msg}`);
  }

  // 4. Borrar drive_connections de todos los miembros
  if (memberIds.length > 0) {
    try {
      const { data: deleted } = await supabase
        .from('drive_connections')
        .delete()
        .in('user_id', memberIds)
        .select('id');

      result.deletedDriveConnections = deleted?.length || 0;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      result.errors.push(`Drive connections: ${msg}`);
    }
  }

  // 5. Anonimizar feedback (conservar mensaje, tipo y fecha)
  if (memberIds.length > 0) {
    try {
      const { data: updated } = await supabase
        .from('feedback')
        .update({ user_id: 'anon' })
        .in('user_id', memberIds)
        .select('id');

      result.anonymizedFeedback = updated?.length || 0;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      result.errors.push(`Feedback: ${msg}`);
    }
  }

  // 6. Anonimizar usage_logs (conservar endpoint, créditos, fecha, modelo, tokens, latencia)
  try {
    const { data: updated } = await supabase
      .from('usage_logs')
      .update({ user_id: 'anon' })
      .eq('org_id', orgId)
      .select('id');

    result.anonymizedUsageLogs = updated?.length || 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Usage logs: ${msg}`);
  }

  // 7. Borrar invitaciones
  try {
    const { data: deleted } = await supabase
      .from('invitations')
      .delete()
      .eq('org_id', orgId)
      .select('id');

    result.deletedInvitations = deleted?.length || 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Invitations: ${msg}`);
  }

  // 8. Borrar credit_purchases
  try {
    const { data: deleted } = await supabase
      .from('credit_purchases')
      .delete()
      .eq('org_id', orgId)
      .select('id');

    result.deletedCreditPurchases = deleted?.length || 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Credit purchases: ${msg}`);
  }

  // 9. Borrar billing_events
  try {
    const { data: deleted } = await supabase
      .from('billing_events')
      .delete()
      .eq('org_id', orgId)
      .select('id');

    result.deletedBillingEvents = deleted?.length || 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Billing events: ${msg}`);
  }

  // 10. Borrar memberships
  try {
    const { data: deleted } = await supabase
      .from('memberships')
      .delete()
      .eq('org_id', orgId)
      .select('id');

    result.deletedMemberships = deleted?.length || 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Memberships: ${msg}`);
  }

  // 11. Marcar la organización como purgada
  try {
    await supabase
      .from('organizations')
      .update({ purged_at: new Date().toISOString() })
      .eq('id', orgId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    result.errors.push(`Org purged_at: ${msg}`);
  }

  return result;
}
