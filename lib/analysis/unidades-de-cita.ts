/**
 * LAS UNIDADES DE CITA DE UN TROZO (vía 2 de F-122, primer paso; 09/10/2026).
 *
 * Parte el texto de UN trozo en unidades numeradas que el juez podrá señalar
 * por número en vez de copiar. Es el mismo mecanismo que `[F3]` en las filas de
 * Excel —nuestro código marca, el juez copia la marca, el código la resuelve—,
 * llevado a la prosa. Hoy NO LO IMPORTA NADIE: el prompt, el contrato del juez y
 * la puerta de citas no cambian con este fichero.
 *
 * EL NOMBRE: de la familia `-de-cita` (coincidencia, glosa, diagnóstico), y
 * nombra el PROPÓSITO, no la forma: si la regla pasa de frase a párrafo, sigue
 * siendo verdad. «Segmento» ya significa dos cosas en el repositorio
 * (`extractSegments` y los `segmentos_de_fila` de la puerta) y «frase» sería
 * falso para una línea suelta o un corte por el tope.
 *
 * ⚠️ ALCANCE (D1 de F-122): SÓLO TROZOS DE TIPO TEXTO. Las filas de Excel
 * (`table_row`) tienen su propio puntero y no pasan por aquí.
 *
 * LAS CINCO INVARIANTES, y las cinco tienen prueba:
 *   1. COBERTURA TOTAL Y CONTIGUA: la primera unidad empieza en 0, cada una
 *      acaba donde empieza la siguiente y la última en `texto.length`. Unidas
 *      sin separador, reconstruyen el texto byte a byte. Los espacios y saltos
 *      entre frases son de la unidad que los PRECEDE; el recorte para mostrar
 *      lo hace quien muestra.
 *   2. DETERMINISMO: sin azar y sin nada del entorno. PROHIBIDO
 *      `Intl.Segmenter` (depende del ICU de la máquina) y las clases Unicode
 *      `\p{…}`: los caracteres que deciden están ESCRITOS aquí, porque los
 *      desplazamientos que se guarden tienen que significar lo mismo dentro de
 *      dos años en otra máquina.
 *   3. TOPE DURO DE 400 caracteres: ninguna unidad lo pasa. Una frase más larga
 *      se corta por el último espacio que deje la unidad en 400 o menos; una
 *      palabra de más de 400, en seco.
 *   4. SUELO BLANDO DE 25: una unidad más corta se funde HACIA ADELANTE con la
 *      siguiente —un titular queda pegado al párrafo que titula, no al final
 *      del anterior—. No se funde la última (no hay siguiente) ni cuando la
 *      fusión pasaría de 400: SI CHOCAN, GANA EL TOPE.
 *   5. UN SALTO DE LÍNEA SIEMPRE CIERRA UNIDAD: en estos documentos los
 *      titulares y las viñetas no acaban en punto, y la unidad real es la línea.
 */

export interface UnidadDeCita {
  /** 1, 2, 3… consecutivo dentro del trozo. */
  numero: number;
  /** Desplazamiento en el texto del trozo, incluido. */
  desde: number;
  /** Desplazamiento en el texto del trozo, excluido. */
  hasta: number;
  /** El corte exacto: `texto.slice(desde, hasta)`. */
  texto: string;
}

export const TOPE_DE_LA_UNIDAD = 400;
export const SUELO_DE_LA_UNIDAD = 25;

/**
 * LAS ABREVIATURAS: si la palabra que precede al punto es una de éstas (en
 * minúsculas, sin el punto), el punto NO cierra frase. La lista SALE DE LA
 * MEDIDA del corpus (`scripts/medir-unidades-de-cita.mjs`), no de la memoria.
 *
 * ⚠️ VACÍA A PROPÓSITO (medida del 09/10/2026 sobre los 6 .docx de
 * `corpus-pruebas/`): de los 93 cortes con palabra de 4 caracteres o menos
 * antes del signo, NINGUNO era una abreviatura —eran palabras reales («red»,
 * «día», «área»…), «°C», numerales romanos («grupo III.») o cortes sin palabra
 * (números, paréntesis)—. Es un corpus de seis documentos: el día que un
 * documento real parta frases por «Dr.» o «art.», se mide y se añade aquí.
 *
 * LA LISTA SE RELLENA MIDIENDO, Y EL SCRIPT ES LA HERRAMIENTA: se vuelve a pasar
 * `scripts/medir-unidades-de-cita.mjs` cuando entren documentos nuevos al
 * corpus, y se añade lo que aparezca. NO se añade lo que la medida no ha visto,
 * aunque sea probable (decisión del arquitecto, 09/10, sobre «Dr.»).
 */
export const ABREVIATURAS: readonly string[] = [];

/** Signos que cierran una frase. */
const FIN_DE_FRASE = new Set(['.', '!', '?', '…']);
/** Lo que puede ir entre el signo y el espacio sin impedir el corte: comillas y paréntesis de cierre. */
const CIERRES = new Set(['»', '"', '”', '’', "'", ')', ']']);
/** Los espacios, escritos uno a uno (nada de `\s`, que es una clase Unicode). */
const ESPACIOS = new Set([' ', '\t', '\n', '\r', '\f', '\v', ' ']);
/** Lo que, tras el espacio, confirma que empieza una frase nueva. */
const INICIO_DE_FRASE = new Set([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'ÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÏÇ',
  ...'0123456789',
  '¿', '¡',
]);
/** Lo que forma parte de una palabra, para leer la que precede al punto. */
const LETRAS = new Set([
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'áéíóúüñàèìòùâêîôûïçÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÏÇ',
]);

/** ¿Empieza en `inicio` una línea de titular (Markdown `#`, como deja el
 *  extractor de .docx), tras los espacios del principio? */
function esLineaDeTitular(texto: string, inicio: number): boolean {
  let k = inicio;
  while (k < texto.length && (texto[k] === ' ' || texto[k] === '\t')) k++;
  return texto[k] === '#';
}

/** La palabra que acaba justo antes de `fin` (exclusivo), en minúsculas. */
function palabraAntes(texto: string, fin: number): string {
  let i = fin;
  while (i > 0 && LETRAS.has(texto[i - 1])) i--;
  return texto.slice(i, fin).toLowerCase();
}

/** Los cortes de la regla 5 (salto de línea) y del corte de frase: posiciones
 *  donde termina una pieza, con los espacios que la siguen ya incluidos. */
function cortesNaturales(texto: string): number[] {
  const cortes: number[] = [];
  const n = texto.length;
  let i = 0;
  let enTitular = esLineaDeTitular(texto, 0);
  while (i < n) {
    const c = texto[i];
    if (c === '\n') {
      let j = i + 1;
      while (j < n && ESPACIOS.has(texto[j])) j++;
      if (j < n) cortes.push(j);
      enTitular = esLineaDeTitular(texto, j);
      i = j;
      continue;
    }
    // Dentro de un titular no se corta por signo: «## 2.2. Personal auxiliar»
    // es UNA línea, y la cierra el salto (regla 5). Medido el 09/10: sin esto,
    // 5 titulares numerados del corpus quedaban partidos tras su número.
    if (FIN_DE_FRASE.has(c) && !enTitular) {
      let j = i + 1;
      while (j < n && CIERRES.has(texto[j])) j++;
      const finDelSigno = j;
      if (j < n && ESPACIOS.has(texto[j])) {
        let k = j;
        let conSalto = false;
        while (k < n && ESPACIOS.has(texto[k])) { if (texto[k] === '\n') conSalto = true; k++; }
        const esAbreviatura = c === '.' && ABREVIATURAS.includes(palabraAntes(texto, i));
        // Con salto de línea en medio, el corte ya lo da la regla 5.
        if (!conSalto && k < n && INICIO_DE_FRASE.has(texto[k]) && !esAbreviatura) cortes.push(k);
        i = conSalto ? finDelSigno : k;
        continue;
      }
      i = finDelSigno;
      continue;
    }
    i++;
  }
  return cortes;
}

/** Regla 3: parte una pieza [desde, hasta) en trozos de 400 o menos. */
function aplicarTope(texto: string, desde: number, hasta: number): Array<[number, number]> {
  const piezas: Array<[number, number]> = [];
  let inicio = desde;
  while (hasta - inicio > TOPE_DE_LA_UNIDAD) {
    const limite = inicio + TOPE_DE_LA_UNIDAD;
    // El último espacio que deje la pieza en 400 o menos: se corta DESPUÉS de él.
    let corte = -1;
    for (let k = limite; k > inicio; k--) {
      if (ESPACIOS.has(texto[k - 1])) { corte = k; break; }
    }
    if (corte <= inicio) corte = limite; // una palabra de más de 400: en seco
    piezas.push([inicio, corte]);
    inicio = corte;
  }
  piezas.push([inicio, hasta]);
  return piezas;
}

/** Regla 4: lo que mide menos de 25 se funde con lo que sigue, salvo que pase de 400. */
function aplicarSuelo(piezas: Array<[number, number]>): Array<[number, number]> {
  const salida: Array<[number, number]> = [];
  let i = 0;
  while (i < piezas.length) {
    let [desde, hasta] = piezas[i];
    i++;
    while (hasta - desde < SUELO_DE_LA_UNIDAD && i < piezas.length) {
      const [, siguienteHasta] = piezas[i];
      if (siguienteHasta - desde > TOPE_DE_LA_UNIDAD) break; // gana el tope
      hasta = siguienteHasta;
      i++;
    }
    salida.push([desde, hasta]);
  }
  return salida;
}

/** Las unidades de cita del texto de un trozo. Pura y determinista. */
export function unidadesDeCita(texto: string): UnidadDeCita[] {
  if (texto.length === 0) return [];
  const limites = [0, ...cortesNaturales(texto), texto.length];
  const piezas: Array<[number, number]> = [];
  for (let k = 0; k + 1 < limites.length; k++) {
    if (limites[k + 1] > limites[k]) piezas.push(...aplicarTope(texto, limites[k], limites[k + 1]));
  }
  return aplicarSuelo(piezas).map(([desde, hasta], i) => ({
    numero: i + 1, desde, hasta, texto: texto.slice(desde, hasta),
  }));
}
