import { callLLM } from '@/lib/analysis/llm-client';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';

/**
 * La llamada de las dos rutas que preguntan al modelo (E3 y la variante limpia), con la configuración EXACTA del juez
 * (`modeloDelJuez()`) y cada llamada en el registro con sus parámetros. En un sitio, para que las dos midan con la misma
 * configuración. Temporal como toda la carpeta (cabecera de `medida-f130.ts`).
 */
export interface Tarea { pareja: string; vez: number; candidatoId: string; prompt: string }

export async function preguntarAlJuez(tareas: Tarea[]) {
  const delJuez = modeloDelJuez();
  const { resultado: respuestas, registro } = await conRegistroDeLlamadas(() =>
    runInBatches(tareas, async t => {
      try {
        const texto = await callLLM(t.prompt, {
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
  return { modelo: delJuez.modelo, respuestas, registro };
}
