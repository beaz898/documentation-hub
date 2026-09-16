import { describe, it, expect, vi } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import {
  resolverSeleccion,
  repartoConModelo,
  contadoresDelReparto,
  escribirContadoresDelReparto,
  elRepartoCuadra,
  type RepartoConModelo,
} from './reparto-del-rerank';
import { rerankCandidates } from './rerank';
import type { CandidateDocument } from './types';
import type { PipelineCounters } from './counters';

/** Resuelve y reparte por el MISMO camino que `rerank.ts`. */
const repartir = (
  idsRecuperados: string[],
  idsDevueltosPorElModelo: string[],
  maxSelected = 6,
): RepartoConModelo => {
  const candidatos = idsRecuperados.map(documentId => ({ documentId }));
  const r = resolverSeleccion(candidatos, idsDevueltosPorElModelo.map(documentId => ({ documentId })));
  return repartoConModelo({
    recuperados: new Set(idsRecuperados).size,
    elegidosPorElModelo: r.resueltos.length,
    idsNoReconocidos: r.idsNoReconocidos,
    repetidos: r.repetidos,
    maxSelected,
  });
};

describe('⚠️ LA PASADA REAL DEL DIRECTOR: tres candidatos, dos comparados, tope 6', () => {
  it('el tope NO fue: el tercero cayó por criterio', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'b']);
    expect(r.cortadosPorTope).toBe(0);
    expect(r.descartadosPorCriterio).toBe(1);
    expect(r.idsNoReconocidos).toBe(0);
  });

  it('⚠️ Y ES EXACTAMENTE LO QUE EL AVISO NO PODÍA SABER: la resta vale 1 en los dos casos', () => {
    const porCriterio = repartir(['a', 'b', 'c'], ['a', 'b']);
    const porTope     = repartir(['a', 'b', 'c'], ['a', 'b', 'c'], 2);
    expect(porCriterio.recuperados - (porCriterio.elegidosPorElModelo - porCriterio.cortadosPorTope)).toBe(1);
    expect(porTope.recuperados - (porTope.elegidosPorElModelo - porTope.cortadosPorTope)).toBe(1);
    expect(porCriterio.descartadosPorCriterio).toBe(1);
    expect(porCriterio.cortadosPorTope).toBe(0);
    expect(porTope.descartadosPorCriterio).toBe(0);
    expect(porTope.cortadosPorTope).toBe(1);
  });
});

describe('⚠️ LA VÍA MUDA: ids que no casan con ningún candidato', () => {
  it('se cuenta, y ya no es silencio', () => {
    expect(repartir(['a', 'b', 'c'], ['a', 'inventado']).idsNoReconocidos).toBe(1);
  });

  it('⚠️ Y CONTAMINA «POR CRITERIO», que es lo que hay que poder leer', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'id-que-no-existe']);
    expect(r.descartadosPorCriterio).toBe(2);
    expect(r.idsNoReconocidos).toBe(1);
  });

  it('su CERO es la noticia buena y se escribe igual', () => {
    const r = repartir(['a', 'b'], ['a', 'b']);
    expect(r.idsNoReconocidos).toBe(0);
    expect(r).toHaveProperty('idsNoReconocidos');
  });

  it('varios ids inventados se cuentan todos', () => {
    const r = repartir(['a'], ['x', 'y', 'z']);
    expect(r.idsNoReconocidos).toBe(3);
    expect(r.elegidosPorElModelo).toBe(0);
    expect(r.descartadosPorCriterio).toBe(1);
  });
});

describe('el tope, sobre lo que el modelo eligió de verdad', () => {
  it('siete elegidos y tope seis: uno cortado', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const r = repartir(ids, ids, 6);
    expect(r.elegidosPorElModelo).toBe(7);
    expect(r.cortadosPorTope).toBe(1);
    expect(r.descartadosPorCriterio).toBe(0);
  });

  it('no se corta lo que el modelo no eligió — el tope opera DESPUÉS del criterio', () => {
    const diez = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const r = repartir(diez, ['a', 'b', 'c'], 6);
    expect(r.cortadosPorTope).toBe(0);
    expect(r.descartadosPorCriterio).toBe(7);
  });

  it('nunca negativo con tope mayor que los elegidos', () => {
    expect(repartir(['a'], ['a'], 25).cortadosPorTope).toBe(0);
  });
});

describe('repeticiones del modelo — un documento nombrado dos veces no vale por dos', () => {
  it('no infla los elegidos, y se CUENTAN', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'a', 'b']);
    expect(r.elegidosPorElModelo).toBe(2);
    expect(r.descartadosPorCriterio).toBe(1);
    expect(r.idsNoReconocidos).toBe(0);
    expect(r.repetidos).toBe(1);
  });

  it('⚠️ la resolución devuelve cada candidato UNA vez, en el orden de su primera aparición', () => {
    const r = resolverSeleccion(
      [{ documentId: 'a' }, { documentId: 'b' }],
      [{ documentId: 'b' }, { documentId: 'a' }, { documentId: 'b' }, { documentId: 'a' }],
    );
    expect(r.resueltos.map(x => x.candidato.documentId)).toEqual(['b', 'a']);
    expect(r.repetidos).toBe(2);
  });

  it('un candidato repetido en la entrada tampoco cuenta dos veces', () => {
    const r = repartir(['a', 'a', 'b'], ['a']);
    expect(r.recuperados).toBe(2);
    expect(r.descartadosPorCriterio).toBe(1);
  });
});

describe('⚠️ LA INVARIANTE: no hay un tercer sitio por donde caerse — con modelo', () => {
  it('recuperados === criterio + elegidos, en todos los casos de arriba', () => {
    const casos = [
      repartir(['a', 'b', 'c'], ['a', 'b']),
      repartir(['a', 'b', 'c'], ['a', 'id-falso']),
      repartir(['a'], ['x', 'y', 'z']),
      repartir(['a', 'b', 'c'], ['a', 'a', 'b']),
      repartir([], []),
      repartir(['a', 'b', 'c', 'd', 'e', 'f', 'g'], ['a', 'b', 'c', 'd', 'e', 'f', 'g'], 6),
    ];
    for (const c of casos) expect(elRepartoCuadra(c)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// A NIVEL DE `rerankCandidates`, con el modelo simulado. Estos casos existen
// porque el fallo de B.253 NO estaba en el reparto: estaba en que el rerank
// resolvía por su cuenta. Una batería sólo del reparto lo habría dejado pasar.
// ════════════════════════════════════════════════════════════════════════

function candidato(id: string, score = 0.9): CandidateDocument {
  return {
    documentId: id,
    documentName: `${id}.md`,
    source: 'manual',
    maxScore: score,
    fragments: [{ text: 't', documentId: id, documentName: `${id}.md`, source: 'manual', score, chunkIndex: 0 }],
  };
}

const elige = (...ids: string[]) => ({
  selected: ids.map(documentId => ({ documentId, confidence: 'alta', reason: 'r' })),
});

async function rerank(candidatos: CandidateDocument[], exhaustive = false) {
  return rerankCandidates({
    newDocumentName: 'nuevo.md',
    newDocumentSample: 'texto',
    candidates: candidatos,
    options: { exhaustive },
  });
}


describe('⚠️ B.253 — EL DUPLICADO NO ES UN PROBLEMA DE CUENTAS', () => {
  it('[A, A, B] manda A al juez UNA vez, no dos', async () => {
    llamada.mockResolvedValue(elige('a', 'a', 'b'));
    const r = await rerank([candidato('a'), candidato('b'), candidato('c')]);
    expect(r.seleccionados.map(c => c.documentId).sort()).toEqual(['a', 'b']);
  });

  it('⚠️ y la repetición ya no le QUITA LA PLAZA a otro documento', async () => {
    // Seis documentos distintos elegidos y uno repetido, tope seis. Antes: siete
    // entradas, el corte tiraba a uno de los seis para dejar sitio al repetido.
    llamada.mockResolvedValue(elige('a', 'a', 'b', 'c', 'd', 'e', 'f'));
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const r = await rerank(ids.map(id => candidato(id)));
    expect(r.seleccionados).toHaveLength(6);
    expect(new Set(r.seleccionados.map(c => c.documentId))).toEqual(new Set(ids));
  });

  it('⚠️ la selección y el reparto cuentan LO MISMO — una resolución, no dos', async () => {
    llamada.mockResolvedValue(elige('a', 'a', 'b', 'inventado'));
    const r = await rerank([candidato('a'), candidato('b'), candidato('c')]);
    if (r.reparto.origen !== 'modelo') throw new Error('debería haber modelo');
    expect(r.reparto.elegidosPorElModelo - r.reparto.cortadosPorTope).toBe(r.seleccionados.length);
    expect(r.reparto.repetidos).toBe(1);
    expect(r.reparto.idsNoReconocidos).toBe(1);
    expect(r.reparto.descartadosPorCriterio).toBe(1);
  });
});

describe('⚠️ B.254 — EN EL FALLBACK NO HUBO CRITERIO, Y EL CONTADOR QUEDA AUSENTE', () => {
  it('si el modelo falla, el reparto es de la forma SIN modelo', async () => {
    llamada.mockImplementation(async () => { throw new Error('529'); });
    const r = await rerank(['a', 'b', 'c', 'd', 'e'].map(id => candidato(id)));
    expect(r.reparto.origen).toBe('fallback');
    expect(r.reparto).not.toHaveProperty('descartadosPorCriterio');
    expect(r.seleccionados).toHaveLength(3);
  });

  it('⚠️ `descartadosPorCriterio` vuelve UNDEFINED — ni cero ni la resta recuperados − 3', async () => {
    llamada.mockImplementation(async () => { throw new Error('529'); });
    const r = await rerank(['a', 'b', 'c', 'd', 'e'].map(id => candidato(id)));
    const c = contadoresDelReparto(r.reparto);
    // Si alguien lo «simplifica» a 0, o vuelve a la resta (2), cae aquí.
    expect(c.descartadosPorCriterio).toBeUndefined();
    expect(c.descartadosPorCriterio).not.toBe(0);
    expect(c.descartadosPorCriterio).not.toBe(2);
  });

  it('los otros tres SÍ valen 0 en el fallback, y ese cero es verdad', () => {
    const c = contadoresDelReparto({ origen: 'fallback', recuperados: 5, seleccionadosPorScore: 3 });
    expect(c).toEqual({ cortadosPorTope: 0, idsNoReconocidos: 0, repetidos: 0, descartadosPorCriterio: undefined });
  });

  it('⚠️ LA ESCRITURA REAL: en el fallback la clave NO EXISTE en los contadores', () => {
    const counters: PipelineCounters = {};
    escribirContadoresDelReparto(counters, { origen: 'fallback', recuperados: 5, seleccionadosPorScore: 3 });
    // Si alguien escribe `?? 0` o vuelve a la resta, la clave aparece y cae aquí.
    expect(counters).not.toHaveProperty(['seleccion.candidatos_descartados_por_criterio']);
    expect(counters['seleccion.candidatos_cortados_por_tope']).toBe(0);
  });

  it('con modelo, la clave del criterio SE ESCRIBE aunque valga cero', () => {
    const counters: PipelineCounters = {};
    escribirContadoresDelReparto(counters, repartir(['a', 'b'], ['a', 'b']));
    expect(counters['seleccion.candidatos_descartados_por_criterio']).toBe(0);
    expect(counters['seleccion.candidatos_repetidos_por_el_modelo']).toBe(0);
  });

  it('con modelo, el criterio se escribe SIEMPRE, incluido el cero', () => {
    const c = contadoresDelReparto(repartir(['a', 'b'], ['a', 'b']));
    expect(c.descartadosPorCriterio).toBe(0);
  });
});
