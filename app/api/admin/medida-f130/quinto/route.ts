import { NextRequest, NextResponse } from 'next/server';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { construirPrompt, FRASES_DEL_QUINTO, fraseQueContiene, PAREJA_DEL_QUINTO, VECES_DEL_QUINTO } from '../medida-f130';
import { CRITERIO_DEL_CUMPLIMIENTO } from '../criterio-del-cumplimiento';
import { preguntarAlJuez } from '../preguntar-al-juez';

/**
 * POST /api/admin/medida-f130/quinto — EL PASO 3 DE F-130, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * La pregunta cerrada, sin tocar, sobre la pareja del quinto (`PAREJA_DEL_QUINTO`), con los dos trozos enteros,
 * `VECES_DEL_QUINTO` veces. NO COBRA CRÉDITOS y no pasa por el limitador: el gasto queda en el registro que devuelve.
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

  const { analizado, candidato } = PAREJA_DEL_QUINTO;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const x = leidos.trozos[analizado], y = leidos.trozos[candidato];

  const armado = construirPrompt({ documento1: x.nombre, trozoA: x.chunkIndex, textoA: x.texto, documento2: y.nombre, trozoB: y.chunkIndex, textoB: y.texto }, CRITERIO_DEL_CUMPLIMIENTO.texto);
  if (!armado.ok) return NextResponse.json({ error: armado.motivo }, { status: 409 });

  const medida = `Paso 3 de F-130 · la pregunta cerrada sobre la pareja del quinto, los dos trozos enteros, ${VECES_DEL_QUINTO} veces`;

  if (req.nextUrl.searchParams.get('ensayo') === '1') {
    const cortar = (texto: string, anclas: readonly string[]) => anclas.map(ancla => {
      const r = fraseQueContiene(texto, ancla);
      return r.ok ? { ancla, frase: r.frase } : { ancla, error: r.motivo };
    });
    return NextResponse.json({
      medida,
      ensayo: 'sin llamar al modelo',
      trozos: {
        analizado: { documento: x.nombre, generacion: x.generacion, trozo: x.chunkIndex, frases: cortar(x.texto, FRASES_DEL_QUINTO.analizado), texto: x.texto },
        candidato: { documento: y.nombre, generacion: y.generacion, trozo: y.chunkIndex, frases: cortar(y.texto, FRASES_DEL_QUINTO.candidato), texto: y.texto },
      },
      prompt: armado.prompt,
    });
  }

  const pareja = `${x.nombre} · trozo ${x.chunkIndex} ↔ ${y.nombre} · trozo ${y.chunkIndex}`;
  const tareas = Array.from({ length: VECES_DEL_QUINTO }, (_, i) => ({ pareja, vez: i + 1, candidatoId: y.documentId, prompt: armado.prompt }));
  const { modelo, respuestas, registro } = await preguntarAlJuez(tareas);

  return NextResponse.json({ medida, cuando: new Date().toISOString(), modelo, respuestas, registro });
}
