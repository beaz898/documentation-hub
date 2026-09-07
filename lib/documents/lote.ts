import type { ResultadoDeReparacion } from './reparar';

/**
 * EL REPARTO DEL CUPO DE UN LOTE DE REPARACIÓN — la parte que decide, aparte de
 * la que hace.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ SOLO UN INTENTO REAL GASTA CUPO. Ésta es la regla entera del módulo, y sin
 * ella **el lote no converge**: la lista de candidatos va ordenada, así que si
 * los ocho primeros son rechazables —un `.xlsx` sin original, uno de la nube que
 * responde 501— cada llamada devolvería los mismos ocho rechazos, cero
 * reparaciones, y el usuario pulsaría para siempre sin llegar nunca a los
 * buenos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Un rechazo se clasifica y se sigue caminando; un intento —salga bien o mal—
 * consume una plaza, porque lo que la plaza mide es TIEMPO GASTADO, no éxito.
 * Un fallo cuesta lo mismo que un acierto, y a veces más.
 *
 * ⚠️ Y POR QUÉ ESTE MÓDULO EXISTE SEPARADO DE LA RUTA: porque esto es lo único
 * del lote que se puede comprobar. La ruta habla con Supabase y con Pinecone y
 * queda fuera del alcance de la batería (nada de mocks); el reparto del cupo es
 * aritmética pura y se prueba entera. Si la decisión viviera dentro del bucle,
 * el lote sería código sin una sola forma de verificarlo.
 */

/** Reparaciones de verdad por llamada. Lo pidió el usuario: ocho, con margen. */
export const LIMITE_POR_LLAMADA = 8;

/**
 * ⚠️ ESTO ES UNA ESTIMACIÓN, NO UNA MEDIDA, y va dicho aquí porque el día que se
 * mida hay que volver a esta línea.
 *
 * La función tiene 300 s (`maxDuration`). Este presupuesto es el momento a
 * partir del cual **no se EMPIEZA** una reparación nueva; la que ya está en
 * vuelo no se puede interrumpir, así que los 120 s restantes son su margen.
 *
 * No se sabe cuánto tarda una reparación: no se ha completado ninguna en
 * producción. Lo que se sabe es el peor caso conocido de una de sus partes —la
 * política de reintentos de embeddings gasta **61 s solo en esperas por lote de
 * 20 trozos** ante un 429 sostenido—, y de ahí sale el margen: cabe una espera
 * larga sin que la plataforma corte a media conmutación.
 *
 * `parada: 'tiempo'` es su contador. Si empieza a aparecer, el margen se queda
 * corto y hay que bajar el límite, no subir el presupuesto.
 */
export const PRESUPUESTO_PARA_EMPEZAR_MS = 180_000;

/**
 * Cuántos candidatos se llegan a MIRAR como mucho. Caminar por encima de un
 * rechazo no es gratis: cuesta un par de consultas. Sin este tope, un corpus
 * grande lleno de rechazables se pasaría la función entera clasificando.
 */
export const EXAMINADOS_MAXIMO = 60;

export type MotivoDeParada =
  /** Se gastaron las plazas: quedan reparaciones y hay que volver a pulsar. */
  | 'limite'
  /** No queda tiempo para empezar otra con margen. */
  | 'tiempo'
  /** Se miraron demasiados candidatos sin agotar las plazas. */
  | 'examen'
  /** Se acabaron los candidatos: no queda nada que intentar. */
  | 'corpus';

export interface EstadoDelLote {
  /** Intentos consumidos (aciertos + fallos), NO documentos mirados. */
  intentos: number;
  /** Candidatos mirados, rechazos incluidos. */
  examinados: number;
  transcurridoMs: number;
}

export interface LimitesDelLote {
  limite: number;
  presupuestoMs: number;
  maximoExaminados: number;
}

/**
 * ⚠️ EL ORDEN DE LAS GUARDAS ES PARTE DEL CRITERIO. `limite` va primero porque
 * es el único motivo de parada que el usuario PIDIÓ: si se han hecho las ocho,
 * eso es lo que hay que decirle, aunque además se hubiera acabado el tiempo. Los
 * otros dos son avisos de que algo no cabe, y merecen no quedar tapados por el
 * caso normal.
 */
export function decidirContinuacion(
  estado: EstadoDelLote,
  limites: LimitesDelLote,
): { seguir: true } | { seguir: false; motivo: MotivoDeParada } {
  if (estado.intentos >= limites.limite) return { seguir: false, motivo: 'limite' };
  if (estado.transcurridoMs >= limites.presupuestoMs) return { seguir: false, motivo: 'tiempo' };
  if (estado.examinados >= limites.maximoExaminados) return { seguir: false, motivo: 'examen' };
  return { seguir: true };
}

export type CuboDelLote = 'reparado' | 'bloqueado' | 'fallido';

/**
 * En qué cubo cae un resultado. Tres y no dos, y la diferencia entre los dos
 * últimos es la que le importa a quien lea el informe:
 *
 *   · BLOQUEADO — el sistema decidió no intentarlo, y sabe por qué. Volverá a
 *     salir igual mañana: no es un incidente, es el censo.
 *   · FALLIDO — se intentó y se rompió. Eso sí es un incidente, y merece que
 *     alguien lo mire.
 */
export function cuboDe(resultado: ResultadoDeReparacion): CuboDelLote {
  if (resultado.ok) return 'reparado';
  return resultado.clase === 'fallo' ? 'fallido' : 'bloqueado';
}

/**
 * CÓMO SE LLAMA UN BLOQUEO CUANDO SE LE ENSEÑA AL USUARIO.
 *
 * Está aquí y no en el bucle porque es un criterio, no un formateo: el nombre
 * que sale en la lista es lo que le dice a alguien qué hacer con ese documento
 * —`sin_original_con_tablas` significa «resúbelo», `reprocesar_no_implementado`
 * significa «esta vía no existe todavía»—. Y aquí se puede comprobar.
 *
 * ⚠️ `no_bloqueado` NO ES UN VALOR QUE SE ESPERE VER: significa que alguien ha
 * preguntado el motivo de un resultado que no estaba bloqueado. Se devuelve en
 * vez de reventar para no tumbar un lote por un error de clasificación, pero si
 * aparece en una respuesta es un fallo nuestro y hay que mirarlo.
 */
export function motivoDeBloqueo(resultado: ResultadoDeReparacion): string {
  if (resultado.ok) return 'no_bloqueado';
  if (resultado.clase === 'rechazado') return resultado.motivo;
  if (resultado.clase === 'no_implementado') return 'reprocesar_no_implementado';
  if (resultado.clase === 'no_encontrado') return 'no_encontrado';
  return 'no_bloqueado';
}

/**
 * ¿GASTA PLAZA? La regla del módulo, en una función para que nadie la reescriba
 * en el bucle.
 *
 * ⚠️ UN FALLO SÍ GASTA, y no es un descuido: la plaza mide TIEMPO, no éxito. Una
 * reparación que revienta después de generar los embeddings ha gastado el rato
 * igual —o más—. Contarla gratis dejaría a un documento roto capaz de consumir
 * la función entera a base de fallar barato.
 */
export function gastaPlaza(resultado: ResultadoDeReparacion): boolean {
  return cuboDe(resultado) !== 'bloqueado';
}

/**
 * ⚠️ CUÁNTOS QUEDAN, SIN MENTIR — que es la cifra por la que el usuario pidió el
 * lote: «que diga cuántos quedan, para saber cuándo parar».
 *
 * Son TRES números y no uno, porque «lo que queda» tiene mitades que se
 * comportan al revés:
 *
 *   · `paraReintentar` — los que fallaron. Se vuelven a intentar en la próxima
 *     llamada, así que cuentan como pendientes.
 *   · `sinExaminar` — los que esta llamada ni miró. Su composición es DESCONOCIDA:
 *     alguno saldrá bloqueado. Por eso va aparte y no sumado a nada.
 *   · `bloqueados` — **no bajan pulsando el botón**. Necesitan otra cosa: una
 *     resubida, o la vía de reprocesado que no existe. Sumarlos a los pendientes
 *     daría un contador que nunca llega a cero y un botón que nunca termina.
 *
 * ⚠️ Y `examinados` NO SE RECIBE, SE DERIVA. Recibirlo dejaría entrar un
 * desacuerdo entre dos cuentas de lo mismo —la del bucle y la de los cubos— y
 * ese desacuerdo saldría como una cifra plausible en vez de como un error. Todo
 * documento mirado cae en exactamente un cubo: esa es la definición, y aquí es
 * la fórmula.
 */
export interface Restantes {
  paraReintentar: number;
  sinExaminar: number;
  bloqueados: number;
  /** ¿Tiene sentido volver a pulsar? Es lo único que hay que mirar para decidir. */
  hayMas: boolean;
}

export function restantesDelLote(entrada: {
  candidatos: number;
  reparados: number;
  fallidos: number;
  bloqueados: number;
}): Restantes {
  const examinados = entrada.reparados + entrada.fallidos + entrada.bloqueados;
  const sinExaminar = Math.max(0, entrada.candidatos - examinados);

  return {
    paraReintentar: entrada.fallidos,
    sinExaminar,
    bloqueados: entrada.bloqueados,
    hayMas: entrada.fallidos + sinExaminar > 0,
  };
}
