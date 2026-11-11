import { NextRequest, NextResponse } from 'next/server';
import { getDocumentChunks } from '@/lib/read-chunks';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { PAREJA_DE_D } from '../medida-f130';
import { fuenteDelProducto, interruptorEncendido, juzgarConElProducto, promptDeLaPareja, resumenDelPromptD4, VECES_DE_D4 } from '../producto';

/**
 * POST /api/admin/medida-f130/d4 — EL JUEZ DEL PRODUCTO SOBRE LA PAREJA DE D, CON EL PROMPT DEL PRODUCTO, TEMPORAL (cabecera de
 * `../medida-f130.ts` y de `../producto.ts`).
 *
 * El dato declarado: D tal como la escribe el juez del producto con el prompt del producto, después de la puerta y antes del
 * verificador, con la pareja entregada y con su fecha. NO es lo publicado: no pasa por el verificador, ni por R2 ni la cascada, ni
 * por la síntesis.
 * NO COBRA CRÉDITOS y no pasa por el limitador: el gasto queda en el registro que devuelve.
 * ⚠️ TRES NEGATIVAS DURAS, las tres ANTES del ensayo y antes de llamar al modelo, con 409: la de los trozos (la de `d`: los
 * trozos 4 de NOR-10 y 6 de CLI-12 existen y contienen su frase); el interruptor de la pareja entera a «1» en este despliegue; y
 * el régimen `pareja_entera`.
 * Con `?ensayo=1`: el prompt del producto RECORTADO (huella, longitud, cabeza, empalme y la cola por huella y extremos), sin modelo.
 * Con `?sondeo=1`: UNA sola llamada, para medir la latencia y los tokens reales del prompt del producto.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  const { analizado, candidato } = PAREJA_DE_D;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const x = leidos.trozos[analizado], y = leidos.trozos[candidato];

  if (!interruptorEncendido()) {
    return NextResponse.json({ error: 'el interruptor ANALYSIS_PAREJA_ENTERA no está a «1» en este despliegue: el juez leería con la tijera vieja' }, { status: 409 });
  }

  // lo que el producto le pasa al juez: los trozos de los dos documentos, el texto del analizado y la fuente del candidato
  const trozosX = await getDocumentChunks(a.supabase, { orgId: a.orgId, documentId: x.documentId, generation: x.generacion });
  const trozosY = await getDocumentChunks(a.supabase, { orgId: a.orgId, documentId: y.documentId, generation: y.generacion });
  const { data: filas, error } = await a.supabase.from('documents').select('id, source, full_text').in('id', [x.documentId, y.documentId]);
  if (error || !filas || filas.length !== 2) return NextResponse.json({ error: `no se pudieron leer los dos documentos: ${error?.message ?? 'faltan filas'}` }, { status: 409 });
  const filaX = filas.find(f => f.id === x.documentId)!, filaY = filas.find(f => f.id === y.documentId)!;
  const ladoX = { nombre: x.nombre, trozos: trozosX };
  const ladoY = { documentId: y.documentId, nombre: y.nombre, trozos: trozosY, fuente: fuenteDelProducto(filaY.source as string | null) };

  const armado = promptDeLaPareja({ analizado: ladoX, candidato: ladoY });
  if (!armado.ok) return NextResponse.json({ error: armado.motivo, regimen: armado.regimen }, { status: 409 });
  const textoDelAnalizado = typeof filaX.full_text === 'string' && filaX.full_text.trim() !== '' ? filaX.full_text : armado.textoAnalizado;

  const medida = `F-130 · el JUEZ DEL PRODUCTO, con el PROMPT DEL PRODUCTO, sobre la pareja de D de la siembra (§2.4 ↔ §3.5), los dos DOCUMENTOS ENTEROS (pareja_entera), después de la puerta y antes del verificador, ${VECES_DE_D4} veces por pulsación`;
  const documentos = {
    analizado: { documento: x.nombre, generacion: x.generacion, trozos: trozosX.length, caracteres: armado.textoAnalizado.length, textoDelAnalizado: textoDelAnalizado === armado.textoAnalizado ? 'el armado de los trozos (sin full_text)' : 'full_text' },
    candidato: { documento: y.nombre, generacion: y.generacion, trozos: trozosY.length, caracteres: armado.bloqueCandidato.length, fuente: ladoY.fuente },
  };

  if (req.nextUrl.searchParams.get('ensayo') === '1') {
    return NextResponse.json({
      medida, ensayo: 'sin llamar al modelo', documentos, lectura: armado.lectura, modelo: modeloDelJuez().modelo,
      prompt: resumenDelPromptD4(armado.prompt, armado.textoAnalizado, armado.bloqueCandidato, armado.huella),
    });
  }

  const sondeo = req.nextUrl.searchParams.get('sondeo') === '1';
  const veces = Array.from({ length: sondeo ? 1 : VECES_DE_D4 }, (_, i) => i + 1);
  const { resultado: respuestas, registro } = await conRegistroDeLlamadas(() =>
    runInBatches(veces, async vez => {
      try {
        const j = await juzgarConElProducto({ analizado: { ...ladoX, textoDelAnalizado }, candidato: ladoY });
        return { vez, ...j, mismaHuella: j.lectura.huellaDelPrompt === armado.huella };
      } catch (err) {
        return { vez, error: err instanceof Error ? err.message : String(err) };
      }
    }, { batchSize: 4 }),
  );

  return NextResponse.json({ medida: sondeo ? `${medida} · SONDEO DE UNA LLAMADA` : medida, cuando: new Date().toISOString(), huellaDelPrompt: armado.huella, documentos, respuestas, registro });
}
