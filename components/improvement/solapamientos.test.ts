/**
 * B.314 commit B (05/10/2026): cómo se pintan los solapamientos. Los dos casos
 * que pide el arquitecto —con lista y sin lista— en sintético y sobre los 65
 * análisis archivados, y la prueba de aceptación del director, «clico el tercer
 * punto y voy al tercer sitio», sobre el texto real de cada documento.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractText } from '@/lib/chunking';
import { construirOverlaps } from '@/lib/analysis/synthesize';
import { findTolerant } from '@/lib/texto/localizar-cita';
import type { FinalAnalysis } from '@/lib/analysis/types';
import { problemsFromAnalysis, type Problem } from './problems';
import { cabeceraDelDocumento, tarjetasDeLaEntrada } from './solapamientos';

const entrada = (x: Partial<Problem>): Problem => ({ id: 'ovl-0', type: 'duplicidad', title: 'Solapamiento con "B"', description: 'd', relatedDoc: 'B', ...x });
const punto = (n: number, citaNuevo = `cita del nuevo número ${n}, larga de sobra`) => ({ descripcion: `punto ${n}`, citaNuevo, citaExistente: `cita del otro ${n}` });

describe('con lista: una tarjeta por punto, cada una con su salto', () => {
  it('el tercer punto lleva a la tercera cita, y el salto es la misma entrada con otra cita', () => {
    const p = entrada({ textRef: punto(1).citaNuevo, puntos: [punto(1), punto(2), punto(3)], severidad: 'media' });
    const tarjetas = tarjetasDeLaEntrada(p)!;
    expect(tarjetas.map(t => t.descripcion)).toEqual(['punto 1', 'punto 2', 'punto 3']);
    expect(tarjetas[2].salto!.textRef).toBe(punto(3).citaNuevo);
    // Lo demás de la entrada no cambia: el salto no es otro hallazgo.
    const { textRef: _a, ...resto } = tarjetas[2].salto!;
    const { textRef: _b, ...original } = p;
    expect(resto).toEqual(original);
  });

  it('un punto sin cita de este lado no tiene salto', () => {
    const tarjetas = tarjetasDeLaEntrada(entrada({ puntos: [punto(1), punto(2, '  ')] }))!;
    expect(tarjetas[0].salto).not.toBeNull();
    expect(tarjetas[1].salto).toBeNull();
  });

  it('la cabecera cuenta las tarjetas de debajo: la estructural, que no tiene lista, cuenta una', () => {
    const c = cabeceraDelDocumento([entrada({ puntos: [punto(1), punto(2)], severidad: 'media' }), entrada({ id: 'ovl-1', estructural: true, severidad: 'alta' })]);
    expect(c).toEqual({ puntos: 3, severidad: 'alta', abiertoPorDefecto: true });
  });

  it('plegado por defecto salvo severidad alta', () => {
    expect(cabeceraDelDocumento([entrada({ puntos: [punto(1)], severidad: 'media' })]).abiertoPorDefecto).toBe(false);
    expect(cabeceraDelDocumento([entrada({ puntos: [punto(1)], severidad: 'baja' })]).abiertoPorDefecto).toBe(false);
    expect(cabeceraDelDocumento([entrada({ puntos: [punto(1)], severidad: 'alta' })]).abiertoPorDefecto).toBe(true);
  });
});

describe('sin lista: la entrada de siempre, y la cabecera sin número', () => {
  it('una entrada sin `puntos` se pinta en un bloque', () => {
    expect(tarjetasDeLaEntrada(entrada({ textRef: 'x', severidad: 'media' }))).toBeNull();
    expect(tarjetasDeLaEntrada(entrada({ puntos: [] }))).toBeNull();
  });

  it('antes no poner número que poner uno que miente: la severidad sí, el número no', () => {
    expect(cabeceraDelDocumento([entrada({ severidad: 'media' })])).toEqual({ puntos: null, severidad: 'media', abiertoPorDefecto: false });
    // Basta UNA entrada sin lista para que el número se calle.
    expect(cabeceraDelDocumento([entrada({ puntos: [punto(1)], severidad: 'baja' }), entrada({ id: 'ovl-1', severidad: 'baja' })]).puntos).toBeNull();
  });

  it('el duplicado no trae severidad ni lista: sin número y desplegado', () => {
    expect(cabeceraDelDocumento([entrada({ id: 'dup-main' })])).toEqual({ puntos: null, severidad: null, abiertoPorDefecto: true });
  });
});

interface Archivado { ruta: string; analizado: string; analisis: FinalAnalysis }
const archivados: Archivado[] = [];
const textos = new Map<string, string | null>();

beforeAll(async () => {
  for (const tanda of readdirSync('examen/resultados')) {
    const dir = join('examen/resultados', tanda);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir).filter(x => x.endsWith('.json'))) {
      const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (r.cuerpo?.analisis?.judgments) archivados.push({ ruta: `${tanda}/${f}`, analizado: r.cuerpo.analizado.nombre, analisis: r.cuerpo.analisis });
    }
  }
  for (const n of new Set(archivados.map(a => a.analizado))) {
    const ruta = join('corpus-pruebas', n);
    textos.set(n, existsSync(ruta) ? await extractText(readFileSync(ruta), n) : null);
  }
}, 120_000);

const solapes = (overlaps: FinalAnalysis['overlaps']) => problemsFromAnalysis({ overlaps }).filter(p => p.id.startsWith('ovl-'));

describe('sobre los 65 análisis archivados', { timeout: 120_000 }, () => {
  it('los guardados antes del commit A se pintan como siempre: ninguna entrada con lista', () => {
    expect(archivados.length).toBe(65);
    for (const a of archivados) for (const p of solapes(a.analisis.overlaps)) expect(tarjetasDeLaEntrada(p), a.ruta).toBeNull();
  });

  it('con la lista, lo que leen los prompts no cambia ni una letra; sólo se añade lo que se pinta', () => {
    let tarjetas = 0;
    for (const a of archivados) {
      const viejos = solapes(a.analisis.overlaps), nuevos = solapes(construirOverlaps(a.analisis.judgments));
      const leido = (ps: Problem[]) => ps.map(p => ({ id: p.id, title: p.title, description: p.description, textRef: p.textRef, relatedDoc: p.relatedDoc }));
      expect(leido(nuevos), a.ruta).toEqual(leido(viejos));
      for (const p of nuevos) tarjetas += tarjetasDeLaEntrada(p)?.length ?? 0;
    }
    expect(tarjetas).toBe(211);
  });

  /**
   * LA PRUEBA DE ACEPTACIÓN DEL DIRECTOR. Cada punto se busca en el texto del
   * documento analizado con la MISMA función que usa el salto del editor
   * (`findTolerant`, vía `goToProblem`). Se exige: el primer punto lleva adonde
   * llevaba la entrada, y dos puntos de una misma entrada no llevan nunca al
   * mismo sitio. Los que no se encuentran se cuentan: son el aviso de
   * «fragmento no encontrado», el mismo de hoy, y no los causa este cambio.
   * Medido el 05/10 contra el texto extraído: 118 de 211 se encuentran, y de los
   * 93 que no, 91 son filas de tabla pintadas («a | b | c»), la ceguera conocida.
   * Ya hoy el salto de 25 de las 59 entradas no encuentra su sitio (24 filas).
   */
  it('cada punto salta a su propio sitio, y el primero al de siempre', () => {
    let buscados = 0, encontrados = 0, filasNoEncontradas = 0, sinTexto = 0;
    for (const a of archivados) {
      const texto = textos.get(a.analizado);
      for (const p of solapes(construirOverlaps(a.analisis.judgments))) {
        const tarjetas = tarjetasDeLaEntrada(p);
        if (!tarjetas) continue;
        if (!texto) { sinTexto += tarjetas.length; continue; }
        const sitios = tarjetas.map(t => (buscados++, findTolerant(texto, t.salto!.textRef!)));
        expect(sitios[0], a.ruta).toEqual(p.textRef ? findTolerant(texto, p.textRef) : null);
        const hallados = sitios.filter(s => s !== null);
        encontrados += hallados.length;
        filasNoEncontradas += sitios.filter((s, i) => s === null && tarjetas[i].citaNuevo.split(' | ').length >= 3).length;
        expect(new Set(hallados.map(s => `${s!.start}-${s!.end}`)).size, `${a.ruta} ${p.id}`).toBe(hallados.length);
      }
    }
    expect({ buscados, encontrados, filasNoEncontradas, sinTexto }).toEqual({ buscados: 211, encontrados: 118, filasNoEncontradas: 91, sinTexto: 0 });
  });
});
