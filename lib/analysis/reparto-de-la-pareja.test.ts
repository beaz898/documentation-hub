import { readdirSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { buildAnalyzedDocumentText } from './judge';
import { repartoDeLaPareja, TAMANO_VENTANA, VENTANA_MINIMA_MEDIDA } from './reparto-de-la-pareja';

/**
 * EL REPARTO DE LA PAREJA (3.1.3, 21/10/2026) y LA PRUEBA DE FABLE QUE LO CIERRA (F-127, adenda Q4): se barre
 * la ventana P de 10.000 a 200.000 de mil en mil y, en cada par del corpus, NINGÚN LADO RECIBE MENOS AL SUBIR
 * EL PRESUPUESTO. Con el control positivo: el reparto VIEJO —la cascada D-3 del 29/09 con su bloque de 3.000—
 * se pone en rojo en los pares del barranco. Si el viejo no cayera, la prueba no vigilaría nada.
 *
 * Los pares: los diez documentos de la simulación de F-127, en las dos direcciones (90 pares ordenados),
 * con sus tamaños montados por la función de producción (`buildAnalyzedDocumentText`). La reserva montada se
 * aproxima por la de la tijera vieja: 3.000 de texto más tres cabeceras de unos 55, sin pasar del candidato.
 */
const NOMBRES = /^(NOR-10|CLI-12|NOR-11|CLI-13|OPE-10|OPE-11|OPE-13|RRHH-08|OPE-15|CLI-20)_/;
const RESERVA_APROXIMADA = 3_000 + 3 * 55;
type Par = { a: string; c: string; A: number; C: number };
let pares: Par[] = [];

beforeAll(async () => {
  const docs: { nombre: string; tam: number }[] = [];
  for (const f of readdirSync('corpus-pruebas').filter(f => NOMBRES.test(f))) {
    const chunks = toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o'));
    docs.push({ nombre: f.slice(0, f.indexOf('_')), tam: buildAnalyzedDocumentText(chunks, f).length });
  }
  pares = docs.flatMap(x => docs.filter(y => y !== x).map(y => ({ a: x.nombre, c: y.nombre, A: x.tam, C: y.tam })));
}, 120_000);

/** La cascada D-3 del 29/09, réplica de la que sustituye el reparto: el control positivo. */
function repartoViejo(P: number, A: number, C: number) {
  const SUELO = 6_000, BLOQUE = 3_000;
  if (A + C <= P) return { analizado: A, candidato: C };
  const entero = C <= P - SUELO;
  const candidato = entero ? C : BLOQUE;
  return { analizado: Math.min(A, Math.max(SUELO, P - candidato)), candidato };
}
const nuevo = (P: number, p: Par) => {
  const r = repartoDeLaPareja({ analizado: p.A, candidato: p.C, reservaMontada: Math.min(RESERVA_APROXIMADA, p.C), ventana: P });
  return { analizado: r.paraElAnalizado, candidato: r.paraElCandidato };
};

const DESDE = VENTANA_MINIMA_MEDIDA, HASTA = 200_000;
/** Los pares en que, al subir P de `paso` en `paso` entre DESDE y HASTA, algún lado recibe menos. */
function quienesBajan(reparto: (P: number, p: Par) => { analizado: number; candidato: number }, paso = 1_000): string[] {
  const bajan: string[] = [];
  for (const p of pares) {
    let antes = reparto(DESDE, p);
    for (let P = DESDE + paso; P <= HASTA; P += paso) {
      const ahora = reparto(P, p);
      if (ahora.analizado < antes.analizado || ahora.candidato < antes.candidato) { bajan.push(`${p.a}←${p.c} en P=${P}`); break; }
      antes = ahora;
    }
  }
  return bajan;
}
/** LA CONDICIÓN DEL BARRANCO de la cascada vieja (F-127): el analizado pasa de los 6.000 del suelo, y el
 *  escalón —P = C + 6.000, donde el candidato entero empieza a caber y el analizado cae al suelo— está dentro
 *  del rango barrido (estrictamente después del primer punto, que no se compara con nada). */
const enElBarranco = (p: Par) => p.A > 6_000 && p.C + 6_000 > DESDE && p.C + 6_000 <= HASTA;
const nombre = (p: Par) => `${p.a}←${p.c}`;

describe('el reparto de la pareja', () => {
  // ~~la ventana del interino es de 80.000: expect(TAMANO_VENTANA).toBe(80_000)~~ (21/10 a 22/10/2026). El valor lo
  // fija UNA prueba, en pareja-entera.test.ts; aquí se comprueba lo que importa del barrido:
  it('22/10/2026: la ventana de producción está DENTRO del barrido y es UNO DE SUS PUNTOS, a pasos de 1.000 y de 1', () => {
    expect(TAMANO_VENTANA).toBeGreaterThanOrEqual(DESDE);
    expect(TAMANO_VENTANA).toBeLessThanOrEqual(HASTA);
    expect((TAMANO_VENTANA - DESDE) % 1_000).toBe(0);
    const puntos = (paso: number) => { const ps: number[] = []; for (let P = DESDE; P <= HASTA; P += paso) ps.push(P); return ps; };
    expect(puntos(1_000)).toContain(TAMANO_VENTANA);
    expect(puntos(1)).toContain(TAMANO_VENTANA);
  });

  it('los dos enteros caben: no hay reparto', () => {
    // ~~ventana: 80_000~~ (21/10 a 22/10/2026)
    expect(repartoDeLaPareja({ analizado: 14_704, candidato: 9_817, reservaMontada: 3_100 }))
      .toEqual({ ventana: TAMANO_VENTANA, parejaEntera: true, candidatoEntero: true, paraElAnalizado: 14_704, paraElCandidato: 9_817 });
  });

  // ~~con la ventana de producción~~ (21/10 a 22/10/2026): es el caso medido, con 80.000 explícitos
  it('NOR-10 ↔ CLI-12 con 80.000, el caso medido: el analizado entero (66.801) y el resto, 13.199, para el candidato', () => {
    const r = repartoDeLaPareja({ analizado: 66_801, candidato: 55_135, reservaMontada: 3_100, ventana: 80_000 });
    expect(r).toEqual({ ventana: 80_000, parejaEntera: false, candidatoEntero: false, paraElAnalizado: 66_801, paraElCandidato: 13_199 });
  });

  it('LA RESERVA GARANTIZA TEXTO: con un analizado enorme, el candidato conserva su reserva montada entera', () => {
    // ~~analizado 200.000 y 80.000 − 3.165~~ (21/10 a 22/10/2026)
    const r = repartoDeLaPareja({ analizado: TAMANO_VENTANA + 120_000, candidato: 55_135, reservaMontada: 3_165 });
    expect(r.paraElCandidato).toBe(3_165);
    expect(r.paraElAnalizado).toBe(TAMANO_VENTANA - 3_165);
  });

  it(`LA PRUEBA DE FABLE: barriendo P de 10.000 a 200.000, ningún lado recibe menos en ninguno de los pares`, () => {
    expect(pares.length).toBe(90);
    expect(quienesBajan(nuevo)).toEqual([]);
    // 22/10/2026: y de uno en uno, donde ningún escalón puede caer entre dos puntos de la rejilla
    expect(quienesBajan(nuevo, 1)).toEqual([]);
  });

  // ~~CONTROL POSITIVO: el reparto viejo se pone en rojo en algún par, y NOR-10 ↔ CLI-12 entre ellos~~ (21/10/2026):
  // ~~expect(bajan.length).toBeGreaterThan(0); expect(bajan.some(b => b.startsWith('NOR-10←CLI-12'))).toBe(true); …~~
  // Pasaba aunque el viejo sólo cayera en un par. 22/10/2026 (arquitecto): se afirma lo UNIVERSAL y se imprime el
  // número, que no se fija a mano: así un documento nuevo en el corpus no la pone roja sin que haya fallo, y si
  // el número cambia, se ve. Se barre de UNO en uno: con pasos de 1.000, un analizado apenas por encima de 6.000
  // puede esconder la caída entre dos puntos (hoy no hay ninguno en el corpus: 30 de 30 también a 1.000).
  it('⚠️ CONTROL POSITIVO: TODO par en la condición del barranco se pone en rojo con el reparto viejo, y se dice cuántos son', () => {
    const viejo = (P: number, p: Par) => repartoViejo(P, p.A, p.C);
    const enRojo = new Set(quienesBajan(viejo, 1).map(b => b.slice(0, b.indexOf(' '))));
    const delBarranco = pares.filter(enElBarranco);
    // por stderr: vitest 4 no enseña el console.log de una prueba que pasa, y el número tiene que verse
    process.stderr.write(`[control positivo] pares en la condición del barranco: ${delBarranco.length} de ${pares.length}; en rojo con el reparto viejo: ${delBarranco.filter(p => enRojo.has(nombre(p))).length}\n`);
    expect(delBarranco.length).toBeGreaterThan(0);
    expect(delBarranco.filter(p => !enRojo.has(nombre(p))).map(nombre)).toEqual([]);
  });

  it('CONTROL NEGATIVO: con el analizado en 6.000 o menos, el reparto viejo no se pone en rojo en ningún par', () => {
    const enRojo = new Set(quienesBajan((P, p) => repartoViejo(P, p.A, p.C), 1).map(b => b.slice(0, b.indexOf(' '))));
    const pequenos = pares.filter(p => p.A <= 6_000);
    expect(pequenos.length).toBeGreaterThan(0);
    expect(pequenos.filter(p => enRojo.has(nombre(p))).map(nombre)).toEqual([]);
  });

  it('LA REGIÓN SIN MEDIR ES INALCANZABLE: por debajo de 10.000 el reparto se niega, en 10.000 justos reparte', () => {
    expect(VENTANA_MINIMA_MEDIDA).toBe(10_000);
    expect(() => repartoDeLaPareja({ analizado: 5_000, candidato: 5_000, reservaMontada: 3_000, ventana: 9_999 })).toThrow(/9999 por debajo de 10000/);
    expect(() => repartoDeLaPareja({ analizado: 5_000, candidato: 5_000, reservaMontada: 3_000, ventana: Number.NaN })).toThrow();
    expect(repartoDeLaPareja({ analizado: 5_000, candidato: 5_000, reservaMontada: 3_000, ventana: 10_000 }).parejaEntera).toBe(true);
  });

  it('EL INVARIANTE: en cada par y cada P, ningún lado recibe menos que con la tijera vieja (6.000 y la reserva)', () => {
    const peores: string[] = [];
    for (const p of pares) for (let P = 10_000; P <= 200_000; P += 1_000) {
      const r = nuevo(P, p);
      if (r.analizado < Math.min(p.A, 6_000, P - Math.min(RESERVA_APROXIMADA, p.C)) || r.candidato < Math.min(p.C, RESERVA_APROXIMADA, P)) peores.push(`${p.a}←${p.c} P=${P}`);
    }
    expect(peores).toEqual([]);
  });
});
