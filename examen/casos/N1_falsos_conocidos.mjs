/**
 * N1 · LOS FALSOS CONOCIDOS · RRHH-06 (evaluación del desempeño) contra
 *      OPE-02 (agenda y gestión de citas).
 *
 * NIVEL: **PRECISIÓN**, que es lo que el examen no medía. Es la carencia grave
 * de la consulta rápida del 25/09/2026:
 *   «El examen sólo mide "debe encontrar". Con sólo trampas sembradas, un
 *   sistema que emite todo lo que se le ocurre saca verde … el arnés mide
 *   COBERTURA y no PRECISIÓN, y vuestro fallo de la semana pasada fue de
 *   precisión.»
 *
 * ⚠️ ESTE CASO MIDE LAS DOS COSAS A LA VEZ, Y NO ES PEREZA: ES EL DISEÑO DEL
 * REPOSITORIO. `claude/Casos_Harness.md:41-47` dice literalmente que **el falso
 * positivo de Belmonte NO es un caso aparte**: «es una comprobación que se
 * aplica DENTRO de los casos 1 y 2». Un análisis, dos preguntas: ¿sale la
 * contradicción real de `Puesto`, y NO sale la espuria de las horas?
 * Separarlos costaría dos análisis para medir lo que uno mide.
 *
 * ⚠️⚠️ ESTA ADVERTENCIA CADUCÓ EL 25/09/2026 A LAS 17:14, y se deja con su
 * corrección al lado en vez de borrarla, porque el motivo importa. **Decía: «de
 * los siete falsos de agosto, éste es el único que se puede correr hoy; los
 * otros seis necesitan documentos que NO están en `corpus-pruebas/`».**
 * Los cinco documentos entraron ese día (`31c141d6`) y hoy corren **cuatro
 * casos más**: `N3` (pelo y calzado), `N4` (esterilización), `N5` (alarma) y
 * `N6` (autoclave, con la trampa REAL del par en `debenSalir`).
 * La tabla del bloque `LOS_QUE_NO_ENTRAN` del final está actualizada con lo que
 * sigue fuera, que son tres y ninguno por falta de fichero.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️⚠️⚠️ EL LÍMITE QUE HAY QUE LEER ANTES DE CUALQUIER VERDE DE ESTE CASO:
 * **LAS DOS MITADES DE N1 ESTÁN ESCRITAS DENTRO DEL PROMPT DEL JUEZ.**
 *
 * Fable listó como sexto modo de degradación de un examen que «las frases de los
 * documentos de prueba acaben dentro de un prompt o de un ejemplo», y propuso el
 * caso reservado como cura. **Medido el 25/09/2026: en este par ya ha ocurrido.**
 * `lib/analysis/judge.ts:831`, una sola línea del prompt, contiene las dos:
 *
 *   «Dos tablas de temas distintos comparten a las mismas personas: que una
 *   tenga datos que la otra no tiene NO es contradicción — son complementarios
 *   (**una fecha de evaluación y unas horas semanales no se comparan**). Pero si
 *   la MISMA columna aparece en ambas con valores distintos para la misma
 *   persona — **el mismo Puesto con dos valores** — eso SÍ se reporta…»
 *
 *   · «**una fecha de evaluación y unas horas semanales**» ES el falso de
 *     Belmonte/Nuria Ferrer, descrito por sus dos datos.
 *   · «**el mismo Puesto con dos valores**» ES la contradicción de Pablo Reyes,
 *     descrita por su columna.
 *
 * ⚠️ CONSECUENCIA, Y NO SE PUEDE SUAVIZAR: **este caso no mide si el sistema
 * generaliza. Mide si obedece una instrucción escrita sobre este par concreto.**
 * Un verde aquí dice «el prompt sigue diciendo lo que decía», no «el juez
 * distingue datos complementarios de contradicciones».
 *
 * ⚠️ Y NO ES TEÓRICO: ESA LÍNEA ES LA CURA DE UN FALLO DE TRES SEMANAS QUE ELLA
 * MISMA CAUSÓ. `claude/Cierre_B81.md:199-244` lo documenta: la versión anterior
 * del ejemplo —escrita en F-22 para matar el falso de Nuria Ferrer— «**describe
 * POR SU NOMBRE el par de prueba del proyecto**», y convivía con la regla
 * operativa que decía lo contrario. «El juez no tenía una regla: tenía dos y
 * elegía. Eso explica tres semanas de intermitencia sin necesidad de invocar
 * aleatoriedad.» La línea actual (`de158abd`) conserva la mitad que funcionaba e
 * invierte la que no — pero **sigue nombrando el caso de prueba**.
 *
 * QUÉ SE HACE CON ESTO, y son tres cosas, ninguna es «quitar la línea»:
 *   1. **N1 se queda**, porque medir que la instrucción se sigue cumpliendo
 *      TIENE valor: es el centinela de que nadie la borre por simetría, y
 *      Belmonte en 1/4 demuestra que ni siquiera obedeciéndola desaparece.
 *   2. **N1 NO cuenta como medida de precisión general.** El informe tiene que
 *      imprimir esta advertencia con el resultado, o alguien leerá el verde como
 *      lo que no es.
 *   3. **El caso reservado es obligatorio, y ninguno de los seis casos actuales
 *      puede serlo.** Éste menos que ninguno.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default {
  id: 'N1',
  nivel: 'precision-y-cobertura',

  analizado: 'RRHH-06_evaluacion-del-desempeno.xlsx',
  corpusExacto: ['OPE-02_agenda-y-gestion-de-citas.xlsx'],

  modo: 'rapido',
  pasadas: 5,

  /**
   * La contradicción REAL del par. Es el caso 1 del catálogo
   * (`Casos_Harness.md:35`) y está MEDIDO: «Detectada. Columna `Puesto` de Dr.
   * Pablo Reyes, confirmada por estructura» (`Tandas_Harness.md:1463`).
   * Va aquí porque un caso de esperado cero sin su acierto al lado no tiene
   * control positivo: cero falsos y cero aciertos es indistinguible de un
   * sistema apagado.
   */
  debenSalir: [
    {
      id: 'N1-PUESTO',
      sembrada: true,
      superficie: 'columna de tabla, mismo valor de clave',
      tema: 'puesto del Dr. Pablo Reyes',
      persona: 'Dr. Pablo Reyes',
      columnaEnOposicion: 'Puesto',
      enElAnalizado: 'Implantólogo',
      enElCorpus: 'Implantólogo / Cirujano oral',
      // ⚠️ Debe confirmarse POR ESTRUCTURA, no por juicio: la clave `Empleado`
      // es 100 % única en los dos lados (`Tandas_Harness.md:942`), así que el
      // emparejador tiene por dónde y el diff decide sin preguntar al modelo.
      // Si sale confirmada por JUICIO, el hallazgo es correcto y el CAMINO no:
      // significaría que la estructura dejó de emparejar, y eso es una
      // regresión aunque el marcador de aciertos no se mueva.
      confirmadoPorEsperado: 'estructura',
      severidadMinima: 'contradiction',
    },
  ],

  /**
   * ⚠️ LO QUE NO DEBE SALIR, Y PESA IGUAL QUE UNA CONTRADICCIÓN NO DETECTADA.
   * Decisión del director del 25/09/2026: «un hallazgo que coincida con un
   * noDebenSalir es un FALLO, y pesa igual que una contradicción no detectada.
   * No es un extra tolerado.»
   */
  noDebenSalir: [
    {
      id: 'N1-BELMONTE',
      // Patrón: título que anuncia una discrepancia de horas que las citas NO
      // contienen. Documentado en **B.82**
      // (`Puntos_Pendientes_Doclity.txt:1598-1611`).
      patronDeF22: 'titulo-que-las-citas-no-sostienen',
      pendienteDeOrigen: 'B.82',
      temaEspurio: 'Horas semanales de Dra. Ana Belmonte',
      // ⚠️ LAS DOS CITAS SON LITERALES, y por eso este falso SÍ entra. La ficha
      // B.82 las da entre comillas: «en la segunda las citas son literalmente
      // "Fecha evaluación: 2026-06-11" contra "Horas semana: 8", dos datos
      // distintos que el propio prompt pone como ejemplo de lo que NO es
      // contradicción».
      citaEnElAnalizado: {
        literal: 'Fecha evaluación: 2026-06-11',
        discriminante: 'Fecha evaluación: 2026-06-11',
      },
      citaEnElCorpus: {
        literal: 'Horas semana: 8',
        discriminante: 'Horas semana: 8',
      },
      cuentaComoFallo: true,

      /**
       * ⚠️ SU LÍNEA DE BASE NO ES CERO, Y ESO CAMBIA EL UMBRAL DE ESTE CASO.
       * `Casos_Harness.md:47`: «Su histórico: **4/4 con el ejemplo viejo del
       * prompt, 1/4 tras la cura `de158abd`**.»
       * O sea: la cura funcionó —de 4 de 4 a 1 de 4— **pero el falso NO está
       * extinguido**. Con 5 pasadas se espera verlo entre 0 y 2 veces.
       * Escribir `maximoDeFalsos: 0` haría este caso rojo la mayoría de los
       * días por algo ya medido, que es el error que el director prohibió en la
       * decisión 3.
       */
      lineaDeBase: {
        commit: 'de158abd',
        aparicionesSobrePasadas: '1/4',
        antesDeLaCura: '4/4',
        nota: 'La cura de158abd bajó de 4/4 a 1/4. NO está extinguido.',
      },
    },
    {
      id: 'N1-NURIA',
      // ⚠️ **NO ENTRA COMO COMPROBABLE, Y SE DEJA ESCRITO POR QUÉ.**
      // Es el falso original de **B.78**
      // (`Puntos_Pendientes_Doclity.txt:1551-1561`), el MISMO par y el MISMO
      // patrón que Belmonte, con otro empleado. Pero la ficha describe sus
      // citas en vez de transcribirlas —«una de evaluaciones (empleado, puesto,
      // clínica, fecha) y otra de turnos (empleado, puesto, box, días,
      // horas)»— y **F-22 sólo da su TÍTULO**, no sus dos citas.
      // Un falso sin cita literal no entra: emparejar por título es
      // exactamente lo que F-22 §4.1 midió que no se puede hacer, porque el
      // título no se verifica contra sus propias citas.
      patronDeF22: 'titulo-que-las-citas-no-sostienen',
      pendienteDeOrigen: 'B.78',
      temaEspurio: 'Horas semanales de Nuria Ferrer',
      citaEnElAnalizado: null,
      citaEnElCorpus: null,
      estado: 'SIN_CITA_LITERAL_NO_COMPROBABLE',
      cuentaComoFallo: false,
      // ⚠️ Y una consecuencia práctica que conviene no perder: si en una pasada
      // aparece un hallazgo titulado «Horas semanales de <cualquiera>», es
      // ESTE patrón aunque el empleado no sea Belmonte — B.82 midió que el
      // empleado cambia entre ejecuciones con el prompt idéntico. El informe lo
      // marca para que una persona lo etiquete, no lo cuenta solo.
      siApareceConOtroEmpleado: 'MARCAR_PARA_ETIQUETA_HUMANA',
    },
  ],

  // Los extras no se pueden dar por falsos: este par NO tiene auditoría
  // completa de sus dos tablas, a diferencia de NOR-11/CLI-13.
  extras: 'PENDIENTE_DE_ETIQUETA',

  umbralDeAlarma: {
    minimoDeAciertos: 1,           // la de Puesto está medida como detectada
    // ⚠️ 2 y no 0, por la línea de base medida de Belmonte (1/4 tras la cura).
    // Sube a 0 el día que una tanda de 10 lo dé en 0 — y eso es un commit con
    // motivo escrito, nunca automático.
    maximoDeFalsosConfirmados: 2,
    nota: 'El techo de falsos NO es cero porque Belmonte está medido en 1/4 ' +
          'tras la cura. Bajarlo a 0 exige una medición que lo justifique.',
  },

  recall: {
    recuperados: 'MEDIBLE_HOY',
    mostrados: 'BLOQUEADO_POR_F116_PASO_0BIS',
    chunkEsperado: { 'N1-PUESTO': null },
  },

  lineaDeBase: {
    commit: 'cceddf86',
    fecha: '2026-08-31',
    aciertos: 1,
    esperados: 1,
    falsos: 'entre 0 y 2 (Belmonte, 1/4 histórico)',
    detalle: { 'N1-PUESTO': 'DETECTADA, confirmada por estructura' },
    fuente: 'claude/Tandas_Harness.md:1463 (tanda 3) y Casos_Harness.md:35,47',
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ LOS QUE **NO** ENTRAN, Y POR QUÉ — el inventario que pidió el director
 * el 25/09/2026: «si alguno no se puede reconstruir con su cita, NO lo
 * inventes: escribe el caso con los que sí, y dime exactamente cuáles faltan y
 * dónde buscaste».
 *
 * DÓNDE SE BUSCÓ, por capacidad y no por nombre — todo sitio del repositorio que
 * pudiera contener una cita literal de un falso positivo:
 *   · `claude/Consulta_Fable_F22_Juez.md` (174 líneas, leído entero)
 *   · `claude/Estado_Del_MVP.md` §5.88, las dos rondas del piloto
 *   · `claude/Cierre_B81.md`
 *   · `claude/Casos_Harness.md` y `claude/Tandas_Harness.md`
 *   · `Puntos_Pendientes_Doclity.txt` (B.78, B.82, B.83)
 *   · `Bitacora_Sesiones.txt:4274-4362`, que es donde `Estado_Del_MVP.md`
 *     dice que están — y **remite a F-22**, no los repite.
 *
 * ⚠️ HALLAZGO 1 · «LOS SIETE» Y «LOS CINCO» SON DOS POBLACIONES DISTINTAS, y
 * confundirlas habría fabricado un caso falso:
 *   · **RONDA A** — 18-19/08/2026, 40 documentos, 4 tandas: **2 aciertos y 7
 *     falsos** = 77,8 %. Es la de F-22.
 *   · **RONDA B** — posterior, 10 documentos, comparación global: **5 falsos de
 *     6** = 83,3 %. Otros documentos, otro método.
 *   Las dos son verdad y ninguna se puede citar sin su contexto
 *   (`Estado_Del_MVP.md` §5.88).
 *
 * ⚠️ HALLAZGO 2 · **F-22 DICE SIETE Y ENUMERA SEIS.** Contados uno a uno en
 * `Consulta_Fable_F22_Juez.md:63-84`: pelo (1), calzado (2), esterilización (3),
 * alarma (4), autoclave (5), Nuria Ferrer (6). **El séptimo no está nombrado en
 * ningún sitio del repositorio.** No se inventa y no se cuenta: el informe del
 * examen NO puede decir «7 de 7 muertos» sobre una lista de seis.
 *
 * LA TABLA, falso por falso:
 *
 * LA TABLA, falso por falso — **REHECHA EL 25/09/2026 CON LOS CINCO FICHEROS
 * DENTRO.** La columna que cambió es la de los documentos; la de las citas, no:
 * ningún fichero puede dar una cita que nadie transcribió.
 *
 * | # | Par | Cita literal | Documentos | ¿Corre? |
 * |---|---|---|---|---|
 * | 1 | MKT-01 ↔ RRHH-05 · «pelo recogido» | ✅ las dos, F-22:66-67 | ✅ los dos | ✅ **N3** |
 * | 2 | MKT-01 ↔ RRHH-05 · calzado | ⚠️ **INFERIDA del documento**, no transcrita | ✅ los dos | ⚠️ **N3, con supuesto declarado** |
 * | 3 | RRHH-04 ↔ RRHH-06 · esterilización | ✅ las dos, F-22:71-73 | ✅ los dos | ✅ **N4** |
 * | 4 | NOR-04 ↔ OPE-01 · alarma | ✅ las dos, F-22:76-78 | ✅ los dos | ✅ **N5** |
 * | 5 | OPE-01 ↔ CLI-01 · autoclave | ✅ las dos, F-22:79-80 | ✅ los dos | ✅ **N6** ⚠️ *bloqueado mientras CLI-01 esté duplicado* |
 * | 6 | RRHH-06 ↔ OPE-02 · Nuria Ferrer | ❌ sólo el título | los dos sí | ❌ sin cita |
 * | 6-bis | RRHH-06 ↔ OPE-02 · **Belmonte** | ✅ las dos, **B.82** | los dos sí | ✅ **ES EL DE ARRIBA** |
 * | 7 | **no identificado** | — | — | ❌ |
 *
 * ⚠️ **EL 2 ENTRA POR UNA VÍA DISTINTA QUE LOS OTROS, y se dice**: F-22 sólo
 * escribió «ídem con el calzado». Lo que lo desbloquea no es una transcripción
 * aparecida, es que **cada documento tiene UNA sola frase sobre calzado** y la
 * relación entre las dos es la que F-22 describe —la de RRHH-05 es la de MKT-01
 * reordenada más la coletilla—. Eso determina el par de citas por el material.
 * Sigue siendo una inferencia, va etiquetada como tal en `N3` y un hallazgo de
 * calzado con otras citas se marca para etiqueta humana en vez de contarse.
 *
 * ⚠️ Y EL 5 —el del autoclave, el que volvió el 23/09 y disparó F-116— **ya se
 * puede vigilar**: es `N6`, y además es el único caso del examen cuyas dos
 * mitades están medidas, porque el mismo fallo produjo un falso positivo
 * confirmado y un falso negativo sobre la trampa real. Su evidencia es
 * reproducible desde el fichero: las ocho longitudes de CLI-01 salen exactas
 * (ver `claude/Estado_Del_MVP.md` §5.91).
 *
 * ⚠️ Y UNA PRECISIÓN SOBRE BELMONTE, para no colarlo como lo que no es: **no es
 * uno de los siete de la ronda A.** B.82 lo midió el **21/08** sobre el mismo
 * par, después de la ronda A. Es el MISMO patrón con otro empleado, tiene sus
 * dos citas literales y un histórico medido, y por eso sirve — pero entra como
 * falso documentado, no como «uno de los siete».
 *
 * LO QUE HACE FALTA DEL DIRECTOR, actualizado — **el punto 1 está HECHO**:
 *   1. ✅ **CLI-01, OPE-01, RRHH-04, RRHH-05 y NOR-04** en `corpus-pruebas/`,
 *      el 25/09/2026 (`31c141d6`), declarados en `lib/corpus-del-harness.test.ts`
 *      y con registro en `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`.
 *   2. ⚠️ **Las dos citas de Nuria Ferrer.** (La del calzado ya no hace falta:
 *      ver arriba, entra por inferencia del documento con el supuesto escrito.)
 *   3. ⚠️ **Cuál es el séptimo.** Es su documento y su recuento; afirmar «7 de 7»
 *      sobre seis sería fabricar la métrica que mide todas las demás.
 *
 * ⚠️ Y UNA COSA QUE APARECIÓ AL MEDIR Y NO ESTABA BUSCADA: **la ronda B tiene un
 * falso más que hoy sería construible**, y no se ha construido porque es OTRA
 * POBLACIÓN y eso lo decide el director. Es el quinto de los cinco de la ronda B
 * (`claude/Estado_Del_MVP.md:6841-6843`): la periodicidad bienal del reciclaje de
 * RCP en **RRHH-04** contra «iniciar soporte vital básico si es necesario» en
 * **NOR-04** — patrón 2. Los dos documentos están ya en `corpus-pruebas/` y la
 * segunda cita es literal y localizada (NOR-04, línea 19 del texto extraído).
 * El otro que quedaría —hospital de referencia, CLI-04 ↔ NOR-04— necesita CLI-04,
 * que no está.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const LOS_QUE_NO_ENTRAN = {
  fecha: '2026-09-25',
  // ⚠️ REVISADO EL MISMO DÍA, DESPUÉS DE QUE ENTRARAN LOS CINCO FICHEROS.
  deLosSiete: { conCitaLiteral: 5, sinCitaLiteral: 2, sinIdentificar: 1, enumeradosEnF22: 6 },
  corribles: [
    'RRHH-06 ↔ OPE-02  (N1 · Belmonte)',
    'MKT-01 ↔ RRHH-05  (N3 · pelo y calzado)',
    'RRHH-04 ↔ RRHH-06 (N4 · esterilización)',
    'NOR-04 ↔ OPE-01   (N5 · alarma)',
    'OPE-01 ↔ CLI-01   (N6 · autoclave) — bloqueado mientras CLI-01 esté duplicado',
  ],
  faltanEnCorpusPruebas: [],
  faltanCitas: ['Nuria Ferrer (RRHH-06 ↔ OPE-02)'],
  sinIdentificar: 'el séptimo de F-22',
  // De la ronda B, con material pero sin decisión: es otra población.
  construibleSinAprobar: 'RCP bienal (RRHH-04) contra soporte vital básico (NOR-04) — ronda B, falso 5',
};
