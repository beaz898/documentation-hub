import { describe, expect, it } from 'vitest';

import { problemsFromAnalysis, type RawAnalysis } from '@/components/improvement/problems';
import { conVeredicto } from './double-check';
import { aInconsistenciaMenor, mergeContradictions, particionDoubleCheck } from './pipeline';
import { construirDiscrepancias, construirOverlaps } from './synthesize';
import type { DocumentJudgment } from './types';

/**
 * EL RECORRIDO DEL ID DEL DOCUMENTO (F-86 paso 0).
 *
 * ESTA BATERÍA NO PRUEBA UN MECANISMO: PRUEBA UN CAMINO. La distinción es el
 * motivo entero de que exista. Esta tubería ya borró tres campos EN TRÁNSITO
 * —F-69, F-70 y F-71, el historial está escrito en pipeline.ts:1045-1060— y
 * las tres veces el mecanismo de cada extremo era correcto: lo que fallaba era
 * un eslabón intermedio con una LISTA CERRADA que no nombraba el campo nuevo.
 * Un caso por función habría pasado en verde las tres veces.
 *
 * Por eso los casos de aquí abajo no llaman a UNA función: encadenan TODAS las
 * del camino, en el mismo orden en que corren en producción, y solo miran el
 * final. Si un eslabón intermedio deja de copiar el campo, el caso falla aunque
 * los dos extremos sigan siendo correctos.
 *
 * DÓNDE VIVE. Al lado de sus módulos, como manda el alcance
 * (vitest.config.mts), aunque el camino cruce cuatro de lib/analysis y termine
 * en components/improvement/problems.ts. El camino es de lib/analysis; el
 * último eslabón se importa.
 *
 * LO QUE ESTA BATERÍA NO ALCANZA, dicho aquí y no solo en el informe: los TRES
 * eslabones de serialización —app/api/analyze-v2/route.ts:545, el `analysis`
 * entero que persiste :453, y worker/src/index.ts:137— son rutas de API y
 * worker, y el alcance los prohíbe. Son listas CERRADAS, pero de campos de
 * FinalAnalysis, y el campo nuevo va ANIDADO dentro de arrays que esas listas
 * ya nombran y pasan enteros. El paso por JSON que hacen los casos de abajo
 * cubre lo único que esa frontera le hace al dato: serializarlo.
 *
 * EL TERCERO YA NO ES UNA SUPOSICIÓN: se midió en producción el 28/08/2026
 * sobre `d13e125f`, leyendo el jsonb de `analysis_results`, y con control
 * negativo (dos análisis anteriores al deploy, sobre el mismo corpus y la misma
 * contradicción sembrada, que salen sin el campo). Las cifras y sus límites
 * —los otros dos eslabones siguen sin medir, y el camino exhaustivo tampoco—
 * están en `claude/Tandas_Harness.md`, entrada del 28/08. No se repiten aquí.
 */

const IDENTIDAD = { id: 'doc-7f3a-2291', nombre: 'Política de vacaciones v2.pdf' };

function juicio(): DocumentJudgment {
  return {
    documentId: IDENTIDAD.id,
    documentName: IDENTIDAD.nombre,
    source: 'manual',
    overlapPercent: 45,
    verdict: 'solapamiento_parcial',
    contradictions: [
      {
        topic: 'Días de vacaciones',
        newDocSays: 'El personal dispone de 23 días laborables.',
        existingDocSays: 'El personal dispone de 22 días laborables.',
        severity: 'contradiction',
        confirmedBy: 'juicio',
      },
      {
        topic: 'Antigüedad mínima',
        newDocSays: 'Se exigen 6 meses de antigüedad.',
        existingDocSays: 'Se exigen 12 meses de antigüedad.',
        severity: 'contradiction',
        confirmedBy: 'estructura',
      },
    ],
    overlappingContent: [
      { description: 'Ambos regulan el cómputo de días', evidence: 'cómputo', evidenceInNewDoc: 'cómputo de días' },
      { description: 'Nueve filas idénticas en la tabla de tramos', evidence: '', evidenceInNewDoc: '', confirmedBy: 'estructura', structuralPercent: 90 },
    ],
    uniqueToNewDoc: [],
  };
}

/**
 * LA FRONTERA DEL JSONB Y LA DE LA RESPUESTA HTTP, que le hacen al dato la
 * misma cosa: deja de ser un objeto de Node y vuelve como un objeto plano. Un
 * campo que no sobreviva a esto no llega al cliente aunque las nueve funciones
 * del camino lo copien.
 */
function comoLoRecibeElCliente(analisis: unknown): RawAnalysis {
  return JSON.parse(JSON.stringify(analisis)) as RawAnalysis;
}

/**
 * EL CAMINO EXHAUSTIVO ENTERO, en el orden real de pipeline.ts:859-937.
 * Cada línea es un eslabón; ninguno se salta.
 */
function recorridoExhaustivo(judgments: DocumentJudgment[]) {
  // [1] synthesize: el juicio se convierte en discrepancia (lista CERRADA).
  const deSynthesize = construirDiscrepancias(judgments);

  // [2] pipeline: la fusión con la rama atómica (hoy con [] como listB, F-74).
  const fusionadas = mergeContradictions(deSynthesize, [], {});

  // [3] pipeline: la frontera del double-check parte la lista en dos.
  const { estructurales, aJuicio } = particionDoubleCheck(fusionadas);

  // [4a] double-check: Sonnet reconstruye el objeto entero (lista CERRADA).
  const verificadas = aJuicio.map(d => conVeredicto(d, { confidence: 'alta', confirmedBy: 'double_check' }));

  // [4b] pipeline: las estructurales esquivan a Sonnet con un spread. Se
  //      REPRODUCE la expresión de pipeline.ts:928-931 porque ahí es un .map
  //      en línea, no una función a la que se pueda llamar. Un spread no puede
  //      perder un campo; una lista cerrada sí, y por eso el eslabón [4a] de al
  //      lado sí se llama de verdad.
  const pasoDeLargo = estructurales.map(d => ({ ...d, confidence: 'alta' as const }));

  const doubleChecked = [...verificadas, ...pasoDeLargo];

  return {
    discrepancies: doubleChecked.filter(d => d.confidence === 'alta'),
    overlaps: construirOverlaps(judgments),
  };
}

describe('PRODUCTOR 1 (el juez) — el id llega hasta el final del recorrido', () => {
  it('camino completo del EXHAUSTIVO, rama de JUICIO: de DocumentJudgment a Problem.relatedDocId', () => {
    const analisis = recorridoExhaustivo([juicio()]);
    const problemas = problemsFromAnalysis(comoLoRecibeElCliente(analisis));

    const contradiccion = problemas.find(p => p.title === 'Días de vacaciones');
    expect(contradiccion).toBeDefined();
    expect(contradiccion!.relatedDocId).toBe(IDENTIDAD.id);
  });

  it('camino completo del EXHAUSTIVO, rama de ESTRUCTURA: la que esquiva a Sonnet también lo lleva', () => {
    const analisis = recorridoExhaustivo([juicio()]);
    const problemas = problemsFromAnalysis(comoLoRecibeElCliente(analisis));

    const contradiccion = problemas.find(p => p.title === 'Antigüedad mínima');
    expect(contradiccion).toBeDefined();
    expect(contradiccion!.relatedDocId).toBe(IDENTIDAD.id);
  });

  it('camino del modo RÁPIDO: sin double-check, el id llega igual', () => {
    // El rápido va de synthesize a la respuesta HTTP sin pasar por nada más.
    const analisis = { discrepancies: construirDiscrepancias([juicio()]) };
    const problemas = problemsFromAnalysis(comoLoRecibeElCliente(analisis));

    expect(problemas).toHaveLength(2);
    for (const p of problemas) expect(p.relatedDocId).toBe(IDENTIDAD.id);
  });

  it('camino de las INCONSISTENCIAS MENORES: por la puerta que más campos ha matado', () => {
    // pipeline.ts:935-937 — el destructuring de lista cerrada por el que
    // murieron los campos de F-69, F-70 y F-71.
    const deSynthesize = construirDiscrepancias([juicio()]);
    const degradadas = deSynthesize.map(d =>
      conVeredicto(d, { confidence: 'posible', severity: 'minor_inconsistency' }),
    );
    const menores = degradadas.map(aInconsistenciaMenor);

    const problemas = problemsFromAnalysis(comoLoRecibeElCliente({ minorInconsistencies: menores }));

    expect(problemas).toHaveLength(2);
    for (const p of problemas) {
      expect(p.type).toBe('inconsistencia_menor');
      expect(p.relatedDocId).toBe(IDENTIDAD.id);
      // HUECO ENCONTRADO POR MUTACIÓN: sin esta línea, pisar el nombre con el
      // id en esta rama de problems.ts no rompía ningún caso — el caso de
      // «hermano, no sustituto» de más abajo solo recorre discrepancias y
      // solapamientos, y las menores llegan por otra puerta.
      expect(p.relatedDoc).toBe(IDENTIDAD.nombre);
    }
  });

  it('camino de los SOLAPAMIENTOS: los dos montones, el del juez y el estructural', () => {
    const analisis = { overlaps: construirOverlaps([juicio()]) };
    const problemas = problemsFromAnalysis(comoLoRecibeElCliente(analisis));

    expect(problemas).toHaveLength(2);
    for (const p of problemas) {
      expect(p.type).toBe('duplicidad');
      expect(p.relatedDocId).toBe(IDENTIDAD.id);
    }
  });

  /**
   * EL ESLABÓN QUE EL CAMINO ATRAVIESA PERO NO EJERCE — hueco encontrado por
   * mutación, y la única forma honesta de taparlo.
   *
   * `mergeContradictions` tiene DOS ramas: `[...listA]` (spread del array, los
   * objetos van por referencia) y `result.push(d)` para lo que llega por
   * `listB`. El camino real solo recorre la primera, porque F-74 dejó `listB`
   * en `[]` — así que se podía convertir ese `push` en una lista CERRADA de
   * cuatro campos sin que fallara nada del recorrido de arriba.
   *
   * Este caso llama a la función con una listB NO VACÍA. No prueba el camino
   * de hoy —hoy esa rama está muerta— sino el día que la rama atómica se
   * reconecte, que es exactamente por lo que este commit propaga el id en
   * verify-claims. Se marca como lo que es: un caso que se adelanta.
   */
  it('mergeContradictions conserva el objeto entero de la SEGUNDA lista (rama hoy muerta, F-74)', () => {
    const [primera, segunda] = construirDiscrepancias([juicio()]);
    const fusionadas = mergeContradictions([primera], [segunda], {});

    expect(fusionadas).toHaveLength(2);
    for (const d of fusionadas) expect(d.existingDocumentId).toBe(IDENTIDAD.id);
  });

  /**
   * LA MITAD QUE NO SE PUEDE OLVIDAR. El encargo de F-86 es explícito: el
   * nombre SE QUEDA, es lo que ve el usuario. Un cambio que propagara el id
   * PISANDO el nombre pasaría todos los casos de arriba y rompería la interfaz.
   */
  it('el NOMBRE sigue llegando: el id es un hermano, no un sustituto', () => {
    const analisis = recorridoExhaustivo([juicio()]);
    const problemas = problemsFromAnalysis(comoLoRecibeElCliente(analisis));

    for (const p of problemas) {
      expect(p.relatedDoc).toBe(IDENTIDAD.nombre);
      // En el TÍTULO o en la DESCRIPCIÓN, según el tipo: las contradicciones
      // lo llevan en la frase («En "X": …»), los solapamientos en el título
      // («Solapamiento con "X"»). Lo que se fija aquí es que el usuario lo
      // sigue LEYENDO, no por qué campo llega.
      expect(`${p.title} ${p.description}`).toContain(IDENTIDAD.nombre);
    }
  });

  /**
   * LOS ANÁLISIS VIEJOS DEL JSONB. La bandeja relee resultados guardados meses
   * antes de este commit, que no traen el campo. Es opcional PARA SIEMPRE por
   * eso, y esto lo fija.
   */
  it('un análisis anterior a este commit, sin el campo, no rompe nada', () => {
    const viejo: RawAnalysis = {
      discrepancies: [{
        topic: 'Días de vacaciones',
        newDocSays: 'Dice 23.',
        existingDocSays: 'Dice 22.',
        existingDocument: IDENTIDAD.nombre,
      }],
    };
    const problemas = problemsFromAnalysis(viejo);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].relatedDoc).toBe(IDENTIDAD.nombre);
    expect(problemas[0].relatedDocId).toBeUndefined();
  });
});
