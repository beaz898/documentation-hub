import { describe, expect, it } from 'vitest';
import {
  CADUCA_EL, PAREJAS_DE_E3, PREGUNTA_CERRADA, TROZOS, VECES_DE_E3,
  construirPrompt, contarFiguras, correspondencia, coseno, estaCaducada, puestos,
} from './medida-f130';

/**
 * LAS DOS HERRAMIENTAS TEMPORALES DE F-130 (28/10/2026): lo que se puede comprobar sin red. Se borra con la carpeta.
 */
const PAREJA = { documento1: 'NOR-10_x.docx', trozoA: 4, textoA: 'a', documento2: 'CLI-12_x.docx', trozoB: 3, textoB: 'b' };

describe('las medidas temporales de F-130', () => {
  it('CADUCAN SOLAS: antes de la fecha funcionan, desde la fecha no', () => {
    const fecha = new Date(CADUCA_EL).getTime();
    expect(estaCaducada(new Date(fecha - 1))).toBe(false);
    expect(estaCaducada(new Date(fecha))).toBe(true);
  });

  it('SIN CRITERIO DEL CUMPLIMIENTO no se arma ningún prompt', () => {
    expect(construirPrompt(PAREJA, '  ')).toEqual({ ok: false, motivo: 'el criterio del cumplimiento está vacío' });
  });

  it('LA PREGUNTA, literal del arquitecto: DOS preguntas, lo que obliga a contestar las dos, y QUÉ RESPUESTA ES EL HALLAZGO en cada una', () => {
    expect(PREGUNTA_CERRADA).toContain('Contesta a LAS DOS preguntas. Las dos son obligatorias.\n');
    expect(PREGUNTA_CERRADA).toContain('CONTESTAR A UNA NO TE EXIME DE CONTESTAR A LA OTRA, ni cuando tu respuesta señale un hallazgo ni cuando no lo señale.');
    expect(PREGUNTA_CERRADA).toContain('PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nHAY HALLAZGO SI LA RESPUESTA ES «SÍ». Si es sí, cita la frase literal de cada lado. Si es no, contesta «no» y pasa a la 2.');
    expect(PREGUNTA_CERRADA).toContain('PREGUNTA 2 · EL CUMPLIMIENTO\n{{CRITERIO_DEL_CUMPLIMIENTO}}\nHAY HALLAZGO SI LA RESPUESTA ES «NO»: si NO se pueden cumplir las dos a la vez. Si es «no», cita la frase literal de cada lado y di cuál de las dos etiquetas es, "norma_contra_norma" o "norma_contra_practica". Si se pueden cumplir, contesta «sí» y no cites nada.');
    expect(PREGUNTA_CERRADA).not.toContain('TRES');
  });

  it('EL PROMPT: cada marca en su sitio, los textos tal cual (también con «$» o con una marca dentro), y la pareja siempre la 1', () => {
    const r = construirPrompt({ ...PAREJA, textoA: 'uno $& dos', textoB: 'trae {{CRITERIO_DEL_CUMPLIMIENTO}} dentro' }, 'EL CRITERIO');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.prompt.startsWith('PAREJA 1: NOR-10_x.docx, trozo 4 ↔ CLI-12_x.docx, trozo 3\n\nuno $& dos\n\ntrae {{CRITERIO_DEL_CUMPLIMIENTO}} dentro\n\n')).toBe(true);
    expect(r.prompt).toContain('PREGUNTA 2 · EL CUMPLIMIENTO\nEL CRITERIO\nHAY HALLAZGO SI LA RESPUESTA ES «NO»');
    expect(r.prompt).not.toMatch(/\{\{(N|DOC_1|TROZO_A|DOC_2|TROZO_B|TEXTO_A|TEXTO_B)\}\}/);
  });

  it('E3 EN LA CONDICIÓN REALISTA Y CON LAS DOS PAREJAS: NOR-10·4 ↔ CLI-12·3 y NOR-10·4 ↔ CLI-12·6, siete veces cada una', () => {
    expect(PAREJAS_DE_E3.map(p => [TROZOS[p.analizado], TROZOS[p.candidato]].map(t => `${t.codigo}·${t.trozo}`))).toEqual([['NOR-10·4', 'CLI-12·3'], ['NOR-10·4', 'CLI-12·6']]);
    expect(VECES_DE_E3).toBe(7);
  });

  it('LAS FIGURAS, contadas con y sin encabezados', () => {
    expect(contarFiguras('## 2.4. Coordinador de Calidad\nEl Coordinador de Calidad y el Director Clínico.')).toEqual({
      'Coordinador de Calidad': { total: 2, fueraDeEncabezados: 1 },
      'Director Clínico': { total: 1, fueraDeEncabezados: 1 },
    });
  });

  it('EL COSENO, y nulo cuando no se puede calcular', () => {
    expect(coseno([1, 0], [1, 0])).toBe(1);
    expect(coseno([1, 0], [0, 1])).toBe(0);
    expect(coseno([], [])).toBeNull();
    expect(coseno([1, 2], [1])).toBeNull();
    expect(coseno([0, 0], [1, 1])).toBeNull();
  });

  it('LA CORRESPONDENCIA POR TEXTO: igual, sin texto, o dónde se separan', () => {
    expect(correspondencia('abc', 'abc')).toEqual({ estado: 'igual' });
    expect(correspondencia(undefined, 'abc')).toEqual({ estado: 'sin_texto_en_el_vector' });
    expect(correspondencia('abX', 'abcd')).toEqual({ estado: 'distinto', separaEn: 2, largoVector: 3, largoBase: 4 });
  });

  it('LOS PUESTOS, desde 1, y nulo si no salió', () => {
    expect(puestos(['x', 'y', 'z'], ['z', 'w'])).toEqual({ z: 3, w: null });
  });
});
