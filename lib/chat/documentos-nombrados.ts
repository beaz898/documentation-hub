/**
 * ¿LA PREGUNTA NOMBRA UN DOCUMENTO QUE EXISTE? — 14/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. El chat le dijo al director que no tenía acceso a un documento
 * suyo. No era falso desde dentro: **el nombre del fichero no está en el texto
 * embebido** —`chunkSegments` mete `{ text: trozo }` y nada más—, así que
 * preguntar «¿qué dice informe.xlsx?» compara esa frase contra trozos que no
 * contienen el nombre. Si el contenido no se parece por casualidad, no pasa el
 * umbral y `rag.ts` devuelve, SIN LLAMAR AL MODELO, «asegúrate de que los
 * documentos han sido subidos». Estaba subido.
 *
 * ⚠️ Y AQUÍ NO SE CLASIFICA LA INTENCIÓN DE LA PREGUNTA. No se pregunta «¿esto
 * es una pregunta por nombre?» —eso es un criterio que hay que acertar y que
 * falla en los dos sentidos— sino **«¿aparece en esta frase el nombre de un
 * documento que existe?»**, que es una comparación contra una lista cerrada.
 * Si ningún documento se llama como algo que hay en la frase, no pasa nada y el
 * comportamiento es exactamente el de ayer. **Falla hacia lo de hoy por
 * construcción, no por calibrado.**
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface DocumentoNombrable {
  id: string;
  name: string;
}

/**
 * ⚠️ EL CRITERIO ESTRECHO, Y ES UNA DECISIÓN TOMADA: el nombre tiene que llevar
 * EXTENSIÓN. Se descartó a sabiendas la variante amplia —aceptar también el
 * nombre sin extensión— porque un documento llamado `Contrato.pdf` se activaría
 * con «¿qué dice el contrato?», que es una pregunta legítima sobre el contenido.
 *
 * El caso medido es alguien que COPIA el nombre de la lista, y ése lleva
 * extensión. Lo estrecho se puede ampliar el día que se quede corto; lo amplio
 * no se puede estrechar sin que alguien note que el chat «dejó de entender».
 */
const PARECE_LLEVAR_EXTENSION = /\.[a-z0-9]{2,5}(?![a-z0-9])/i;

/**
 * Minúsculas, sin acentos y con los espacios colapsados. NO se quitan los
 * puntos ni los guiones: son parte del nombre del fichero, y quitarlos
 * ensancharía el criterio por la puerta de atrás.
 */
export function normalizarParaNombre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * LA CONDICIÓN NECESARIA, Y ESTÁ AQUÍ POR LO QUE CUESTA LO OTRO.
 *
 * Para que un nombre con extensión sea subcadena de la pregunta, **la pregunta
 * tiene que contener un punto seguido de letras**. Si no lo tiene, no hace falta
 * ni traer la lista de documentos: no puede haber coincidencia.
 *
 * ⚠️ Es una condición NECESARIA, no suficiente: aquí se decide si merece la pena
 * MIRAR, nunca si hay coincidencia. Quien la use para concluir algo sobre el
 * resultado la está leyendo mal.
 *
 * Lo que compra: la consulta extra a la base se evita en la inmensa mayoría de
 * las preguntas, y eso importa — el volumen de llamadas a esa base es
 * justamente lo único nuestro en los tiempos de espera medidos el 14/09.
 */
export function laPreguntaPodriaNombrarUnFichero(pregunta: string): boolean {
  return typeof pregunta === 'string' && PARECE_LLEVAR_EXTENSION.test(pregunta);
}

/**
 * Los documentos de la lista cuyo nombre aparece LITERAL en la pregunta.
 *
 * Devuelve los más largos primero: si existen `informe.txt` y
 * `informe.txt (corregido 14/09/2026)`, los dos casan con una pregunta que cite
 * el segundo, y el orden deja delante al más específico. Los dos se devuelven —
 * decidir cuál quería el usuario sería inventar.
 */
export function documentosNombrados(
  pregunta: string,
  documentos: readonly DocumentoNombrable[],
): DocumentoNombrable[] {
  if (typeof pregunta !== 'string' || pregunta.trim().length === 0) return [];
  const aguja = normalizarParaNombre(pregunta);
  if (aguja.length === 0) return [];

  const encontrados = documentos.filter(d => {
    if (!d || typeof d.name !== 'string' || d.name.trim().length === 0) return false;
    // Sin extensión en el NOMBRE, no se busca: es el criterio estrecho.
    if (!PARECE_LLEVAR_EXTENSION.test(d.name)) return false;
    return aguja.includes(normalizarParaNombre(d.name));
  });

  return [...encontrados].sort((a, b) => b.name.length - a.name.length);
}
