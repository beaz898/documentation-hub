import { createHash } from 'crypto';

/**
 * HUELLA DE UN HALLAZGO (F-84 paso 2, ampliado en F-86 paso 2).
 *
 * DOS ESPECIES BAJO UN CONTRATO COMÚN. El descarte del usuario opera sobre
 * TODAS las discrepancias, y no todas tienen fila ni clave:
 *
 *   TABULAR — `huellaDeHallazgo`. Tabla + las dos claves crudas + columna.
 *   PROSA   — `huellaDeProsa`. Los dos textos citados, uno por lado.
 *
 * NO SE FUERZA UNA SOLA FUNCIÓN, y el motivo es que forzarla obligaría a la
 * tabular a degradarse a texto o a la prosa a fingir una estructura que no
 * tiene. Lo que SÍ es uno solo es el contrato, y vale para las dos:
 *
 *   · Par de documentos en ORDEN CANÓNICO POR ID, nunca por rol.
 *   · Los dos lados dentro de la tupla, cada dato ATADO a su lado.
 *   · Componentes con PREFIJO DE LONGITUD, nunca un separador.
 *   · sha256.
 *   · CÁLCULO SOLO EN SERVIDOR. El cliente pide, no calcula.
 *
 * QUÉ RESPONDE, y no es lo que responde el diff. La fase 1 responde «qué fila
 * va con qué fila» y la fase 2 «qué difiere». Ésta responde otra cosa:
 *
 *   ¿ESTE HALLAZGO ES EL MISMO QUE EL USUARIO YA JUZGÓ?
 *
 * Es identidad EN EL TIEMPO, no en una ejecución, y por eso vive fuera de las
 * dos fases: quien la necesita es la emisión, que es la que sabe de qué
 * documentos viene cada lado. La fase 1 no aprende nada de esto — «qué fila va
 * con qué fila» no depende de cómo se llamen los documentos.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ ORDENA POR DENTRO, que es la propiedad entera de este módulo.
 *
 * El pipeline no tiene un orden canónico de documentos: el orden lo fija el
 * ROL (el documento analizado contra el candidato recuperado), y ese rol se
 * INVIERTE cuando mañana se analiza el otro documento del par. Si la huella
 * dependiera del orden en que llegan los lados, el mismo par de filas
 * produciría dos identidades distintas según cuál se subiera primero, y el
 * sistema OLVIDARÍA lo que el usuario ya decidió. Eso rompe F-67 en su
 * consecuencia —«y su decisión vale»—, no solo en su letra.
 *
 * Por eso el orden NO es responsabilidad de quien llama. Quien va a llamar es
 * la emisión, que tiene los lados por rol y se los pasaría en ese orden: si
 * ordenar fuera cosa suya, este módulo no arreglaría nada.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * EL LÍMITE CONOCIDO, ACEPTADO Y DECLARADO: la huella incluye el NOMBRE DE LA
 * COLUMNA. Si el cliente renombra una columna entre dos subidas —«Precio base»
 * a «Precio»—, la huella de esas filas cambia y la adjudicación que el usuario
 * hubiera hecho sobre ellas SE PIERDE: volverán a aparecer como hallazgos
 * nuevos. Se acepta porque la alternativa —no incluir la columna— haría que dos
 * discrepancias distintas de la misma fila compartieran identidad, que es peor:
 * aceptar una borraría la otra. Está fijado como caso en la batería para que
 * sea una propiedad declarada y no una sorpresa.
 */

/**
 * Un lado del hallazgo: el documento, SU TABLA y el valor de clave de su fila.
 * Los tres datos van ATADOS a propósito — separar cualquiera de ellos del id es
 * exactamente el fallo que este módulo existe para impedir, porque al reordenar
 * por id habría que acordarse de reordenar los demás con él.
 *
 * ⚠️ `tabla` ESTÁ AQUÍ Y NO EN LA CABECERA, y costó un test rojo descubrirlo.
 * La primera versión tomaba UNA tabla para el hallazgo entero, como si las dos
 * filas vinieran de la misma. No vienen: cada lado tiene su documento y su
 * tabla, y sus identificadores pueden diferir. Medido sobre el corpus —OPE-10
 * es «Tarifas#0» y OPE-11 es «Tarifas concertadas#0»—, pasar la tabla del lado
 * «nuevo» hacía que la huella cambiara al invertir la dirección: exactamente el
 * fallo que este módulo existe para evitar, colado por la puerta de al lado.
 *
 * La lección, que vale para cualquier componente que se añada mañana: TODO LO
 * QUE PERTENECE A UN DOCUMENTO VIAJA CON SU ID. Lo que quede suelto en la
 * cabecera tiene que ser común a los dos lados de verdad, no por casualidad.
 */
export interface LadoDeLaHuella {
  /** `documents.id` del documento de este lado. */
  id: string;
  /** `tableId` de la tabla de este lado, dentro de su documento. */
  tabla: string;
  /** El valor de clave de la fila, EN CRUDO — sin normalizar. Ver abajo. */
  claveCruda: string;
}

/**
 * Une los valores de una clave COMPUESTA en la cadena única que
 * `huellaDeHallazgo` espera. Existe para que quien llama no tenga que inventar
 * un separador: usa la misma codificación con prefijo de longitud que el resto
 * del módulo, así que ("A", "B") y ("A|B",) no pueden producir lo mismo.
 */
export function unirClave(valores: string[]): string {
  return codificar(valores);
}

/**
 * Codificación INYECTIVA de una lista de componentes.
 *
 * POR QUÉ NO HAY UN SEPARADOR SEGURO, y por eso no se usa ninguno. Un valor de
 * celda es lo que el cliente escribió: cualquier carácter imprimible puede
 * aparecer dentro. `table-key.ts` usa `␟` para juntar claves compuestas con el
 * argumento de que ninguna hoja de cálculo lo contiene — es razonable, pero es
 * una suposición sobre los datos del cliente, y para una IDENTIDAD PERSISTENTE
 * no basta: dos tuplas distintas que colisionaran producirían el mismo
 * hallazgo, y aceptar uno borraría el otro.
 *
 * Con prefijo de longitud no hace falta suponer nada. Cada componente se
 * escribe como `<longitud>:<valor>`, así que la cadena se puede volver a
 * separar leyendo la longitud — y dos listas distintas no pueden producir la
 * misma cadena, contengan lo que contengan. `["a:b", "c"]` da `3:a:b1:c` y
 * `["a", "b:c"]` da `1:a3:b:c`: distintas, como deben ser.
 */
function codificar(componentes: string[]): string {
  return componentes.map(c => `${c.length}:${c}`).join('');
}

/**
 * La huella. sha256 en hexadecimal sobre la tupla, con el orden de componentes
 * FIJO: idA, tablaA, claveA, idB, tablaB, claveB, columna — con A y B ya
 * ordenados canónicamente.
 *
 * `columna` es lo ÚNICO que queda fuera de los lados, y eso NO es una propiedad
 * del dato: es una CONDICIÓN que hoy se cumple y mañana podría no cumplirse.
 *
 *   `columna` puede estar en la cabecera SOLO mientras las columnas se
 *   emparejen por IGUALDAD EXACTA DE NOMBRE. Si eso cambia, `columna` pasa a
 *   los lados, como la tabla.
 *
 * Verificado hoy: la fase 2 decide qué columnas compara con
 * `nueva.columns.filter(c => existente.columns.includes(c))`
 * (table-diff.ts:186), e `includes` compara con igualdad estricta — la misma
 * cadena en los dos documentos, byte a byte. La nominación de la fase 1 usa el
 * mismo criterio (table-key.ts:395).
 *
 * PERO ES LA MISMA PUERTA POR LA QUE ENTRÓ LA TABLA. Si algún día el
 * emparejamiento de COLUMNAS tolerara variantes de escritura —justo lo que
 * F-84 1b acaba de hacer con las FILAS—, «Precio base» y «precio base» serían
 * la misma columna con dos nombres, y la huella volvería a depender de qué
 * documento llegó primero. La tabla ya está blindada por estar atada a su lado;
 * la columna lo está solo por esta condición, que por eso se escribe aquí.
 *
 * VALORES EN CRUDO, SIN NORMALIZAR, y es deliberado: normalizar antes de
 * hashear fundiría identidades distintas. Dos filas cuyas claves sean «IMP-01»
 * e «IMP01» son dos hallazgos distintos —el emparejamiento ya decidió que no
 * son la misma fila (F-84 1b)—, y darles la misma huella haría que juzgar uno
 * silenciara el otro.
 */
export function huellaDeHallazgo(params: {
  a: LadoDeLaHuella;
  b: LadoDeLaHuella;
  /** La columna en la que difieren. Ver el límite declarado en la cabecera. */
  columna: string;
}): string {
  const { a, b, columna } = params;
  const [primero, segundo] = ordenCanonico(a, b, x => x.claveCruda);

  const tupla = codificar([
    primero.id, primero.tabla, primero.claveCruda,
    segundo.id, segundo.tabla, segundo.claveCruda,
    columna,
  ]);

  return createHash('sha256').update(tupla, 'utf8').digest('hex');
}

/**
 * ORDEN CANÓNICO: los dos lados ordenados por comparación de cadena de su `id`,
 * ascendente. Con `<` sobre las cadenas y NO con `localeCompare`, que depende
 * de la configuración regional del proceso: dos servidores podrían ordenar
 * distinto y producir dos huellas para el mismo hallazgo, que es justo lo que
 * este módulo evita.
 *
 * La clave viaja ATADA a su id y se reordena CON él, porque van en el mismo
 * objeto. Desalinearlas es imposible por construcción, no por cuidado.
 *
 * EL EXTREMO — LOS DOS ID IGUALES. Significa que se está comparando un
 * documento consigo mismo, que el pipeline no debería producir nunca
 * (`excludeDocumentId` saca el analizado de sus propios candidatos). No se
 * lanza —esto lo llamará la emisión, y tumbar un análisis entero por esto sería
 * peor que el fallo— pero tampoco se deja al azar del comparador: se desempata
 * por `claveCruda`, que mantiene la huella determinista Y simétrica también en
 * ese caso, y se avisa por consola porque señala un fallo más arriba.
 */
function ordenCanonico<T extends { id: string }>(
  a: T, b: T, desempate: (x: T) => string,
): [T, T] {
  if (a.id === b.id) {
    // EL AVISO NOMBRA LA CONDICIÓN, NO EL VALOR. Lleva el `documentId` —un
    // identificador interno, que es lo que hace el aviso accionable— y NO la
    // `claveCruda` ni ninguna celda: eso es contenido del documento del cliente
    // y no va a los logs. Si alguien añade la clave aquí para «depurar mejor»,
    // está metiendo texto del cliente en la telemetría, que es la misma regla
    // que vigila usage-stats.ts:14 y la cláusula 5 del contrato de contadores.
    console.warn(
      `[huella-hallazgo] id_repetido "${a.id}" — los dos lados son el mismo documento; ` +
      `se desempata por clave. Señala un fallo en quien construyó el par.`,
    );
    return desempate(a) <= desempate(b) ? [a, b] : [b, a];
  }
  return a.id < b.id ? [a, b] : [b, a];
}

// ── LA ESPECIE PROSA (F-86 paso 2) ─────────────────────────────────────────

/**
 * Un lado de un hallazgo de PROSA: el documento y el texto que se citó de él.
 * Atados, por la misma razón que en la tabular — al reordenar por id hay que
 * reordenar el texto con él, y que eso sea imposible de olvidar es la propiedad
 * entera del módulo.
 */
export interface LadoDeProsa {
  /** `documents.id` del documento de este lado. */
  id: string;
  /** La cita, EN CRUDO. Sin normalizar y sin recortar. */
  textoCitado: string;
}

/**
 * La huella de un hallazgo de prosa. Mismo contrato que la tabular: orden
 * canónico por id, los dos lados dentro, prefijo de longitud, sha256.
 *
 * QUÉ SUSTITUYE. `makeDiscrepancyFingerprint` (double-check.ts) hacía esto
 * mismo con cinco defectos, todos verificados en F-86: se construía SOLO con el
 * texto del lado analizado —así que invertir la dirección cambiaba la huella—,
 * estaba duplicada a mano en cliente y servidor, viajaba sin hashear, usaba una
 * barra como separador sobre texto en crudo, y recortaba la cita a 80
 * caracteres. Ésta arregla los cinco.
 *
 * ⚠️ EL LÍMITE DECLARADO DE ESTA ESPECIE, y es peor que el de la tabular.
 *
 *   LA IDENTIDAD DE PROSA DERIVA DE TEXTO ESCRITO POR UN MODELO.
 *
 * La tabular se construye con claves de celda: el cliente las escribió y no
 * cambian solas. Ésta se construye con la CITA que el juez emitió, y una
 * paráfrasis del modelo —la misma contradicción citada con otras palabras en un
 * análisis posterior— produce OTRA huella. El usuario vería volver algo que ya
 * cerró.
 *
 * SE DECLARA, NO SE RESUELVE HOY, y tiene sucesor conocido: cuando las citas
 * pasen a ser POR REFERENCIA (`{fragmentId, ancla}`, la cura estructural de
 * F-80/B.107 — que el texto lo extraiga el CÓDIGO y no el modelo), la identidad
 * de prosa dejará de derivar de texto generado y este límite desaparecerá sin
 * tocar esta función: solo cambia qué se le pasa.
 *
 * Y AUN CON ESE LÍMITE MEJORA A LA QUE SUSTITUYE en lo que importa: es
 * bidireccional, lleva los DOS lados —la vieja solo el analizado— y va hasheada.
 * Un límite conocido es mejor que cuatro defectos y un límite.
 */
export function huellaDeProsa(params: { a: LadoDeProsa; b: LadoDeProsa }): string {
  const { a, b } = params;
  const [primero, segundo] = ordenCanonico(a, b, x => x.textoCitado);

  const tupla = codificar([
    primero.id, primero.textoCitado,
    segundo.id, segundo.textoCitado,
  ]);

  return createHash('sha256').update(tupla, 'utf8').digest('hex');
}
