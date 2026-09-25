/**
 * P3 · OPE-10 (tarifario general) contra OPE-11 (tarifario de seguros).
 * NIVEL: **el EMPAREJADOR DE TABLAS y el diff estructural**, no el juez.
 *
 * Camino que ejercita, por orden: `table-key.ts` (descubrimiento de clave) →
 * `table-pairing.ts` (`emparejarTablas`, invocado desde `pipeline.ts:15`) →
 * `table-diff.ts` (la columna que difiere) → `diff-vision.ts` → `diff-emision.ts`.
 * El juez sólo entra para lo que la estructura le degrade.
 *
 * ⚠️⚠️ LO QUE ESTE CASO **NO** CUBRE, Y HAY QUE SABERLO ANTES DE LEER UN VERDE:
 * **LA CONFUSIÓN DE LADOS.** Los dos ficheros tienen **25 filas exclusivas cada
 * uno** —la ajenidad es simétrica—, y esa simetría hace el par incapaz de cazar
 * que se intercambien los argumentos.
 *
 * No es una sospecha: se midió. `corpus-pruebas/SIEMBRA_corpus_ampliado.md`,
 * añadido el 30/08/2026 (F-88 paso 1, también **B.121**):
 *   «Se comprobó: intercambiar los dos argumentos del descubrimiento de clave
 *   (pasar el candidato donde va el documento analizado y al revés) NO ROMPÍA
 *   NINGÚN CASO mientras la batería se apoyara en el corpus, porque los dos
 *   montones tienen el mismo tamaño y salen iguales del derecho y del revés.»
 *   «Qué se rompería de verdad si esa confusión llegara a producción: el sistema
 *   diría "presente sólo en OPE-10" donde toca decir "sólo en OPE-11". **La
 *   cifra seguiría siendo 25, el recuento cuadraría, y la frase estaría
 *   invertida — un fallo que ningún contador puede ver porque no cambia ningún
 *   número.**»
 *
 * ⚠️ DÓNDE SÍ VIVE ESA PROPIEDAD, para que quien lea esto dentro de seis meses
 * sepa adónde ir: **`lib/analysis/table-pairing.test.ts`**, en el caso «los
 * LADOS no se pueden intercambiar», **con montones de 0 y 2 a propósito** — la
 * asimetría que este corpus no tiene, fabricada como fixture.
 *
 * ⚠️ Y POR QUÉ NO SE ARREGLA SEMBRANDO LA ASIMETRÍA AQUÍ, que sería lo obvio:
 * «No es un defecto del corpus. Dos tarifarios de la misma clínica con el mismo
 * número de exclusivas es un dato realista, y sembrar la asimetría a propósito
 * sólo para poder medir esto sería fabricar un documento contra la regla de
 * admisión. Es un LÍMITE DEL INSTRUMENTO.»
 * Y su corolario, que es lo que hay que mirar cuando llegue un cliente:
 * «cualquier par cuyos dos montones de exclusivas difieran en tamaño sirve para
 * lo que éste no puede».
 *
 * ---------------------------------------------------------------------------
 * VERIFICACIÓN DE ESTE CASO CONTRA LOS .xlsx — 25/09/2026, fila por fila.
 * No se copió del registro: se recalculó leyendo las dos hojas y uniendo por
 * `Código`. Resultado: **el registro es EXACTO en todo**.
 *   filas: 60 y 60 · comunes 35 · sólo OPE-10: 25 · sólo OPE-11: 25
 *   idénticas 20 · discrepantes 15 · **filas con más de una columna distinta: 0**
 * Las nueve columnas reales de las dos hojas, por su nombre exacto de cabecera:
 *   Código | Tratamiento | Categoría | Precio base | Precio con seguro |
 *   Duración (min) | Profesional asignado | Clínica | Revisión
 * ⚠️ `Precio con seguro` y `Revisión` NO se mencionan en el registro, y conviene
 * saber que existen: son dos columnas más donde una discrepancia podría
 * aparecer. Medido: no aparece en ninguna de las 15.
 * Hojas: «Tarifas» en OPE-10, «Tarifas concertadas» en OPE-11.
 */

/** Las 15 discrepantes, con su columna y sus dos valores. RECALCULADAS de los
 *  .xlsx el 25/09/2026, no transcritas. Los valores van sin el «€» que el
 *  registro les pone: en la celda son números desnudos. */
const DISCREPANTES = [
  { codigo: 'DIA-02', columna: 'Duración (min)',       enElAnalizado: '20',  enElCorpus: '15'  },
  { codigo: 'DIA-04', columna: 'Profesional asignado', enElAnalizado: 'Cristina Ibáñez',  enElCorpus: 'Sonia Prats' },
  { codigo: 'HIG-03', columna: 'Clínica',              enElAnalizado: 'Salamanca', enElCorpus: 'Chamberí' },
  { codigo: 'HIG-04', columna: 'Precio base',          enElAnalizado: '25',  enElCorpus: '30'  },
  { codigo: 'CON-03', columna: 'Duración (min)',       enElAnalizado: '50',  enElCorpus: '40'  },
  { codigo: 'CON-04', columna: 'Profesional asignado', enElAnalizado: 'Dr. Carlos Medina', enElCorpus: 'Dra. Marta Gil' },
  { codigo: 'END-03', columna: 'Precio base',          enElAnalizado: '280', enElCorpus: '260' },
  { codigo: 'END-04', columna: 'Clínica',              enElAnalizado: 'Salamanca', enElCorpus: 'Retiro' },
  { codigo: 'PRO-03', columna: 'Duración (min)',       enElAnalizado: '90',  enElCorpus: '75'  },
  { codigo: 'PRO-04', columna: 'Precio base',          enElAnalizado: '600', enElCorpus: '540' },
  { codigo: 'IMP-03', columna: 'Profesional asignado', enElAnalizado: 'Dr. Pablo Reyes', enElCorpus: 'Dra. Ana Belmonte' },
  { codigo: 'ORT-03', columna: 'Clínica',              enElAnalizado: 'Chamberí', enElCorpus: 'Salamanca' },
  { codigo: 'EST-03', columna: 'Precio base',          enElAnalizado: '180', enElCorpus: '160' },
  { codigo: 'CIR-03', columna: 'Duración (min)',       enElAnalizado: '45',  enElCorpus: '60'  },
  { codigo: 'URG-03', columna: 'Profesional asignado', enElAnalizado: 'Dra. Ana Belmonte', enElCorpus: 'Dr. Pablo Reyes' },
];

const IDENTICAS = [
  'DIA-01', 'DIA-03', 'HIG-01', 'HIG-02', 'CON-01', 'CON-02', 'END-01', 'END-02',
  'PRO-01', 'PRO-02', 'IMP-01', 'IMP-02', 'ORT-01', 'ORT-02', 'EST-01', 'EST-02',
  'CIR-01', 'CIR-02', 'URG-01', 'URG-02',
];

/** Sólo en OPE-10. ⚠️ Son la mitad que el registro original NO mencionaba, y sin
 *  ellas la dirección OPE-10 → OPE-11 «parece que debería emparejarlo todo, y no
 *  es cierto». Recalculadas el 25/09. */
const SOLO_EN_EL_ANALIZADO = [
  'DIA-05', 'DIA-06', 'HIG-05', 'HIG-06', 'CON-05', 'CON-06', 'END-05', 'END-06',
  'PRO-05', 'PRO-06', 'IMP-04', 'IMP-05', 'IMP-06', 'ORT-04', 'ORT-05', 'ORT-06',
  'EST-04', 'EST-05', 'EST-06', 'CIR-04', 'CIR-05', 'CIR-06', 'URG-04', 'URG-05',
  'URG-06',
];

/** Sólo en OPE-11. Las 25 tienen «Chamberí» en la columna Clínica — repetición
 *  DELIBERADA, dice el registro, «para comprobar que un sistema de análisis no
 *  confunde una columna con valor repetido con una señal real de coincidencia».
 *  ⚠️ Y son más fáciles que las de arriba: llevan prefijo propio (SEG-). Las de
 *  OPE-10 continúan las familias que existen en los dos ficheros, «lo que las
 *  hace más fáciles de confundir con las comunes por prefijo y por vocabulario». */
const SOLO_EN_EL_CORPUS = Array.from({ length: 25 }, (_, i) =>
  `SEG-${String(i + 1).padStart(2, '0')}`);

export default {
  id: 'P3',
  nivel: 'emparejador-de-tablas',

  analizado: 'OPE-10_tarifario-tratamientos-2026.xlsx',
  corpusExacto: ['OPE-11_tarifario-tratamientos-seguros.xlsx'],

  modo: 'rapido',
  pasadas: 5,

  /**
   * ⚠️ AQUÍ EL RESULTADO ESPERADO **NO** ES UNA LISTA DE HALLAZGOS DE PROSA: es
   * la clasificación de 60 filas contra 60. Por eso este caso tiene su propio
   * bloque en vez de `debenSalir`, y por eso su comparador es otro.
   *
   * ⚠️ Y LA CLAVE: el emparejamiento es por `Código`, que es lo que
   * `table-key.ts` debe DESCUBRIR por sí solo. Si el examen le dijera cuál es la
   * clave, estaría midiendo el diff y regalando el descubrimiento — que es la
   * mitad que falla primero cuando llega una tabla nueva.
   */
  esperadoEstructural: {
    claveDescubierta: ['Código'],
    filasEnElAnalizado: 60,
    filasEnElCorpus: 60,
    identicas: IDENTICAS,
    discrepantes: DISCREPANTES,
    soloEnElAnalizado: SOLO_EN_EL_ANALIZADO,
    soloEnElCorpus: SOLO_EN_EL_CORPUS,

    // El cuadre del caso, que es lo que se comprueba antes que nada: si esto no
    // suma, el sistema perdió filas por un camino que nadie declaró.
    cuadre: '20 idénticas + 15 discrepantes + 25 sólo en A + 25 sólo en B = 85 ' +
            'clasificaciones sobre 60+60 filas, con 35 comunes contadas una vez',
  },

  /**
   * ⚠️ EL CRITERIO EXIGENTE DE ESTE CASO, y es lo que lo distingue de contar
   * cifras: para cada una de las 15 no basta con que el sistema diga
   * «discrepancia». Tiene que **NOMBRAR LA COLUMNA CONCRETA**, y tiene que ser
   * la correcta. `SelectionLimit` y los contadores sólo dan recuentos
   * (`lib/analysis/types.ts:192-198`: documentName, sheetName, tableId,
   * rowsLeftOut, rowsRecovered — recuentos, nada de columnas), así que un
   * contador que diga «15» no prueba nada: podrían ser 15 columnas equivocadas.
   */
  exigeNombrarLaColumna: true,

  /**
   * ⚠️ NO SE FUERZAN COINCIDENCIAS, Y LAS DOS DIRECCIONES SE JUZGAN IGUAL.
   * Un sistema que empareje alguna SEG- con algo de OPE-10 «sólo porque
   * comparten el valor Chamberí» falla; y uno que empareje alguna de las 25 de
   * OPE-10 falla igual. Es el mismo criterio por los dos lados, dice el
   * registro, y es la corrección del 27/08 al §5 original.
   */
  falloSiFuerzaPareja: true,

  umbralDeAlarma: {
    // Las tres cifras del cuadre, exactas. No hay pendiente conocido que rebaje
    // este listón: el par se midió y clasificó bien en agosto.
    identicasMinimo: 20,
    discrepantesConColumnaCorrectaMinimo: 15,
    sinParejaForzadaMaximo: 0,
  },

  /**
   * ⚠️ ESTE CASO NO USA recall@k, y decirlo evita una confusión: recall mide si
   * el fragmento con la trampa llegó a la recuperación, y aquí las trampas son
   * FILAS de una tabla, no fragmentos de prosa. Lo que decide es si el
   * emparejador descubrió la clave, y eso se ve en el reparto de arriba.
   * Lo que SÍ conviene anotar de la recuperación: con 60 filas por hoja y
   * `MAX_FRAGMENTS_PER_DOC_QUICK = 25` (`retrieval.ts:109`), **el presupuesto no
   * puede mostrar las 60 filas al juez**. Por eso este caso mide la ESTRUCTURA,
   * que no pasa por ese presupuesto, y no el juicio.
   */
  recall: null,

  /**
   * SIN MEDIR con las cifras de hoy. El registro declara el resultado que
   * DEBERÍA dar un sistema perfecto (§5) y las tandas de agosto midieron la
   * dirección A del caso 6/7 del catálogo, no este reparto completo por las dos
   * direcciones. No se rellena a ojo.
   */
  lineaDeBase: {
    commit: null,
    fecha: null,
    aciertos: null,
    nota: 'SIN MEDIR el reparto completo. Lo que sí está medido es el CORPUS ' +
          '(las 60+60 filas, recalculadas el 25/09/2026), no la respuesta del ' +
          'sistema. La primera pasada DESCUBRE.',
  },
};
