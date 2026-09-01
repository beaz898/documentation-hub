import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { huellaSolicitada, registrarDescartes, borrarDescarte } from '@/lib/analysis/descartes';

/**
 * POST /api/findings/dismiss — LA ENTRADA DIRECTA (F-86 paso 3, F-87 P2).
 *
 * Para los caminos que YA tienen id del documento en revisión: la bandeja y el
 * modal de mejora abierto desde ella. El descarte se registra en el momento en
 * que el usuario pulsa «No es error».
 *
 * El otro camino —la subida desde el chat, que es el más usado— no tiene id
 * hasta indexar, y por eso su descarte entra por `/api/index-text`. Durante la
 * revisión sus descartes son estado de la pantalla, legítimamente y sin fingir
 * persistencia.
 *
 * EL CLIENTE MANDA COORDENADAS, NO HUELLAS. La huella la calcula el servidor
 * (F-86). Si el cliente pudiera mandarla ya hecha, podría fabricar descartes
 * para hallazgos que nunca ha visto.
 *
 * Body: { documentId, existingDocumentId, newDocSays, existingDocSays, dismissed }
 *   `dismissed: false` DESHACE el descarte. El usuario puede cambiar de
 *   opinión, y si desmarcar no borrase, el sistema le ocultaría el hallazgo
 *   para siempre — el fallo de F-67 con el signo cambiado.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { documentId, tipo, huella: huellaTabular, existingDocumentId, newDocSays, existingDocSays, dismissed } = body;

    if (typeof documentId !== 'string' || documentId.length === 0) {
      return NextResponse.json(
        { error: 'documentId requerido: esta entrada es solo para documentos ya indexados.' },
        { status: 400 },
      );
    }

    // EL DOCUMENTO TIENE QUE SER DE LA ORGANIZACIÓN. Sin esta comprobación, un
    // usuario podría sembrar descartes contra el id de otra org: la huella se
    // construye con los dos ids, así que el id ajeno entraría en la identidad.
    const { data: doc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('org_id', org.orgId)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // ── UNA SOLA IDENTIDAD, DECIDIDA EN UN SOLO SITIO (F-94, ficha B) ──
    //
    // La bifurcación por tipo vive en `huellaSolicitada` y no aquí: dentro de
    // una ruta de API no hay nada que la vigile, y una mitad podría entrar sin
    // prueba. Allí está el porqué de cada rama y por qué el tipo decide en vez
    // de intentar detectar «texto de fila».
    //
    // LO QUE ESTO CIERRA: hasta hoy este endpoint solo sabía de prosa, así que
    // un hallazgo TABULAR que entrara por aquí habría quedado registrado con
    // una identidad de texto — frágil ante un cambio de cualquier columna y
    // ante una reordenación de filas. No llegó a pasar: `mostrarAccionesDeFila`
    // no pintaba el botón para lo tabular (F-88 P2), así que NO HAY NI UN
    // DESCARTE TABULAR REGISTRADO y no hubo nada que migrar. Aquella cláusula
    // pagó, y por eso el corte con fecha que F-94 P1 concedía no hizo falta.
    const solicitada = huellaSolicitada({
      tipo,
      huella: huellaTabular,
      documentoEnRevision: documentId,
      existingDocumentId,
      newDocSays,
      existingDocSays,
    });

    if (!solicitada.ok) {
      return NextResponse.json({ error: solicitada.error }, { status: 400 });
    }
    const huella = solicitada.huella;

    if (dismissed === false) {
      const res = await borrarDescarte(supabase, { orgId: org.orgId, huella });
      if (!res.ok) return NextResponse.json({ error: 'No se pudo deshacer el descarte' }, { status: 500 });
      return NextResponse.json({ success: true, dismissed: false });
    }

    const res = await registrarDescartes(supabase, {
      orgId: org.orgId,
      userId: user.id,
      huellas: [huella],
    });
    if (!res.ok) return NextResponse.json({ error: 'No se pudo registrar el descarte' }, { status: 500 });

    return NextResponse.json({ success: true, dismissed: true });
  } catch (error: unknown) {
    console.error('[findings/dismiss]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
