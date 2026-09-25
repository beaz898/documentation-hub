/**
 * N6 · EL AUTOCLAVE · OPE-01 (manual de apertura y cierre) contra CLI-01
 *      (protocolo de esterilización del instrumental).
 *
 * ⚠️⚠️ ES EL CASO QUE EXISTE POR F-116, Y EL ÚNICO DEL EXAMEN QUE MIDE LAS DOS
 * MITADES DE UN MISMO FALLO A LA VEZ:
 *   · **el falso positivo** que salió CONFIRMADO al usuario el 23/09/2026;
 *   · **el falso negativo** de la trampa REAL del mismo par, que nunca se
 *     detectó.
 *
 * Las dos tienen la MISMA causa medida y reproducible: el reparto del
 * presupuesto de 3.000 caracteres dejó fuera los dos únicos fragmentos de CLI-01
 * que hablan del autoclave —el primero **por 17 caracteres**— y el juez afirmó
 * el conflicto citando la frase más próxima de lo que sí tenía delante
 * (`claude/consultas-fable/F-116.md:28-46`).
 *
 * ⚠️ POR ESO NO SE PUEDE ESCRIBIR UN CASO QUE VIGILE SÓLO EL FALSO. Si mañana el
 * falso desaparece y la trampa sigue sin detectarse, **eso no es un arreglo: es
 * el mismo fallo con menos ruido.** Un caso que sólo mirase `noDebenSalir`
 * pintaría verde ese día.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ LA EVIDENCIA ES REPRODUCIBLE DESDE `corpus-pruebas/` — medido el 25/09/2026
 * y es lo que este caso tiene y ningún otro: el troceado de CLI-01 desde el
 * fichero da **exactamente** las ocho longitudes que F-116 reconstruyó de la
 * base, en el mismo orden de índice:
 *
 *     chunk 0 → 476 · 1 → 653 · 2 → 998 · 3 → 392
 *     chunk 4 → 890  ⟵ «Temperatura: 134 °C». EL QUE NO CUPO POR 17.
 *     chunk 5 → 1.073 · 6 → 450  ⟵ «30 días en condiciones normales». EL QUE SÍ ENTRÓ.
 *     chunk 7 → 789
 *
 * El juez citó el 6 porque el 4 no cabía. **La reconstrucción de F-116 dejó de
 * ser una inferencia sobre registros y es un control positivo reproducible sin
 * base de datos y sin créditos.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ PRECONDICIÓN QUE HOY NO SE CUMPLE — **CLI-01 ESTÁ DUPLICADO** en la
 * organización de pruebas (leído por el director el 25/09/2026). El caso nombra
 * un CÓDIGO y el endpoint tiene que resolverlo a un id: con dos filas no sabe a
 * cuál. **Este caso no se lanza hasta que haya una sola.** Y las dos filas NO se
 * limpian antes de medirlas: son la evidencia de si el duplicado contaminó la
 * tanda del 23/09 (`SQL_CLI01_duplicado_y_RRHH04.sql`).
 */

export default {
  id: 'N6',
  nivel: 'precision-y-cobertura',

  analizado: 'OPE-01_manual-apertura-y-cierre-de-clinica.docx',
  corpusExacto: ['CLI-01_protocolo-esterilizacion-instrumental.txt'],

  modo: 'rapido',
  pasadas: 5,

  precondicion: {
    id: 'N6-CLI01-UNICO',
    comprobar: 'una sola fila de documents cuyo name empiece por CLI-01',
    siNoSeCumple: 'ABORTA — no se lanza y no se gasta',
    razon:
      'el caso nombra un código y el endpoint lo resuelve a un id. Con dos ' +
      'filas mediría contra una de las dos sin decir cuál, y la pasada no ' +
      'sería repetible ni comparable con la del 23/09.',
    donde: 'SQL_examen_estado_de_los_documentos.sql, consulta 2, columna `coincidencias`',
  },

  /**
   * LA TRAMPA REAL — y su línea de base es CERO, medido.
   *
   * ⚠️ `minimoDeAciertos` ES 0 Y NO 1, y hay que leer por qué o el caso sale
   * rojo el primer día por algo que jamás ha funcionado (la decisión 3 del
   * director del 25/09, la misma que hizo nacer P2 en 2 de 3):
   * **esta contradicción no se ha detectado NUNCA.** El 23/09 se analizó este
   * par dos veces con resultados idénticos y la trampa no salió en ninguna.
   *
   * Así que aquí un **1 es PROGRESO, no un aprobado**, y un 0 es la línea de
   * base cumpliéndose. El informe tiene que decirlo con esas palabras: si
   * imprime «0 de 1 aciertos» sin el contexto, cualquiera lo lee como un fallo
   * nuevo cuando es el estado conocido.
   */
  debenSalir: [
    {
      id: 'N6-CICLO-REAL',
      sembrada: true,
      superficie: 'dos valores numéricos con unidad, en documentos de prosa',
      tema: 'ciclo estándar del autoclave: temperatura y tiempo',
      citaEnElAnalizado: {
        literal: 'se debe programar el autoclave a 121 °C durante 30 minutos',
        // ⚠️ El discriminante NO es «121 °C» a secas aunque aísle hoy: una
        // cadena de seis caracteres puede aparecer mañana en cualquier
        // documento nuevo del corpus y el aislamiento se rompería sin que nadie
        // lo note. Se usa la frase, que está entera en una línea del texto
        // extraído (línea 19).
        discriminante: 'programar el autoclave a 121 °C durante 30 minutos',
      },
      citaEnElCorpus: {
        literal: 'Temperatura: 134 °C',
        // En CLI-01 el ciclo se escribe en DOS líneas —«Temperatura: 134 °C» y
        // «Tiempo de exposición (meseta): 18 minutos»—, así que un
        // discriminante que quisiera las dos cifras cruzaría un salto de línea
        // y saldría AUSENTE. Se toma la primera, que está entera en su línea y
        // vive en el fragmento 4: el que no cupo.
        discriminante: 'Temperatura: 134 °C',
      },
      confirmadoPorEsperado: 'juicio',
      cuentaParaElUmbral: true,
      fragmentoEsperado: 4,
      /**
       * ⚠️ EL CONTADOR QUE HACE LEGIBLE ESTE CASO, y es el que F-116 pidió: si
       * la trampa NO sale, hay que poder decir **dónde murió**, y la primera
       * sospecha está medida — que el fragmento 4 no entró en el reparto.
       * Mientras el paso 0-bis de F-116 no persista los ids de los fragmentos
       * mostrados, esto se responde con el log del reparto y no con la base.
       */
      siNoSale: 'MIRAR_SI_EL_FRAGMENTO_4_ENTRO_EN_EL_REPARTO',
    },
  ],

  noDebenSalir: [
    {
      id: 'N6-TREINTA',
      patronDeF22: 'empareja-dos-30-sin-relacion',
      pendienteDeOrigen: 'F-22 §2, patrón 3 · y su reaparición en F-116',
      temaEspurio: 'ciclo de esterilización (el falso que lleva el nombre del acierto)',
      citaEnElAnalizado: {
        literal: 'se debe programar el autoclave a 121 °C durante 30 minutos',
        discriminante: 'programar el autoclave a 121 °C durante 30 minutos',
      },
      citaEnElCorpus: {
        literal: 'La caducidad del envasado estéril es de 30 días en condiciones normales de almacenamiento',
        // ⚠️ RECORTADO PORQUE LA FRASE ESTÁ MAQUETADA EN DOS LÍNEAS en CLI-01
        // (104-105: «…estéril es\nde 30 días…»). Con la cita entera el
        // verificador la da por AUSENTE estando ahí — fragilidad 3 de
        // `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`.
        discriminante: '30 días en condiciones normales de almacenamiento',
      },
      porQueNoEsContradiccion:
        'empareja dos «30» que no comparten unidad: minutos de ciclo contra ' +
        'días de caducidad del envasado. Es el caso exacto para el que el ' +
        'verificador tenía definido el veredicto `sin_relacion`, y dijo ' +
        'confirmado.',
      cuentaComoFallo: true,
      fragmentoDondeVive: 6,

      /**
       * ⚠️ SU LÍNEA DE BASE SÍ ESTÁ MEDIDA, Y ES LA ÚNICA DE LOS CUATRO CASOS
       * NUEVOS QUE LO ESTÁ: **2 de 2 pasadas el 23/09/2026**, «dos veces, con
       * resultados idénticos» (`F-116.md:159`). Y no sólo salió: **pasó el
       * verificador y llegó al usuario como contradicción CONFIRMADA.**
       *
       * ⚠️ POR ESO SU TECHO NO ES CERO Y ES UN TRINQUETE. Con 2 de 2 la
       * frecuencia observada es del 100 %, así que exigir cero pondría el caso
       * en rojo el primer día por el comportamiento conocido. El techo nace en
       * el máximo observado —5 de 5 pasadas— y **sólo puede bajar**: la primera
       * tanda que dé menos lo baja, en un commit con su motivo escrito. Es el
       * mismo mecanismo que `TECHO_DECLARADO` de
       * `lib/documentacion/invariantes-de-estado.test.ts`, y por la misma razón:
       * quien arregla, baja el número; si no lo baja, la próxima regresión cabe
       * en el hueco que dejó.
       */
      lineaDeBase: {
        commit: 'el de producción del 23/09/2026',
        aparicionesSobrePasadas: '2/2',
        severidadObservada: 'contradiction, CONFIRMADA por el verificador',
        nota: 'Es un falso que atravesó TODAS las puertas. No es un candidato ' +
              'que se colara: es un hallazgo publicado.',
        fuente: 'claude/consultas-fable/F-116.md:15-24 y :159-163',
      },
    },
  ],

  /**
   * ⚠️ UNA DISCREPANCIA QUE NO RESUELVO Y QUE VA AL DIRECTOR, porque es él quien
   * puede cerrarla abriendo los ficheros:
   *
   * `claude/Estado_Del_MVP.md:6878-6880` dice, con fecha 23/09/2026 y con él
   * como fuente: «de las cinco trampas sembradas sólo sobrevive UNA —la
   * conservación de historia clínica—. Así que el criterio hoy es un acierto y
   * cero falsos, no dos y cero.»
   *
   * **Y la trampa del autoclave está en los dos ficheros, medido hoy**:
   * «Temperatura: 134 °C» en CLI-01 (línea 70, fragmento 4) y «121 °C durante 30
   * minutos» en OPE-01 (línea 19, fragmento 1). F-116 también la da por
   * existente el 24/09 («CLI-01 dice 134 °C/18 min y OPE-01 dice 121 °C/30 min.
   * Esa contradicción nunca se detectó»).
   *
   * Las dos cosas no pueden ser verdad a la vez. **Lo más probable es que
   * «sobrevive» se dijera del corpus de PRODUCCIÓN y no de estos ficheros**, o
   * que la frase se refiriera a otras cuatro trampas — pero eso es una
   * hipótesis mía y no la escribo como hecho en ningún sitio.
   * Mientras no se cierre, este caso se sostiene solo: su discriminante se
   * comprueba contra los fragmentos ANTES de pagar, así que si la trampa no
   * estuviera, el caso abortaría con `AUSENTE` en vez de medir el vacío.
   */
  discrepanciaAbierta: 'ESTADO_DEL_MVP_6878_FRENTE_A_LA_MEDICION_DEL_25_09',

  umbralDeAlarma: {
    // 0 y no 1: la trampa nunca se ha detectado. Un 1 es progreso.
    minimoDeAciertos: 0,
    // 5 de 5 y no 0: es el máximo observable con la frecuencia medida al 100 %.
    // TRINQUETE — sólo puede bajar, y cada bajada lleva su medición.
    maximoDeFalsosConfirmados: 5,
    esTrinquete: true,
    nota: 'El techo del falso nace en el MÁXIMO OBSERVABLE porque su frecuencia ' +
          'medida es 2/2 = 100 %. Exigir cero sería rojo permanente por el ' +
          'comportamiento conocido. La primera tanda que dé menos baja el número.',
  },

  recall: {
    recuperados: 'MEDIBLE_HOY',
    mostrados: 'BLOQUEADO_POR_F116_PASO_0BIS',
    // ⚠️ El fragmento que decide el caso está identificado, y es la primera vez
    // que un caso del examen puede decir CUÁL: el 4 de CLI-01.
    chunkEsperado: { 'N6-CICLO-REAL': 4 },
  },

  lineaDeBase: {
    commit: 'el de producción del 23/09/2026',
    fecha: '2026-09-23',
    aciertos: 0,
    esperados: 1,
    falsos: '2 de 2 pasadas, y CONFIRMADO por el verificador',
    detalle: {
      'N6-CICLO-REAL': 'NO DETECTADA — el fragmento 4 quedó fuera del reparto por 17 caracteres',
      'N6-TREINTA': 'EMITIDO Y CONFIRMADO en las dos pasadas',
    },
    fuente: 'claude/consultas-fable/F-116.md (cabecera y §1-2)',
    nota: '⚠️ La única línea de base CON FRECUENCIA MEDIDA de los cuatro casos ' +
          'nuevos. Las de N3, N4 y N5 nacen como «apareció al menos una vez el ' +
          '18-19/08, FRECUENCIA NO MEDIDA»: una frecuencia que no se midió no se ' +
          'estima, se declara ausente.',
  },
};
