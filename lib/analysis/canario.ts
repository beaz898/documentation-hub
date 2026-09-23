import { EMBEDDING_MODEL, EMBEDDING_DIMENSION } from '@/lib/embeddings';

/**
 * EL CANARIO DEL MODELO DE EMBEDDINGS — F-114 P3, condiciones C6 y C7.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ QUÉ PREGUNTA CONTESTA, Y NO ES LA DEL TERMÓMETRO. El termómetro dice **qué
 * se encontró** en un análisis concreto; si un día da un salto, no dice POR QUÉ.
 * Las dos causas posibles son de naturaleza distinta y piden arreglos distintos:
 *   · **cambió el CORPUS** — entraron documentos de otro sector, otro idioma, o
 *     fragmentos degenerados;
 *   · **cambió el MODELO** — el proveedor movió `multilingual-e5-large` debajo de
 *     nosotros, y entonces las consultas nuevas se comparan contra vectores
 *     viejos.
 * El canario separa las dos: son textos FIJOS, así que su parecido sólo puede
 * moverse si se movió el modelo. «El canario sirve para atribuir la causa»
 * (F-114 P3).
 *
 * ⚠️ EL PROTOCOLO, y es lo que lo hace útil en vez de decorativo: **cuando el
 * termómetro dé un salto, lo primero es lanzar un censo con el canario.** Si el
 * canario se movió, es el modelo. Si no, es el corpus.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ DOS PAREJAS Y NO UNA, y la razón es de medición: «con una sola cifra no se
 * distingue un cambio de escala del ruido» (F-114 P3). Una pareja ALTA y una
 * BAJA dan dos puntos, así que un desplazamiento que mueva las dos en el mismo
 * sentido se distingue de una que sólo mueva una.
 *
 * ⚠️ Y LAS DOS PAREJAS COMPARTEN EL LADO IZQUIERDO (A1), a propósito: con el
 * mismo texto de referencia en las dos, la diferencia entre la alta y la baja es
 * atribuible al OTRO lado y no a dos anclas distintas moviéndose a la vez.
 *
 * ⚠️ NUNCA SE INDEXAN. Se embeben al vuelo y el coseno se calcula en local. Es
 * la regla de F-102: **lo que no debe ser candidato no se indexa**, porque una
 * exclusión hay que acertarla en cada consulta y en cada camino nuevo, y la
 * ausencia no se puede fallar. Un canario indexado sería corpus inventado
 * compitiendo con los documentos del cliente.
 *
 * ⚠️ SE MIDE EN EL CENSO, NO EN EL ANÁLISIS DEL USUARIO (F-114 P3): en el camino
 * del usuario añadiría latencia, coste y un punto de fallo, y allí el detector ya
 * existe y es el termómetro.
 *
 * ⚠️ NI UN DATO DEL CLIENTE: los tres textos son INVENTADOS, en español y en el
 * registro del corpus, y viven en este fichero. No salen de ningún documento de
 * nadie.
 */

/**
 * LOS TRES TEXTOS, LITERALES DE F-114 P3 (`F-114.md:216-218`).
 *
 * ⚠️ NO SE TOCAN UNA VEZ MEDIDOS. Cambiar una coma cambia el vector, y con él el
 * valor de referencia: el canario dejaría de comparar contra su propia historia y
 * el día que el modelo se moviera de verdad, nadie lo sabría. Si algún día hace
 * falta otro texto, entra como pareja NUEVA con su propia referencia; estos tres
 * se quedan.
 */
export const TEXTO_A1 =
  'El paciente debe presentar la tarjeta sanitaria y el documento de identidad en recepción antes de la primera consulta.';
export const TEXTO_A2 =
  'Antes de su primera cita, el paciente tiene que mostrar en recepción su tarjeta sanitaria y su DNI.';
export const TEXTO_B =
  'La temperatura de fusión del estaño es de 232 grados Celsius y se utiliza en soldadura electrónica.';

export type ClaveDePareja = 'alta' | 'baja';

export interface ParejaDelCanario {
  clave: ClaveDePareja;
  izquierda: string;
  derecha: string;
  /** Qué se espera de ella en una frase, para que la cifra se pueda leer sola. */
  que_mide: string;
}

/** La pareja ALTA es A1–A2 (lo mismo dicho de otra forma); la BAJA es A1–B. */
export const PAREJAS: readonly ParejaDelCanario[] = [
  {
    clave: 'alta',
    izquierda: TEXTO_A1,
    derecha: TEXTO_A2,
    que_mide: 'dos formas de decir lo mismo: el parecido tiene que ser alto',
  },
  {
    clave: 'baja',
    izquierda: TEXTO_A1,
    derecha: TEXTO_B,
    que_mide: 'dos temas sin relación: el parecido tiene que ser el más bajo de los dos',
  },
];

/** Los textos que hay que embeber, en el orden en que se piden. Uno por texto
 *  distinto, no uno por lado: A1 aparece en las dos parejas y se embebe UNA vez. */
export const TEXTOS_DEL_CANARIO: readonly string[] = [TEXTO_A1, TEXTO_A2, TEXTO_B];

/**
 * EL COSENO, CALCULADO AQUÍ Y NO PEDIDO A NADIE. Función pura.
 *
 * ⚠️ DEVUELVE `null` Y NO UN CERO cuando no se puede calcular —dimensiones
 * distintas, vector vacío, o norma cero—. Un cero significa «ortogonales», que es
 * un resultado legítimo y muy distinto de «no se pudo medir»: el fallo va en el
 * tipo de retorno, no disfrazado del valor del vecino.
 */
export function coseno(a: readonly number[], b: readonly number[]): number | null {
  if (a.length === 0 || a.length !== b.length) return null;

  let producto = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    producto += x * y;
    normaA += x * x;
    normaB += y * y;
  }
  if (normaA === 0 || normaB === 0) return null;

  return producto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

/** Una pareja medida dos veces seguidas, con el ruido entre las dos. */
export interface MedidaDeUnaPareja {
  clave: ClaveDePareja;
  que_mide: string;
  primera: number | null;
  segunda: number | null;
  /** `|primera − segunda|`. ⚠️ ES EL RUIDO PROPIO DEL SERVICIO, y es el número
   *  del que sale la tolerancia de alarma. `null` si falta alguna de las dos. */
  ruido: number | null;
}

export interface CanarioMedido {
  version: 1;
  /** El sello del modelo, igual que en el termómetro: pedido, servido y dimensión
   *  REAL del vector recibido. Sin él, una cifra del canario no se puede comparar
   *  con la de otro día — no se sabría si es el mismo modelo. */
  modelo: { pedido: string; servido: string | null; dimension_servida: number | null };
  /** ⚠️ `true` si el servicio devolvió otra dimensión que la declarada. */
  dimension_inesperada: boolean;
  parejas: MedidaDeUnaPareja[];
  /** `null` si se midió. Con valor, dice por qué no hay cifras. */
  motivo: string | null;
}

/** Lo que el canario necesita de quien sabe embeber: textos → vectores + sello. */
export type Embeber = (textos: string[]) => Promise<{
  vectores: number[][];
  modeloServido: string | null;
  dimensionServida: number | null;
}>;

/** El canario que no se pudo medir. Se escribe igual, con su motivo. */
export function canarioNoMedido(motivo: string): CanarioMedido {
  return {
    version: 1,
    modelo: { pedido: EMBEDDING_MODEL, servido: null, dimension_servida: null },
    dimension_inesperada: false,
    parejas: [],
    motivo,
  };
}

/**
 * MIDE LAS DOS PAREJAS, DOS VECES SEGUIDAS. No es pura: llama al servicio.
 *
 * ⚠️ DOS MEDICIONES SIEMPRE, Y ESTO ES UNA LECTURA MÍA DE C7 QUE VA MARCADA COMO
 * TAL. F-114 P3 pide medir dos veces **la primera vez**, «para conocer el ruido
 * propio del servicio». Medir dos veces SIEMPRE cuesta una llamada más de tres
 * textos cortos —nada— y da el ruido en CADA censo en vez de sólo en el primero.
 * La alternativa exigía recordar si ya se había medido alguna vez, o sea un
 * estado persistido cuyo único trabajo sería decidir si medir o no: más piezas
 * para menos dato. Si el director prefiere la letra de C7, se cambia en una línea.
 *
 * ⚠️ Y SE EMBEBE COMO `'passage'`, igual que el análisis, porque quien pasa por
 * aquí es `generateEmbeddingsConSello` —que usa `planDeEmbedding('indexacion')`—.
 * `multilingual-e5` produce vectores distintos según el prefijo: medir el canario
 * como `'query'` lo sacaría del espacio en el que vive el corpus y su cifra no
 * sería comparable con nada.
 *
 * ⚠️ NO LANZA. Un fallo del servicio de embeddings devuelve `canarioNoMedido` con
 * su motivo: el canario es un instrumento de vigilancia dentro de una herramienta
 * de administración, y tumbar un censo entero de 680 consultas porque no se pudo
 * medir un canario sería cambiar el instrumento por el termómetro que vigila.
 */
export async function medirElCanario(embeber: Embeber): Promise<CanarioMedido> {
  try {
    const primera = await embeber([...TEXTOS_DEL_CANARIO]);
    const segunda = await embeber([...TEXTOS_DEL_CANARIO]);

    const indices = new Map(TEXTOS_DEL_CANARIO.map((t, i) => [t, i]));
    const cosenoDe = (vectores: number[][], p: ParejaDelCanario): number | null => {
      const i = indices.get(p.izquierda);
      const j = indices.get(p.derecha);
      if (i === undefined || j === undefined) return null;
      const a = vectores[i];
      const b = vectores[j];
      if (!Array.isArray(a) || !Array.isArray(b)) return null;
      return coseno(a, b);
    };

    const parejas: MedidaDeUnaPareja[] = PAREJAS.map(p => {
      const uno = cosenoDe(primera.vectores, p);
      const dos = cosenoDe(segunda.vectores, p);
      return {
        clave: p.clave,
        que_mide: p.que_mide,
        primera: uno,
        segunda: dos,
        ruido: uno === null || dos === null ? null : Math.abs(uno - dos),
      };
    });

    return {
      version: 1,
      modelo: {
        pedido: EMBEDDING_MODEL,
        servido: primera.modeloServido,
        dimension_servida: primera.dimensionServida,
      },
      // ⚠️ SE COMPARA CONTRA LA CONSTANTE, no contra lo que venga: si el servicio
      // empieza a devolver otra dimensión, el coseno seguiría calculándose y
      // daría un número perfectamente creíble sobre otro espacio vectorial.
      dimension_inesperada:
        primera.dimensionServida !== null && primera.dimensionServida !== EMBEDDING_DIMENSION,
      parejas,
      motivo: null,
    };
  } catch (err) {
    return canarioNoMedido(
      `no se pudo medir el canario: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * ¿Se lee bien esta medición? El orden esperado es `alta > baja`.
 *
 * ⚠️ NO ES UNA ALARMA Y NO TIENE TOLERANCIA TODAVÍA: la tolerancia se fija
 * DESPUÉS de conocer el ruido medido (C7), y hoy el ruido no está medido. Lo que
 * sí se puede afirmar sin ninguna medición previa es el ORDEN — dos formas de
 * decir lo mismo se parecen más que dos temas sin relación—, y eso es lo que
 * comprueba esto. Si esto sale `false` en la primera medición, el instrumento
 * está mal construido y no hay nada que interpretar de sus cifras.
 */
export function elOrdenSeSostiene(m: CanarioMedido): boolean | null {
  const alta = m.parejas.find(p => p.clave === 'alta')?.primera ?? null;
  const baja = m.parejas.find(p => p.clave === 'baja')?.primera ?? null;
  if (alta === null || baja === null) return null;
  return alta > baja;
}

/**
 * LOS VALORES DE REFERENCIA — MEDIDOS EN PRODUCCIÓN EL 23/09/2026.
 *
 * C7 pedía «los de la primera medición, guardados junto al sello del modelo». Son
 * éstos, copiados literalmente de la respuesta del censo, sin redondear.
 *
 * ⚠️ EL RUIDO MEDIDO ES CERO EXACTO en las dos parejas. No «pequeño»: **cero**.
 * Las dos llamadas consecutivas al servicio devolvieron el mismo vector bit a
 * bit, así que para un texto fijo el servicio es DETERMINISTA — y eso es una
 * propiedad medida, no supuesta.
 *
 * ⚠️ Y POR ESO LA TOLERANCIA NO SALIÓ DEL RUIDO. C7 decía «la tolerancia de
 * alarma se fija después, a partir de ese ruido medido», y con ruido cero esa
 * derivación no existe: una tolerancia de 0 alarmaría ante cualquier movimiento,
 * incluido el que no significa nada.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ LA TOLERANCIA ES 0,001, Y LA DECIDIÓ EL DIRECTOR EL 23/09/2026 sobre una
 * propuesta razonada. NO es un cálculo, y por eso lleva firma y fecha: quien la
 * cambie está cambiando una decisión, no corrigiendo una cuenta.
 *
 * Las tres razones, y están enteras en `claude/Estado_Del_MVP.md` §5.85:
 *   · **tres órdenes de magnitud por encima del ruido de coma flotante
 *     plausible** (~1e-6 acumulando `float32` sobre 1024 dimensiones), así que un
 *     cambio de hardware o de tamaño de lote sin cambio de modelo NO alarma;
 *   · **dos órdenes por debajo de cualquier cambio semántico**: la separación
 *     entre la pareja alta y la baja es 0,1937, y 0,001 es el 0,5 % de ese hueco
 *     — un reentrenamiento mueve centésimas, no milésimas;
 *   · es **la cifra que Fable predijo como cota del ruido**, así que alarmamos al
 *     nivel donde él esperaba que viviera el ruido aunque el medido saliera muy
 *     por debajo. Conservador en la dirección correcta.
 *
 * ⚠️ SU CONDICIÓN DE VALIDEZ, Y SIN ELLA LA TOLERANCIA CADUCA EN SILENCIO: **0,001
 * sólo discrimina mientras el `ruido` se mantenga AL MENOS UN ORDEN DE MAGNITUD
 * por debajo.** Si algún día el `ruido` llega a **1e-4**, una deriva real de 8e-4
 * dejaría de distinguirse del ruido — y entonces la tolerancia **se REDERIVA
 * desde el ruido nuevo, no se sube a ojo**. El `ruido` viaja en cada medición
 * precisamente para que ese día se vea sin tener que adivinarlo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ NO SE TOCA NINGUNO DE ESTOS NÚMEROS SIN VOLVER A MEDIR. Son la historia
 * contra la que se compara; reescribirlos «para que cuadre» es cegar el
 * instrumento.
 */
export const REFERENCIA: {
  fecha: string;
  /** El modelo que el servicio dijo haber usado, no el que pedimos. */
  modelo: string;
  dimension: number;
  alta: number;
  baja: number;
  /** ⚠️ CERO EXACTO en las dos parejas, medido. Ver el aviso de arriba. */
  ruido_medido: number;
  /**
   * ⚠️ DECIDIDA POR EL DIRECTOR EL 23/09/2026. El tipo admite `null` a propósito:
   * es lo que hay que poner el día que se REDERIVE y hasta que haya un número
   * nuevo, para que el instrumento diga «no sé» en vez de vigilar con una cifra
   * caducada. Ver la condición de validez en la cabecera.
   */
  tolerancia: number | null;
} = {
  fecha: '2026-09-23',
  modelo: 'multilingual-e5-large',
  dimension: 1024,
  alta: 0.9787957957543013,
  baja: 0.7851197779564706,
  ruido_medido: 0,
  tolerancia: 0.001,
};

/**
 * ¿Se ha movido el canario respecto a su referencia?
 *
 * ⚠️ DEVUELVE `null` SI NO HAY TOLERANCIA, y eso es lo correcto: sin tolerancia
 * no hay pregunta que contestar, y un `false` diría «no se ha movido», que es una
 * afirmación. Desde el 23/09/2026 hay tolerancia (0,001), así que el `null` sólo
 * vuelve si alguien la retira para rederivarla — o si la medición no trajo
 * cifras.
 *
 * ⚠️ Y SI ALGÚN DÍA `ruido` DEJA DE SER CERO, ESTO NO BASTA: la tolerancia sólo
 * discrimina mientras el ruido se mantenga al menos un orden de magnitud por
 * debajo de ella. El `ruido` viaja en cada medición precisamente para que ese día
 * se vea; la condición está escrita en §5.85.
 */
export function elCanarioSeHaMovido(m: CanarioMedido): boolean | null {
  if (REFERENCIA.tolerancia === null) return null;
  const alta = m.parejas.find(p => p.clave === 'alta')?.primera ?? null;
  const baja = m.parejas.find(p => p.clave === 'baja')?.primera ?? null;
  if (alta === null || baja === null) return null;
  return (
    Math.abs(alta - REFERENCIA.alta) > REFERENCIA.tolerancia ||
    Math.abs(baja - REFERENCIA.baja) > REFERENCIA.tolerancia
  );
}
