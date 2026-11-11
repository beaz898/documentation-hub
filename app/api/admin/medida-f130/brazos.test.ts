import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { buildAnalyzedDocumentText } from '@/lib/analysis/judge';
import { FRASES_DE_ABC, marcasDe, trozosDelBrazo } from './brazos';

// un documento inventado con la forma del de verdad: D en el 1, A en el 3, B en el 5, C en el 7, y relleno entre medias
const t = (i: number, text: string, chunkType = 'text') => ({ chunkIndex: i, chunkType, text });
const F = FRASES_DE_ABC['NOR-10'];
const relleno = (n: number) => 'Texto de relleno sobre otra materia del protocolo. '.repeat(n);
const inventado = () => [
  t(0, relleno(4)), t(1, 'La función puede recaer en el propio Director Clínico. ' + relleno(3)), t(2, relleno(6)),
  t(3, `${F.A}. ` + relleno(5)), t(4, relleno(5)), t(5, `${F.B}. ` + relleno(5)), t(6, relleno(4)), t(7, `${F.C}. ` + relleno(5)), t(8, relleno(9)),
];
const largo = (ts: Array<{ text: string }>) => ts.map(c => c.text).join('\n\n').length;
const lado = (todos = inventado()) => ({ codigo: 'NOR-10' as const, todos, trozoD: 1 });

describe('los brazos de d4 (11/11)', () => {
  it('las marcas: una de cada caso se reconoce sin tildes ni mayúsculas, y un relleno no lleva ninguna', () => {
    expect(marcasDe('El Responsable Último')).toEqual(['A:responsable ultimo']);
    expect(marcasDe('control BIOLÓGICO mensual')).toEqual(['B:control biologico', 'B:mensual']);
    expect(marcasDe('caducidad de 12   meses')).toEqual(['C:caducidad', 'C:12 meses']);
    expect(marcasDe('Separación de funciones')).toEqual(['D:separacion de funciones']);
    expect(marcasDe(relleno(3))).toEqual([]);
  });

  it('documentos: todos los trozos; competencia: D más los trozos de A, B y C, con su tamaño', () => {
    const d = trozosDelBrazo('documentos', lado(), largo), c = trozosDelBrazo('competencia', lado(), largo);
    if (!d.ok || !c.ok) throw new Error('no se eligió');
    expect(d.indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(c.indices).toEqual([1, 3, 5, 7]);
    expect(c.trozosDeABC).toEqual({ A: 3, B: 5, C: 7 });
    expect(c.tamano).toBe(largo(inventado().filter(x => [1, 3, 5, 7].includes(x.chunkIndex))));
    expect(d.tamano).toBe(largo(inventado()));
    expect(d.tamanoDeCompetencia).toBe(c.tamano);
  });

  it('las negativas: un documento sin frases; una frase de A, B o C sin trozo — en los dos brazos', () => {
    for (const brazo of ['documentos', 'competencia'] as const) {
      expect(trozosDelBrazo(brazo, { ...lado(), codigo: 'NOR-11' }, largo)).toMatchObject({ ok: false, motivo: expect.stringContaining('no tiene frases') });
      const sinB = inventado().filter(x => x.chunkIndex !== 5);
      expect(trozosDelBrazo(brazo, lado(sinB), largo)).toMatchObject({ ok: false, motivo: expect.stringContaining('la frase de B') });
    }
  });
});

// LO QUE ELIGE SOBRE LOS .docx DEL CORPUS (11/11), con el troceado del producto: los números que se le dieron al arquitecto, y el
// hecho que retiró d4c: en CLI-12, el trozo de A (el 3) lleva también el principio del §3.1, la vía de D.
const trozos = async (f: string): Promise<StoredChunk[]> => toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o'));
describe('los brazos sobre el corpus', () => {
  it.each([
    ['NOR-10', 'NOR-10_protocolo-esterilizacion-instrumental.docx', 4, [2, 4, 36, 58], 4246],
    ['CLI-12', 'CLI-12_manual-calidad-clinica.docx', 6, [3, 6, 34, 51], 4366],
  ] as const)('%s: competencia', async (codigo, fichero, trozoD, competencia, tamano) => {
    const todos = await trozos(fichero);
    const c = trozosDelBrazo('competencia', { codigo, todos, trozoD }, ts => buildAnalyzedDocumentText(ts, fichero).length);
    if (!c.ok) throw new Error(c.motivo);
    expect(c.indices).toEqual([...competencia]);
    expect(c.tamano).toBe(tamano);
  });

  it('⚠️ A Y D COMPARTEN TROZO EN CLI-12: el de A lleva el principio del §3.1; y el de D en NOR-10 lleva la frase de A del §2.4', async () => {
    const cli = await trozos('CLI-12_manual-calidad-clinica.docx'), nor = await trozos('NOR-10_protocolo-esterilizacion-instrumental.docx');
    expect(marcasDe(cli.find(c => c.chunkIndex === 3)!.text)).toEqual(expect.arrayContaining(['A:responsable ultimo', 'D:separar la responsabilidad']));
    expect(marcasDe(nor.find(c => c.chunkIndex === 4)!.text)).toEqual(expect.arrayContaining(['A:responsabilidad ultima', 'D:puede recaer']));
  });
});
