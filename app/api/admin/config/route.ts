import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { estadoDelSecreto, NOMBRE_DEL_SECRETO } from '@/lib/analysis/secreto';

/**
 * GET /api/admin/config — ¿llegó la configuración al runtime?
 *
 * Solo-admin, SOLO LECTURA, no toca nada.
 *
 * ⚠️ POR QUÉ EXISTE, y es una pregunta que el panel de Vercel NO contesta: el
 * panel dice que una variable EXISTE, no que sea correcta ni que el despliegue
 * en curso la haya recogido. Una variable solo entra en vigor en despliegues
 * creados DESPUÉS de guardarla, y su valor nunca se enseña. Sin una ruta que la
 * lea, «está puesta» y «está bien puesta» son indistinguibles — y el síntoma de
 * la segunda aparecería mucho más tarde, en forma de firmas que no verifican.
 *
 * ⚠️ NO DEVUELVE NI UN CARÁCTER DE NINGÚN SECRETO. Solo presencia, longitud y si
 * es usable. Un diagnóstico que filtrara lo que diagnostica sería peor que no
 * tenerlo, y esta ruta es admin precisamente porque incluso la longitud es más
 * de lo que un usuario cualquiera debe saber.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden usar esta herramienta.' }, { status: 403 });
  }

  const firma = estadoDelSecreto(process.env[NOMBRE_DEL_SECRETO]);

  return NextResponse.json({
    entorno: process.env.VERCEL_ENV ?? 'desconocido',
    secretos: {
      [NOMBRE_DEL_SECRETO]: firma,
    },
    // Lo que hay que ver para dar el despliegue por bueno.
    veredicto: firma.usable
      ? 'La variable llegó al runtime y es usable.'
      : `La variable NO es usable (${firma.motivo}). El despliegue está mal configurado.`,
  });
}
