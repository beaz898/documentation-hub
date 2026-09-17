import { describe, it, expect } from 'vitest';
import { documentosConFilaViva } from './rag-fila-viva';

/**
 * B.225 — EL CHAT NO SIRVE LO QUE YA NO TIENE FILA (17/09/2026).
 *
 * ⚠️ ESTA BATERÍA ES LA EVIDENCIA, y se escribe como tal: hoy no hay huérfanos
 * que ejercer en pantalla —el detector da cero—, así que no hay comprobación
 * posible en el producto. Si algún día el mutante «deja pasar el huérfano»
 * sobrevive, la guarda no está vigilada.
 */

const doc = (id: string) => ({ documentId: id, documentName: `${id}.pdf` });

describe('⚠️ el huérfano NO entra', () => {
  it('un documento sin fila se queda fuera del contexto', () => {
    const r = documentosConFilaViva([doc('vivo'), doc('huerfano')], new Set(['vivo']));
    expect(r.vivos.map(d => d.documentId)).toEqual(['vivo']);
    expect(r.sinFila.map(d => d.documentId)).toEqual(['huerfano']);
  });

  it('si TODOS son huérfanos, no entra ninguno', () => {
    const r = documentosConFilaViva([doc('a'), doc('b')], new Set());
    expect(r.vivos).toEqual([]);
    expect(r.sinFila).toHaveLength(2);
  });
});

describe('lo vivo entra entero, y en su orden', () => {
  it('con todas las filas, no se descarta nada', () => {
    const r = documentosConFilaViva([doc('a'), doc('b'), doc('c')], new Set(['a', 'b', 'c']));
    expect(r.vivos.map(d => d.documentId)).toEqual(['a', 'b', 'c']);
    expect(r.sinFila).toEqual([]);
  });

  it('el orden de los vivos se conserva: es el orden de relevancia', () => {
    const r = documentosConFilaViva([doc('c'), doc('x'), doc('a')], new Set(['a', 'c']));
    expect(r.vivos.map(d => d.documentId)).toEqual(['c', 'a']);
  });
});

describe('⚠️ si la consulta de filas FALLA, se deja pasar todo — como hasta hoy', () => {
  it('`null` no es «ninguna fila»: no se sabe, y no se descarta nada', () => {
    // La decisión de fallar cerrado es del director y está pendiente. Si
    // alguien la toma sin decirlo —tratando `null` como conjunto vacío—, cae aquí.
    const r = documentosConFilaViva([doc('a'), doc('b')], null);
    expect(r.vivos).toHaveLength(2);
    expect(r.sinFila).toEqual([]);
  });
});
