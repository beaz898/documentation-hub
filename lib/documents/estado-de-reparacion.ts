import { esOrigenSincronizado } from './origen';

/**
 * EL LECTOR DEL SELLO — en qué estado de reparación está un documento (F-104 P3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. `documents.extractor_version` se escribe en los CUATRO puntos de
 * indexación y **no lo lee nadie**: fuera de las escrituras, su única aparición
 * en el repositorio era un comentario. Un sello sin lector. Mientras no lo tenga,
 * un corpus con dos troceados distintos conviviendo es indistinguible de uno
 * homogéneo, y la política de F-104 P2 —«ningún cliente indexa con el cortador
 * viejo»— es una intención en vez de un hecho comprobable.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ TRES ESTADOS Y NO DOS, y el tercero es una DECISIÓN DE PRODUCTO, no una
 * carencia. Un documento manual no guarda su fichero —`ingest` lo borra de
 * Storage al terminar (`:395`) y la fila no tiene `storage_path`—, así que
 * repararlo es RESUBIRLO. Eso no es un fallo de la vía de reparación: es una
 * consecuencia de cómo entra el documento, y lo que el sistema tiene que hacer es
 * DECIRLO en vez de ofrecer un botón que no funcione.
 *
 * ⚠️ EL DEFECTO ES `reparable_resubiendo`, y falla hacia el humano. Cualquier
 * duda cae en el humano, que es el fallo seguro — prometer una reparación
 * automática que luego no existe es peor que pedir una resubida.
 *
 * ⚠️⚠️ LA CONDICIÓN ES TENER EL FICHERO, NO EL ORIGEN. Es la distinción que
 * ordena este módulo, y conviene no perderla: lo que decide si una reparación
 * puede ser automática **no es de dónde vino el documento — es si el sistema
 * puede volver a poner las manos sobre el original**. Que hoy la respuesta
 * coincida con «viene de la nube» es una CONSECUENCIA de cómo entra cada cosa
 * (`ingest` borra el fichero al terminar; un proveedor externo lo sigue
 * teniendo), no el criterio.
 * La diferencia se nota el día que cambie: si mañana una subida manual
 * conservara su binario, **la única línea que hay que tocar es
 * `sePuedeRecuperarElOriginal`** — ni un estado, ni un contador, ni la vista.
 * Y al revés: un proveedor que dejara de permitir descargas no se arregla
 * quitándolo de la lista de orígenes, porque la lista nunca fue el criterio.
 *
 * ⚠️ Y «DE LA NUBE» NO SE DECIDE AQUÍ: se le pregunta a `esOrigenSincronizado`
 * (B.162), que es donde ese criterio vive. Aquel módulo nació porque la misma
 * pregunta se contestaba en tres sitios con dos listas distintas; este no va a
 * ser el cuarto.
 */

export type EstadoDeReparacion =
  /** El troceado de este documento es el de la versión vigente. Nada que hacer. */
  | 'al_dia'
  /** Viene de un proveedor externo y se puede volver a pedir el fichero. */
  | 'reparable_automaticamente'
  /** No se puede recuperar el original: la reparación pasa por el usuario. */
  | 'reparable_resubiendo';

/**
 * Anomalías que no son un estado, pero que un lector no puede callar (F-95: todo
 * límite declarado lleva su contador).
 */
export type AnomaliaDeSello =
  /** `extractor_version` mayor que la vigente: solo puede venir de un despliegue
   *  hacia atrás. No pide reparación, pero un lector que lo silencia vuelve a ser
   *  un sello sin lector. */
  | 'version_futura'
  /** Origen sincronizado sin identificador del proveedor: no se puede volver a
   *  pedir el fichero, así que cae en el humano aunque «sea de la nube». */
  | 'sincronizado_sin_id';

export interface FilaParaSello {
  extractorVersion: number | null | undefined;
  source: string | null | undefined;
  providerFileId: string | null | undefined;
}

export interface EstadoConAnomalia {
  estado: EstadoDeReparacion;
  anomalia?: AnomaliaDeSello;
}

/**
 * ⚠️ LO QUE ESTE ESTADO **NO** PROMETE, y conviene que esté aquí y no en un
 * documento aparte: `reparable_automaticamente` describe **la VÍA, no una
 * garantía**. La descarga puede fallar igual —la conexión con el proveedor
 * caducó, el fichero se borró en origen—. El estado dice por dónde se intentaría
 * la reparación, no que vaya a salir bien.
 */
export function estadoDeReparacion(
  fila: FilaParaSello,
  versionVigente: number,
): EstadoConAnomalia {
  const version = typeof fila.extractorVersion === 'number' ? fila.extractorVersion : null;

  if (version !== null && version > versionVigente) {
    return { estado: 'al_dia', anomalia: 'version_futura' };
  }
  if (version === versionVigente) {
    return { estado: 'al_dia' };
  }

  // A partir de aquí el documento está atrasado: solo falta por dónde se repara,
  // y eso lo decide UNA pregunta — ¿se puede recuperar el original?
  // `null` cae aquí a propósito — es una fila anterior a la columna, o sea de las
  // más viejas del parque, y darla por al día haría mentir al lector justo sobre
  // los documentos que más lo necesitan.
  const recuperable = sePuedeRecuperarElOriginal(fila);
  if (recuperable.si) return { estado: 'reparable_automaticamente' };

  return recuperable.anomalia
    ? { estado: 'reparable_resubiendo', anomalia: recuperable.anomalia }
    : { estado: 'reparable_resubiendo' };
}

/**
 * ¿PUEDE EL SISTEMA VOLVER A PONER LAS MANOS SOBRE EL ORIGINAL?
 *
 * **Ésta es la pregunta que decide el estado**, y está aparte para que se vea que
 * es una y no dos. Hoy se contesta mirando el origen y el identificador del
 * proveedor, pero eso es la RESPUESTA DE HOY, no la pregunta:
 *
 *   · un manual no lo conserva — `ingest:395` borra el fichero de Storage al
 *     terminar, y la fila de `documents` no guarda `storage_path`;
 *   · un documento de un proveedor externo sí, porque su fuente de verdad vive
 *     fuera y se puede volver a pedir con `provider_file_id`.
 *
 * El día que eso cambie —guardar el binario de las subidas manuales, o un
 * proveedor que deje de servir descargas— **se cambia aquí y en ningún otro
 * sitio**.
 */
function sePuedeRecuperarElOriginal(
  fila: FilaParaSello,
): { si: boolean; anomalia?: AnomaliaDeSello } {
  if (!esOrigenSincronizado(fila.source)) return { si: false };

  const id = typeof fila.providerFileId === 'string' ? fila.providerFileId.trim() : '';
  if (id.length === 0) return { si: false, anomalia: 'sincronizado_sin_id' };

  return { si: true };
}

/**
 * El recuento por estado, que es lo que la vista de administración enseña.
 * Se devuelven SIEMPRE las tres claves, con cero si no hay ninguno: un estado que
 * desaparece del listado cuando vale cero es indistinguible de uno que nadie
 * calculó, y eso es exactamente lo que la regla del cero prohíbe.
 */
export function recuentoPorEstado(
  filas: FilaParaSello[],
  versionVigente: number,
): Record<EstadoDeReparacion, number> & { anomalias: Record<AnomaliaDeSello, number> } {
  const recuento = {
    al_dia: 0,
    reparable_automaticamente: 0,
    reparable_resubiendo: 0,
    anomalias: { version_futura: 0, sincronizado_sin_id: 0 },
  };

  for (const fila of filas) {
    const { estado, anomalia } = estadoDeReparacion(fila, versionVigente);
    recuento[estado] += 1;
    if (anomalia) recuento.anomalias[anomalia] += 1;
  }

  return recuento;
}
