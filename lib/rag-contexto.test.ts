import { describe, it, expect } from 'vitest';
import { buildContext } from './rag';

/**
 * EL CONTEXTO QUE SE LE DA AL MODELO — 14/09/2026.
 *
 * ⚠️ POR QUÉ EXISTE ESTA BATERÍA Y NO EXISTÍA ANTES: escribiendo la búsqueda por
 * nombre, una edición mecánica borró la línea que acumula `totalChars`. El
 * compilador no dijo nada (la variable seguía declarada y leída) y las 961
 * pruebas pasaron enteras, porque **ninguna miraba el tope de contexto**. El
 * efecto era que el límite de 30.000 caracteres dejaba de aplicarse.
 *
 * Un límite declarado sin prueba es un límite que se puede borrar sin que nadie
 * se entere. Aquí está la suya.
 */

const doc = (id: string, name: string, porNombre = false) =>
  ({ documentId: id, documentName: name, maxScore: 0.8, porNombre });

describe('la marca de «lo nombraste tú»', () => {
  it('un documento traído por similitud NO lleva marca', () => {
    const ctx = buildContext([doc('a', 'informe.txt')], new Map([['a', 'contenido']]), []);
    expect(ctx).toContain('[Documento: informe.txt]');
    expect(ctx).not.toContain('LO NOMBRÓ');
  });

  it('⚠️ CONTROL POSITIVO: uno traído por su nombre SÍ la lleva', () => {
    const ctx = buildContext([doc('a', 'informe.txt', true)], new Map([['a', 'contenido']]), []);
    expect(ctx).toContain('INCLUIDO PORQUE EL USUARIO LO NOMBRÓ');
  });

  it('los dos a la vez se distinguen dentro del mismo contexto', () => {
    const ctx = buildContext(
      [doc('a', 'uno.txt'), doc('b', 'dos.txt', true)],
      new Map([['a', 'AAA'], ['b', 'BBB']]),
      [],
    );
    expect(ctx).toContain('[Documento: uno.txt]');
    expect(ctx).toContain('[Documento: dos.txt — INCLUIDO PORQUE EL USUARIO LO NOMBRÓ]');
  });
});

describe('un documento nombrado del que no se puede leer nada', () => {
  it('no se calla: se dice que existe y que no se pudo recuperar', () => {
    // Sin full_text y sin trozos que casen: el cuerpo saldría vacío.
    const ctx = buildContext([doc('a', 'informe.txt', true)], new Map(), []);
    expect(ctx).toContain('INCLUIDO PORQUE EL USUARIO LO NOMBRÓ');
    expect(ctx).toContain('no se ha podido recuperar su contenido');
  });
});

describe('⚠️ el tope de contexto — el que se borró sin que nadie lo notara', () => {
  it('trunca cuando un documento no cabe entero', () => {
    const enorme = 'x'.repeat(40000);
    const ctx = buildContext([doc('a', 'gordo.txt')], new Map([['a', enorme]]), []);
    expect(ctx).toContain('[... documento truncado por longitud]');
    expect(ctx.length).toBeLessThan(40000);
  });

  it('⚠️ EL ACUMULADOR CUENTA ENTRE DOCUMENTOS, no solo dentro de uno', () => {
    // Éste es EXACTAMENTE el caso que el borrado de `totalChars +=` dejaba pasar:
    // con el acumulador en cero, cada documento se mide contra el tope como si
    // fuera el primero y los tres entran enteros.
    const grande = 'y'.repeat(20000);
    const ctx = buildContext(
      [doc('a', 'a.txt'), doc('b', 'b.txt'), doc('c', 'c.txt')],
      new Map([['a', grande], ['b', grande], ['c', grande]]),
      [],
    );
    expect(ctx.length).toBeLessThan(60000);
  });

  it('CONTROL NEGATIVO: lo que cabe holgadamente no se toca', () => {
    const ctx = buildContext([doc('a', 'corto.txt')], new Map([['a', 'apenas nada']]), []);
    expect(ctx).not.toContain('truncado');
    expect(ctx).toContain('apenas nada');
  });
});

describe('el respaldo por trozos cuando no hay texto completo', () => {
  it('reconstruye desde los trozos y los ordena', () => {
    const ctx = buildContext(
      [doc('a', 'informe.txt')],
      new Map(),
      [
        { metadata: { documentId: 'a', text: 'SEGUNDO', chunkIndex: 1 } },
        { metadata: { documentId: 'a', text: 'PRIMERO', chunkIndex: 0 } },
      ],
    );
    expect(ctx.indexOf('PRIMERO')).toBeLessThan(ctx.indexOf('SEGUNDO'));
  });
});
