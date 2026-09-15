import { recordStageFailure } from './stage-failures';
import { callLLMJson } from './llm-client';
import type { PipelineCounters } from './counters';

/**
 * Análisis de estilo intra-documento.
 *
 * Detecta errores ortográficos, ambigüedades y sugerencias de mejora
 * dentro del propio texto, sin compararlo con otros documentos.
 *
 * Esta función es reutilizable: la llaman tanto el endpoint /api/analyze-style
 * como el pipeline exhaustivo.
 */

/** Problema de estilo detectado en el texto. */
export interface StyleProblem {
  type: 'ortografia' | 'ambiguedad' | 'sugerencia';
  title: string;
  description: string;
  /** Cita literal del texto donde está el problema (para localización en el editor). */
  textRef: string;
}

interface StyleResponse {
  problems?: Array<{
    type?: string;
    title?: string;
    description?: string;
    textRef?: string;
  }>;
}

const VALID_TYPES = new Set(['ortografia', 'ambiguedad', 'sugerencia']);

/**
 * LO QUE DEVUELVE EL ANÁLISIS DE ESTILO — B.239, 15/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ HASTA HOY DEVOLVÍA SÓLO LOS PROBLEMAS, Y LO QUE SE CAÍA POR EL CAMINO NO
 * LO SABÍA NADIE. El filtro descartaba lo que el modelo devolvía y no encajaba,
 * y `parsed.problems` no se comparaba NUNCA contra lo que sobrevivía: ni un log,
 * ni un contador, ni una línea.
 *
 * El caso que lo destapó: una ambigüedad sembrada —con consecuencia clínica— no
 * apareció en el resultado, y **no había forma de saber si el modelo no la vio o
 * si el código se la comió**. Dos explicaciones con arreglos opuestos, y ningún
 * dato para elegir.
 *
 * Lo que no cabe en la firma lo acaba representando el vecino: aquí, la lista
 * corta significaba a la vez «hay pocos problemas» y «descarté varios».
 * ═══════════════════════════════════════════════════════════════════════════
 */
export interface ResultadoDeEstilo {
  problemas: StyleProblem[];
  /** Los dos descartes, para persistir. Vacío si no se descartó nada. */
  contadores: PipelineCounters;
  /**
   * ⚠️ SÓLO LA ETIQUETA DE TIPO QUE EL MODELO INVENTÓ. NUNCA el `textRef`, ni el
   * `title`, ni la `description`: eso es texto del documento, y esto viaja a la
   * base para telemetría. La etiqueta es del modelo, no del cliente.
   *
   * Y es la mitad que de verdad decide el arreglo: si lo descartado venía como
   * `puntuacion`, el problema no es el filtro — es que al catálogo le falta un
   * tipo.
   */
  tiposDescartados: string[];
}

const STYLE_PROMPT = `Eres un revisor de estilo de documentación corporativa. Analiza el TEXTO que se te da y detecta SOLO problemas internos del propio texto (sin compararlo con otros documentos).

Detecta tres tipos de problema:
- "ortografia": faltas, erratas, errores gramaticales o de concordancia.
- "ambiguedad": frases poco claras, ambiguas o que pueden malinterpretarse.
- "sugerencia": redundancias, párrafos mejorables, problemas de claridad o estilo.

REGLAS:
1. NO te inventes problemas. Si el texto está bien, devuelve un array vacío.

2. Para cada problema, el campo "textRef" DEBE ser una copia LITERAL de un substring del texto (carácter por carácter, sin parafrasear). Es lo que permite localizarlo en el editor. Debe ser lo MÁS CORTO posible: la palabra o expresión exacta que tiene el problema, no la frase entera. Si una palabra concreta aparece varias veces en el texto, incluye una o dos palabras de contexto para que sea único.

3. La "title" es un nombre breve (máx. 8 palabras) que identifica el problema (ej: "Errata en 'consulltas'", "Frase ambigua sobre vacaciones", "Repetición innecesaria").

4. La "description" tiene un formato OBLIGATORIO de dos partes:
   - Primera parte: qué está mal (sin repetir literalmente la palabra equivocada como si fuera la correcta).
   - Segunda parte: la corrección concreta, introducida por "Sugerencia:" o "Corrección:".
   Máximo 30 palabras en total.

5. Devuelve máximo 15 problemas en total. Si hay más, prioriza los más graves.

EJEMPLOS DE description BIEN HECHA:
- "La palabra está mal escrita: sobra una 'l'. Corrección: 'consultas'."
- "La frase es ambigua porque no queda claro a quién se refiere 'su responsable'. Sugerencia: especificar 'el responsable del solicitante'."
- "Este párrafo repite la idea ya expresada en el anterior. Sugerencia: eliminarlo o fusionarlo con el párrafo previo."

EJEMPLOS DE description MAL HECHA (NO HAGAS ESTO):
- "Falta una 'l' en consulltas. Debe ser consultas." (escribe la palabra equivocada como si fuera la corrección)
- "Esta frase es rara." (no propone corrección)
- "Mejorar redacción." (vago, sin corrección concreta)

Estructura JSON exacta a devolver:
{"problems":[{"type":"ortografia|ambiguedad|sugerencia","title":"...","description":"...","textRef":"..."}]}`;

/**
 * Analiza el texto en busca de problemas de estilo (ortografía, ambigüedad, sugerencias).
 * Devuelve un array de problemas validados.
 */
export async function analyzeStyle(text: string, fileName: string): Promise<ResultadoDeEstilo> {
  const t0 = Date.now();

  const userPrompt = `${STYLE_PROMPT}

---

DOCUMENTO: "${fileName || 'sin nombre'}"

TEXTO A REVISAR:
"""
${text.slice(0, 20000)}
"""

Devuelve el JSON con los problemas internos detectados.`;

  try {
    const parsed = await callLLMJson<StyleResponse>(userPrompt, {
      model: 'haiku',
      maxOutputTokens: 3072,
      temperature: 0.2,
    });

    // ⚠️ EL FILTRO SE PARTE EN DOS MOTIVOS, y no es cosmética: cada uno es la
    // huella de una causa distinta, y sumarlos los haría indistinguibles.
    //
    //   · tipo no reconocido → el modelo etiquetó con algo fuera de los tres.
    //     Apunta a un CATÁLOGO INCOMPLETO.
    //   · sin ancla utilizable → llegó sin `textRef`. Es la forma que deja una
    //     respuesta TRUNCADA: el cliente repara el JSON cortado y los últimos
    //     elementos llegan a medias.
    const crudos = parsed.problems || [];
    const tiposDescartados: string[] = [];
    let descartadosPorTipo = 0;
    let descartadosSinAncla = 0;
    const problems: StyleProblem[] = [];

    for (const p of crudos) {
      if (!VALID_TYPES.has(p.type || '')) {
        descartadosPorTipo++;
        // Sólo la etiqueta, recortada: si el modelo devolviera una parrafada en
        // ese campo, esto no la lleva entera a la base.
        const etiqueta = typeof p.type === 'string' && p.type.trim().length > 0
          ? p.type.trim().slice(0, 40)
          : '(sin tipo)';
        if (!tiposDescartados.includes(etiqueta)) tiposDescartados.push(etiqueta);
        continue;
      }
      if (typeof p.textRef !== 'string' || p.textRef.trim().length === 0) {
        descartadosSinAncla++;
        continue;
      }
      problems.push({
        type: p.type as 'ortografia' | 'ambiguedad' | 'sugerencia',
        title: p.title?.trim() || 'Problema detectado',
        description: p.description?.trim() || '',
        textRef: p.textRef.trim(),
      });
    }

    const contadores: PipelineCounters = {};
    if (descartadosPorTipo > 0) contadores['averia.estilo_descartado_por_tipo'] = descartadosPorTipo;
    if (descartadosSinAncla > 0) contadores['averia.estilo_descartado_sin_ancla'] = descartadosSinAncla;

    // ⚠️ EL REGISTRO LLEVA LOS TRES NÚMEROS, no sólo el de salida: «8 problemas»
    // no dice lo mismo si el modelo devolvió 8 que si devolvió 12.
    console.log(
      `[style-check] "${fileName}": ${problems.length} problemas de estilo ` +
      `(de ${crudos.length} devueltos · ${descartadosPorTipo} por tipo · ${descartadosSinAncla} sin ancla) ` +
      `(${Date.now() - t0}ms)`,
    );
    return { problemas: problems, contadores, tiposDescartados };
  } catch (err) {
    console.warn('[style-check] LLM/parse failed:', err instanceof Error ? err.message : err);
    recordStageFailure('style-check', err);
    // ⚠️ SIGUE DEVOLVIENDO LA LISTA VACÍA, y eso es B.237 y NO se arregla aquí:
    // la ruta seguirá contestando `success: true`. Lo que cambia hoy es sólo que
    // lo DESCARTADO deja rastro; lo que no se pudo mirar, todavía no.
    return { problemas: [], contadores: {}, tiposDescartados: [] };
  }
}
