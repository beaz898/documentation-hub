import { readdirSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { buildAnalyzedDocumentText } from './judge';
import { repartoDeLaPareja, TAMANO_VENTANA } from './reparto-de-la-pareja';

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

/** Los pares en que, al subir P de mil en mil, algún lado recibe menos. */
function quienesBajan(reparto: (P: number, p: Par) => { analizado: number; candidato: number }): string[] {
  const bajan: string[] = [];
  for (const p of pares) {
    let antes = reparto(10_000, p);
    for (let P = 11_000; P <= 200_000; P += 1_000) {
      const ahora = reparto(P, p);
      if (ahora.analizado < antes.analizado || ahora.candidato < antes.candidato) { bajan.push(`${p.a}←${p.c} en P=${P}`); break; }
      antes = ahora;
    }
  }
  return bajan;
}

describe('el reparto de la pareja', () => {
  it('la ventana del interino es de 80.000', () => expect(TAMANO_VENTANA).toBe(80_000));

  it('los dos enteros caben: no hay reparto', () => {
    expect(repartoDeLaPareja({ analizado: 14_704, candidato: 9_817, reservaMontada: 3_100 }))
      .toEqual({ ventana: 80_000, parejaEntera: true, candidatoEntero: true, paraElAnalizado: 14_704, paraElCandidato: 9_817 });
  });

  it('NOR-10 ↔ CLI-12: el analizado entero (66.801) y el resto, 13.199, para el candidato', () => {
    const r = repartoDeLaPareja({ analizado: 66_801, candidato: 55_135, reservaMontada: 3_100 });
    expect(r).toEqual({ ventana: 80_000, parejaEntera: false, candidatoEntero: false, paraElAnalizado: 66_801, paraElCandidato: 13_199 });
  });

  it('LA RESERVA GARANTIZA TEXTO: con un analizado enorme, el candidato conserva su reserva montada entera', () => {
    const r = repartoDeLaPareja({ analizado: 200_000, candidato: 55_135, reservaMontada: 3_165 });
    expect(r.paraElCandidato).toBe(3_165);
    expect(r.paraElAnalizado).toBe(80_000 - 3_165);
  });

  it(`LA PRUEBA DE FABLE: barriendo P de 10.000 a 200.000, ningún lado recibe menos en ninguno de los pares`, () => {
    expect(pares.length).toBe(90);
    expect(quienesBajan(nuevo)).toEqual([]);
  });

  it('⚠️ CONTROL POSITIVO: el reparto viejo SÍ se pone en rojo, y en los pares del barranco, NOR-10 ↔ CLI-12 entre ellos', () => {
    const bajan = quienesBajan((P, p) => repartoViejo(P, p.A, p.C));
    expect(bajan.length).toBeGreaterThan(0);
    expect(bajan.some(b => b.startsWith('NOR-10←CLI-12'))).toBe(true);
    expect(bajan.some(b => b.startsWith('CLI-12←NOR-10'))).toBe(true);
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
