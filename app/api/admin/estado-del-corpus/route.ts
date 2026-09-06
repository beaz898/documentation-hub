import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { EXTRACTOR_VERSION } from '@/lib/chunking';
import { estadoDeReparacion, recuentoPorEstado } from '@/lib/documents/estado-de-reparacion';
import type { FilaParaSello } from '@/lib/documents/estado-de-reparacion';

/**
 * GET /api/admin/estado-del-corpus — EL LECTOR DEL SELLO (F-104 P3).
 *
 * Solo-admin, SOLO LECTURA, no toca nada.
 *
 * ⚠️ POR QUÉ EXISTE. `documents.extractor_version` se escribía en los cuatro
 * puntos de indexación y no lo leía nadie. Mientras eso fue así, un corpus con
 * dos troceados conviviendo era **indistinguible** de uno homogéneo, y la
 * política de F-104 P2 —«ningún cliente indexa con el cortador viejo»— no se
 * podía comprobar: era una intención. Esta ruta es lo que la convierte en un
 * hecho consultable.
 *
 * ⚠️ Y LO QUE DEVUELVE NO ES «CUÁNTOS ESTÁN MAL», SINO CÓMO SE REPARA CADA UNO.
 * Son tres estados y no dos porque un documento manual no guarda su fichero:
 * repararlo es resubirlo, y eso hay que DECIRLO en vez de ofrecer un botón que
 * no funcione. Ver `lib/documents/estado-de-reparacion.ts`, donde vive el
 * criterio; aquí solo se lee la tabla y se cuenta.
 */

/** Techo de filas por consulta. Ver el bloque del denominador, más abajo. */
const MAX_FILAS = 1000;

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden usar esta herramienta.' }, { status: 403 });
  }

  // ⚠️ EL DENOMINADOR VIENE CON LA CIFRA, y no es ceremonia: sin `count` exacto,
  // un corpus mayor que el techo devolvería un recuento PARCIAL con toda la
  // pinta de ser completo — que es exactamente la forma que esta casa lleva una
  // semana cazando. Con él, «he mirado 1000 de 1500» se puede decir.
  const { data, error, count } = await supabase
    .from('documents')
    .select('id, name, source, provider_file_id, extractor_version', { count: 'exact' })
    .eq('org_id', org.orgId)
    .order('name')
    .range(0, MAX_FILAS - 1);

  if (error) {
    console.error('[admin/estado-del-corpus] error leyendo documents:', error.message);
    return NextResponse.json({ error: 'No se pudo leer el corpus.' }, { status: 500 });
  }

  const filas = data ?? [];
  const total = count ?? filas.length;
  const truncado = total > filas.length;

  const paraSello: FilaParaSello[] = filas.map(d => ({
    extractorVersion: d.extractor_version,
    source: d.source,
    providerFileId: d.provider_file_id,
  }));

  const recuento = recuentoPorEstado(paraSello, EXTRACTOR_VERSION);

  // La lista de los que NO están al día, con su vía. Es lo accionable: el
  // recuento dice cuánto, esto dice cuáles y por dónde.
  const aReparar = filas
    .map((d, i) => ({ nombre: d.name, ...estadoDeReparacion(paraSello[i], EXTRACTOR_VERSION) }))
    .filter(d => d.estado !== 'al_dia');

  return NextResponse.json({
    version_vigente: EXTRACTOR_VERSION,
    examinados: filas.length,
    total_en_la_organizacion: total,
    // ⚠️ Si esto es `true`, el recuento describe una MUESTRA y no el corpus. Se
    // devuelve como campo y no como comentario porque quien lea la cifra tiene
    // que poder saberlo sin leer este fichero.
    truncado,
    recuento,
    a_reparar: aReparar,
    veredicto: truncado
      ? `Recuento PARCIAL: ${filas.length} de ${total} documentos. No concluyas nada del resto.`
      : recuento.reparable_automaticamente === 0 && recuento.reparable_resubiendo === 0
        ? 'Todo el corpus está en la versión vigente del extractor.'
        : `${recuento.reparable_automaticamente} reparables automáticamente y ${recuento.reparable_resubiendo} que hay que resubir.`,
    // ⚠️ EL LÍMITE DEL PILOTO, DICHO AQUÍ Y NO ESCONDIDO DETRÁS DEL BOTÓN.
    // Reparar es UNA OPERACIÓN POR DOCUMENTO, disparada a mano por un admin. Con
    // el corpus del piloto es una tarde; con los doscientos documentos de un
    // cliente real son doscientas operaciones, y eso no lo resuelve esta
    // pantalla. El reprocesado en background es post-MVP (F-104 P2) y su
    // condición de entrada es el primer cliente. Se devuelve como campo para que
    // quien mire la cifra vea el coste al lado, y no lo descubra pulsando.
    operaciones_manuales_necesarias: recuento.reparable_automaticamente + recuento.reparable_resubiendo,
  });
}
