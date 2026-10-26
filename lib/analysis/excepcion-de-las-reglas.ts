/**
 * LA EXCEPCIÓN DE LAS REGLAS (3.4, fase 2 · contrato del arquitecto, 26/10/2026).
 *
 * El bloque que el prompt del juez lleva justo DESPUÉS de la regla de oro (judge.ts), añadido como la excepción del
 * sujeto: no reescribe la definición de la verdad, que es correcta para datos, sino que le añade al lado que dos
 * REGLAS no se comparan como datos. Texto del arquitecto, literal: no se toca sin él. Los dos valores del campo son los
 * de conflicto-normativo.ts, y la frontera (llm-boundary.ts) los copia y cuenta lo que no sea uno de ellos.
 */
export const EXCEPCION_DE_LAS_REGLAS = `EXCEPCIÓN, SÓLO CUANDO LOS DOS TEXTOS SON REGLAS:

Todo lo anterior vale para DATOS: cifras, plazos, nombres, precios,
frecuencias. Un dato tiene un valor, y hay contradicción cuando los dos
textos le dan valores distintos.

Pero hay textos que no afirman un dato: MANDAN. Obligan, permiten,
prohíben, reparten responsabilidades o fijan un procedimiento. A esos
textos la pregunta de la verdad no se les puede hacer, porque una regla
no es verdadera ni falsa: SE CUMPLE O NO SE CUMPLE.

Así que cuando los dos textos sean reglas, y SÓLO entonces, hazte además
esta segunda pregunta:

    ¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?

Y ten cuidado con un atajo que la haría inútil. Si una de las dos PERMITE
algo, siempre se puede «cumplir las dos» renunciando a usar el permiso.
Eso no es cumplirlas: es dejar una sin efecto. Así que cuando una permita
algo, la pregunta es ésta:

    SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?

Si la respuesta es no, HAY HALLAZGO. No vale contestar «basta con no usar
el permiso»: una regla que sólo se puede cumplir renunciando a lo que la
otra permite está en conflicto con ella.

Y LO QUE UNA DE LAS DOS REGLAS PERMITE NO ES UN HECHO SUPUESTO: es parte
de lo que la regla dice. Usar el permiso para ver si choca con la otra no
es inventarse nada.

Ese hallazgo lleva el campo "conflictoNormativo", con uno de estos dos
valores:

- "norma_contra_norma": las dos son reglas, y no se pueden cumplir las dos.
- "norma_contra_practica": una es una regla y la otra describe lo que se
  hace de verdad. Aquí la pregunta es más simple: ¿LO QUE SE HACE CUMPLE
  LA REGLA? Si no la cumple, hay hallazgo.

ORDEN OBLIGATORIO: primero aplicas todo lo de arriba. Si los dos textos
dan valores distintos al mismo dato, es una contradicción normal y NO
lleva el campo. Esta excepción es sólo para lo que la regla de oro
dejaría pasar: reglas incompatibles que no discuten ningún dato.

CÓMO SE DISTINGUE DE UNA CONTRADICCIÓN NORMAL: mira SOBRE QUÉ manda cada
regla.
- Si las dos mandan sobre LA MISMA cosa, y una la permite y la otra la
  prohíbe, es una CONTRADICCIÓN NORMAL y NO lleva el campo. Es el caso de
  "la política prohíbe el teletrabajo" frente a "se permite el teletrabajo
  3 días por semana": las dos regulan el teletrabajo.
- CONFLICTO NORMATIVO es cuando las dos mandan sobre COSAS DISTINTAS —una
  sobre quién puede ocupar un cargo y la otra sobre quién firma un gasto,
  por ejemplo— y aun así no se pueden cumplir juntas.

EJEMPLO DE "norma_contra_norma":
- Regla 1: "El encargado del taller puede ser el mismo socio que el
  tesorero."
- Regla 2: "Las compras de material las firma el encargado del taller y
  las paga el tesorero, y nunca la misma persona puede hacer las dos
  cosas, para que ningún gasto quede sin un segundo par de ojos."
Las dos frases pueden ser verdaderas a la vez, y ninguna le da otro valor
a un dato de la otra: la primera manda sobre qué cargos puede acumular un
socio, la segunda sobre quién firma y quién paga. Pero si se hace lo que
la primera PERMITE —un socio en los dos cargos—, NINGUNA COMPRA PUEDE
CUMPLIR LA SEGUNDA. No vale decir «pues que no acumule los cargos»: eso
es dejar sin efecto la primera.

EJEMPLO DE "norma_contra_practica":
- Regla: "Las compras de material se firman antes de hacer el pedido."
- Práctica: "El taller pide el material y el encargado firma la hoja de
  compra al recibirlo, cuando ya se sabe el importe exacto."
La segunda no afirma nada falso: describe lo que se hace. Pero lo que se
hace no cumple la regla.

EJEMPLOS DE LO QUE NO ES CONFLICTO NORMATIVO:
- "Las compras de obra las firma el presidente" frente a "las compras de
  material ordinario las firma el encargado del taller": mandan sobre
  cosas que no se solapan, y se completan. Una regla general y otra bien
  delimitada no son un conflicto.
- "El control se hace cada semana" frente a "el control se hace cada mes":
  eso SÍ es un dato con dos valores. Es contradicción normal y NO lleva el
  campo.
- Una regla y la razón por la que existe no son dos reglas: que un texto
  explique su propio criterio no lo pone en conflicto con nada.
- SI PARA VER EL CONFLICTO TIENES QUE SUPONER UN HECHO QUE NO ESTÁ EN
  NINGUNO DE LOS DOS TEXTOS NI LO PERMITE NINGUNA DE LAS DOS REGLAS, NO
  HAY HALLAZGO.

CUANDO EMITAS UN HALLAZGO DE ESTE TIPO, el elemento del JSON lleva el
campo así:
{ "topic": "…", "newDocSays": "…", "existingDocSays": "…",
  "severity": "contradiction", "conflictoNormativo": "norma_contra_norma" }`;
