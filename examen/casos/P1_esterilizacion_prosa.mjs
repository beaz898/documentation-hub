/**
 * P1 · NOR-10 (protocolo de esterilización) contra CLI-12 (manual de calidad).
 * NIVEL: el JUEZ sobre prosa. Cuatro superficies distintas.
 *
 * ⚠️ SON CUATRO CONTRADICCIONES, NO TRES. La D no la sembró nadie: se descubrió
 * el 27/08/2026 investigando por qué el verificador descartaba la A
 * (`corpus-pruebas/SIEMBRA_corpus_ampliado.md` §1). El registro original
 * afirmaba que fuera de las tres los documentos eran consistentes, y era FALSO.
 * **Bajo aquella redacción, un sistema que detectara la D quedaba PENALIZADO
 * POR ACERTAR**, y ése es justo el defecto que este examen existe para no tener.
 *
 * ⚠️ LAS CITAS SALEN DEL .docx, NO DEL REGISTRO DE SIEMBRA. El registro presenta
 * A, B y C como «Afirmación» (paráfrasis) y sólo la D como «pasajes literales».
 * Comprobado el 25/09/2026: la paráfrasis de A dice «del protocolo de
 * esterilización» donde el documento dice «de este protocolo». Comparar contra
 * el registro daría ROJO con el sistema funcionando bien.
 *
 * Extracción usada (la del propio registro, repetible):
 *   unzip -p FICHERO.docx word/document.xml \
 *     | sed -e 's#</w:p>#\n#g' -e 's/<[^>]*>//g'
 * Los números de línea son de ese texto: NOR-10 tiene 253 líneas, CLI-12 254.
 */

export default {
  id: 'P1',
  nivel: 'juez-prosa',

  // ⚠️ POR NOMBRE, NO POR UUID. El id de `documents` depende de la organización
  // y cambia con cada reindexado; el nombre es lo que sobrevive. El endpoint
  // resuelve nombre → id contra la org y FALLA RUIDOSAMENTE si un nombre da
  // cero documentos o más de uno: un nombre que no resuelve y se ignora en
  // silencio deja el corpus más pequeño de lo declarado, y el examen mediría
  // otra cosa sin decirlo.
  analizado: 'NOR-10_protocolo-esterilizacion-instrumental.docx',
  corpusExacto: ['CLI-12_manual-calidad-clinica.docx'],

  modo: 'rapido',
  pasadas: 5,

  debenSalir: [
    {
      id: 'P1-A',
      sembrada: true,
      superficie: 'cargo / responsabilidad última',
      tema: 'responsable último de la esterilización',
      citaEnElAnalizado: {
        // NOR-10 :25 (título «2.1. Responsable último del cumplimiento» en :24)
        literal: 'El responsable último del cumplimiento de este protocolo en '
               + 'cada centro es el Director Clínico de la clínica correspondiente.',
        // ⚠️ DISCRIMINANTE — ver el bloque de abajo. Medido: aparece UNA vez en
        // NOR-10 y CERO en CLI-12.
        discriminante: 'responsable último del cumplimiento',
      },
      citaEnElCorpus: {
        // CLI-12 :31 (título «3.1. Coordinador de Calidad: responsable último
        // de la esterilización» en :30)
        literal: 'El responsable último de la esterilización del instrumental en '
               + 'cada clínica es el Coordinador de Calidad del centro, no el '
               + 'Director Clínico.',
        // Medido: UNA vez en CLI-12, CERO en NOR-10.
        discriminante: 'Coordinador de Calidad del centro, no el',
      },
      severidadMinima: 'contradiction',
      noConfundirCon: ['P1-D'],
    },
    {
      id: 'P1-B',
      sembrada: true,
      superficie: 'periodicidad',
      tema: 'periodicidad del control biológico del autoclave',
      citaEnElAnalizado: {
        // NOR-10 :150
        literal: 'El control biológico del autoclave se realiza semanalmente, '
               + 'todos los lunes a primera hora, mediante indicador biológico '
               + 'con esporas de Geobacillus stearothermophilus',
        discriminante: 'se realiza semanalmente, todos los lunes',
      },
      citaEnElCorpus: {
        // CLI-12 :166 (título «12.1. Indicador de control biológico» en :165)
        literal: 'El control biológico del autoclave se realiza con periodicidad '
               + 'mensual, el primer día laborable de cada mes, mediante '
               + 'indicador biológico con esporas de Geobacillus stearothermophilus',
        discriminante: 'periodicidad mensual, el primer día laborable',
      },
      severidadMinima: 'contradiction',
      // ⚠️ COARTADA DENTRO DE LA PROPIA CITA: CLI-12 justifica su mensualidad
      // CITANDO A NOR-10 POR SU NOMBRE — «se complementa con el control físico y
      // químico de cada ciclo individual, descritos en el protocolo operativo
      // NOR-10, que sí se ejecutan con carácter diario». Un juez puede leerlo
      // como «no se contradicen, se complementan». Es la misma clase de trampa
      // que la coartada jerárquica de P2, y aquí está DENTRO del fragmento, no
      // en la apertura del documento: llega al modelo siempre.
      coartadaEnLaCita: true,
    },
    {
      id: 'P1-C',
      sembrada: true,
      superficie: 'plazo',
      tema: 'caducidad del material esterilizado y envasado',
      citaEnElAnalizado: {
        // NOR-10 :220 (apartado 13.4)
        literal: 'El instrumental esterilizado y envasado en bolsa mixta '
               + 'papel-plástico mantiene su esterilidad durante un máximo de '
               + '6 meses desde la fecha de esterilización impresa en la etiqueta',
        discriminante: 'un máximo de 6 meses desde la fecha de esterilización',
      },
      citaEnElCorpus: {
        // CLI-12 :232 (título «16.2. Criterio de caducidad aplicado en
        // auditoría» en :231)
        literal: 'A efectos de esta auditoría de calidad, el material '
               + 'esterilizado y envasado se considera válido durante un periodo '
               + 'máximo de 12 meses desde su esterilización',
        discriminante: 'periodo máximo de 12 meses desde su esterilización',
      },
      severidadMinima: 'contradiction',
      // ⚠️ Y AQUÍ LA COARTADA ES EXPLÍCITA Y LA ESCRIBE CLI-12 DE SÍ MISMO:
      // «Este criterio, MÁS AMPLIO QUE EL APLICADO EN OTROS PROTOCOLOS
      // OPERATIVOS DE LA RED, responde a la evidencia técnica…» (CLI-12 :232).
      // El documento RECONOCE la discrepancia y la justifica.
      // ⚠️ Es la contradicción más fácil de descartar de las cuatro, y por eso
      // es la que más vale medir.
      coartadaEnLaCita: true,
    },
    {
      id: 'P1-D',
      // ⚠️ NADIE LA SEMBRÓ, Y DETECTARLA ES ACIERTO. Decisión del director del
      // 25/09/2026: va en `debenSalir` con las otras tres, no como extra
      // tolerado.
      sembrada: false,
      descubierta: '2026-08-27',
      superficie: 'meta — si dos figuras pueden ser la misma persona',
      tema: '¿puede el Coordinador de Calidad ser el propio Director Clínico?',
      citaEnElAnalizado: {
        // NOR-10 :32 (título «2.4. Coordinador de Calidad» en :31)
        literal: 'Cada clínica cuenta con un Coordinador de Calidad, figura que '
               + 'puede recaer en el propio Director Clínico o en otro '
               + 'profesional designado por él',
        // Medido: UNA vez en NOR-10, CERO en CLI-12.
        discriminante: 'puede recaer',
      },
      citaEnElCorpus: {
        // CLI-12 :40 (título «3.5. Sustitución temporal del Coordinador de
        // Calidad» en :39)
        literal: 'sus funciones son asumidas temporalmente por el Coordinador de '
               + 'Calidad de otra clínica de la red, nunca por el Director '
               + 'Clínico del propio centro, precisamente para mantener la '
               + 'separación de funciones',
        // Medido: UNA vez en CLI-12, CERO en NOR-10.
        discriminante: 'nunca por el Director Clínico',
      },
      severidadMinima: 'contradiction',
      noConfundirCon: ['P1-A'],
    },
  ],

  /**
   * ⚠️ EL BLOQUE QUE PIDIÓ EL DIRECTOR EL 25/09/2026, Y EL PORQUÉ.
   *
   * La A y la D hablan las dos del Director Clínico y del Coordinador de
   * Calidad, y viven pegadas: **7 líneas en NOR-10 (:25 → :32) y 9 en CLI-12
   * (:31 → :40)**, verificado en el texto extraído. Con el troceado en chunks de
   * ~1.200 caracteres los dos pares caen en el mismo chunk o en vecinos.
   *
   * **El riesgo no es del sistema: es del MARCADOR.** Si el sistema emite la D y
   * el examen la apunta como A, el resultado sale verde POR CASUALIDAD — y un
   * verde por casualidad es peor que un rojo, porque nadie lo va a mirar.
   *
   * LA REGLA, por tanto: el emparejamiento hallazgo→esperado se decide por el
   * DISCRIMINANTE y por nada más. No por el `topic` (F-22 §4.1 midió que el
   * título no se verifica contra sus propias citas), no por proximidad de texto,
   * y **no por el número de hallazgos** — cuatro hallazgos no significan «los
   * cuatro correctos».
   *
   * Cada discriminante se eligió MIDIENDO, no a ojo. Las cinco cadenas de abajo
   * aparecen **exactamente una vez** en su documento y **cero veces** en el otro
   * (comprobado con `grep -c` el 25/09/2026 sobre el texto extraído). Así que
   * ninguna cita de la A puede satisfacer a la D ni al revés, ni siquiera si el
   * juez mezclara los dos pasajes en una sola cita.
   *
   * ⚠️ Y SU CONTROL POSITIVO, que va en la batería del comparador: un hallazgo
   * fabricado con las citas de la D debe emparejar con P1-D y **fallar** contra
   * P1-A. Sin esa mitad, el discriminante podría no estar filtrando nada.
   */
  reglaDeEmparejamiento: 'discriminante-exclusivo',
  discriminantesMedidos: {
    fecha: '2026-09-25',
    metodo: 'grep -c sobre el texto extraído de los dos .docx',
    resultado: 'las 5 cadenas: 1 aparición en su documento, 0 en el otro',
  },

  /**
   * ⚠️ AQUÍ NO VA `falsosEsperados: 0`, Y ES DELIBERADO.
   * SIEMBRA_corpus_ampliado.md §5, tras la corrección del 27/08: «Sobre
   * hallazgos adicionales, YA NO SE AFIRMA NADA. Los dos documentos no se han
   * auditado enteros: sólo se comprobó lo que el registro declaraba, y ese
   * registro ya se equivocó una vez. Un hallazgo que no sea A, B, C o D no se
   * puede dar por falso positivo sin ir al texto a comprobarlo.»
   * Contar los extras como falsos repetiría el defecto que la corrección quitó.
   */
  noDebenSalir: [],
  extras: 'PENDIENTE_DE_ETIQUETA',

  /**
   * Lo que los dos documentos comparten SIN contradecirse. Es la única lista
   * cerrada del caso: un hallazgo que caiga aquí es falso positivo con certeza.
   * El primero verificado por mí en NOR-10 :125 («134 °C durante 18 minutos de
   * fase de meseta»).
   */
  consistenteVerificado: [
    'ciclo estándar de autoclave a 134 °C / 18 min',
    'validación anual de equipos',
    'mantenimiento técnico trimestral',
    'conservación de registros durante 5 años',
    'periodicidad trimestral de auditoría interna del área',
  ],

  /**
   * ⚠️⚠️ CORREGIDO EL 25/09/2026, Y LA VERSIÓN ANTERIOR ERA UN ROJO PERMANENTE.
   *
   * Aquí decía `minimoDeAciertos: 4` con el argumento «este par no tiene ningún
   * pendiente conocido que rebaje el listón (a diferencia de P2)». **Era falso,
   * y lo desmintió el propio repositorio al buscar otra cosa**: este par SÍ está
   * medido y dio **CERO**, dos veces. Ver `lineaDeBase`.
   *
   * Un umbral de 4 sobre una base medida de 0 habría puesto P1 en ROJO en su
   * primera pasada y en todas las siguientes, que es exactamente lo que el
   * director prohibió en su decisión 3 y con sus palabras: «un rojo permanente
   * es ruido, y el ruido nos entrena a ignorar la luz».
   *
   * ⚠️ Y EL FALLO DE MÉTODO QUE LO PRODUJO, que es el que hay que recordar: se
   * escribió `lineaDeBase: null` tras comprobar que **nadie había medido este par
   * CON LAS CUATRO declaradas** — lo cual es cierto— y de ahí se saltó a «no
   * está medido», que es falso. **Se midió con tres y dio cero, y la propia
   * anotación del 31/08 dice que el denominador correcto es cuatro.** Es la
   * regla del cero de esta casa fallando por el lado que no se espera: no se
   * leyó un cero como confirmación, se leyó una AUSENCIA DE CERO donde el cero
   * estaba escrito.
   */
  umbralDeAlarma: {
    minimoDeAciertos: 0,
    maximoDeFalsosConfirmados: 0,
    nota: 'Umbral 0 porque la base medida es 0 de 4, dos veces (87a76112 y ' +
          'cceddf86). Sube en cuanto una tanda dé más, y con commit y motivo ' +
          'escrito. Lo que este caso vigila HOY es que no aparezcan falsos y ' +
          'que el cuello del retrieval no empeore.',
  },

  /**
   * recall@k. ⚠️ LA SEGUNDA MITAD NO ES CONTESTABLE HOY: los ids de los
   * fragmentos MOSTRADOS no se persisten (`lib/analysis/judge.ts:374-383`) y el
   * log lista los RECUPERADOS (`lib/analysis/retrieval.ts:393-396`), no los
   * seleccionados. Depende del paso 0-bis de F-116. Nace a medias, y se dice.
   */
  recall: {
    recuperados: 'MEDIBLE_HOY',
    mostrados: 'BLOQUEADO_POR_F116_PASO_0BIS',
    // Los chunk index NO se escriben a mano: los rellena la primera pasada y
    // entonces se congelan. Escribirlos de memoria es inventarse el ground
    // truth, que es lo que la regla de admisión prohíbe.
    chunkEsperado: { 'P1-A': null, 'P1-B': null, 'P1-C': null, 'P1-D': null },
  },

  /**
   * ⚠️⚠️ ESTÁ MEDIDA, Y ES CERO. CORRECCIÓN DEL 25/09/2026.
   *
   * La primera versión de este fichero puso `lineaDeBase: null` con «SIN MEDIR
   * con las cuatro. La primera pasada DESCUBRE, no confirma». **La segunda frase
   * era falsa: este par se ha medido DOS VECES y las dos dieron CERO.**
   *
   * Son los casos 8 y 9 del catálogo (`claude/Casos_Harness.md:88-89`), y su
   * línea de base está en `Casos_Harness.md:172-240`:
   *
   *   · **26/08/2026, `87a76112`** — «Prosa larga | 3 sembradas | **0
   *     publicadas**». Con la nota de que la D no estaba contada «ni a favor ni
   *     en contra», así que **el denominador correcto es 4**.
   *   · **31/08/2026, `cceddf86`, tanda 3** — «**SIGUE EN CERO**, y las dos
   *     causas de muerte son LAS MISMAS». Una pasada por dirección, aisladas.
   *   · Y la anotación que lo cierra: «**El denominador es 4, no 3** … así que la
   *     cifra de hoy es **0 de 4**».
   *
   * ⚠️ LAS DOS CAUSAS DE MUERTE ESTÁN IDENTIFICADAS, y por eso este cero no es
   * un misterio sino un pendiente: el juez SÍ emitió el hallazgo de la
   * contradicción A en las dos direcciones, y murió después —
   *   · `CLI-12 → NOR-10`: «Responsabilidad última de la esterilización» →
   *     **`mismo_dato_sin_oposicion`**
   *   · `NOR-10 → CLI-12`: «Responsabilidad última en decisiones de
   *     esterilización» → **`cita no verificable, lado=nuevo`**
   *
   * ⚠️ Y EL CUELLO QUE LO EXPLICA SIN NECESIDAD DE NADA MÁS, medido y estable
   * cinco días: «**3 dentro, 63 fuera (prosa 3/66), 2616/3000 caracteres**» del
   * candidato, y el documento ANALIZADO truncado a 6.000 de 60.840 y de 73.962
   * por `NEW_DOC_LIMIT_QUICK` (`judge.ts:35`). Conclusión literal del
   * catálogo: «**el juez compara ~8 % de un documento contra ~4 % del otro**.
   * Con eso, que no encuentre las sembradas no necesita más explicación que la
   * aritmética».
   *
   * ⚠️ POR ESO ESTE CASO ES EL QUE MIDE F-116. Las cuatro contradicciones no se
   * detectan porque el presupuesto no las muestra — que es exactamente lo que el
   * corte honesto y el presupuesto con ficha vienen a arreglar. **Si las piezas
   * 1 y 2 de la semana 2 funcionan, este número tiene que moverse, y aquí es
   * donde se verá.**
   */
  lineaDeBase: {
    commit: 'cceddf86',
    fecha: '2026-08-31',
    aciertos: 0,
    esperados: 4,
    medicionAnterior: { commit: '87a76112', fecha: '2026-08-26', aciertos: 0, esperadosEntonces: 3 },
    causasDeMuerte: {
      'CLI-12 → NOR-10': 'mismo_dato_sin_oposicion',
      'NOR-10 → CLI-12': 'cita no verificable, lado=nuevo',
    },
    cuelloMedido: {
      candidato: '3 fragmentos dentro de 66 (4,7 %), 2616/3000 caracteres',
      analizado: 'truncado a 6.000 de 60.840 (CLI-12) y de 73.962 (NOR-10)',
      lectura: 'el juez compara ~8 % de un documento contra ~4 % del otro',
    },
    fuente: 'claude/Casos_Harness.md:172-240',
    nota: '⚠️ NO es «sin medir». Es CERO, dos veces, con las dos causas de ' +
          'muerte identificadas y el cuello cuantificado. La primera pasada ' +
          'del examen CONFIRMA una base conocida; lo que descubriría es si algo ' +
          'la ha movido.',
  },
};
