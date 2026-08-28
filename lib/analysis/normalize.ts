/**
 * F-61: extraída de judge.ts a su propio fichero — sin cambiar una línea de
 * su cuerpo ni de su doctrina — porque table-structure.ts pasa a necesitarla
 * (para `alignQuoteToCells`) y judge.ts ya importa de table-structure.ts
 * (`getOrderedColumns`, `groupChunksByTable`, `renderTableBlock`): que
 * table-structure.ts importara `normalize` desde judge.ts habría cerrado un
 * ciclo (judge -> table-structure -> judge). judge.ts sigue exportando
 * `normalize` desde el mismo sitio de siempre (`export { normalize }`), así
 * que ningún import existente (`from './judge'`, en retrieval.ts y
 * finding-rules.ts) cambia.
 */

/**
 * Normaliza para comparación fuzzy. La clase de caracteres ignorados incluye
 * el marcado Markdown (* _ # ` ~) junto a la puntuación: el LLM cita el
 * texto VISIBLE del documento ("24 HORAS"), no el marcado que lo envuelve
 * en la fuente ("**24 HORAS**"), así que ambos deben normalizar igual para
 * que la comparación coincida.
 *
 * F-46: el colapso de filas idénticas (retrieval.ts, F-44) y el solapamiento
 * estructural que construye sobre él (F-45) descansan enteros en esta
 * función — "idéntica" significa "igual tras normalize()", nada más. Hoy NO
 * toca tildes (deliberado, "fallo del lado seguro": un acento distinto
 * rompe el match exacto). Cualquier ampliación de esta función — tildes,
 * sinónimos, distancia de edición — es una ampliación de lo que ese colapso
 * considera "la misma fila", y debe pasar por su batería de medición antes
 * de tocarse: ensancharla sin medir podría hacer que una discrepancia real
 * (la propia contradicción que el sistema busca) se trague como idéntica.
 *
 * F-61: es también lo que decide, dentro de una fila ya localizada, si un
 * valor citado coincide con el de una celda (`alignQuoteToCells`,
 * table-structure.ts) — la misma cautela con tildes aplica ahí: "Auxiliar
 * clinica" (sin tilde) y "Auxiliar clínica" (real) normalizan distinto y NO
 * verifican, a propósito.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"""''«»()[\]{}\-—–…*_#`~]/g, '')
    .trim();
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * EN ESTE FICHERO HAY DOS COMPARACIONES Y NO SON INTERCAMBIABLES (F-82 P2).
 *
 *   `normalize`               BUSCAR   — agresiva. Para localizar una cita en
 *                                        un documento: sobra tolerancia,
 *                                        porque el coste de no encontrar algo
 *                                        que está es alto.
 *   `esVarianteDeEscritura`   COMPARAR — conservadora. Para decidir si dos
 *                                        valores de celda dicen lo mismo: aquí
 *                                        el coste de fundir de más es esconder
 *                                        un hallazgo.
 *
 * Viven juntas a propósito. El modo de fallo de esto es IMPORTAR LA QUE NO
 * ERA, y la única defensa contra eso es que no se puedan leer por separado —
 * mismo criterio por el que table-key.ts no se partió.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * ¿Son `a` y `b` el MISMO valor escrito de otra manera?
 *
 * `false` si son idénticos (eso no es una variante, es identidad) y `false` si
 * difieren en algo que no sea caja o espacios. Es el nivel intermedio de los
 * tres con los que la fase 2 clasifica una celda: idéntico / VARIANTE DE
 * ESCRITURA / discrepancia plena.
 *
 * ⚠️ POR QUÉ NO TOCA PUNTUACIÓN, y por qué no es timidez. Alguien va a querer
 * «mejorar» esto dentro de seis meses añadiendo «los caracteres inocuos». No
 * los hay:
 *
 *   «SEGURO» NO ES PROPIEDAD DEL CARÁCTER, ES DEL CONTEXTO.
 *
 * El mismo punto es inocuo en «Dr. Pablo» y catastrófico en «45.0» → «450».
 * Así que NO EXISTE un subconjunto de la clase de `normalize` que salve a uno
 * y condene al otro: es el mismo carácter. La alternativa a no tocar
 * puntuación no es una lista más fina — es que no hay lista.
 *
 * EL EJEMPLO MÁS CLARO ES EL GUION: «-5» contra «5» no es una variante de
 * escritura, es un SIGNO. Y por el mismo camino van «25,00» contra «2500» (un
 * factor de cien), «10:30» contra «1030», «12-345-678» contra «12345678»,
 * «~50» contra «50» y «(500)» contra «500». `normalize` funde los seis;
 * medido, funde 26 de 28 pares realistas.
 *
 * LO QUE SÍ HACE, y es todo lo que se puede hacer sin arriesgar: minúsculas,
 * colapso de espacios y `trim`. Ninguna de las tres puede cambiar el valor de
 * una celda.
 *
 * NO toca tildes, por la misma razón que `normalize` (F-46): «Chamberí» y
 * «Chamberi» son valores distintos y tienen que seguir siéndolo.
 */
export function esVarianteDeEscritura(a: string, b: string): boolean {
  if (a === b) return false;
  return claveSegura(a) === claveSegura(b);
}

/**
 * La forma canónica del nivel seguro: minúsculas, espacios colapsados y `trim`.
 * Nada más — ver el aviso de `esVarianteDeEscritura` sobre por qué no toca
 * puntuación.
 *
 * NACIÓ PRIVADA Y SE EXPORTÓ EN F-84 1b, y conviene decir por qué cambió. El
 * comentario original decía «no se exporta para que nadie pueda construir una
 * clave con su salida ni indexar por ella». Esa prohibición se escribió desde
 * la fase 2, donde lo único que se hace es PREGUNTAR si dos valores son el
 * mismo, y era demasiado ancha: la fase 1 indexa filas por su clave, y para eso
 * un predicado no sirve — un `Map` necesita una cadena.
 *
 * LA CONDICIÓN QUE SUSTITUYE A LA PROHIBICIÓN: quien indexe con esto no puede
 * después comparar con una función MÁS GRUESA, porque emparejaría filas cuyas
 * claves eran distintas al indexarlas. Es la regla de la cabecera de
 * table-key.ts, y sigue siendo la que manda.
 *
 * Y LAS DOS SE MANTIENEN JUNTAS POR CONTRATO:
 *   claveSegura(a) === claveSegura(b)  ⟺  a === b || esVarianteDeEscritura(a, b)
 * La equivalencia está fijada en normalize.test.ts para que no puedan
 * separarse: si alguien toca una y no la otra, se pone rojo.
 */
export function claveSegura(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
