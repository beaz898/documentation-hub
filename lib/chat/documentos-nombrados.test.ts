import { describe, it, expect } from 'vitest';
import {
  documentosNombrados,
  laPreguntaPodriaNombrarUnFichero,
  normalizarParaNombre,
} from './documentos-nombrados';

/**
 * ⚠️ LO QUE ESTA BATERÍA TIENE QUE DEMOSTRAR NO ES QUE ENCUENTRE: ES QUE **NO
 * ENCUENTRA DE MÁS**. El riesgo de esta pieza no es quedarse corta —quedarse
 * corta es el comportamiento de ayer— sino que una pregunta normal acabe
 * resolviéndose contra la lista. Por eso hay más casos negativos que positivos.
 */

const CORPUS = [
  { id: 'a', name: 'informe.txt' },
  { id: 'b', name: 'Facturación_2025.xlsx' },
  { id: 'c', name: 'informe.txt (corregido 14/09/2026)' },
  { id: 'd', name: 'Contrato' },
];

describe('lo que SÍ nombra', () => {
  it('encuentra el nombre escrito literal', () => {
    const r = documentosNombrados('¿qué dice informe.txt?', CORPUS);
    expect(r.map(d => d.id)).toContain('a');
  });

  it('ignora mayúsculas y acentos', () => {
    const r = documentosNombrados('resúmeme FACTURACION_2025.XLSX por favor', CORPUS);
    expect(r.map(d => d.id)).toEqual(['b']);
  });

  it('el nombre con paréntesis y fecha también se encuentra', () => {
    const r = documentosNombrados('abre informe.txt (corregido 14/09/2026)', CORPUS);
    // Los dos casan; el más específico va delante.
    expect(r[0].id).toBe('c');
    expect(r.map(d => d.id)).toContain('a');
  });

  it('el nombre en medio de una frase larga', () => {
    const r = documentosNombrados(
      'oye, necesito que compares lo que pone en informe.txt con lo que me dijiste ayer',
      CORPUS,
    );
    expect(r.map(d => d.id)).toEqual(['a']);
  });
});

describe('⚠️ lo que NO debe nombrar — el riesgo de esta pieza', () => {
  it('CONTROL: una pregunta normal sobre el contenido no nombra nada', () => {
    expect(documentosNombrados('¿cuál es el plazo de entrega?', CORPUS)).toEqual([]);
  });

  it('el nombre SIN extensión no cuenta, aunque el documento se llame así', () => {
    // «Contrato» existe en el corpus y la pregunta lo dice. No se activa:
    // es la decisión de la opción A, y es la que evita comerse preguntas.
    expect(documentosNombrados('¿qué dice el contrato?', CORPUS)).toEqual([]);
  });

  it('el nombre a medias no cuenta', () => {
    expect(documentosNombrados('¿qué dice el informe?', CORPUS)).toEqual([]);
  });

  it('un corpus vacío no nombra nada', () => {
    expect(documentosNombrados('informe.txt', [])).toEqual([]);
  });

  it('una pregunta vacía no nombra nada', () => {
    expect(documentosNombrados('', CORPUS)).toEqual([]);
    expect(documentosNombrados('   ', CORPUS)).toEqual([]);
  });

  it('filas con nombre basura no revientan ni casan', () => {
    const sucio = [
      { id: 'x', name: '' },
      { id: 'y', name: '   ' },
      { id: 'z', name: null as unknown as string },
    ];
    expect(documentosNombrados('informe.txt', sucio)).toEqual([]);
  });
});

describe('la condición necesaria, que es la que ahorra la consulta', () => {
  it('una pregunta con un nombre de fichero la pasa', () => {
    expect(laPreguntaPodriaNombrarUnFichero('¿qué dice informe.txt?')).toBe(true);
  });

  it('una pregunta normal NO la pasa — y ahí se ahorra la consulta', () => {
    expect(laPreguntaPodriaNombrarUnFichero('¿cuál es el plazo de entrega?')).toBe(false);
  });

  it('⚠️ NUNCA descarta un caso que sí habría casado', () => {
    // La propiedad que la hace segura: si `documentosNombrados` encuentra algo,
    // la condición necesaria TENÍA que haber dado true. Se comprueba sobre todos
    // los nombres del corpus, no sobre uno elegido a mano.
    for (const doc of CORPUS) {
      const pregunta = `dime algo de ${doc.name}`;
      const encontrados = documentosNombrados(pregunta, CORPUS);
      if (encontrados.length > 0) {
        expect(laPreguntaPodriaNombrarUnFichero(pregunta)).toBe(true);
      }
    }
  });

  it('un punto decimal suelto no basta', () => {
    // «3.5» no parece extensión: dos cifras tras el punto sí entran en el
    // patrón, así que esto DOCUMENTA que la condición es laxa a propósito —
    // barata y necesaria, no precisa. Si diera false aquí, podría descartar un
    // caso bueno.
    expect(laPreguntaPodriaNombrarUnFichero('¿el margen es del 3.50?')).toBe(true);
  });
});

describe('normalizarParaNombre', () => {
  it('quita acentos y baja a minúsculas sin tocar puntos ni guiones', () => {
    expect(normalizarParaNombre('  Facturación_2025.XLSX  ')).toBe('facturacion_2025.xlsx');
  });
});
