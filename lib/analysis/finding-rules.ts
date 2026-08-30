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
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️ LAS DOS RAMAS COMPARAN DISTINTO, Y NO ES UN DESCUIDO (F-82 P3, 28/08).
 *
 * La rama de CELDAS usa `!==` crudo. La de PROSA usa `normalize`. Alguien va a
 * querer unificarlas; esto es lo que rompería.
 *
 * NO SON DOS CRITERIOS PARA LA MISMA PREGUNTA: SON DOS PREGUNTAS DISTINTAS.
 *   · En celdas, dos valores o son el mismo dato o no lo son. «25,00» y «2500»
 *     no son el mismo precio, y cualquier tolerancia que los iguale esconde un
 *     factor de cien.
 *   · En prosa, dos citas del mismo hecho pueden estar redactadas distinto y
 *     seguir diciendo lo mismo. Ahí la tolerancia no sobra: hace falta.
 *
 * Y EL BORRADO DE MARCADO DE `normalize` NO ES TEÓRICO EN PROSA, medido sobre
 * el corpus de pruebas: NOR-10 trae 82 encabezados `#` y 7 cursivas `_`,
 * CLI-12 trae 105 y 7, CLI-03 trae 9. (Negritas `**`: CERO en todo el corpus
 * — el ejemplo de la cabecera de normalize.ts no es el caso que de verdad
 * ocurre.) Poner aquí el nivel seguro de F-82 P2 (`esVarianteDeEscritura`, que
 * no toca puntuación de ninguna clase) haría que dos citas separadas por un
 * `#` dejaran de reclasificarse.
 *
 * LO QUE SÍ ESTÁ ROTO EN PROSA, y no se arregla unificando: `normalize` borra
 * los separadores decimales, así que hoy esta rama declara equivalentes «La
 * tarifa es de 25,00 euros» y «...2500 euros». Es B.115, y necesita un TERCER
 * comparador —que quite marcado y no toque la puntuación numérica—, no el de
 * celdas.
 *
 * ANTES DE TOCAR LA RAMA DE CELDAS: leer B.97. Se midió el 28/08 y no la mueve
 * ni una fila del corpus (10.174 comparaciones, cero variantes de escritura),
 * así que el cambio se retiró por no tener contrapartida — no por no haberse
 * pensado.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type DeterministicVerdict =
  | { outcome: 'pass' }
  | {
      outcome: 'confirm';
      /**
       * EL ANCLA (F-90 P3, desambiguado por F-91 P1). Las columnas donde las
       * dos FILAS coinciden — NO las que el juez citó. Su ausencia total es la
       * firma de una identidad estructuralmente imposible: la oposición
       * necesita un punto fijo, y el punto fijo lo pone la fila.
       *
       * El porqué de la lectura y el caso medido que la decidió están en
       * `anclasDeLasFilas`, aquí arriba.
       *
       * LA CALCULA R2 Y NO SU LLAMADOR, aunque sea el llamador quien decide qué
       * hacer con ella: R2 ya tiene las dos filas delante. Recalcularla fuera
       * sería una SEGUNDA implementación del mismo criterio — lo que la regla
       * de CLAUDE.md prohíbe desde el frente 1.
       */
      anclas: string[];
      reason: 'valores_distintos_misma_columna';
      entity: string | null;
      /** F-51/F-53: TODAS las columnas compartidas que difieren, no una
       *  elegida — elegir "la relevante" sería el juicio semántico que F-23
       *  veta, entrando por el título en vez de por la regla. */
      columns: string[];
    }
  | { outcome: 'reclassify'; reason: 'equivalentes' }
  | { outcome: 'discard'; reason: 'sin_columna_comun' };

/**
 * Aplica la regla que corresponda según el tipo de par.
 *
 * COLUMNAS CITADAS — DE DÓNDE VIENEN (F-55). Ya no se buscan aquí: llegan
 * calculadas desde la verificación de la cita (`alignQuoteToCells`, que las
 * alinea por POSICIÓN contra las celdas de la fila) y viajan en
 * `JudgmentEvidence`. Hasta F-55 las buscaba `findCitedColumns`, por texto:
 * localizaba el par serializado `Columna: valor` dentro de la cita. Esa
 * función se retira por dos motivos, ambos medidos:
 *   1. Ya no hay dónde buscar. Buscaba la forma que chunking.ts genera al
 *      persistir una fila (`pairs.push(\`${column}: ${value}\`)`), y solo
 *      funcionaba porque verifyQuote devolvía el CHUNK ENTERO en ese formato.
 *      Desde F-55 devuelve la cita del juez, que viene del formato barato
 *      (valores sueltos separados por `|`, sin nombres de columna).
 *   2. Sobre-declaraba. Al recibir el chunk entero, la cita hacía que TODAS
 *      las columnas de la fila contaran como citadas, las hubiera citado el
 *      juez o no. Medido sobre 250 citas del corpus de muestra (RRHH-06,
 *      OPE-02, OPE-06): de las 225 aceptadas, 161 declaraban MÁS columnas de
 *      las citadas y solo 44 coincidían con las reales.
 * `null` en un lado = esa cita no es una fila alineable (prosa, o sin chunk).
 *
 * fila / fila (ambos `cells` no nulos):
 *   - Si algún lado llega sin columnas (null o vacío): pass — "columna
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
 *     quitar. `columns` (F-51) son TODAS las columnas compartidas que
 *     difieren, no una elegida — antes de F-51 se reportaba solo
 *     `differingColumns[0]`, una elección arbitraria de facto (el orden de
 *     las columnas citadas dependía del de `Object.keys(cells)`, que ni jsonb
 *     ni JavaScript garantizan; desde F-51 lo fija `getOrderedColumns`, y
 *     desde F-55 llega ya en ese orden). `entity`
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
/**
 * EL ANCLA (F-90 P3, DESAMBIGUADO POR F-91 P1): las columnas donde las dos
 * FILAS coinciden.
 *
 * ⚠️ SOBRE LAS COLUMNAS DE LAS FILAS, NO SOBRE LAS QUE EL JUEZ CITÓ. La
 * diferencia no es de matiz: la otra lectura descartaba hallazgos VERDADEROS.
 * El juez, cuando acierta, cita SOLO la columna que difiere —es literalmente lo
 * que se le pide, señalar la oposición—, así que sobre las citadas el ancla
 * salía vacía justo en su acierto típico. Medido sobre el caso real del corpus:
 * EST-03 contra EST-03, citando solo «Precio base», da CERO anclas por citadas
 * y OCHO por filas. Un descarte determinista cuyo caso frecuente es el acierto
 * no es una guarda: es una trituradora con contador.
 *
 * Y LA RAZÓN DE FONDO, que vale más que la consecuencia: la cita es TEXTO
 * EMITIDO POR UN MODELO. Usarla como insumo de una regla estructural sería
 * CONTAMINAR LA GEOMETRÍA CON TESTIMONIO — la misma frontera de F-23/F-26. La
 * identidad es una propiedad de las FILAS; lo que el juez mencionó es un hecho
 * sobre el JUEZ.
 *
 * QUÉ AFIRMA Y QUÉ NO, que es lo que hace que una sola baste: con al menos un
 * ancla la estructura NO dice «son la misma entidad» — dice «no puedo descartar
 * que lo sean», y para bajar a juicio eso sobra. Por eso no hay umbral
 * proporcional: no es que no sepamos ponerle cifra, es que no hay nada que la
 * cifra mediría (F-91 P1).
 */
function anclasDeLasFilas(
  newCells: Record<string, string>,
  existingCells: Record<string, string>,
): string[] {
  return Object.keys(newCells).filter(
    c => existingCells[c] !== undefined && newCells[c] === existingCells[c],
  );
}

export function applyDeterministicRules(finding: {
  newDocSays: string;
  existingDocSays: string;
  newCells: Record<string, string> | null;
  existingCells: Record<string, string> | null;
  newColumns: string[] | null;
  existingColumns: string[] | null;
}): DeterministicVerdict {
  const { newDocSays, existingDocSays, newCells, existingCells, newColumns, existingColumns } = finding;

  if (newCells && existingCells) {
    if (!newColumns?.length || !existingColumns?.length) {
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
      columns: differingColumns,
      anclas: anclasDeLasFilas(newCells, existingCells),
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
 *
 * F-51/F-53: `columns` en vez de `column` — todas las que difieren, ninguna
 * elegida (ver DeterministicVerdict). El sustantivo pluraliza solo con la
 * lista ("Discrepancia en Puesto" / "Discrepancias en Puesto y Horas
 * semana"); no hay verbo que concuerde en número, así que no hace falta
 * distinguir singular/plural en ningún otro punto de la frase. Con `entity`
 * no nulo, se añade "para <entity>"; con null se omite, como ya degradaba
 * antes de F-51. CAMBIA el título que ve el cliente incluso con una sola
 * columna ("Puesto difiere entre..." pasa a "Discrepancia en Puesto
 * entre...") — aceptado, no es no-regresión de texto, es no-regresión de
 * comportamiento (mismo caso, misma columna, mismo confirmedBy).
 */
export function buildStructuralTopic(
  entity: string | null,
  columns: string[],
  newDocumentName: string,
  existingDocumentName: string,
): string {
  const noun = columns.length === 1 ? 'Discrepancia' : 'Discrepancias';
  const columnList = columns.join(' y ');
  const entityPart = entity ? ` para ${entity}` : '';
  return `${noun} en ${columnList}${entityPart} entre ${newDocumentName} y ${existingDocumentName}`;
}
