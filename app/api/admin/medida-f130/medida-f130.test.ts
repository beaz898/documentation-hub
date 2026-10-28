import { describe, expect, it } from 'vitest';
import {
  CADUCA_EL, PAREJA_DE_E3, PREGUNTA_CERRADA, TROZOS, VECES_DE_E3,
  construirPrompt, contarFiguras, correspondencia, coseno, estaCaducada, puestos,
} from './medida-f130';

/**
 * LAS DOS HERRAMIENTAS TEMPORALES DE F-130 (29/10/2026): lo que se puede comprobar sin red. Se borra con la carpeta.
 */
describe('las medidas temporales de F-130', () => {
  it('CADUCAN SOLAS: antes de la fecha funcionan, desde la fecha no', () => {
    const fecha = new Date(CADUCA_EL).getTime();
    expect(estaCaducada(new Date(fecha - 1))).toBe(false);
    expect(estaCaducada(new Date(fecha))).toBe(true);
  });

  it('LA PREGUNTA ES DEL ARQUITECTO: vacía hasta que la mande, y sin ella no se arma ningún prompt', () => {
    expect(PREGUNTA_CERRADA).toBe('');
    expect(construirPrompt(PREGUNTA_CERRADA, 'a', 'b')).toEqual({ ok: false, motivo: 'la pregunta cerrada está vacía: pendiente del arquitecto' });
  });

  it('EL PROMPT: cada marca exactamente una vez, y los textos entran tal cual, también con «$»', () => {
    expect(construirPrompt('P {{TEXTO_1}} Q {{TEXTO_2}}', 'uno $& dos', 'tres')).toEqual({ ok: true, prompt: 'P uno $& dos Q tres' });
    expect(construirPrompt('P {{TEXTO_1}}', 'a', 'b')).toEqual({ ok: false, motivo: 'la marca {{TEXTO_2}} sale 0 veces y tiene que salir una' });
    expect(construirPrompt('{{TEXTO_1}} {{TEXTO_1}} {{TEXTO_2}}', 'a', 'b')).toEqual({ ok: false, motivo: 'la marca {{TEXTO_1}} sale 2 veces y tiene que salir una' });
  });

  it('E3 EN LA CONDICIÓN REALISTA: el par NOR-10·4 ↔ CLI-12·3, siete veces', () => {
    expect([TROZOS[PAREJA_DE_E3.analizado], TROZOS[PAREJA_DE_E3.candidato]].map(t => [t.codigo, t.trozo])).toEqual([['NOR-10', 4], ['CLI-12', 3]]);
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
