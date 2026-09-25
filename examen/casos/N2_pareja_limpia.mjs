/**
 * N2 · LA PAREJA LIMPIA · MKT-01 (manual de identidad corporativa) contra
 *      los CUATRO documentos del piloto.
 *
 * NIVEL: **el silencio.** El resultado correcto es cero hallazgos. Es la
 * segunda mitad de la carencia grave de la consulta rápida del 25/09: «y al
 * menos una pareja limpia».
 *
 * ⚠️⚠️ NO ES UNA PAREJA, Y NO PUEDE SERLO. ÉSTA ES LA DECISIÓN DE DISEÑO DEL
 * CASO Y NO ES MÍA: está escrita en `claude/Casos_Harness.md:58-72` desde el
 * 27/08/2026, y su razón vale más que la regla:
 *
 *   «Con corpus vacío y MKT-01 solo, "cero hallazgos" es **trivialmente
 *   cierto** y no prueba nada — no hay contra qué equivocarse. Lo que este caso
 *   mide es que el sistema **NO INVENTA HALLAZGOS TENIENDO MATERIAL DELANTE**, y
 *   para eso necesita material delante.»
 *   «Un control negativo sin nada que comparar no es un control: es una pregunta
 *   sin enunciado. Por eso los cuatro documentos del harness son parte del caso
 *   5, no contaminación de él.»
 *
 * O sea: **una pareja limpia de dos documentos daría un cero sin denominador**,
 * que es justo lo que este proyecto tiene prohibido producir. De ahí que
 * `corpusExacto` lleve cuatro y no uno. Es la única excepción al aislamiento por
 * pares de todo el examen, y es razonada, no una comodidad.
 *
 * ⚠️ POR QUÉ MKT-01 Y NO OTRO — la evidencia, que es lo que el director pidió
 * («quiero saber por qué crees que están limpios, no que lo supongas»):
 *
 *   1. **ESTÁ MEDIDO, DOS VECES, Y DIO CERO.**
 *      · `claude/Tandas_Harness.md:1346` — «MKT-01 | **Cero hallazgos**»
 *      · `claude/Tandas_Harness.md:1467` — «5 · MKT-01 con los otros cuatro |
 *        **Limpio: cero hallazgos**» (tanda 3, `cceddf86`, 31/08/2026)
 *      No es «no encontré nada al mirarlo»: es una pasada real con material
 *      delante que no inventó.
 *
 *   2. **SU TEMA ESTÁ AISLADO POR CONSTRUCCIÓN.** Es un manual de identidad
 *      corporativa —tipografías, logotipo, colores de marca— frente a
 *      evaluaciones de desempeño, agenda de citas, historia clínica y RGPD. No
 *      comparte ni una magnitud comparable con ninguno de los cuatro.
 *      ⚠️ Y esto es una hipótesis con apoyo, no una certeza: el censo de
 *      vecindario lo usó precisamente por eso —«es prosa y de tema aislado: si
 *      tiene 15 vecinos a 0,9, el problema no es sólo de tablas»
 *      (`Tandas_Harness.md:3333`)—, así que su aislamiento temático es una
 *      propiedad que esta casa ya había usado como instrumento.
 *
 *   3. **NO HAY NINGUNA SIEMBRA ENTRE MKT-01 Y LOS CUATRO.** Los registros de
 *      siembra del piloto declaran las trampas entre RRHH-06↔OPE-02 y
 *      CLI-03↔NOR-01. MKT-01 es el quinto y su papel declarado en el catálogo
 *      es «control negativo».
 *
 * ⚠️⚠️ Y LA SALVEDAD QUE HAY QUE LEER ANTES DEL CERO, porque la escribió la
 * propia tanda que lo midió (`Tandas_Harness.md:1132-1135`):
 *
 *   «El caso 5 EXIGE cuatro acompañantes. Es su condición, no ruido. El rerank
 *   seleccionó **2 de 4** (OPE-02 y RRHH-06) y los juzgó con 0 y 0. El caso se
 *   cumple —tenía material delante y no inventó— pero es **UN CONTROL MÁS DÉBIL
 *   QUE SI HUBIERA JUZGADO LOS CUATRO**. Anotado.»
 *
 * Así que el cero medido vale, y vale **la mitad de lo que parece**: el juez
 * sólo vio dos de los cuatro. El caso lleva por eso un contador propio
 * —cuántos candidatos llegaron al juez— y el informe tiene que imprimirlo: un
 * cero con dos documentos juzgados y un cero con cuatro **no son la misma
 * medición**, y sin ese número los dos se leen igual.
 *
 * ⚠️ UNA COSA QUE **NO** SE USA COMO PAREJA LIMPIA, Y CONVIENE DECIRLO: el par
 * **MKT-01 ↔ RRHH-05**. Es la tentación obvia —son dos documentos de prosa— y
 * es **exactamente el par equivocado**: llevaba un DUPLICADO sembrado y produjo
 * los falsos 1 y 2 de F-22 (pelo y calzado). `Estado_Del_MVP.md:6837` lo dice:
 * «es el mismo par que llevaba el duplicado sembrado, así que el sistema vio el
 * parecido y lo clasificó al revés». Usarlo como pareja limpia sería declarar
 * limpio el par más sucio del corpus.
 *
 * ⚠️ 25/09/2026 — la coletilla de esta nota decía «(Y RRHH-05 tampoco está en
 * `corpus-pruebas/`)» y **ya no es verdad**: entró ese día (`31c141d6`). El
 * argumento de arriba no dependía de eso y sigue intacto — pero el par ya no
 * está sólo descartado como pareja limpia, **está USADO como lo que es**: es el
 * caso `N3`, de precisión, con los falsos 1 y 2 en `noDebenSalir` y el duplicado
 * sembrado como su control positivo.
 */

export default {
  id: 'N2',
  nivel: 'silencio-con-material-delante',

  analizado: 'MKT-01_manual-identidad-corporativa.docx',

  // ⚠️ CUATRO, Y ES LA CONDICIÓN DEL CASO. Ver el bloque de arriba: con menos,
  // el cero es trivialmente cierto y no mide nada.
  corpusExacto: [
    'RRHH-06_evaluacion-del-desempeno.xlsx',
    'OPE-02_agenda-y-gestion-de-citas.xlsx',
    'CLI-03_historia-clinica-consentimiento-informado.txt',
    'NOR-01_rgpd-proteccion-datos-pacientes.pdf',
  ],

  modo: 'rapido',
  pasadas: 5,

  /**
   * ⚠️ VACÍO A PROPÓSITO, y es el único caso del examen que lo tiene. No es un
   * caso sin expectativa: su expectativa es el SILENCIO, y va en
   * `noDebenSalir` como una regla en vez de como una lista de hallazgos
   * concretos — porque no se puede enumerar lo que no debe aparecer.
   */
  debenSalir: [],

  noDebenSalir: [
    {
      id: 'N2-CUALQUIERA',
      descripcion: 'cualquier contradicción entre MKT-01 y cualquiera de los cuatro',
      regla: 'TODO_HALLAZGO_DE_TIPO_CONTRADICCION',
      cuentaComoFallo: true,
      // ⚠️ LAS INCONSISTENCIAS MENORES SE CUENTAN APARTE Y NO COMO FALLO.
      // Son otra severidad y otra sección de la pantalla (`CLAUDE.md`,
      // severity tiers), y mezclarlas cambiaría la tasa sin que nadie lo
      // decidiera — es la misma razón por la que la consulta 3 de
      // SQL_deteccion_CLI03.sql las separa.
      alcance: 'solo severity=contradiction',
    },
  ],

  /**
   * ⚠️ EL CONTADOR QUE HACE LEGIBLE EL CERO, y sale de la salvedad de la tanda
   * 3. Un cero con dos candidatos juzgados y un cero con cuatro no son la misma
   * medición. Sin esto, el caso puede degradarse en silencio: si un día el
   * rerank selecciona CERO candidatos, el resultado sería «cero hallazgos» —
   * verde perfecto— y no habría medido nada en absoluto.
   *
   * Es la regla del cero de esta casa aplicada a su propio control negativo:
   * un cero confirma si y sólo si el camino que lo produjo puede producir un
   * no-cero, y el denominador es lo único que lo dice.
   */
  denominadorObligatorio: {
    candidatosJuzgados: 'SE_IMPRIME_SIEMPRE',
    minimoParaQueElCeroValga: 2,
    siEsMenor: 'NO_MEDIBLE',
    nota: 'Con 0 o 1 candidatos juzgados, "cero hallazgos" es trivialmente ' +
          'cierto y el caso NO cuenta como verde. La tanda 3 midió 2 de 4, así ' +
          'que 2 es el mínimo con precedente — no un número elegido.',
  },

  umbralDeAlarma: {
    minimoDeAciertos: 0,                 // no hay aciertos que exigir
    maximoDeFalsosConfirmados: 0,        // ⚠️ aquí SÍ es cero, y está medido
    minimoDeCandidatosJuzgados: 2,       // si baja, es NO MEDIBLE, no verde
  },

  // ⚠️ recall@k no aplica: no hay trampa cuyo fragmento buscar. Lo que importa
  // aquí es el denominador de arriba, que es su equivalente.
  recall: null,

  lineaDeBase: {
    commit: 'cceddf86',
    fecha: '2026-08-31',
    aciertos: 0,
    falsos: 0,
    candidatosJuzgados: 2,
    detalle: { 'N2-CUALQUIERA': 'CERO hallazgos con 2 de 4 candidatos juzgados' },
    fuente: 'claude/Tandas_Harness.md:1467 y :1132-1135 (la salvedad del 2 de 4)',
    nota: '⚠️ El cero está medido pero el control es MÁS DÉBIL de lo que parece: ' +
          'el juez sólo vio 2 de los 4 acompañantes. Una pasada que juzgue los ' +
          'cuatro y siga en cero sería una base mejor, y el informe debe poder ' +
          'distinguirlas.',
  },
};
