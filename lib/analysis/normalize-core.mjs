/**
 * LAS TRES COMPARACIONES DE TEXTO DE LA CASA, EN UN SITIO AL QUE LLEGAN LOS DOS
 * MUNDOS (25/09/2026).
 *
 * ⚠️ POR QUÉ ESTE FICHERO EXISTE, Y NO ES UNA PREFERENCIA DE FORMATO. El examen
 * tenía su propia respuesta a «¿existe esta frase en este texto?»
 * —`text.includes(frase)`, exacta— y el producto la suya —`normalize()`, que
 * colapsa espacios—. **Dos implementaciones del mismo criterio, ya divergidas**:
 * el 25/09 el verificador de discriminantes declaró AUSENTES dos frases que
 * estaban en sus documentos, partidas por un salto de línea de la maquetación.
 * Un `NO_MEDIBLE` falso, con un mensaje que mandaba a buscar donde no estaba.
 *
 * `lib/examen/discriminantes.mjs` es `.mjs` porque `scripts/examen.mjs` lo
 * necesita, y un `.mjs` no puede importar un `.ts`. Por eso el criterio baja
 * aquí: **no para que lo compartan dos módulos, sino para que no haya dos
 * criterios.** `normalize.ts` lo re-exporta, así que ningún importador cambia.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ EL INVARIANTE DE CO-LOCACIÓN SE MUDA ENTERO Y NO SE REESCRIBE PARA
 * JUSTIFICAR UNA EXCEPCIÓN. Lo decidió el arquitecto el 25/09/2026: **se mueven
 * LAS TRES, no una.** Mover sólo `normalize` habría dejado a `esVarianteDeEscritura`
 * al otro lado y roto lo que el invariante protege; con las tres aquí, siguen sin
 * poderse leer por separado y el invariante llega intacto.
 *
 * ⚠️ Y UNA COSA QUE EL CENSO DE CONSUMIDORES ENSEÑÓ AL MUDARLO, porque cambia
 * QUÉ protege el invariante y conviene que no se pierda: **de los seis
 * consumidores de producción, los seis importan EXACTAMENTE UNA de las tres.**
 *     table-structure.ts → normalize          table-key.ts  → claveSegura
 *     table-diff.ts      → esVarianteDeEscritura   judge.ts → normalize
 *     retrieval.ts y finding-rules.ts → normalize (vía judge)
 * Ni uno importa dos. Así que la co-locación **nunca protegió al IMPORTADOR**
 * —que ya las lee por separado y siempre lo hizo— sino a **quien abre el fichero
 * a editarlas**: el que viene a tocar una y tiene la otra delante con su aviso.
 * Eso sigue siendo cierto aquí y por eso la mudanza es legítima, pero la
 * afirmación «no se pueden leer por separado» era más ancha que su población.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LOS TIPOS VIAJAN EN JSDoc Y NO SON DECORADO: `tsconfig.json` tiene
 * `allowJs: true`, y TypeScript lee estas anotaciones para tipar lo que los
 * `.ts` importan. Sin ellas, cada parámetro sería `any` y `normalize(42)`
 * compilaría — que es perder una garantía que hoy existe. Hay un caso decisivo
 * de esto en `normalize.test.ts`.
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
 *
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
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
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function esVarianteDeEscritura(a, b) {
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
 *
 * @param {string} s
 * @returns {string}
 */
export function claveSegura(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
