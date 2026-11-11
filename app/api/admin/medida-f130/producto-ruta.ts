import { NextRequest, NextResponse } from 'next/server';
import { getDocumentChunks } from '@/lib/read-chunks';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { autorizar, leerTrozos } from './leer-de-la-base';
import { buildAnalyzedDocumentText } from '@/lib/analysis/judge';
import { PAREJA_DE_D, TROZOS } from './medida-f130';
import { fuenteDelProducto, interruptorEncendido, juzgarConElProducto, promptDeLaPareja, resumenDelPromptD4, VECES_DE_D4 } from './producto';
import { marcasDe, trozosDelBrazo, type Brazo } from './brazos';

/**
 * LO COMÚN DE d4 Y d4b (11/11/2026): el juez del producto (`judgeAllDocuments` en rápido) con el prompt del producto, sobre la
 * pareja de D. TEMPORAL como toda la carpeta. LA ÚNICA DIFERENCIA entre las dos rutas es QUÉ TROZOS ENTRAN, y la decide `brazos.ts`
 * (los tres brazos, y lo que no igualan). El prompt, la llamada, la frontera y la puerta son los mismos; la puerta comprueba cada
 * cita contra lo que se entregó a ese brazo.
 * El dato declarado: D tal como la escribe el juez del producto con el prompt del producto, después de la puerta y antes del
 * verificador, con la pareja entregada y con su fecha. NO es lo publicado (sin verificador, R2, cascada ni síntesis). Para este caso,
 * después de la puerta ≈ publicado: en la línea base no murió ninguna D en la puerta (0 de 21), y el «17 de 18» —una INFERENCIA hasta
 * que `SQL_34_13` lo confirme— dice que las pérdidas son anteriores, en la generación.
 * NO COBRA CRÉDITOS y no pasa por el limitador. ⚠️ CUATRO NEGATIVAS DURAS, antes del ensayo y antes del modelo, con 409: los trozos
 * de la pareja, el interruptor de la pareja entera a «1», los trozos del brazo (`trozosDelBrazo`) y el régimen `pareja_entera`.
 */
export async function medirConElProducto(req: NextRequest, condicion: Brazo) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  const { analizado, candidato } = PAREJA_DE_D;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const x = leidos.trozos[analizado], y = leidos.trozos[candidato];

  if (!interruptorEncendido()) {
    return NextResponse.json({ error: 'el interruptor ANALYSIS_PAREJA_ENTERA no está a «1» en este despliegue: el juez leería con la tijera vieja' }, { status: 409 });
  }

  // lo que el producto le pasa al juez: los trozos del brazo de cada lado, el texto del analizado y la fuente del candidato
  const todosX = await getDocumentChunks(a.supabase, { orgId: a.orgId, documentId: x.documentId, generation: x.generacion });
  const todosY = await getDocumentChunks(a.supabase, { orgId: a.orgId, documentId: y.documentId, generation: y.generacion });
  const brazoX = trozosDelBrazo(condicion, { codigo: TROZOS[analizado].codigo, todos: todosX, trozoD: x.chunkIndex }, ts => buildAnalyzedDocumentText(ts, x.nombre).length);
  const brazoY = trozosDelBrazo(condicion, { codigo: TROZOS[candidato].codigo, todos: todosY, trozoD: y.chunkIndex }, ts => buildAnalyzedDocumentText(ts, y.nombre).length);
  if (!brazoX.ok || !brazoY.ok) return NextResponse.json({ error: !brazoX.ok ? brazoX.motivo : !brazoY.ok ? brazoY.motivo : '' }, { status: 409 });
  const trozosX = todosX.filter(c => brazoX.indices.includes(c.chunkIndex));
  const trozosY = todosY.filter(c => brazoY.indices.includes(c.chunkIndex));
  const { data: filas, error } = await a.supabase.from('documents').select('id, source, full_text').in('id', [x.documentId, y.documentId]);
  if (error || !filas || filas.length !== 2) return NextResponse.json({ error: `no se pudieron leer los dos documentos: ${error?.message ?? 'faltan filas'}` }, { status: 409 });
  const filaX = filas.find(f => f.id === x.documentId)!, filaY = filas.find(f => f.id === y.documentId)!;
  const ladoX = { nombre: x.nombre, trozos: trozosX };
  const ladoY = { documentId: y.documentId, nombre: y.nombre, trozos: trozosY, fuente: fuenteDelProducto(filaY.source as string | null) };

  const armado = promptDeLaPareja({ analizado: ladoX, candidato: ladoY });
  if (!armado.ok) return NextResponse.json({ error: armado.motivo, regimen: armado.regimen }, { status: 409 });
  // el texto del analizado que el producto le pasa al juez (`newDocumentSample`): el del documento entero en d4; en d4b, lo
  // entregado
  const textoDelAnalizado = condicion !== 'documentos' ? armado.textoAnalizado
    : typeof filaX.full_text === 'string' && filaX.full_text.trim() !== '' ? filaX.full_text : armado.textoAnalizado;

  const que = { documentos: 'los dos DOCUMENTOS ENTEROS', competencia: 'el trozo de D y los de A, B y C de cada lado (d4b)' }[condicion];
  const medida = `F-130 · el JUEZ DEL PRODUCTO, con el PROMPT DEL PRODUCTO, sobre la pareja de D de la siembra (§2.4 ↔ §3.5), ${que} (pareja_entera), después de la puerta y antes del verificador, ${VECES_DE_D4} veces por pulsación`;
  // en el ensayo, cada trozo entregado con su tamaño y sus marcas, para comprobar el brazo sobre lo que de verdad se entrega
  const detalle = (ts: typeof todosX) => condicion === 'documentos' ? undefined : ts.map(c => ({ trozo: c.chunkIndex, caracteres: c.text.length, marcas: marcasDe(c.text) }));
  const documentos = {
    condicion,
    analizado: { documento: x.nombre, generacion: x.generacion, trozos: trozosX.length, caracteres: armado.textoAnalizado.length, tamanoDelBrazo: brazoX.tamano, tamanoDeCompetencia: brazoX.tamanoDeCompetencia, trozosDeABC: brazoX.trozosDeABC, textoDelAnalizado: textoDelAnalizado === armado.textoAnalizado ? 'el armado de lo entregado' : 'full_text', detalle: detalle(trozosX) },
    candidato: { documento: y.nombre, generacion: y.generacion, trozos: trozosY.length, caracteres: armado.bloqueCandidato.length, tamanoDelBrazo: brazoY.tamano, tamanoDeCompetencia: brazoY.tamanoDeCompetencia, trozosDeABC: brazoY.trozosDeABC, fuente: ladoY.fuente, detalle: detalle(trozosY) },
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
