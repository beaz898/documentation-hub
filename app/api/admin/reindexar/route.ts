import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { checkUploadLock } from '@/lib/upload-lock';
import { repararDocumento } from '@/lib/documents/reparar';
import { respuestaDeReparacion } from '@/lib/documents/respuesta-de-reparacion';

/**
 * POST /api/admin/reindexar — EL ESCRITOR (F-104, paso 1 del orden).
 *
 * Body: { documentId }
 *
 * ⚠️ POR QUÉ EXISTE, y por qué fue ANTES que el cambio del cortador: por la regla
 * de F-104 — **un cambio que altera lo que queda guardado no entra hasta que
 * exista la vía de reparación de lo ya guardado**. El arreglo del cortador era de
 * una línea, y esa línea dejaría el parque partido en dos mitades sin forma de
 * repararlo. Primero la vía, aunque sea la parte aburrida.
 *
 * ⚠️ EL TRABAJO YA NO VIVE AQUÍ: está en `lib/documents/reparar.ts` desde el
 * 07/09, porque el lote necesita llamarlo N veces. Esta ruta es hoy **la
 * traducción a HTTP y nada más**, y su contrato NO ha cambiado — mismos códigos,
 * mismos campos, mismo aviso. El bucle de consola de `Prueba_De_La_Reparacion.md`
 * §4 depende de esa forma.
 *
 * ⚠️ NO BORRA EL DOCUMENTO EN NINGÚN MOMENTO, que es el requisito de partida. La
 * generación nueva se escribe ENTERA antes de conmutar, y la vieja sigue
 * sirviendo mientras tanto. Si esto muere a medias, lo que queda es basura
 * invisible en una generación que nadie sirve; nunca un documento apagado.
 *
 * ⚠️ NO CUESTA CRÉDITOS: no hay una sola llamada a un modelo. Los embeddings
 * pasan por Pinecone Inference, que tiene su propio límite de tasa y no el
 * monedero del cliente. Y NO re-analiza: no toca `analysis_results`, ni
 * `analysis_status`, ni la bandeja. Reindexar no es opinar sobre el contenido.
 *
 * ⚠️ LÍMITE DECLARADO, con su contador: HOY SOLO IMPLEMENTA `retrocear`.
 * `reprocesar` —volver a descargar el original de un proveedor— necesita la
 * obtención y el refresco del token de Drive, que hoy vive dentro de
 * `app/api/drive/sync/route.ts`. Traérselo aquí a mano sería una SEGUNDA
 * implementación de lo mismo. Así que se responde 501 con el motivo, se cuenta,
 * y se dice.
 */

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden reindexar.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const documentId: unknown = body?.documentId;
  if (typeof documentId !== 'string' || documentId.length === 0) {
    return NextResponse.json({ error: 'Falta documentId.' }, { status: 400 });
  }

  // Mismo cerrojo que cualquier operación sobre documentos de la organización.
  const lock = await checkUploadLock(supabase, org.orgId, user.id);
  if (lock.locked) {
    return NextResponse.json({
      error: `${lock.lockedByEmail ?? 'Otro usuario'} está subiendo documentos ahora mismo.`,
    }, { status: 423 });
  }

  return respuestaDeReparacion(await repararDocumento(supabase, { orgId: org.orgId, documentId }));
}
