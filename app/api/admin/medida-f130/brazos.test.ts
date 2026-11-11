import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { buildAnalyzedDocumentText } from '@/lib/analysis/judge';
import { FRASES_DE_ABC, marcasDe, trozosDelBrazo } from './brazos';

// un documento inventado con la forma del de verdad: D en el 1, A en el 3, B en el 5, C en el 7, y neutros entre medias
const t = (i: number, text: string, chunkType = 'text') => ({ chunkIndex: i, chunkType, text });
const F = FRASES_DE_ABC['NOR-10'];
const relleno = (n: number) => 'Texto de relleno sobre otra materia del protocolo. '.repeat(n);
const inventado = () => [
  t(0, relleno(4)), t(1, 'La función puede recaer en el propio Director Clínico. ' + relleno(3)), t(2, relleno(6)),
  t(3, `${F.A}. ` + relleno(5)), t(4, relleno(5)), t(5, `${F.B}. ` + relleno(5)), t(6, relleno(4)), t(7, `${F.C}. ` + relleno(5)), t(8, relleno(9)), t(9, relleno(4)),
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

  it('documentos: todos los trozos; competencia: D más los trozos de A, B y C', () => {
    const d = trozosDelBrazo('documentos', lado(), largo), c = trozosDelBrazo('competencia', lado(), largo);
    if (!d.ok || !c.ok) throw new Error('no se eligió');
    expect(d.indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(trozosDelBrazo('competencia', { ...lado(), codigo: 'NOR-11' }, largo)).toMatchObject({ ok: false, motivo: expect.stringContaining('no tiene frases') });
    expect(c.indices).toEqual([1, 3, 5, 7]);
    expect(c.trozosDeABC).toEqual({ A: 3, B: 5, C: 7 });
    expect(c.tamanoDeCompetencia).toBe(c.tamano);
    expect(d.tamanoDeCompetencia).toBe(c.tamano);
  });

  it('neutros: D más neutros en el orden del documento, dentro de ±5 % del tamaño de competencia, y ninguno con marca', () => {
    const c = trozosDelBrazo('competencia', lado(), largo), n = trozosDelBrazo('neutros', lado(), largo);
    if (!c.ok || !n.ok) throw new Error('no se eligió');
    expect(n.indices).toEqual([0, 1, 2, 4, 6]);
    expect(Math.abs(n.tamano / c.tamano - 1)).toBeLessThanOrEqual(0.05);
    expect(n.tamanoDeCompetencia).toBe(c.tamano);
    for (const x of inventado().filter(x => n.indices.includes(x.chunkIndex) && x.chunkIndex !== 1)) expect(marcasDe(x.text)).toEqual([]);
  });

  it('⚠️ UN «NEUTRO» CON MEDIA MARCA NO ENTRA: se salta y se coge el siguiente', () => {
    const todos = inventado(); todos[0] = t(0, relleno(3) + ' con una caducidad escondida');
    const n = trozosDelBrazo('neutros', lado(todos), largo);
    if (!n.ok) throw new Error(n.motivo);
    expect(n.indices).not.toContain(0);
  });

  it('las negativas: una frase de A, B o C sin trozo; sin neutros bastantes para llegar al tamaño', () => {
    const sinB = inventado().filter(x => x.chunkIndex !== 5);
    expect(trozosDelBrazo('competencia', lado(sinB), largo)).toMatchObject({ ok: false, motivo: expect.stringContaining('la frase de B') });
    const pocos = inventado().map(x => [0, 2, 4, 6, 8, 9].includes(x.chunkIndex) ? t(x.chunkIndex, 'Una caducidad.') : x);
    expect(trozosDelBrazo('neutros', lado(pocos), largo)).toMatchObject({ ok: false, motivo: expect.stringContaining('fuera de ±5 %') });
  });

  it('un trozo que no es de texto no es neutro', () => {
    const todos = inventado(); todos[0] = t(0, relleno(4), 'table_row');
    const n = trozosDelBrazo('neutros', lado(todos), largo);
    if (!n.ok) throw new Error(n.motivo);
    expect(n.indices).not.toContain(0);
  });
});

// LO QUE ELIGE SOBRE LOS .docx DEL CORPUS (11/11), con el troceado del producto: los números que se le dieron al arquitecto.
const trozos = async (f: string): Promise<StoredChunk[]> => toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o'));
describe('los brazos sobre el corpus', () => {
  it.each([
    ['NOR-10', 'NOR-10_protocolo-esterilizacion-instrumental.docx', 4, [2, 4, 36, 58], [0, 1, 3, 4, 13]],
    ['CLI-12', 'CLI-12_manual-calidad-clinica.docx', 6, [3, 6, 34, 51], [0, 1, 2, 6]],
  ] as const)('%s: competencia y neutros', async (codigo, fichero, trozoD, competencia, neutros) => {
    const todos = await trozos(fichero);
    const medir = (ts: StoredChunk[]) => buildAnalyzedDocumentText(ts, fichero).length;
    const c = trozosDelBrazo('competencia', { codigo, todos, trozoD }, medir), n = trozosDelBrazo('neutros', { codigo, todos, trozoD }, medir);
    if (!c.ok || !n.ok) throw new Error('no se eligió');
    expect(c.indices).toEqual([...competencia]);
    expect(n.indices).toEqual([...neutros]);
    for (const x of todos.filter(x => n.indices.includes(x.chunkIndex) && x.chunkIndex !== trozoD)) expect(marcasDe(x.text)).toEqual([]);
  });
});
