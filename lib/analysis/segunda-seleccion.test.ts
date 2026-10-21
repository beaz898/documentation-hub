import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { buildUnits, indiceDelAnalizado, selectUnitsWithinBudget } from './retrieval';
import { buildAnalyzedDocumentText, montarBloqueDelCandidato } from './judge';
import { repartoDeLaPareja } from './reparto-de-la-pareja';
import { lineasDeLaSegundaSeleccion, segundaSeleccion } from './segunda-seleccion';
import type { DocumentFragment, RerankedCandidate } from './types';

/**
 * LA SEGUNDA SELECCIÓN (3.1.3, 21/10/2026), con los trozos reales de NOR-10 (el analizado) y CLI-12 (el
 * candidato). CLI-12 va en el orden de relevancia de la pasada 1 del 16/10 (los trece primeros, del log de
 * producción; el resto, por índice): con 3.000 de texto, la primera selección elige el 0, el 4 y el 45, que es
 * lo que eligió producción —el control de que el orden es el bueno—.
 *
 * La garantía: el bloque ampliado cabe en su resto YA MONTADO y representa todos los trozos del bloque de la
 * recuperación; y fuera del corte honesto rápido no se toca nada.
 */
const VARIABLE = 'ANALYSIS_PAREJA_ENTERA';
const original = process.env[VARIABLE];
afterEach(() => { if (original === undefined) delete process.env[VARIABLE]; else process.env[VARIABLE] = original; });

const NOR10 = 'NOR-10_protocolo-esterilizacion-instrumental.docx', CLI12 = 'CLI-12_manual-calidad-clinica.docx';
const ORDEN_DEL_LOG = [0, 4, 45, 5, 53, 49, 52, 14, 15, 35, 17, 24, 26];
let nor: StoredChunk[] = [], cli: StoredChunk[] = [], ordenados: DocumentFragment[] = [], candidato: RerankedCandidate;

const trozos = async (f: string) => toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o'));
beforeAll(async () => {
  nor = await trozos(NOR10); cli = await trozos(CLI12);
  const orden = [...ORDEN_DEL_LOG, ...cli.map(c => c.chunkIndex).filter(i => !ORDEN_DEL_LOG.includes(i))];
  ordenados = orden.map((i, k) => {
    const c = cli.find(x => x.chunkIndex === i)!;
    return { text: c.text, documentId: 'cli', documentName: CLI12, source: 'manual', score: 0.9 - k / 1000, chunkIndex: i, generation: 1 };
  });
  const { analyzedValueIndex, analyzedRows } = indiceDelAnalizado(nor);
  const primera = selectUnitsWithinBudget(buildUnits(ordenados, cli), cli, ordenados[0], analyzedValueIndex, analyzedRows, 3_000).selected;
  candidato = { documentId: 'cli', documentName: CLI12, source: 'manual', fragments: primera, rerankReason: '', rerankConfidence: 'alta' };
}, 120_000);

const correr = (exhaustivo = false) => segundaSeleccion({
  candidates: [candidato], newDocumentName: NOR10, newDocumentChunks: nor,
  chunksByDocument: new Map([['cli', cli]]), fragmentosOrdenados: new Map([['cli', ordenados]]), exhaustivo,
});
const indices = (fs: DocumentFragment[]) => fs.filter(f => !f.isContext).map(f => f.chunkIndex);

describe('la segunda selección, en NOR-10 ↔ CLI-12', () => {
  it('control: la primera selección, con 3.000 de texto, elige el 0, el 4 y el 45, como producción el 16/10', () => {
    expect(indices(candidato.fragments)).toEqual([0, 4, 45]);
  });

  it('LA GARANTÍA: el bloque ampliado cabe en su resto YA MONTADO y representa todos los trozos del de la recuperación', () => {
    process.env[VARIABLE] = '1';
    const { candidates, repartos } = correr();
    const elegido = repartos.get('cli')!;
    expect(elegido.seleccion).toBe('ampliada');
    const A = buildAnalyzedDocumentText(nor, NOR10).length;
    const reserva = montarBloqueDelCandidato(candidato.fragments, CLI12, cli).length;
    expect(elegido.reparto).toEqual(repartoDeLaPareja({ analizado: A, candidato: buildAnalyzedDocumentText(cli, CLI12).length, reservaMontada: reserva }));
    expect(elegido.reparto.paraElAnalizado).toBe(A);                                    // NOR-10 entero
    const montado = montarBloqueDelCandidato(candidates[0].fragments, CLI12, cli).length;
    expect(montado).toBeLessThanOrEqual(elegido.reparto.paraElCandidato);
    for (const i of [0, 4, 45]) expect(indices(candidates[0].fragments)).toContain(i);
  });

  it('EL LÍMITE DECLARADO: sube lo que entra, de 3 trozos a los 12 primeros del ranking, pero los de B (34 y 38) y el de D (6) siguen fuera, por ranking', () => {
    process.env[VARIABLE] = '1';
    const ahora = indices(correr().candidates[0].fragments);
    expect(ahora).toEqual(ORDEN_DEL_LOG.slice(0, 12));
    for (const i of [34, 38, 6]) expect(ahora).not.toContain(i);
  });

  it('las cabeceras cuentan: elegida contando sólo el texto, la misma selección se pasaría del resto', () => {
    process.env[VARIABLE] = '1';
    const resto = correr().repartos.get('cli')!.reparto.paraElCandidato;
    const { analyzedValueIndex, analyzedRows } = indiceDelAnalizado(nor);
    const soloTexto = selectUnitsWithinBudget(buildUnits(ordenados, cli), cli, ordenados[0], analyzedValueIndex, analyzedRows, resto).selected;
    expect(montarBloqueDelCandidato(soloTexto, CLI12, cli).length).toBeGreaterThan(resto);
  });

  it('CASO DECISIVO del superconjunto: si la ampliada perdería un trozo del bloque de la recuperación, se queda la de la recuperación', () => {
    process.env[VARIABLE] = '1';
    const sinEl45 = ordenados.filter(f => f.chunkIndex !== 45);
    const { candidates, repartos } = segundaSeleccion({
      candidates: [candidato], newDocumentName: NOR10, newDocumentChunks: nor,
      chunksByDocument: new Map([['cli', cli]]), fragmentosOrdenados: new Map([['cli', sinEl45]]), exhaustivo: false,
    });
    expect(repartos.get('cli')!.seleccion).toBe('la_de_la_recuperacion');
    expect(candidates[0]).toBe(candidato);
  });

  it('22/10/2026, EL LOG: una línea por pareja con su resto y de dónde salió su bloque, y el agregado', () => {
    process.env[VARIABLE] = '1';
    const s = correr();
    const resto = s.repartos.get('cli')!.reparto.paraElCandidato;
    expect(lineasDeLaSegundaSeleccion(s)).toEqual([
      `[segunda-seleccion] "${CLI12}": resto ${resto} de 80000, bloque ampliada, 12 trozos`,
      '[segunda-seleccion] 1 parejas: 0 entero, 1 ampliada, 0 la_de_la_recuperacion, 0 sin trozos',
    ]);
    delete process.env[VARIABLE];
    expect(lineasDeLaSegundaSeleccion(correr())).toEqual([
      '[segunda-seleccion] no aplica (interruptor apagado, exhaustivo o el analizado sin trozos): el juez lee el bloque de la recuperación',
    ]);
  });

  it('fuera del corte honesto rápido no toca nada: con el interruptor apagado, y en el exhaustivo', () => {
    delete process.env[VARIABLE];
    const apagado = correr();
    expect(apagado.repartos.size).toBe(0);
    expect(apagado.candidates[0]).toBe(candidato);
    process.env[VARIABLE] = '1';
    const exhaustivo = correr(true);
    expect(exhaustivo.repartos.size).toBe(0);
    expect(exhaustivo.candidates[0]).toBe(candidato);
  });
});
