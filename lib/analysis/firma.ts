import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

/**
 * EL ANÁLISIS FIRMADO (F-99, F-100 P1, y la especificación dormida de F-95 P1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PARA QUÉ. Con el régimen efímero, el análisis del chat NO se persiste hasta la
 * indexación: viaja al cliente, vive en su pantalla durante la revisión, y vuelve
 * en la petición de indexar. Sin firma eso sería aceptar del cliente un objeto
 * del que se derivan siete columnas de negocio —contradicciones, duplicados,
 * solapamientos, estilo, recomendación—, que alimentan la analítica, la bandeja
 * y los contadores con los que este proyecto se mide a sí mismo. Es la vía de
 * fabricación que F-95 P1 prohibió.
 * LA FIRMA ES LO QUE CONVIERTE «me lo manda el cliente» EN «lo emití yo».
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL ID DEL ANÁLISIS LO EMITE EL SERVIDOR Y VIAJA DENTRO DE LA FIRMA. No es un
 * adorno: es lo que permite que la indexación lo use como CLAVE PRIMARIA de la
 * fila. Así la unicidad contra el doble clic sale gratis de la PK —sin SQL, sin
 * lógica de deduplicación y sin una ventana donde dos peticiones simultáneas
 * escriban dos filas—. Si el id lo pusiera el cliente, sería un id fabricable y
 * la garantía se caería con él.
 *
 * ⚠️ VERIFICAR DEVUELVE `null` Y NO LANZA. Una firma que no casa no es una avería
 * del despliegue: es una rotación del secreto o un intento de fabricación. Quien
 * llama decide qué hacer —indexar el documento y no persistir el análisis— y ese
 * camino no debe pasar por un `catch`. Lo que SÍ lanza es `secretoDeFirma()`
 * cuando falta el secreto, porque eso es un despliegue mal configurado.
 */

/** Separa payload y firma. Un carácter que no aparece en base64url. */
const SEPARADOR = '.';

export interface AnalisisFirmado {
  /** El token que viaja al cliente y vuelve. Opaco para él. */
  token: string;
  /** El id que tendrá la fila cuando se persista. Se expone para que el emisor
   *  pueda registrarlo sin volver a abrir el token. */
  analysisId: string;
}

/**
 * FIRMA UN ANÁLISIS Y LE PONE SU IDENTIDAD.
 *
 * ⚠️ SE FIRMA LA CADENA QUE VIAJA, no el objeto. Si se firmara un objeto y se
 * verificara re-serializándolo, cualquier cambio en el orden de las claves entre
 * las dos operaciones rompería la firma, y el síntoma sería «a veces no guarda»
 * — un fallo intermitente que no señalaría a su causa. Aquí se serializa UNA vez
 * y se firma exactamente eso.
 */
export function firmarAnalisis(
  analisis: unknown,
  secreto: string,
  analysisId: string = randomUUID(),
): AnalisisFirmado {
  const cuerpo = JSON.stringify({ analysisId, analisis });
  const codificado = Buffer.from(cuerpo, 'utf8').toString('base64url');
  const firma = createHmac('sha256', secreto).update(codificado).digest('base64url');
  return { token: `${codificado}${SEPARADOR}${firma}`, analysisId };
}

export interface AnalisisVerificado {
  analysisId: string;
  analisis: unknown;
}

/**
 * ¿LO EMITÍ YO? Devuelve el contenido solo si la firma casa; `null` si no.
 *
 * ⚠️ `timingSafeEqual` Y NO `===`. Comparar firmas con igualdad de cadenas filtra
 * información por el tiempo de respuesta: una comparación que sale antes cuando
 * el primer carácter falla permite reconstruir la firma byte a byte. Es barato
 * hacerlo bien ahora y caro descubrirlo después.
 * Y con su cautela, que no es evidente: **`timingSafeEqual` LANZA si las dos
 * longitudes no coinciden**, así que la comparación va detrás de una guarda de
 * longitud — una firma de otro tamaño es una firma inválida, no una excepción.
 */
export function verificarAnalisis(token: unknown, secreto: string): AnalisisVerificado | null {
  if (typeof token !== 'string') return null;

  const corte = token.indexOf(SEPARADOR);
  if (corte <= 0 || corte === token.length - 1) return null;

  const codificado = token.slice(0, corte);
  const firmaRecibida = token.slice(corte + 1);
  if (firmaRecibida.includes(SEPARADOR)) return null;

  const esperada = createHmac('sha256', secreto).update(codificado).digest('base64url');
  const a = Buffer.from(firmaRecibida, 'utf8');
  const b = Buffer.from(esperada, 'utf8');
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const cuerpo = JSON.parse(Buffer.from(codificado, 'base64url').toString('utf8'));
    if (!cuerpo || typeof cuerpo !== 'object') return null;
    const { analysisId, analisis } = cuerpo as { analysisId?: unknown; analisis?: unknown };
    if (typeof analysisId !== 'string' || analysisId.length === 0) return null;
    return { analysisId, analisis };
  } catch {
    // Firma válida y contenido ilegible: imposible salvo corrupción en tránsito.
    // Se trata como inválido por el mismo criterio que todo lo demás aquí — ante
    // la duda, no se persiste.
    return null;
  }
}
