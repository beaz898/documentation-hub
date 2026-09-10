import { randomUUID } from 'crypto';
import { firmarCarga, verificarCarga } from '@/lib/analysis/firma';
import { comprobarPertenencia, registrarRechazo } from './pertenencia';

/**
 * LA REFERENCIA DE SUBIDA — B.204, commit 2 de cuatro.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ ESTO NO CIERRA EL AGUJERO: LO CERRÓ EL COMMIT 1. Aquí empieza la MIGRACIÓN
 * de «el cliente elige la ruta» a «el cliente lleva una referencia que emití
 * yo». Quien confunda las dos cosas o correrá a terminar creyendo que hay algo
 * abierto, o lo dejará a medias creyendo que ya no hay nada que hacer.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * QUÉ ES. Una cadena opaca para el cliente con `{ ruta, userId, orgId, fileName,
 * exp }` firmado. **No se persiste NADA**: una fila creada al subir es lo que
 * F-98 P2 mató con su medición —108 fragmentos generados frente a 6 documentos
 * indexados—, y el «no» del usuario tiene que seguir siendo gratis. Una firma da
 * identidad sin fabricar residuo.
 *
 * ⚠️ EL `fileName` VIAJA DENTRO, y cierra una puerta que la ficha no nombra: hoy
 * el cliente elige la extensión con la que el servidor decide CÓMO EXTRAER. Al
 * ir firmado, el nombre que el servidor usa es el que él mismo autorizó.
 *
 * ⚠️ LA RUTA LA COMPONE EL SERVIDOR, Y EMPIEZA POR EL `userId` A PROPÓSITO. No
 * es estética: las políticas del bucket `documents` no están en el repositorio
 * —el punto NO DETERMINADO de la ficha— y lo más probable es que autoricen al
 * cliente a escribir en la carpeta que lleva su propio id. Cambiar el primer
 * segmento sería apostar contra una regla que no podemos leer. Lo que sí cambia
 * es el resto: deja de llevar el nombre del fichero.
 *
 * ⚠️ Y LA CADUCIDAD ES DE DOS HORAS, con su razón, porque un número sin razón se
 * ajusta a ojo la primera vez que molesta: entre subir el documento y abrir el
 * modal de Mejora hay una REVISIÓN HUMANA SIN LÍMITE DE TIEMPO. Minutos serían
 * un fallo mudo en mitad de una revisión legítima. Si caduca, el usuario ve
 * «vuelve a subirlo», y el contador de `caducada` es lo que diría si pasa de
 * verdad en vez de en nuestra cabeza.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ UNA REF EMITIDA ES UNA CREDENCIAL, NO UN IDENTIFICADOR. Vale dos horas y
 * abre una ruta concreta a quien la tenga. De ahí dos cosas:
 *   · NO SE PEGA DONDE SE QUEDE ESCRITA — ni en un ticket, ni en un chat, ni en
 *     una captura. Hoy da igual (fichero inexistente, cuenta propia, un solo
 *     usuario), pero el día que haya clientes el gesto de diagnóstico tiene que
 *     poder hacerse SIN manipular refs a mano. Por eso la comprobación del
 *     despliegue vive en un botón que enseña que emitió, no la ref entera.
 *   · Y por eso lleva reloj: una credencial sin caducidad es la que sigue
 *     abriendo la puerta cuando ya nadie se acuerda de quién la tuvo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL DEFECTO QUE ESTE MÓDULO YA TUVO, escrito aquí porque es donde se vuelve
 * a cometer: `228239d2` pasaba el secreto YA RESUELTO a
 * `resolverOrigenDelFichero`, así que `secretoDeFirma()` —que LANZA si el
 * despliegue está mal configurado— se evaluaba en TODA petición, viniera ref o
 * no. El commit afirmaba en su mensaje que un fallo del secreto «no rompe nada
 * de lo que el usuario hace mientras el cliente siga mandando la ruta», y el
 * código hacía lo contrario: habría tumbado subida, análisis y modal de Mejora
 * por el camino viejo, que no usa el secreto para nada.
 * Lo desmintió leer las tres líneas de llamada al preparar el estreno. Hoy el
 * secreto se PIDE, y hay un caso en la batería que falla si alguien vuelve a
 * pedirlo antes de tiempo.
 */

/** Dos horas. Ver la cabecera: el número tiene razón escrita, no es redondeo. */
export const VIDA_DE_LA_REF_MS = 2 * 60 * 60 * 1000;

/** Por qué se rechazó una referencia. Cada uno se cuenta por separado. */
export type MotivoDeRef =
  /** No es una cadena, o no tiene la forma de una referencia nuestra. */
  | 'malformada'
  /** Bien formada y no la emitimos nosotros — o el secreto ha rotado. */
  | 'firma'
  /** La emitimos nosotros y ya no vale. */
  | 'caducada'
  /** La emitimos nosotros, vale, y es de OTRO. */
  | 'ajena';

/** El fallo va en el tipo. Ver `pertenencia.ts` para el porqué. */
export type RefResuelta =
  | { ok: true; ruta: string; fileName: string }
  | { ok: false; motivo: MotivoDeRef };

export interface RefEmitida {
  /** Opaca para el cliente. Vuelve en la petición y se resuelve aquí. */
  ref: string;
  /** Dónde tiene que subir el fichero, y dónde puede borrarlo si se arrepiente. */
  ruta: string;
}

interface CargaDeRef {
  v: 1;
  ruta: string;
  u: string;
  o: string;
  n: string;
  exp: number;
}

/**
 * EMITE LA REFERENCIA Y COMPONE LA RUTA.
 *
 * `ahora` y `unico` se inyectan para poder probar el reloj y la unicidad sin
 * esperar dos horas ni depender del azar: un control de caducidad que no se
 * puede provocar no es un control.
 */
export function emitirRefDeSubida(
  quien: { userId: string; orgId: string },
  fileName: string,
  secreto: string,
  ahora: number = Date.now(),
  unico: string = randomUUID(),
): RefEmitida {
  const ruta = `${quien.userId}/${ahora}-${unico}`;
  const carga: CargaDeRef = {
    v: 1,
    ruta,
    u: quien.userId,
    o: quien.orgId,
    n: fileName,
    exp: ahora + VIDA_DE_LA_REF_MS,
  };
  return { ref: firmarCarga(carga, secreto), ruta };
}

/**
 * ¿ES MÍA, VALE TODAVÍA, Y ES DE QUIEN LLAMA? Las tres, en ese orden.
 *
 * El orden no es casual: no se puede decir «caducada» de algo que no emitimos, y
 * decir «ajena» de una firma que no casa sería informar a quien fabrica tokens
 * de que se acercó.
 */
export function resolverRefDeSubida(
  ref: unknown,
  quien: { userId: string; orgId: string },
  secreto: string,
  ahora: number = Date.now(),
): RefResuelta {
  if (typeof ref !== 'string' || ref.trim().length === 0) {
    return { ok: false, motivo: 'malformada' };
  }

  const cuerpo = verificarCarga(ref, secreto);
  if (!cuerpo || typeof cuerpo !== 'object') {
    return { ok: false, motivo: 'firma' };
  }

  const c = cuerpo as Partial<CargaDeRef>;
  if (
    c.v !== 1 ||
    typeof c.ruta !== 'string' || c.ruta.length === 0 ||
    typeof c.u !== 'string' || c.u.length === 0 ||
    typeof c.o !== 'string' || c.o.length === 0 ||
    typeof c.n !== 'string' || c.n.length === 0 ||
    typeof c.exp !== 'number' || !Number.isFinite(c.exp)
  ) {
    // Firmada por nosotros y con otra forma: es una versión que ya no
    // entendemos, no un ataque. Se rechaza igual — ante la duda, no se descarga.
    return { ok: false, motivo: 'malformada' };
  }

  if (ahora > c.exp) return { ok: false, motivo: 'caducada' };

  // ⚠️ SE COMPRUEBAN LAS DOS: el usuario porque la ruta es suya, y la
  // organización porque un usuario puede cambiar de organización sin cambiar de
  // id — y una ref emitida en la anterior no debe valer en la nueva.
  if (c.u !== quien.userId || c.o !== quien.orgId) {
    return { ok: false, motivo: 'ajena' };
  }

  return { ok: true, ruta: c.ruta, fileName: c.n };
}

/** Ver `registrarRechazo` en `pertenencia.ts`: mismo criterio, misma decisión. */
export function registrarRefRechazada(
  endpoint: string,
  motivo: MotivoDeRef,
  quienLlama: string,
): void {
  console.error(
    `[SUBIDA] ref rechazada | endpoint=${endpoint} | motivo=${motivo} | llama=${quienLlama}`,
  );
}

/** De dónde salió el fichero que este endpoint va a leer. */
export type Origen =
  | { ok: true; ruta: string; fileName: string; via: 'ref' | 'ruta' }
  | { ok: false; motivo: string };

/**
 * LA LECTURA DUAL, EN UN SOLO SITIO — y con reloj.
 *
 * ⚠️ ESTO ES UNA MIGRACIÓN, NO DOS IDENTIDADES VIVAS. Se lee la vieja y la
 * nueva, se escribe solo la nueva, y la vieja se RETIRA en el commit 4. Mientras
 * tanto el camino viejo sigue guardado por la comprobación de pertenencia del
 * commit 1: vivo, pero no abierto.
 *
 * ⚠️ POR QUÉ HAY VENTANA SI NADIE PERSISTE LA IDENTIDAD VIEJA: porque una pestaña
 * abierta antes del despliegue sigue mandando la ruta. Es el único portador, y
 * por eso la ventana es corta y tiene fecha en vez de ser un estado permanente.
 *
 * ⚠️ Y EL CONTADOR DE `via` ES LO QUE DICE CUÁNDO SE PUEDE CERRAR. Sin él, la
 * retirada del commit 4 sería una apuesta sobre si queda alguien entrando por
 * el camino viejo. Con él, es una lectura.
 */
export function resolverOrigenDelFichero(
  entrada: { ref?: unknown; storagePath?: unknown },
  quien: { userId: string; orgId: string },
  endpoint: string,
  /**
   * ⚠️ SE PIDE, NO SE PASA — y la firma lo dice para que no se pueda hacer mal.
   *
   * Recibir el secreto YA RESUELTO obliga a quien llama a pedirlo antes de saber
   * si hace falta, y `secretoDeFirma()` LANZA cuando el despliegue está mal
   * configurado. Con un `string` en esta posición, un secreto malo tumbaba
   * también el camino VIEJO, que no lo usa para nada.
   * No es hipotético: así entró en `228239d2`. Ver la cabecera del módulo.
   */
  pedirSecreto: () => string,
  ahora: number = Date.now(),
): Origen {
  // La ref GANA si viene: durante la ventana, el camino nuevo es el preferente.
  if (entrada.ref !== undefined && entrada.ref !== null) {
    const r = resolverRefDeSubida(entrada.ref, quien, pedirSecreto(), ahora);
    if (!r.ok) {
      registrarRefRechazada(endpoint, r.motivo, quien.userId);
      return { ok: false, motivo: `ref_${r.motivo}` };
    }
    return { ok: true, ruta: r.ruta, fileName: r.fileName, via: 'ref' };
  }

  const p = comprobarPertenencia(entrada.storagePath, quien.userId);
  if (!p.ok) {
    registrarRechazo(endpoint, p.motivo, quien.userId, entrada.storagePath);
    return { ok: false, motivo: p.motivo };
  }

  console.warn(`[SUBIDA] via=ruta (camino viejo) | endpoint=${endpoint} | llama=${quien.userId}`);
  // Por el camino viejo el nombre sigue viniendo del cuerpo: quien llama lo lee
  // de donde lo leía. Es lo que se acaba en el commit 4.
  return { ok: true, ruta: p.ruta, fileName: '', via: 'ruta' };
}
