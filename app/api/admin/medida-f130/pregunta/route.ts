import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/analysis/llm-client';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { construirPrompt, CRITERIO_TRES, PAREJAS_DE_E3, VECES_DE_E3, type ClaveDeTrozo } from '../medida-f130';

/**
 * POST /api/admin/medida-f130/pregunta — E3 de F-130, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * La pregunta cerrada del arquitecto sobre LAS DOS parejas de D (`PAREJAS_DE_E3`), siete veces cada una, en la condición
 * REALISTA: los trozos enteros, con A dentro. Con la configuración EXACTA del juez (`modeloDelJuez()`), cada llamada en el
 * registro con sus parámetros. La respuesta es TEXTO, tal cual: el formato pide «sí o no» y citas, no JSON, y la lectura
 * de las respuestas no la hace esta ruta. NO COBRA CRÉDITOS (arquitecto, 28/10): el gasto real queda en el registro que
 * devuelve. Sin el tercer criterio (`CRITERIO_TRES` vacío) responde 409 y no llama al modelo.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  // el criterio se comprueba ANTES de leer nada: sin él no hay nada que medir
  const vacio = { documento1: '', trozoA: 0, textoA: '', documento2: '', trozoB: 0, textoB: '' };
  const prueba = construirPrompt(vacio, CRITERIO_TRES);
  if (!prueba.ok) return NextResponse.json({ error: prueba.motivo }, { status: 409 });

  const claves = [...new Set(PAREJAS_DE_E3.flatMap(p => [p.analizado, p.candidato]))] as ClaveDeTrozo[];
  const leidos = await leerTrozos(a.supabase, a.orgId, claves);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });

  const prompts = PAREJAS_DE_E3.map(p => {
    const x = leidos.trozos[p.analizado], y = leidos.trozos[p.candidato];
    const armado = construirPrompt({ documento1: x.nombre, trozoA: x.chunkIndex, textoA: x.texto, documento2: y.nombre, trozoB: y.chunkIndex, textoB: y.texto }, CRITERIO_TRES);
    return { pareja: `${x.nombre} · trozo ${x.chunkIndex} ↔ ${y.nombre} · trozo ${y.chunkIndex}`, candidatoId: y.documentId, armado };
  });
  const malo = prompts.find(p => !p.armado.ok);
  if (malo && !malo.armado.ok) return NextResponse.json({ error: malo.armado.motivo }, { status: 409 });

  const delJuez = modeloDelJuez();
  const tareas = prompts.flatMap(p => Array.from({ length: VECES_DE_E3 }, (_, i) => ({ ...p, vez: i + 1 })));
  const { resultado: respuestas, registro } = await conRegistroDeLlamadas(() =>
    runInBatches(tareas, async t => {
      if (!t.armado.ok) return { pareja: t.pareja, vez: t.vez, error: t.armado.motivo };
      try {
        const texto = await callLLM(t.armado.prompt, {
          maxOutputTokens: delJuez.maxOutputTokens,
          ...(delJuez.temperature === undefined ? { sinTemperatura: true } : { temperature: delJuez.temperature }),
          modeloExacto: delJuez.modelo,
          ...(delJuez.outputConfig ? { outputConfig: delJuez.outputConfig } : {}),
          etiqueta: { etapa: 'juez', pareja: t.candidatoId },
        });
        return { pareja: t.pareja, vez: t.vez, respuesta: texto };
      } catch (err) {
        return { pareja: t.pareja, vez: t.vez, error: err instanceof Error ? err.message : String(err) };
      }
    }, { batchSize: 4 }),
  );

  return NextResponse.json({
    medida: 'E3 · la pregunta cerrada sobre las dos parejas de D, en la condición realista, siete veces cada una',
    cuando: new Date().toISOString(),
    modelo: delJuez.modelo,
    respuestas,
    registro,
  });
}
