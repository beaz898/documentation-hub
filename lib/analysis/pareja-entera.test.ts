import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  interruptorParejaEntera, leerLaPareja, lineaDeLaLectura, parejaEnteraEnEsteModo, recortarAnalizado,
} from './judge';
import { TAMANO_VENTANA, repartoDeLaPareja } from './reparto-de-la-pareja';
import type { StoredChunk } from '@/lib/read-chunks';
import type { DocumentFragment } from './types';

/**
 * ESCALÓN 1 (B.295, 29/09/2026): la puerta del juez con el presupuesto por
 * PAREJA. Casos decisivos: el borde del presupuesto (cabe entera / corte honesto),
 * el corte honesto por posición con el suelo del candidato, y el interruptor que
 * sólo se enciende con '1'.
 *
 * ⚠️ ACTUALIZADO EL 21/10/2026 (3.1.3): la cascada D-3 —presupuesto de 40.000 y suelo del analizado de
 * 6.000— la sustituye el reparto de `lib/analysis/reparto-de-la-pareja.ts`, con la ventana de 80.000.
 * Las pruebas que la fijaban NO se han borrado: lo viejo queda tachado en comentario, con su fecha, y
 * debajo lo nuevo. En las de aquí, el bloque por relevancia de `pareja()` (21 caracteres) es la reserva.
 * ⚠️ Y EL 22/10/2026 la ventana sube de 80.000 a 150.000: las pruebas pasan a escribirse con P = TAMANO_VENTANA,
 * y sólo una escribe el número. Lo de 80.000, tachado en su sitio.
 */

const VARIABLE = 'ANALYSIS_PAREJA_ENTERA';
const original = process.env[VARIABLE];
afterEach(() => {
  if (original === undefined) delete process.env[VARIABLE]; else process.env[VARIABLE] = original;
  vi.restoreAllMocks();
});

const prosa = (chunkIndex: number, text: string): StoredChunk =>
  ({ chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const frag = (chunkIndex: number, text: string): DocumentFragment =>
  ({ text, documentId: 'c1', documentName: 'C.docx', source: 'manual', score: 0.9, chunkIndex });
const VIEJO = { texto: 'recorte-viejo', lado: { caracteres: 99, mostrados: 13, dejoFuera: true } };

/**
 * Una pareja: el analizado de `nA` caracteres y un candidato de `nC` en dos
 * trozos, de los que la relevancia envió sólo el primero (como hace hoy).
 * Entero, el candidato se renderiza como «trozo1\n\ntrozo2»: `nC` justos.
 */
function pareja(nA: number, nC: number, parejaEntera = true, extra: Partial<Parameters<typeof leerLaPareja>[0]> = {}) {
  const mitad = Math.floor((nC - 2) / 2);
  const t0 = 'c'.repeat(mitad);
  const t1 = 'd'.repeat(nC - 2 - mitad);
  return leerLaPareja({
    parejaEntera, documentId: 'c1', documentName: 'C.docx',
    analizadoCompleto: 'a'.repeat(nA), analizadoConTrozos: true, analizadoViejo: VIEJO,
    candidatoChunks: [prosa(0, t0), prosa(1, t1)], fragmentosEnviados: [frag(0, t0)],
    bloqueRelevancia: 'bloque-por-relevancia', ...extra,
  });
}

describe('el presupuesto por pareja', () => {
  // ~~10.000 tokens = 40.000 caracteres, y el suelo del analizado es lo que recibe hoy (6.000)~~ (hasta el 21/10/2026):
  // ~~expect(PRESUPUESTO_PAREJA_CARACTERES).toBe(40_000); expect(SUELO_DEL_ANALIZADO).toBe(6000);~~
  // ~~la ventana del interino es de 80.000: expect(TAMANO_VENTANA).toBe(80_000)~~ (21/10/2026 a 22/10/2026)
  it('22/10/2026: la ventana del interino es de 150.000 —LA ÚNICA PRUEBA QUE ESCRIBE EL NÚMERO—, y la tijera vieja sigue dando 6.000 al analizado', () => {
    expect(TAMANO_VENTANA).toBe(150_000);
    expect(recortarAnalizado('x'.repeat(9000), false).texto.length).toBe(6000);
  });
});

/**
 * 22/10/2026 (arquitecto, al subir la ventana de 80.000 a 150.000): las pruebas de abajo se escriben con P,
 * la ventana de producción, y no con su valor. Una prueba que escribe la constante se rompe veinte veces;
 * una que la referencia se rompe una, y a propósito: la de arriba.
 */
const P = TAMANO_VENTANA;

describe('la puerta del juez', () => {
  it('apagado: la tijera vieja, con sus textos de siempre', () => {
    const r = pareja(14704, 9817, false);
    expect(r.textoAnalizado).toBe('recorte-viejo');
    expect(r.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(r.lectura.regimen).toBe('tijera_vieja');
    expect(r.lectura.presupuesto).toBeNull();
  });
  it('la pareja NOR-11/CLI-13 (14.704 + 9.817) cabe: los dos lados ENTEROS', () => {
    const r = pareja(14704, 9817);
    expect(r.lectura.regimen).toBe('pareja_entera');
    expect(r.textoAnalizado.length).toBe(14704);
    expect(r.bloqueCandidato.length).toBe(9817);
    expect(r.lectura.analizado).toEqual({ caracteres: 14704, mostrados: 14704, dejoFuera: false });
    expect(r.lectura.candidato).toEqual({ caracteres: 9817, mostrados: 9817, dejoFuera: false });
    // ~~expect(r.lectura.presupuesto).toBe(40_000);~~ (hasta el 21/10/2026)
    // ~~expect(r.lectura.presupuesto).toBe(80_000);~~ (21/10/2026 a 22/10/2026)
    expect(r.lectura.presupuesto).toBe(P);
  });
  // ~~CASO DECISIVO del borde: 40.000 justos caben; uno más, corte honesto~~ (hasta el 21/10/2026):
  // ~~pareja(30_000, 10_000) → pareja_entera; pareja(30_001, 10_000) → corte_honesto~~
  // ~~80.000 justos caben: pareja(70_000, 10_000) → pareja_entera; pareja(70_001, 10_000) → corte~~ (21/10 a 22/10/2026)
  it('22/10/2026, CASO DECISIVO del borde: P justos caben; uno más, corte honesto', () => {
    expect(pareja(P - 10_000, 10_000).lectura.regimen).toBe('pareja_entera');
    expect(pareja(P - 9_999, 10_000).lectura.regimen).toBe('corte_honesto');
  });
  // ~~D-3 paso 1-2: el candidato cabe entero dejando el suelo → entero, y el analizado se lleva el resto~~
  // ~~pareja(66_669, 5_000): candidato entero 5.000, analizado 35.000 de 66.669~~ (hasta el 21/10/2026).
  // Con el reparto, en el corte honesto el candidato sólo va entero si cabe en su resto, y su resto es
  // P − A cuando el analizado cabe: entonces cabrían los dos y no habría corte. Así que sólo pasa cuando el
  // analizado ocupa todo salvo la reserva y el candidato cabe en ella.
  // ~~pareja(79_990, 20): analizado 79.980 de 79.990~~ (21/10 a 22/10/2026)
  it('22/10/2026: el candidato va entero en el corte honesto sólo si cabe en la reserva, y el analizado se lleva el resto', () => {
    const r = pareja(P - 10, 20);
    expect(r.lectura.regimen).toBe('corte_honesto');
    expect(r.lectura.candidato).toEqual({ caracteres: 20, mostrados: 20, dejoFuera: false });
    expect(r.lectura.analizado).toEqual({ caracteres: P - 10, mostrados: P - 20, dejoFuera: true });
    expect(r.lectura.seleccion).toBe('entero');
  });
  // ~~D-3 el borde del paso 1: con 34.000 justos el candidato entra entero y el analizado queda en su suelo~~
  // ~~pareja(38_000, 34_000) entero y el analizado en 6.000; con 34.001, bloque~~ (hasta el 21/10/2026)
  // ~~pareja(79_990, 21) entero; pareja(79_990, 22) bloque~~ (21/10 a 22/10/2026)
  it('22/10/2026, el borde: el candidato del tamaño justo de la reserva entra entero; uno más, su bloque', () => {
    expect(pareja(P - 10, 21).lectura.candidato.dejoFuera).toBe(false);
    expect(pareja(P - 10, 22).lectura.candidato.dejoFuera).toBe(true);
  });
  // ~~D-3 paso 3: el candidato entero no cabe ni con el suelo → su bloque por relevancia, y el analizado el resto~~
  // ~~pareja(10_000, 36_000)~~ (hasta el 21/10/2026; con 80.000 esa pareja cabe entera)
  // ~~pareja(10_000, 75_000)~~ (21/10 a 22/10/2026; con 150.000 cabe entera)
  it('22/10/2026: el candidato no cabe en su resto → su bloque por relevancia, y el analizado entero porque cabe', () => {
    const r = pareja(10_000, P - 5_000);
    expect(r.lectura.regimen).toBe('corte_honesto');
    expect(r.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(r.lectura.candidato.dejoFuera).toBe(true);
    expect(r.lectura.analizado.dejoFuera).toBe(false);
  });
  // ~~el caso real del 29/09: NOR-11 contra NOR-10 (66.801) y contra CLI-12 (55.135) → paso 3, el analizado
  // ENTERO y el candidato por relevancia~~ (hasta el 21/10/2026, con 40.000).
  // ~~el caso real con 80.000: NOR-11 contra NOR-10 → corte honesto con el analizado ENTERO; contra CLI-12 y CLI-13,
  // ENTERAS~~ (21/10 a 22/10/2026; con 150.000, NOR-11 ↔ NOR-10 cabe entera)
  it('22/10/2026, los casos reales del corpus: cada pareja va entera si cabe en P y, si no, en corte con el analizado ENTERO', () => {
    for (const [nA, nC] of [[14_704, 66_801], [14_704, 55_135], [14_704, 9_817], [66_801, 55_135], [55_135, 66_801]]) {
      const r = pareja(nA, nC);
      expect(r.lectura.regimen).toBe(nA + nC <= P ? 'pareja_entera' : 'corte_honesto');
      expect(r.lectura.analizado).toEqual({ caracteres: nA, mostrados: nA, dejoFuera: false });
    }
  });
  // ~~D-3 el suelo del paso 3 aguanta aunque el bloque fuera enorme: el analizado en 6.000~~ (hasta el 21/10/2026).
  // Ya no hay suelo: el analizado se lleva lo que la fórmula promete, P − reserva.
  // ~~pareja(50_000, 36_000, reserva 35.000) → 45.000~~ (21/10 a 22/10/2026; con 150.000 cabe entera)
  it('22/10/2026: con una reserva enorme, el analizado recibe exactamente lo que el reparto promete', () => {
    const r = pareja(P - 30_000, 36_000, true, { bloqueRelevancia: 'r'.repeat(35_000) });
    const prometido = repartoDeLaPareja({ analizado: P - 30_000, candidato: 36_000, reservaMontada: 35_000 }).paraElAnalizado;
    expect(prometido).toBe(P - 35_000);
    expect(r.lectura.analizado.mostrados).toBe(prometido);
  });
  // ~~el reparto con analizado 70.000 (≤ 80.000 − 3.100) y candidato 30.000~~ (21/10 a 22/10/2026; con 150.000 cabe entera)
  it('22/10/2026: con el reparto de la segunda selección, se lee ése y no se recalcula, y la lectura dice de dónde salió el bloque', () => {
    // el reparto: el analizado cabe (P − 10.000 ≤ P − 3.100), así que va entero y al candidato le quedan 10.000
    const reparto = repartoDeLaPareja({ analizado: P - 10_000, candidato: 30_000, reservaMontada: 3_100 });
    expect(reparto.paraElCandidato).toBe(10_000);
    // y la segunda selección le dio un bloque que cabe en esos 10.000, como garantiza
    const bloque = 'b'.repeat(9_500);
    const r = pareja(P - 10_000, 30_000, true, { bloqueRelevancia: bloque, elegido: { reparto, seleccion: 'ampliada' } });
    expect(r.bloqueCandidato).toBe(bloque);
    expect(r.lectura.seleccion).toBe('ampliada');
    expect(r.lectura.analizado).toEqual({ caracteres: P - 10_000, mostrados: P - 10_000, dejoFuera: false });
  });
  it('21/10/2026, CASO DECISIVO de «se lee, no se recalcula»: un reparto decidido con otra ventana es el que manda', () => {
    // Con la garantía de la segunda selección cumplida, recalcular daría lo mismo: por eso el caso usa otra
    // ventana, que es lo único que distingue el reparto preguntado del recalculado.
    expect(90_000).not.toBe(P);                                       // 22/10/2026: que siga siendo OTRA
    const reparto = repartoDeLaPareja({ analizado: 70_000, candidato: 30_000, reservaMontada: 3_100, ventana: 90_000 });
    const r = pareja(70_000, 30_000, true, { bloqueRelevancia: 'b'.repeat(19_000), elegido: { reparto, seleccion: 'ampliada' } });
    expect(r.lectura.presupuesto).toBe(90_000);
  });
  // ~~pareja(100_000, 90_000, reserva 76.000) → 4.000~~ (21/10 a 22/10/2026; la cuenta era 80.000 − 76.000)
  it('22/10/2026, LA RESERVA GANA (decisión 4, hoy inalcanzable): con una reserva de P − 4.000 el analizado baja de los 6.000 de la tijera vieja', () => {
    // Hace falta una reserva por encima de P − 6.000, y la reserva de hoy es el bloque de 3.000 con sus
    // cabeceras. Si algún día se alcanza, se decidió así: el texto del candidato no se sacrifica.
    const r = pareja(P + 20_000, P + 10_000, true, { bloqueRelevancia: 'r'.repeat(P - 4_000) });
    expect(r.lectura.analizado.mostrados).toBe(4_000);
  });
  // ~~corte por relevancia con pareja(14_704, 66_801), candidato entero con pareja(79_990, 20)~~ (22/10/2026, con 80.000)
  it('22/10/2026: la lectura guarda cuántos trozos del candidato vio el juez, en los tres regímenes', () => {
    // el candidato de pareja() tiene 2 trozos y la relevancia envió el primero
    expect(pareja(14_704, 9_817).lectura.trozosDelCandidato).toBe(2);                 // pareja entera: los dos
    expect(pareja(10_000, P - 5_000).lectura.trozosDelCandidato).toBe(1);             // corte, por relevancia: uno
    expect(pareja(P - 10, 20).lectura.trozosDelCandidato).toBe(2);                    // corte, candidato entero: los dos
    expect(pareja(14_704, 9_817, false).lectura.trozosDelCandidato).toBe(1);          // tijera vieja: el enviado
  });
  it('D-1: encendido y un lado sin trozos → sin_fuente_comun, leído como la tijera vieja', () => {
    const cand = pareja(100, 100, true, { candidatoChunks: [] });
    expect(cand.lectura.regimen).toBe('sin_fuente_comun');
    expect(cand.lectura.presupuesto).toBeNull();
    expect(cand.textoAnalizado).toBe('recorte-viejo');
    expect(cand.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(cand.sinTrozos).toEqual({ analizado: false, candidato: true });
    const anal = pareja(100, 100, true, { analizadoConTrozos: false });
    expect(anal.lectura.regimen).toBe('sin_fuente_comun');
    expect(anal.sinTrozos).toEqual({ analizado: true, candidato: false });
  });
  it('D-1 (a): con el interruptor APAGADO, sin trozos sigue siendo tijera_vieja — sin_fuente_comun sólo existe encendido', () => {
    const r = pareja(100, 100, false, { candidatoChunks: [] });
    expect(r.lectura.regimen).toBe('tijera_vieja');
    expect(r.sinTrozos).toBeUndefined();
  });
  // ~~… presupuesto 80000~~ (21/10 a 22/10/2026)
  it('la línea del log sale de la misma lectura', () => {
    const r = pareja(14704, 9817);
    expect(lineaDeLaLectura('CLI-13.docx', r.lectura))
      .toBe(`[judge] "CLI-13.docx": pareja pareja_entera — analizado 14704/14704, candidato 9817/9817, presupuesto ${P}`);
  });
});

describe('el interruptor, fallando cerrado', () => {
  it('ausente: apagado y en silencio', () => {
    delete process.env[VARIABLE];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(interruptorParejaEntera()).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
  it("sólo '1' lo enciende", () => {
    process.env[VARIABLE] = '1';
    expect(interruptorParejaEntera()).toBe(true);
  });
  it('C3: en EXHAUSTIVO no se enciende nunca, ni lee la variable', () => {
    process.env[VARIABLE] = '1';
    expect(parejaEnteraEnEsteModo(true)).toBe(false);
    expect(parejaEnteraEnEsteModo(false)).toBe(true);
    process.env[VARIABLE] = 'mal';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parejaEnteraEnEsteModo(true)).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
  it.each(['true', 'on', ' 1', '0', ''])('«%s»: apagado, y lo dice en el log', v => {
    process.env[VARIABLE] = v;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(interruptorParejaEntera()).toBe(false);
    expect(warn.mock.calls[0][0]).toContain('se queda APAGADO');
  });
});

describe('EL INVARIANTE DE D-3, QUE EL REPARTO DEL 21/10 CONSERVA: encendido, ningún lado recibe menos que con la tijera vieja', () => {
  /** Una pareja coherente: la tijera vieja es la de verdad (recortarAnalizado), y el
   *  candidato tiene 4 trozos de los que la relevancia envió el 0 y el 2. */
  function coherente(nA: number, nC: number, encendido: boolean, sinTrozos: 'ninguno' | 'analizado' | 'candidato') {
    // Texto que VARÍA con la posición: con 'a'.repeat, el principio y el final son
    // la misma cadena y un corte por el final pasaría por uno por posición.
    const completo = Array.from({ length: nA }, (_, i) => String.fromCharCode(97 + (i % 26))).join('');
    const viejo = recortarAnalizado(completo, false);
    const q = Math.max(1, Math.floor((nC - 6) / 4));
    const trozos = [0, 1, 2, 3].map(i => prosa(i, String(i).repeat(q)));
    return leerLaPareja({
      parejaEntera: encendido, documentId: 'c1', documentName: 'C.docx',
      analizadoCompleto: completo, analizadoConTrozos: sinTrozos !== 'analizado',
      analizadoViejo: { texto: viejo.texto, lado: { ...viejo.medida, dejoFuera: viejo.recortado } },
      candidatoChunks: sinTrozos === 'candidato' ? [] : trozos,
      fragmentosEnviados: [frag(0, trozos[0].text), frag(2, trozos[2].text)],
      bloqueRelevancia: 'bloque',
    });
  }
  // ~~const A = [100, 6_000, 6_001, 20_000, 38_000, 66_669]; const C = [100, 3_000, 20_000, 34_000, 34_001, 36_000];~~
  // (hasta el 21/10/2026: los bordes de la cascada D-3 con 40.000).
  // ~~const A = [100, 6_000, 6_001, 20_000, 38_000, 66_669, 79_990]; const C = [100, 3_000, 20_000, 34_000, 66_801, 79_000];~~
  // (21/10 a 22/10/2026: los bordes del reparto con 80.000). Ahora, en función de P:
  const A = [100, 6_000, 6_001, 20_000, 38_000, 66_669, P - 10];
  const C = [100, 3_000, 20_000, 34_000, 66_801, P - 1_000];
  const S = ['ninguno', 'analizado', 'candidato'] as const;
  it.each(A.flatMap(nA => C.flatMap(nC => S.map(sn => [nA, nC, sn] as const))))(
    'analizado %i · candidato %i · sin trozos: %s', (nA, nC, sn) => {
      const antes = coherente(nA, nC, false, sn);
      const ahora = coherente(nA, nC, true, sn);
      // analizado: lo enviado EMPIEZA por lo de hoy
      expect(ahora.textoAnalizado.startsWith(antes.textoAnalizado)).toBe(true);
      // candidato: representa, al menos, los trozos del bloque por relevancia
      for (const i of antes.representados) expect(ahora.representados).toContain(i);
      // y `representados` dice la verdad sobre lo ENVIADO: el bloque de relevancia
      // representa sus trozos (0 y 2); cualquier otra cosa enviada es el entero (los 4)
      expect(ahora.representados).toEqual(ahora.bloqueCandidato === 'bloque' ? [0, 2] : [0, 1, 2, 3]);
    });
});
