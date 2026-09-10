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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA CASA EXTERNA — I1 corregido el 10/09/2026.
 *
 * I1 sin esto obligaba al documento a ADOPTAR fichas que viven legítimamente en
 * otro sitio: cuatro de sus violaciones eran citas correctas a fichas con casa
 * fuera. Adoptarlas para callar el chequeo habría creado la segunda casa que I1
 * existe para impedir — el instrumento empujando justo a lo que persigue.
 *
 * LA MARCA, y NO lleva número de línea a propósito: un `fichero:línea` en prosa
 * caduca al primer commit ajeno, y el chequeo busca dentro del fichero de todos
 * modos.
 *     <!-- CASA-EXTERNA: B.198 → claude/Inventario_Caminos.md -->
 *
 * ⚠️ POR QUÉ NO ES UNA PUERTA POR LA QUE ESCAPAR DEL INVARIANTE. Tres cerrojos, y
 * lo que los hace cerrojos es que ninguno depende de la buena fe de quien marca:
 *   1 · LA MARCA SE SIGUE, NO SE CREE. La exención se concede solo si el chequeo
 *       ENCUENTRA la casa en el fichero nombrado, con el MISMO criterio
 *       (`casaDeLinea`, una sola definición de «casa» para dentro y para fuera).
 *       Una marca que apunte a un sitio sin casa es `casa_externa_ausente`: una
 *       violación nueva, no un permiso. Y si el fichero no se puede abrir,
 *       TAMPOCO concede — falla cerrada, como toda guarda cuya condición depende
 *       de una respuesta ajena.
 *   2 · NO EXIME DE LA FECHA: LA MUEVE. I2 viaja con la casa. Si la casa está
 *       fuera, la fecha se le exige allí (`casa_externa_sin_fecha`). Una ficha
 *       que quisiera escapar del presente perpetuo no gana NADA sacando su casa
 *       del documento: se lleva el requisito consigo.
 *   3 · NO PUEDE CREAR UNA SEGUNDA CASA. Casa aquí + marca = dos casas, y sale
 *       `ficha_con_dos_casas`. La marca SUSTITUYE la casa; no la duplica.
 *
 * ⚠️ EL LÍMITE, ESCRITO AQUÍ PORQUE ES PARTE DEL CONTRATO Y NO UNA NOTA AL PIE:
 * el invariante pasa a ser **«una casa en este documento o en el fichero que su
 * marca nombra»**, NO «una casa en el mundo». El chequeo no enumera todos los
 * `.md` del repositorio, y no debe: eso convertiría el archivo intocable de
 * consultas en dependencia de esta batería y podría producir violaciones que
 * nadie tiene permiso para corregir.
 * Y no es un límite teórico — se midió al estrenarlo: **B.175 tiene casa en DOS
 * documentos** (`Inventario_Caminos.md` y una fila-índice de `Plan_F103_P3.md`),
 * y con la marca apuntando al primero el chequeo ve una casa y calla sobre la
 * otra. Eso está a ficha; aquí solo se declara que ESTE chequeo no lo ve.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Las seis formas en que la forma se rompe. */
export type ClaseDeViolacion =
  /** Se la cita y no se declara en ninguna parte. */
  | 'ficha_sin_casa'
  /** Dos o más sitios la declaran: la contradicción ya es posible. */
  | 'ficha_con_dos_casas'
  /** Declarada sin fecha: presente perpetuo. */
  | 'casa_sin_fecha'
  /** Afirma o niega bloqueo fuera de una casa y fuera de un bloque derivado. */
  | 'bloqueo_fuera_de_casa'
  /** La marca manda a un fichero que no se pudo abrir, o donde no hay casa. */
  | 'casa_externa_ausente'
  /** La casa existe fuera, pero sin fecha: el presente perpetuo, mudado. */
  | 'casa_externa_sin_fecha';

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

/**
 * `<!-- CASA-EXTERNA: B.198 → claude/Inventario_Caminos.md -->`. Se acepta `->`
 * además de `→` para que la flecha no sea una trampa de teclado. La ruta va tal
 * cual, relativa a la raíz del repositorio, y SIN número de línea.
 */
const CASA_EXTERNA = /<!--\s*CASA-EXTERNA:\s*(B\.\d{1,4})\s*(?:→|->)\s*(\S+?)\s*-->/;

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
 * LAS FICHAS QUE ESTA LÍNEA DECLARA, o vacío si la línea no es una casa.
 *
 * ⚠️ UNA SOLA DEFINICIÓN DE «CASA», y por eso está extraída: la usa el documento
 * propio y la usa el fichero que una marca nombra. Dos implementaciones de esto
 * se separarían el día que alguien tocara una, y las dos seguirían pareciendo
 * correctas por su cuenta.
 */
function casaDeLinea(linea: string): string[] {
  if (esTitulo(linea)) return fichasDe(linea);
  const celda = primeraCelda(linea);
  return celda !== null ? fichasDe(celda) : [];
}

/** Una marca leída: qué ficha manda fuera, a qué fichero, y desde qué línea. */
interface Marca {
  ficha: string;
  ruta: string;
  /** Línea de la marca, para poder señalarla el día que mienta. */
  linea: number;
}

function marcasDe(texto: string): Marca[] {
  const marcas: Marca[] = [];
  texto.split(/\r?\n/).forEach((linea, i) => {
    const m = CASA_EXTERNA.exec(linea);
    if (m) marcas.push({ ficha: m[1], ruta: m[2], linea: i + 1 });
  });
  return marcas;
}

/**
 * LAS RUTAS QUE LAS MARCAS DE ESTE TEXTO NOMBRAN, sin repetir.
 *
 * Existe para que quien lee del disco sepa QUÉ abrir sin volver a interpretar la
 * marca por su cuenta: el que necesita el criterio PREGUNTA a quien lo decidió
 * en vez de derivarlo otra vez con sus propias reglas.
 */
export function rutasDeCasasExternas(texto: string): string[] {
  const rutas: string[] = [];
  for (const m of marcasDe(texto)) if (!rutas.includes(m.ruta)) rutas.push(m.ruta);
  return rutas;
}

/** Lo que el chequeo encuentra al SEGUIR una marca. Ningún caso es «pasa». */
type Seguimiento =
  | { estado: 'sin_fichero' }
  | { estado: 'sin_casa' }
  | { estado: 'casa'; lineas: number[]; sinFecha: boolean };

/**
 * ABRE EL FICHERO QUE LA MARCA NOMBRA Y BUSCA LA CASA DENTRO — el cerrojo 1.
 *
 * ⚠️ Si el texto no está en el mapa —nadie lo leyó, la ruta no existe, se borró
 * el fichero— NO concede: `sin_fichero` es violación, no silencio. Una guarda
 * que depende de una respuesta ajena falla CERRADA.
 */
function seguirMarca(m: Marca, externos: ReadonlyMap<string, string>): Seguimiento {
  const texto = externos.get(m.ruta);
  if (texto === undefined) return { estado: 'sin_fichero' };

  const lineas: number[] = [];
  let sinFecha = false;
  texto.split(/\r?\n/).forEach((linea, i) => {
    if (casaDeLinea(linea).includes(m.ficha)) {
      lineas.push(i + 1);
      if (!FECHA.test(linea)) sinFecha = true;
    }
  });

  if (lineas.length === 0) return { estado: 'sin_casa' };
  return { estado: 'casa', lineas, sinFecha };
}

/**
 * EL CHEQUEO. Función pura sobre el texto: quien lo lee del disco es el test,
 * no esto — así el criterio se puede ejercer sobre documentos sintéticos, que
 * es la única forma de saber que sabe disparar.
 */
export function invariantesDelDocumentoDeEstado(
  texto: string,
  /**
   * ruta → contenido, para los ficheros que las marcas nombran. Se INYECTA en
   * vez de leerse aquí para que la función siga siendo pura y se pueda ejercer
   * contra documentos sintéticos — incluida una marca que miente.
   * ⚠️ El defecto vacío falla CERRADO: llamarla sin mapa sobre un documento con
   * marcas da violaciones, no silencio.
   */
  documentosExternos: ReadonlyMap<string, string> = new Map(),
): Violacion[] {
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

    const fichasDeLaCasa = casaDeLinea(linea);
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
  // Y desde el 10/09/2026 la casa puede estar FUERA: la marca se sigue.
  const marcasPorFicha = new Map<string, Marca[]>();
  for (const m of marcasDe(texto)) {
    marcasPorFicha.set(m.ficha, [...(marcasPorFicha.get(m.ficha) ?? []), m]);
  }

  for (const [ficha, linea] of primeraMencion) {
    const casas = casasPorFicha.get(ficha) ?? [];
    /** Cuántas casas le encuentra el chequeo FUERA, siguiendo sus marcas. */
    let externas = 0;
    const donde: string[] = casas.map(l => `línea ${l}`);

    for (const m of marcasPorFicha.get(ficha) ?? []) {
      const hallado = seguirMarca(m, documentosExternos);
      if (hallado.estado === 'sin_fichero') {
        violaciones.push({
          clase: 'casa_externa_ausente',
          ficha,
          linea: m.linea,
          texto: `la marca manda a ${m.ruta} y el chequeo no pudo abrirlo: no concede`,
        });
      } else if (hallado.estado === 'sin_casa') {
        violaciones.push({
          clase: 'casa_externa_ausente',
          ficha,
          linea: m.linea,
          texto: `la marca manda a ${m.ruta} y ahí ${ficha} no tiene casa`,
        });
      } else {
        externas += hallado.lineas.length;
        donde.push(`${m.ruta}:${hallado.lineas.join(',')}`);
        // Cerrojo 2 — la marca MUEVE la fecha, no la perdona.
        if (hallado.sinFecha) {
          violaciones.push({
            clase: 'casa_externa_sin_fecha',
            ficha,
            linea: m.linea,
            texto: `su casa en ${m.ruta} (línea ${hallado.lineas[0]}) no lleva fecha`,
          });
        }
      }
    }

    const total = casas.length + externas;
    if (total === 0) {
      violaciones.push({
        clase: 'ficha_sin_casa',
        ficha,
        linea,
        texto: recorte(lineas[linea - 1] ?? ''),
      });
    } else if (total > 1) {
      // Cerrojo 3 — dentro o fuera, dos casas son dos casas.
      violaciones.push({
        clase: 'ficha_con_dos_casas',
        ficha,
        linea: casas[0] ?? linea,
        texto: `${ficha} declarada en ${total} sitios: ${donde.join(' · ')}`,
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
    casa_externa_ausente: 0,
    casa_externa_sin_fecha: 0,
  };
  for (const v of violaciones) reparto[v.clase] += 1;
  return reparto;
}
