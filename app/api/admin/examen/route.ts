import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { getChunksForDocuments } from '@/lib/read-chunks';

/**
 * EL ENDPOINT DEL EXAMEN — POST /api/admin/examen (25/09/2026).
 *
 * Lo llama `scripts/examen.mjs` con `{ operacion, casoId, analizado, corpusExacto }`.
 * Solo-admin y sobre la organización del usuario autenticado.
 *
 * DOS OPERACIONES, y están separadas porque una cuesta y la otra no:
 *   · `fragmentos` — LECTURA. Devuelve los fragmentos de la generación activa de
 *     los documentos del caso: los MISMOS que el análisis va a leer. Cero
 *     créditos, cero llamadas a modelo. Es lo que permite al ejecutor verificar
 *     los discriminantes y ABORTAR sin haber pagado.
 *   · `analizar` — 501 HOY. Ver el bloque de abajo: necesita una decisión que no
 *     es de este fichero.
 */

export const maxDuration = 60;

interface Cuerpo {
  operacion?: unknown;
  casoId?: unknown;
  analizado?: unknown;
  corpusExacto?: unknown;
}

function comoLista(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  if (!v.every(x => typeof x === 'string' && x.trim() !== '')) return null;
  return v as string[];
}

/**
 * Nombre del caso → fila del documento. Exacto primero; si no hay, por PREFIJO
 * DE CÓDIGO, que es el criterio de `SQL_examen_estado_de_los_documentos.sql`
 * (consulta 2): `documents.name` puede llevar o no la extensión.
 *
 * ⚠️ MÁS DE UNA COINCIDENCIA ES UN ERROR Y NO SE ELIGE NINGUNA: el caso nombra un
 * código y con dos filas no se sabe cuál mediría. Es la precondición de N6 con
 * CLI-01 duplicado, aplicada aquí en vez de confiada al que lanza.
 */
async function resolverDocumento(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string,
  nombre: string,
): Promise<{ ok: true; id: string; generacion: number; nombreEnLaBase: string } | { ok: false; error: string }> {
  const codigo = nombre.split('_')[0];
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, active_generation')
    .eq('org_id', orgId)
    .or(`name.eq.${nombre},name.like.${codigo}%`);

  if (error) return { ok: false, error: `consulta fallida para "${nombre}": ${error.message}` };

  const filas = (data ?? []) as Array<{ id: string; name: string; active_generation: number | null }>;
  const exactas = filas.filter(f => f.name === nombre);
  const candidatas = exactas.length > 0 ? exactas : filas;

  if (candidatas.length === 0) {
    return { ok: false, error: `"${nombre}" no está en esta organización (ni por nombre exacto ni por el código "${codigo}")` };
  }
  if (candidatas.length > 1) {
    return {
      ok: false,
      error: `"${nombre}" resuelve a ${candidatas.length} documentos (${candidatas.map(f => f.name).join(', ')}). ` +
             `El caso nombra un código y no se puede elegir por él: hay que dejar una sola fila.`,
    };
  }
  const fila = candidatas[0];
  return { ok: true, id: fila.id, generacion: fila.active_generation ?? 1, nombreEnLaBase: fila.name };
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const orgR = await resolverOrg(supabase, user.id);
  if (!orgR.resuelta) return respuestaDeOrgNoResuelta(orgR);
  if (orgR.org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden usar el examen.' }, { status: 403 });
  }
  const orgId = orgR.org.orgId;

  let cuerpo: Cuerpo;
  try {
    cuerpo = (await req.json()) as Cuerpo;
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 });
  }

  const { operacion, casoId, analizado } = cuerpo;
  const corpusExacto = comoLista(cuerpo.corpusExacto);
  if (typeof analizado !== 'string' || analizado.trim() === '' || !corpusExacto || corpusExacto.length === 0) {
    return NextResponse.json(
      { error: 'Se requieren `analizado` (cadena) y `corpusExacto` (lista de cadenas no vacía).' },
      { status: 400 },
    );
  }

  /**
   * ⚠️ 501 Y NO UN ANÁLISIS A MEDIAS. `analizar` necesita que el pipeline acepte
   * el corpus del caso, y hoy `retrieval.ts:260` construye su filtro DENTRO
   * (`buildCorpusFilter(batchDocumentIds)`): no hay costura por donde entre
   * `buildCorpusExacto`. Abrirla toca `retrieval.ts` y `pipeline.ts`, que son
   * camino de usuario, y eso es una decisión del arquitecto — no de este fichero.
   * Sin ella, un `analizar` mediría contra el corpus del PRODUCTO (44
   * documentos) creyendo medir contra dos, que es peor que no medir.
   */
  if (operacion === 'analizar') {
    return NextResponse.json(
      {
        error: 'La operación `analizar` no está conectada todavía.',
        motivo: 'El pipeline no acepta un corpus exacto: retrieval.ts construye su propio filtro. ' +
                'Conectarlo es una decisión pendiente del arquitecto (26/09/2026).',
        queSiFunciona: 'operacion: "fragmentos" — lectura, sin coste, y es la que permite verificar antes de pagar.',
      },
      { status: 501 },
    );
  }

  if (operacion !== 'fragmentos') {
    return NextResponse.json(
      { error: `Operación no reconocida: ${JSON.stringify(operacion)}. Son "fragmentos" o "analizar".` },
      { status: 400 },
    );
  }

  // ── fragmentos ────────────────────────────────────────────────────────────
  const nombres = [analizado, ...corpusExacto];
  const resueltos: Array<{ nombre: string; id: string; generacion: number }> = [];
  const problemas: string[] = [];

  for (const nombre of nombres) {
    const r = await resolverDocumento(supabase, orgId, nombre);
    if (r.ok) resueltos.push({ nombre, id: r.id, generacion: r.generacion });
    else problemas.push(r.error);
  }

  // ⚠️ FALLA CERRADO Y ENTERO: con un documento sin resolver, la verificación de
  // discriminantes daría SIN_FRAGMENTOS para ése y MEDIBLE para el otro, y el
  // ejecutor no distinguiría «no está indexado» de «el endpoint no lo encontró».
  if (problemas.length > 0) {
    return NextResponse.json(
      { error: 'No se pudieron resolver todos los documentos del caso.', casoId, problemas },
      { status: 404 },
    );
  }

  const porId = await getChunksForDocuments(supabase, {
    orgId,
    documents: resueltos.map(r => ({ documentId: r.id, generation: r.generacion })),
  });

  // Clave por el nombre que el CASO usa, no por el de la base: es con ése con el
  // que `verificarDiscriminantesEnFragmentos` busca en el mapa.
  const fragmentosPorDocumento: Record<string, Array<{ chunkIndex: number; text: string }>> = {};
  const sinFragmentos: string[] = [];
  for (const r of resueltos) {
    const trozos = porId.get(r.id) ?? [];
    if (trozos.length === 0) sinFragmentos.push(r.nombre);
    fragmentosPorDocumento[r.nombre] = trozos.map(c => ({ chunkIndex: c.chunkIndex, text: c.text }));
  }

  return NextResponse.json({
    casoId,
    operacion: 'fragmentos',
    orgId,
    // Se devuelve la resolución para que el crudo de la pasada guarde CONTRA QUÉ
    // documento concreto se midió, no sólo contra qué nombre.
    documentos: resueltos.map(r => ({ nombre: r.nombre, documentId: r.id, generacion: r.generacion, fragmentos: (porId.get(r.id) ?? []).length })),
    sinFragmentos,
    fragmentosPorDocumento,
  });
}
