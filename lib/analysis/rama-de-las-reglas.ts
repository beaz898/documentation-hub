/**
 * LA PREGUNTA DEL CUMPLIMIENTO DEL VERIFICADOR (3.4, fase 3 · contrato del arquitecto, 26/10/2026; corregido el mismo
 * día; el principio, 27/10/2026; A TODO HALLAZGO desde el 02/11/2026, F-130 paso 2).
 *
 * Es la PREGUNTA 2 del verificador del análisis rápido (verify-findings.ts), y se le hace a TODO hallazgo, al lado de la
 * pregunta 1, la de los valores distintos del mismo dato. Las dos son obligatorias.
 * ⚠️ HASTA EL 02/11 ERA UNA RAMA, y la ruta la decidía la marca del juez: sólo los hallazgos con `conflictoNormativo`
 * iban a un lote propio con esta pregunta, y a ésos NO se les hacía la de los valores distintos. Un D que el juez
 * emitía sin la marca iba al lote de siempre, donde la única pregunta era la del dato, y moría (Fable, F-130, 29/10:
 * «la ruta la decide una marca del juez»; adenda f, 31/10: «el verificador no puede depender de la marca. Hace las dos
 * preguntas a todo hallazgo, como la pregunta cerrada, y la etiqueta de la pasada 1 pasa a ser una pista, no una
 * ruta»). Ahora la marca es una PISTA dentro del bloque del hallazgo (`pistaDeConflictoNormativo`), y nada más.
 *
 * El texto es el del arquitecto: las cuatro preguntas, «NO VALE RESPONDER…», el silencio y el hecho supuesto, LITERALES.
 * Lo que cambió el 02/11, y sólo eso: el encabezado («CUANDO EL HALLAZGO VENGA MARCADO…» y «a ése, y sólo a ése, NO le
 * hagas la pregunta de los valores distintos»), que pasa a ser la pregunta 2 de todos; y los «VEREDICTOS para un
 * hallazgo marcado así», que pasan a ser las tres RESPUESTAS de la pregunta 2 (no_cumplibles, cumplibles, no_mandan),
 * con el mismo contenido; y tres referencias que nombraban la rama: «eso sigue valiendo para todo lo demás» → «para la
 * pregunta 1», «así que aquí el silencio» → «así que en la pregunta 2 el silencio», y en la última línea
 * «cumplibles_a_la_vez» → «cumplibles». El veredicto ya no lo escribe el modelo: lo saca el código de las dos respuestas
 * (`veredictoDeLasDosRespuestas`, verify-findings.ts).
 * Es el par de excepcion-de-las-reglas.ts (el juez): un cambio de criterio allí se revisa aquí.
 */
export const PREGUNTA_DEL_CUMPLIMIENTO = `PREGUNTA 2 · EL CUMPLIMIENTO: ¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?

Ésta no pregunta si las dos citas dan valores distintos a un dato. Pregunta
otra cosa: si se pueden cumplir las dos a la vez. Hazle a cada hallazgo la
que corresponda de estas cuatro:

- Si las dos citas son reglas y una PERMITE algo:
      SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?
- Si las dos son reglas y las dos OBLIGAN:
      ¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?
- Si una es una regla y la otra DESCRIBE LO QUE SE HACE:
      ¿LO QUE SE HACE CUMPLE LA REGLA?
  En este caso NO esperes que las dos citas sean reglas: una no lo es, y
  que no lo sea es precisamente lo que se está comprobando.
- Si una de las dos ENUNCIA UN PRINCIPIO —que dos cosas estén separadas,
  que algo sea independiente, que una decisión necesite un segundo par de
  ojos— aunque no lo mande con esas palabras:
      ¿PERMITE LA OTRA JUSTO LO QUE ESE PRINCIPIO EXCLUYE?
  Aquí NO esperes que las dos sean reglas: una puede ser sólo la razón de
  otra regla, y que lo sea NO la deja fuera.

NO VALE RESPONDER «BASTA CON NO USAR EL PERMISO». Una regla que sólo se
puede cumplir renunciando a lo que la otra permite está en conflicto con
ella. Y lo que una regla PERMITE no es un hecho supuesto: es parte de lo
que dice.

RESPUESTAS de la pregunta 2, en el campo "cumplimiento":
- "no_cumplibles": si se hace lo que una permite, o si las dos obligan, no se
  pueden cumplir las dos. O, si una describe lo que se hace: lo que se
  hace no cumple la regla. O, si una enuncia un principio: la otra
  permite justo lo que ese principio excluye.
- "cumplibles": se pueden cumplir las dos, porque mandan sobre
  cosas que no se solapan, porque una delimita a la otra, o porque lo que
  parecía un choque se resuelve leyendo las dos enteras. O, si una
  describe lo que se hace: lo que se hace SÍ cumple la regla. O, si una
  enuncia un principio: lo que la otra permite no es lo que ese principio
  excluye.
- "no_mandan": no se refieren al mismo procedimiento ni a la misma
  responsabilidad, o ninguna de las dos manda nada, describe una práctica
  NI ENUNCIA UN PRINCIPIO.

Que una cita CALLE sobre un dato no le da un valor distinto: eso sigue
valiendo para la pregunta 1. Pero una regla que calla sobre un caso SÍ
puede hacer incumplible otra regla, así que en la pregunta 2 el silencio
puede ser parte del conflicto.

Si para ver que las dos chocan tienes que suponer un hecho que no está en
ninguna de las dos citas ni lo permite ninguna de las dos reglas,
responde "cumplibles".`;

/** La PISTA que lleva en su bloque un hallazgo con `conflictoNormativo`. Es una pista y no una ruta: el hallazgo recibe
 *  las mismas dos preguntas que los demás. Sin el campo, el bloque no lleva nada y es el de siempre. */
export function pistaDeConflictoNormativo(especie: string): string {
  return `PISTA DEL PRIMER AUDITOR: lo señaló como conflicto normativo (${especie}). Es sólo una pista: hazle igual las dos preguntas.`;
}
