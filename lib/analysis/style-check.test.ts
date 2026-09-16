import { describe, it, expect, vi, beforeEach } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import { analyzeStyle } from './style-check';

/** Los casos de abajo son del camino en que el modelo CONTESTÓ: si no fuera así,
 *  el caso no mediría lo que dice, y se para aquí en vez de leer campos que no
 *  existen (B.237). */
async function analizarMirado(texto: string, nombre: string) {
  const r = await analyzeStyle(texto, nombre);
  if (r.estado !== 'mirado') throw new Error(`se esperaba «mirado» y llegó «${r.estado}»`);
  return r;
}

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

// ⚠️ EL TEXTO DE LOS EJEMPLOS CONTIENE LAS ANCLAS QUE SE CITAN, y no es un
// detalle: hasta el 16/09 estos casos pasaban 'texto' y citaban 'consulltas',
// o sea una cita que NO estaba. Lo cazó el chequeo nuevo al estrenarse — sobre
// los ejemplos de esta misma batería.
const TEXTO_BASE = 'Las consulltas telefónicas quedan registradas. a b c';

beforeEach(() => llamada.mockReset());

describe('el camino limpio', () => {
  it('⚠️ sin descartes, las dos claves salen en CERO — no ausentes', async () => {
    // El caso que la primera versión de esta pieza falló: escribía las claves
    // sólo si había algo que contar, así que una pasada limpia era
    // indistinguible de una anterior al cambio. Un cero que no se escribe no
    // se puede leer como confirmación.
    llamada.mockResolvedValue({ problems: [bueno] });
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores).toEqual({
      'averia.estilo_descartado_por_tipo': 0,
      'averia.estilo_descartado_sin_ancla': 0,
      'averia.estilo_cita_no_encontrada': 0,
    });
    expect(r.tiposDescartados).toEqual([]);
  });
});

describe('⚠️ descarte POR TIPO — la huella de un catálogo incompleto', () => {
  it('un tipo que no reconocemos se cuenta Y se nombra', async () => {
    llamada.mockResolvedValue({
      problems: [bueno, { type: 'puntuacion', title: 't', description: 'd', textRef: 'x' }],
    });
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

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
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

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
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

    expect(r.tiposDescartados).toEqual(['gramatica']);
    const serializado = JSON.stringify(r.tiposDescartados);
    expect(serializado).not.toContain('paciente');
    expect(serializado).not.toContain('literal');
  });

  it('una etiqueta larguísima se recorta antes de persistirla', async () => {
    llamada.mockResolvedValue({ problems: [{ type: 'x'.repeat(500), textRef: 'a' }] });
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

    expect(r.tiposDescartados[0].length).toBeLessThanOrEqual(40);
  });

  it('sin tipo ninguno también se cuenta, y se nombra como tal', async () => {
    llamada.mockResolvedValue({ problems: [{ textRef: 'a' }] });
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(1);
    expect(r.tiposDescartados).toEqual(['(sin tipo)']);
  });
});

describe('⚠️ descarte SIN ANCLA — la huella de una respuesta truncada', () => {
  it('un problema de tipo válido pero sin textRef cuenta en OTRO contador', async () => {
    llamada.mockResolvedValue({
      problems: [bueno, { type: 'ambiguedad', title: 't', description: 'd' }],
    });
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores['averia.estilo_descartado_sin_ancla']).toBe(1);
    // ⚠️ Y NO se cuenta como descarte por tipo: el tipo era bueno. La clave
    // está —siempre está— y vale CERO, que es lo que la hace legible.
    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(0);
    expect(r.tiposDescartados).toEqual([]);
  });

  it('un textRef en blanco cuenta igual que uno ausente', async () => {
    llamada.mockResolvedValue({ problems: [{ type: 'sugerencia', textRef: '   ' }] });
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

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
    const r = await analizarMirado(TEXTO_BASE, 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.contadores['averia.estilo_descartado_por_tipo']).toBe(1);
    expect(r.contadores['averia.estilo_descartado_sin_ancla']).toBe(1);
  });
});

describe('el fallo del modelo — ARREGLADO el 17/09/2026 (B.237, puerta 2)', () => {
  it('⚠️ una respuesta que revienta al leerse ya no es «lista vacía»: es NO SE PUDO MIRAR', async () => {
    // Devolver `null` hace que `parsed.problems` reviente DENTRO del `try`:
    // mismo camino de fallo, sin que el mock lance por su cuenta. Es el segundo
    // disparador —el primero, el mock que lanza, está en style-check-fallo.test.ts—.
    //
    // Hasta hoy este caso CONGELABA el fallo: comprobaba que salía `problemas: []`
    // y decía en el comentario que ese cero no se distinguía de «no hay
    // problemas». Ahora sí se distingue, y el caso comprueba lo contrario.
    llamada.mockResolvedValue(null);
    const r = await analyzeStyle(TEXTO_BASE, 'doc.txt');

    expect(r.estado).toBe('no_se_pudo_mirar');
    expect(r).not.toHaveProperty('problemas');
    // Y tampoco trae contadores: un cero de descartes diría «miré y no descarté»,
    // que sería falso. Lo que no se miró no tiene descartes que contar.
    expect(r).not.toHaveProperty('contadores');
  });
});

describe('⚠️ el candado de la temperatura', () => {
  it('es CERO, y moverla tiene que romper esto', async () => {
    const { TEMPERATURA_DEL_ESTILO } = await import('./style-check');
    expect(TEMPERATURA_DEL_ESTILO).toBe(0);
  });

  it('y es la que se le pasa al modelo, no una constante decorativa', async () => {
    // ⚠️ El caso que separa «está declarada» de «se usa». Una constante que
    // nadie pasa es un comentario con tipo: se puede bajar a cero y no cambiar
    // nada, y la suite seguiría verde.
    llamada.mockResolvedValue({ problems: [] });
    await analizarMirado(TEXTO_BASE, 'doc.txt');

    const opciones = llamada.mock.calls[0][1] as { temperature: number };
    expect(opciones.temperature).toBe(0);
  });
});

describe('⚠️ el desplazamiento de la cita — existencia e identidad', () => {
  const TEXTO = 'El paciente acude en ayunas. Las consulltas telefónicas se registran.';

  it('una cita que SÍ está guarda dónde está, y no cuenta avería', async () => {
    llamada.mockResolvedValue({
      problems: [{ type: 'ortografia', title: 't', description: 'd', textRef: 'consulltas' }],
    });
    const r = await analizarMirado(TEXTO, 'doc.txt');

    expect(r.problemas[0].offset).toBe(TEXTO.indexOf('consulltas'));
    expect(r.contadores['averia.estilo_cita_no_encontrada']).toBe(0);
  });

  it('⚠️ una cita PARAFRASEADA se cuenta, y el hallazgo NO se tira', async () => {
    // Hoy esto pasaba en silencio: se guardaba y el editor no sabía dónde
    // ponerlo. Descartarlo sería tirar un problema que puede ser bueno y estar
    // mal citado, y esa decisión no es de aquí.
    llamada.mockResolvedValue({
      problems: [{ type: 'ambiguedad', title: 't', description: 'd', textRef: 'el paciente ayuna' }],
    });
    const r = await analizarMirado(TEXTO, 'doc.txt');

    expect(r.problemas).toHaveLength(1);
    expect(r.problemas[0].offset).toBe(-1);
    expect(r.contadores['averia.estilo_cita_no_encontrada']).toBe(1);
  });

  it('⚠️ se busca sobre el texto RECORTADO, no sobre el entero', async () => {
    // Si se buscara en el original, una cita del final de un documento largo
    // «existiría» aunque el modelo no llegara a verla — y el offset señalaría a
    // un sitio que nunca estuvo en el prompt.
    const largo = 'a'.repeat(20000) + ' ZONA_QUE_NO_SE_ENVIA';
    llamada.mockResolvedValue({
      problems: [{ type: 'sugerencia', title: 't', description: 'd', textRef: 'ZONA_QUE_NO_SE_ENVIA' }],
    });
    const r = await analizarMirado(largo, 'doc.txt');

    expect(largo.indexOf('ZONA_QUE_NO_SE_ENVIA')).toBeGreaterThan(0);
    expect(r.problemas[0].offset).toBe(-1);
    expect(r.contadores['averia.estilo_cita_no_encontrada']).toBe(1);
  });

  it('dos citas distintas del MISMO sitio comparten posición — la identidad estable', async () => {
    // El caso medido: «la fecha en la que a sido subsanada» y «la fecha en la
    // que a sido» son el mismo error con distinto corte. Sus posiciones se
    // solapan; sus cadenas no coinciden.
    const t = 'Se anota la fecha en la que a sido subsanada por el responsable.';
    llamada.mockResolvedValue({
      problems: [
        { type: 'ortografia', title: 't', description: 'd', textRef: 'la fecha en la que a sido subsanada' },
        { type: 'ortografia', title: 't', description: 'd', textRef: 'la fecha en la que a sido' },
      ],
    });
    const r = await analizarMirado(t, 'doc.txt');

    expect(r.problemas[0].offset).toBe(r.problemas[1].offset);
    expect(r.contadores['averia.estilo_cita_no_encontrada']).toBe(0);
  });
});

describe('⚠️ la cita que cruza un salto de línea — el caso que el indexOf perdía', () => {
  it('se localiza, y NO cuenta como ausente', async () => {
    // Medido el 16/09/2026: con `indexOf` crudo, 46 de 113 citas reales salían
    // ausentes por esto. El documento lleva un salto donde el modelo devuelve
    // un espacio.
    const doc = 'anota la fecha en la que a\nsido subsanada por el responsable.';
    llamada.mockResolvedValue({
      problems: [{
        type: 'ortografia', title: 't', description: 'd',
        textRef: 'la fecha en la que a sido subsanada',
      }],
    });
    const r = await analizarMirado(doc, 'doc.txt');

    // El control negativo dentro del caso: así era hasta hoy.
    expect(doc.indexOf('la fecha en la que a sido subsanada')).toBe(-1);

    expect(r.contadores['averia.estilo_cita_no_encontrada']).toBe(0);
    expect(r.problemas[0].offset).toBe(doc.indexOf('la fecha en la que a'));
  });
});
