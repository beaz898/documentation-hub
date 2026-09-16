import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { analyzeStyle } from '@/lib/analysis/style-check';
import { logUsage, registrarAveriaDeLimitador } from '@/lib/usage-logger';
import { checkRateLimit } from '@/lib/rate-limiter';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { consumeCredits, devolverSiNoSeEntrego, getCreditCost } from '@/lib/credits';
import { saveStyleResult } from '@/lib/persist-analysis';
import { usageContext } from '@/lib/observability/usage-context';
import { persistLLMUsage } from '@/lib/observability/record-usage';
import { documentoPropietario } from '@/lib/analysis/propietario';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId = '';
  let orgId = '';
  let creditsConsumed = 0;
  const supabase = createServiceClient();

  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    userId = user.id;

    // Resolver organización
    const orgR = await resolverOrg(supabase, userId);
    if (!orgR.resuelta) return respuestaDeOrgNoResuelta(orgR);
    const org = orgR.org;
    orgId = org.orgId;

    // Rate limiting
    const rateCheck = await checkRateLimit(supabase, userId, '/api/analyze-style');
    // El limitador falla ABIERTO cuando su consulta falla, y eso está bien
    // elegido. Lo que no puede es ser mudo: si dejó de limitar, queda una fila
    // en `usage_logs` con el motivo. No hace nada cuando no hubo avería.
    await registrarAveriaDeLimitador(supabase, {
      averia: rateCheck.averia, orgId, userId, endpoint: '/api/analyze-style',
    });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de análisis de estilo (${rateCheck.limit}). Inténtalo mañana.`, remaining: 0 },
        { status: 429 }
      );
    }

    // ⚠️ B.237, PUERTA 1 — LA LONGITUD SE COMPRUEBA ANTES DE COBRAR (17/09/2026).
    // Hasta hoy se cobraba y DESPUÉS se miraba el texto: uno de menos de 50
    // caracteres devolvía 400 y se quedaba los 2 créditos, porque el reembolso
    // de esta ruta sólo vive en el `catch` y este 400 es un `return`. Mirar el
    // cuerpo no cuesta nada al proveedor, así que va delante del cobro y no hay
    // nada que devolver.
    const { text, fileName, documentoPropietario: propietarioPedido, storagePath } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente' }, { status: 400 });
    }

    // Verificar y descontar créditos
    const creditResult = await consumeCredits(supabase, orgId, '/api/analyze-style');
    if (!creditResult.success) {
      return NextResponse.json(
        {
          error: 'Se han agotado los créditos de tu plan. Contacta con el administrador para recargar o cambiar de plan.',
          errorType: 'no_credits',
          creditsRemaining: creditResult.creditsRemaining,
          creditsExtra: creditResult.creditsExtra,
        },
        { status: 402 }
      );
    }
    creditsConsumed = getCreditCost('/api/analyze-style');

    const llmAcc = new Map();
    const resultado = await usageContext.run(llmAcc, () =>
      analyzeStyle(text, fileName || 'sin nombre')
    );
    const problems = resultado.problemas;
    void persistLLMUsage({
      accumulator:    llmAcc,
      orgId,
      userId,
      operation:      'analyze_style',
      creditsCharged: creditsConsumed,
    });

    // F-100 — DE QUIÉN ES ESTE ANÁLISIS. El id viene del cliente, así que se
    // COMPRUEBA antes de escribirlo: aceptar una referencia es legítimo, pero
    // escribirla sin comprobarla dejaría atribuir un análisis a cualquier
    // documento cuyo id se conozca — y la bandeja, que se queda con el análisis
    // más reciente de cada documento, TAPARÍA el análisis real del ajeno.
    //
    // ⚠️ FALLA CERRADA (F-95 P3): si la consulta no contesta, `pertenece` queda
    // en false y el análisis se guarda SIN propietario. Entre degradar —no poder
    // releerlo por documento— y corromper la atribución de otro, se degrada.
    let pertenece = false;
    if (typeof propietarioPedido === 'string' && propietarioPedido.length > 0) {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('id', propietarioPedido)
        .eq('org_id', orgId)
        .maybeSingle();
      if (docError) {
        console.warn(`[analyze-style] no se pudo comprobar el propietario | doc=${propietarioPedido} | ${docError.message}`);
      }
      pertenece = !docError && doc !== null;
    }

    void saveStyleResult(supabase, {
      orgId,
      userId,
      documentName: fileName || 'sin nombre',
      problemsCount: problems.length,
      // B.239: lo que el filtro tiró, y por qué motivo. Sin esto, «8 problemas»
      // no se distingue de «8 problemas y 4 descartados».
      contadores: resultado.contadores as Record<string, number>,
      tiposDescartados: resultado.tiposDescartados,
      // B.238: los problemas, no sólo cuántos. Sin esto, dos pasadas con cifras
      // distintas no se pueden comparar y el usuario no puede releer lo pagado.
      problemas: problems,
      // F-101: desde el chat el dueño es el fichero; desde la bandeja, el documento.
      storagePath: typeof storagePath === 'string' ? storagePath : null,
      documentoPropietario: documentoPropietario({
        idPedido: propietarioPedido,
        perteneceALaOrg: pertenece,
      }),
    });

    const latencyMs = Date.now() - startedAt;

    await logUsage(supabase, {
      userId,
      orgId,
      endpoint: '/api/analyze-style',
      model: 'haiku',
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      success: true,
      creditsConsumed,
    });

    console.log(`[ANALYZE-STYLE] OK — problems=${problems.length} latency=${latencyMs}ms`);
    return NextResponse.json({ success: true, problems });
  } catch (error: unknown) {
    console.error('Error in /api/analyze-style:', error);

    // La mitad simétrica del cobro (01/09): aquí no se entregó nada.
    await devolverSiNoSeEntrego(supabase, {
      orgId, creditosCobrados: creditsConsumed, entregado: false, contexto: '/api/analyze-style',
    });

    if (userId) {
      await logUsage(supabase, {
        userId,
        orgId,
        endpoint: '/api/analyze-style',
        model: 'haiku',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        success: false,
        creditsConsumed,
        errorMessage: error instanceof Error ? error.message : 'Error interno',
      });
    }

    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
