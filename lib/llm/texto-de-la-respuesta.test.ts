import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leerTextoDeLaRespuesta, textoDeTodosLosBloques } from './texto-de-la-respuesta';

/**
 * F-122 P5 · EL LECTOR UNIFICADO (09/10/2026). Sustituye a las dos lecturas
 * duplicadas del primer bloque de `anthropic-client.ts`.
 */

/** La lectura de ANTES, copiada tal cual estaba en los dos sitios, como
 *  referencia: `content?.[0]?.text`. */
const lecturaDeAntes = (body: unknown): string | undefined => {
  const d = body as Record<string, unknown>;
  const content = d?.content as Array<Record<string, unknown>> | undefined;
  return content?.[0]?.text as string | undefined;
};

const texto = (t: string) => ({ type: 'text', text: t });

let avisos: string[];
beforeEach(() => {
  avisos = [];
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => { avisos.push(a.map(String).join(' ')); });
});
afterEach(() => { vi.restoreAllMocks(); });

describe('F-122 P5 · el lector unificado', () => {
  it('UN BLOQUE: byte a byte lo mismo que la lectura de antes, y sin registrar nada', () => {
    const casos = [
      'una respuesta normal',
      '```json\n{\n  "overlapPercent": 25,\n  "verdict": "tema_similar"\n}\n```',
      '  espacios al principio y al final  \n',
      'acentos, comillas «» “” y emojis 🙂 — guion largo',
    ];
    for (const t of casos) {
      const body = { content: [texto(t)], usage: { input_tokens: 10, output_tokens: 5 } };
      const ahora = leerTextoDeLaRespuesta(body, 'json · prueba');
      expect(ahora).toBe(lecturaDeAntes(body));
      expect(Buffer.from(ahora, 'utf8').equals(Buffer.from(t, 'utf8'))).toBe(true);
    }
    expect(avisos).toEqual([]);
  });

  it('TRES BLOQUES: concatenados en orden y SIN separador, y se registra cuántos', () => {
    // La API parte por donde quiere, incluso a mitad de palabra.
    const body = { content: [texto('La Política de devolu'), texto('ciones da 30 días'), texto(' y el Manual, 15.')] };
    expect(leerTextoDeLaRespuesta(body, 'con_uso · prueba')).toBe('La Política de devoluciones da 30 días y el Manual, 15.');
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('3 bloques de texto y 0 de otro tipo (con_uso · prueba)');
    // Y el aviso no lleva contenido.
    expect(avisos[0]).not.toContain('Política');
  });

  it('CERO BLOQUES DE TEXTO: cadena vacía y la anomalía registrada', () => {
    expect(leerTextoDeLaRespuesta({ content: [] }, 'json · prueba')).toBe('');
    expect(leerTextoDeLaRespuesta({ content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }] }, 'json · prueba')).toBe('');
    expect(leerTextoDeLaRespuesta({}, 'json · prueba')).toBe('');
    expect(avisos).toEqual([
      '[llm] lector: 0 bloques de texto y 0 de otro tipo (json · prueba)',
      '[llm] lector: 0 bloques de texto y 1 de otro tipo (json · prueba)',
      '[llm] lector: 0 bloques de texto y 0 de otro tipo (json · prueba)',
    ]);
  });

  it('los bloques de otro tipo se ignoran, en cualquier posición, y se registran', () => {
    const l = textoDeTodosLosBloques({ content: [{ type: 'thinking', thinking: 'x' }, texto('a'), { type: 'tool_use' }, texto('b')] });
    expect(l).toEqual({ texto: 'ab', bloquesDeTexto: 2, bloquesDeOtroTipo: 2 });
  });
});
