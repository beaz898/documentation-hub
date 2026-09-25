/**
 * N4 · ESTERILIZACIÓN PENDIENTE · RRHH-04 (formación obligatoria y reciclaje)
 *      contra RRHH-06 (evaluación del desempeño).
 *
 * NIVEL: **PRECISIÓN PURA.** Cubre el falso **3** de
 * `claude/Consulta_Fable_F22_Juez.md:71-73`, que es el **patrón 2 — una cita
 * dice que algo EXISTE y la otra que a alguien LE FALTA**.
 *
 * ⚠️⚠️ ESTE CASO NO TIENE CONTROL POSITIVO PROPIO, Y VA DICHO AQUÍ ARRIBA
 * PORQUE ES SU LIMITACIÓN PRINCIPAL. El par RRHH-04 ↔ RRHH-06 **no lleva
 * ninguna trampa sembrada** —no sale en ningún registro de siembra de
 * `corpus-pruebas/`— así que no hay nada que el sistema DEBA emitir. Un verde
 * aquí es indistinguible de un sistema apagado leído desde el propio caso.
 *
 * ⚠️ SU CONTROL POSITIVO ES DE TANDA, NO DE CASO, y eso convierte la
 * limitación en una condición comprobable: **el silencio de N4 sólo cuenta si en
 * la MISMA tanda N1 produjo su acierto** —la contradicción de `Puesto` de Pablo
 * Reyes, medida y detectada (`Tandas_Harness.md:1463`)—. N1 comparte RRHH-06 con
 * este caso, así que si el sistema estuviera mudo, N1 lo cantaría.
 *   No es un apaño: es la regla del cero de esta casa aplicada donde el caso no
 *   puede cumplirla solo. Un cero confirma si y sólo si el camino que lo produjo
 *   ha producido un no-cero en las mismas condiciones, y aquí «las mismas
 *   condiciones» son la tanda.
 *
 * ⚠️ LO QUE ESTO EXIGE DEL MARCADOR, y no existe todavía: N4 no puede imprimir
 * «PASA» por su cuenta. Si N1 no acertó en esa tanda, el resultado de N4 es
 * **SIN VEREDICTO**, no verde.
 */

export default {
  id: 'N4',
  nivel: 'precision-pura',

  analizado: 'RRHH-04_formacion-obligatoria-reciclaje.md',
  corpusExacto: ['RRHH-06_evaluacion-del-desempeno.xlsx'],

  modo: 'rapido',
  pasadas: 5,

  /**
   * ⚠️ VACÍO, Y NO POR OLVIDO. Ver la cabecera: este par no tiene siembra.
   * Rellenarlo con algo «parecido a un acierto» sería fabricar la expectativa
   * que hace verde al caso.
   */
  debenSalir: [],

  /**
   * ⚠️ LA CONDICIÓN QUE SUSTITUYE AL CONTROL POSITIVO QUE NO HAY.
   * Se declara como dato del caso para que el marcador la pueda leer, en vez de
   * quedarse en un comentario que nadie ejecuta.
   */
  elSilencioCuentaSiSoloSi: {
    caso: 'N1',
    hallazgo: 'N1-PUESTO',
    enLaMismaTanda: true,
    razon:
      'N1 comparte RRHH-06 con este caso y tiene un acierto MEDIDO y detectado. ' +
      'Si N1 no acierta en la misma tanda, el cero de N4 no distingue «no ' +
      'inventó» de «no funcionó nada», y el veredicto es SIN VEREDICTO.',
    fuente: 'claude/Tandas_Harness.md:1463 y claude/Casos_Harness.md:35',
  },

  noDebenSalir: [
    {
      id: 'N4-ESTERILIZACION',
      patronDeF22: 'existe-frente-a-le-falta',
      pendienteDeOrigen: 'F-22 §2, patrón 2',
      temaEspurio: 'protocolo de esterilización frente a reciclaje pendiente',
      // ⚠️ LAS DOS CITAS SON LITERALES DE F-22:72-73 y las dos están
      // localizadas: RRHH-04 en su fragmento 0 (el único que tiene), RRHH-06 en
      // su fragmento 16 (una fila de la hoja).
      citaEnElAnalizado: {
        literal: 'Protocolo de esterilización y control de infecciones (ver CLI-01 y CLI-02).',
        // F-22 la recoge recortada —«Protocolo de esterilización... (ver CLI-01
        // y CLI-02»— con puntos suspensivos y sin cerrar el paréntesis. El
        // discriminante es el tramo que SÍ está literal y en UNA línea del
        // documento: en RRHH-04 la frase se maqueta como «…infecciones (ver
        // CLI-01 y\n  CLI-02).», así que cruzar el salto lo dejaría AUSENTE.
        discriminante: 'Protocolo de esterilización y control de infecciones',
      },
      citaEnElCorpus: {
        literal: 'Pendiente reciclaje de esterilización',
        discriminante: 'Pendiente reciclaje de esterilización',
      },
      porQueNoEsContradiccion:
        'una dice que la formación EXISTE en el catálogo obligatorio; la otra, ' +
        'que un empleado concreto la tiene PENDIENTE. Son coherentes: la ' +
        'segunda presupone la primera.',
      cuentaComoFallo: true,
    },
  ],

  /**
   * ⚠️ ESTE CASO VIVE A OCHO CARACTERES DE DEJAR DE FUNCIONAR, Y HAY QUE
   * REMEDIR SI ALGUIEN EDITA RRHH-04.
   *
   * Medido el 25/09/2026: RRHH-04 produce **UN** trozo de **1.493** caracteres y
   * `MAX_CHUNK_SIZE` es **1.500** (`lib/chunking.ts:28`). Con un solo fragmento
   * no hay costura posible, así que el discriminante del analizado está a salvo
   * por construcción. **Ocho caracteres más y el documento se parte en dos**, y
   * entonces la frase «Protocolo de esterilización y control de infecciones»
   * puede caer justo en la costura y el caso pasa a NO_MEDIBLE.
   *
   * No es una catástrofe —el verificador lo canta antes de gastar un crédito—
   * pero sí es una caducidad: **quien edite RRHH-04 tiene que volver a medir el
   * troceado antes de creerse una pasada de este caso.** El detalle y el resto
   * de fragilidades, en `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`.
   */
  fragilidadDeclarada: {
    documento: 'RRHH-04_formacion-obligatoria-reciclaje.md',
    trozos: 1,
    longitud: 1493,
    tope: 1500,
    margen: 7,
    siSeEdita: 'REMEDIR_EL_TROCEADO_ANTES_DE_CREER_UNA_PASADA',
  },

  umbralDeAlarma: {
    minimoDeAciertos: 0,                 // no hay ninguno que exigir, y se dice
    maximoDeFalsosConfirmados: null,
    estado: 'LINEA_DE_BASE_PENDIENTE',
    nota: 'Sin frecuencia medida no hay techo honesto. El primero lo escribe la ' +
          'primera tanda, en el máximo observado, y de ahí sólo puede bajar.',
  },

  recall: null,  // no hay trampa cuyo fragmento buscar

  lineaDeBase: {
    aciertos: null,
    fecha: '2026-08-18/19',
    commit: 'DESCONOCIDO — anterior al verificador de hallazgos (e3827e17, 23/08)',
    falsos: 'APARECIÓ AL MENOS UNA VEZ el 18-19/08/2026, FRECUENCIA NO MEDIDA',
    fuente: 'claude/Consulta_Fable_F22_Juez.md:71-73 (ronda A, 40 documentos, 4 tandas)',
    nota: '⚠️ UNA FRECUENCIA QUE NO SE MIDIÓ NO SE ESTIMA: SE DECLARA AUSENTE. ' +
          'La ronda A registra que este falso salió, no en cuántas pasadas de ' +
          'cuántas. Sin eso, un cero no distingue «curado» de «hoy no tocaba».',
  },
};
