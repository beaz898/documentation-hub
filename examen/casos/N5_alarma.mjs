/**
 * N5 · LA ALARMA · NOR-04 (plan de emergencia y evacuación) contra OPE-01
 *      (manual de apertura y cierre de clínica).
 *
 * NIVEL: **PRECISIÓN PURA.** Cubre el falso **4** de
 * `claude/Consulta_Fable_F22_Juez.md:76-78`, que es el **patrón 3 —
 * emparejamiento sin relación semántica**: «activar la alarma» de un incendio
 * contra «desactivar la alarma» de la apertura matinal. **Dos momentos distintos
 * del día.**
 *
 * ⚠️ POR QUÉ ESTE FALSO ES EL MÁS INSTRUCTIVO DE LOS CUATRO: las dos citas
 * **son opuestas de verdad en la superficie** —activar contra desactivar— y no
 * lo son en el fondo. No es un emparejamiento débil que el sistema estiró: es el
 * caso donde la oposición léxica está ahí y lo que falta es el contexto. Un
 * verificador que sólo mire si las dos frases se contradicen «como frases» lo
 * confirma; el que mire de qué habla cada una, no.
 *
 * ⚠️⚠️ SIN CONTROL POSITIVO PROPIO — igual que N4, y por la misma razón: el par
 * NOR-04 ↔ OPE-01 no lleva ninguna trampa sembrada.
 *   ⚠️ **Y OJO CON LA TENTACIÓN DE USAR N6 COMO ANCLA**: N6 comparte OPE-01 con
 *   este caso y sí tiene un acierto declarado —la trampa real del autoclave—,
 *   pero **esa trampa está medida como NO DETECTADA** (0 de 2 pasadas el
 *   23/09). Un ancla que nunca ha producido un no-cero no es un control
 *   positivo: es otra pantalla apagada. Por eso el ancla de N5 es la misma que
 *   la de N4 —la tanda— y no su vecino de documento.
 */

export default {
  id: 'N5',
  nivel: 'precision-pura',

  analizado: 'NOR-04_plan-de-emergencia-y-evacuacion.pdf',
  corpusExacto: ['OPE-01_manual-apertura-y-cierre-de-clinica.docx'],

  modo: 'rapido',
  pasadas: 5,

  debenSalir: [],

  elSilencioCuentaSiSoloSi: {
    // ⚠️ El ancla es de TANDA y no de documento. Ver la cabecera: N6, que sería
    // el vecino natural, tiene su acierto medido en CERO.
    caso: 'N1',
    hallazgo: 'N1-PUESTO',
    enLaMismaTanda: true,
    razon:
      'N5 no comparte documento con ningún caso que tenga un acierto medido y ' +
      'detectado, así que el ancla es el único que lo tiene en toda la tanda. ' +
      'Si N1 no acierta, el cero de N5 es SIN VEREDICTO, no verde.',
    fuente: 'claude/Tandas_Harness.md:1463',
  },

  noDebenSalir: [
    {
      id: 'N5-ALARMA',
      patronDeF22: 'emparejamiento-sin-relacion-semantica',
      pendienteDeOrigen: 'F-22 §2, patrón 3',
      temaEspurio: 'activación frente a desactivación de la alarma',
      // Las dos citas son literales de F-22:76-78 y están localizadas en el
      // texto extraído: NOR-04 en su fragmento 1, OPE-01 en su fragmento 0.
      citaEnElAnalizado: {
        literal: 'Activar la alarma y avisar al resto del personal.',
        discriminante: 'Activar la alarma y avisar al resto del personal',
      },
      citaEnElCorpus: {
        literal: 'Desactivar la alarma y encender la iluminación general.',
        discriminante: 'Desactivar la alarma y encender la iluminación general',
      },
      porQueNoEsContradiccion:
        'la primera es el protocolo de incendio; la segunda, el primer paso de ' +
        'la apertura matinal. Dos momentos distintos del día y dos funciones ' +
        'distintas de la alarma. Ninguna norma se opone a la otra.',
      cuentaComoFallo: true,
    },
  ],

  /**
   * ⚠️ UN AVISO SOBRE EL AISLAMIENTO DE ESTE DISCRIMINANTE, medido el
   * 25/09/2026 y que conviene no perder: OPE-01 **también habla de activar la
   * alarma**, en su línea 35 del texto extraído —«Activación de alarma y cierre
   * de puertas y ventanas»—, dentro de su protocolo de cierre.
   *
   * El discriminante aísla porque la cadena es distinta («Activar la alarma y
   * avisar…» frente a «Activación de alarma y cierre…»), y está comprobado:
   * 1 vez en NOR-04, 0 en OPE-01. **Pero el aislamiento es de CADENA, no de
   * TEMA**, y eso tiene dos consecuencias:
   *   · si alguien «mejora» el verificador para que compare por tema o por
   *     lema, este discriminante deja de aislar;
   *   · y un hallazgo sobre la alarma de CIERRE de OPE-01 contra la de NOR-04
   *     sería un falso **de la misma familia** que este caso no reconocería.
   * Se marca para etiqueta humana en vez de contarlo, que es lo que N1 hace con
   * Nuria Ferrer.
   */
  siApareceOtraAlarma: 'MARCAR_PARA_ETIQUETA_HUMANA',

  umbralDeAlarma: {
    minimoDeAciertos: 0,
    maximoDeFalsosConfirmados: null,
    estado: 'LINEA_DE_BASE_PENDIENTE',
    nota: 'Sin frecuencia medida no hay techo honesto. El primero lo escribe la ' +
          'primera tanda, en el máximo observado, y de ahí sólo puede bajar.',
  },

  recall: null,

  lineaDeBase: {
    aciertos: null,
    fecha: '2026-08-18/19 (ronda A) y agosto 2026, día no determinado (ronda B)',
    commit: 'DESCONOCIDO — anterior al verificador de hallazgos (e3827e17, 23/08)',
    falsos: 'APARECIÓ AL MENOS UNA VEZ el 18-19/08/2026, FRECUENCIA NO MEDIDA',
    fuente: 'claude/Consulta_Fable_F22_Juez.md:76-78 (ronda A) y ' +
            'claude/Estado_Del_MVP.md:6839-6840 (ronda B, falso 3 de los cinco)',
    nota: '⚠️ UNA FRECUENCIA QUE NO SE MIDIÓ NO SE ESTIMA: SE DECLARA AUSENTE. ' +
          'Sale en las dos rondas, y eso dice que es robusto, no que sea 2 de 2: ' +
          'las dos rondas no se suman ni se promedian (Estado_Del_MVP.md:6873).',
  },
};
