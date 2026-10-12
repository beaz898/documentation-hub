import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { normalize } from './normalize';
import { indiceDePajar, localizarPorTramo, anclaMinima, TRAMO_MINIMO, type SalidaDelTramo } from './tramo-de-cita';

/**
 * F-125, fase 3.1 · la cita anclada por su tramo literal más largo. Dos clases
 * de prueba: el caso real (LUGAR, sobre el texto de NOR-11 tal como se entrega
 * al juez) y cadenas inventadas para clavar cada salida y cada invariante.
 */

/** El texto de NOR-11 que recibe el juez en `pareja_entera`: los trozos en
 *  orden, unidos por "\n\n" (lo fija `texto-del-trozo-en-el-prompt.test.ts`). */
async function textoEntregadoDe(nombre: string): Promise<string> {
  const segmentos = await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre);
  const trozos = toStoredChunks(chunkSegments(segmentos, 'prueba', nombre, 'prueba'));
  return [...trozos].sort((a, b) => a.chunkIndex - b.chunkIndex).map(c => c.text).join('\n\n');
}

// Las dos citas de LUGAR, literales del registro (Estado_Del_MVP.md, 12/10/2026):
// la de 206 caracteres y la de 111, las dos del lado de NOR-11.
const CABEZA = 'El punto de retirada centralizado concentra el material de las tres clínicas';
const COLA = ', ubicado en la clínica de Chamberí, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro';
const LUGAR_206 = CABEZA + COLA;
const LUGAR_111 = CABEZA + ', ubicado en la clínica de Chamberí';

/** La invariante 6 sobre cualquier tramo: el corte del original, normalizado,
 *  es exactamente la parte de la cita que dice cubrir. */
function tramoFiel(pajar: string, cita: string, t: { desde: number; hasta: number; texto: string; enLaCita: { desde: number; hasta: number } }) {
  expect(t.texto).toBe(pajar.slice(t.desde, t.hasta));
  expect(normalize(t.texto)).toBe(normalize(cita).slice(t.enLaCita.desde, t.enLaCita.hasta).trim());
}

describe('LUGAR sobre el texto real de NOR-11', () => {
  it('la de 206: recompuesta, ancla la cola con «Chamberí», resto la cabeza, en orden inverso', { timeout: 30_000 }, async () => {
    expect(LUGAR_206.length).toBe(206);
    const pajar = await textoEntregadoDe('NOR-11_gestion-de-residuos-sanitarios.docx');
    const s = localizarPorTramo(indiceDePajar(pajar), LUGAR_206);
    expect(s.tipo).toBe('recompuesta');
    if (s.tipo !== 'recompuesta') return;
    expect(s.ancla.texto).toContain('ubicado en la clínica de Chamberí');
    expect(s.ancla.texto.endsWith('Salamanca y Retiro')).toBe(true);
    expect(s.resto.texto).toBe('el punto de retirada centralizado concentra el material de las tres clínicas');
    tramoFiel(pajar, LUGAR_206, s.ancla);
    tramoFiel(pajar, LUGAR_206, s.resto);
    // La cabeza está DESPUÉS de la cola en el documento: el orden inverso.
    expect(s.resto.desde).toBeGreaterThan(s.ancla.hasta);
    expect(s.ordenInverso).toBe(true);
    expect(s.distancia).toBe(s.resto.desde - s.ancla.desde);
    expect(s.hueco).toBe(s.resto.desde - s.ancla.hasta);
  });

  it('la de 111: el resto («ubicado en la clínica de Chamberí») es literal pero no llega a 40', { timeout: 30_000 }, async () => {
    expect(LUGAR_111.length).toBe(111);
    const pajar = await textoEntregadoDe('NOR-11_gestion-de-residuos-sanitarios.docx');
    const s = localizarPorTramo(indiceDePajar(pajar), LUGAR_111);
    expect(s.tipo).toBe('resto_insuficiente');
    if (s.tipo !== 'resto_insuficiente') return;
    // El ancla es la cabeza, la frase del 6.1, que no menciona Chamberí.
    expect(s.ancla.texto).toBe('el punto de retirada centralizado concentra el material de las tres clínicas');
    expect(s.longitudDelResto).toBeLessThan(TRAMO_MINIMO);
  });
});

describe('cadenas inventadas', () => {
  const DOC = [
    'Los residuos se depositan en el contenedor amarillo de forma inmediata tras su uso.',
    'El gestor autorizado retira el material los martes y los viernes por la mañana temprano.',
    'Cada clínica guarda el registro de retiradas firmado por el responsable de turno del día.',
    'Los residuos no peligrosos van al contenedor gris.',
  ].join('\n\n');
  const salida = (cita: string): SalidaDelTramo => localizarPorTramo(indiceDePajar(DOC), cita);

  // (c) EL CONTRAEJEMPLO: una «no» metida por el juez en una frase verdadera.
  // ⚠️ Lo que lo rechaza: el ancla es la frase sin la «no», y el resto es TODO
  // lo que queda fuera del ancla —«los residuos no»—, «no» incluida. Con la
  // cobertura total, la «no» tiene que estar en el resto; y el resto no pasa.
  // Aquí «los residuos no» SÍ está literal (en la cuarta frase), así que lo que
  // lo tira es la vara de 40.
  it('(c) la «no» metida: el resto la contiene y no pasa (literal por casualidad, pero de 15)', () => {
    const s = salida('Los residuos no se depositan en el contenedor amarillo de forma inmediata tras su uso');
    expect(s.tipo).toBe('resto_insuficiente');
    if (s.tipo !== 'resto_insuficiente') return;
    expect(s.ancla.texto).not.toMatch(/\bno\b/);
    expect(s.longitudDelResto).toBe('los residuos no'.length);
  });

  // (c') LA MISMA, con el resto largo: la «no» va metida en un resto de más de
  // 40 que sin ella SÍ estaría literal. Es el caso que la cobertura cierra: un
  // resto que «casi» está no está.
  it('(c\') la «no» metida en un resto largo: el resto entero no es literal', () => {
    const s = salida('El gestor autorizado retira el material los martes y los viernes por la mañana temprano. Cada clínica no guarda el registro de retiradas firmado');
    expect(s.tipo).toBe('resto_no_literal');
    if (s.tipo !== 'resto_no_literal') return;
    expect(s.longitudDelResto).toBeGreaterThanOrEqual(TRAMO_MINIMO);
  });

  it('(d) el ancla en medio y dos restos: empalme_multiple', () => {
    const s = salida('Cada clínica guarda el registro. El gestor autorizado retira el material los martes y los viernes por la mañana temprano. Los residuos no peligrosos van al contenedor gris');
    expect(s.tipo).toBe('empalme_multiple');
  });

  it('(e) una reescritura de verdad, sin ningún tramo de 40: sin_tramo_literal', () => {
    const s = salida('El material lo recoge la empresa gestora dos veces por semana, siempre a primera hora');
    expect(s).toEqual({ tipo: 'sin_tramo_literal', longitudDelMasLargo: expect.any(Number) });
    if (s.tipo === 'sin_tramo_literal') expect(s.longitudDelMasLargo).toBeLessThan(anclaMinima(80));
  });

  it('un empalme verdadero de dos frases: recompuesta, con las dos posiciones sobre el original', () => {
    const cita = 'El gestor autorizado retira el material los martes y los viernes por la mañana temprano, los residuos se depositan en el contenedor amarillo de forma inmediata';
    const s = salida(cita);
    expect(s.tipo).toBe('recompuesta');
    if (s.tipo !== 'recompuesta') return;
    tramoFiel(DOC, cita, s.ancla);
    tramoFiel(DOC, cita, s.resto);
    expect(s.ancla.texto).toBe('El gestor autorizado retira el material los martes y los viernes por la mañana temprano');
    // El original, con su mayúscula: la cita la escribió en minúscula.
    expect(s.resto.texto).toBe('Los residuos se depositan en el contenedor amarillo de forma inmediata');
    expect(s.ordenInverso).toBe(true);
  });

  it('un resto de pura puntuación es la cita entera, no un caso de este módulo', () => {
    expect(salida('El gestor autorizado retira el material los martes y los viernes por la mañana temprano. —').tipo).toBe('cita_entera');
  });

  it('el ancla tiene que llegar al 50 % de la cita, no sólo a 40', () => {
    // Ancla literal de 46, resto de 60 inventado: 46 < 53.
    const s = salida('Los residuos no peligrosos van al contenedor gris y además todo lo demás se inventa aquí sin parar nunca jamás');
    expect(s.tipo).toBe('sin_tramo_literal');
  });

  it('determinismo: la misma entrada da la misma salida, también con un índice nuevo', () => {
    const cita = 'El gestor autorizado retira el material los martes y los viernes por la mañana temprano, los residuos se depositan en el contenedor amarillo de forma inmediata';
    const indice = indiceDePajar(DOC);
    expect(localizarPorTramo(indice, cita)).toEqual(localizarPorTramo(indice, cita));
    expect(localizarPorTramo(indiceDePajar(DOC), cita)).toEqual(localizarPorTramo(indice, cita));
  });
});

describe('el coste', () => {
  it('(f) un pajar de 70.000 caracteres con una tabla que repite la misma línea: índice una vez, cien citas', () => {
    const fila = '| Clínica Chamberí | Lunes | 08:00 | Residuos grupo III | Contenedor amarillo |\n';
    let pajar = '';
    while (pajar.length < 70_000) pajar += fila;
    pajar += '\n\nLa frase verdadera del final dice que el gestor autorizado retira el material los martes y los viernes.';
    const cita = 'el gestor autorizado retira el material los martes y los viernes, | Clínica Chamberí | Lunes | 08:00 | Residuos grupo III | Contenedor amarillo |';
    const inicio = performance.now();
    const indice = indiceDePajar(pajar);
    let ultima: SalidaDelTramo | null = null;
    for (let k = 0; k < 100; k++) ultima = localizarPorTramo(indice, cita);
    const ms = performance.now() - inicio;
    expect(ultima?.tipo).toBe('recompuesta');
    expect(ms).toBeLessThan(3_000);
  });
});
