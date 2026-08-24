import { normalize } from './judge';

/**
 * Verificador de hallazgos — capa determinista (F-23, reescrita por F-26).
 *
 * Criterio de F-23, que sigue mandando sobre cualquier duda de diseño: "una
 * regla es determinista si comprueba la FORMA del hallazgo usando estructura
 * que el sistema ya tiene; si necesita entender PALABRAS, es juicio y va a la
 * llamada corta".
 *
 * CORRECCIÓN DE F-26: la primera versión de R1 comparaba dos citas por
 * contención de cadena con un umbral de longitud mínima. "Puesto:
 * Implantólogo" contra "Puesto: Implantólogo / Cirujano oral" se salvó de
 * reclasificarse como equivalente por un solo carácter (19 contra el umbral de
 * 20). Que el resultado dependiera de la aritmética del umbral, no de la
 * estructura del hallazgo, demostró que la regla era un juicio semántico
 * disfrazado de regla determinista — exactamente lo que F-23 prohíbe. Se
 * retira toda medida de parecido: contención, umbral, coincidencia parcial.
 * Lo que no se puede decidir con estructura ya existente (celdas de la fila,
 * identidad exacta tras normalizar), no se decide aquí — baja a la llamada
 * corta.
 *
 * CORRECCIÓN DE F-36: "Puesto: Implantólogo" contra "Puesto: Implantólogo /
 * Cirujano oral" —el mismo caso que motivó F-26— seguía muriendo después de
 * R2, pero no en esta capa: llegaba a 'pass' (correcto), bajaba a la llamada
 * corta, y allí la mataba 'mismo_dato_sin_oposicion' en las cuatro ejecuciones
 * medidas. La causa: 'pass' cargaba dos significados distintos — "no he
 * podido decidir, decide tú" y "he demostrado que hay oposición estructural,
 * ya no queda nada que juzgar". En el segundo caso, preguntarle a la llamada
 * corta deshace en la capa cara lo que la barata ya había resuelto. Misma
 * columna con valores distintos en la misma fila de la misma entidad ya es la
 * discrepancia — dos valores no pueden ser ambos el valor de un mismo dato —,
 * así que R2 gana una cuarta salida, 'confirm', y el hallazgo sobrevive sin
 * pasar por la llamada corta.
 *
 * TRES TIPOS DE PAR, según de dónde venga cada cita:
 *   fila / fila   → R2, comparando VALORES de la(s) columna(s) citada(s).
 *   prosa / prosa → identidad exacta tras normalizar. Cualquier otra
 *                   diferencia (aunque sea una reformulación obvia, como
 *                   "Pelo recogido durante la atención clínica al paciente"
 *                   contra "Pelo recogido en todo el personal clínico durante
 *                   la atención al paciente", MKT-01/RRHH-05) es juicio, no
 *                   estructura: pass.
 *   fila / prosa  → siempre pass. No hay estructura comparable entre los dos
 *                   lados; lo resuelve la llamada corta con la fila entera.
 *
 * Funciones puras: sin llamadas a modelo, sin base de datos, sin efectos.
 * Nadie las invoca todavía.
 */

export type DeterministicVerdict =
  | { outcome: 'pass' }
  | {
      outcome: 'confirm';
      reason: 'valores_distintos_misma_columna';
      entity: string | null;
      column: string;
    }
  | { outcome: 'reclassify'; reason: 'equivalentes' }
  | { outcome: 'discard'; reason: 'sin_columna_comun' };

/**
 * Columnas cuyo par serializado `Columna: valor` (la misma forma que
 * chunking.ts genera al construir una fila — ver `pairs.push(\`${column}: ${value}\`)`,
 * unidas con ` | `) aparece contenido en la cita. Se busca el par completo, no
 * el valor suelto: en un cuadro de turnos el valor "M" aparece en cinco
 * columnas distintas, pero "Lunes: M" solo en una. La clave de búsqueda es la
 * misma cadena que el propio sistema generó, así que no hay ambigüedad que
 * adivinar (F-24: "lo primero inventa, lo segundo consulta"). Comparación
 * sobre texto normalizado (mismo criterio que findBestMatch en judge.ts) para
 * tolerar diferencias de espaciado o mayúsculas, no para emparejar por
 * parecido. Puede haber más de una columna citada por lado: devuelve el
 * conjunto. Array vacío si `cells` es null o si no se localiza ninguna.
 */
export function findCitedColumns(
  quote: string,
  cells: Record<string, string> | null,
): string[] {
  if (!cells) return [];
  const normQuote = normalize(quote);
  const cited: string[] = [];
  for (const [column, value] of Object.entries(cells)) {
    const normPair = normalize(`${column}: ${value}`);
    if (normQuote.includes(normPair)) {
      cited.push(column);
    }
  }
  return cited;
}

/**
 * Aplica la regla que corresponda según el tipo de par.
 *
 * fila / fila (ambos `cells` no nulos): se localiza la columna citada de cada
 * lado con findCitedColumns.
 *   - Si algún lado no permite determinar su columna citada: pass — "columna
 *     indeterminable", el único significado que le queda a 'pass' desde F-36
 *     ("no puedo decidir"). Que lo resuelva el juicio con la fila entera.
 *   - Si no comparten ninguna columna citada: discard/'sin_columna_comun'.
 *     Caso real (B.82, 21/08): "Fecha evaluación: 2026-06-13" contra "Horas
 *     semana: 12", presentadas como contradicción bajo el título "Horas
 *     semanales de Nuria Ferrer" — columnas de dos tablas distintas, no el
 *     mismo dato.
 *   - Si comparten alguna columna citada y TODOS los valores compartidos son
 *     idénticos: reclassify/'equivalentes'.
 *   - Si al menos un valor compartido difiere: confirm/'valores_distintos_misma_columna'
 *     (F-36, antes 'pass'). Caso real: "Puesto: Implantólogo" contra "Puesto:
 *     Implantólogo / Cirujano oral": comparten la columna Puesto y difieren en
 *     ella — dos valores distintos en la misma columna de la misma fila YA es
 *     la discrepancia, no queda nada que la llamada corta pueda añadir o
 *     quitar. `column` es la primera columna compartida que difiere. `entity`
 *     es siempre null: `cells` es un Record<string,string> sin ninguna
 *     columna marcada como identificadora de la fila, y no hay forma
 *     estructural de saber cuál lo sería sin comparar nombres de columna
 *     (buscar "Nombre", "Empleado", "Código"...) — exactamente el juicio
 *     semántico disfrazado de estructura que F-23/F-26 prohíben. El título
 *     por plantilla (F-36, pipeline.ts) se construye sin entidad.
 *
 * prosa / prosa (ambos `cells` nulos): reclassify/'equivalentes' solo si las
 * dos citas son idénticas tras normalizar. Cualquier otra cosa, pass.
 *
 * fila / prosa (un solo lado con `cells`): pass siempre — caso mixto, sin
 * estructura comparable entre los dos lados.
 */
export function applyDeterministicRules(finding: {
  newDocSays: string;
  existingDocSays: string;
  newCells: Record<string, string> | null;
  existingCells: Record<string, string> | null;
}): DeterministicVerdict {
  const { newDocSays, existingDocSays, newCells, existingCells } = finding;

  if (newCells && existingCells) {
    const newColumns = findCitedColumns(newDocSays, newCells);
    const existingColumns = findCitedColumns(existingDocSays, existingCells);
    if (newColumns.length === 0 || existingColumns.length === 0) {
      return { outcome: 'pass' };
    }

    const sharedColumns = newColumns.filter(c => existingColumns.includes(c));
    if (sharedColumns.length === 0) {
      return { outcome: 'discard', reason: 'sin_columna_comun' };
    }

    const differingColumns = sharedColumns.filter(c => newCells[c] !== existingCells[c]);
    if (differingColumns.length === 0) {
      return { outcome: 'reclassify', reason: 'equivalentes' };
    }

    return {
      outcome: 'confirm',
      reason: 'valores_distintos_misma_columna',
      entity: null,
      column: differingColumns[0],
    };
  }

  if (!newCells && !existingCells) {
    return normalize(newDocSays) === normalize(existingDocSays)
      ? { outcome: 'reclassify', reason: 'equivalentes' }
      : { outcome: 'pass' };
  }

  return { outcome: 'pass' };
}

/**
 * Título de RESPALDO para un hallazgo confirmado por estructura, cuando el
 * topic que puso el juez viene vacío (F-36, corregido por F-38). El topic del
 * juez es un campo que identifica el hallazgo — ninguna etapa lo reescribe si
 * ya trae contenido; esta plantilla solo entra cuando no hay nada que
 * conservar.
 */
export function buildStructuralTopic(
  entity: string | null,
  column: string,
  newDocumentName: string,
  existingDocumentName: string,
): string {
  return entity
    ? `${column} de ${entity} difiere entre ${newDocumentName} y ${existingDocumentName}`
    : `${column} difiere entre ${newDocumentName} y ${existingDocumentName}`;
}
