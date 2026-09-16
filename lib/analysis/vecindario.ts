import type { VectorMatch } from '@/lib/pinecone/types';
import { soloGeneracionActiva, generacionesMuertas } from './generacion-activa';
import { SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE } from './retrieval';

/**
 * EL CENSO DE VECINDARIO — B.243.
 *
 * Contesta, por cada documento, CONTRA CUÁNTOS OTROS tiene al menos un trozo
 * por encima del umbral. Es la pregunta que el producto no sabía contestar:
 * «¿qué documento de los míos toca a más documentos?».
 *
 * ⚠️ POR QUÉ NO CUESTA UN CRÉDITO. Los vectores ya están calculados y pagados:
 * `fetchVectors` los devuelve con sus `values`, así que aquí no se embebe nada
 * ni interviene ningún modelo. Son lecturas de Pinecone y nada más.
 *
 * ⚠️ LOS UMBRALES Y EL topK SE IMPORTAN, NO SE COPIAN. Vienen de `retrieval.ts`,
 * que es quien los decidió. Un 0,50 escrito aquí sería una segunda definición
 * del mismo criterio, y el día que allí cambiara, este censo mediría otra cosa
 * sin que nadie se enterara — los dos seguirían pareciendo correctos por su
 * cuenta.
 *
 * ⚠️ Y LA GENERACIÓN SE PREGUNTA. `soloGeneracionActiva` es la misma función que
 * usa el retrieval; aquí no se vuelve a derivar qué generación sirve cada
 * documento.
 */

/** Un vecino, con el mejor parecido encontrado contra el documento de la fila. */
export interface Vecino {
  documentId: string;
  documentName: string;
  scoreMax: number;
}

/** Los contadores del censo. Todos se escriben SIEMPRE, incluidos los ceros:
 *  un cero que no aparece no se distingue de «no se miró». */
export interface ContadoresDelCenso {
  /** Fragmentos descartados por pertenecer a una generación muerta.
   *  ⚠️ ESPERADO CERO. Si se mueve, hay vectores zombis vivos en el índice. */
  fragmentos_de_generacion_muerta: number;
  /** Documentos sin ningún vector en el índice. Un documento con filas en
   *  Supabase y cero vectores no puede ser candidato de nadie, y el censo lo
   *  dice en vez de darle silenciosamente cero vecinos por parecido. */
  documentos_sin_vectores: number;
  /** Consultas que NO se hicieron por alcanzar el tope del censo. Es el
   *  contador del límite declarado: sin él, un censo truncado se leería como un
   *  censo completo con pocos vecinos. */
  consultas_omitidas_por_tope: number;
  /** Consultas efectivamente lanzadas contra Pinecone. Es el DENOMINADOR: un
   *  «0 vecinos» sólo significa algo si se sabe cuántas veces se buscó. */
  consultas_realizadas: number;
}

export interface FilaDeVecindario {
  documentId: string;
  documentName: string;
  analysisStatus: string | null;
  /** Cuántos vectores suyos se han usado para preguntar. */
  consultas: number;
  /** Cuántos OTROS documentos superan el umbral del rápido (0,50). */
  vecinos: number;
  /** Cuántos superan el umbral del exhaustivo (0,45).
   *  ⚠️ `vecinos_045 - vecinos` ES LO QUE EL EXHAUSTIVO COMPRA con su umbral,
   *  sabido sin gastar 30 créditos. */
  vecinos_045: number;
  /** El parecido más alto que este documento tiene con cualquier otro. */
  scoreMax: number;
  /** Los vecinos por encima de 0,45, de mayor a menor parecido. */
  detalle: Vecino[];
}

/** Forma mínima que el censo necesita de un match para poder contarlo. */
interface MatchContable {
  documentId: string;
  documentName: string;
  generation?: number;
  score: number;
}

/**
 * Convierte los matches crudos de una consulta en algo contable, descartando:
 * el propio documento (que siempre se encuentra a sí mismo a ~1,0), los que no
 * traen metadata utilizable, y los de generación muerta.
 *
 * Devuelve además cuántos cayeron por generación, para que la caída no sea muda.
 */
export function matchesContables(
  matches: VectorMatch[],
  documentoPropio: string,
  activas: Map<string, number>,
): { contables: MatchContable[]; deGeneracionMuerta: number } {
  const crudos: MatchContable[] = [];
  for (const m of matches) {
    const meta = m.metadata;
    if (!meta || typeof meta.documentId !== 'string') continue;
    if (meta.documentId === documentoPropio) continue;
    if (typeof m.score !== 'number') continue;
    crudos.push({
      documentId: meta.documentId,
      documentName: typeof meta.documentName === 'string' ? meta.documentName : meta.documentId,
      generation: meta.generation,
      score: m.score,
    });
  }
  // La MISMA función que usa el retrieval. No se recalcula el criterio.
  const vivos = soloGeneracionActiva(crudos, activas);
  const muertas = generacionesMuertas(crudos, activas);
  let deGeneracionMuerta = 0;
  for (const n of muertas.values()) deGeneracionMuerta += n;
  return { contables: vivos, deGeneracionMuerta };
}

/**
 * Acumula, para un documento, el MEJOR score encontrado contra cada vecino.
 * Se llama una vez por consulta; el mapa se conserva entre consultas del mismo
 * documento — un vecino se cuenta UNA vez aunque lo encuentren ocho trozos.
 */
export function acumularVecinos(
  mejores: Map<string, Vecino>,
  contables: MatchContable[],
): void {
  for (const c of contables) {
    const previo = mejores.get(c.documentId);
    if (previo === undefined || c.score > previo.scoreMax) {
      mejores.set(c.documentId, {
        documentId: c.documentId,
        documentName: c.documentName,
        scoreMax: c.score,
      });
    }
  }
}

/**
 * Cierra la fila de un documento: cuántos vecinos pasan cada umbral.
 *
 * ⚠️ EL CONTEO ES POR DOCUMENTO, NO POR FRAGMENTO — que es lo mismo que hace el
 * retrieval al agrupar `byDoc`. Contar fragmentos daría una cifra mayor que no
 * se parece a la que el pipeline usa, y esa es exactamente la clase de artefacto
 * que esta casa ya dejó pasar por dato una vez.
 */
export function resumirVecindario(mejores: Map<string, Vecino>): {
  vecinos: number;
  vecinos_045: number;
  scoreMax: number;
  detalle: Vecino[];
} {
  const todos = [...mejores.values()].sort((a, b) => b.scoreMax - a.scoreMax);
  const detalle = todos.filter(v => v.scoreMax >= SCORE_THRESHOLD_EXHAUSTIVE);
  return {
    vecinos: todos.filter(v => v.scoreMax >= SCORE_THRESHOLD_QUICK).length,
    vecinos_045: detalle.length,
    scoreMax: todos.length > 0 ? todos[0].scoreMax : 0,
    detalle,
  };
}

/** Los umbrales con los que se ha contado, para que la respuesta diga con qué
 *  regla se midió en vez de obligar a buscarla en el código. */
export const UMBRALES_DEL_CENSO = {
  vecinos: SCORE_THRESHOLD_QUICK,
  vecinos_045: SCORE_THRESHOLD_EXHAUSTIVE,
} as const;
