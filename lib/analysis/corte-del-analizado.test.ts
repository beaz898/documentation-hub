import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { leerLaPareja, piezasDelAnalizado, buildAnalyzedDocumentText } from './judge';
import { AVANCE_MAXIMO_DEL_CORTE, SEPARADOR, cortarEnLimiteDePieza, finesDePiezas } from './corte-del-analizado';
import { repartoDeLaPareja } from './reparto-de-la-pareja';

/**
 * EL CORTE DEL ANALIZADO EN UN LÍMITE DE PIEZA (3.1.2, primera mitad, 23/10/2026). Cada rama con su caso
 * decisivo; el caso medido de 40.000 (F-128, 19/10) con los trozos reales de NOR-10, de punta a punta por
 * `leerLaPareja`; un barrido del corte sobre los diez documentos del corpus; y el cableado en el juez.
 * Con la ventana de producción (150.000) ninguna pareja del corpus tiene corte: esto sólo se ejerce aquí.
 */
const cortar = (piezas: string[], tope: number) => cortarEnLimiteDePieza(piezas.join(SEPARADOR), finesDePiezas(piezas), tope);
const p = (n: number, letra = 'x') => letra.repeat(n);

describe('las ramas del corte, cada una con su caso decisivo', () => {
  it('los fines de pieza son los del texto unido: cada uno es donde empieza un separador, y el último es el largo', () => {
    const piezas = [p(10, 'a'), p(5, 'b'), p(7, 'c')];
    const t = piezas.join(SEPARADOR);
    expect(finesDePiezas(piezas)).toEqual([10, 17, 26]);
    expect(t.slice(10, 12)).toBe(SEPARADOR);
    expect(t.length).toBe(26);
  });
  it('cabe entero: no hay corte ni modo', () => {
    expect(cortar([p(100), p(100)], 202)).toEqual({ texto: p(100) + SEPARADOR + p(100) });
  });
  it('el tope cae justo en un límite: se corta ahí', () => {
    expect(cortar([p(100, 'a'), p(100, 'b')], 100)).toEqual({ texto: p(100, 'a'), modo: 'limite_exacto' });
  });
  it('el tope cae en el separador: la pieza anterior ya acabó, se corta en su fin', () => {
    expect(cortar([p(100, 'a'), p(100, 'b')], 101)).toEqual({ texto: p(100, 'a'), modo: 'limite_exacto' });
  });
  it('AVANZA: el tope cae dentro de una pieza de hasta 3.000, y se corta al final de esa pieza', () => {
    const r = cortar([p(100, 'a'), p(AVANCE_MAXIMO_DEL_CORTE, 'b'), p(100, 'c')], 150);
    expect(r.modo).toBe('avanza');
    expect(r.texto).toBe(p(100, 'a') + SEPARADOR + p(AVANCE_MAXIMO_DEL_CORTE, 'b'));
  });
  it('CASO DECISIVO del tope: con 3.000 justos avanza; con 3.001, RETROCEDE al límite anterior', () => {
    expect(cortar([p(100, 'a'), p(3_000, 'b'), p(100, 'c')], 150).modo).toBe('avanza');
    const r = cortar([p(100, 'a'), p(3_001, 'b'), p(100, 'c')], 150);
    expect(r).toEqual({ texto: p(100, 'a'), modo: 'retrocede' });
  });
  it('sin límite anterior y la primera pieza pasa de 3.000: se queda la POSICIÓN, no el analizado vacío', () => {
    expect(cortar([p(5_000, 'a'), p(100, 'b')], 1_234)).toEqual({ texto: p(1_234, 'a'), modo: 'posicion' });
  });
  it('una sola pieza (el texto plano): por posición, como antes', () => {
    expect(cortarEnLimiteDePieza(p(9_000), [9_000], 6_000)).toEqual({ texto: p(6_000), modo: 'posicion' });
  });
});

const NOMBRES = /^(NOR-10|CLI-12|NOR-11|CLI-13|OPE-10|OPE-11|OPE-13|RRHH-08|OPE-15|CLI-20)_/;
const NOR10 = 'NOR-10_protocolo-esterilizacion-instrumental.docx', CLI12 = 'CLI-12_manual-calidad-clinica.docx';
const trozos = async (f: string) => toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o'));
let docs: { nombre: string; piezas: string[] }[] = [];
let nor: StoredChunk[] = [], cli: StoredChunk[] = [];
beforeAll(async () => {
  for (const f of readdirSync('corpus-pruebas').filter(f => NOMBRES.test(f))) docs.push({ nombre: f.slice(0, f.indexOf('_')), piezas: piezasDelAnalizado(await trozos(f), f) });
  nor = await trozos(NOR10); cli = await trozos(CLI12);
}, 120_000);

describe('EL CASO MEDIDO: NOR-10 contra CLI-12 con la ventana de 40.000 (F-128, 19/10)', () => {
  it('las piezas son el mismo texto que arma el juez', () => {
    expect(piezasDelAnalizado(nor, NOR10).join(SEPARADOR)).toBe(buildAnalyzedDocumentText(nor, NOR10));
  });
  it('el corte AVANZA hasta el final del trozo en el que caía el de posición, y B queda dentro entera', () => {
    const piezas = piezasDelAnalizado(nor, NOR10), completo = piezas.join(SEPARADOR), fines = finesDePiezas(piezas);
    const bloque = 'b'.repeat(2_857);                                      // el bloque del candidato medido el 16/10
    const reparto = repartoDeLaPareja({ analizado: completo.length, candidato: buildAnalyzedDocumentText(cli, CLI12).length, reservaMontada: bloque.length, ventana: 40_000 });
    const r = leerLaPareja({
      parejaEntera: true, documentId: 'cli', documentName: CLI12, analizadoCompleto: completo, finesDelAnalizado: fines,
      analizadoConTrozos: true, analizadoViejo: { texto: '', lado: { caracteres: 0, mostrados: 0, dejoFuera: true } },
      candidatoChunks: cli, fragmentosEnviados: [], bloqueRelevancia: bloque, elegido: { reparto, seleccion: 'la_de_la_recuperacion' },
    });
    const tope = 40_000 - 2_857;
    expect(tope).toBe(37_143);                                             // el corte por posición de la tanda de F-128
    expect(r.lectura.corteDelAnalizado).toBe('avanza');
    const fin = r.textoAnalizado.length;
    expect(fines).toContain(fin);                                          // acaba en un límite de pieza
    expect(fin).toBeGreaterThan(tope);
    expect(fin - tope).toBeLessThanOrEqual(AVANCE_MAXIMO_DEL_CORTE);
    expect(fines.filter(f => f < tope).at(-1)).toBe(36_483);               // el límite anterior que daba F-128
    // B, entera: su dato en 36.599 y su frase, que acaba después, dentro de lo entregado
    expect(r.textoAnalizado.toLowerCase().indexOf('semanalmente, todos los lunes') + 1).toBe(36_599);
    // y la frase que el corte por posición partía, «…tras la incubación), | el autoclave se retira…», entra entera
    expect(r.textoAnalizado).toContain('el autoclave se retira inmediatamente de servicio');
    expect(r.lectura.analizado).toEqual({ caracteres: completo.length, mostrados: fin, dejoFuera: true });
  });
});

describe('EL BARRIDO DEL CORTE sobre los diez documentos del corpus', () => {
  it('al subir el tope, el corte nunca baja, siempre cae en un límite (o en la posición, sin límite anterior), y nunca avanza más de 3.000', () => {
    const malos: string[] = [];
    for (const d of docs) {
      const completo = d.piezas.join(SEPARADOR), fines = finesDePiezas(d.piezas);
      let antes = -1;
      for (let tope = 0; tope <= completo.length + 10; tope += 7) {
        const r = cortarEnLimiteDePieza(completo, fines, tope);
        const n = r.texto.length;
        if (n < antes) { malos.push(`${d.nombre}: baja en ${tope}`); break; }
        if (!completo.startsWith(r.texto)) { malos.push(`${d.nombre}: no es prefijo en ${tope}`); break; }
        if (r.modo && r.modo !== 'posicion' && !fines.includes(n)) { malos.push(`${d.nombre}: no cae en límite en ${tope}`); break; }
        if (r.modo === 'avanza' && n - tope > AVANCE_MAXIMO_DEL_CORTE) { malos.push(`${d.nombre}: avanza ${n - tope} en ${tope}`); break; }
        antes = n;
      }
    }
    expect(docs.length).toBe(10);
    expect(malos).toEqual([]);
  });
});

describe('el corte, cableado en el juez', () => {
  const judge = readFileSync('lib/analysis/judge.ts', 'utf8');
  it('judgeAllDocuments calcula los fines de las MISMAS piezas que el texto, y los pasa hasta leerLaPareja', () => {
    expect(judge).toMatch(/const piezas = hasChunks \? piezasDelAnalizado\(args\.newDocumentChunks!, args\.newDocumentName\) : null;/);
    expect(judge).toMatch(/const finesDelAnalizado = piezas \? finesDePiezas\(piezas\) : \[fullDocumentText\.length\];/);
    expect(judge).toMatch(/analizadoCompleto: fullDocumentText,\s*finesDelAnalizado,/);
    expect(judge).toMatch(/finesDelAnalizado: args\.finesDelAnalizado,/);
    expect(judge).toMatch(/cortarEnLimiteDePieza\(completo, a\.finesDelAnalizado \?\? \[completo\.length\], topeDelAnalizado\)/);
  });
});
