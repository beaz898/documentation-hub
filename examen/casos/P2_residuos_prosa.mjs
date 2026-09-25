/**
 * P2 · NOR-11 (protocolo de residuos) contra CLI-13 (instrucciones de gabinete).
 * NIVEL: el JUEZ sobre prosa, tres superficies que NO son cargos ni personas.
 *
 * ⚠️ ESTE CASO TIENE UN PROPÓSITO DECLARADO Y YA CONTESTADO, y hay que saberlo
 * antes de leer su marcador. `corpus-pruebas/SIEMBRA_caso_control.md` lo escribe
 * en su §propósito: el corpus ya tenía un caso de contradicción sobre un CARGO
 * (P1), y este par existe para distinguir si el sistema detecta contradicciones
 * **razonando sobre el mecanismo** (dos valores incompatibles para el mismo
 * dato) o si sólo reconoce el **patrón superficial** del caso ya conocido.
 *
 * La respuesta, medida en la tanda del 27/08/2026 sobre `8cf73e23` y escrita en
 * el §D del registro: **RAZONA.** Dos superficies nuevas —un plazo y un
 * topónimo—, ninguna sobre personas ni roles, confirmadas.
 *
 * ⚠️ Y ESTE CASO NACE EN 2 DE 3, NO EN 3 DE 3. Decisión del director del
 * 25/09/2026, literal: «No quiero un examen que salga rojo el primer día por
 * algo que jamás ha funcionado. Un rojo permanente es ruido, y el ruido nos
 * entrena a ignorar la luz.»
 *
 * ⚠️ ESTE PAR SÍ TIENE AUDITORÍA COMPLETA, a diferencia de P1. El registro lo
 * declara en su §A: «los dos documentos se han leído enteros: 163 líneas de
 * texto extraído (86 de NOR-11, 77 de CLI-13). Cuando abajo se dice "no hay una
 * cuarta", no significa "no encontré más": significa que se ha leído todo.»
 * Por eso aquí `noDebenSalir` SÍ puede ser una lista cerrada, y en P1 no.
 *
 * Citas extraídas del .docx el 25/09/2026, no copiadas del registro:
 *   unzip -p FICHERO.docx word/document.xml \
 *     | sed -e 's#</w:p>#\n#g' -e 's/<[^>]*>//g'
 * ⚠️ Y hacía falta: el registro recorta. Su «Afirmación literal» de la siembra 1
 * empieza «Los contenedores de residuos del grupo III…» y el documento dice
 * «**En concreto, los** contenedores…»; la de la siembra 3 acaba en «infracción
 * del protocolo» y el documento sigue «…que debe corregirse de inmediato al
 * detectarse». Por eso el emparejamiento va por ANCLA y no por cita completa.
 */

export default {
  id: 'P2',
  nivel: 'juez-prosa',

  analizado: 'NOR-11_gestion-de-residuos-sanitarios.docx',
  corpusExacto: ['CLI-13_instrucciones-clinicas-residuos.docx'],

  modo: 'rapido',
  pasadas: 5,

  debenSalir: [
    {
      id: 'P2-1',
      sembrada: true,
      superficie: 'plazo',
      tema: 'permanencia máxima del contenedor de grupo III en almacén intermedio',
      citaEnElAnalizado: {
        // NOR-11 :22 (apartado 2 · Principio general de retirada)
        literal: 'los contenedores de residuos del grupo III no pueden permanecer '
               + 'en el área de almacenamiento intermedio más de 72 horas desde '
               + 'el momento en que se cierran',
        discriminante: 'más de 72 horas desde el momento en que se cierran',
      },
      citaEnElCorpus: {
        // CLI-13 :21 (apartado 2 · Regla general de retirada)
        literal: 'ningún contenedor de residuos del grupo III debe permanecer en '
               + 'el almacén intermedio más de 7 días naturales desde que se '
               + 'cierra, aunque esté lleno antes de ese plazo',
        discriminante: 'más de 7 días naturales desde que se cierra',
      },
      severidadMinima: 'contradiction',
      // El registro (§A) lo llama «un par excepcionalmente limpio»: las dos
      // frases comparten grupo (III), lugar (almacén intermedio), anclaje del
      // cómputo («desde que se cierra») e incluso la salvedad de que el volumen
      // no cuenta. Sólo difiere el número. Proporción 1:4.
      // ⚠️ Si alguna vez falla ESTA, el problema no es de matiz.
    },
    {
      id: 'P2-2',
      sembrada: true,
      superficie: 'lugar / topónimo',
      tema: 'ubicación del punto de retirada centralizado',
      citaEnElAnalizado: {
        // NOR-11 :53 (apartado 6 · Retirada por gestor autorizado)
        literal: 'El gestor autorizado recoge los residuos de las tres clínicas '
               + 'en un punto de retirada centralizado, ubicado en la clínica de '
               + 'Chamberí',
        // ⚠️ EL DISCRIMINANTE NO PUEDE SER «Chamberí» A SECAS: la cita de
        // CLI-13 también contiene la palabra («Si trabajas en Chamberí o
        // Salamanca…»), verificado el 25/09. Tiene que llevar el verbo.
        discriminante: 'centralizado, ubicado en la clínica de Chamberí',
      },
      citaEnElCorpus: {
        // CLI-13 :48 (apartado 5 · Dónde se retiran los residuos)
        literal: 'El punto de retirada centralizado para las tres clínicas de la '
               + 'red se encuentra en la clínica de Retiro, que es el centro de '
               + 'referencia logística de residuos sanitarios de Dentavia',
        discriminante: 'se encuentra en la clínica de Retiro',
      },
      severidadMinima: 'contradiction',
      // El registro (§A) dice que es «más fuerte de lo que el registro dice»:
      // no son dos topónimos sueltos, cada documento construye encima su propia
      // consecuencia operativa. Son incompatibles en dos niveles.
    },
    {
      id: 'P2-3',
      sembrada: true,
      superficie: 'negación categórica',
      tema: 'color de contenedor para el grupo III no punzante',
      citaEnElAnalizado: {
        // NOR-11 :76 (apartado 10.2 · Uso incorrecto del contenedor negro)
        literal: 'En ningún caso se depositan en el contenedor negro de zona '
               + 'común, que está reservado exclusivamente a los residuos '
               + 'asimilables a urbanos del grupo I',
        discriminante: 'En ningún caso se depositan en el contenedor negro',
      },
      citaEnElCorpus: {
        // CLI-13 :71 (apartado 8 · Chuleta rápida de contenedores)
        literal: 'Los residuos del grupo III (gasas, guantes y material de un '
               + 'solo uso que ha estado en contacto con sangre o fluidos de un '
               + 'paciente) se depositan en el contenedor negro habilitado en '
               + 'cada gabinete',
        discriminante: 'se depositan en el contenedor negro habilitado en cada gabinete',
      },
      severidadMinima: 'contradiction',

      /**
       * ⚠️⚠️ PENDIENTE CONOCIDO: **B.106**. NO CUENTA COMO FALLO DEL EXAMEN.
       *
       * Medido en la tanda del 27/08/2026 sobre `8cf73e23` y escrito en el §D
       * del registro de siembra: **EL JUEZ NUNCA LA EMITE.**
       *
       * Y NO es un fallo de selección — esto es lo que lo hace un pendiente y no
       * una hipótesis: «El material estaba DELANTE DEL JUEZ: entran 4 fragmentos
       * de 16 y 4 de 11, y el descarte de un solapamiento de esa misma pasada
       * cita literalmente "contenedor negro habilitado en cada gabinete". Es
       * decir, el pasaje de CLI-13 llegó al prompt y el juez no emitió la
       * contradicción.»
       *
       * B.106, enunciado: en documentos de 4 y 5 páginas —los más pequeños del
       * corpus y con tres siembras— el juez devuelve exactamente «1
       * contradicciones» en el log crudo, ANTES de cualquier filtro, y cada
       * dirección devuelve una distinta. **Nunca dos.**
       *
       * ⚠️ Y EL LÍMITE QUE EL REGISTRO DEJA DICHO CON PRECISIÓN, porque es lo
       * que este caso NO puede contestar: «la tercera no dice que el sistema no
       * razone sobre negaciones categóricas — dice que MUERE ANTES DE LLEGAR A
       * RAZONARSE, en el juez, por un techo distinto. La pregunta del caso de
       * control sobre esa superficie sigue SIN MEDIR.»
       *
       * ⚠️ EL DÍA QUE ESTO SALGA VERDE, ES LA NOTICIA, y el listón sube a 3 en
       * un commit aparte y con acta. Decisión del director, 25/09/2026.
       */
      pendienteConocido: 'B.106',
      cuentaParaElUmbral: false,
    },
  ],

  /**
   * ⚠️ AQUÍ SÍ ES UNA LISTA CERRADA, y es la diferencia con P1: el registro
   * auditó las 163 líneas enteras y declara que no hay una cuarta. «Ninguna otra
   * cifra, plazo, color, ubicación o nombre presente en los dos documentos se
   * contradice.»
   */
  noDebenSalir: [
    {
      id: 'P2-NO-1',
      // ⚠️ LA TENSIÓN DE §C.2 — NO ES ALUCINACIÓN Y NO ES CONTRADICCIÓN.
      // Si aparece un hallazgo sobre quién cierra el contenedor, SALE DE TRES
      // FRASES REALES: NOR-11 :23 («el personal auxiliar cierra el contenedor»),
      // CLI-13 :54 («ciérralo y avisa al personal auxiliar») y CLI-13 :42 («No
      // traslades tú mismo un contenedor lleno»).
      // No se cuenta como cuarta contradicción porque CLI-13 va dirigida a
      // «personal clínico Y AUXILIAR de gabinete» (CLI-13 :14): el lector puede
      // SER el auxiliar, y las dos frases pueden ser verdad a la vez. Es
      // ambigua, no incompatible.
      // ⚠️ El registro lo deja anotado con su motivo: «Sin esta nota se contaría
      // como falso positivo, que sería PENALIZAR AL SISTEMA POR LEER BIEN.»
      tema: 'quién cierra el contenedor',
      ancla: 'cierra el contenedor',
      clasificacion: 'AMBIGUO_NO_FALSO',
      cuentaComoFalso: false,
    },
  ],
  extras: 'FALSO_POSITIVO',   // la auditoría completa lo autoriza

  /**
   * ⚠️ LA COARTADA JERÁRQUICA (§C.1 del registro). Los dos documentos declaran
   * DENTRO DE SU PROPIO TEXTO que uno manda sobre el otro:
   *   NOR-11 :19 — «se complementa con las instrucciones clínicas prácticas
   *     (CLI-13)… sin alterar en ningún caso los criterios establecidos en el
   *     presente documento.»
   *   NOR-11 :84 — «En caso de cualquier discrepancia aparente entre ambos
   *     documentos, prevalece siempre el criterio de NOR-11.»
   *   CLI-13 :17 — «No sustituye a NOR-11.»
   * Es una regla de resolución de conflictos escrita dentro de las propias
   * citas, y un modelo puede leerla como «no hay contradicción, hay jerarquía».
   * No es un defecto: así son los documentos reales.
   *
   * ⚠️ Y LA LECTURA QUE EL REGISTRO DEJA ESCRITA: «Las dos confirmaciones del
   * 27/08 se lograron PESE a esta coartada, no en su ausencia.»
   *
   * A diferencia de la coartada de P1 —que vive en el apartado contiguo a su
   * siembra—, ésta está en la APERTURA y el CIERRE de NOR-11, lejos de las tres
   * siembras: sólo llega al modelo si el retrieval trae esos fragmentos. Por eso
   * es una variable que cambia entre pasadas, y por eso se anota aquí.
   */
  coartadaJerarquica: { presente: true, lineas: ['NOR-11:19', 'NOR-11:84', 'CLI-13:17'] },

  /**
   * ⚠️ EL UMBRAL ES «MENOS DE 2», NO «MENOS DE 3». Decisión del director,
   * 25/09/2026. La tercera está declarada arriba con su número de pendiente y
   * `cuentaParaElUmbral: false`.
   */
  umbralDeAlarma: { minimoDeAciertos: 2, maximoDeFalsosConfirmados: 0 },

  recall: {
    recuperados: 'MEDIBLE_HOY',
    mostrados: 'BLOQUEADO_POR_F116_PASO_0BIS',
    chunkEsperado: { 'P2-1': null, 'P2-2': null, 'P2-3': null },
    // ⚠️ PARA P2-3, recall@k ES LA MEDICIÓN QUE IMPORTA: el registro ya dice que
    // el pasaje LLEGÓ al prompt. Si recall confirma «recuperado sí, mostrado
    // sí» y el hallazgo no sale, B.106 queda aislado en el juez con evidencia
    // persistida en vez de con una lectura afortunada del log. Ése es el valor
    // de este caso hoy, incluso saliendo 2 de 3.
  },

  /**
   * ⚠️ ESTA SÍ SE RELLENA, Y CON LO MEDIDO — a diferencia de P1. Sale del §D del
   * registro de siembra, no de una estimación.
   */
  lineaDeBase: {
    commit: '8cf73e23',
    fecha: '2026-08-27',
    aciertos: 2,
    esperados: 3,
    detalle: {
      'P2-1': 'CONFIRMADA',
      'P2-2': 'CONFIRMADA',
      'P2-3': 'EL JUEZ NUNCA LA EMITE — B.106',
    },
    // ⚠️ QUÉ HA CAMBIADO EN EL CÓDIGO DESDE ESA MEDICIÓN, porque es la lista de
    // sospechosos si el resultado se mueve. El verificador de hallazgos ya
    // existía el 27/08 (entró el 23/08, `e3827e17`), así que NO es uno de ellos.
    // Sí lo son: la defensa de fila viva (F-115, 22/09), la retirada de los dos
    // umbrales (23/09) y la criba reordenada de `criba-de-matches.ts`.
    nota: 'Medida sobre 8cf73e23 con el verificador ya puesto. Si el resultado '
        + 'se mueve, los sospechosos son F-115, la retirada del umbral y el '
        + 'nuevo orden de la criba — no el verificador.',
  },
};
