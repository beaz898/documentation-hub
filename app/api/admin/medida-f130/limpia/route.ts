import { NextRequest, NextResponse } from 'next/server';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import {
  construirPrompt, fraseQueContiene, PAREJA_DE_LA_VARIANTE_LIMPIA, TROZOS, VECES_DE_LA_VARIANTE_LIMPIA,
} from '../medida-f130';
import { CRITERIO_DEL_CUMPLIMIENTO } from '../criterio-del-cumplimiento';
import { preguntarAlJuez } from '../preguntar-al-juez';

/**
 * POST /api/admin/medida-f130/limpia — LA VARIANTE LIMPIA de F-130, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * La pregunta cerrada de E3, la misma, con cada texto reducido a la frase de D de su trozo: NOR-10·4, la del permiso;
 * CLI-12·3, la del principio. Siete veces. Las frases se cortan del texto de la base (`fraseQueContiene`); si una no
 * sale una sola vez, o lleva una marca de A, responde 409 y no llama al modelo.
 * Con `?ensayo=1` sólo devuelve las dos frases y el prompt, SIN llamar al modelo: para ver qué se va a mandar antes de
 * gastar. ⚠️ NO REABRE LA DECISIÓN DE CONSTRUIR: mide el techo de la pregunta cuando A no está. NO COBRA CRÉDITOS.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  if (!CRITERIO_DEL_CUMPLIMIENTO.ok) return NextResponse.json({ error: CRITERIO_DEL_CUMPLIMIENTO.motivo }, { status: 409 });

  const { analizado, candidato } = PAREJA_DE_LA_VARIANTE_LIMPIA;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const x = leidos.trozos[analizado], y = leidos.trozos[candidato];

  const fraseA = fraseQueContiene(x.texto, TROZOS[analizado].frase);
  if (!fraseA.ok) return NextResponse.json({ error: `${x.nombre}: ${fraseA.motivo}` }, { status: 409 });
  const fraseB = fraseQueContiene(y.texto, TROZOS[candidato].frase);
  if (!fraseB.ok) return NextResponse.json({ error: `${y.nombre}: ${fraseB.motivo}` }, { status: 409 });

  const armado = construirPrompt({ documento1: x.nombre, trozoA: x.chunkIndex, textoA: fraseA.frase, documento2: y.nombre, trozoB: y.chunkIndex, textoB: fraseB.frase }, CRITERIO_DEL_CUMPLIMIENTO.texto);
  if (!armado.ok) return NextResponse.json({ error: armado.motivo }, { status: 409 });

  const frases = {
    analizado: { documento: x.nombre, trozo: x.chunkIndex, frase: fraseA.frase },
    candidato: { documento: y.nombre, trozo: y.chunkIndex, frase: fraseB.frase },
  };
  const medida = `Variante limpia de F-130 · la pregunta cerrada de E3 sobre las dos frases de D solas, sin A delante, ${VECES_DE_LA_VARIANTE_LIMPIA} veces`;

  if (req.nextUrl.searchParams.get('ensayo') === '1') {
    return NextResponse.json({ medida, ensayo: 'sin llamar al modelo', frases, prompt: armado.prompt });
  }

  const pareja = `${x.nombre} · trozo ${x.chunkIndex} (frase) ↔ ${y.nombre} · trozo ${y.chunkIndex} (frase)`;
  const tareas = Array.from({ length: VECES_DE_LA_VARIANTE_LIMPIA }, (_, i) => ({ pareja, vez: i + 1, candidatoId: y.documentId, prompt: armado.prompt }));
  const { modelo, respuestas, registro } = await preguntarAlJuez(tareas);

  return NextResponse.json({ medida, cuando: new Date().toISOString(), modelo, frases, respuestas, registro });
}
