import { describe, it, expect, vi, beforeEach } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import { analyzeStyle } from './style-check';

/**
 * LO QUE EL FILTRO TIRA — B.239, 15/09/2026.
 *
 * ⚠️ ESTA BATERÍA NO COMPRUEBA QUE EL ANÁLISIS ACIERTE: comprueba que **lo que se
 * cae por el camino deje rastro**. Hasta hoy el filtro descartaba en silencio, y
 * cuando una ambigüedad sembrada no apareció **no había forma de saber si el
 * modelo no la vio o si el código se la comió**. Dos explicaciones con arreglos
 * opuestos y ningún dato para elegir.
 *
 * Y los dos motivos van SEPARADOS a propósito: cada uno es la huella de una causa
 * distinta —catálogo incompleto contra respuesta truncada— y un solo contador los
 * sumaría sin poder distinguirlos.
 */

const bueno = { type: 'ortografia', title: 't', description: 'd', textRef: 'consulltas' };

beforeEach(() => llamada.mockReset());

describe('el camino limpio', () => {
  it('sin descartes, no se inventa ningún contador', async () => {
    llamada.mockResolvedValue({ problems: [bueno] });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores).toEqual({});
    expect(r.tiposDescartados).toEqual([]);
  });
});

describe('⚠️ descarte POR TIPO — la huella de un catálogo incompleto', () => {
  it('un tipo que no reconocemos se cuenta Y se nombra', async () => {
    llamada.mockResolvedValue({
      problems: [bueno, { type: 'puntuacion', title: 't', description: 'd', textRef: 'x' }],
    });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(1);
    expect(r.tiposDescartados).toEqual(['puntuacion']);
  });

  it('el mismo tipo repetido se cuenta dos veces pero se nombra una', async () => {
    llamada.mockResolvedValue({
      problems: [
        { type: 'puntuacion', textRef: 'a' },
        { type: 'puntuacion', textRef: 'b' },
      ],
    });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(2);
    expect(r.tiposDescartados).toEqual(['puntuacion']);
  });

  it('⚠️ NUNCA viaja el texto del documento, sólo la etiqueta', async () => {
    llamada.mockResolvedValue({
      problems: [{
        type: 'gramatica',
        title: 'El paciente debe acudir en ayunas',
        description: 'frase del documento del cliente',
        textRef: 'texto literal del documento',
      }],
    });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.tiposDescartados).toEqual(['gramatica']);
    const serializado = JSON.stringify(r.tiposDescartados);
    expect(serializado).not.toContain('paciente');
    expect(serializado).not.toContain('literal');
  });

  it('una etiqueta larguísima se recorta antes de persistirla', async () => {
    llamada.mockResolvedValue({ problems: [{ type: 'x'.repeat(500), textRef: 'a' }] });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.tiposDescartados[0].length).toBeLessThanOrEqual(40);
  });

  it('sin tipo ninguno también se cuenta, y se nombra como tal', async () => {
    llamada.mockResolvedValue({ problems: [{ textRef: 'a' }] });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(1);
    expect(r.tiposDescartados).toEqual(['(sin tipo)']);
  });
});

describe('⚠️ descarte SIN ANCLA — la huella de una respuesta truncada', () => {
  it('un problema de tipo válido pero sin textRef cuenta en OTRO contador', async () => {
    llamada.mockResolvedValue({
      problems: [bueno, { type: 'ambiguedad', title: 't', description: 'd' }],
    });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores['averia.estilo_descartado_sin_ancla']).toBe(1);
    // ⚠️ Y NO se cuenta como descarte por tipo: el tipo era bueno.
    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBeUndefined();
    expect(r.tiposDescartados).toEqual([]);
  });

  it('un textRef en blanco cuenta igual que uno ausente', async () => {
    llamada.mockResolvedValue({ problems: [{ type: 'sugerencia', textRef: '   ' }] });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.contadores['averia.estilo_descartado_sin_ancla']).toBe(1);
  });

  it('⚠️ CONTROL: los dos motivos a la vez NO se mezclan', async () => {
    // El par que demuestra que la separación sirve: si fueran un solo contador,
    // este caso daría 2 y no se sabría de qué.
    llamada.mockResolvedValue({
      problems: [
        bueno,
        { type: 'puntuacion', textRef: 'a' },
        { type: 'ambiguedad' },
      ],
    });
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(1);
    expect(r.contadores['averia.estilo_descartado_sin_ancla']).toBe(1);
  });
});

describe('el fallo del modelo — que esto NO arregla', () => {
  it('⚠️ sigue devolviendo lista vacía sin contadores: eso es B.237', async () => {
    // Devolver `null` hace que `parsed.problems` reviente DENTRO del `try`:
    // mismo camino de fallo, sin que el mock lance por su cuenta.
    llamada.mockResolvedValue(null);
    const r = await analyzeStyle('texto', 'doc.txt');

    expect(r.problemas).toEqual([]);
    expect(r.contadores).toEqual({});
    // Y se dice en el caso: un cero de aquí sigue sin distinguirse de «no hay
    // problemas». Lo que hoy deja rastro es lo DESCARTADO, no lo no-mirado.
  });
});
