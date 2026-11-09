import { NextRequest, NextResponse } from 'next/server';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { FRASES_DE_D, fraseQueContiene, PAREJA_DE_D, VECES_DE_D } from '../medida-f130';
import { construirPromptConLineas } from '../lineas-de-hallazgo';
import { CRITERIO_DEL_CUMPLIMIENTO } from '../criterio-del-cumplimiento';
import { preguntarAlJuez } from '../preguntar-al-juez';

/**
 * POST /api/admin/medida-f130/d2 — LA D DE VERDAD CON LAS DOS LÍNEAS DE HALLAZGO, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * Es la ruta `d` (`../d/route.ts`) con UNA sola diferencia: el prompt lleva al final las dos líneas de hallazgo
 * (`../lineas-de-hallazgo.ts`). La ruta `d` NO se toca: es la referencia de las tandas del 06/11 y el 09/11.
 *
 * La pregunta cerrada, sin tocar, sobre la pareja de D de la siembra (`PAREJA_DE_D`, §2.4 ↔ §3.5), con los dos trozos
 * enteros, `VECES_DE_D` veces. Es la ruta del quinto (`../quinto/route.ts`) con la otra pareja: lo demás, igual a propósito.
 * NO COBRA CRÉDITOS y no pasa por el limitador: el gasto queda en el registro que devuelve.
 * ⚠️ LA NEGATIVA DURA: si un trozo no existe o no contiene su frase (`trozoConSuFrase`, dentro de `leerTrozos`), responde
 * 409 y NO LLAMA AL MODELO. Lo vigila una prueba sobre el texto de esta ruta (`medida-f130.test.ts`).
 * Con `?ensayo=1`: los dos trozos tal como están guardados, con su número real, las frases cortadas y el prompt, SIN
 * llamar al modelo. Es el primer paso, antes de la tanda.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  if (!CRITERIO_DEL_CUMPLIMIENTO.ok) return NextResponse.json({ error: CRITERIO_DEL_CUMPLIMIENTO.motivo }, { status: 409 });

  const { analizado, candidato } = PAREJA_DE_D;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const x = leidos.trozos[analizado], y = leidos.trozos[candidato];

  const armado = construirPromptConLineas({ documento1: x.nombre, trozoA: x.chunkIndex, textoA: x.texto, documento2: y.nombre, trozoB: y.chunkIndex, textoB: y.texto }, CRITERIO_DEL_CUMPLIMIENTO.texto);
  if (!armado.ok) return NextResponse.json({ error: armado.motivo }, { status: 409 });

  const medida = `F-130 · la pregunta cerrada CON LAS DOS LÍNEAS DE HALLAZGO sobre la pareja de D de la siembra (§2.4 ↔ §3.5), los dos trozos enteros, ${VECES_DE_D} veces`;

  if (req.nextUrl.searchParams.get('ensayo') === '1') {
    const cortar = (texto: string, anclas: readonly string[]) => anclas.map(ancla => {
      const r = fraseQueContiene(texto, ancla);
      return r.ok ? { ancla, frase: r.frase } : { ancla, error: r.motivo };
    });
    return NextResponse.json({
      medida,
      ensayo: 'sin llamar al modelo',
      trozos: {
        analizado: { documento: x.nombre, generacion: x.generacion, trozo: x.chunkIndex, frases: cortar(x.texto, FRASES_DE_D.analizado), texto: x.texto },
        candidato: { documento: y.nombre, generacion: y.generacion, trozo: y.chunkIndex, frases: cortar(y.texto, FRASES_DE_D.candidato), texto: y.texto },
      },
      prompt: armado.prompt,
    });
  }

  const pareja = `${x.nombre} · trozo ${x.chunkIndex} ↔ ${y.nombre} · trozo ${y.chunkIndex}`;
  const tareas = Array.from({ length: VECES_DE_D }, (_, i) => ({ pareja, vez: i + 1, candidatoId: y.documentId, prompt: armado.prompt }));
  const { modelo, respuestas, registro } = await preguntarAlJuez(tareas);

  return NextResponse.json({ medida, cuando: new Date().toISOString(), modelo, respuestas, registro });
}
