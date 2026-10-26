/**
 * LA RAMA DE LAS REGLAS DEL VERIFICADOR (3.4, fase 3 · contrato del arquitecto, 26/10/2026; corregido el mismo día).
 *
 * Se añade al prompt del verificador del análisis rápido (verify-findings.ts) SÓLO en el lote de los hallazgos
 * marcados con `conflictoNormativo`, que van en su propio lote: los no marcados reciben el prompt de siempre, byte a
 * byte, con la pregunta de los valores distintos y sus tres veredictos. Texto del arquitecto, literal: no se toca sin
 * él. La corrección del 26/10 añade la pregunta de la práctica (norma_contra_practica), que el primer texto no tenía y
 * cuyo «sin_relacion» —«no son reglas»— la habría descartado siempre.
 */
export const RAMA_DE_LAS_REGLAS = `CUANDO EL HALLAZGO VENGA MARCADO COMO CONFLICTO NORMATIVO:

Ese hallazgo no dice que las dos citas den valores distintos a un dato.
Dice otra cosa: que no se pueden cumplir las dos a la vez. Así que a ése,
y sólo a ése, NO le hagas la pregunta de los valores distintos. Hazle la
que corresponda de estas tres:

- Si las dos citas son reglas y una PERMITE algo:
      SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?
- Si las dos son reglas y las dos OBLIGAN:
      ¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?
- Si una es una regla y la otra DESCRIBE LO QUE SE HACE:
      ¿LO QUE SE HACE CUMPLE LA REGLA?
  En este caso NO esperes que las dos citas sean reglas: una no lo es, y
  que no lo sea es precisamente lo que se está comprobando.

NO VALE RESPONDER «BASTA CON NO USAR EL PERMISO». Una regla que sólo se
puede cumplir renunciando a lo que la otra permite está en conflicto con
ella. Y lo que una regla PERMITE no es un hecho supuesto: es parte de lo
que dice.

VEREDICTOS para un hallazgo marcado así:
- "confirmado": si se hace lo que una permite, o si las dos obligan, no se
  pueden cumplir las dos. O, si una describe lo que se hace: lo que se
  hace no cumple la regla.
- "cumplibles_a_la_vez": se pueden cumplir las dos, porque mandan sobre
  cosas que no se solapan, porque una delimita a la otra, o porque lo que
  parecía un choque se resuelve leyendo las dos enteras. O, si una
  describe lo que se hace: lo que se hace SÍ cumple la regla.
- "sin_relacion": no se refieren al mismo procedimiento ni a la misma
  responsabilidad, o una de las dos no manda nada ni describe ninguna
  práctica.

Que una cita CALLE sobre un dato no le da un valor distinto: eso sigue
valiendo para todo lo demás. Pero una regla que calla sobre un caso SÍ
puede hacer incumplible otra regla, así que aquí el silencio puede ser
parte del conflicto.

Si para ver que las dos chocan tienes que suponer un hecho que no está en
ninguna de las dos citas ni lo permite ninguna de las dos reglas,
responde "cumplibles_a_la_vez".`;

/** La marca que lleva en su bloque un hallazgo con `conflictoNormativo`, para que el verificador sepa a cuál hacerle
 *  la pregunta de la rama. Sin el campo, el bloque no lleva nada y es el de siempre. */
export function marcaDeConflictoNormativo(especie: string): string {
  return `MARCADO COMO CONFLICTO NORMATIVO (${especie})`;
}
