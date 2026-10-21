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
  /** Milisegundos de reloj de esta petición: de antes del `fetch` a tener el cuerpo leído. Sin las esperas entre intentos. */
  latenciaMs: number;
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
  fueraDelDetalle: null | { peticiones: number; tokens: CuatroCifras; latenciaMs: number };
}

const contexto = new AsyncLocalStorage<RegistroDeLlamadas>();

function registroVacio(): RegistroDeLlamadas {
  return { peticiones: [], sinEtapa: 0, fueraDelDetalle: null };
}

/** Abre un registro para todo lo que corra dentro de `fn`, y lo devuelve junto al resultado. */
export async function conRegistroDeLlamadas<T>(fn: () => Promise<T>): Promise<{ resultado: T; registro: RegistroDeLlamadas }> {
  const registro = registroVacio();
  const resultado = await contexto.run(registro, fn);
  return { resultado, registro };
}

/** Lo que el cliente sabe de la llamada antes de mandarla. Ningún campo lleva contenido. */
export interface DatosDeLaLlamada { etiqueta?: EtiquetaDeLlamada; modelo: string; vuelta: number; entradaEstimada?: number }

/** Apunta una petición real en el registro abierto, si lo hay. Nunca lanza. */
export function apuntarPeticion(
  datos: DatosDeLaLlamada,
  peticion: { intento: number; resultado: PeticionRegistrada['resultado']; estadoHttp?: number; latenciaMs: number; tokens: CuatroCifras },
): void {
  const registro = contexto.getStore();
  if (!registro) return;
  // la llamada sin etiqueta se cuenta una vez, en su primera petición
  if (!datos.etiqueta && datos.vuelta === 1 && peticion.intento === 1) registro.sinEtapa++;
  const total = registro.peticiones.length + (registro.fueraDelDetalle?.peticiones ?? 0);
  if (total >= TOPE_DE_PETICIONES_CON_DETALLE) {
    const f = registro.fueraDelDetalle ?? { peticiones: 0, tokens: { entrada: 0, salida: 0, escrituraCache: 0, lecturaCache: 0 }, latenciaMs: 0 };
    f.peticiones++;
    f.tokens.entrada += peticion.tokens.entrada; f.tokens.salida += peticion.tokens.salida;
    f.tokens.escrituraCache += peticion.tokens.escrituraCache; f.tokens.lecturaCache += peticion.tokens.lecturaCache;
    f.latenciaMs += peticion.latenciaMs;
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
    tokens: { ...peticion.tokens },
    ...(datos.entradaEstimada !== undefined ? { entradaEstimada: datos.entradaEstimada } : {}),
  });
}
