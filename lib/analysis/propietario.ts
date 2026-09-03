/**
 * DE QUIÉN ES UN ANÁLISIS GUARDADO (F-100 P2, P4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA LEY QUE ESTE MÓDULO HACE CUMPLIR: **ninguna escritura durable sin
 * propietario verdadero.** Y su forma corta, que es la regla de F-100 P1: LA
 * FILA NACE ATADA O NO NACE — no existe el estado intermedio «persistida
 * esperando identidad», porque ese estado ES la fábrica de huérfanos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ SE LLAMA «PROPIETARIO» Y NO «documentId» A PROPÓSITO. Es la regla de
 * F-100 P2: un parámetro que responde a dos preguntas se separa en dos, y **los
 * nombres dicen qué pregunta responde cada uno**. El desastre que la promovió
 * fue exactamente un `documentId` neutro que valía a la vez para «de quién es
 * este análisis» y «contra quién no compararse»; con un nombre que solo admite
 * una lectura, reutilizarlo para la otra se ve al leerlo.
 * La pregunta que responde este valor es UNA: **¿de quién es el resultado?**
 * Nunca «a quién excluyo», que es `documentosExcluidos` y vive aparte.
 */

/**
 * EL PROPIETARIO, o nadie.
 *
 * ⚠️ NO BASTA CON QUE EL CLIENTE MANDE UN ID. Aceptar una REFERENCIA es legítimo
 * —F-95 P1 lo permite en sus términos: «se aceptan referencias e
 * identificadores; el servidor reconstruye»—, pero escribirla sin comprobarla
 * no lo es: cualquiera con sesión podría atribuir un análisis a cualquier
 * documento cuyo id conozca. Y no sería inocuo: la bandeja se queda con el
 * análisis MÁS RECIENTE de cada `document_id`, así que una fila fabricada TAPA
 * el análisis real de un documento ajeno.
 *
 * ⚠️ Y FALLA CERRADA (F-95 P3): si no se pudo comprobar la pertenencia, el
 * propietario es NADIE. Sin propietario el análisis se degrada —no se puede
 * releer por documento—; con un propietario equivocado se CORROMPE la
 * atribución de otro. Entre degradar y corromper, se degrada.
 */
export function documentoPropietario(params: {
  /** Lo que llegó en la petición. `unknown` a propósito: viene del cliente. */
  idPedido: unknown;
  /** ¿Existe ese documento Y es de esta organización? El servidor lo comprueba;
   *  ante un fallo de la consulta, `false` — nunca `true` por optimismo. */
  perteneceALaOrg: boolean;
}): string | null {
  const { idPedido, perteneceALaOrg } = params;
  if (typeof idPedido !== 'string' || idPedido.length === 0) return null;
  if (!perteneceALaOrg) return null;
  return idPedido;
}
