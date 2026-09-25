/**
 * N3 · PELO Y CALZADO · MKT-01 (manual de identidad corporativa) contra
 *      RRHH-05 (uniformidad e imagen).
 *
 * NIVEL: **PRECISIÓN**, con control positivo propio. Cubre los falsos **1 y 2**
 * de `claude/Consulta_Fable_F22_Juez.md:65-69`, que son el **patrón 1 — las dos
 * citas dicen LO MISMO**.
 *
 * ⚠️ LOS DOS FALSOS VAN EN UN SOLO CASO PORQUE SON EL MISMO PAR Y LA MISMA
 * PASADA. Separarlos costaría dos análisis para medir lo que uno mide, y es la
 * misma decisión que `Casos_Harness.md:41-47` tomó con Belmonte dentro de los
 * casos 1 y 2.
 *
 * ⚠️⚠️ ESTE PAR ES EL QUE N2 SE PROHÍBE A SÍ MISMO USAR, Y HAY QUE LEER POR QUÉ
 * ANTES DE NADA. `N2_pareja_limpia.mjs` lo dice: «es la tentación obvia —son dos
 * documentos de prosa— y es exactamente el par equivocado: llevaba un DUPLICADO
 * sembrado y produjo los falsos 1 y 2 de F-22». Eso que descalifica al par como
 * pareja limpia es justo lo que lo cualifica como caso de precisión: **es el par
 * más sucio del corpus y se sabe exactamente por qué.**
 *
 * ⚠️ Y DE AHÍ SALE SU CONTROL POSITIVO, que es lo que N4 y N5 no tienen: el
 * duplicado sembrado. `claude/Estado_Del_MVP.md:6829` — ronda B sembró «**un**
 * duplicado (MKT-01↔RRHH-05)», y `:6832` mide que la ronda «**encontró las dos
 * trampas**». Así que este par tiene, medido, algo que el sistema SÍ debe
 * emitir. Sin eso, cero falsos y cero aciertos sería indistinguible de un
 * sistema apagado.
 */

export default {
  id: 'N3',
  nivel: 'precision-y-cobertura',

  analizado: 'MKT-01_manual-identidad-corporativa.docx',
  corpusExacto: ['RRHH-05_uniformidad-e-imagen.txt'],

  modo: 'rapido',
  pasadas: 5,

  /**
   * EL CONTROL POSITIVO — el duplicado sembrado de la ronda B.
   *
   * ⚠️ LA FORMA EN QUE SALE **NO ESTÁ MEDIDA, Y NO SE EXIGE UNA**. El pipeline
   * tiene columnas separadas para duplicados y para solapamientos
   * (`CLAUDE.md`, y `saveAnalysisResult` las iza por separado), y el registro
   * de la ronda B dice «encontró las dos trampas» sin decir **bajo qué
   * etiqueta**. Exigir `duplicado` y no `solapamiento` sería poner en rojo una
   * forma que nadie midió — el error que el director prohibió el 25/09 («un
   * examen con esperados:3 saldría rojo el primer día por algo que jamás ha
   * funcionado»).
   *
   * Así que el acierto se cumple con CUALQUIERA de las dos etiquetas, y el
   * informe imprime cuál salió. El día que haya dos tandas que coincidan, ese
   * día se fija la etiqueta en un commit con motivo escrito.
   */
  debenSalir: [
    {
      id: 'N3-DUPLICADO',
      sembrada: true,
      superficie: 'dos documentos de prosa que repiten la misma normativa',
      tema: 'uniformidad e imagen del personal clínico',
      // ⚠️ Las dos secciones que se solapan, medidas: MKT-01 las tiene en sus
      // líneas 54-55 del texto extraído; RRHH-05 en sus apartados 2 y 3.
      citaEnElAnalizado: {
        literal: 'Calzado cerrado y antideslizante, de color blanco o gris, de uso exclusivo en clínica.',
        discriminante: 'Calzado cerrado y antideslizante, de color blanco o gris',
      },
      citaEnElCorpus: {
        literal: 'Calzado cerrado, antideslizante y de uso exclusivo en clínica, de color blanco o gris, sin excepciones por comodidad personal.',
        discriminante: 'Calzado cerrado, antideslizante y de uso exclusivo en clínica',
      },
      etiquetasAceptadas: ['duplicado', 'solapamiento'],
      confirmadoPorEsperado: 'cualquiera',
      cuentaParaElUmbral: true,
    },
  ],

  noDebenSalir: [
    {
      id: 'N3-PELO',
      patronDeF22: 'las-dos-citas-dicen-lo-mismo',
      pendienteDeOrigen: 'F-22 §2, patrón 1',
      temaEspurio: 'recogida del pelo durante la atención clínica',
      // ⚠️ LAS DOS CITAS SON LITERALES DE F-22:66-67, y las dos se han
      // localizado en su documento: MKT-01 línea 55 del texto extraído,
      // RRHH-05 líneas 26-27.
      citaEnElAnalizado: {
        literal: 'Pelo recogido durante la atención clínica al paciente',
        discriminante: 'Pelo recogido durante la atención clínica al paciente',
      },
      citaEnElCorpus: {
        literal: 'Pelo recogido en todo el personal clínico durante la atención al paciente',
        // ⚠️ EL DISCRIMINANTE ES MÁS CORTO QUE LA CITA A PROPÓSITO, y no es
        // pereza: en RRHH-05 la frase está MAQUETADA EN DOS LÍNEAS («…atención
        // al\n  paciente»), y el verificador compara con `includes` exacto
        // mientras que el producto compara con `normalize()`, que colapsa
        // espacios. Con la cita entera sale AUSENTE estando la frase ahí.
        // Es la fragilidad 3 de `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`,
        // y este recorte es el rodeo mientras el arquitecto decide.
        discriminante: 'Pelo recogido en todo el personal clínico',
      },
      porQueNoEsContradiccion:
        'la segunda es la primera con el sujeto explícito. No hay dos valores ' +
        'en oposición: hay una regla escrita dos veces.',
      cuentaComoFallo: true,
    },
    {
      id: 'N3-CALZADO',
      patronDeF22: 'las-dos-citas-dicen-lo-mismo',
      pendienteDeOrigen: 'F-22 §2, patrón 1',
      temaEspurio: 'calzado del personal clínico',
      /**
       * ⚠️ ESTE ENTRA CON UN SUPUESTO DECLARADO, Y NO ES UNA TRANSCRIPCIÓN.
       *
       * F-22 **no da sus citas**: dice «Ídem con el calzado, donde la segunda
       * cita es la primera más una coletilla». Hasta hoy eso lo dejaba fuera
       * (`N1_falsos_conocidos.mjs`, tabla de LOS_QUE_NO_ENTRAN, fila 2: «❌ sólo
       * "ídem con el calzado"»).
       *
       * LO QUE CAMBIA CON LOS DOCUMENTOS DELANTE: cada uno tiene **una sola**
       * frase sobre calzado, y la relación entre las dos es la que F-22
       * describe —la de RRHH-05 es la de MKT-01 reordenada **más** «sin
       * excepciones por comodidad personal», que es literalmente la coletilla—.
       * Así que el par de citas queda determinado por el material, no por el
       * tema.
       *
       * ⚠️ AUN ASÍ ES UNA INFERENCIA Y SE ETIQUETA COMO TAL: nadie ha leído lo
       * que el juez citó aquel día. Si en una pasada aparece un hallazgo de
       * calzado con OTRAS citas, este caso lo marca para etiqueta humana en vez
       * de contarlo — igual que N1 hace con Nuria Ferrer.
       */
      procedenciaDeLaCita: 'INFERIDA_DEL_DOCUMENTO_NO_TRANSCRITA',
      citaEnElAnalizado: {
        literal: 'Calzado cerrado y antideslizante, de color blanco o gris, de uso exclusivo en clínica.',
        discriminante: 'Calzado cerrado y antideslizante, de color blanco o gris',
      },
      citaEnElCorpus: {
        literal: 'Calzado cerrado, antideslizante y de uso exclusivo en clínica, de color blanco o gris, sin excepciones por comodidad personal.',
        discriminante: 'Calzado cerrado, antideslizante y de uso exclusivo en clínica',
      },
      porQueNoEsContradiccion:
        'la misma norma con las cláusulas en otro orden, más una coletilla. ' +
        'Ningún valor se opone a ningún otro.',
      cuentaComoFallo: true,
      siApareceConOtrasCitas: 'MARCAR_PARA_ETIQUETA_HUMANA',
    },
  ],

  /**
   * ⚠️ EL MISMO PAR DE FRASES ESTÁ EN LAS DOS MITADES DEL CASO, Y ES
   * DELIBERADO — es lo que este caso mide y conviene que se vea de un vistazo:
   *
   *   · como **N3-DUPLICADO**, las dos frases del calzado son la evidencia de
   *     que los documentos se repiten → eso el sistema DEBE verlo;
   *   · como **N3-CALZADO**, las mismas dos frases emitidas bajo el título de
   *     una CONTRADICCIÓN → eso el sistema NO debe hacerlo.
   *
   * «El sistema vio el parecido y lo clasificó al revés» (`Estado_Del_MVP.md`
   * :6837). El caso pasa si acierta la etiqueta, no si detecta el parecido:
   * detectarlo lo hizo bien en agosto, nombrarlo lo hizo mal.
   */
  loQueRealmenteMide: 'la ETIQUETA, no la detección: mismo material, dos nombres',

  umbralDeAlarma: {
    minimoDeAciertos: 1,
    // ⚠️ NULL Y NO UN NÚMERO — ver `lineaDeBase`. La frecuencia de estos dos
    // falsos NO se midió, y un techo inventado es peor que ninguno: si se pone
    // 0 el caso sale rojo el primer día por algo que a lo mejor era su
    // comportamiento normal; si se pone alto, no avisa nunca.
    maximoDeFalsosConfirmados: null,
    estado: 'LINEA_DE_BASE_PENDIENTE',
    nota: 'El techo se escribe cuando DOS tandas de 10 den el mismo reparto ' +
          '(criterio de Fable), y nace en el MÁXIMO OBSERVADO, no en cero. ' +
          'Bajarlo después es un trinquete: sólo puede bajar, y cada bajada es ' +
          'un commit con su medición.',
  },

  recall: {
    recuperados: 'MEDIBLE_HOY',
    mostrados: 'BLOQUEADO_POR_F116_PASO_0BIS',
    chunkEsperado: { 'N3-DUPLICADO': null },
  },

  lineaDeBase: {
    // ⚠️ `aciertos: null` NO es un hueco por rellenar: es el estado del
    // conocimiento, y el informe lo imprime como «SIN MEDIR — la primera pasada
    // DESCUBRE» (`scripts/examen.mjs:330-332`).
    aciertos: null,
    fecha: '2026-08 (día exacto NO DETERMINADO)',
    commit: 'DESCONOCIDO — anterior al verificador de hallazgos (e3827e17, 23/08)',
    falsos: 'APARECIÓ AL MENOS UNA VEZ el 18-19/08/2026, FRECUENCIA NO MEDIDA',
    fuente: 'claude/Consulta_Fable_F22_Juez.md:65-69 (ronda A) y ' +
            'claude/Estado_Del_MVP.md:6836-6838 (ronda B, los mismos dos falsos)',
    nota: '⚠️ UNA FRECUENCIA QUE NO SE MIDIÓ NO SE ESTIMA: SE DECLARA AUSENTE. ' +
          'Las dos rondas registran que estos falsos SALIERON, ninguna registra ' +
          'en cuántas pasadas de cuántas. No se sabe si aparecían siempre o una ' +
          'vez de veinte, y de esa diferencia depende qué significa un cero.',
    /**
     * ⚠️ Y LAS DOS RONDAS NO SE SUMAN NI SE PROMEDIAN (`Estado_Del_MVP.md`
     * :6873-6876). Son dos poblaciones con dos métodos: 40 documentos en cuatro
     * tandas contra 10 en comparación global. Que estos dos falsos salgan en
     * las dos listas es un dato sobre su robustez, no una frecuencia de 2 de 2.
     */
    dosRondas: 'NO SE SUMAN: poblaciones y métodos distintos',
  },
};
