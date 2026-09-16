import { describe, it, expect } from 'vitest';
import {
  matchesContables,
  acumularVecinos,
  resumirVecindario,
  UMBRALES_DEL_CENSO,
  type Vecino,
} from './vecindario';
import type { VectorMatch } from '@/lib/pinecone/types';

const PROPIO = 'doc-propio';

function match(documentId: string, score: number, extra?: { generation?: number; documentName?: string }): VectorMatch {
  return {
    id: `${documentId}-0`,
    score,
    metadata: {
      text: 'x',
      documentId,
      documentName: extra?.documentName ?? `nombre de ${documentId}`,
      chunkIndex: 0,
      totalChunks: 1,
      orgId: 'org',
      ...(extra?.generation !== undefined ? { generation: extra.generation } : {}),
    },
  };
}

describe('matchesContables — qué entra en el censo', () => {
  it('excluye el documento propio, que siempre se encuentra a si mismo', () => {
    const { contables } = matchesContables(
      [match(PROPIO, 0.99), match('otro', 0.8)],
      PROPIO,
      new Map(),
    );
    expect(contables.map(c => c.documentId)).toEqual(['otro']);
  });

  it('descarta los matches sin metadata utilizable', () => {
    const sinMeta: VectorMatch = { id: 'x-0', score: 0.9 };
    const { contables } = matchesContables([sinMeta, match('otro', 0.8)], PROPIO, new Map());
    expect(contables).toHaveLength(1);
  });

  it('descarta los matches sin score — sin score no se puede contar contra un umbral', () => {
    const sinScore: VectorMatch = {
      id: 'y-0',
      metadata: {
        text: 'x', documentId: 'y', documentName: 'y', chunkIndex: 0, totalChunks: 1, orgId: 'org',
      },
    };
    const { contables } = matchesContables([sinScore, match('otro', 0.8)], PROPIO, new Map());
    expect(contables.map(c => c.documentId)).toEqual(['otro']);
  });

  it('descarta generaciones muertas Y LAS CUENTA — la caída no puede ser muda', () => {
    const activas = new Map([['viejo', 2]]);
    const { contables, deGeneracionMuerta } = matchesContables(
      [match('viejo', 0.9, { generation: 1 }), match('viejo', 0.8, { generation: 2 })],
      PROPIO,
      activas,
    );
    expect(contables.map(c => c.generation)).toEqual([2]);
    expect(deGeneracionMuerta).toBe(1);
  });

  it('la generacion ausente es la 1 implicita, no una exclusion', () => {
    const activas = new Map([['antiguo', 1]]);
    const { contables, deGeneracionMuerta } = matchesContables(
      [match('antiguo', 0.9)],
      PROPIO,
      activas,
    );
    expect(contables).toHaveLength(1);
    expect(deGeneracionMuerta).toBe(0);
  });

  it('un vecino del que no se sabe la generacion activa se CONSERVA — la ausencia de dato no es dato', () => {
    const { contables } = matchesContables([match('desconocido', 0.9, { generation: 7 })], PROPIO, new Map());
    expect(contables).toHaveLength(1);
  });
});

describe('acumularVecinos — un vecino se cuenta una vez, con su mejor parecido', () => {
  it('se queda con el score MAXIMO, no con el ultimo', () => {
    const mejores = new Map<string, Vecino>();
    acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.91 }]);
    acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.62 }]);
    expect(mejores.get('a')!.scoreMax).toBeCloseTo(0.91);
  });

  it('ocho trozos que encuentran al mismo vecino son UN vecino', () => {
    const mejores = new Map<string, Vecino>();
    for (let i = 0; i < 8; i++) {
      acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.5 + i / 100 }]);
    }
    expect(mejores.size).toBe(1);
    expect(mejores.get('a')!.scoreMax).toBeCloseTo(0.57);
  });
});

describe('resumirVecindario — los dos umbrales', () => {
  function mapaDe(pares: Array<[string, number]>): Map<string, Vecino> {
    const m = new Map<string, Vecino>();
    for (const [id, score] of pares) m.set(id, { documentId: id, documentName: id.toUpperCase(), scoreMax: score });
    return m;
  }

  it('cuenta por encima de 0,50 en `vecinos` y de 0,45 en `vecinos_045`', () => {
    const r = resumirVecindario(mapaDe([['a', 0.95], ['b', 0.61], ['c', 0.30]]));
    expect(r.vecinos).toBe(2);
    expect(r.vecinos_045).toBe(2);
  });

  it('⚠️ CONTROL POSITIVO: un vecino entre 0,45 y 0,50 sale SOLO en vecinos_045 — es exactamente lo que el exhaustivo compra', () => {
    const r = resumirVecindario(mapaDe([['a', 0.95], ['soloExhaustivo', 0.47]]));
    expect(r.vecinos).toBe(1);
    expect(r.vecinos_045).toBe(2);
    // La resta es la cifra que da sentido al censo: si esto deja de ser 1, el
    // censo ya no mide lo que dice medir.
    expect(r.vecinos_045 - r.vecinos).toBe(1);
  });

  it('el umbral es INCLUSIVO: un vecino clavado en 0,50 cuenta en los dos', () => {
    const r = resumirVecindario(mapaDe([['justo', UMBRALES_DEL_CENSO.vecinos]]));
    expect(r.vecinos).toBe(1);
    expect(r.vecinos_045).toBe(1);
  });

  it('y clavado en 0,45 cuenta solo en vecinos_045', () => {
    const r = resumirVecindario(mapaDe([['justo', UMBRALES_DEL_CENSO.vecinos_045]]));
    expect(r.vecinos).toBe(0);
    expect(r.vecinos_045).toBe(1);
  });

  it('sin vecinos: ceros y scoreMax 0, no undefined', () => {
    const r = resumirVecindario(new Map());
    expect(r).toEqual({ vecinos: 0, vecinos_045: 0, scoreMax: 0, detalle: [] });
  });

  it('scoreMax es el mayor AUNQUE no llegue a ningun umbral — distingue «no se parece a nadie» de «se parece poco»', () => {
    const r = resumirVecindario(mapaDe([['a', 0.31], ['b', 0.22]]));
    expect(r.vecinos_045).toBe(0);
    expect(r.scoreMax).toBeCloseTo(0.31);
  });

  it('el detalle va de mayor a menor y solo trae los que pasan 0,45', () => {
    const r = resumirVecindario(mapaDe([['bajo', 0.2], ['medio', 0.55], ['alto', 0.9]]));
    expect(r.detalle.map(v => v.documentId)).toEqual(['alto', 'medio']);
  });

  it('los umbrales publicados son los del retrieval, no una copia', () => {
    expect(UMBRALES_DEL_CENSO.vecinos).toBe(0.5);
    expect(UMBRALES_DEL_CENSO.vecinos_045).toBe(0.45);
    expect(UMBRALES_DEL_CENSO.vecinos).toBeGreaterThan(UMBRALES_DEL_CENSO.vecinos_045);
  });
});
