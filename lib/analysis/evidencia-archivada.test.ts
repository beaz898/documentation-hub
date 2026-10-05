import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractText } from '@/lib/chunking';
import { construirOverlaps } from './synthesize';
import { findBestMatch } from './coincidencia-de-cita';
import { traducirSolapamientosDelJuez } from './llm-boundary';
import type { DocumentJudgment, FinalAnalysis } from './types';

/**
 * LA EVIDENCIA ARCHIVADA SE SIGUE LEYENDO COMO SIEMPRE (B.312 (g), 02/10/2026).
 *
 * ⚠️ ES LA GUARDA DE TODOS LOS CAMBIOS DE PROMPT QUE VENGAN. Cada vez que se
 * cambie lo que se le pide al juez, esta prueba dice si se ha roto la lectura
 * de lo ya guardado, que es donde vive un mes de mediciones. Lee análisis
 * ARCHIVADOS de verdad: los del examen del 27/09 (`examen/resultados/`),
 * anteriores a B.312.
 *
 * Tres cosas, y la tercera no se puede probar con los valores:
 *   1. el lector de producción (`construirOverlaps`) rehace, desde los juicios
 *      guardados, los solapamientos que se publicaron entonces;
 *   2. `evidence` es el lado EXISTENTE y `evidenceInNewDoc` el NUEVO: ninguna
 *      cita guardada está sólo en el documento del otro lado;
 *   3. la traducción del prompt (`traducirSolapamientosDelJuez`) no toca nunca
 *      lo que viene de la base. Pasarle un solapamiento guardado da los MISMOS
 *      valores —el nombre viejo es su fallback—, así que los valores no lo
 *      distinguen. Lo que lo prueba es un CENSO de dónde se llama.
 *
 * Lee disco: es de la clase que nombra `vitest.config.mts`. Lleva su propio
 * tope, como guarda contra cuelgues y no como requisito de rendimiento.
 */

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
  const nombres = new Set(archivados.flatMap(a => [a.analizado, ...a.analisis.judgments.map(j => j.documentName)]));
  for (const n of nombres) {
    const ruta = join('corpus-pruebas', n);
    textos.set(n, existsSync(ruta) ? await extractText(readFileSync(ruta), n) : null);
  }
}, 120_000);

const TOPE_CONTRA_CUELGUES_MS = 120_000;

/** Una fila de tabla pintada («a | b | c»): no está así en el texto extraído,
 *  y la comprobación por texto es CIEGA para ella. Se salta, y se cuenta. */
const esFilaDeTabla = (cita: string) => cita.split(' | ').length >= 3;

describe('la evidencia archivada se sigue leyendo como siempre', { timeout: TOPE_CONTRA_CUELGUES_MS }, () => {
  it('CONTROL POSITIVO — hay análisis archivados con solapamientos del juez que leer', () => {
    expect(archivados.length).toBeGreaterThan(0);
    const delJuez = archivados.flatMap(a => a.analisis.judgments.flatMap(j => j.overlappingContent.filter(o => !o.confirmedBy)));
    expect(delJuez.length).toBeGreaterThan(0);
  });

  /**
   * ⚠️ PREMISA CAMBIADA A PROPÓSITO EL 05/10/2026 (B.314, opción 2), con la
   * conformidad del arquitecto. Hasta ese día esta prueba exigía que lo rehecho
   * fuera IGUAL a lo archivado. Desde ese día cada entrada del juez lleva además
   * la lista de sus puntos (`puntos`), que lo archivado no tiene. La premisa
   * nueva, y lo que sigue garantizando:
   *   · el MISMO número de entradas, en el mismo orden (el recuento no se mueve);
   *   · cada entrada, idéntica campo por campo en TODOS los campos que tenía la
   *     archivada (nada de lo que ya se publicaba cambia);
   *   · la lista sale de lo guardado y no inventa nada: son exactamente los puntos
   *     del juez de esa pareja, en su orden, con sus dos citas sin tocar;
   *   · la lista y la descripción publicada hablan de LOS MISMOS puntos, ni uno
   *     más ni uno menos (si no, la pantalla enseñaría una tarjeta que el resumen
   *     no cuenta, o un punto del resumen sin tarjeta);
   *   · el primer punto sigue siendo el primero: el salto de la entrada (`textRef`)
   *     lleva exactamente adonde llevaba;
   *   · las entradas estructurales no llevan lista.
   * Lo que NO garantiza: que la pantalla caiga bien con los análisis viejos.
   */
  it('el lector de producción rehace lo publicado igual en todo lo que ya existía, y cada entrada del juez lleva sus puntos', () => {
    let entradasDelJuez = 0, puntosContados = 0;
    for (const a of archivados) {
      const rehecho = construirOverlaps(a.analisis.judgments);
      const archivado = a.analisis.overlaps;
      expect(rehecho.length, a.ruta).toBe(archivado.length);
      rehecho.forEach((entrada, i) => {
        const { puntos, ...loDeSiempre } = entrada;
        expect(loDeSiempre, `${a.ruta} #${i}`).toEqual(archivado[i]);
        if (entrada.confirmedBy) {
          expect(puntos, `${a.ruta} #${i} estructural`).toBeUndefined();
          return;
        }
        const juicio = a.analisis.judgments.find(j => j.documentId === entrada.existingDocumentId && j.documentName === entrada.existingDocument);
        const delJuez = (juicio?.overlappingContent ?? []).filter(o => !o.confirmedBy && o.description.trim().length > 0);
        // Los mismos puntos, en su orden, con sus citas sin tocar.
        expect(puntos, `${a.ruta} #${i}`).toEqual(delJuez.map(o => ({ descripcion: o.description, citaNuevo: o.evidenceInNewDoc ?? '', citaExistente: o.evidence ?? '' })));
        // La lista y la descripción publicada hablan de los mismos puntos.
        expect(puntos!.map(p => p.descripcion).join('. '), `${a.ruta} #${i}`).toBe(entrada.description);
        // El primer punto sigue siendo el primero: el salto lleva adonde llevaba.
        expect(entrada.textRef, `${a.ruta} #${i}`).toBe(puntos!.find(p => p.citaNuevo.trim().length > 0)?.citaNuevo || undefined);
        entradasDelJuez++;
        puntosContados += puntos!.length;
      });
    }
    // Contados sobre los 65 análisis (medido el 05/10: 59 entradas del juez y 211
    // puntos; con las 5 estructurales, las 64 publicadas). Si la cuenta cambia,
    // cambió el archivo, no el código.
    expect({ entradasDelJuez, puntosContados }).toEqual({ entradasDelJuez: 59, puntosContados: 211 });
  });

  it('`evidence` es el EXISTENTE y `evidenceInNewDoc` el NUEVO: ninguna cita guardada está sólo en el otro lado', () => {
    const cuenta = { evidence: { propio: 0, cruzada: 0 }, evidenceInNewDoc: { propio: 0, cruzada: 0 } };
    const cruzadas: string[] = [];
    for (const a of archivados) {
      const nuevo = textos.get(a.analizado);
      for (const j of a.analisis.judgments) {
        const existente = textos.get(j.documentName);
        if (!nuevo || !existente) continue;
        for (const o of j.overlappingContent) {
          if (o.confirmedBy) continue;
          const lados: Array<[keyof typeof cuenta, string | undefined, string, string]> = [
            ['evidence', o.evidence, existente, nuevo],
            ['evidenceInNewDoc', o.evidenceInNewDoc, nuevo, existente],
          ];
          for (const [campo, cita, propio, otro] of lados) {
            if (!cita || esFilaDeTabla(cita)) continue;
            const enPropio = findBestMatch(propio, cita) !== null;
            if (enPropio) cuenta[campo].propio++;
            else if (findBestMatch(otro, cita) !== null) { cuenta[campo].cruzada++; cruzadas.push(`${a.ruta} ${campo}: ${cita.slice(0, 80)}`); }
          }
        }
      }
    }
    expect(cruzadas).toEqual([]);
    // El control positivo de este cero: el mismo camino SÍ encuentra las citas en su lado.
    expect(cuenta.evidence.propio).toBeGreaterThan(0);
    expect(cuenta.evidenceInNewDoc.propio).toBeGreaterThan(0);
  });

  it('la traducción del prompt se llama en UN sitio, y sobre la respuesta del modelo', () => {
    const quienes: string[] = [];
    const recorrer = (dir: string) => {
      for (const e of readdirSync(dir)) {
        if (e === 'node_modules' || e.startsWith('.')) continue;
        const ruta = join(dir, e);
        if (statSync(ruta).isDirectory()) recorrer(ruta);
        else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e) && readFileSync(ruta, 'utf8').includes('traducirSolapamientosDelJuez')) quienes.push(ruta.replace(/\\/g, '/'));
      }
    };
    for (const r of ['app', 'lib', 'components', 'worker']) recorrer(r);
    expect(quienes.sort()).toEqual(['lib/analysis/judge.ts', 'lib/analysis/llm-boundary.ts']);

    const juez = readFileSync('lib/analysis/judge.ts', 'utf8');
    const llamadas = [...juez.matchAll(/traducirSolapamientosDelJuez\(([^)]*)\)/g)].map(m => m[1]);
    expect(llamadas).toEqual(['response.overlappingContent']);
    // Y `response` es la respuesta del modelo, declarada una sola vez.
    expect(juez.match(/const response = await callLLMJson</g)).toHaveLength(1);
  });

  it('CONTROL — si la traducción tocara algo guardado, se notaría: los valores no cambian, pero la cuenta del nombre viejo sí', () => {
    const guardado: DocumentJudgment['overlappingContent'] = archivados
      .flatMap(a => a.analisis.judgments.flatMap(j => j.overlappingContent.filter(o => !o.confirmedBy && o.evidence)))
      .map(({ description, evidence, evidenceInNewDoc }) => ({ description, evidence, evidenceInNewDoc: evidenceInNewDoc ?? '' }));
    const r = traducirSolapamientosDelJuez(guardado);
    expect(r.overlappingContent).toEqual(guardado);
    expect(r.discarded['frontera.solapamiento_con_nombre_viejo']).toBe(guardado.length);
  });
});
