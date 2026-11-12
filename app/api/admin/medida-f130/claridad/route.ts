import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/analysis/llm-client';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { huellaDelPrompt } from '@/lib/analysis/judge';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { PAREJA_DE_D } from '../medida-f130';
import { TIRADAS_POR_BRAZO, contarClaridad, promptDeClaridad, textosDeClaridad, veredicto, type BrazoDeClaridad } from '../tanda-de-claridad';

/**
 * POST /api/admin/medida-f130/claridad?brazo=n|r — LA TANDA DE CLARIDAD (paso 1 de Fable), TEMPORAL. Qué mide, cómo y qué es nuestro,
 * en `../tanda-de-claridad.ts`. Con `?ensayo=1`, los dos prompts enteros (son cortos y no llevan nada más que los dos párrafos) sin modelo;
 * con `?sondeo=1`, una sola tirada; sin nada, las 42. NO COBRA CRÉDITOS. ⚠️ NEGATIVAS DURAS, antes del ensayo y del modelo, con 409:
 * un brazo que no sea n ni r; los dos trozos de la pareja con su frase; y los dos textos con su ancla de D y SIN marcas de A.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;
  const brazo = req.nextUrl.searchParams.get('brazo');
  if (brazo !== 'n' && brazo !== 'r') return NextResponse.json({ error: 'el brazo tiene que ser «n» o «r»' }, { status: 409 });

  const { analizado, candidato } = PAREJA_DE_D;
  const leidos = await leerTrozos(a.supabase, a.orgId, [analizado, candidato]);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const textos = textosDeClaridad(leidos.trozos[analizado].texto, leidos.trozos[candidato].texto);
  if (!textos.ok) return NextResponse.json({ error: textos.motivo }, { status: 409 });

  const prompt = promptDeClaridad(brazo as BrazoDeClaridad, textos.texto1, textos.texto2);
  const medida = `F-130 · LA TANDA DE CLARIDAD (paso 1 de Fable), brazo ${brazo === 'n' ? 'N, neutro' : 'R, con la regla del producto'}: los dos párrafos (NOR-10 §2.4 y CLI-12 §3.5) sin las frases de A, sin el prompt del juez, con el modelo y el esfuerzo del juez, ${TIRADAS_POR_BRAZO} tiradas`;
  const delJuez = modeloDelJuez();
  if (req.nextUrl.searchParams.get('ensayo') === '1') {
    return NextResponse.json({ medida, ensayo: 'sin llamar al modelo', modelo: delJuez.modelo, huellaDelPrompt: huellaDelPrompt(prompt), prompt, frasesDeAQuitadas: textos.quitadas });
  }

  const sondeo = req.nextUrl.searchParams.get('sondeo') === '1';
  const veces = Array.from({ length: sondeo ? 1 : TIRADAS_POR_BRAZO }, (_, i) => i + 1);
  const { resultado: respuestas, registro } = await conRegistroDeLlamadas(() =>
    runInBatches(veces, async vez => {
      try {
        const texto = await callLLM(prompt, {
          maxOutputTokens: delJuez.maxOutputTokens,
          ...(delJuez.temperature === undefined ? { sinTemperatura: true } : { temperature: delJuez.temperature }),
          modeloExacto: delJuez.modelo,
          ...(delJuez.outputConfig ? { outputConfig: delJuez.outputConfig } : {}),
          etiqueta: { etapa: 'juez', pareja: leidos.trozos[candidato].documentId },
        });
        return { vez, ...veredicto(brazo as BrazoDeClaridad, texto), texto };
      } catch (err) {
        return { vez, error: err instanceof Error ? err.message : String(err) };
      }
    }, { batchSize: 6 }),
  );
  const conTexto = respuestas.filter((r): r is typeof r & { texto: string } => 'texto' in r && typeof r.texto === 'string');
  return NextResponse.json({
    medida: sondeo ? `${medida} · SONDEO DE UNA TIRADA` : medida, cuando: new Date().toISOString(), huellaDelPrompt: huellaDelPrompt(prompt),
    cuenta: { ...contarClaridad(brazo as BrazoDeClaridad, conTexto.map(r => r.texto)), fallidas: respuestas.length - conTexto.length },
    respuestas, registro,
  });
}
