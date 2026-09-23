/**
 * CONTADORES DE PIPELINE (F-82) — el mecanismo que hace cumplir el contrato.
 *
 * El contrato entero, con su diagnóstico y sus cinco cláusulas, está en
 * `claude/Contrato_Contadores.md`, escrito ANTES que este fichero y antes que
 * la columna que los guarda. Aquí va lo que el código puede hacer cumplir.
 *
 * QUÉ RESUELVE. La condición 3 de la regla de entrada (protocolo) exige que
 * todo cambio deje contador en producción. No había dónde: `logUsage` registra
 * llamadas a endpoints —una fila por llamada—, no piezas del pipeline
 * decidiendo; y `discardedFindings` es lo que NO hay que repetir, porque mezcla
 * descartes, recuentos de camino y averías bajo un nombre que dice
 * «descartados».
 *
 * CÓMO SE ESTROPEÓ AQUEL, porque es lo que este fichero existe para evitar. No
 * fue el nombre: fue que `bumpCount(counts, key: string)` aceptaba cualquier
 * cadena y que dos fusiones ciegas sobre `Object.entries`
 * (`pipeline.ts` y `synthesize.ts`) vuelcan la bolsa entera hacia arriba.
 * `verificado.por_celdas` no llegó a `discardedFindings` porque alguien lo
 * decidiera: llegó porque el destino de un contador lo decidía el CONTENEDOR y
 * no su autor.
 */

/**
 * Las etapas que pueden emitir contadores. CERRADA a propósito: añadir una es
 * una decisión que se toma aquí, no el efecto de escribir una cadena nueva en
 * otro fichero.
 *
 * `averia` está RESERVADA Y VACÍA a propósito (cláusula 2 del contrato): las
 * averías no se cuentan junto a las decisiones, porque una suma que mezcla un
 * fallo de etapa con un descarte legítimo no significa nada, y esa suma es
 * justo lo que alguien mirará dentro de tres meses. Hoy no la emite nadie; el
 * namespace queda apartado para que el día que haga falta no se invente sobre
 * la marcha.
 */
type Stage =
  | 'diff.tablas'
  | 'diff.vision'
  | 'diff.clave'
  | 'diff.celdas'
  | 'diff.clasificacion'
  | 'seleccion'
  | 'verificador'
  | 'averia';

/**
 * EL CATÁLOGO (cláusula 4). Un contador que no esté aquí no llega arriba: ni lo
 * acepta el compilador al emitirlo, ni lo transporta `mergeCounters` al
 * fundirlo. Añadir uno es añadirlo AQUÍ primero y emitirlo después; al revés no
 * viaja, y esa es toda la garantía.
 *
 * CLÁUSULA 5 — los nombres son literales y de vocabulario cerrado. Nada
 * derivado de datos del cliente puede entrar en esta lista: un espacio de
 * claves ilimitado haría el campo inagregable entre organizaciones (que es para
 * lo que existe) y metería contenido del cliente en telemetría.
 *
 * El `satisfies` de abajo es la CLÁUSULA 1 en el sistema de tipos: si alguien
 * añade un nombre sin apellido de etapa, esa línea NO COMPILA. El prefijo deja
 * de depender de que alguien se acuerde.
 */
export const COUNTER_CATALOGUE = [
  // seleccion — cuántas cosas dejó pasar cada filtro antes del juez. Son
  // recuentos de DECISIÓN y no resultados: miden el caudal de un filtro (qué
  // dejó pasar la etapa), no qué dicen los documentos. `contradictions_found`
  // es un resultado; esto es throughput.
  //
  // NO SON BANDERAS DISFRAZADAS, y es deliberado: la primera versión de este
  // arreglo iba a declarar `seleccion.sin_candidatos: 1`, un booleano vestido
  // de contador que solo dice algo cuando el análisis falla. Contar el CAUDAL
  // dice lo mismo —«no había candidatos» es `candidatos_recuperados: 0`— y
  // además dice algo en las pasadas normales: cuántos trae el retrieval de
  // media y cuántos descarta el rerank. Un contador que solo se mueve en el
  // caso malo no responde «¿sirvió de verdad?», que es para lo que existe el
  // campo (condición 3 de la regla de entrada).
  //
  // El descarte del rerank NO tiene contador propio: es la resta de los dos, y
  // un contador derivable es un contador que puede contradecir a sus fuentes.
  'seleccion.candidatos_recuperados',
  'seleccion.candidatos_seleccionados',
  // B.244 paso 1 — cuántos candidatos llegaron SIN valoración de confianza
  // utilizable. No es derivable de los otros dos, y por eso tiene clave
  // propia: mide si la señal con la que se ORDENA el corte sigue viva.
  //
  // ⚠️ SI ESTO SE ACERCA A `candidatos_seleccionados`, el criterio de
  // confianza se ha apagado y el corte lo decide el score. No es volver al
  // fallo —sigue siendo determinista— pero es un cambio de régimen, y sin
  // este contador sería mudo.
  'seleccion.candidatos_sin_confianza',
  // B.244 paso 2 — cuántos candidatos QUE EL MODELO HABÍA ELEGIDO tiró el
  // tope. No es la resta de recuperados menos seleccionados: esa resta
  // mezcla dos cosas distintas —los que el rerank descartó por criterio y
  // los que cortó por presupuesto— y hasta hoy no se podían separar.
  //
  // ⚠️ ES EL AGUJERO QUE B.244 TENÍA DESDE LA CONTABILIDAD: cada uno de
  // éstos es un juicio escrito por el modelo —con su razón y su confianza—
  // que se pagó en tokens de salida y se tiró sin leer.
  'seleccion.candidatos_cortados_por_tope',
  // B.251 — la otra mitad de la pérdida: los que el modelo NO nombró.
  'seleccion.candidatos_descartados_por_criterio',
  // ⚠️ Y LA SEÑAL QUE DICE SI LA ANTERIOR ES DE FIAR. Entradas del modelo
  // con un id que no casa con ningún candidato (`rerank.ts`, el `continue`
  // mudo). Su CERO es lo que hace cierta la palabra «criterio»; si sube,
  // parte de los «descartados por criterio» los quisimos y no supimos
  // resolverlos.
  'seleccion.candidatos_con_id_no_reconocido',
  // B.253 — entradas del modelo que repetían un candidato ya nombrado. Hasta
  // el 16/09/2026 cada repetición ENTRABA: ocupaba una plaza del tope y el
  // juez comparaba el mismo documento dos veces. Ahora se descarta, y esto
  // cuenta cuántas veces hizo falta. No es un cubo de pérdida: ningún
  // candidato se pierde por aquí.
  //
  // ⚠️ Y `descartados_por_criterio`, dos más arriba, es el ÚNICO de este grupo
  // que queda AUSENTE en el fallback del rerank (B.254): no hubo criterio. Los
  // demás valen 0 ahí, y ese cero es verdad.
  'seleccion.candidatos_repetidos_por_el_modelo',
  // B.248 (17/09/2026) — EL CORTE DE LA RECUPERACIÓN, en DOCUMENTOS: los que el
  // tope de MAX_CANDIDATOS_DE_RECUPERACION dejó fuera. Con el corpus de hoy vale
  // CERO, y ese cero es el dato: el día que se mueva, el corpus creció.
  //
  // ⚠️ AQUÍ HABÍA UNA SEGUNDA CLAVE, 'seleccion.candidatos_perdidos_por_umbral',
  // retirada el 23/09/2026 con las dos constantes del umbral: sin corte sólo
  // podía dar cero, y un contador que no puede moverse no vigila nada. El
  // histórico de esa clave SIGUE en las filas de 'analysis_results' y se
  // consulta con 'pipeline_counters ? ...'; retirarla del catálogo no borra una
  // sola fila, porque esa columna se escribe y no se relee por 'mergeCounters'.
  'seleccion.candidatos_cortados_por_tope_de_recuperacion',
  // diff.tablas — ETAPA NUEVA (F-88 P1). El emparejador de tablas: qué pares
  // se evaluaron y por qué puerta cayó cada uno.
  //
  // POR QUÉ HACE FALTA UNA ETAPA Y NO CABÍA EN LAS QUE HABÍA. `diff.clave`
  // cuenta lo que decide el descubrimiento de clave DENTRO de un par de tablas
  // ya elegido; `diff.celdas` compara celdas; `diff.clasificacion` reparte
  // filas ya emparejadas. Ninguna de las tres puede contar el par de TABLAS,
  // porque hasta F-88 nadie elegía pares: se recibían dos TableGroup ya
  // escogidos. La etapa nace con el emparejador, que es lo que la cabecera de
  // `Stage` exige — abrir una etapa es una decisión que se toma aquí.
  //
  // LA INVARIANTE QUE SOSTIENEN, y que su batería vigila:
  //   candidatos === sin_clave + sin_interseccion + emitidos
  // Es lo que hace cierta la regla de F-88 «todo lo demás se cuenta»: un par
  // evaluado no puede desaparecer sin dejar rastro en exactamente uno de los
  // tres destinos.
  //
  // NINGUNO LLEVA NOMBRE NI ID DE TABLA, y no por descuido: un `tableId` es
  // contenido del documento del cliente (cláusula 5). La identidad de las
  // tablas de un par viaja en el VALOR del hallazgo, nunca en la clave de un
  // contador.
  // diff.vision — LA CAPA DE ANTES DEL EMPAREJADOR (F-103 P3, pieza 2). Etapa
  // abierta el 07/09/2026, y por la misma razón de fronteras que abrió
  // `diff.tablas`: aquellos contadores dicen qué pasó DENTRO del emparejador
  // —cuántos pares se cayeron y por qué— y ninguno puede decir **qué le llegó**.
  // Son preguntas distintas y un cero de cada una significa lo contrario:
  // «miré y no había clave» frente a «no me llegó ni una tabla».
  //
  // Los dos lados se cuentan POR SEPARADO y no se suman: «2 tablas» no distingue
  // «una y una» —comparables— de «dos y ninguna», que es ceguera con buena pinta.
  // Y ninguna clave lleva nombre ni id de tabla (cláusula 5): la identidad viaja
  // en el valor del hallazgo.
  'diff.vision.pares_con_vision',
  'diff.vision.pares_ciegos',
  'diff.vision.ciegos_por_el_analizado',
  'diff.vision.tablas_analizado',
  'diff.vision.filas_analizado',
  'diff.vision.tablas_candidatos',
  'diff.vision.filas_candidatos',
  'diff.tablas.candidatos',
  'diff.tablas.sin_clave',
  'diff.tablas.sin_interseccion',
  'diff.tablas.emitidos',
  // B.117: la incidencia que el criterio de emparejamiento seguro (F-84 1b) no
  // tenía. Cuántas filas habrían emparejado distinto con la normalización
  // agresiva — el coste conocido de comparar en el nivel seguro. El productor
  // existía desde F-84 (`KeyCounts.discrepanciaPorNormalizar`, table-key.ts) y
  // se tiraba; el emparejador lo suma sobre todos los pares que evalúa.
  // El corpus dio CERO y ese cero no es una propiedad del mundo: estas tablas
  // se generaron programáticamente y no pueden producir un separador de
  // millares mal escrito. Solo los clientes reales pueden mover este número, y
  // por eso es la condición 3 de esa pieza.
  'diff.clave.rechazadas_por_escritura',
  // F-87 P3: cuántos diffs corren sobre documentos que todavía no están
  // indexados — el camino sin id, que es el más usado. NO se llama
  // `emitido_sin_identidad`: la identidad no falta, está PENDIENTE DE NACER
  // (F-87 P4). Declarado aquí y SIN PRODUCTOR TODAVÍA, a propósito: el diff no
  // corre en el pipeline hasta el commit de emisión, y la cláusula 4 manda
  // catalogar antes de emitir, nunca al revés.
  // diff.clasificacion — el reparto de la fase 2 del diff de tablas, con
  // VOCABULARIO CERRADO (cláusula 5). El reparto POR COLUMNA no está aquí a
  // propósito: sus claves serían nombres de columna del cliente, o sea
  // contenido del documento, y eso haría el campo inagregable entre
  // organizaciones además de meter datos del cliente en telemetría. Vive en
  // `TableDiffResult.porColumna`, que es el resultado de ESTE análisis.
  // `columnas_afectadas` es el NÚMERO, que sí es agregable.
  //
  // `solo_en_a` / `solo_en_b` son posicionales —a = documento analizado,
  // b = candidato— y no llevan el nombre ni el id de ningún documento: la
  // identidad de cada lado va en el valor del hallazgo, nunca en la clave.
  'diff.clasificacion.identicas',
  'diff.clasificacion.discrepantes',
  'diff.clasificacion.columnas_afectadas',
  'diff.clasificacion.solo_en_a',
  'diff.clasificacion.solo_en_b',
  'diff.clasificacion.pre_indexado',
  // F-88 P4: las filas que difieren SOLO en la escritura. No son
  // discrepancias —no entran al array ni a las columnas planas— pero tampoco
  // se callan. OJO AL LEERLO: `discrepantes` (arriba) las INCLUYE, porque lo
  // produce la fase 2 y cuenta todo lo que difiere. Lo que llega al array es
  // la resta: discrepantes − variantes_escritura. No se redefine
  // `discrepantes` para que cuadre: es un número medido con batería propia.
  // Es además la incidencia observable que B.97 dejó pendiente de ver en el
  // mundo real — el corpus no puede moverla, solo los clientes.
  'diff.clasificacion.variantes_escritura',
  // verificador — la cascada de F-25 (pipeline.ts). Recuentos de DECISIÓN:
  // cuántos hallazgos tomaron cada salida, no qué se encontró.
  'verificador.hallazgos_entrantes',
  'verificador.confirmados',
  'verificador.confirmados_por_estructura',
  'verificador.confirmados_por_juicio',
  'verificador.descartados',
  'verificador.reclasificados',
  // averia — ESTRENA LA ETAPA, que estaba declarada y vacía desde que se
  // escribió el catálogo. Aquí no se mide lo que el análisis ENCONTRÓ: se mide
  // que el propio sistema no supo algo de sí mismo.
  //
  // ⚠️ `exhaustivo_sin_clasificar`: el trabajo terminó sin declarar su clase de
  // coste, así que se le cobró el máximo POR DEFECTO y no por medida. El precio
  // no cambia con este contador — lo que cambia es que hasta el 15/09/2026 el
  // registro imprimía «coste heavy» EXACTAMENTE IGUAL para un exhaustivo que de
  // verdad fue pesado y para uno que nunca se clasificó, así que el sistema no
  // podía demostrar cuántas veces había cobrado el máximo sin haber clasificado
  // nada. Con la cifra delante se decidirá el precio; sin ella, decidirlo sería
  // elegir a ciegas entre cobrar de más a quien acertó y cobrar de menos a un
  // camino caro.
  'averia.exhaustivo_sin_clasificar',
  // ⚠️ LOS DOS DESCARTES DEL ANÁLISIS DE ESTILO — 15/09/2026, B.239.
  //
  // El filtro de `style-check.ts` tira lo que el modelo devuelve y no encaja, y
  // hasta hoy lo tiraba EN SILENCIO: `parsed.problems` no se comparaba nunca
  // contra lo que sobrevivía. El caso que lo destapó: una ambigüedad sembrada
  // —con consecuencia clínica— no apareció, y no había forma de saber si el
  // modelo no la vio o si el código se la comió.
  //
  // ⚠️ SON DOS CLAVES Y NO UNA, Y ÉSA ES TODA LA GRACIA: cada causa deja una
  // huella distinta, y un solo contador las sumaría sin poder separarlas.
  //
  //   · `por_tipo`   — el modelo etiquetó el problema con un tipo que no
  //     reconocemos (`puntuacion`, `gramatica`…). Es un CATÁLOGO INCOMPLETO, no
  //     un filtro con un agujero, y el arreglo sería otro.
  //   · `sin_ancla`  — el problema llegó sin `textRef` utilizable. Es la forma
  //     que deja una respuesta TRUNCADA por `maxOutputTokens`: el cliente repara
  //     el JSON cortado (`anthropic-client.ts:290`) y los últimos elementos
  //     llegan a medias.
  //
  // ⚠️ Y LA ETIQUETA DESCARTADA NO VA EN LA CLAVE, a propósito: sería un valor
  // inventado por el modelo, sin vocabulario cerrado, y haría el campo
  // inagregable — la misma razón por la que el reparto por columna no está en
  // este catálogo. Las etiquetas van en `analysis`, que es datos y no telemetría.
  'averia.estilo_descartado_por_tipo',
  'averia.estilo_descartado_sin_ancla',
  // ⚠️ 16/09/2026 — LA CITA QUE NO ESTÁ EN EL TEXTO. El prompt exige que
  // `textRef` sea una copia LITERAL «carácter por carácter», porque es lo que
  // permite señalar el problema en el editor. Nadie lo comprobaba: una cita
  // parafraseada pasaba el filtro, se guardaba, y el usuario veía un problema
  // que la interfaz no sabe dónde poner.
  //
  // ⚠️ NO SE DESCARTA EL HALLAZGO — hoy sólo se cuenta. Descartarlo sería tirar
  // un problema que puede ser bueno y estar mal citado, y esa decisión es del
  // director. Lo que no valía era que pasara en silencio.
  'averia.estilo_cita_no_encontrada',
] as const satisfies readonly `${Stage}.${string}`[];

export type CounterName = (typeof COUNTER_CATALOGUE)[number];

/**
 * Lo que se persiste en `analysis_results.pipeline_counters`. Parcial, y la
 * distinción entre AUSENTE y CERO es información, no un detalle:
 *   · ausente = esa etapa NO CORRIÓ.
 *   · 0       = corrió y decidió que no pasaba nada.
 * Un análisis que se para por falta de candidatos deja
 * `seleccion.candidatos_recuperados: 0` y NO deja
 * `seleccion.candidatos_seleccionados` — porque el rerank no llegó a
 * ejecutarse, y escribir un 0 ahí diría que se ejecutó y no seleccionó nada,
 * que es falso.
 * Se lee siempre por NOMBRE (cláusula 3), nunca por posición ni por cuántos hay.
 */
export type PipelineCounters = Partial<Record<CounterName, number>>;

const CATALOGUE = new Set<string>(COUNTER_CATALOGUE);

/**
 * NO HAY UN `bump(counters, name)` TODAVÍA, y es deliberado. El equivalente de
 * `bumpCount` haría falta el día que una etapa cuente de forma incremental (el
 * diff de tablas lo hará); hoy el único emisor construye su objeto de una vez.
 * Exportar un ayudante que no llama nadie es construir el sistema grande antes
 * que el contrato, que es justo lo que este fichero existe para no repetir.
 *
 * Cuando llegue, su firma es la del contrato: `name: CounterName`, nunca
 * `key: string` — ahí estuvo el agujero de `bumpCount`.
 */

/**
 * CLÁUSULA 4, y el punto de estrangulamiento del contrato. Tiene la misma forma
 * que las fusiones ciegas que viene a sustituir —recorre `Object.entries` y
 * suma— con una sola diferencia, que es la que importa: **lo que no está en el
 * catálogo se descarta y se avisa, en vez de viajar.** Hoy lo predeterminado es
 * «todo viaja»; aquí es «nada viaja si no se declaró».
 *
 * LA COMPROBACIÓN EN TIEMPO DE EJECUCIÓN NO SOBRA PESE AL TIPO: un
 * `PipelineCounters` releído del jsonb de `analysis_results`, o cruzado desde
 * el worker, llega como DATOS y no como código — ahí el tipo ya no protege
 * nada. El compilador cuida al que escribe; este `Set` cuida a lo que vuelve.
 *
 * Devuelve un objeto nuevo: ninguna parte se muta, para que fundir no pueda
 * cambiar lo que otra etapa ya emitió.
 */
export function mergeCounters(...partes: Array<PipelineCounters | undefined>): PipelineCounters {
  const out: PipelineCounters = {};
  for (const parte of partes) {
    if (!parte) continue;
    for (const [key, value] of Object.entries(parte)) {
      if (!CATALOGUE.has(key)) {
        console.warn(`[counters] contador_no_declarado "${key}" — descartado (ver claude/Contrato_Contadores.md, cláusula 4)`);
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        console.warn(`[counters] contador_no_numerico "${key}" (${typeof value}) — descartado`);
        continue;
      }
      const name = key as CounterName;
      out[name] = (out[name] ?? 0) + value;
    }
  }
  return out;
}
