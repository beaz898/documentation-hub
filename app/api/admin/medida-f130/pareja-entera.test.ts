import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { StoredChunk } from '@/lib/read-chunks';
import { buildAnalyzedDocumentText } from '@/lib/analysis/judge';
import { TAMANO_VENTANA } from '@/lib/analysis/reparto-de-la-pareja';
import { PREGUNTA_CERRADA } from './medida-f130';
import { CRITERIO_DEL_CUMPLIMIENTO } from './criterio-del-cumplimiento';
import { construirPromptConLineas } from './lineas-de-hallazgo';
import { ENCABEZADOS_D3, construirPromptD3, leerParejaEntera, plantillaD3 } from './pareja-entera';

// LA PAREJA ENTERA, RUTA d3 (10/11/2026). (a) `d` y `d2` no cambian: lo vigilan `lineas-de-hallazgo.test.ts` (los dos prompts,
// byte a byte, contra el ensayo archivado) y la negativa dura de `medida-f130.test.ts`, que ahora recorre también `d3`.
const leer = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const trozo = (i: number, text: string): StoredChunk => ({ chunkIndex: i, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const doc = (n: number, largo: number) => Array.from({ length: n }, (_, i) => trozo(i, `Trozo ${i}. ` + 'x'.repeat(largo)));

describe('d3: la pareja entera (10/11)', () => {
  it('(b) LA PLANTILLA de d3 es la de siempre con los tres encabezados cambiados, y NADA MÁS', () => {
    const pl = plantillaD3();
    if (!pl.ok) throw new Error(pl.motivo);
    const antes = PREGUNTA_CERRADA.split('\n'), despues = pl.plantilla.split('\n');
    expect(despues).toHaveLength(antes.length);
    const distintas = antes.flatMap((l, i) => (l === despues[i] ? [] : [{ de: l, a: despues[i] }]));
    expect(distintas).toEqual(ENCABEZADOS_D3);
    expect(pl.plantilla).not.toContain('{{TROZO_A}}');
    expect(pl.plantilla).not.toContain('{{TROZO_B}}');
  });

  it('(b) EL PROMPT de d3 y el de d2, con los mismos textos, sólo se separan en esos tres encabezados', () => {
    if (!CRITERIO_DEL_CUMPLIMIENTO.ok) throw new Error(CRITERIO_DEL_CUMPLIMIENTO.motivo);
    const textoA = 'NOR-10 entero.\nCon dos líneas.', textoB = 'CLI-12 entero.';
    const d2 = construirPromptConLineas({ documento1: 'NOR-10.docx', trozoA: 4, textoA, documento2: 'CLI-12.docx', trozoB: 6, textoB }, CRITERIO_DEL_CUMPLIMIENTO.texto);
    const d3 = construirPromptD3({ documento1: 'NOR-10.docx', textoA, documento2: 'CLI-12.docx', textoB }, CRITERIO_DEL_CUMPLIMIENTO.texto);
    if (!d2.ok || !d3.ok) throw new Error('no se armó');
    const a = d2.prompt.split('\n'), b = d3.prompt.split('\n');
    expect(b).toHaveLength(a.length);
    const distintas = a.flatMap((l, i) => (l === b[i] ? [] : [[l, b[i]]]));
    expect(distintas).toEqual([
      ['PAREJA 1: NOR-10.docx, trozo 4 ↔ CLI-12.docx, trozo 6', 'PAREJA 1: NOR-10.docx (documento completo) ↔ CLI-12.docx (documento completo)'],
      ['TEXTO 1 · NOR-10.docx, trozo 4:', 'TEXTO 1 · NOR-10.docx (documento completo):'],
      ['TEXTO 2 · CLI-12.docx, trozo 6:', 'TEXTO 2 · CLI-12.docx (documento completo):'],
    ]);
  });

  it('(b) sin un encabezado, o con uno repetido, no hay plantilla; y sin criterio, no hay prompt', () => {
    expect(plantillaD3('nada que ver').ok).toBe(false);
    expect(plantillaD3(`${PREGUNTA_CERRADA}\n${ENCABEZADOS_D3[1].de}`).ok).toBe(false);
    expect(construirPromptD3({ documento1: 'a', textoA: 'x', documento2: 'b', textoB: 'y' }, '  ').ok).toBe(false);
  });

  it('(c) CABE → pareja_entera, y los dos textos son los documentos enteros tal como los monta el producto', () => {
    const A = doc(5, 200), C = doc(4, 150);
    const r = leerParejaEntera({ analizado: { nombre: 'NOR-10.docx', trozos: A }, candidato: { documentId: 'c', nombre: 'CLI-12.docx', trozos: C } });
    if (!r.ok) throw new Error(r.motivo);
    expect(r.lectura.regimen).toBe('pareja_entera');
    expect(r.textoAnalizado).toBe(buildAnalyzedDocumentText(A, 'NOR-10.docx'));
    expect(r.bloqueCandidato).toBe(buildAnalyzedDocumentText(C, 'CLI-12.docx'));
  });

  it('(c) ⚠️ NO CABE EN LA VENTANA → no es pareja_entera y NO se mide: el régimen sale en el error', () => {
    const grande = Math.ceil(TAMANO_VENTANA / 10);
    const r = leerParejaEntera({ analizado: { nombre: 'NOR-10.docx', trozos: doc(8, grande) }, candidato: { documentId: 'c', nombre: 'CLI-12.docx', trozos: doc(8, grande) } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.regimen).toBe('corte_honesto');
  });

  it('(c) un lado sin trozos (la lectura falló o vino vacía) → sin_fuente_comun, y NO se mide', () => {
    const r = leerParejaEntera({ analizado: { nombre: 'NOR-10.docx', trozos: doc(3, 50) }, candidato: { documentId: 'c', nombre: 'CLI-12.docx', trozos: [] } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.regimen).toBe('sin_fuente_comun');
  });

  it('(c) LA RUTA d3: su propio constructor, la lectura del producto, las DOS negativas antes del ensayo y del modelo, y la huella', () => {
    const r = leer('app/api/admin/medida-f130/d3/route.ts');
    expect(r).toContain('const armado = construirPromptD3(');
    expect(r).not.toMatch(/construirPrompt\(|construirPromptConLineas\(/);
    expect(r).toContain('const pareja = leerParejaEntera(');
    const trozos = r.indexOf("if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });");
    const regimen = r.indexOf('if (!pareja.ok) return NextResponse.json({ error: pareja.motivo, regimen: pareja.regimen }, { status: 409 });');
    const ensayo = r.indexOf("if (req.nextUrl.searchParams.get('ensayo') === '1')");
    const modelo = r.indexOf('await preguntarAlJuez(');
    expect(trozos).toBeGreaterThan(-1);
    expect(regimen).toBeGreaterThan(trozos);
    expect(ensayo).toBeGreaterThan(regimen);
    expect(modelo).toBeGreaterThan(ensayo);
    expect(r.split('preguntarAlJuez(').length - 1).toBe(1);
    // la huella del prompt armado, en el ensayo y en la tanda (dos `huellaDelPrompt,` en las respuestas, más la definición)
    expect(r).toContain('const huellaDelPrompt = huella(armado.prompt);');
    expect(r.split('huellaDelPrompt,').length - 1).toBe(2);
    // el sondeo es UNA llamada, y la tanda las de siempre
    expect(r).toContain('{ length: sondeo ? 1 : VECES_DE_D }');
    // y `leerParejaEntera` pasa de verdad por `leerLaPareja` del producto, y sólo deja pasar pareja_entera
    const m = leer('app/api/admin/medida-f130/pareja-entera.ts');
    expect(m).toContain('const pareja = leerLaPareja({');
    expect(m).toContain("if (r !== 'pareja_entera') {");
  });

  it('(c) la página tiene los tres botones de d3, y los de d y d2 siguen igual', () => {
    const p = leer('app/api/admin/medida-f130/page.tsx');
    expect(p).toContain("medir('d3?ensayo=1')");
    expect(p).toContain("medir('d3?sondeo=1')");
    expect(p).toContain("medir('d3')");
    expect(p).toContain("medir('d2')}>D2 · la tanda: la misma pareja con las dos líneas de hallazgo, 21 veces (gasta en la API)");
    expect(p).toContain("medir('d')}>D · la tanda: NOR-10 §2.4 ↔ CLI-12 §3.5, 21 veces (gasta en la API)");
  });
});
