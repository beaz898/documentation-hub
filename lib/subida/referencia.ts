import { randomUUID } from 'crypto';
import { firmarCarga, verificarCarga } from '@/lib/analysis/firma';


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
  /** No vino ninguna. Desde el commit 4 es, casi siempre, una pestaña vieja. */
  | 'ausente'
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
  | { ok: true; ruta: string; fileName: string }
  | { ok: false; motivo: MotivoDeRef; mensaje: string };

/**
 * QUÉ SE LE DICE AL USUARIO POR CADA MOTIVO — en un solo sitio, y por eso.
 *
 * ⚠️ LOS TRES ENDPOINTS DEVOLVÍAN «Ruta no autorizada» PARA TODO, que es mudo
 * justo donde el usuario no ha hecho nada mal: una autorización caducada es una
 * subida legítima que se quedó dos horas esperando, y decirle «no autorizada» le
 * hace pensar que el documento no es suyo. El commit 4 es el ÚNICO momento en que
 * esto se puede arreglar, porque hasta hoy el camino viejo tapaba los dos casos.
 *
 * ⚠️ Y ESTÁ AQUÍ Y NO EN CADA ENDPOINT porque si no serían tres textos que se
 * separan: el día que alguien afine uno, los otros dos seguirían diciendo lo
 * viejo, y nadie se enteraría porque los tres «funcionan».
 *
 * El `switch` es exhaustivo a propósito: añadir un motivo sin darle mensaje NO
 * COMPILA, que es la única forma de que esto no se quede atrás.
 */
export function mensajeDeRefRechazada(motivo: MotivoDeRef): string {
  switch (motivo) {
    case 'caducada':
      return 'La autorización de esta subida ha caducado: dura 2 horas y el documento lleva más esperando. Vuelve a subirlo y se analizará igual.';
    case 'ausente':
    case 'malformada':
    case 'firma':
      // El caso realista de los tres es la pestaña vieja: se cargó antes del
      // despliegue y manda lo que mandaba entonces. Recargar lo arregla.
      return 'Esta página está desactualizada. Recárgala y vuelve a subir el documento.';
    case 'ajena':
      return 'Ruta no autorizada.';
  }
}

/**
 * DE DÓNDE SALE EL FICHERO: SOLO DE LA `ref`. Commit 4 de 4 — 14/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ LA LECTURA DUAL SE ACABA AQUÍ, Y ERA UNA MIGRACIÓN CON RELOJ, no dos
 * identidades vivas: se leyó la vieja y la nueva durante la ventana, se escribió
 * solo la nueva, y la vieja se retira. La ventana duró del 10 al 14/09/2026.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **LA SEGUNDA CONDICIÓN, CUMPLIDA**: el plan exigía que el camino nuevo se
 * ejerciera antes de retirar el viejo. Verificado en producción el 14/09/2026
 * mirando el objeto en Storage —`1789366696828-c134bfe1-…`, marca de tiempo y
 * UUID **sin el nombre del fichero dentro**—, que es la firma de una ruta
 * compuesta por el servidor.
 * ⚠️ Y LO QUE ESE GESTO NO DEMUESTRA, dicho aquí porque es donde se leerá: que
 * nadie haya entrado por el camino viejo. Eso lo decía el contador `via=ruta`, y
 * vivía en los registros de Vercel, no en la base. Se retira con el camino: a
 * partir de hoy no hay camino viejo por el que entrar, así que el contador no
 * tiene nada que contar.
 *
 * ⚠️ `storagePath` YA NO SE LEE, y sigue llegando en el cuerpo de las peticiones
 * a propósito: el CLIENTE lo necesita para borrar el temporal por su cuenta
 * —cancelar, cerrar el modal—. Que viaje no significa que el servidor lo mire.
 * Esta firma ya ni lo acepta, que es la forma de que no vuelva a mirarse.
 */
export function resolverOrigenDelFichero(
  entrada: { ref?: unknown },
  quien: { userId: string; orgId: string },
  endpoint: string,
  /**
   * ⚠️ SE PIDE, NO SE PASA — y la firma lo dice para que no se pueda hacer mal.
   *
   * Recibir el secreto YA RESUELTO obliga a quien llama a pedirlo antes de saber
   * si hace falta, y `secretoDeFirma()` LANZA cuando el despliegue está mal
   * configurado. No es hipotético: así entró en `228239d2`.
   */
  pedirSecreto: () => string,
  ahora: number = Date.now(),
): Origen {
  if (entrada.ref === undefined || entrada.ref === null) {
    registrarRefRechazada(endpoint, 'ausente', quien.userId);
    return { ok: false, motivo: 'ausente', mensaje: mensajeDeRefRechazada('ausente') };
  }

  const r = resolverRefDeSubida(entrada.ref, quien, pedirSecreto(), ahora);
  if (!r.ok) {
    registrarRefRechazada(endpoint, r.motivo, quien.userId);
    return { ok: false, motivo: r.motivo, mensaje: mensajeDeRefRechazada(r.motivo) };
  }

  return { ok: true, ruta: r.ruta, fileName: r.fileName };
}
