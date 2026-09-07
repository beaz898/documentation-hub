import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { checkUploadLock } from '@/lib/upload-lock';
import { EXTRACTOR_VERSION } from '@/lib/chunking';
import { estadoDeReparacion } from '@/lib/documents/estado-de-reparacion';
import { repararDocumento } from '@/lib/documents/reparar';
import { tieneSegmentosPersistidos } from '@/lib/documents/lectura-dual';
import {
  LIMITE_POR_LLAMADA, PRESUPUESTO_PARA_EMPEZAR_MS, EXAMINADOS_MAXIMO,
  decidirContinuacion, cuboDe, gastaPlaza, motivoDeBloqueo, restantesDelLote,
} from '@/lib/documents/lote';
import type { MotivoDeParada } from '@/lib/documents/lote';

/**
 * POST /api/admin/reindexar-lote — REPARAR DE N EN N, RELANZABLE (07/09/2026).
 *
 * Body: { limite? } — como mucho `LIMITE_POR_LLAMADA`.
 *
 * ⚠️ LO QUE ESTO **NO** ES, y conviene que esté arriba: **no es una cola**. No
 * hay estado de fondo, ni trabajo diferido, ni nada que siga corriendo cuando la
 * respuesta llega. Es un bucle síncrono sobre la reparación de siempre, con dos
 * límites y sus contadores, que se vuelve a pulsar hasta que `hay_mas` sea
 * falso. La cola es otro frente y está fuera del MVP.
 *
 * ⚠️ Y NO ES UN MECANISMO NUEVO: llama a `repararDocumento`, la misma función que
 * usa la ruta de uno. Si el lote y la ruta individual pudieran reparar distinto,
 * habría dos implementaciones del mismo criterio — que es de lo que esta casa se
 * defiende en cada fichero.
 *
 * ⚠️ UN DOCUMENTO MALO NO PARA A LOS DEMÁS, que es el requisito explícito. Y no
 * se resuelve con un `try` alrededor del bucle: se resuelve porque
 * `repararDocumento` **no lanza** — su red cubre desde la primera lectura y todo
 * final cabe en el tipo de retorno. El fallo se clasifica, se cuenta, y el bucle
 * sigue. Al final se declaran todos.
 *
 * ⚠️ EL CERROJO SE MIRA UNA VEZ, al principio, y va declarado: si alguien empieza
 * a subir documentos a mitad del lote, el lote termina lo que tenía empezado.
 * Comprobarlo por documento sería más correcto y haría que una subida ajena
 * dejara el lote a medias sin decir por qué; así, al menos, lo que se hizo está
 * dicho entero. La siguiente llamada sí encuentra el cerrojo y se rechaza limpia.
 */

export const maxDuration = 300;

/** Techo de la lectura de candidatos. Con denominador, como manda la casa. */
const MAX_FILAS = 1000;

interface Linea {
  id: string;
  nombre: string;
  motivo?: string;
  detalle?: string;
  trozos?: { antes: number; ahora: number };
  ms?: number;
}

export async function POST(req: NextRequest) {
  const arrancado = Date.now();

  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden reindexar.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const pedido: unknown = body?.limite;
  // El límite se puede bajar, nunca subir: el techo es del servidor.
  const limite = typeof pedido === 'number' && Number.isFinite(pedido)
    ? Math.max(1, Math.min(LIMITE_POR_LLAMADA, Math.floor(pedido)))
    : LIMITE_POR_LLAMADA;

  const lock = await checkUploadLock(supabase, org.orgId, user.id);
  if (lock.locked) {
    return NextResponse.json({
      error: `${lock.lockedByEmail ?? 'Otro usuario'} está subiendo documentos ahora mismo.`,
    }, { status: 423 });
  }

  // ── los candidatos ────────────────────────────────────────────────────────
  // ⚠️ SE LE PREGUNTA AL LECTOR, no se recalcula: quién está al día lo decide
  // `estadoDeReparacion` y este fichero no va a ser el segundo sitio que lo sepa.
  const { data, error, count } = await supabase
    .from('documents')
    // `segments` viaja porque desde B.195 decide la vía. Ver la nota de coste en
    // `estado-del-corpus`, que hace esta misma lectura.
    .select('id, name, source, provider_file_id, extractor_version, segments', { count: 'exact' })
    .eq('org_id', org.orgId)
    .order('name')
    .range(0, MAX_FILAS - 1);

  if (error) {
    console.error('[reindexar-lote] error leyendo documents:', error.message);
    return NextResponse.json({ error: 'No se pudo leer el corpus.' }, { status: 500 });
  }

  const filas = data ?? [];
  const candidatos = filas.filter(d => estadoDeReparacion({
    extractorVersion: d.extractor_version,
    source: d.source,
    providerFileId: d.provider_file_id,
    tieneSegmentos: tieneSegmentosPersistidos(d),
  }, EXTRACTOR_VERSION).estado !== 'al_dia');

  // ── el bucle ──────────────────────────────────────────────────────────────
  const reparados: Linea[] = [];
  const bloqueados: Linea[] = [];
  const fallidos: Linea[] = [];
  let examinados = 0;
  let intentos = 0;
  let parada: MotivoDeParada = 'corpus';

  for (const doc of candidatos) {
    const decision = decidirContinuacion(
      { intentos, examinados, transcurridoMs: Date.now() - arrancado },
      { limite, presupuestoMs: PRESUPUESTO_PARA_EMPEZAR_MS, maximoExaminados: EXAMINADOS_MAXIMO },
    );
    if (!decision.seguir) { parada = decision.motivo; break; }

    examinados += 1;
    const resultado = await repararDocumento(supabase, { orgId: org.orgId, documentId: doc.id });
    if (gastaPlaza(resultado)) intentos += 1;

    const linea: Linea = { id: doc.id, nombre: doc.name };
    const cubo = cuboDe(resultado);

    if (resultado.ok) {
      reparados.push({ ...linea, trozos: resultado.trozos, ms: resultado.ms });
    } else if (cubo === 'bloqueado') {
      bloqueados.push({ ...linea, motivo: motivoDeBloqueo(resultado) });
    } else if (resultado.clase === 'fallo') {
      fallidos.push({ ...linea, motivo: resultado.motivo, detalle: resultado.detalle, ms: resultado.ms });
    }
  }

  const restantes = restantesDelLote({
    candidatos: candidatos.length,
    reparados: reparados.length,
    fallidos: fallidos.length,
    bloqueados: bloqueados.length,
  });

  const totalMs = Date.now() - arrancado;
  console.log(
    `[reindexar-lote] org=${org.orgId} | candidatos=${candidatos.length} | examinados=${examinados} | ` +
    `reparados=${reparados.length} bloqueados=${bloqueados.length} fallidos=${fallidos.length} | ` +
    `parada=${parada} | ${totalMs} ms`,
  );

  return NextResponse.json({
    // ⚠️ LAS TRES LISTAS SIEMPRE, aunque vengan vacías: una lista que desaparece
    // cuando vale cero es indistinguible de una que nadie calculó.
    reparados,
    bloqueados,
    fallidos,
    // El denominador va con la cifra, y por partida doble: cuántos candidatos
    // había en el corpus y cuántos se llegó a mirar en esta llamada.
    candidatos: candidatos.length,
    examinados,
    documentos_en_la_organizacion: count ?? filas.length,
    truncado: (count ?? filas.length) > filas.length,
    // Por qué se paró. Es el contador de los dos límites declarados: si empieza
    // a salir 'tiempo', el margen se ha quedado corto.
    parada,
    limite,
    ms: totalMs,
    para_reintentar: restantes.paraReintentar,
    sin_examinar: restantes.sinExaminar,
    bloqueados_totales: restantes.bloqueados,
    // ⚠️ UNA SOLA CLAVE PARA «¿VUELVO A PULSAR?». Dos formas del mismo dato en la
    // misma respuesta es la manera de que un cliente lea la que se quede vieja.
    hay_mas: restantes.hayMas,
    veredicto: restantes.hayMas
      ? `Reparados ${reparados.length}. Quedan ${restantes.paraReintentar} por reintentar y ` +
        `${restantes.sinExaminar} sin examinar: vuelve a pulsar. ` +
        `(${restantes.bloqueados} bloqueados NO se arreglan pulsando.)`
      : `No queda nada que intentar. ${restantes.bloqueados} bloqueados necesitan otra vía.`,
  });
}
