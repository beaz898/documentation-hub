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
 * ⚠️ EL DEFECTO ES `reparable_resubiendo`, y falla hacia el humano. Solo se
 * promete la vía automática cuando se puede demostrar: origen sincronizado Y un
 * identificador con el que volver a pedir el fichero. Cualquier duda cae en el
 * humano, que es el fallo seguro — prometer una reparación automática que luego
 * no existe es peor que pedir una resubida.
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

  // A partir de aquí el documento está atrasado: solo falta por dónde se repara.
  // `null` cae aquí a propósito — es una fila anterior a la columna, o sea de las
  // más viejas del parque, y darla por al día haría mentir al lector justo sobre
  // los documentos que más lo necesitan.
  if (!esOrigenSincronizado(fila.source)) {
    return { estado: 'reparable_resubiendo' };
  }

  const id = typeof fila.providerFileId === 'string' ? fila.providerFileId.trim() : '';
  if (id.length === 0) {
    return { estado: 'reparable_resubiendo', anomalia: 'sincronizado_sin_id' };
  }

  return { estado: 'reparable_automaticamente' };
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
