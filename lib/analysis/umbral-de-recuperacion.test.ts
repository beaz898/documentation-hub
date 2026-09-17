import { describe, it, expect } from 'vitest';
import { pasaElUmbral, candidatosPerdidosPorUmbral, cortarALosMasAfines } from './umbral-de-recuperacion';
import { SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE, MAX_CANDIDATOS_DE_RECUPERACION } from './retrieval';

/**
 * B.248, PRIMER TIEMPO (17/09/2026) — LOS CASOS DECISIVOS DE DOS CONSTANTES QUE
 * NO TENÍAN NINGUNO.
 *
 * ⚠️ POR QUÉ SE IMPORTAN LAS CONSTANTES REALES y no se copian los números: el caso
 * decisivo existe para que CAMBIAR LA CONSTANTE rompa algo. Con un 0,50 copiado
 * aquí, alguien movería el de `retrieval.ts` y esta batería seguiría en verde. Es
 * la regla que salió de F-108, y ésta es su primera aplicación a la constante que
 * la originó.
 *
 * ⚠️ Y LO QUE ESTOS CASOS NO DICEN: que 0,50 sea un buen valor. Dicen que es EL
 * valor en uso, y que el día que se cambie, se cambia a sabiendas.
 */

describe('⚠️ EL CASO DECISIVO DEL UMBRAL — mover el 0,50 tiene que romper esto', () => {
  it('rápido: un fragmento a 0,49 NO pasa, uno a 0,51 SÍ', () => {
    expect(pasaElUmbral(0.49, SCORE_THRESHOLD_QUICK)).toBe(false);
    expect(pasaElUmbral(0.51, SCORE_THRESHOLD_QUICK)).toBe(true);
  });

  it('exhaustivo: un fragmento a 0,44 NO pasa, uno a 0,46 SÍ', () => {
    expect(pasaElUmbral(0.44, SCORE_THRESHOLD_EXHAUSTIVE)).toBe(false);
    expect(pasaElUmbral(0.46, SCORE_THRESHOLD_EXHAUSTIVE)).toBe(true);
  });

  it('el borde exacto pasa: el umbral es «como mínimo», no «más que»', () => {
    expect(pasaElUmbral(SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_QUICK)).toBe(true);
  });
});

describe('⚠️ el contador cuenta DOCUMENTOS perdidos, no fragmentos', () => {
  it('un documento con TODOS sus fragmentos bajo el umbral cuenta como perdido', () => {
    expect(candidatosPerdidosPorUmbral({
      idsConFragmentoBajoUmbral: ['a', 'a', 'b'],
      idsConFragmentoAceptado: ['b'],
    })).toBe(1);
  });

  it('un documento con UN fragmento aceptado NO está perdido, aunque otros bajaran', () => {
    expect(candidatosPerdidosPorUmbral({
      idsConFragmentoBajoUmbral: ['a', 'a'],
      idsConFragmentoAceptado: ['a'],
    })).toBe(0);
  });

  it('el documento excluido a propósito no cuenta como perdido por el umbral', () => {
    expect(candidatosPerdidosPorUmbral({
      idsConFragmentoBajoUmbral: ['yo-mismo'],
      idsConFragmentoAceptado: [],
      excluido: 'yo-mismo',
    })).toBe(0);
  });
});

describe('⚠️ EL CASO DECISIVO DEL CORTE DE 25 — mover el tope tiene que romper esto', () => {
  const candidatos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i, maxScore: 1 - i / 100 }));

  it('uno más que el tope: queda exactamente el tope, y se cuenta UN cortado', () => {
    const r = cortarALosMasAfines(candidatos(MAX_CANDIDATOS_DE_RECUPERACION + 1), MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos).toHaveLength(25);
    expect(r.cortados).toBe(1);
  });

  it('se quedan los MÁS afines, y cae el menos afín', () => {
    const lista = candidatos(26).reverse();
    const r = cortarALosMasAfines(lista, MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos.map(c => c.id)).not.toContain(25);
    expect(r.candidatos[0].id).toBe(0);
  });

  it('por debajo del tope no corta nada, y el cero se escribe igual', () => {
    const r = cortarALosMasAfines(candidatos(3), MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos).toHaveLength(3);
    expect(r.cortados).toBe(0);
  });
});
