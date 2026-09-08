/**
 * EL BUCLE DEL LOTE — pulsar hasta que no quede nada (B.199).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ POR QUÉ ESTO VIVE EN `lib/` Y NO DENTRO DE LA PÁGINA. `LIMITE_POR_LLAMADA`
 * vale 8: una llamada al lote repara como mucho ocho documentos y devuelve
 * `hay_mas: true` si quedan. **Una versión ingenua pulsa una vez, ve ocho
 * reparados y PARECE que terminó.** Ése es el único fallo silencioso de toda
 * esta pantalla —lo demás se ve— y por eso es lo único que se saca a una
 * función pura con batería propia. La pantalla se verifica a ojo; esto no.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ UN DOCUMENTO QUE FALLA NO PARA NADA. El servidor ya sigue con los demás y
 * los reparte en `reparados` / `bloqueados` / `fallidos`; aquí se acumulan y se
 * declaran al final. Bloquear a los buenos por uno malo sería justo lo
 * contrario de para qué existe el lote.
 *
 * ⚠️ LAS CUATRO SALIDAS, y las tres últimas existen porque `hay_mas` viene del
 * servidor y este bucle no puede confiar en que baje solo:
 *
 *   · `completo`     — `hay_mas: false`. No queda nada. Es el final bueno.
 *   · `tope`         — se alcanzó el máximo de rondas. Sin esto, un `hay_mas`
 *                      que nunca baja es un bucle infinito en el navegador del
 *                      cliente.
 *   · `sin_progreso` — una ronda dijo `hay_mas` y no reparó NADA. Repetir no lo
 *                      va a arreglar: lo que queda está bloqueado o falla, y
 *                      seguir pulsando es girar en el sitio gastando tiempo.
 *   · `error`        — la llamada no contestó. Se devuelve lo acumulado hasta
 *                      ahí, que es información y no ruido: ocho reparados y un
 *                      corte se lee distinto de cero reparados y un corte.
 */

/** Lo que este bucle necesita de una respuesta del lote. Nada más. */
export interface RondaDelLote {
  reparados: number;
  bloqueados: number;
  fallidos: number;
  /** ⚠️ LA ÚNICA CLAVE PARA «¿VUELVO A PULSAR?» — el endpoint la devuelve así a
   *  propósito: dos formas del mismo dato es la manera de que el cliente lea la
   *  que se quede vieja. */
  hay_mas: boolean;
  para_reintentar?: number;
  sin_examinar?: number;
  truncado?: boolean;
}

export type MotivoDeCierre = 'completo' | 'tope' | 'sin_progreso' | 'error';

export interface ResultadoDelBucle {
  rondas: number;
  reparados: number;
  bloqueados: number;
  fallidos: number;
  quedan: number;
  motivo: MotivoDeCierre;
  /** Presente solo con `motivo: 'error'`. */
  error?: string;
  /** Si alguna ronda dijo que el censo era una MUESTRA, se propaga: la cifra de
   *  arriba describe lo que se miró, no el corpus. */
  truncado: boolean;
}

/** Tope de rondas. 25 × 8 = 200 documentos, muy por encima de cualquier corpus
 *  que este producto atienda hoy; y si alguna vez se alcanza, el motivo lo dice
 *  en vez de dejar la pestaña girando. */
export const MAXIMO_DE_RONDAS = 25;

export interface OpcionesDelBucle {
  /** Se llama entre rondas con lo acumulado, para que la pantalla lo pinte. */
  alAvanzar?: (parcial: ResultadoDelBucle) => void;
  /** ¿Ha pedido el usuario parar? Se consulta ANTES de cada ronda. */
  cancelado?: () => boolean;
  maximoDeRondas?: number;
}

/**
 * Pulsa el lote hasta que no quede nada.
 *
 * `llamada` es lo único que toca la red; se recibe como parámetro para que esta
 * función sea pura y su batería no necesite ni corpus ni servidor.
 */
export async function recorrerElLote(
  llamada: () => Promise<RondaDelLote>,
  opciones: OpcionesDelBucle = {},
): Promise<ResultadoDelBucle> {
  const maximo = opciones.maximoDeRondas ?? MAXIMO_DE_RONDAS;

  const acumulado: ResultadoDelBucle = {
    rondas: 0, reparados: 0, bloqueados: 0, fallidos: 0,
    quedan: 0, motivo: 'completo', truncado: false,
  };

  while (acumulado.rondas < maximo) {
    // ⚠️ SE PREGUNTA ANTES DE LLAMAR, no después: parar después de haber pedido
    // otra ronda no para nada, solo esconde su resultado.
    if (opciones.cancelado?.()) {
      acumulado.motivo = 'sin_progreso';
      return acumulado;
    }

    let ronda: RondaDelLote;
    try {
      ronda = await llamada();
    } catch (err) {
      acumulado.motivo = 'error';
      acumulado.error = err instanceof Error ? err.message : String(err);
      return acumulado;
    }

    acumulado.rondas++;
    acumulado.reparados += ronda.reparados;
    acumulado.bloqueados += ronda.bloqueados;
    acumulado.fallidos += ronda.fallidos;
    acumulado.quedan = (ronda.para_reintentar ?? 0) + (ronda.sin_examinar ?? 0);
    if (ronda.truncado) acumulado.truncado = true;

    if (!ronda.hay_mas) {
      acumulado.motivo = 'completo';
      return acumulado;
    }

    // ⚠️ DICE QUE QUEDAN Y NO HA REPARADO NINGUNO. Lo que queda esta bloqueado o
    // falla; pulsar otra vez da exactamente lo mismo. Se corta y se dice.
    if (ronda.reparados === 0) {
      acumulado.motivo = 'sin_progreso';
      return acumulado;
    }

    opciones.alAvanzar?.({ ...acumulado });
  }

  acumulado.motivo = 'tope';
  return acumulado;
}
