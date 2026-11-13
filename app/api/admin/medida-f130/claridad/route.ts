import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/analysis/llm-client';
import { modeloDelJuez } from '@/lib/analysis/modelo-del-juez';
import { huellaDelPrompt } from '@/lib/analysis/judge';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';
import { runInBatches } from '@/lib/run-in-batches';
import { autorizar, leerTrozos } from '../leer-de-la-base';
import { claseDelConflicto } from '../regla-de-validez';
import { PAREJA_DE_D } from '../medida-f130';
import { TIRADAS_POR_BRAZO, contarClaridad, promptDeClaridad, textosDeClaridad, textosPrimarios, textosTresParrafos, veredicto, type BrazoDeClaridad, type ParejaDeClaridad } from '../tanda-de-claridad';

/**
 * POST /api/admin/medida-f130/claridad?brazo=n|r&pareja=31|35 — LA TANDA DE CLARIDAD (paso 1 de Fable), TEMPORAL. Qué mide, cómo y qué es nuestro,
 * en `../tanda-de-claridad.ts`. Con `?ensayo=1`, los dos prompts enteros (son cortos y no llevan nada más que los dos párrafos) sin modelo;
 * con `?sondeo=1`, una sola tirada; sin nada, las 42. NO COBRA CRÉDITOS. ⚠️ NEGATIVAS DURAS, antes del ensayo y del modelo, con 409:
 * un brazo que no sea n ni r; una pareja que no sea 31 ni 35; los dos trozos de la pareja con su frase; y los dos textos con las
 * negativas de su pareja (`textosPrimarios` o `textosDeClaridad`).
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;
  const brazo = req.nextUrl.searchParams.get('brazo');
  if (brazo !== 'n' && brazo !== 'r') return NextResponse.json({ error: 'el brazo tiene que ser «n» o «r»' }, { status: 409 });
  // la pareja, OBLIGATORIA (12/11): 31 es la primaria (§2.4 ↔ §3.1 entero), 35 la secundaria (§2.4 ↔ §3.5), y 315 (13/11) los tres
  // párrafos (§2.4 ↔ §3.1 + §3.5), que es lo que ve el producto y sólo va con N. Sin ella, no se adivina.
  const cualPareja = req.nextUrl.searchParams.get('pareja');
  if (cualPareja !== '31' && cualPareja !== '35' && cualPareja !== '315') return NextResponse.json({ error: 'la pareja tiene que ser «31» (primaria), «35» (secundaria) o «315» (los tres párrafos)' }, { status: 409 });
  const pareja: ParejaDeClaridad = cualPareja === '31' ? 'primaria' : cualPareja === '35' ? 'secundaria' : 'tres_parrafos';
  if (pareja === 'tres_parrafos' && brazo !== 'n') return NextResponse.json({ error: 'los tres párrafos sólo van con el brazo N' }, { status: 409 });

  const analizado = PAREJA_DE_D.analizado;
  const claves = pareja === 'primaria' ? [analizado, 'cli12_3' as const] : pareja === 'secundaria' ? [analizado, PAREJA_DE_D.candidato] : [analizado, 'cli12_3' as const, 'cli12_6' as const];
  const leidos = await leerTrozos(a.supabase, a.orgId, claves);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const t = (clave: (typeof claves)[number]) => leidos.trozos[clave].texto;
  const textos = pareja === 'primaria' ? textosPrimarios(t(analizado), t('cli12_3'))
    : pareja === 'secundaria' ? textosDeClaridad(t(analizado), t(PAREJA_DE_D.candidato))
    : textosTresParrafos(t(analizado), t('cli12_3'), t('cli12_6'));
  if (!textos.ok) return NextResponse.json({ error: textos.motivo }, { status: 409 });
  const candidato = claves[1];

  const prompt = promptDeClaridad(brazo as BrazoDeClaridad, textos.texto1, textos.texto2, pareja);
  const queTextos = {
    primaria: 'PAREJA PRIMARIA: NOR-10 §2.4 sin la frase de A ↔ CLI-12 §3.1 ENTERO',
    secundaria: 'pareja secundaria: NOR-10 §2.4 sin la frase de A ↔ CLI-12 §3.5',
    tres_parrafos: 'LOS TRES PÁRRAFOS, lo que ve el producto: NOR-10 §2.4 sin la frase de A ↔ CLI-12 §3.1 ENTERO y §3.5 ENTERO',
  }[pareja];
  const medida = `F-130 · LA TANDA DE CLARIDAD (paso 1 de Fable), brazo ${brazo === 'n' ? 'N, neutro' : 'R, con la regla del producto'}, ${queTextos}; sin el prompt del juez, con el modelo y el esfuerzo del juez, ${TIRADAS_POR_BRAZO} tiradas`;
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
        const v = veredicto(brazo as BrazoDeClaridad, texto);
        // en el brazo N, cada CONFLICTO con la clase de su explicación (la puerta de validez), para que sea auditable
        return { vez, ...v, ...(brazo === 'n' && v.positivoLaxo ? { claseDelConflicto: claseDelConflicto(texto) } : {}), texto };
      } catch (err) {
        return { vez, error: err instanceof Error ? err.message : String(err) };
      }
    }, { batchSize: 6 }),
  );
  const conTexto = respuestas.filter((r): r is typeof r & { texto: string } => 'texto' in r && typeof r.texto === 'string');
  return NextResponse.json({
    medida: sondeo ? `${medida} · SONDEO DE UNA TIRADA` : medida, cuando: new Date().toISOString(), huellaDelPrompt: huellaDelPrompt(prompt),
    cuenta: { ...contarClaridad(brazo as BrazoDeClaridad, conTexto.map(r => r.texto), pareja), fallidas: respuestas.length - conTexto.length },
    respuestas, registro,
  });
}
