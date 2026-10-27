/**
 * LA RAMA DE LAS REGLAS DEL VERIFICADOR (3.4, fase 3 · contrato del arquitecto, 26/10/2026; corregido el mismo día;
 * el principio, 27/10/2026).
 *
 * Se añade al prompt del verificador del análisis rápido (verify-findings.ts) SÓLO en el lote de los hallazgos
 * marcados con `conflictoNormativo`, que van en su propio lote: los no marcados reciben el prompt de siempre, byte a
 * byte, con la pregunta de los valores distintos y sus tres veredictos. Texto del arquitecto, literal: no se toca sin
 * él. La corrección del 26/10 añade la pregunta de la práctica (norma_contra_practica), que el primer texto no tenía y
 * cuyo «sin_relacion» —«no son reglas»— la habría descartado siempre.
 * El 27/10 entra la pregunta del principio, con su caso en cada veredicto, y «sin_relacion» pasa de «una de las dos
 * no manda nada» a «NINGUNA de las dos»: la mitad de D que escoge el juez, §3.1 de CLI-12, no manda nada y habría
 * muerto aquí. Es el par de excepcion-de-las-reglas.ts: un cambio de criterio allí se revisa aquí.
 */
export const RAMA_DE_LAS_REGLAS = `CUANDO EL HALLAZGO VENGA MARCADO COMO CONFLICTO NORMATIVO:

Ese hallazgo no dice que las dos citas den valores distintos a un dato.
Dice otra cosa: que no se pueden cumplir las dos a la vez. Así que a ése,
y sólo a ése, NO le hagas la pregunta de los valores distintos. Hazle la
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

VEREDICTOS para un hallazgo marcado así:
- "confirmado": si se hace lo que una permite, o si las dos obligan, no se
  pueden cumplir las dos. O, si una describe lo que se hace: lo que se
  hace no cumple la regla. O, si una enuncia un principio: la otra
  permite justo lo que ese principio excluye.
- "cumplibles_a_la_vez": se pueden cumplir las dos, porque mandan sobre
  cosas que no se solapan, porque una delimita a la otra, o porque lo que
  parecía un choque se resuelve leyendo las dos enteras. O, si una
  describe lo que se hace: lo que se hace SÍ cumple la regla. O, si una
  enuncia un principio: lo que la otra permite no es lo que ese principio
  excluye.
- "sin_relacion": no se refieren al mismo procedimiento ni a la misma
  responsabilidad, o ninguna de las dos manda nada, describe una práctica
  NI ENUNCIA UN PRINCIPIO.

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
