import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

// LA RUTA d4 (11/11/2026): el juez del producto con el prompt del producto. La prueba que importa es la primera: el prompt que
// enseña el ENSAYO es el mismo, byte a byte, que `judgeAllDocuments` le ENVÍA al modelo en la tanda, y la lectura guarda esa huella.
const enviados: string[] = [];
let respuesta: unknown = { overlapPercent: 0, verdict: 'tema_distinto', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] };
vi.mock('@/lib/analysis/llm-client', () => ({
  callLLMJson: async (prompt: string) => { enviados.push(prompt); return respuesta; },
  callLLM: async () => '',
  callLLMWithUsage: async () => ({ text: '', usage: {} }),
}));

import type { StoredChunk } from '@/lib/read-chunks';
import { INTERRUPTOR_PAREJA_ENTERA, huellaDelPrompt } from '@/lib/analysis/judge';
import { TAMANO_VENTANA } from '@/lib/analysis/reparto-de-la-pareja';
import { fuenteDelProducto, juzgarConElProducto, promptDeLaPareja, resumenDelPromptD4, VECES_DE_D4 } from './producto';

const leer = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const trozo = (i: number, text: string): StoredChunk => ({ chunkIndex: i, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const doc = (pref: string, n: number, largo: number) => Array.from({ length: n }, (_, i) => trozo(i, `${pref} ${i}. ` + 'x'.repeat(largo)));
const pareja = (a: StoredChunk[], c: StoredChunk[]) => ({
  analizado: { nombre: 'NOR-10.docx', trozos: a },
  candidato: { documentId: 'c', nombre: 'CLI-12.docx', trozos: c, fuente: 'manual' as const },
});

describe('d4: el juez del producto (11/11)', () => {
  afterEach(() => { vi.unstubAllEnvs(); enviados.length = 0; respuesta = { overlapPercent: 0, verdict: 'tema_distinto', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] }; });

  it('⚠️ EL ENSAYO = LA TANDA: el prompt armado sin modelo es el que judgeAllDocuments envía, y la lectura guarda su huella', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    const p = pareja(doc('Analizado', 5, 300), doc('Candidato', 4, 200));
    const armado = promptDeLaPareja(p);
    if (!armado.ok) throw new Error(armado.motivo);
    const j = await juzgarConElProducto({ analizado: { ...p.analizado, textoDelAnalizado: armado.textoAnalizado }, candidato: p.candidato });
    expect(enviados).toHaveLength(1);
    expect(enviados[0]).toBe(armado.prompt);
    expect(j.lectura.regimen).toBe('pareja_entera');
    expect(j.lectura.huellaDelPrompt).toBe(armado.huella);
    expect(armado.huella).toBe(huellaDelPrompt(armado.prompt));
  });

  it('LA TANDA CUENTA DESPUÉS DE LA PUERTA: una contradicción con una cita que no está en el documento va a descartesPorCita, no a contradictions', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    const a = doc('Analizado', 3, 300), c = doc('Candidato', 3, 200);
    respuesta = {
      overlapPercent: 10, verdict: 'tema_similar', uniqueToNewDoc: [], overlappingContent: [],
      contradictions: [{ topic: 't', newDocSays: 'una frase que no está en ningún sitio del analizado', existingDocSays: c[1].text.slice(0, 60), severity: 'contradiction' }],
    };
    const p = pareja(a, c);
    const j = await juzgarConElProducto({ analizado: { ...p.analizado, textoDelAnalizado: a.map(x => x.text).join('\n\n') }, candidato: p.candidato });
    expect(j.judgment.contradictions).toHaveLength(0);
    expect(j.judgment.descartesPorCita?.length ?? 0).toBe(1);
  });

  it('NO CABE → no es pareja_entera y no hay prompt (la negativa del régimen, antes de llamar)', () => {
    const grande = Math.ceil(TAMANO_VENTANA / 10);
    const r = promptDeLaPareja(pareja(doc('A', 8, grande), doc('C', 8, grande)));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.regimen).toBe('corte_honesto');
  });

  it('LA FUENTE, como la pone el producto: google_drive, o manual (OneDrive incluido)', () => {
    expect(fuenteDelProducto('google_drive')).toBe('google_drive');
    expect(fuenteDelProducto('onedrive')).toBe('manual');
    expect(fuenteDelProducto(null)).toBe('manual');
  });

  it('EL ENSAYO RECORTADO: huella, longitud, cabeza, empalme, la cola por huella y extremos, y enSuSitio', () => {
    const textoA = 'INICIO-A ' + 'a'.repeat(60_000) + ' FINAL-A', textoB = 'INICIO-B ' + 'b'.repeat(60_000) + ' FINAL-B';
    const prompt = `Eres…\n\nDOCUMENTO NUEVO: "NOR-10.docx"\n"""\n${textoA}\n"""\n\nDOCUMENTO EXISTENTE: "CLI-12.docx" (fuente: manual)\n"""\n${textoB}\n"""\n\nREGLA PRINCIPAL…`;
    const r = resumenDelPromptD4(prompt, textoA, textoB, 'h');
    expect(r.enSuSitio).toEqual({ documento1: true, documento2: true });
    expect(r.cabeza).toBe(`Eres…\n\nDOCUMENTO NUEVO: "NOR-10.docx"\n"""\n${textoA.slice(0, 300)}`);
    expect(r.empalme).toBe(`${textoA.slice(-300)}\n"""\n\nDOCUMENTO EXISTENTE: "CLI-12.docx" (fuente: manual)\n"""\n${textoB.slice(0, 300)}`);
    expect(r.cola.principio.startsWith('\n"""\n\nREGLA PRINCIPAL')).toBe(true);
    expect(r.cola.longitud).toBe('\n"""\n\nREGLA PRINCIPAL…'.length);
    expect(JSON.stringify(r).length).toBeLessThan(5_000);
    expect(resumenDelPromptD4(prompt, textoA, 'otro', 'h').enSuSitio.documento2).toBe(false);
  });

  it('d4 y d4b: cada ruta llama a la lógica común con SU brazo, y nada más', () => {
    const [d4, d4b] = ['d4', 'd4b'].map(r => leer(`app/api/admin/medida-f130/${r}/route.ts`));
    expect(d4).toContain("return medirConElProducto(req, 'documentos');");
    expect(d4b).toContain("return medirConElProducto(req, 'competencia');");
    for (const r of [d4, d4b]) { expect(r.split('medirConElProducto(').length - 1).toBe(1); expect(r).toContain('export const maxDuration = 300;'); }
  });

  it('⚠️ LOS BRAZOS SON d4 CON LO ÚNICO CAMBIADO, QUÉ TEXTO ENTRA: sustituyendo los documentos por otros trozos, el prompt es idéntico', () => {
    const a = doc('Analizado', 5, 300), c = doc('Candidato', 4, 200);
    const d4 = promptDeLaPareja(pareja(a, c));
    const d4b = promptDeLaPareja(pareja([a[1], a[2]], [c[1], c[3]]));
    if (!d4.ok || !d4b.ok) throw new Error('no se armó');
    expect(d4.prompt.split(d4.textoAnalizado).join(d4b.textoAnalizado).split(d4.bloqueCandidato).join(d4b.bloqueCandidato)).toBe(d4b.prompt);
    expect(d4b.lectura.regimen).toBe('pareja_entera');
    expect(d4b.huella).not.toBe(d4.huella);
  });

  it('LA LÓGICA COMÚN: los trozos de cada lado son los del brazo; fuera de documentos, el texto del analizado es lo entregado', () => {
    const r = leer('app/api/admin/medida-f130/producto-ruta.ts');
    expect(r).toContain("const brazoX = trozosDelBrazo(condicion, { codigo: TROZOS[analizado].codigo, todos: todosX, trozoD: x.chunkIndex }");
    expect(r).toContain("const brazoY = trozosDelBrazo(condicion, { codigo: TROZOS[candidato].codigo, todos: todosY, trozoD: y.chunkIndex }");
    expect(r).toContain('const trozosX = todosX.filter(c => brazoX.indices.includes(c.chunkIndex));');
    expect(r).toContain('const trozosY = todosY.filter(c => brazoY.indices.includes(c.chunkIndex));');
    expect(r).toContain("const textoDelAnalizado = condicion !== 'documentos' ? armado.textoAnalizado");
    // la negativa del brazo, después de la del interruptor y antes de armar el prompt
    const brazo = r.indexOf('if (!brazoX.ok || !brazoY.ok) return NextResponse.json(');
    expect(brazo).toBeGreaterThan(r.indexOf('if (!interruptorEncendido()) {'));
    expect(brazo).toBeLessThan(r.indexOf('const armado = promptDeLaPareja('));
  });

  it('LA LÓGICA COMÚN: las tres negativas antes del ensayo y del modelo, una sola llamada al juez, el sondeo de una, y sin el prompt entero', () => {
    const r = leer('app/api/admin/medida-f130/producto-ruta.ts');
    const trozos = r.indexOf("if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });");
    const interruptor = r.indexOf('if (!interruptorEncendido()) {');
    const regimen = r.indexOf('if (!armado.ok) return NextResponse.json({ error: armado.motivo, regimen: armado.regimen }, { status: 409 });');
    const ensayo = r.indexOf("if (req.nextUrl.searchParams.get('ensayo') === '1')");
    const modelo = r.indexOf('await juzgarConElProducto(');
    for (const i of [trozos, interruptor, regimen, ensayo, modelo]) expect(i).toBeGreaterThan(-1);
    expect(trozos).toBeLessThan(interruptor);
    expect(interruptor).toBeLessThan(regimen);
    expect(regimen).toBeLessThan(ensayo);
    expect(ensayo).toBeLessThan(modelo);
    expect(r.split('juzgarConElProducto(').length - 1).toBe(1);
    expect(r).toContain('{ length: sondeo ? 1 : VECES_DE_D4 }');
    expect(r).toContain('prompt: resumenDelPromptD4(armado.prompt, armado.textoAnalizado, armado.bloqueCandidato, armado.huella),');
    expect(r).not.toMatch(/prompt: armado\.prompt\b/);
    expect(r).toContain('mismaHuella: j.lectura.huellaDelPrompt === armado.huella');
    expect(VECES_DE_D4).toBe(14);
  });
});
