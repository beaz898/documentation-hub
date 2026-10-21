import { AsyncLocalStorage } from 'async_hooks';

/**
 * EL REGISTRO POR LLAMADA AL MODELO — 3.1.1 del estado vivo, paso 2 (21/10/2026).
 *
 * Una entrada por PETICIÓN REAL a la API: cada intento de `callAnthropicRaw` es una, con su número
 * de intento dentro, y la repetición por JSON mal formado de `callAnthropicJson` es otra «vuelta».
 * Es la unidad que mide lo que cuestan los reintentos (decidido por el arquitecto el 20/10).
 *
 * ⚠️ AQUÍ NO VA NI UNA PALABRA DEL CONTENIDO. Ni el prompt, ni la respuesta, ni las citas, ni nada
 * del documento del cliente: sólo la etapa, el modelo, las cuatro cifras de tokens, la latencia, el
 * intento y el resultado. Es la regla de los datos del cliente del proyecto («se persisten donde se
 * MUESTRAN, y se envían a un modelo sólo donde DECIDEN»), y la tentación de meter «sólo un trozo
 * para depurar» aparece justo cuando se está depurando. La `pareja` es un IDENTIFICADOR de
 * documento, nunca su nombre ni su texto. `registro-de-llamadas.test.ts` lo vigila: el registro de
 * una petición con un prompt marcado no puede contener la marca.
 *
 * ⚠️ VA AL LADO DE LA SUMA POR MODELO, NO EN SU LUGAR. `usage-context.ts` y `llm_usage` siguen
 * exactamente igual: si este detalle se rompe, el coste por análisis que se viene midiendo
 * (`SQL_F127_02`) tiene que seguir saliendo igual.
 *
 * ⚠️ LA ESPERA ESTÁ PARA QUE LA SUMA RECONSTRUYA EL RELOJ DE PARED (arquitecto, 21/10). Cada entrada
 * lleva `esperaMs` —lo que pasó entre el comienzo de esa petición y su `fetch`: el limitador de cuota
 * en la primera de una llamada JSON, el backoff de 2, 5, 10… s entre intentos, y la pausa de 1,5 s antes
 * de la vuelta 2— y `latenciaMs`, la de la petición. **El reloj de pared de UNA llamada es la suma de
 * `esperaMs + latenciaMs` de sus entradas.** Sin la espera, un análisis que tarda 43 s con 17 de backoff
 * saldría «rápido» en el medidor, que es justo la deuda del 19/10 (la latencia del juez con Haiku 5.5
 * subió de 19 a 31-43 s y no se sabe de dónde sale).
 * ⚠️ Y LO QUE LA SUMA NO DA: el reloj de pared de un ANÁLISIS. Sus llamadas no van en fila —el juez y el
 * verificador de cinco en cinco (`JUDGE_CONCURRENCY`, `VERIFY_CONCURRENCY`), el estilo a la vez que todo
 * lo demás—, así que sumar las entradas de un análisis da el trabajo, no la duración. Para la duración
 * está `comienzoMs`, los milisegundos desde que se abrió el registro hasta el comienzo de la petición: el
 * análisis dura lo que va del primer comienzo al último `comienzoMs + esperaMs + latenciaMs`.
 *
 * Sin un registro abierto (`conRegistroDeLlamadas`), `apuntarPeticion` no hace nada. En el paso 2
 * no lo abre nadie fuera de las pruebas; abrirlo y guardarlo en el análisis es el paso 4.
 *
 * LA GUARDA: 200 peticiones con detalle (arquitecto, 20/10). Con la fórmula del censo, un exhaustivo
 * hace hoy como mucho unas 57 llamadas, ~114 peticiones si todas repitieran por JSON mal formado, así
 * que la guarda no puede saltar hoy: existe para que el dato no se infle en silencio el día que
 * alguien multiplique las llamadas. Si salta, las 200 primeras quedan con detalle y el resto se
 * AGREGA en `fueraDelDetalle`, que lo dice en el propio dato.
 */
export const TOPE_DE_PETICIONES_CON_DETALLE = 200;

/** La etapa del análisis (o de otra operación) que hizo la llamada. Sin etiqueta, `sin_etapa`. */
export type EtapaDeLlamada =
  | 'rerank' | 'juez' | 'verificador' | 'double_check' | 'sintesis' | 'estilo'
  | 'chat' | 'mejora' | 'agente' | 'sin_etapa';

export interface EtiquetaDeLlamada {
  etapa: EtapaDeLlamada;
  /** El documentId del candidato, en las llamadas que son de una pareja (el juez). Un id, nunca un nombre. */
  pareja?: string;
}

export interface CuatroCifras { entrada: number; salida: number; escrituraCache: number; lecturaCache: number }

export interface PeticionRegistrada {
  /** Orden de la petición dentro del registro, desde 1. */
  n: number;
  etapa: EtapaDeLlamada;
  pareja?: string;
  modelo: string;
  /** 1 la primera; 2 la repetición de `callAnthropicJson` por JSON mal formado. */
  vuelta: number;
  /** El intento de red dentro de la vuelta, desde 1 (`callAnthropicRaw` hace hasta cinco). */
  intento: number;
  /** 'ok': la API contestó 200. 'http': contestó otra cosa (ver `estadoHttp`). 'red': no llegó a contestar. */
  resultado: 'ok' | 'http' | 'red';
  estadoHttp?: number;
  /** Milisegundos de reloj de esta petición: de antes del `fetch` a tener el cuerpo leído. */
  latenciaMs: number;
  /** Lo que se esperó ANTES de esta petición: el limitador, el backoff entre intentos o la pausa antes de la vuelta 2. 0 si nada. */
  esperaMs: number;
  /** Milisegundos desde que se abrió el registro hasta el comienzo de esta petición (el de su espera). */
  comienzoMs: number;
  /** Las cuatro cifras que devuelve la API. Cero si la petición no tuvo éxito. */
  tokens: CuatroCifras;
  /** La estimación de entrada del limitador (la longitud del payload entre 4), donde se calcula: para compararla. */
  entradaEstimada?: number;
}

export interface RegistroDeLlamadas {
  peticiones: PeticionRegistrada[];
  /** Llamadas que llegaron sin etiqueta de etapa. Un contador, no un silencio. */
  sinEtapa: number;
  /** null mientras no se pase la guarda; si se pasa, lo agregado de lo que quedó fuera del detalle. */
  fueraDelDetalle: null | { peticiones: number; tokens: CuatroCifras; latenciaMs: number; esperaMs: number };
}

/** El registro y el instante en que se abrió, que no viaja con el dato: `comienzoMs` se cuenta desde él. */
const contexto = new AsyncLocalStorage<{ registro: RegistroDeLlamadas; abiertoEn: number }>();

function registroVacio(): RegistroDeLlamadas {
  return { peticiones: [], sinEtapa: 0, fueraDelDetalle: null };
}

/** Abre un registro para todo lo que corra dentro de `fn`, y lo devuelve junto al resultado. */
export async function conRegistroDeLlamadas<T>(fn: () => Promise<T>): Promise<{ resultado: T; registro: RegistroDeLlamadas }> {
  const registro = registroVacio();
  const resultado = await contexto.run({ registro, abiertoEn: Date.now() }, fn);
  return { resultado, registro };
}

/** Lo que el cliente sabe de la llamada antes de mandarla. Ningún campo lleva contenido. */
export interface DatosDeLaLlamada {
  etiqueta?: EtiquetaDeLlamada; modelo: string; vuelta: number; entradaEstimada?: number;
  /** Lo esperado antes del primer intento de esta vuelta (el limitador, o la pausa de la vuelta 2), y cuándo empezó. */
  esperaAntesMs?: number; comienzoDeLaEspera?: number;
}

/** Apunta una petición real en el registro abierto, si lo hay. Nunca lanza. */
export function apuntarPeticion(
  datos: DatosDeLaLlamada,
  peticion: { intento: number; resultado: PeticionRegistrada['resultado']; estadoHttp?: number; latenciaMs: number; tokens: CuatroCifras;
    esperaMs: number; comienzo: number },
): void {
  const abierto = contexto.getStore();
  if (!abierto) return;
  const { registro } = abierto;
  // la llamada sin etiqueta se cuenta una vez, en su primera petición
  if (!datos.etiqueta && datos.vuelta === 1 && peticion.intento === 1) registro.sinEtapa++;
  const total = registro.peticiones.length + (registro.fueraDelDetalle?.peticiones ?? 0);
  if (total >= TOPE_DE_PETICIONES_CON_DETALLE) {
    const f = registro.fueraDelDetalle ?? { peticiones: 0, tokens: { entrada: 0, salida: 0, escrituraCache: 0, lecturaCache: 0 }, latenciaMs: 0, esperaMs: 0 };
    f.peticiones++;
    f.tokens.entrada += peticion.tokens.entrada; f.tokens.salida += peticion.tokens.salida;
    f.tokens.escrituraCache += peticion.tokens.escrituraCache; f.tokens.lecturaCache += peticion.tokens.lecturaCache;
    f.latenciaMs += peticion.latenciaMs;
    f.esperaMs += peticion.esperaMs;
    registro.fueraDelDetalle = f;
    return;
  }
  registro.peticiones.push({
    n: total + 1,
    etapa: datos.etiqueta?.etapa ?? 'sin_etapa',
    ...(datos.etiqueta?.pareja ? { pareja: datos.etiqueta.pareja } : {}),
    modelo: datos.modelo,
    vuelta: datos.vuelta,
    intento: peticion.intento,
    resultado: peticion.resultado,
    ...(peticion.estadoHttp !== undefined ? { estadoHttp: peticion.estadoHttp } : {}),
    latenciaMs: peticion.latenciaMs,
    esperaMs: peticion.esperaMs,
    comienzoMs: peticion.comienzo - abierto.abiertoEn,
    tokens: { ...peticion.tokens },
    ...(datos.entradaEstimada !== undefined ? { entradaEstimada: datos.entradaEstimada } : {}),
  });
}
