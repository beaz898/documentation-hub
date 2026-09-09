/**
 * LOS INVARIANTES DE FORMA DE UN DOCUMENTO DE ESTADO — F-106 P4, cláusula (d).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ QUÉ NO HACE, Y VA PRIMERO PARA QUE NADIE SE APOYE DE MÁS: **esto no
 * comprueba que el documento diga la verdad.** No puede. Comprueba que su FORMA
 * no permita la clase de contradicción que nos mordió el 09/09 —el §4 diciendo
 * «no bloquea nada» y el §7, ochenta líneas más abajo, enumerando dos bloqueos
 * arreglados el día antes—. Es a la prosa lo que los tipos al código: no
 * garantiza corrección, hace INEXPRESABLE una familia de errores.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y NO ES UNA MUTACIÓN. No hay mutación honesta para prosa, y simular una
 * sería teatro. Lo que sí hay es `grep` con criterio escrito, que es esto.
 *
 * LAS TRES CLÁUSULAS QUE VIGILA, de las cuatro de F-106 P4. La que falta —
 * «secciones derivadas, no redactadas»— no se vigila con una regla propia: se
 * vigila con I3, que obliga a que toda afirmación de bloqueo viva o en una casa
 * o dentro de un bloque marcado como derivado.
 *
 *   I1 · UN HECHO, UNA CASA. Cada ficha `B.NNN` mencionada tiene EXACTAMENTE
 *        una casa. Cero = se la cita y no se declara en ninguna parte; dos o más
 *        = dos sitios contestando a la misma pregunta, que es el fallo entero.
 *   I2 · PRESENTE PERPETUO PROHIBIDO. Toda casa lleva fecha en su propia línea.
 *        Sin fecha, el lector no puede calibrar la edad de lo que lee — y una
 *        afirmación sin edad es la que caduca en silencio.
 *   I3 · NINGÚN «BLOQUEA» FUERA DE SU CASA. Una línea que afirme o niegue
 *        bloqueo y no sea una casa es, por construcción, una segunda respuesta
 *        a una pregunta que ya tiene la suya. Se exceptúa lo que esté dentro de
 *        un bloque marcado `<!-- DERIVADO -->` … `<!-- /DERIVADO -->`, que es la
 *        forma de decir «este párrafo no se redacta, se reconstruye».
 *
 * QUÉ ES UNA CASA, mecánicamente y sin adivinar intenciones:
 *   · un TÍTULO (`#`…`######`) que nombre una ficha, o
 *   · una FILA DE TABLA cuya PRIMERA CELDA nombre una ficha.
 * Todo lo demás que mencione `B.NNN` es una REFERENCIA, y una referencia no
 * declara: apunta.
 *
 * ⚠️ CONSECUENCIA QUE HAY QUE ACEPTAR ENTERA, porque es el filo de I1: una ficha
 * que tenga fila-índice Y sección propia tiene DOS casas y esto lo canta. Es
 * correcto: si la fila del índice repite el estado, es una segunda definición;
 * si solo apunta («ver 5.1»), que no lleve la ficha en su primera celda. La
 * regla no admite el término medio cómodo, que es justamente lo que se le pide.
 */

/** Las cuatro formas en que la forma se rompe. */
export type ClaseDeViolacion =
  /** Se la cita y no se declara en ninguna parte. */
  | 'ficha_sin_casa'
  /** Dos o más sitios la declaran: la contradicción ya es posible. */
  | 'ficha_con_dos_casas'
  /** Declarada sin fecha: presente perpetuo. */
  | 'casa_sin_fecha'
  /** Afirma o niega bloqueo fuera de una casa y fuera de un bloque derivado. */
  | 'bloqueo_fuera_de_casa';

export interface Violacion {
  clase: ClaseDeViolacion;
  /** `B.204`, o `undefined` cuando la violación no es de una ficha concreta. */
  ficha?: string;
  /** 1-indexada, para poder abrirla. */
  linea: number;
  /** Recorte de la línea, para que el fallo se lea sin abrir el fichero. */
  texto: string;
}

/** `B.204`, `B.99`. Deliberadamente NO acepta `B.` a secas ni cinco dígitos. */
const FICHA = /\bB\.(\d{1,4})\b/g;

/** `09/09/2026` o `09/09`. Las dos formas viven hoy en el documento. */
const FECHA = /\b\d{2}\/\d{2}(?:\/\d{4})?\b/;

/**
 * ⚠️ `bloquea` CUBRE TAMBIÉN «no bloquea», y es a propósito: negar un bloqueo es
 * afirmar un estado igual que afirmarlo. El fallo del 09/09 fue exactamente eso
 * — un «no bloquea nada» en un sitio y un «bloquean dos cosas» en otro.
 */
const BLOQUEO = /\bbloquea\w*\b/i;

const ABRE_DERIVADO = /<!--\s*DERIVADO\b/i;
const CIERRA_DERIVADO = /<!--\s*\/DERIVADO\s*-->/i;

/** Un título markdown: de uno a seis `#` seguidos de espacio. */
function esTitulo(linea: string): boolean {
  return /^#{1,6}\s/.test(linea);
}

/**
 * La primera celda de una fila de tabla, o `null` si la línea no es una fila.
 * ⚠️ Se descarta el separador (`|---|---|`): no declara nada.
 */
function primeraCelda(linea: string): string | null {
  const recortada = linea.trim();
  if (!recortada.startsWith('|')) return null;
  if (/^\|[\s:|-]*\|?\s*$/.test(recortada)) return null;
  const celdas = recortada.split('|');
  // `split` sobre `| a | b |` da ['', ' a ', ' b ', '']: la primera celda real
  // es el índice 1.
  return celdas.length > 1 ? celdas[1] : null;
}

/** Las fichas nombradas en un texto, sin repetir y en orden de aparición. */
function fichasDe(texto: string): string[] {
  const encontradas: string[] = [];
  for (const m of texto.matchAll(FICHA)) {
    const nombre = `B.${m[1]}`;
    if (!encontradas.includes(nombre)) encontradas.push(nombre);
  }
  return encontradas;
}

function recorte(linea: string): string {
  const limpia = linea.trim();
  return limpia.length <= 110 ? limpia : `${limpia.slice(0, 107)}…`;
}

/**
 * EL CHEQUEO. Función pura sobre el texto: quien lo lee del disco es el test,
 * no esto — así el criterio se puede ejercer sobre documentos sintéticos, que
 * es la única forma de saber que sabe disparar.
 */
export function invariantesDelDocumentoDeEstado(texto: string): Violacion[] {
  const lineas = texto.split(/\r?\n/);
  const violaciones: Violacion[] = [];

  /** ficha → líneas (1-indexadas) donde tiene casa. */
  const casasPorFicha = new Map<string, number[]>();
  /** ficha → primera línea donde se la menciona, para poder señalarla. */
  const primeraMencion = new Map<string, number>();

  let dentroDeDerivado = false;

  lineas.forEach((linea, i) => {
    const n = i + 1;

    // El bloque derivado se abre y se cierra ANTES de juzgar la línea: una
    // marca de apertura no se juzga a sí misma.
    if (ABRE_DERIVADO.test(linea)) dentroDeDerivado = true;
    if (CIERRA_DERIVADO.test(linea)) {
      dentroDeDerivado = false;
      return;
    }

    const celda = primeraCelda(linea);
    const fichasDeLaCasa = esTitulo(linea)
      ? fichasDe(linea)
      : celda !== null
        ? fichasDe(celda)
        : [];
    const esCasa = fichasDeLaCasa.length > 0;

    for (const ficha of fichasDe(linea)) {
      if (!primeraMencion.has(ficha)) primeraMencion.set(ficha, n);
    }

    if (esCasa) {
      for (const ficha of fichasDeLaCasa) {
        const previas = casasPorFicha.get(ficha) ?? [];
        previas.push(n);
        casasPorFicha.set(ficha, previas);
      }
      // I2 — toda casa lleva fecha, en su propia línea.
      if (!FECHA.test(linea)) {
        violaciones.push({
          clase: 'casa_sin_fecha',
          ficha: fichasDeLaCasa[0],
          linea: n,
          texto: recorte(linea),
        });
      }
    }

    // I3 — ningún «bloquea» fuera de una casa, salvo en bloque derivado.
    if (!esCasa && !dentroDeDerivado && BLOQUEO.test(linea)) {
      violaciones.push({
        clase: 'bloqueo_fuera_de_casa',
        linea: n,
        texto: recorte(linea),
      });
    }
  });

  // I1 — un hecho, una casa. Se resuelve al final porque necesita el documento
  // entero: una ficha declarada en la línea 400 legitima su mención en la 20.
  for (const [ficha, linea] of primeraMencion) {
    const casas = casasPorFicha.get(ficha) ?? [];
    if (casas.length === 0) {
      violaciones.push({
        clase: 'ficha_sin_casa',
        ficha,
        linea,
        texto: recorte(lineas[linea - 1] ?? ''),
      });
    } else if (casas.length > 1) {
      violaciones.push({
        clase: 'ficha_con_dos_casas',
        ficha,
        linea: casas[0],
        texto: `${ficha} declarada en ${casas.length} sitios: líneas ${casas.join(', ')}`,
      });
    }
  }

  return violaciones.sort((a, b) => a.linea - b.linea);
}

/** El reparto por clase, para que un fallo se lea sin contar a mano. */
export function repartoPorClase(
  violaciones: Violacion[],
): Record<ClaseDeViolacion, number> {
  const reparto: Record<ClaseDeViolacion, number> = {
    ficha_sin_casa: 0,
    ficha_con_dos_casas: 0,
    casa_sin_fecha: 0,
    bloqueo_fuera_de_casa: 0,
  };
  for (const v of violaciones) reparto[v.clase] += 1;
  return reparto;
}
