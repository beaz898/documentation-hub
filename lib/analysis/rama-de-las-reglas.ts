/**
 * LA RAMA DE LAS REGLAS DEL VERIFICADOR (3.4, fase 3 · contrato del arquitecto, 26/10/2026).
 *
 * Se añade al prompt del verificador del análisis rápido (verify-findings.ts) SÓLO cuando el lote trae algún hallazgo
 * marcado con `conflictoNormativo`: la pregunta de los valores distintos y sus tres veredictos siguen valiendo, sin
 * tocar, para todo lo que llegue sin el campo, y un lote sin marcas recibe el prompt de siempre, byte a byte. Texto del
 * arquitecto, literal: no se toca sin él.
 */
export const RAMA_DE_LAS_REGLAS = `CUANDO EL HALLAZGO VENGA MARCADO COMO CONFLICTO NORMATIVO:

Ese hallazgo no dice que las dos citas den valores distintos a un dato.
Dice otra cosa: que las dos citas son REGLAS y que no se pueden cumplir
las dos a la vez. Así que a ése, y sólo a ése, NO le hagas la pregunta de
los valores distintos. Hazle ésta:

    SI SE HACE LO QUE UNA DE LAS DOS PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?

Y si ninguna permite nada, sino que las dos obligan: ¿se pueden cumplir
las dos a la vez?

NO VALE RESPONDER «BASTA CON NO USAR EL PERMISO». Una regla que sólo se
puede cumplir renunciando a lo que la otra permite está en conflicto con
ella. Y lo que una regla PERMITE no es un hecho supuesto: es parte de lo
que dice.

VEREDICTOS para un hallazgo marcado así:
- "confirmado": si se hace lo que una permite, o si las dos obligan, no se
  pueden cumplir las dos.
- "cumplibles_a_la_vez": se pueden cumplir las dos, porque mandan sobre
  cosas que no se solapan, porque una delimita a la otra, o porque lo que
  parecía un choque se resuelve leyendo las dos enteras.
- "sin_relacion": no son reglas, o no mandan sobre el mismo procedimiento
  ni sobre la misma responsabilidad.

Que una cita CALLE sobre un dato no le da un valor distinto: eso sigue
valiendo para todo lo demás. Pero una regla que calla sobre un caso SÍ
puede hacer incumplible otra regla, así que aquí el silencio puede ser
parte del conflicto.

Si para ver que las dos reglas chocan tienes que suponer un hecho que no
está en ninguna de las dos citas ni lo permite ninguna de las dos reglas,
responde "cumplibles_a_la_vez".`;

/** La marca que lleva en su bloque un hallazgo con `conflictoNormativo`, para que el verificador sepa a cuál hacerle
 *  la pregunta de la rama. Sin el campo, el bloque no lleva nada y es el de siempre. */
export function marcaDeConflictoNormativo(especie: string): string {
  return `MARCADO COMO CONFLICTO NORMATIVO (${especie})`;
}
