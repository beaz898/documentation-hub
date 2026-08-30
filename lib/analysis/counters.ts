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
