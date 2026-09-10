/**
 * ¿ES DE QUIEN LLAMA LA RUTA QUE MANDA? — B.204, commit 1 de cuatro.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTE COMMIT CIERRA EL AGUJERO. No lo migra: lo cierra. La diferencia importa
 * porque los tres commits que vienen detrás —referencia firmada, cliente,
 * retirada del camino viejo— cambian CÓMO viaja el fichero, y ninguno de ellos
 * es lo que impide hoy que alguien lea el temporal de otro. Eso es esta función.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * QUÉ PASABA. Tres endpoints —`/api/extract-text`, `/api/ingest` y
 * `/api/analyze-v2`— cogían `storagePath` del cuerpo y lo descargaban con el
 * cliente de SERVICIO, que se salta las políticas del bucket. Autenticaban a
 * quien llamaba y no comparaban la ruta con nadie. El caro no era el primero
 * —devuelve el texto y se acaba— sino `ingest`, que se lo QUEDA: indexa en el
 * corpus de quien llama un fichero que puede no ser suyo.
 *
 * Y el caso que lo hacía caro de verdad: **un `user_id` conocido no caduca
 * cuando alguien se va de la organización.** Un ex-compañero conserva la primera
 * pieza de la ruta para siempre.
 *
 * ⚠️ LA COMPARACIÓN ES POR SEGMENTO EXACTO, NO POR PREFIJO. `startsWith` diría
 * que `abcd/x.pdf` es de `abc`, y los ids de Supabase Auth son UUID, así que
 * nadie lo notaría revisando a ojo. Se parte por `/` y se compara el primer
 * segmento entero.
 *
 * ⚠️ POR QUÉ ESTO NO ES «LA VÍA (a)» QUE LA FICHA DESCARTÓ. La ficha proponía
 * comparar la ruta *o* dejar de aceptar rutas, y el director eligió lo segundo.
 * Esto no lo sustituye: lo precede. La ruta deja de aceptarse en el commit 4, y
 * entre hoy y ese día el camino viejo sigue vivo por la ventana de lectura dual
 * — vivo, pero no abierto. Sin esta guarda, esa ventana sería el agujero
 * esperando con fecha.
 *
 * QUÉ NO CUBRE, y sigue declarado desde la ficha: las políticas RLS del bucket
 * `documents` no están en el repositorio. Si un cliente con la clave anónima
 * puede o no leer la carpeta de otro SIN pasar por nuestra API es una comprobación
 * que vive fuera y que esta función no toca.
 */

/** Por qué se rechazó. Cada uno cuenta por separado: ver `registrarRechazo`. */
export type MotivoDeRechazo =
  /** No vino ruta, o no era una cadena con contenido. */
  | 'ruta_ausente'
  /** Vino algo que no tiene la forma de una ruta nuestra. */
  | 'ruta_malformada'
  /** Bien formada y de OTRO. Es el caso que da nombre a la ficha. */
  | 'ruta_ajena';

/**
 * ⚠️ EL FALLO VA EN EL TIPO DE RETORNO, no en un `null` ni en una cadena vacía.
 * Una firma que no puede expresar «no» obliga a quien llama a inventarse un
 * valor que lo signifique, y ese valor ya significaba otra cosa aguas abajo.
 */
export type Pertenencia =
  | { ok: true; ruta: string }
  | { ok: false; motivo: MotivoDeRechazo };

/** El separador de Storage. Nuestras rutas son `<userId>/<fichero>`. */
const SEPARADOR = '/';

/**
 * LA ÚNICA IMPLEMENTACIÓN DEL CRITERIO. Los tres endpoints PREGUNTAN aquí; nadie
 * vuelve a derivar «¿de quién es esta ruta?» con sus propias reglas. Dos
 * implementaciones de esto no se mantendrían sincronizadas: se separarían, y el
 * día que se separaran las dos seguirían pareciendo correctas por su cuenta.
 *
 * Es pura a propósito —no toca red ni base— para que los dos casos que importan,
 * ruta propia y ruta ajena, se puedan ejercer en suite y en milisegundos.
 */
export function comprobarPertenencia(
  rutaCruda: unknown,
  userId: string,
): Pertenencia {
  if (typeof rutaCruda !== 'string' || rutaCruda.trim().length === 0) {
    return { ok: false, motivo: 'ruta_ausente' };
  }
  if (typeof userId !== 'string' || userId.length === 0) {
    // Sin dueño con quien comparar no se concede nada: falla cerrada.
    return { ok: false, motivo: 'ruta_ajena' };
  }

  const ruta = rutaCruda.trim();

  // Nada de travesía, rutas absolutas ni separadores de Windows: no es que sean
  // peligrosas por sí solas contra Storage, es que no son la forma que este
  // sistema produce, y lo que no reconozco no lo descargo.
  if (
    ruta.includes('..') ||
    ruta.includes('\\') ||
    ruta.startsWith(SEPARADOR) ||
    ruta.includes('//')
  ) {
    return { ok: false, motivo: 'ruta_malformada' };
  }

  const segmentos = ruta.split(SEPARADOR);
  // `<userId>/<fichero>`: dos como mínimo, y ninguno vacío. Un `<userId>` a secas
  // es una CARPETA, y descargar una carpeta no es una operación que exista aquí.
  if (segmentos.length < 2 || segmentos.some(s => s.length === 0)) {
    return { ok: false, motivo: 'ruta_malformada' };
  }

  // ⚠️ Segmento exacto, no prefijo. Ver la cabecera.
  if (segmentos[0] !== userId) {
    return { ok: false, motivo: 'ruta_ajena' };
  }

  return { ok: true, ruta };
}

/**
 * EL CONTADOR — porque sin él un 403 no se distingue de que nadie lo intentara.
 *
 * ⚠️ HOY ES UN REGISTRO, NO UNA FILA, Y ESO SE DICE AQUÍ. No hay tabla donde
 * persistir esto: `usage_logs` gobierna CUOTA —cada fila cuenta llamadas del
 * limitador, y meter rechazos ahí regalaría o cobraría llamadas—, `counters.ts`
 * es el catálogo del pipeline de análisis y se persiste colgado de un análisis,
 * y un 403 de `extract-text` no tiene análisis del que colgar.
 * Persistirlo es una tabla nueva, o sea SQL, o sea una decisión del director y
 * un paso suyo antes del push. Queda DECLARADO y CONTADO —que es el segundo de
 * los tres grados— y sin fingir que está EJERCIDO.
 *
 * ⚠️ DECIDIDO EL 10/09/2026: SE QUEDA EN LOG, Y CON SU DISPARADOR DE REVISIÓN
 * ESCRITO, que es lo que separa una razón de una excusa. Lo que lo hace
 * aceptable hoy es que **hay un solo usuario**: con uno solo, un rechazo de
 * pertenencia no significa «alguien está intentando algo», significa que **algo
 * va mal en nuestro propio cliente** — y para eso un registro basta.
 * La razón es PRESTADA, así que no lleva fecha de calendario sino condición:
 * **el día que haya más de un usuario, esto se revisa.** Ese día el mismo
 * rechazo pasa a significar otra cosa, y un significado nuevo pide un lector
 * nuevo — que es cuando toca la tabla.
 *
 * El prefijo es estable y greppable a propósito: `[PERTENENCIA]`.
 *
 * ⚠️ NO SE REGISTRA LA RUTA ENTERA. Lleva el nombre del fichero, que es dato del
 * cliente, y aquí no lo lee nadie que lo necesite. Se registra el primer
 * segmento —a quién se estaba intentando suplantar—, que es lo único con valor
 * forense, y el motivo.
 */
export function registrarRechazo(
  endpoint: string,
  motivo: MotivoDeRechazo,
  quienLlama: string,
  rutaCruda: unknown,
): void {
  const duenoReclamado =
    typeof rutaCruda === 'string' ? rutaCruda.split(SEPARADOR)[0] : '(no es cadena)';
  console.error(
    `[PERTENENCIA] rechazo | endpoint=${endpoint} | motivo=${motivo} | ` +
    `llama=${quienLlama} | dueño_reclamado=${duenoReclamado}`,
  );
}
