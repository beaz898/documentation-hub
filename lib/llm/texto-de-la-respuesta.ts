/**
 * EL LECTOR UNIFICADO DE LA RESPUESTA DEL MODELO (F-122, P5; 09/10/2026).
 *
 * ⚠️ EL FALLO QUE ARREGLA: la respuesta se leía cogiendo SÓLO EL PRIMER BLOQUE
 * (`content[0].text`), y esa lectura estaba duplicada en dos sitios de
 * `anthropic-client.ts`. Una respuesta con varios bloques de texto se truncaba
 * sin error y sin rastro. La sonda 2 de B.362 (09/10) trajo tres bloques.
 *
 * LA REGLA: el texto de TODOS los bloques de tipo texto, en el orden en que
 * vienen, SIN SEPARADOR. La API parte el texto por donde le conviene, incluso a
 * mitad de frase: concatenar sin nada es lo que reconstruye el original, y
 * cualquier separador lo corrompería. Los bloques de otro tipo se ignoran.
 *
 * COMPATIBLE HACIA ATRÁS POR CONSTRUCCIÓN para lo que llega hoy: con UN bloque
 * de texto, concatenar uno es devolver ese mismo texto, carácter por carácter.
 * Sólo cambia lo que antes se perdía (el segundo bloque en adelante) o lo que
 * antes fallaba (un primer bloque que no fuera de texto).
 */

/** Lo que se lee de una respuesta: el texto y cuántos bloques había de cada clase. */
export interface LecturaDeLaRespuesta {
  texto: string;
  bloquesDeTexto: number;
  bloquesDeOtroTipo: number;
}

/** El texto de todos los bloques de tipo texto, en orden y sin separador. Pura. */
export function textoDeTodosLosBloques(body: unknown): LecturaDeLaRespuesta {
  const content = (body as { content?: unknown } | null | undefined)?.content;
  const bloques: unknown[] = Array.isArray(content) ? content : [];
  let texto = '';
  let bloquesDeTexto = 0;
  let bloquesDeOtroTipo = 0;
  for (const bloque of bloques) {
    const b = bloque as { type?: unknown; text?: unknown } | null;
    if (b && b.type === 'text' && typeof b.text === 'string') {
      texto += b.text;
      bloquesDeTexto++;
    } else {
      bloquesDeOtroTipo++;
    }
  }
  return { texto, bloquesDeTexto, bloquesDeOtroTipo };
}

/**
 * El texto de la respuesta, y una línea de log SÓLO si la forma no es la de
 * siempre: más de un bloque de texto, alguno de otro tipo, o ninguno de texto.
 * Con un solo bloque de texto —el caso de hoy— no se registra nada. La línea
 * lleva sólo cifras y el origen de la llamada, nunca contenido.
 *
 * `origen` es la vía de la llamada y el modelo (p. ej. «json · claude-haiku…»):
 * en el lector no hay una etiqueta de la operación (juez, rerank…), y pasarla
 * exigiría tocar a los ocho consumidores.
 */
export function leerTextoDeLaRespuesta(body: unknown, origen: string): string {
  const l = textoDeTodosLosBloques(body);
  if (l.bloquesDeTexto !== 1 || l.bloquesDeOtroTipo > 0) {
    console.warn(`[llm] lector: ${l.bloquesDeTexto} bloques de texto y ${l.bloquesDeOtroTipo} de otro tipo (${origen})`);
  }
  return l.texto;
}
