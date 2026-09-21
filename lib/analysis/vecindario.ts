import type { VectorMatch } from '@/lib/pinecone/types';
import { CUBOS, cuboDe, bordeInferior, histogramaVacio, percentilDelHistograma } from './cubos-de-score';
import { soloGeneracionActiva, generacionesMuertas } from './generacion-activa';
import { SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE } from './retrieval';
import {
  clasificarTrozo,
  clasificarPar,
  reparteVacio,
  type ClaseDePar,
} from './clase-de-trozo';

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
  /** B.246 — DE QUÉ CLASE ES EL PAR DE TROZOS QUE PRODUJO ESTE VECINO.
   *  Un vecino no lo produce un trozo: lo produce un par. Si la mayoría de los
   *  vecinos de este corpus son `resumen_x_resumen`, el parecido es de
   *  envoltorio y no de contenido — y entonces el tope de 6 (B.244) no está
   *  descartando basura, está descartando documentos buenos para quedarse con
   *  hojas que casan por la frase hecha. */
  clasePar: ClaseDePar;
  /** Los dos textos que casaron, recortados. Es la prueba que un humano puede
   *  leer sin creerse la clasificación: si los dos empiezan por la misma frase
   *  y siguen con datos ajenos, está visto. */
  muestraPropia: string;
  muestraVecina: string;
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
  /**
   * F-113 — Consultas que Pinecone RECHAZÓ o que fallaron. ⚠️ Su motivo más
   * probable con un `topK` alto es el **tope de 4MB por respuesta** del servicio
   * (ver `TOPK_MAXIMO_DEL_SERVICIO`). Existe para que un fallo **no se pueda leer
   * como un cero**: una consulta que no volvió no es un vecindario vacío, y sin
   * este contador las dos cosas serían el mismo número.
   */
  consultas_fallidas: number;
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
  /** B.246 — reparto por clase del par, sobre los vecinos que pasan 0,50. */
  porClase: Record<ClaseDePar, number>;
  /** F-111 — la distribución de los scores POR FRAGMENTO de este documento, que
   *  es el operando que el umbral juzga de verdad. Ver `distribucionDeScores`. */
  distribucion: DistribucionDeScores;
  /** F-114 — qué dos fragmentos produjeron el mínimo de este documento.
   *  `null` cuando no hubo ni una observación (documento sin vectores): ausente
   *  y «pareja vacía» no significan lo mismo. Ver `parejaDelMinimo`. */
  parejaDelMinimo: ParejaDelMinimo | null;
}

/** Forma mínima que el censo necesita de un match para poder contarlo. */
interface MatchContable {
  documentId: string;
  documentName: string;
  generation?: number;
  score: number;
  /** F-114 — el id del vector devuelto y su indice de trozo, para poder nombrar
   *  la PAREJA DEL MINIMO. Los dos ya venian en la respuesta: nombrarlos no
   *  cuesta ni una consulta mas. */
  vectorId: string;
  chunkIndex: number | null;
  /** El texto del trozo que casó. Ya viaja en la metadata, así que saberlo no
   *  cuesta ni una consulta más. */
  texto: string;
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
      texto: typeof meta.text === 'string' ? meta.text : '',
      vectorId: m.id,
      chunkIndex: typeof meta.chunkIndex === 'number' ? meta.chunkIndex : null,
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
  /** Texto del trozo PROPIO con el que se consultó. La clase del par no se
   *  puede saber mirando sólo un lado. */
  textoPropio: string,
): void {
  const clasePropia = clasificarTrozo(textoPropio);
  for (const c of contables) {
    const previo = mejores.get(c.documentId);
    if (previo === undefined || c.score > previo.scoreMax) {
      mejores.set(c.documentId, {
        documentId: c.documentId,
        documentName: c.documentName,
        scoreMax: c.score,
        clasePar: clasificarPar(clasePropia, clasificarTrozo(c.texto)),
        muestraPropia: textoPropio.slice(0, 140),
        muestraVecina: c.texto.slice(0, 140),
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
  /** ⚠️ EL REPARTO ES LA RESPUESTA A B.246. Cuenta sobre los vecinos que pasan
   *  0,50 — los que de verdad llegarían al rerank. */
  porClase: Record<ClaseDePar, number>;
} {
  const todos = [...mejores.values()].sort((a, b) => b.scoreMax - a.scoreMax);
  const detalle = todos.filter(v => v.scoreMax >= SCORE_THRESHOLD_EXHAUSTIVE);
  const queLlegan = todos.filter(v => v.scoreMax >= SCORE_THRESHOLD_QUICK);
  const porClase = reparteVacio();
  for (const v of queLlegan) porClase[v.clasePar] += 1;
  return {
    vecinos: queLlegan.length,
    vecinos_045: detalle.length,
    scoreMax: todos.length > 0 ? todos[0].scoreMax : 0,
    detalle,
    porClase,
  };
}

/** Los umbrales con los que se ha contado, para que la respuesta diga con qué
 *  regla se midió en vez de obligar a buscarla en el código. */
export const UMBRALES_DEL_CENSO = {
  vecinos: SCORE_THRESHOLD_QUICK,
  vecinos_045: SCORE_THRESHOLD_EXHAUSTIVE,
} as const;

// ============================================================
// LA DISTRIBUCIÓN POR FRAGMENTO — medición F-111 (21/09/2026)
// ============================================================

/**
 * ⚠️ QUÉ MIDE ESTO Y POR QUÉ NO LO MEDÍA NADA HASTA HOY.
 *
 * El resto de este módulo cuenta VECINOS: colapsa los scores al MÁXIMO por
 * documento (`acumularVecinos`) porque la pregunta de B.243 es «contra cuántos
 * documentos toca». De ahí salió el suelo de ~0,79 del corpus.
 *
 * ⚠️ PERO EL UMBRAL DE LA RECUPERACIÓN NO COMPARA ESO. Compara **fragmento a
 * fragmento**, tal como Pinecone los devuelve: `pasaElUmbral(m.score, umbral)`
 * en `retrieval.ts:498`, dentro de `collectMatches`. Un DOCUMENTO sólo se pierde
 * si NINGUNO de sus fragmentos pasa —eso es lo que cuenta el contador
 * persistido `seleccion.candidatos_perdidos_por_umbral`, y da cero—, pero
 * cuántos FRAGMENTOS descarta no lo mide nadie. El suelo de 0,79 es del máximo
 * por documento: **el rango del operando real nunca se había mirado.**
 *
 * Esta función es el termómetro de ese operando, y nada más: no filtra, no
 * decide y no toca el pipeline. Los scores le llegan ya calculados por las
 * mismas consultas que el censo ya hacía, así que **no cuesta ni una consulta
 * más, ni un token de embedding, ni una llamada a ningún modelo.**
 */
export interface DistribucionDeScores {
  /** Fragmentos observados. Es el DENOMINADOR: sin él ningún percentil dice nada. */
  n: number;
  /** `null` cuando no hubo ni un fragmento — ausente y cero no significan lo mismo. */
  minimo: number | null;
  maximo: number | null;
  /**
   * Veinte cubos fijos de 0,05 entre 0 y 1: `histograma[0]` es [0,00 · 0,05),
   * `histograma[19]` es [0,95 · 1,00]. El 1,00 exacto cae en el último cubo.
   */
  histograma: number[];
  /**
   * ⚠️ PERCENTILES **APROXIMADOS AL CUBO**, no exactos. Se derivan del
   * histograma, así que cada uno es **el borde inferior del cubo** donde la
   * acumulada alcanza el percentil: el valor real está entre ese borde y el
   * siguiente (0,05 de margen). Se dice aquí y no en la respuesta para que nadie
   * los lea como una medida fina. `null` si no hubo fragmentos.
   */
  p1: number | null;
  p5: number | null;
  p50: number | null;
  /**
   * Fragmentos que el umbral del RÁPIDO descartaría. Complemento exacto de
   * `pasaElUmbral` (`umbral-de-recuperacion.ts:22`, `score >= umbral`), así que
   * aquí es `score < umbral`: un score EXACTAMENTE igual al umbral **pasa** y no
   * se cuenta.
   */
  bajo_umbral_rapido: number;
  /** Lo mismo con el umbral del EXHAUSTIVO. */
  bajo_umbral_exhaustivo: number;
}


/** El termómetro del operando real. Función pura: no lee nada ni escribe nada. */
export function distribucionDeScores(scores: number[]): DistribucionDeScores {
  const histograma = histogramaVacio();
  let minimo: number | null = null;
  let maximo: number | null = null;
  let bajoRapido = 0;
  let bajoExhaustivo = 0;

  for (const score of scores) {
    if (!Number.isFinite(score)) continue;
    histograma[cuboDe(score)] += 1;
    if (minimo === null || score < minimo) minimo = score;
    if (maximo === null || score > maximo) maximo = score;
    // El complemento EXACTO de pasaElUmbral: `>=` pasa, luego `<` no pasa.
    if (score < SCORE_THRESHOLD_QUICK) bajoRapido += 1;
    if (score < SCORE_THRESHOLD_EXHAUSTIVE) bajoExhaustivo += 1;
  }

  const n = histograma.reduce((suma, c) => suma + c, 0);

  return {
    n,
    minimo,
    maximo,
    histograma,
    p1: percentilDelHistograma(histograma, n, 1),
    p5: percentilDelHistograma(histograma, n, 5),
    p50: percentilDelHistograma(histograma, n, 50),
    bajo_umbral_rapido: bajoRapido,
    bajo_umbral_exhaustivo: bajoExhaustivo,
  };
}

// ============================================================
// LOS DOS PARÁMETROS DEL CENSO — medición del suelo, F-113 (21/09/2026)
// ============================================================

/**
 * ⚠️ POR QUÉ HACE FALTA UN `topK` MAYOR QUE EL DEL PIPELINE.
 *
 * Con `topK = 25`, una consulta contra un fondo mayor devuelve **los 25 mejores**,
 * así que el mínimo observado no es el suelo de la similitud: es **el puesto 25**.
 * Medir el suelo exige `topK` por encima del tamaño del fondo — entonces la
 * consulta devuelve el fondo entero, suelo incluido.
 *
 * ⚠️ Y EL TOPE NO LO PONE ESTA CASA: lo pone el servicio, y va con su fuente para
 * que nadie lo tenga que adivinar ni volver a buscarlo.
 *   https://docs.pinecone.io/reference/api/database-limits/operation-limits
 *   leída el 21/09/2026: «Max top_k value | 10,000» y «Max result size | 4MB».
 *
 * ⚠️ LOS DOS TOPES SON DISTINTOS Y EL SEGUNDO NO SE PUEDE ACOTAR AQUÍ: un
 * `topK` de 10.000 respeta el primero y puede reventar el segundo, porque el
 * peso depende de la metadata que traiga cada match. Por eso el parseo acota
 * contra el tope de `top_k` y la consulta que falla se CUENTA
 * (`consultas_fallidas`) en vez de degradarse a cero.
 *
 * El SDK instalado (@pinecone-database/pinecone 4.1.0) sólo valida el mínimo
 * —`topK` entero y mayor que 0—, así que el máximo no lo hace cumplir nadie más.
 */
export const TOPK_MAXIMO_DEL_SERVICIO = 10000;

/** Lo que el censo va a usar, y qué pasó con lo que pidió quien llamó. */
export interface TopKPedido {
  /** El valor que se usará de verdad. */
  valor: number;
  /** Venía por encima del tope del servicio y se recortó a él. */
  acotado: boolean;
  /** Venía algo que no es un entero ≥ 1, y se ignoró: se usa el valor por defecto. */
  ignorado: boolean;
}

/**
 * Parseo del `?topK=N`. Función pura.
 *
 * ⚠️ FALLA HACIA EL COMPORTAMIENTO DE HOY: cualquier cosa que no sea un entero
 * mayor o igual que 1 se IGNORA y se usa `porDefecto` —el `topK` del pipeline—,
 * y se declara con `ignorado`. Un parámetro basura no debe cambiar la medición
 * en silencio, y tampoco debe tumbar el censo: se dice y se sigue.
 */
export function topKPedido(raw: string | null | undefined, porDefecto: number): TopKPedido {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return { valor: porDefecto, acotado: false, ignorado: false };
  }
  // ⚠️ SÓLO DÍGITOS, y no `Number()` a secas. `Number` acepta `10e3`, `0x10` y
  // `+5`, que son enteros para el lenguaje y no son lo que nadie escribe en una
  // URL queriendo un tope: `0x10` entraría como 16 sin que quien lo pidió lo
  // supiera. «Entero» aquí significa lo que parece.
  if (!/^\d+$/.test(raw.trim())) {
    return { valor: porDefecto, acotado: false, ignorado: true };
  }
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 1) {
    return { valor: porDefecto, acotado: false, ignorado: true };
  }
  if (n > TOPK_MAXIMO_DEL_SERVICIO) {
    return { valor: TOPK_MAXIMO_DEL_SERVICIO, acotado: true, ignorado: false };
  }
  return { valor: n, acotado: false, ignorado: false };
}

/**
 * Qué población se consulta.
 *   · `todos` — sin filtro de corpus: TODO el namespace. Es el censo de B.243 y
 *     el comportamiento por omisión, que no cambia.
 *   · `real`  — la población que el análisis puede alcanzar de verdad: el filtro
 *     `CORPUS_ACTIVO` más la exclusión del documento propio DENTRO de la consulta.
 */
export type PoblacionDelCenso = 'todos' | 'real';

/**
 * Parseo del `?poblacion=`. Función pura, y **falla hacia `todos`**: cualquier
 * valor que no sea exactamente `real` deja el censo como está hoy. Es la
 * dirección segura — el error benigno es medir de más, no medir otra cosa sin
 * avisar.
 */
export function poblacionPedida(raw: string | null | undefined): PoblacionDelCenso {
  return (raw ?? '').trim().toLowerCase() === 'real' ? 'real' : 'todos';
}

// ============================================================
// LA PAREJA DEL MÍNIMO — F-114 (21/09/2026)
// ============================================================

/**
 * ⚠️ QUÉ PREGUNTA CONTESTA, Y POR QUÉ NO BASTA EL NÚMERO. El censo dice que el
 * suelo de la similitud por fragmento es 0,696. Un número solo no se puede
 * examinar: Fable pide saber **qué dos fragmentos** lo producen y de qué especie
 * son —muy corto, tabla numérica, otro idioma— porque eso es el CASO ADVERSO
 * CONSTRUIBLE que las siembras futuras necesitan. Un mínimo sin su pareja es una
 * cifra que no se puede reproducir ni sembrar.
 *
 * ⚠️ SE ACUMULA EN STREAMING, y no es una preferencia de estilo: la matriz
 * completa son 680 × 680 observaciones. Guardarlas todas para ordenarlas al
 * final serían cientos de megas de texto en memoria dentro de una función de
 * Vercel. `acumularParejaDelMinimo` conserva UNA y cuenta los empates, así que
 * el coste en memoria es constante.
 *
 * ⚠️ `chunkType` NO VIAJA EN LA METADATA DE PINECONE. `VectorMetadata`
 * (`lib/pinecone/types.ts:2-20`) lleva `text`, `documentId`, `documentName`,
 * `chunkIndex`, `totalChunks`, `orgId` y tres opcionales — no el tipo de trozo.
 * Vive en `document_chunks.chunk_type`, en Supabase. Aquí se devuelve el
 * `chunkIndex`, que SÍ está, y con él se puede buscar el tipo en la base sin
 * añadir una lectura por cada pareja. Se dice en vez de devolver el campo vacío.
 */

/** Un lado de la pareja: de dónde sale el fragmento y qué dice. */
export interface LadoDeLaPareja {
  /** El id del vector, tal como Pinecone lo tiene. */
  vectorId: string;
  documentId: string;
  documentName: string;
  /** El índice del trozo dentro de su documento. Con él y el documentId se
   *  encuentra su `chunk_type` en `document_chunks`. */
  chunkIndex: number | null;
  /** Los 120 primeros caracteres. Recortado a propósito: es una MUESTRA para
   *  reconocer la especie del fragmento, no una copia de su contenido. */
  texto: string;
}

/** Una observación suelta: un score con sus dos lados. */
export interface ObservacionDeScore {
  score: number;
  consulta: LadoDeLaPareja;
  devuelto: LadoDeLaPareja;
}

/** La pareja que produjo el mínimo, con el empate declarado. */
export interface ParejaDelMinimo {
  score: number;
  /** ⚠️ SE DECLARA: si dos parejas distintas dan el mismo score mínimo, quedarse
   *  con una y callar convertiría una coincidencia en un hecho. Se conserva la
   *  PRIMERA y se dice cuántas hubo. */
  empate: boolean;
  /** Cuántas observaciones tienen exactamente ese score, contando la conservada. */
  empatados: number;
  consulta: LadoDeLaPareja;
  devuelto: LadoDeLaPareja;
}

/** Los 120 primeros caracteres, para las dos muestras. Un solo sitio. */
export const CARACTERES_DE_MUESTRA = 120;

export function muestraDeTexto(texto: string): string {
  return texto.slice(0, CARACTERES_DE_MUESTRA);
}

/**
 * El acumulador: conserva la pareja de menor score y cuenta los empates.
 * Función pura — no muta el acumulador que recibe.
 */
export function acumularParejaDelMinimo(
  acumulado: ParejaDelMinimo | null,
  obs: ObservacionDeScore,
): ParejaDelMinimo | null {
  if (!Number.isFinite(obs.score)) return acumulado;
  if (acumulado === null || obs.score < acumulado.score) {
    return { score: obs.score, empate: false, empatados: 1, consulta: obs.consulta, devuelto: obs.devuelto };
  }
  if (obs.score === acumulado.score) {
    // La PRIMERA se conserva; sólo sube el recuento y se enciende la bandera.
    return { ...acumulado, empate: true, empatados: acumulado.empatados + 1 };
  }
  return acumulado;
}

/** La misma decisión sobre una lista ya reunida. Es el pliegue de arriba. */
export function parejaDelMinimo(observaciones: Iterable<ObservacionDeScore>): ParejaDelMinimo | null {
  let acc: ParejaDelMinimo | null = null;
  for (const obs of observaciones) acc = acumularParejaDelMinimo(acc, obs);
  return acc;
}

/**
 * Combina las parejas mínimas de dos TRAMOS de la misma medición. Gana la menor;
 * con el mismo score se suman los empates, porque son observaciones distintas.
 */
export function parejaMenorDeDos(
  a: ParejaDelMinimo | null,
  b: ParejaDelMinimo | null,
): ParejaDelMinimo | null {
  if (a === null) return b;
  if (b === null) return a;
  if (b.score < a.score) return b;
  if (a.score < b.score) return a;
  return { ...a, empate: true, empatados: a.empatados + b.empatados };
}

// ============================================================
// EL TRAMO — partir la matriz completa, F-114 (21/09/2026)
// ============================================================

/**
 * ⚠️ POR QUÉ HACE FALTA PARTIRLA, Y ES UNA COTA, NO UNA ESTIMACIÓN.
 *
 * La matriz completa son ~680 consultas con `topK=1000`. La única referencia que
 * hay es que **80 consultas con topK=1000 terminaron** dentro de los 300 s de
 * `maxDuration`. Eso da una COTA SUPERIOR de 3,75 s por consulta y **ningún
 * límite inferior**: con ese techo, 680 consultas podrían tardar hasta 2.550 s.
 * No se puede afirmar que caben, así que la medición se parte.
 *
 * ⚠️ Y EL ORDEN DE LOS DOCUMENTOS TIENE QUE SER ESTABLE, o los tramos se solapan
 * y se dejan huecos sin que nadie lo note: la consulta a Supabase ordena por
 * `id` explícitamente. Sin `order`, Postgres no garantiza el orden entre dos
 * llamadas, y «tramo 0-10» más «tramo 10-20» no serían una partición.
 *
 * LO QUE SE COMBINA A MANO, y por eso la respuesta lo declara: los histogramas
 * se SUMAN cubo a cubo, los mínimos se toman por el MENOR, las `n` se suman, y
 * la pareja del mínimo se elige con `parejaMenorDeDos`. Los percentiles NO se
 * pueden combinar: se recalculan del histograma sumado.
 */
export interface TramoPedido {
  /** Índice del primer documento del tramo, contando desde 0. */
  desde: number;
  /** Cuántos documentos procesa este tramo. */
  cuantos: number;
  /** true si quien llamó pidió un tramo; false si es la pasada entera. */
  aplicado: boolean;
  /** true si algún parámetro venía mal escrito y se ignoró. */
  ignorado: boolean;
}

/** Parseo del `?desde=N&cuantos=M`. Función pura, y falla hacia la pasada entera. */
export function tramoPedido(
  rawDesde: string | null | undefined,
  rawCuantos: string | null | undefined,
  totalDeDocumentos: number,
): TramoPedido {
  const entero = (raw: string | null | undefined): number | null => {
    if (raw === null || raw === undefined || raw.trim() === '') return null;
    if (!/^\d+$/.test(raw.trim())) return NaN;
    return Number(raw.trim());
  };
  const d = entero(rawDesde);
  const c = entero(rawCuantos);
  const malo = Number.isNaN(d) || Number.isNaN(c) || (c !== null && c < 1);
  if (malo) {
    return { desde: 0, cuantos: totalDeDocumentos, aplicado: false, ignorado: true };
  }
  if (d === null && c === null) {
    return { desde: 0, cuantos: totalDeDocumentos, aplicado: false, ignorado: false };
  }
  const desde = Math.min(d ?? 0, totalDeDocumentos);
  const cuantos = Math.min(c ?? totalDeDocumentos, Math.max(0, totalDeDocumentos - desde));
  return { desde, cuantos, aplicado: true, ignorado: false };
}
