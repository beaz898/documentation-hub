import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDocumentChunks } from '@/lib/read-chunks';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { FRASES_DE_D, fraseQueContiene, PAREJA_DE_D, VECES_DE_D } from '../medida-f130';
import { construirPromptD3, leerParejaEntera, resumenDelPromptD3 } from '../pareja-entera';
import { CRITERIO_DEL_CUMPLIMIENTO } from '../criterio-del-cumplimiento';
import { preguntarAlJuez } from '../preguntar-al-juez';

/**
 * POST /api/admin/medida-f130/d3 — LA D DE VERDAD CON LA PAREJA ENTERA Y LAS DOS LÍNEAS, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * Es la ruta `d2` (`../d2/route.ts`) con los dos documentos ENTEROS en vez de los dos trozos, tal como los lee el rápido del
 * producto (`../pareja-entera.ts`), y los encabezados de la plantilla cambiados en consecuencia. `d` y `d2` NO se tocan: son las
 * referencias del 06, 09 y 10/11.
 * NO COBRA CRÉDITOS y no pasa por el limitador: el gasto queda en el registro que devuelve.
 * ⚠️ DOS NEGATIVAS DURAS, las dos ANTES del ensayo y antes de llamar al modelo, con 409:
 *   · la de los trozos, la de `d`: los trozos 4 de NOR-10 y 6 de CLI-12 tienen que existir y contener su frase, y eso
 *     comprueba además que los dos documentos son los que se quieren medir;
 *   · la del régimen: si `leerLaPareja` no da `pareja_entera`, la condición no es la del producto y no se mide.
 * Con `?ensayo=1`: los dos documentos tal como los montó el producto, la lectura y el prompt RECORTADO (su huella, su longitud,
 * la cabeza, el empalme y la cola entera; `resumenDelPromptD3`), sin llamar al modelo. El prompt entero no cruza el chat.
 * Con `?sondeo=1`: UNA sola llamada, para medir latencia y tokens reales antes de decidir cuántas caben en `maxDuration`.
 */
export const maxDuration = 300;

const huella = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  if (!CRITERIO_DEL_CUMPLIMIENTO.ok) return NextResponse.json({ error: CRITERIO_DEL_CUMPLIMIENTO.motivo }, { status: 409 });

  const { analizado, candidato } = PAREJA_DE_D;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const x = leidos.trozos[analizado], y = leidos.trozos[candidato];

  // todos los trozos de cada documento, de la misma generación activa que acaba de leer `leerTrozos`
  const trozosX = await getDocumentChunks(a.supabase, { orgId: a.orgId, documentId: x.documentId, generation: x.generacion });
  const trozosY = await getDocumentChunks(a.supabase, { orgId: a.orgId, documentId: y.documentId, generation: y.generacion });
  const pareja = leerParejaEntera({ analizado: { nombre: x.nombre, trozos: trozosX }, candidato: { documentId: y.documentId, nombre: y.nombre, trozos: trozosY } });
  if (!pareja.ok) return NextResponse.json({ error: pareja.motivo, regimen: pareja.regimen }, { status: 409 });

  const armado = construirPromptD3({ documento1: x.nombre, textoA: pareja.textoAnalizado, documento2: y.nombre, textoB: pareja.bloqueCandidato }, CRITERIO_DEL_CUMPLIMIENTO.texto);
  if (!armado.ok) return NextResponse.json({ error: armado.motivo }, { status: 409 });
  const huellaDelPrompt = huella(armado.prompt);

  const medida = `F-130 · la pregunta cerrada CON LAS DOS LÍNEAS DE HALLAZGO sobre la pareja de D de la siembra (§2.4 ↔ §3.5), los dos DOCUMENTOS ENTEROS (pareja_entera), ${VECES_DE_D} veces`;
  const documentos = {
    analizado: { documento: x.nombre, generacion: x.generacion, trozos: trozosX.length, caracteres: pareja.textoAnalizado.length },
    candidato: { documento: y.nombre, generacion: y.generacion, trozos: trozosY.length, caracteres: pareja.bloqueCandidato.length },
  };

  if (req.nextUrl.searchParams.get('ensayo') === '1') {
    const cortar = (texto: string, anclas: readonly string[]) => anclas.map(ancla => {
      const r = fraseQueContiene(texto, ancla);
      return r.ok ? { ancla, frase: r.frase } : { ancla, error: r.motivo };
    });
    return NextResponse.json({
      medida,
      ensayo: 'sin llamar al modelo',
      documentos,
      lectura: pareja.lectura,
      frasesDeD: { analizado: cortar(pareja.textoAnalizado, FRASES_DE_D.analizado), candidato: cortar(pareja.bloqueCandidato, FRASES_DE_D.candidato) },
      // el prompt NO va entero (unos 127.000 caracteres): su huella, su longitud y los tres cortes que se revisan
      prompt: resumenDelPromptD3(armado.prompt, pareja.textoAnalizado, pareja.bloqueCandidato, huellaDelPrompt),
    });
  }

  const sondeo = req.nextUrl.searchParams.get('sondeo') === '1';
  const nombre = `${x.nombre} (documento completo) ↔ ${y.nombre} (documento completo)`;
  const tareas = Array.from({ length: sondeo ? 1 : VECES_DE_D }, (_, i) => ({ pareja: nombre, vez: i + 1, candidatoId: y.documentId, prompt: armado.prompt }));
  const { modelo, respuestas, registro } = await preguntarAlJuez(tareas);

  return NextResponse.json({ medida: sondeo ? `${medida} · SONDEO DE UNA LLAMADA` : medida, cuando: new Date().toISOString(), huellaDelPrompt, documentos, lectura: pareja.lectura, modelo, respuestas, registro });
}
