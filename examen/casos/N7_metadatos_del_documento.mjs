/**
 * N7 · METADATOS DEL DOCUMENTO · NOR-11 (gestión de residuos) contra CLI-13
 *      (instrucciones clínicas de residuos).
 *
 * NIVEL: **precisión pura, esperado CERO.** El primer caso de la especie de
 * B.276: fecha de versión, autor, código, departamento emisor son ATRIBUTOS
 * DEL DOCUMENTO, no afirmaciones sobre el mundo, y dos documentos con fechas
 * de versión distintas no se contradicen. Prerrequisito de B.273 (B.274).
 *
 * ⚠️ NACE EN ROJO, A PROPÓSITO. Base medida: el juez emitió «Fecha de última
 * revisión» (9 contra 16 de febrero) en la pasada 1 de P2, tanda `c39397e7`
 * — un falso en cinco pasadas, confirmado por el director. Techo 0. Se pone
 * verde cuando se arregle la rúbrica del juez: es una prueba de regresión de
 * un fallo conocido (F-117), no un rojo perpetuo — la base no es 0.
 *
 * ⚠️ LA REGLA QUE SEPARA UN METADATO DE UNA CONTRADICCIÓN LEGÍTIMA SOBRE FECHAS.
 * Dos documentos SÍ pueden contradecirse sobre una fecha si la dan distinta
 * para el mismo hecho del mundo. Lo que no es contradicción es que la fecha de
 * versión de A difiera de la de B. La regla escrita, para este par:
 *   «un hallazgo es sobre metadatos si sus DOS citas son el VALOR de un mismo
 *    campo de la cabecera de cada documento».
 * Se hace cumplir con discriminantes que son esos valores, y sólo vale porque
 * está MEDIDO que cada valor aparece UNA vez en su documento y CERO en el otro
 * (con el `normalize` del verificador, 28/09/2026): una cita literal que lo
 * contenga sólo puede venir de la cabecera. Y en este par no hay otra fecha:
 * «2026» aparece una sola vez en cada documento — no existe aquí una fecha del
 * mundo con la que confundirse. La batería (`scripts/examen-n7.test.mjs`)
 * vuelve a contar los valores en los `.docx`; si un día aparecen en el cuerpo,
 * el discriminante deja de separar y la batería lo canta.
 *
 * ⚠️ LO QUE ESTE CASO NO MIDE: la especie ENTERA. Versión («1.3»/«1.1»: con
 * `normalize` quedan «13»/«11», que están por todo el texto) y código («NOR-11»
 * aparece 4 veces en cada uno) no aíslan: si el juez los emparejara, saldrían
 * como extras sin etiquetar, no como falsos. La regla general —la rúbrica del
 * juez y el verificador ciego— es la cura de B.276, y este caso su termómetro.
 *
 * ⚠️ MISMO PAR Y DIRECCIÓN QUE P2: en una tanda, el análisis se paga dos veces.
 */

export default {
  id: 'N7',
  nivel: 'precision-pura',
  analizado: 'NOR-11_gestion-de-residuos-sanitarios.docx',
  corpusExacto: ['CLI-13_instrucciones-clinicas-residuos.docx'],
  modo: 'rapido',
  pasadas: 5,

  debenSalir: [],

  // El silencio de un caso de precisión sólo significa algo si otro caso de la
  // misma tanda demuestra que el sistema no estaba mudo (como N4 y N5).
  elSilencioCuentaSiSoloSi: {
    caso: 'N1',
    hallazgo: 'N1-PUESTO',
    enLaMismaTanda: true,
    razon: 'N1-PUESTO salió 10/10 en la tanda 97223b72: si falla en la misma tanda, un cero aquí no distingue «no confundió» de «no funcionó nada».',
    fuente: 'examen/resultados/2026-09-27_97223b72/informe.txt',
  },

  noDebenSalir: [
    {
      id: 'N7-FECHA',
      patronDeF22: 'metadatos-del-documento',
      temaEspurio: 'fecha de última revisión de cada documento',
      citaEnElAnalizado: { literal: '9 de febrero de 2026', discriminante: '9 de febrero de 2026' },
      citaEnElCorpus: { literal: '16 de febrero de 2026', discriminante: '16 de febrero de 2026' },
      porQueNoEsContradiccion: 'cada documento declara SU PROPIA fecha de versión; no son el mismo dato',
      cuentaComoFallo: true,
      lineaDeBase: {
        commit: 'c39397e7',
        aparicionesSobrePasadas: '1/5',
        nota: 'Pasada 1 de P2 (mismo par, misma dirección), 27/09/2026. Citas del juez: «9 de febrero de 2026» / «16 de febrero de 2026».',
      },
    },
    {
      id: 'N7-DEPARTAMENTO',
      temaEspurio: 'departamento emisor de cada documento',
      citaEnElAnalizado: { literal: 'Dirección de Operaciones · Área Clínica', discriminante: 'Dirección de Operaciones · Área Clínica' },
      citaEnElCorpus: { literal: 'Coordinación de Calidad', discriminante: 'Coordinación de Calidad' },
      porQueNoEsContradiccion: 'quién emite cada documento es un atributo suyo; dos emisores distintos no se contradicen',
      cuentaComoFallo: true,
    },
  ],
  extras: 'PENDIENTE_DE_ETIQUETA',

  umbralDeAlarma: {
    // 0: ningún metadato se presenta como contradicción. La base es 1 de 5, así
    // que nace en rojo y se pone verde con el arreglo de la rúbrica (B.276).
    maximoDeFalsosConfirmados: 0,
  },

  recall: null,

  lineaDeBase: {
    commit: 'c39397e7',
    fecha: '2026-09-27',
    aciertos: null,
    falsos: '1 en 5 pasadas (N7-FECHA, pasada 1)',
    fuente: 'examen/resultados/2026-09-27_c39397e7/P2_pasada1.json',
    nota: 'Medida sobre P2, que analiza el mismo par en la misma dirección. N7 no ha corrido nunca con su propio id.',
  },
};
