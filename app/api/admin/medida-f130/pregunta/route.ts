import { NextRequest, NextResponse } from 'next/server';
import { callLLMJson } from '@/lib/analysis/llm-client';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { construirPrompt, PAREJA_DE_E3, PREGUNTA_CERRADA, VECES_DE_E3 } from '../medida-f130';

/**
 * POST /api/admin/medida-f130/pregunta — E3 de F-130, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * La pregunta cerrada sobre la pareja de D, siete veces, en la condición REALISTA: los dos trozos enteros, con A dentro
 * (`PAREJA_DE_E3`). Con la configuración EXACTA del juez (`modeloDelJuez()`), cada llamada en el registro con sus
 * parámetros. NO COBRA CRÉDITOS (arquitecto, 29/10): es instrumento de medida; el gasto real queda en el registro que
 * devuelve. Sin la pregunta del arquitecto (`PREGUNTA_CERRADA` vacía) responde 409 y no llama al modelo.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;

  // la pregunta se comprueba ANTES de leer nada: sin ella no hay nada que medir
  const prueba = construirPrompt(PREGUNTA_CERRADA, '', '');
  if (!prueba.ok) return NextResponse.json({ error: prueba.motivo }, { status: 409 });

  const leidos = await leerTrozos(a.supabase, a.orgId, [PAREJA_DE_E3.analizado, PAREJA_DE_E3.candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const analizado = leidos.trozos[PAREJA_DE_E3.analizado];
  const candidato = leidos.trozos[PAREJA_DE_E3.candidato];
  const armado = construirPrompt(PREGUNTA_CERRADA, analizado.texto, candidato.texto);
  if (!armado.ok) return NextResponse.json({ error: armado.motivo }, { status: 409 });

  const delJuez = modeloDelJuez();
  const { resultado: respuestas, registro } = await conRegistroDeLlamadas(() =>
    runInBatches(Array.from({ length: VECES_DE_E3 }, (_, i) => i), async i => {
      try {
        const r = await callLLMJson<unknown>(armado.prompt, {
          maxOutputTokens: delJuez.maxOutputTokens,
          ...(delJuez.temperature === undefined ? { sinTemperatura: true } : { temperature: delJuez.temperature }),
          modeloExacto: delJuez.modelo,
          ...(delJuez.outputConfig ? { outputConfig: delJuez.outputConfig } : {}),
          etiqueta: { etapa: 'juez', pareja: candidato.documentId },
        });
        return { vez: i + 1, respuesta: r };
      } catch (err) {
        return { vez: i + 1, error: err instanceof Error ? err.message : String(err) };
      }
    }, { batchSize: 4 }),
  );

  return NextResponse.json({
    medida: 'E3 · la pregunta cerrada sobre la pareja de D, en la condición realista',
    cuando: new Date().toISOString(),
    pareja: {
      analizado: { documento: analizado.nombre, trozo: analizado.chunkIndex },
      candidato: { documento: candidato.nombre, trozo: candidato.chunkIndex },
    },
    modelo: delJuez.modelo,
    respuestas,
    registro,
  });
}
