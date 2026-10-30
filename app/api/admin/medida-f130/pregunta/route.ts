import { NextRequest, NextResponse } from 'next/server';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { construirPrompt, PAREJAS_DE_E3, VECES_DE_E3, type ClaveDeTrozo } from '../medida-f130';
import { CRITERIO_DEL_CUMPLIMIENTO } from '../criterio-del-cumplimiento';
import { preguntarAlJuez } from '../preguntar-al-juez';

/**
 * POST /api/admin/medida-f130/pregunta — E3 de F-130, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * La pregunta cerrada del arquitecto sobre las parejas de D (`PAREJAS_DE_E3`), `VECES_DE_E3` veces cada una (veinte desde el 30/10), en la condición
 * REALISTA: los trozos enteros, con A dentro. Con la configuración EXACTA del juez (`../preguntar-al-juez.ts`). La
 * respuesta es TEXTO, tal cual: el formato pide «sí o no» y citas, no JSON, y la lectura de las respuestas no la hace
 * esta ruta. NO COBRA CRÉDITOS (arquitecto, 28/10): el gasto real queda en el registro que devuelve. Si el recorte del
 * criterio del cumplimiento no casa con el bloque del juez de hoy, responde 409 y no llama al modelo.
 * ⚠️ E3 TERMINÓ el 29/10 con la tercera tanda. Desde el 30/10 la ruta sirve a la medición de veinte por condición (la E5
 * de Fable), que es para la consulta y NO reabre la decisión de construir.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  // el criterio se comprueba ANTES de leer nada: sin él no hay nada que medir
  if (!CRITERIO_DEL_CUMPLIMIENTO.ok) return NextResponse.json({ error: CRITERIO_DEL_CUMPLIMIENTO.motivo }, { status: 409 });
  const criterio = CRITERIO_DEL_CUMPLIMIENTO.texto;

  const claves = [...new Set(PAREJAS_DE_E3.flatMap(p => [p.analizado, p.candidato]))] as ClaveDeTrozo[];
  const leidos = await leerTrozos(a.supabase, a.orgId, claves);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });

  const prompts = [];
  for (const p of PAREJAS_DE_E3) {
    const x = leidos.trozos[p.analizado], y = leidos.trozos[p.candidato];
    const armado = construirPrompt({ documento1: x.nombre, trozoA: x.chunkIndex, textoA: x.texto, documento2: y.nombre, trozoB: y.chunkIndex, textoB: y.texto }, criterio);
    if (!armado.ok) return NextResponse.json({ error: armado.motivo }, { status: 409 });
    prompts.push({ pareja: `${x.nombre} · trozo ${x.chunkIndex} ↔ ${y.nombre} · trozo ${y.chunkIndex}`, candidatoId: y.documentId, prompt: armado.prompt });
  }

  const tareas = prompts.flatMap(p => Array.from({ length: VECES_DE_E3 }, (_, i) => ({ ...p, vez: i + 1 })));
  const { modelo, respuestas, registro } = await preguntarAlJuez(tareas);

  return NextResponse.json({
    medida: `E3 · la pregunta cerrada sobre la pareja de §3.1 con A dentro (los trozos enteros), ${VECES_DE_E3} veces: la medición de veinte por condición del 30/10, para la consulta`,
    cuando: new Date().toISOString(),
    modelo,
    respuestas,
    registro,
  });
}
