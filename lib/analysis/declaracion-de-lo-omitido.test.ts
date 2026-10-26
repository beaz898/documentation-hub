import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * LA DECLARACIÓN DE LO OMITIDO (3.1.2, segunda mitad, 23/10/2026). Tres cosas, con casos decisivos:
 *   1. sólo hay aviso cuando el corte honesto dejó fuera parte del analizado;
 *   2. SIN CORTE, EL PROMPT SALE BYTE A BYTE IGUAL QUE ANTES: las huellas de abajo se calcularon con el código de
 *      `8a790652`, antes de este commit, sobre las parejas reales del corpus con la ventana de producción. Es lo que
 *      demuestra que el control de NOR-11 no se toca;
 *   3. CON CORTE, el aviso va FUERA de las comillas del documento, y la puerta no lo tiene en lo entregado: no se
 *      puede citar como texto del cliente (protocolo, «lo que escribimos nosotros no va donde el juez cita»).
 * Con la ventana de producción ninguna pareja del corpus tiene corte: el caso con corte es el de 40.000 (F-128).
 */
const prompts: string[] = [];
vi.mock('./llm-client', () => ({
  callLLMJson: async (prompt: string) => { prompts.push(prompt); return { overlapPercent: 0, verdict: 'tema_distinto', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] }; },
  callLLM: async () => '',
  callLLMWithUsage: async () => ({ text: '', usage: {} }),
}));
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { judgeAllDocuments, leerLaPareja, montarBloqueDelCandidato, piezasDelAnalizado, buildAnalyzedDocumentText } from './judge';
import { avisoDeLoOmitido, finesDePiezas, SEPARADOR } from './corte-del-analizado';
import { EXCEPCION_DEL_SUJETO } from './regla-del-sujeto';
import { EXCEPCION_DE_LAS_REGLAS } from './excepcion-de-las-reglas';
import { loEntregadoDeLaPareja } from './pajar-de-la-cita';
import { repartoDeLaPareja, type RepartoElegido } from './reparto-de-la-pareja';
import type { DocumentFragment } from './types';

const VARIABLE = 'ANALYSIS_PAREJA_ENTERA';
const original = process.env[VARIABLE];
afterEach(() => { if (original === undefined) delete process.env[VARIABLE]; else process.env[VARIABLE] = original; });

const DOCS: Record<string, string> = {
  NOR11: 'NOR-11_gestion-de-residuos-sanitarios.docx', NOR10: 'NOR-10_protocolo-esterilizacion-instrumental.docx',
  CLI13: 'CLI-13_instrucciones-clinicas-residuos.docx', CLI12: 'CLI-12_manual-calidad-clinica.docx',
};
const ch: Record<string, StoredChunk[]> = {};
beforeAll(async () => {
  for (const [k, f] of Object.entries(DOCS)) ch[k] = toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), k, f, 'o'));
}, 120_000);
const primerFragmento = (c: string): DocumentFragment[] => [{ text: ch[c][0].text, documentId: c, documentName: DOCS[c], source: 'manual', score: 0.9, chunkIndex: 0 }];
async function juzgar(nuevo: string, cands: string[], repartos?: Map<string, RepartoElegido>): Promise<string[]> {
  prompts.length = 0;
  await judgeAllDocuments({
    newDocumentName: DOCS[nuevo], newDocumentSample: 'x', newDocumentChunks: ch[nuevo],
    candidates: cands.map(c => ({ documentId: c, documentName: DOCS[c], source: 'manual', rerankReason: '', rerankConfidence: 'alta', fragments: primerFragmento(c) })),
    chunksByDocument: new Map(cands.map(c => [c, ch[c]])), repartos,
  });
  return [...prompts];
}
const huella = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 16);

describe('1 · el aviso, sólo cuando el corte honesto dejó algo fuera', () => {
  const lado = (mostrados: number, dejoFuera: boolean) => ({ caracteres: 1_000, mostrados, dejoFuera });
  it('pareja entera, tijera vieja o corte honesto con el analizado entero: sin aviso', () => {
    expect(avisoDeLoOmitido({ regimen: 'pareja_entera', analizado: lado(1_000, false) })).toBe('');
    expect(avisoDeLoOmitido({ regimen: 'tijera_vieja', analizado: lado(600, true) })).toBe('');
    expect(avisoDeLoOmitido({ regimen: 'corte_honesto', analizado: lado(1_000, false) })).toBe('');
  });
  it('corte honesto con lo omitido: el aviso dice cuánto, y que no es texto del documento', () => {
    expect(avisoDeLoOmitido({ regimen: 'corte_honesto', analizado: lado(700, true) }))
      .toBe('\n[AVISO DEL SISTEMA, no es texto del documento: el DOCUMENTO NUEVO continúa; no se te han mostrado 300 caracteres a partir de aquí.]');
  });
});

describe('2 · SIN CORTE, EL PROMPT ES EL DE ANTES, BYTE A BYTE (las parejas reales, ventana de producción)', () => {
  // calculadas con el código de 8a790652 (antes de este commit), dos veces, con el mismo resultado
  const ANTES: Record<string, string> = {
    'NOR11↔CLI13': '8b144f84d99da07d', 'NOR11↔CLI12': '188c2b10e6d29279',
    'NOR10↔CLI12': '1a6d890711a469ae', 'NOR10↔CLI13': '990156ae59bd04b9',
  };
  it('las cuatro parejas, enteras, dan las mismas huellas que antes del aviso', async () => {
    process.env[VARIABLE] = '1';
    const ahora: Record<string, string> = {};
    for (const [nuevo, cands] of [['NOR11', ['CLI13', 'CLI12']], ['NOR10', ['CLI12', 'CLI13']]] as const) {
      const ps = await juzgar(nuevo, [...cands]);
      // ~~huella(p)~~ (23/10/2026). Desde el commit 3 del 3.1.2 (24/10) el prompt lleva la excepción del sujeto en su
      // propia línea: quitada esa línea, el resto tiene que ser el de antes, byte a byte (regla-del-sujeto.test.ts
      // comprueba que la línea ESTÁ, para que quitarla no sea quitar nada).
      // 26/10/2026 (3.4): y el bloque de las reglas, también añadido: quitadas las dos piezas, el resto es el de antes
      ps.forEach((p, i) => { ahora[`${nuevo}↔${cands[i]}`] = huella(p.replace(EXCEPCION_DEL_SUJETO + '\n', '').replace(EXCEPCION_DE_LAS_REGLAS + '\n\n', '')); expect(p).not.toContain('AVISO DEL SISTEMA'); });
    }
    expect(ahora).toEqual(ANTES);
  });
});

describe('3 · CON CORTE (NOR-10 ↔ CLI-12 con 40.000): el aviso, FUERA de las comillas, y la puerta no lo tiene', () => {
  it('el prompt lleva el aviso justo después de las comillas que cierran el documento nuevo, con lo omitido', async () => {
    process.env[VARIABLE] = '1';
    const A = buildAnalyzedDocumentText(ch.NOR10, DOCS.NOR10), C = buildAnalyzedDocumentText(ch.CLI12, DOCS.CLI12);
    const bloque = montarBloqueDelCandidato(primerFragmento('CLI12'), DOCS.CLI12, ch.CLI12);
    const reparto = repartoDeLaPareja({ analizado: A.length, candidato: C.length, reservaMontada: bloque.length, ventana: 40_000 });
    const [p] = await juzgar('NOR10', ['CLI12'], new Map([['CLI12', { reparto, seleccion: 'la_de_la_recuperacion' as const }]]));
    const m = p.match(/"""\n\[AVISO DEL SISTEMA, no es texto del documento: el DOCUMENTO NUEVO continúa; no se te han mostrado (\d+) caracteres a partir de aquí\.\]\n\nDOCUMENTO EXISTENTE:/);
    expect(m).not.toBeNull();
    // lo omitido es lo que no entró: el corte acaba en un límite de pieza, y el aviso lo cuenta desde ahí
    const fines = finesDePiezas(piezasDelAnalizado(ch.NOR10, DOCS.NOR10));
    const mostrados = A.length - Number(m![1]);
    expect(fines).toContain(mostrados);
    // y entre las comillas del documento nuevo está el analizado cortado, sin el aviso dentro
    const dentro = p.slice(p.indexOf('"""\n') + 4, p.indexOf('\n"""\n[AVISO'));
    expect(dentro).toBe(A.slice(0, mostrados));
    expect(dentro).not.toContain('AVISO');
  });
  it('la puerta comprueba contra lo entregado, y lo entregado del lado nuevo no lleva el aviso', () => {
    const piezas = piezasDelAnalizado(ch.NOR10, DOCS.NOR10), completo = piezas.join(SEPARADOR);
    const bloque = 'b'.repeat(2_857);
    const reparto = repartoDeLaPareja({ analizado: completo.length, candidato: buildAnalyzedDocumentText(ch.CLI12, DOCS.CLI12).length, reservaMontada: bloque.length, ventana: 40_000 });
    const pareja = leerLaPareja({
      parejaEntera: true, documentId: 'CLI12', documentName: DOCS.CLI12, analizadoCompleto: completo, finesDelAnalizado: finesDePiezas(piezas),
      analizadoConTrozos: true, analizadoViejo: { texto: '', lado: { caracteres: 0, mostrados: 0, dejoFuera: true } },
      candidatoChunks: ch.CLI12, fragmentosEnviados: [], bloqueRelevancia: bloque, elegido: { reparto, seleccion: 'la_de_la_recuperacion' },
    });
    const aviso = avisoDeLoOmitido(pareja.lectura);
    expect(aviso).not.toBe('');                                            // hay corte, así que hay aviso…
    const entregado = loEntregadoDeLaPareja({ pareja, analizadoChunks: ch.NOR10, candidatoChunks: ch.CLI12 });
    expect(entregado.nuevo!.texto).toBe(pareja.textoAnalizado);
    expect(entregado.nuevo!.texto).not.toContain('AVISO DEL SISTEMA');     // …y no está donde la puerta busca
    expect(entregado.nuevo!.texto).not.toContain('no se te han mostrado');
  });
});
