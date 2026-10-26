import { describe, expect, it } from 'vitest';
import { esConflictoNormativo } from './conflicto-normativo';
import { sanitizeJudgeContradictions } from './llm-boundary';
import { construirDiscrepancias } from './synthesize';
import type { DocumentJudgment } from './types';

/**
 * 3.4, FASE 1 (26/10/2026): el campo `conflictoNormativo` cruza la frontera y llega al sintetizador; un valor que no
 * conocemos se CUENTA; y sin el campo, todo queda como antes de la fase 1, sin una clave más.
 */
const base = { topic: 'quién puede ser la misma persona', newDocSays: 'puede delegar en otro profesional designado por él', existingDocSays: 'no pueden recaer en la misma persona', severity: 'contradiction' };
const juicio = (contradictions: DocumentJudgment['contradictions']): DocumentJudgment => ({
  documentId: 'd-cli12', documentName: 'CLI-12_manual.docx', source: 'manual', overlapPercent: 10, verdict: 'tema_similar',
  contradictions, overlappingContent: [], uniqueToNewDoc: [],
} as unknown as DocumentJudgment);

describe('la frontera: conflictoNormativo', () => {
  it('LOS DOS VALORES VÁLIDOS se copian tal cual, sin contar nada', () => {
    for (const v of ['norma_contra_norma', 'norma_contra_practica']) {
      const r = sanitizeJudgeContradictions([{ ...base, conflictoNormativo: v }]);
      expect(r.contradictions).toEqual([{ ...base, conflictoNormativo: v }]);
      expect(r.discarded).toEqual({});
    }
  });

  it('UN VALOR DESCONOCIDO se cuenta en su propio contador, el campo no se copia, y el hallazgo SIGUE', () => {
    const r = sanitizeJudgeContradictions([{ ...base, conflictoNormativo: 'norma_contra_ley' }, { ...base, conflictoNormativo: 7 }]);
    expect(r.contradictions).toEqual([base, base]);
    expect(r.discarded).toEqual({ 'frontera.conflicto_normativo_desconocido': 2 });
  });

  it('AUSENTE O NULL: la contradicción de siempre, sin clave nueva y sin contar nada', () => {
    const r = sanitizeJudgeContradictions([{ ...base }, { ...base, conflictoNormativo: null }]);
    expect(r.contradictions.map(c => Object.keys(c))).toEqual([Object.keys(base), Object.keys(base)]);
    expect(r.discarded).toEqual({});
  });

  it('un valor de severity no es un conflicto normativo: son dos campos que no se mezclan', () => {
    expect(esConflictoNormativo('contradiction')).toBe(false);
    expect(esConflictoNormativo('minor_inconsistency')).toBe(false);
    expect(esConflictoNormativo(undefined)).toBe(false);
  });
});

describe('el sintetizador: conflictoNormativo', () => {
  it('lo lleva a la discrepancia publicada cuando viene', () => {
    const [d] = construirDiscrepancias([juicio([{ ...base, severity: 'contradiction', conflictoNormativo: 'norma_contra_norma' }])]);
    expect(d.conflictoNormativo).toBe('norma_contra_norma');
  });

  it('SIN ÉL, la discrepancia no gana ninguna clave: ni siquiera una con undefined', () => {
    const [d] = construirDiscrepancias([juicio([{ ...base, severity: 'contradiction' }])]);
    expect('conflictoNormativo' in d).toBe(false);
  });
});
