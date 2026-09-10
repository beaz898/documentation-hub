import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { secretoDeFirma } from '@/lib/analysis/secreto';
import { emitirRefDeSubida } from '@/lib/subida/referencia';

export const maxDuration = 10;

/**
 * AUTORIZA UNA SUBIDA Y DEVUELVE DÓNDE — B.204, commit 2 de cuatro.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ ESTE ENDPOINT ES EL ESTRENO DE `firma.ts`, Y ESO CAMBIA QUÉ HAY QUE MIRAR.
 *
 * `lib/analysis/firma.ts` lleva meses escrito, probado y **sin que lo importe
 * ni un endpoint** — comprobado el 10/09/2026 abriendo los consumidores, no el
 * productor. Luego `ANALYSIS_TOKEN_SECRET` **puede no haberse ejercido nunca en
 * producción**, por mucho que exista en el panel de Vercel.
 *
 * QUÉ SE COMPRUEBA LA PRIMERA VEZ QUE ESTO CORRE DE VERDAD, y se puede hacer
 * ANTES de que ningún cliente dependa de ello, porque el commit 3 todavía no ha
 * entrado y nadie llama aquí:
 *   1 · Que devuelve 200 con `ref` y `ruta`, y no un 500 de configuración.
 *       Un 500 aquí significa que el secreto existe pero no es USABLE —vacío,
 *       con espacios, demasiado corto—, que es exactamente lo que
 *       `secretoDeFirma()` distingue y por lo que lanza en vez de seguir.
 *   2 · Que la `ruta` empieza por el id del usuario que llama. De eso depende
 *       que la política del bucket —que no está en el repositorio— siga
 *       dejando subir al cliente.
 *   3 · Que la misma `ref`, devuelta a un endpoint de lectura, resuelve. Eso
 *       cierra el círculo firma→verificación con el secreto REAL, que es lo
 *       único que la suite no puede demostrar: allí el secreto es de mentira.
 *
 * ⚠️ Y LA RED DE SEGURIDAD DEL ESTRENO ES EL ORDEN DE LOS COMMITS: mientras el
 * cliente siga mandando la ruta (commit 3 pendiente), que esto falle no rompe
 * nada de lo que el usuario hace. Por eso el servidor va antes que el cliente y
 * no al revés.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * NO COBRA CRÉDITOS Y NO LLEVA LIMITADOR, y se declara en vez de callarlo: no
 * llama a ningún modelo, no escribe nada y no toca red externa — firma una
 * cadena y responde. Su único coste es la lectura de `resolveOrg`. Si algún día
 * este endpoint escribe, cuesta o llama fuera, el limitador deja de ser
 * prescindible y esta nota es donde hay que enterarse.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { fileName } = body as { fileName?: unknown };

    if (typeof fileName !== 'string' || fileName.trim().length === 0) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // ⚠️ LANZA SI EL SECRETO NO ES USABLE, y NO se atrapa para «seguir sin
    // firmar»: seguir sin firmar sería devolver una autorización que no
    // autoriza. Un despliegue mal configurado tiene que doler aquí, en un
    // endpoint que todavía no usa nadie, y no dentro de la subida de un cliente.
    const secreto = secretoDeFirma();

    const { ref, ruta } = emitirRefDeSubida(
      { userId: user.id, orgId: org.orgId },
      fileName.trim(),
      secreto,
    );

    return NextResponse.json({ success: true, ref, ruta });
  } catch (error: unknown) {
    console.error('[subidas/autorizar] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
