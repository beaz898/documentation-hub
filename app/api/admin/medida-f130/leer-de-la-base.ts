import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { getDocumentChunks } from '@/lib/read-chunks';
import { estaCaducada, CADUCA_EL, TROZOS, type ClaveDeTrozo } from './medida-f130';

/**
 * Lo común a las tres rutas temporales de F-130: la caducidad, el administrador y la lectura de los trozos de la base.
 * Temporal como toda la carpeta (cabecera de `medida-f130.ts`).
 */

type Supabase = ReturnType<typeof createServiceClient>;

/** Caducada → 410 sin tocar nada; sin sesión → 401; sin organización → la respuesta de siempre; no admin → 403. */
export async function autorizar(req: NextRequest): Promise<{ ok: true; supabase: Supabase; orgId: string } | { ok: false; respuesta: NextResponse }> {
  if (estaCaducada(new Date())) {
    return { ok: false, respuesta: NextResponse.json({ error: `Herramienta temporal de F-130, caducada el ${CADUCA_EL}: hay que borrarla.` }, { status: 410 }) };
  }
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return { ok: false, respuesta: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  const supabase = createServiceClient();
  const orgR = await resolverOrg(supabase, user.id);
  if (!orgR.resuelta) return { ok: false, respuesta: respuestaDeOrgNoResuelta(orgR) };
  if (orgR.org.role !== 'admin') {
    return { ok: false, respuesta: NextResponse.json({ error: 'Solo los administradores pueden usar esta herramienta.' }, { status: 403 }) };
  }
  return { ok: true, supabase, orgId: orgR.org.orgId };
}

export interface TrozoLeido {
  clave: ClaveDeTrozo;
  documentId: string;
  nombre: string;
  generacion: number;
  chunkIndex: number;
  texto: string;
}

/**
 * Un documento por su CÓDIGO (el nombre empieza por él), y tiene que ser UNO. Con cero o con dos no se mide nada: se
 * dice. ⚠️ Es el criterio de `resolverDocumento` de `app/api/admin/examen/route.ts`, copiado a propósito y no
 * importado: un fichero de ruta de Next no puede exportar funciones sueltas, y moverlo tocaría el examen por una
 * herramienta que se borra en dos semanas. Muere con esta carpeta.
 */
async function documentoPorCodigo(supabase: Supabase, orgId: string, codigo: string):
  Promise<{ ok: true; id: string; nombre: string; generacion: number } | { ok: false; error: string }> {
  const { data, error } = await supabase.from('documents').select('id, name, active_generation').eq('org_id', orgId).like('name', `${codigo}%`);
  if (error) return { ok: false, error: `consulta fallida para ${codigo}: ${error.message}` };
  const filas = (data ?? []) as Array<{ id: string; name: string; active_generation: number | null }>;
  if (filas.length !== 1) return { ok: false, error: `${codigo} resuelve a ${filas.length} documentos (${filas.map(f => f.name).join(', ') || 'ninguno'}): tiene que ser uno` };
  return { ok: true, id: filas[0].id, nombre: filas[0].name, generacion: filas[0].active_generation ?? 1 };
}

/**
 * Los trozos pedidos, de la generación activa. Cada uno tiene que existir Y contener su frase: si no, el número de
 * trozo no es el que creemos (la advertencia del troceador) y se devuelve el error en vez de medir otra cosa. Una
 * lectura vacía es un error, no «no hay trozos»: `getDocumentChunks` devuelve [] también cuando la consulta falla.
 */
export async function leerTrozos(supabase: Supabase, orgId: string, claves: ClaveDeTrozo[]):
  Promise<{ ok: true; trozos: Record<string, TrozoLeido> } | { ok: false; error: string }> {
  const trozos: Record<string, TrozoLeido> = {};
  for (const clave of claves) {
    const pedido = TROZOS[clave];
    const doc = await documentoPorCodigo(supabase, orgId, pedido.codigo);
    if (!doc.ok) return { ok: false, error: doc.error };
    const todos = await getDocumentChunks(supabase, { orgId, documentId: doc.id, generation: doc.generacion });
    if (todos.length === 0) return { ok: false, error: `${pedido.codigo}: la lectura de sus trozos vino vacía (o falló)` };
    const t = todos.find(c => c.chunkIndex === pedido.trozo);
    if (!t) return { ok: false, error: `${pedido.codigo}: no tiene trozo ${pedido.trozo} (tiene ${todos.length})` };
    if (!t.text.includes(pedido.frase)) {
      return { ok: false, error: `${pedido.codigo} trozo ${pedido.trozo} NO contiene «${pedido.frase}»: el número de trozo no corresponde al texto que se quería medir` };
    }
    trozos[clave] = { clave, documentId: doc.id, nombre: doc.nombre, generacion: doc.generacion, chunkIndex: t.chunkIndex, texto: t.text };
  }
  return { ok: true, trozos };
}
