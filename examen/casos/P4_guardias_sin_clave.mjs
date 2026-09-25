/**
 * P4 · RRHH-08 (asignación de guardias) contra OPE-13 (cobertura por clínica).
 *
 * ⚠️ NIVEL: **LA DEGRADACIÓN CUANDO NO HAY CLAVE DE EMPAREJAMIENTO.**
 * NO mide «diferencias entre filas de personas», que es lo que el nombre de los
 * ficheros sugiere. Este par **no llega nunca al emparejamiento**: cae por la
 * PRIMERA puerta, y lo que mide es lo que pasa DESPUÉS de que el emparejador se
 * rinda. Decisión del director del 25/09/2026, que corrigió su propia premisa:
 * «se escribe con el criterio que tú has encontrado, no con el mío».
 *
 * Camino que ejercita: `table-key.ts` **falla a propósito** (`pares = 0`) →
 * `emparejamiento-juez.ts` → `a_juicio.sin_clave` y
 * `a_juicio.columna_no_comparada` → **la llamada corta del juez**.
 *
 * ⚠️ POR QUÉ NO HAY CLAVE, Y ESTÁ MEDIDO, NO SUPUESTO.
 * `corpus-pruebas/SIEMBRA_guardias_cobertura.md` abre declarando su método:
 *   «Este fichero se escribió MIDIENDO los dos .xlsx, no describiendo la
 *   intención con la que se fabricaron. … Si alguna cifra contradice lo que se
 *   quiso sembrar, MANDA EL FICHERO.»
 *
 * La columna de identidad se llama DISTINTO a propósito —`Profesional` en
 * RRHH-08 frente a `Responsable` en OPE-13—, así que **no es compartida y no
 * puede ser clave**. Las tres compartidas son `Clínica`, `Especialidad`, `Turno`
 * y ninguna llega al umbral `MIN_UNIQUE_PCT = 90`:
 *   simples:     Clínica 14 % · Especialidad 29 % · Turno 14 %
 *   compuestas:  Clínica+Especialidad 57 % · Clínica+Turno 29 % ·
 *                Especialidad+Turno 50 % (RRHH-08) / 57 % (OPE-13)
 * «Todas muy por debajo de 90, y el margen importa: la trampa de una siembra así
 * no es la columna suelta, es la COMPUESTA.»
 * Resultado del emparejador, en las dos direcciones: **`pares = 0`,
 * `sinInterseccion = 0`** — el par no aparece en NINGUNA de las dos listas.
 *
 * Es el hueco legítimo del juez que F-92 identificó: **el mismo dato bajo otro
 * nombre de columna.**
 *
 * ---------------------------------------------------------------------------
 * VERIFICADO CELDA A CELDA CONTRA LOS .xlsx — 25/09/2026. El registro es exacto.
 *   RRHH-08 cabecera: Profesional | Clínica | Especialidad | Turno | Horas semana
 *   OPE-13  cabecera: Responsable | Clínica | Especialidad | Turno | Jornada semanal
 *   Belmonte: Chamberí|Endodoncia|**Mañana**|32   vs  Chamberí|Endodoncia|**Tarde**|32
 *   Medina:   Retiro|Cirugía|Tarde|**44**         vs  Retiro|Cirugía|Tarde|**40**
 */

export default {
  id: 'P4',
  nivel: 'degradacion-sin-clave',

  analizado: 'RRHH-08_asignacion-de-guardias.xlsx',
  corpusExacto: ['OPE-13_cobertura-por-clinica.xlsx'],

  modo: 'rapido',
  pasadas: 5,

  /**
   * ⚠️ LA PRECONDICIÓN DEL CASO, Y SE COMPRUEBA ANTES QUE EL RESULTADO.
   * Si `pares` sale distinto de 0, este caso **no está midiendo lo que cree**:
   * significaría que el emparejador encontró una clave donde la siembra
   * garantiza que no hay ninguna, y entonces todo lo de abajo mide otro camino.
   * Es la lección de B.129 —«allí se planificó una pasada que no podía producir
   * el caso»— convertida en comprobación.
   */
  precondicion: {
    pares: 0,
    sinInterseccion: 0,
    enLasDosDirecciones: true,
    siNoSeCumple: 'ABORTAR_EL_CASO_Y_DECIRLO',
  },

  debenSalir: [
    {
      id: 'P4-BELMONTE',
      // ⚠️ LA RAMA QUE NO SE HA VISTO NUNCA — ni en batería ni en producción.
      // Pendiente **B.131**. Por eso su línea de base nace VACÍA y no en cero:
      // no es que diera cero, es que nunca se ha ejecutado.
      // «LA PRIMERA PRUEBA DE UN CAMINO NO MEDIDO NO CONFIRMA: DESCUBRE.»
      rama: 'a_juicio.sin_clave',
      pendienteConocido: 'B.131',
      persona: 'Dra. Ana Belmonte',
      tema: 'turno asignado',
      // Dos columnas compartidas COINCIDEN (el ancla) y una DIFIERE (la
      // oposición). R2 devuelve `confirm` con anclas = [Clínica, Especialidad],
      // y `destinoSinClave` → `degradar_a_juicio`.
      anclaEsperada: ['Clínica', 'Especialidad'],
      columnaEnOposicion: 'Turno',
      enElAnalizado: 'Mañana',
      enElCorpus: 'Tarde',
      // Las horas COINCIDEN en los dos (32). La oposición es sólo el turno, y
      // decirlo evita que alguien lea este caso como el de Medina.
      horasCoinciden: 32,
      severidadMinima: 'contradiction',
    },
    {
      id: 'P4-MEDINA',
      // Las TRES columnas compartidas coinciden; la discrepancia está en dos
      // columnas que SE LLAMAN DISTINTO. R2 devuelve `pass` nombrando las
      // asimétricas.
      // ⚠️ «Es una contradicción REAL que el diff no puede ver NUNCA», porque
      // empareja columnas por igualdad de nombre (F-78, sin fuzzy, deliberado).
      // Con la regla vieja esto era `'equivalentes'` y el hallazgo desaparecía
      // afirmando que las dos filas dicen lo mismo — eso es **B.130**, arreglado.
      rama: 'a_juicio.columna_no_comparada',
      pendienteRelacionado: 'B.130',
      persona: 'Dr. Carlos Medina',
      tema: 'jornada semanal',
      columnasAsimetricas: ['Horas semana', 'Jornada semanal'],
      enElAnalizado: '44',
      enElCorpus: '40',
      severidadMinima: 'contradiction',
    },
  ],

  /**
   * ⚠️⚠️ EL CRITERIO DEL EXAMEN ES «¿EL HALLAZGO NOMBRA A MEDINA?», Y **NO** UN
   * CONTADOR. Ésta es la decisión de forma más importante del caso, y el
   * registro de siembra la deja escrita con su razón:
   *
   *   «⚠️ Pero ojo al leer el contador: las doce dan `pass` con columnas
   *   asimétricas IGUAL QUE CARLOS MEDINA, porque `Profesional`/`Responsable` y
   *   `Horas semana`/`Jornada semanal` son asimétricas en TODAS las filas. Si el
   *   juez enfrenta cualquier fila, `a_juicio.columna_no_comparada` SE MUEVE.
   *   **Lo que distingue a Carlos Medina no es la rama, es que él lleva una
   *   discrepancia real detrás** — la llamada corta debería confirmarlo a él y
   *   sólo a él.»
   *
   * O sea: `a_juicio.columna_no_comparada = 1` no significa «acertó con Medina».
   * Puede significar «enfrentó a Nuria Ferrer, que no tiene nada». El contador
   * es indistinguible entre las 14 personas, así que **el contador no puede ser
   * el criterio**. Lo es el NOMBRE en el hallazgo.
   *
   * Es la regla de la casa aplicada: un cero —o un uno— sólo vale con su
   * denominador, y aquí el denominador son las otras doce.
   */
  criterioDeAcierto: 'el-hallazgo-nombra-a-la-persona',

  /**
   * ⚠️ LAS OTRAS DOCE NO SON RELLENO: SON EL CONTROL NEGATIVO DEL PAR.
   * «Coinciden en todo lo compartido y en las horas. Cualquier hallazgo sobre
   * ellas es un falso positivo.»
   * Y aquí sí es una lista cerrada, porque la siembra se midió con una sonda
   * determinista sobre los ficheros reales, no se describió de memoria.
   */
  noDebenSalir: [{
    id: 'P4-NO-1',
    descripcion: 'cualquier hallazgo sobre una de las otras doce personas',
    regla: 'toda persona que no sea Belmonte ni Medina',
    // ⚠️ 25/09/2026 — escrito `cuentaComoFalso` hasta hoy, igual que en P2. Lo
    // cazó la regla nueva del validador. El campo es `cuentaComoFallo`.
    cuentaComoFallo: true,
  }],
  extras: 'FALSO_POSITIVO',

  umbralDeAlarma: {
    // ⚠️ Nace en 0 exigidos y NO es una rebaja: es que no hay línea de base
    // contra la que exigir. Belmonte es B.131, jamás ejecutado; Medina depende
    // de que el par pase el rerank, que la siembra declara NO garantizado.
    // El listón sube en un commit aparte y con acta cuando haya una medición,
    // igual que P2 sube a 3 cuando B.106 caiga.
    minimoDeAciertos: 0,
    maximoDeFalsosConfirmados: 0,
    nota: 'Umbral 0 porque el camino nunca se ha ejecutado, no porque se espere ' +
          'que falle. Lo que este caso vigila HOY es que no aparezcan falsos ' +
          'sobre las otras doce, y eso sí se exige en 0.',
  },

  /**
   * ⚠️ LAS DOS COSAS QUE ESTA SIEMBRA **NO** PUEDE GARANTIZAR, literales del
   * registro, y las dos pueden dar un cero que no es del camino que se mide:
   *
   * 1 · **QUE EL RERANK DEJE PASAR EL PAR.** «Es la barrera que invalidó la
   *     pasada extra del 31/08: RRHH-06 llegó al retrieval y el rerank lo
   *     descartó, así que el juez no lo vio nunca. Aquí los dos documentos
   *     hablan de las mismas personas, las mismas clínicas y las mismas
   *     especialidades … pero **la similitud de embeddings no se puede calcular
   *     sin lanzarlo**. Es la única condición de la lista que no se verificó
   *     antes de gastar créditos.»
   *     ⚠️ Y el prompt del rápido empuja en contra: `rerank.ts:61` y `:66`
   *     mandan «sé estricto» y «devuelve selected: [] si ninguno merece».
   *
   * 2 · **QUE EL JUEZ EMITA EL HALLAZGO.** «B.82: es intermitente. Si en una
   *     pasada no sale, no significa que la rama no funcione — significa que el
   *     juez no habló.»
   *
   * ⚠️ POR ESO LAS CINCO PASADAS NO SON CEREMONIA EN ESTE CASO: son lo único que
   * distingue «la rama está rota» de «hoy el juez no habló». Y por eso el
   * informe tiene que decir DÓNDE murió —retrieval, rerank o juez— y no sólo
   * que no salió.
   */
  cerosQueNoSonDelCamino: ['rerank-descarta-el-par', 'juez-intermitente-B82'],

  /**
   * recall@k aquí tiene un uso distinto y es el que decide: separa el ceros de
   * arriba. Si el par no aparece entre los recuperados, murió en retrieval; si
   * aparece y no hay candidato seleccionado, murió en el rerank; si llegó al
   * juez y no hay hallazgo, es B.82 o la rama.
   */
  recall: {
    recuperados: 'MEDIBLE_HOY',
    mostrados: 'BLOQUEADO_POR_F116_PASO_0BIS',
    usoEnEsteCaso: 'separar-donde-murio',
    chunkEsperado: { 'P4-BELMONTE': null, 'P4-MEDINA': null },
  },

  lineaDeBase: {
    commit: null,
    fecha: null,
    aciertos: null,
    // ⚠️ VACÍA, NO CERO, Y LA DIFERENCIA ES LA DEL CASO: un cero dice «se
    // ejecutó y no encontró»; vacía dice «no se ha ejecutado». B.131 es lo
    // segundo. Escribir 0 aquí convertiría un camino sin medir en un camino
    // medido y fallido, que es peor que no tener número.
    nota: 'VACÍA, no cero. La rama sin_clave (B.131) no se ha ejecutado nunca, ' +
          'ni en batería ni en producción. Lo medido es el CORPUS —la sonda ' +
          'determinista del 01/09 sobre los dos .xlsx, reverificada el ' +
          '25/09—, no la respuesta del sistema.',
  },
};
