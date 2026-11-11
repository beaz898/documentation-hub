import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

// las dos llamadas de m1, capturadas: la prosa (callLLM) y la extracción (callLLMJson)
const llamadas: Array<{ tipo: 'texto' | 'json'; prompt: string; opciones: unknown }> = [];
let respuestaJson: unknown = null;
vi.mock('@/lib/analysis/llm-client', () => ({
  callLLM: async (prompt: string, opciones: unknown) => { llamadas.push({ tipo: 'texto', prompt, opciones }); return 'LA PROSA DEL JUEZ, con "una cita".'; },
  callLLMJson: async (prompt: string, opciones: unknown) => { llamadas.push({ tipo: 'json', prompt, opciones }); return respuestaJson; },
  callLLMWithUsage: async () => ({ text: '', usage: {} }),
}));

import { INSTRUCCION_DE_SALIDA_DEL_JUEZ, INTERRUPTOR_PAREJA_ENTERA, judgeAllDocuments, promptDelJuez } from '@/lib/analysis/judge';
import { EXCEPCION_DE_LAS_REGLAS } from '@/lib/analysis/excepcion-de-las-reglas';
import { EXCEPCION_DEL_SUJETO } from '@/lib/analysis/regla-del-sujeto';
import type { StoredChunk } from '@/lib/read-chunks';
import { INICIO_DE_LAS_INSTRUCCIONES, INSTRUCCION_DE_PROSA, SUPRESIONES, promptDeExtraccion, promptDeProsa, respuestaEnDosLlamadas, type RastroDeM1 } from './cambio-m1';

const huella = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const delProducto = (textoAnalizado = 'TEXTO DEL NUEVO', bloqueCandidato = 'TEXTO DEL EXISTENTE') =>
  promptDelJuez({ nombreDelAnalizado: 'NOR-10.docx', textoAnalizado, avisoDeLoOmitido: '', nombreDelCandidato: 'CLI-12.docx', fuenteDelCandidato: 'manual', bloqueCandidato });
const instrucciones = (p: string) => p.slice(p.indexOf(INICIO_DE_LAS_INSTRUCCIONES));

/** Lo que es esquema y tiene que salir de la llamada 1: nombres de campos, de categorías, los topes, el JSON. */
const ESQUEMA = ['newDocSays', 'existingDocSays', 'evidenceInNewDoc', 'evidenceInExistingDoc', 'uniqueToNewDoc', 'overlappingContent',
  'overlapPercent', 'contradictions', 'severity', 'conflictoNormativo', 'norma_contra_norma', 'norma_contra_practica', 'minor_inconsistency',
  '"contradiction"', 'duplicado_exacto', 'tema_similar', 'sin_relacion', 'verdict', 'veredicto',
  'Máximo 10', 'JSON', 'description', 'topic', 'lleva el campo', '{', '}'];

describe('m1, la llamada 1: el prompt del producto con supresiones', () => {
  it('⚠️ CONTROL POSITIVO: el prompt del producto SÍ lleva todo ese esquema en sus instrucciones', () => {
    const ins = instrucciones(delProducto());
    expect(ESQUEMA.filter(n => !ins.includes(n))).toEqual([]);
  });

  it('después de las supresiones, NINGÚN nombre del esquema queda en lo que queda de las instrucciones DEL PRODUCTO', () => {
    const p = promptDeProsa(delProducto());
    if (!p.ok) throw new Error(p.motivo);
    // la instrucción de prosa, que es lo único añadido, dice «sin JSON» y «tu veredicto» a propósito: se mira lo del producto
    expect(ESQUEMA.filter(n => instrucciones(p.prompt).slice(0, -INSTRUCCION_DE_PROSA.length).includes(n))).toEqual([]);
  });

  it('LO QUE QUEDA, TAL CUAL: la regla principal, el razonamiento de la excepción, la del sujeto y la exigencia de citas literales; y acaba en la prosa', () => {
    const p = promptDeProsa(delProducto());
    if (!p.ok) throw new Error(p.motivo);
    for (const s of [
      'REGLA PRINCIPAL, POR ENCIMA DE TODAS LAS DEMAS:\nAntes de emitir cualquier hallazgo, verifica que los dos textos hablan del\nMISMO DATO CONCRETO.',
      'SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?',
      'Y LO QUE UNA DE LAS DOS REGLAS PERMITE NO ES UN HECHO SUPUESTO',
      'PRINCIPIO EXCLUYE, HAY CONFLICTO NORMATIVO, aunque el que enuncia el',
      'ORDEN OBLIGATORIO: primero aplicas todo lo de arriba.',
      '- las dos son reglas, y no se pueden cumplir las dos.',
      '- una es una regla y la otra describe lo que se\n  hace de verdad.',
      EXCEPCION_DEL_SUJETO,
      '- copia LITERALMENTE un fragmento del DOCUMENTO NUEVO.',
      '- copia literalmente un fragmento del DOCUMENTO EXISTENTE.',
      '- Cada cita es un tramo de texto CONTIGUO del documento, copiado tal cual.',
      '- Las citas deben ser TEXTO COPIADO tal cual del documento',
      '- Si no puedes copiar una frase literal que sustente el hallazgo, no emitas ese hallazgo.',
    ]) expect(p.prompt).toContain(s);
    expect(p.prompt.endsWith(INSTRUCCION_DE_PROSA)).toBe(true);
    expect(INSTRUCCION_DE_PROSA).toContain('entre comillas');
  });

  it('EL REGISTRO DE LA DOSIS: sólo supresiones y una sustitución; las cuentas cuadran, carácter a carácter', () => {
    const producto = delProducto(), p = promptDeProsa(producto);
    if (!p.ok) throw new Error(p.motivo);
    expect(p.supresiones.map(s => s.nombre)).toEqual(SUPRESIONES.map(s => s.nombre));
    expect(p.caracteresSuprimidos).toBe(SUPRESIONES.reduce((n, s) => n + s.texto.length, 0));
    expect(p.sustitucion).toEqual({ quitado: INSTRUCCION_DE_SALIDA_DEL_JUEZ.length, puesto: INSTRUCCION_DE_PROSA.length });
    expect(p.prompt.length).toBe(producto.length - p.caracteresSuprimidos - INSTRUCCION_DE_SALIDA_DEL_JUEZ.length + INSTRUCCION_DE_PROSA.length);
    // y son SUPRESIONES: lo que queda de las instrucciones es una subsecuencia de las del producto, en orden
    const queda = instrucciones(p.prompt).slice(0, -INSTRUCCION_DE_PROSA.length), de = instrucciones(producto);
    let k = 0; for (const ch of queda) { k = de.indexOf(ch, k); expect(k).toBeGreaterThanOrEqual(0); k++; }
  });

  it('LA HUELLA DE LA PLANTILLA de la llamada 1 (con los textos de prueba): cualquier cambio de la dosis la mueve', () => {
    const p = promptDeProsa(delProducto());
    if (!p.ok) throw new Error(p.motivo);
    expect(p.huella).toBe(huella(p.prompt));
    expect(p.huella).toBe('b49f3240bfdbfa6a');
  });

  it('LOS DOCUMENTOS NO SE TOCAN, aunque lleven los mismos textos que se suprimen', () => {
    const conEsquema = 'El campo "severity" y (la lista uniqueToNewDoc) y JSON { } dentro del documento.';
    const producto = delProducto(conEsquema, conEsquema), p = promptDeProsa(producto);
    if (!p.ok) throw new Error(p.motivo);
    const corte = producto.indexOf(INICIO_DE_LAS_INSTRUCCIONES);
    expect(p.prompt.slice(0, corte)).toBe(producto.slice(0, corte));
  });

  it('las negativas: una supresión que sale dos veces, el bloque final que falta, la regla principal que falta', () => {
    const producto = delProducto();
    const duplicada = producto.replace(INICIO_DE_LAS_INSTRUCCIONES, INICIO_DE_LAS_INSTRUCCIONES + ' (la lista uniqueToNewDoc)');
    expect(promptDeProsa(duplicada)).toMatchObject({ ok: false, motivo: expect.stringContaining('sale 2 veces') });
    expect(promptDeProsa(producto.slice(0, -10))).toMatchObject({ ok: false, motivo: expect.stringContaining('bloque final') });
    expect(promptDeProsa(producto.replace(INICIO_DE_LAS_INSTRUCCIONES, '\n\nOTRA COSA\n'))).toMatchObject({ ok: false, motivo: expect.stringContaining('REGLA PRINCIPAL') });
  });
});

describe('m1, la llamada 2 y las dos juntas', () => {
  afterEach(() => { llamadas.length = 0; respuestaJson = null; vi.unstubAllEnvs(); });

  it('la extracción: la prosa entre comillas triples, la definición del campo de la excepción sin copiarla, y el bloque final del producto al final', () => {
    const e = promptDeExtraccion('PROSA');
    expect(e).toContain('INFORME:\n"""\nPROSA\n"""');
    expect(e).toContain('EXTRAER, NO VOLVER A JUZGAR');
    expect(e.endsWith(INSTRUCCION_DE_SALIDA_DEL_JUEZ)).toBe(true);
    expect(EXCEPCION_DE_LAS_REGLAS).toContain(e.slice(e.indexOf('Ese hallazgo lleva el campo'), e.indexOf('\n- "norma_contra_norma"')));
  });

  it('DOS llamadas, con LAS MISMAS opciones que recibe del juez: la prosa con el prompt de la llamada 1, y la extracción con esa prosa', async () => {
    respuestaJson = { overlapPercent: 0, verdict: 'sin_relacion', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] };
    const rastro: RastroDeM1 = {}, opciones = { etiqueta: { etapa: 'juez' as const, pareja: 'c' } };
    const r = await respuestaEnDosLlamadas(rastro)(delProducto(), opciones);
    expect(r).toBe(respuestaJson);
    expect(llamadas.map(l => l.tipo)).toEqual(['texto', 'json']);
    const p = promptDeProsa(delProducto());
    if (!p.ok) throw new Error(p.motivo);
    expect(llamadas[0].prompt).toBe(p.prompt);
    expect(llamadas[1].prompt).toBe(promptDeExtraccion('LA PROSA DEL JUEZ, con "una cita".'));
    for (const l of llamadas) expect(l.opciones).toBe(opciones);
    expect(rastro).toEqual({ prosa: 'LA PROSA DEL JUEZ, con "una cita".', huellaDeLaProsaEnviada: p.huella, huellaDeLaExtraccionEnviada: huella(llamadas[1].prompt) });
  });

  it('POR LA COSTURA DEL PRODUCTO: lo extraído pasa por la puerta de citas del producto (la inventada se descarta, con su texto)', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    const trozo = (i: number, text: string): StoredChunk => ({ chunkIndex: i, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
    const a = [0, 1, 2].map(i => trozo(i, `Analizado ${i}. ` + 'La función puede recaer en el propio Director Clínico del centro. '.repeat(3)));
    const c = [0, 1, 2].map(i => trozo(i, `Candidato ${i}. ` + 'La retirada la decide el Coordinador de Calidad, nunca por el Director Clínico. '.repeat(3)));
    respuestaJson = { overlapPercent: 0, verdict: 'sin_relacion', overlappingContent: [], uniqueToNewDoc: [], contradictions: [
      { topic: 'real', newDocSays: 'La función puede recaer en el propio Director Clínico del centro.', existingDocSays: 'La retirada la decide el Coordinador de Calidad, nunca por el Director Clínico.', severity: 'contradiction' },
      { topic: 'inventada', newDocSays: 'esta frase no está en ninguno de los dos documentos y la puerta la tiene que tirar', existingDocSays: 'La retirada la decide el Coordinador de Calidad, nunca por el Director Clínico.', severity: 'contradiction' },
    ] };
    const r = await judgeAllDocuments({
      newDocumentName: 'NOR-10.docx', newDocumentSample: a.map(x => x.text).join('\n\n'), newDocumentChunks: a, chunksByDocument: new Map([['c', c]]),
      candidates: [{ documentId: 'c', documentName: 'CLI-12.docx', source: 'manual', rerankReason: '', rerankConfidence: 'sin_declarar', fragments: [] }],
      options: { exhaustive: false }, obtenerRespuesta: respuestaEnDosLlamadas({}),
    });
    expect(llamadas.map(l => l.tipo)).toEqual(['texto', 'json']);
    expect(r.judgments[0].contradictions.map(x => x.topic)).toEqual(['real']);
    expect(r.judgments[0].descartesPorCita?.map(x => x.tema)).toEqual(['inventada']);
    // y la etiqueta del juez, con su pareja, llega a las dos llamadas
    for (const l of llamadas) expect(l.opciones).toMatchObject({ etiqueta: { etapa: 'juez', pareja: 'c' } });
  });
});
