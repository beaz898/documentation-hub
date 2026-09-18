/**
 * EL AVISO DE CORPUS CAMBIADO — B.221, 18/09/2026.
 *
 * ⚠️ QUÉ PROBLEMA RESUELVE, medido en pantalla el 14/09: tras reemplazar un
 * documento, el chat siguió devolviendo el texto anterior ENTERO. El mecanismo no
 * es el corpus —la recuperación es fresca en cada turno— sino el HISTORIAL: el
 * cliente manda los últimos 6 mensajes (`useChat.ts`), y las respuestas
 * anteriores del asistente **contienen el texto que citaron entonces**, así que
 * el contenido viejo vuelve a entrar por la puerta de la conversación. Pasa igual
 * con documentos BORRADOS: contenido retirado a propósito sobrevive en la sesión.
 *
 * ⚠️ Y B.225 NO LO CUBRE, aunque lo parezca: aquella guarda filtra la
 * RECUPERACIÓN (`rag.ts`, los `vivos`). Esto no entra por ahí.
 *
 * LO QUE SE HACE AQUÍ, Y LO QUE NO. No se borra nada —borrar la conversación
 * sería peor que el problema— y no se toca cuánto historial se manda al modelo.
 * Se DICE. El usuario tiene la salida en la mano («Limpiar chat»), y hasta hoy
 * nadie se la nombraba.
 *
 * ⚠️ EL LÍMITE, DECLARADO Y NO DESCUIDO: el aviso sale cuando el corpus cambia y
 * hay conversación abierta, **sin comprobar si la respuesta anterior citaba justo
 * ese documento**. Así que puede salir cuando no hacía falta. La alternativa
 * —cruzar lo que cambió con lo que se citó— se descartó con su razón: `sources`
 * viaja por NOMBRE y no por id (`hooks/chat/types.ts`), y un reemplazo CAMBIA el
 * nombre (B.218). Ese cruce fallaría precisamente al reemplazar, que es el caso
 * más frecuente. Para hacerlo bien haría falta que `sources` llevara ids, y eso
 * es otra pieza.
 *
 * ⚠️ Y POR ESO EL TEXTO DICE «PUEDE», NO «CITA»: el sistema no sabe si la
 * respuesta anterior citaba lo que cambió. Afirmarlo sería una causa no medida,
 * que es lo que §5.66 prohíbe. Un mensaje puede afirmar QUÉ pasó; la causa, sólo
 * si está medida.
 */

/** Lo que le pasó al corpus. El sync trae recuentos porque hace varias cosas a la vez. */
export type CambioEnElCorpus =
  | { forma: 'anadido'; nombre: string }
  | { forma: 'reemplazado'; nombre: string }
  | { forma: 'borrado'; nombre: string }
  | { forma: 'sincronizado'; nuevos: number; actualizados: number; borrados: number };

/** Un mensaje, visto por esta decisión: sólo su papel y si respondía a una pregunta. */
interface MensajeVisible {
  role: string;
  question?: string;
}

/**
 * ¿Hay algo anterior que pueda haber quedado caducado?
 *
 * ⚠️ NO VALE `role === 'assistant'` A SECAS, y aquí está el detalle que decide:
 * los avisos de documento («Documento X indexado») se añaden con ese mismo rol.
 * Lo que distingue una RESPUESTA es que lleva la `question` que la originó
 * (`useChat.ts`, el `concat` de la respuesta). Sin esta distinción, subir un
 * documento en un chat vacío sacaría un aviso sobre respuestas que no existen.
 */
export function hayRespuestaEnLaConversacion(mensajes: MensajeVisible[]): boolean {
  return mensajes.some(m => m.role === 'assistant' && typeof m.question === 'string');
}

const COLA_DE_LO_VIEJO =
  'Las respuestas siguientes no lo verán.\n\nSi prefieres empezar limpio, usa **Limpiar chat**.';

/**
 * El texto del aviso, o `null` si no hay nada que avisar.
 *
 * Devuelve `null` en dos casos, y los dos son la regla del cero: si la
 * conversación no tiene ninguna respuesta, no hay nada anterior que pueda estar
 * caducado; y si un sync no cambió nada, el corpus no cambió.
 */
export function avisoDeCorpusCambiado(
  cambio: CambioEnElCorpus,
  hayRespuesta: boolean,
): string | null {
  if (!hayRespuesta) return null;

  switch (cambio.forma) {
    case 'borrado':
      return (
        `**El corpus ha cambiado: se ha borrado «${cambio.nombre}».**\n\n` +
        'Lo que está más arriba en esta conversación se escribió cuando el documento ' +
        'todavía estaba, así que **puede** citar contenido que ya no existe. ' +
        COLA_DE_LO_VIEJO
      );

    case 'reemplazado':
      return (
        `**El corpus ha cambiado: se ha reemplazado «${cambio.nombre}» por una versión nueva.**\n\n` +
        'Lo que está más arriba en esta conversación se escribió con la versión anterior, ' +
        'así que **puede** citar contenido que ya no existe. ' +
        COLA_DE_LO_VIEJO
      );

    case 'anadido':
      return (
        `**El corpus ha cambiado: se ha añadido «${cambio.nombre}».**\n\n` +
        'Las respuestas anteriores de esta conversación se dieron sin ese documento, ' +
        'así que **pueden** estar incompletas. Las siguientes ya lo tienen en cuenta.'
      );

    case 'sincronizado': {
      const retirados = cambio.actualizados + cambio.borrados;
      // ⚠️ EL ORDEN IMPORTA: si el sync quitó o cambió algo, ése es el aviso que
      // toca —es el que habla de contenido que ya no existe—. Que además haya
      // añadido documentos no lo suaviza.
      if (retirados > 0) {
        return (
          `**El corpus ha cambiado: la sincronización ha cambiado o quitado ` +
          `${retirados} documento${retirados === 1 ? '' : 's'}.**\n\n` +
          'Lo que está más arriba en esta conversación se escribió con el corpus anterior, ' +
          'así que **puede** citar contenido que ya no existe. ' +
          COLA_DE_LO_VIEJO
        );
      }
      if (cambio.nuevos > 0) {
        return (
          `**El corpus ha cambiado: la sincronización ha añadido ` +
          `${cambio.nuevos} documento${cambio.nuevos === 1 ? '' : 's'}.**\n\n` +
          'Las respuestas anteriores de esta conversación se dieron sin ' +
          `${cambio.nuevos === 1 ? 'él' : 'ellos'}, así que **pueden** estar incompletas. ` +
          `Las siguientes ya ${cambio.nuevos === 1 ? 'lo tienen' : 'los tienen'} en cuenta.`
        );
      }
      // Un sync que sólo encontró documentos sin cambios NO cambió el corpus.
      return null;
    }
  }
}
