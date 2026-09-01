import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import { emparejarTablas, type ParDeTablas } from './table-pairing';
import { groupChunksByTable, type TableGroup } from './table-structure';
import type { DocumentJudgment } from './types';

/**
 * EL CAMINO DEL DESCARTE, EJERCIDO DE VERDAD (F-89 P2, B.124).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ⚠️ LO QUE ESTE FICHERO DEMUESTRA Y LO QUE NO. LÉELO ANTES DE APOYARTE EN ÉL.
 *
 * DEMUESTRA: que SI un hallazgo con un emparejamiento inválido entra en la
 * cascada, sale descartado, con su contador y sin llegar a confirmarse.
 *
 * NO DEMUESTRA: que el juez lo emita. Aquí el hallazgo está FABRICADO — copiado
 * de lo que el juez produjo en producción el 30/08, pero fabricado. No hay
 * ningún modelo en este fichero.
 *
 * POR QUÉ IMPORTA LA DISTINCIÓN, y no es una cautela de manual: la verificación
 * en pantalla de este mismo arreglo NO FUE CONCLUYENTE. Cuatro pasadas en
 * producción y el juez no volvió a emitir el falso ni una sola vez —B.82: no es
 * estable ni consigo mismo—, así que la guarda no cazó nada porque no tuvo nada
 * que cazar. Este fichero existe para que la demostración no dependa de que el
 * juez repita un fallo que no repite. Ver B.125.
 *
 * Dicho al revés, que es como se leerá dentro de seis meses: esto prueba EL
 * CABLEADO, no LA INCIDENCIA. Que el camino funciona; no con qué frecuencia se
 * recorre.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ⚠️ SIN LLAMAR A NINGÚN MODELO — pero NO «por construcción». Esa frase estaba
 * escrita aquí, en este mismo sitio, y ERA FALSA.
 *
 * `applyCascadeToCandidate` alcanza `verifyFindings` —su única llamada al LLM—
 * en cuanto un hallazgo sobrevive hasta `toVerify`, y un caso de este fichero
 * lo hacía: salía a api.anthropic.com de verdad, volvía 401 «invalid
 * x-api-key», el fail-open del cliente se lo tragaba —que es lo CORRECTO en
 * producción— y el caso PASABA EN VERDE.
 *
 * La frase decía además que una llamada así «fallaría por falta de clave de
 * API, que es un aviso ruidoso y no un falso verde». No era ruidoso: el código
 * de producción está DISEÑADO para tragarse los fallos de red. El aviso no
 * existía, y por eso nadie lo oyó.
 *
 * Lo que ahora lo garantiza no es una frase, es una guarda: `vitest.setup.ts`
 * rompe cualquier caso que haga una llamada externa, y lo rompe desde
 * `afterEach` para que ningún `catch` de producción pueda silenciarla.
 *
 * LA REGLA QUE SALE DE AQUÍ, y vale para todo el fichero: SOLO CABEN CAMINOS
 * QUE TERMINEN EN DESCARTE. Lo que sobrevive, sobrevive HACIA EL MODELO, y eso
 * no se mide en una batería determinista — se mide en una tanda.
 *
 * ⚠️ Y LO QUE ESO DEJA SIN PROBAR, DECLARADO Y NO ESCONDIDO: la rama de la
 * DEGRADACIÓN del punto 4 —sin clave pero CON ancla, que baja a la llamada
 * corta— no tiene caso aquí y no puede tenerlo. Degradar es SOBREVIVIR, y
 * sobrevivir es alcanzar el modelo. De las cuatro ramas del punto 4, tres
 * terminan en descarte y están ejercidas; la cuarta solo se puede ver en
 * producción.
 *
 * ⚠️ Y EL TERCER ESTADO DE `differingColumns` TAMPOCO: cuando las listas de
 * columnas son `null`, R2 sale por `pass` y el hallazgo SOBREVIVE hasta la
 * llamada corta. Mismo motivo que la degradación — sobrevivir alcanza el
 * modelo. Lo que sí se prueba, en `finding-rules.test.ts`, es que R2 devuelve
 * `pass`; que la supresión no lo toque, no. *
 * Lo que SÍ está probado de ella, en `finding-rules.test.ts`: que R2 devuelve el
 * ancla correcta, que es la entrada de la decisión. Lo que NO: que la cascada
 * lea esa entrada y empuje el hallazgo a `toVerify`. F-91 acepta ese límite al
 * dar por buena la degradación universal.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

async function tablas(file: string): Promise<TableGroup[]> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'd', file, 'o')));
}

async function corpus(): Promise<{ pares: ParDeTablas[]; nueva: TableGroup; existente: TableGroup }> {
  const tn = await tablas(OPE11);
  const te = await tablas(OPE10);
  const { pares } = emparejarTablas(tn, te);
  return { pares, nueva: pares[0].nueva, existente: pares[0].existente };
}

function fila(t: TableGroup, codigo: string): StoredChunk {
  const f = t.rows.find(r => r.cells?.['Código'] === codigo);
  if (!f) throw new Error(`no existe la fila ${codigo}`);
  return f;
}

/**
 * EL HALLAZGO TAL COMO EL JUEZ LO EMITIÓ EN PRODUCCIÓN, el 30/08.
 *
 * Título, citas y columnas copiados del log: «Profesional asignado para Carilla
 * de composite (EST-03)», con las OCHO columnas compartidas citadas en los dos
 * lados — que es lo que produce `alignQuoteToCells` cuando el juez cita la fila
 * entera.
 */
function juicioConHallazgo(
  nueva: StoredChunk,
  existente: StoredChunk,
  columnas: string[],
): { judgment: DocumentJudgment; evidence: JudgmentEvidence } {
  return {
    judgment: {
      documentId: 'bbb-222',
      documentName: OPE10,
      source: 'manual',
      overlapPercent: 50,
      verdict: 'solapamiento_parcial',
      contradictions: [{
        topic: 'Profesional asignado para Carilla de composite (EST-03)',
        newDocSays: nueva.text,
        existingDocSays: existente.text,
        severity: 'contradiction',
      }],
      overlappingContent: [],
      uniqueToNewDoc: [],
    },
    evidence: {
      contradictions: [{
        hash: 'dc678e1b',
        newChunk: nueva,
        existingChunk: existente,
        newColumns: columnas,
        existingColumns: columnas,
      }],
      overlaps: [],
    },
  };
}

async function correrCascada(
  nueva: StoredChunk,
  existente: StoredChunk,
  columnas: string[],
  pares: ParDeTablas[],
  chunksNuevos: StoredChunk[],
  chunksExistentes: StoredChunk[],
  sinInterseccion: ParDeTablas[] = [],
) {
  const { judgment, evidence } = juicioConHallazgo(nueva, existente, columnas);
  return applyCascadeToCandidate(
    judgment, evidence, chunksNuevos, chunksExistentes, OPE11, 'test', [],
    { emitidos: pares, sinInterseccion },
  );
}

describe('la cascada descarta el emparejamiento inválido — camino completo', () => {
  /**
   * EL CASO DE B.124, ENTERO. Es el falso positivo que llegó a producción con
   * el sello más fuerte del producto: EST-02 contra EST-03, ocho columnas
   * citadas, todas distintas. Antes del frente 1 salía
   * `confirmado.por_estructura`.
   *
   * ⚠️ CAMBIÓ DE CONTADOR EL 01/09, Y EL CAMBIO ES EL ARREGLO. Hasta el
   * reordenado de F-93 moría por `cubierto_por_diff`: la supresión estaba
   * escrita `if (cobertura !== 'sin_cobertura')` y se llevaba por igual a las
   * filas que ERAN pareja y a las que NO. Ahora muere por
   * `emparejamiento_invalido`, que es lo que siempre fue — dos filas con claves
   * distintas no son la misma entidad, y eso se COMPRUEBA en vez de darse por
   * cubierto.
   * F-93 P1 daba por hecho que ya ocurría así. No ocurría: sobre pares emitidos
   * no se verificaba identidad ninguna. Por eso `emparejamiento_invalido`
   * llevaba a cero desde que se creó, y por eso ahora se mueve.
   *
   * Y ES LA CONDICIÓN DE QUE B.124 NO VUELVA POR LA PUERTA QUE ABRIÓ LA LECTURA
   * C: con la supresión exigiendo que las filas sean pareja, este hallazgo ya
   * no se suprime — si no muriera aquí, caería a R2, saldría `confirm` y el
   * punto 4 lo mandaría a la llamada corta. Vivo.
   */
  it('EST-02 contra EST-03 muere en IDENTIDAD, no por cobertura', async () => {
    const { pares, nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'EST-02'), fila(existente, 'EST-03'), columnas,
      pares, nueva.rows, existente.rows,
    );

    expect(r.judgment.contradictions).toHaveLength(0);
    expect(r.tally.descartados).toBe(1);
    expect(r.tally.confirmados).toBe(0);
    expect(r.judgment.discarded?.['descartado.emparejamiento_invalido']).toBe(1);
    // Y NO por la otra puerta: si volviera a contarse como cubierto, sería que
    // alguien reconflagró las dos condiciones.
    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBeUndefined();
  });

  /**
   * Y NO SE CUENTA COMO CONFIRMADO POR ESTRUCTURA, que es la mitad que importa
   * para la promesa del producto: el sello no se pone y se quita, es que no
   * llega a ponerse.
   */
  it('no deja rastro de confirmación por estructura', async () => {
    const { pares, nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'EST-02'), fila(existente, 'EST-03'), columnas,
      pares, nueva.rows, existente.rows,
    );

    expect(r.tally.confirmadosPorEstructura).toBe(0);
    expect(r.judgment.discarded?.['confirmado.por_estructura']).toBeUndefined();
  });

  /**
   * EL DUPLICADO — Y ES EL PUNTO ENTERO DE F-89 P4, no un daño colateral.
   *
   * EST-03 contra EST-03 difiere en Precio base: es una de las quince
   * sembradas y el juez ACIERTA. Aun así SE SUPRIME, porque esa misma
   * discrepancia ya está entre las quince que el diff emitió, con mejor
   * evidencia. Publicarla dos veces es el «diecisiete donde hay quince» medido
   * en producción el 30/08.
   *
   * ⚠️ CON LA CITA DE UNA SOLA COLUMNA, que es lo que el juez hace cuando
   * acierta — medido el 30/08 en el exhaustivo. El caso de la fila entera va
   * justo debajo, y bajo la lectura vieja habrían dado resultados distintos.
   */
  it('el duplicado se suprime — cita de UNA columna', async () => {
    const { pares, nueva, existente } = await corpus();
    const r = await correrCascada(
      fila(nueva, 'EST-03'), fila(existente, 'EST-03'), ['Precio base'],
      pares, nueva.rows, existente.rows,
    );

    expect(r.judgment.contradictions).toHaveLength(0);
    expect(r.tally.confirmadosPorEstructura).toBe(0);
    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBe(1);
  });

  /**
   * ⚠️ EL MISMO DUPLICADO CON LA FILA ENTERA CITADA, y es el caso que decidió
   * la lectura C sobre las otras dos.
   *
   * El juez cita las nueve columnas; la oposición es UNA (`Precio base`). Bajo
   * la lectura por columnas CITADAS, la intersección incluye las dos columnas
   * clave —Código y Tratamiento—, que nunca están en `comparadas`, así que la
   * inclusión fallaba y esto NO se suprimía: el 17→15 se deshacía sin que nada
   * pareciera roto.
   * Bajo la lectura C se mira la OPOSICIÓN, no la cita, y las dos formas de
   * citar dan el mismo resultado — que es lo que se quiere de una regla que no
   * debe depender de cómo de hablador esté el modelo.
   */
  it('el mismo duplicado con la FILA ENTERA citada se suprime igual', async () => {
    const { pares, nueva, existente } = await corpus();
    const todas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'EST-03'), fila(existente, 'EST-03'), todas,
      pares, nueva.rows, existente.rows,
    );

    expect(r.judgment.contradictions).toHaveLength(0);
    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBe(1);
  });

  /**
   * ⚠️ EL CRUCE TABLA-PROSA NO TIENE CASO AQUÍ, Y ES DELIBERADO: lo tuvo, y era
   * el falso verde que destapó la guarda de red.
   *
   * La propiedad es buena — un hallazgo con un lado de prosa NO se suprime, y
   * sale gratis por cómo está escrita la condición: `veredictoDeEmparejamiento`
   * devuelve 'sin_cobertura' en cuanto un lado no es fila de tabla. F-78 y F-90
   * le reservan ese territorio al juez —«el precio de la tabla contra el
   * párrafo que dice otro»— y ahí el diff no tiene nada que decir.
   *
   * PERO «NO SE SUPRIME» QUIERE DECIR QUE SOBREVIVE, y sobrevivir en esta
   * cascada es llegar a `verifyFindings`. El caso llamaba al modelo, la llamada
   * fallaba, el fail-open se la tragaba y el verde no significaba nada.
   *
   * DÓNDE VIVE AHORA: en la función pura, que es donde la propiedad es
   * determinista — `emparejamiento-juez.test.ts`, «un hallazgo de PROSA —sin
   * fila de tabla— no se toca», con los dos lados.
   *
   * QUÉ SE PIERDE, dicho y no escondido: el CABLEADO del lado de prosa, o sea
   * que la cascada le pase a `veredictoDeEmparejamiento` los argumentos que
   * cree. El cableado de la supresión sí queda probado por los dos casos de
   * arriba, que terminan en descarte y por eso no tocan ningún modelo; el del
   * lado de prosa no tiene forma determinista de probarse aquí.
   */
  /**
   * ⚠️ EL FRENO, ejercido en el camino y no solo en la función pura: sin pares
   * del diff, la supresión NO dispara. Es el estado normal de la prosa y de las
   * tablas sin clave, y tratarlo como emparejamiento inválido tiraría hallazgos
   * de territorio que el diff nunca miró.
   *
   * SE MIDE CON SEG-01/HIG-05 Y NO CON EST-02/EST-03, y la razón hay que
   * saberla: desde F-91 un hallazgo CON ancla DEGRADA a la llamada corta, o sea
   * SOBREVIVE, y sobrevivir aquí es llamar al modelo (ver la cabecera). Con un
   * par sin ancla el hallazgo muere igual, pero POR OTRA PUERTA — que es
   * exactamente lo que este caso quiere enseñar: la del diff no se abrió.
   */
  it('sin pares del diff, no se descarta por cubierto_por_diff', async () => {
    const { nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'SEG-01'), fila(existente, 'HIG-05'), columnas,
      [], nueva.rows, existente.rows,
    );

    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBeUndefined();
    // Muere, pero por la otra puerta. Que muera no es lo que se afirma aquí.
    expect(r.judgment.discarded?.['r2.sin_ancla']).toBe(1);
  });

  /**
   * ESTE CASO AVISÓ DOS VECES, y las dos eran su oficio.
   *
   * AVISO 1 — el previsto. Hasta el punto 4 aseguraba que sin pares del diff el
   * mismo hallazgo SE CONFIRMABA POR ESTRUCTURA —B.124 vivo donde el diff no
   * llegaba— y se escribió diciendo «el día que se arregle, el caso avisa».
   * Avisó: al entrar la degradación universal sin clave, se puso rojo.
   *
   * AVISO 2 — EL QUE NADIE ESPERABA, y es el que hay que leer. Reescrito para
   * el punto 4, seguía usando EST-02/EST-03 dando por hecho que sus ocho
   * columnas citadas y distintas eran «ningún punto fijo». FALLÓ, con una cifra
   * en el log: «1 columna(s) de ancla». Esa columna es `Categoría` —los dos son
   * tratamientos de estética— y destapó que «todas las columnas comunes» de
   * F-90 P3 admitía DOS LECTURAS con resultados opuestos, una de las cuales
   * descartaba hallazgos verdaderos. Ver F-91.
   * Las dos lecturas parecían la misma hasta que un número las separó. De ahí
   * sale la regla de la doble lectura del protocolo, y por eso el caso fijo de
   * la ambigüedad resuelta vive en `finding-rules.test.ts`, sobre R2 puro.
   *
   * LO QUE ASEGURA HOY: SEG-01 contra HIG-05 no comparte NI UN valor en las
   * nueve columnas comunes —uno de los 807 pares así que hay en el corpus—, así
   * que no hay identidad que oponer y el hallazgo se va por `r2.sin_ancla` SIN
   * GASTAR MODELO.
   */
  it('sin clave y sin ancla: se descarta por r2.sin_ancla, sin gastar modelo', async () => {
    const { nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'SEG-01'), fila(existente, 'HIG-05'), columnas,
      [], nueva.rows, existente.rows,
    );

    expect(r.judgment.contradictions).toHaveLength(0);
    expect(r.judgment.discarded?.['r2.sin_ancla']).toBe(1);
    expect(r.tally.descartados).toBe(1);
  });

  /**
   * ⚠️ Y LA CONSECUENCIA GRANDE DEL FRENTE 1, fijada donde se pueda ver: EL
   * JUEZ YA NO RECIBE `confirmedBy: 'estructura'` POR NINGÚN CAMINO.
   *
   *   · par EMITIDO      → suprimido            (punto 2)
   *   · par de 3ª PUERTA → verificado, muerto   (punto 3)
   *   · SIN CLAVE        → descartado si no hay ancla, degradado a juicio si la
   *                        hay — pero NUNCA firmado                (punto 4)
   *
   * El sello pasa a ser EXCLUSIVO de lo que emite el diff. Por eso
   * `verificador.confirmados_por_estructura` vale CERO SIEMPRE desde aquí: no
   * es una regresión, es el diseño — es la separación de poderes hecha número, y
   * si algún día vuelve a moverse, alguien está firmando sin derecho.
   *
   * ⚠️ LOS TRES ESCENARIOS DE AQUÍ SON LOS TRES QUE TERMINAN EN DESCARTE. La
   * cuarta rama —sin clave CON ancla, que degrada— no está y no puede estar:
   * degradar es sobrevivir, y sobrevivir es alcanzar el modelo. Queda declarado
   * en la cabecera del fichero como no probado aquí.
   */
  it('EL JUEZ NO RECIBE «estructura» POR NINGÚN CAMINO', async () => {
    const { pares, nueva, existente } = await corpus();
    const todas = nueva.columns.filter(c => existente.columns.includes(c));

    const escenarios = [
      // par emitido, hallazgo falso
      correrCascada(fila(nueva, 'EST-02'), fila(existente, 'EST-03'), todas, pares, nueva.rows, existente.rows),
      // par emitido, hallazgo legítimo
      correrCascada(fila(nueva, 'EST-03'), fila(existente, 'EST-03'), ['Precio base'], pares, nueva.rows, existente.rows),
      // sin clave y sin ancla
      correrCascada(fila(nueva, 'SEG-01'), fila(existente, 'HIG-05'), todas, [], nueva.rows, existente.rows),
    ];

    for (const r of await Promise.all(escenarios)) {
      expect(r.tally.confirmadosPorEstructura).toBe(0);
      expect(r.judgment.contradictions.filter(c => c.confirmedBy === 'estructura')).toHaveLength(0);
    }
  });
});

describe('la 3ª puerta: verificación de identidad, no supresión por decreto', () => {
  /**
   * UN PAR CAÍDO POR LA TERCERA PUERTA se construye a mano, porque el corpus no
   * lo tiene: OPE-10/OPE-11 empareja, y OPE-10 contra RRHH-06 cae por la
   * PRIMERA (sin columnas comunes con unicidad suficiente). Dos tarifarios con
   * la misma columna Código y CERO códigos comunes son dos poblaciones
   * distintas que comparten estructura — que es exactamente lo que la tercera
   * puerta detecta.
   */
  function tarifas(id: string, desde: number, precio: string, desdeIndice: number): TableGroup {
    const filas = Array.from({ length: 5 }, (_, i) => ({
      Código: `T-${String(desde + i).padStart(3, '0')}`,
      Precio: precio,
    }));
    return {
      tableId: `${id}#0`, sheetName: id, columns: ['Código', 'Precio'], totalRows: filas.length,
      rows: filas.map((cells, i): StoredChunk => ({
        chunkIndex: desdeIndice + i, chunkType: 'table_row', text: Object.values(cells).join(' | '),
        sheetName: id, tableId: `${id}#0`, rowIndex: i, cells, columnOrder: null,
      })),
    };
  }

  function parDeTerceraPuerta() {
    const nueva = tarifas('Nueva', 1, '100', 0);
    const existente = tarifas('Existente', 500, '120', 100);
    const r = emparejarTablas([nueva], [existente]);
    return { ...r, nueva, existente };
  }

  it('el fixture es de verdad un caído por la 3ª puerta', () => {
    const r = parDeTerceraPuerta();

    expect(r.pares).toHaveLength(0);
    expect(r.sinInterseccion).toHaveLength(1);
    expect(r.sinInterseccion[0].clave.pairs).toHaveLength(0);
  });

  /**
   * EL HALLAZGO MUERE VERIFICADO, no suprimido. La clave dice que esas dos
   * filas no son la misma entidad —por definición de la puerta, ninguna lo
   * es— y el contador lo declara: `emparejamiento_invalido`, que es el que
   * recuperó su territorio aquí después de perderlo con la supresión.
   */
  it('un hallazgo del juez sobre un par de 3ª puerta sale por emparejamiento_invalido', async () => {
    const r = parDeTerceraPuerta();

    const out = await correrCascada(
      r.nueva.rows[0], r.existente.rows[0], ['Precio'],
      [], r.nueva.rows, r.existente.rows,
      r.sinInterseccion,
    );

    expect(out.judgment.contradictions).toHaveLength(0);
    expect(out.judgment.discarded?.['descartado.emparejamiento_invalido']).toBe(1);
    // Y NO por la otra vía: la distinción entre verificación y dominancia vive
    // en el contador, y confundirlas perdería la razón por la que murió.
    expect(out.judgment.discarded?.['descartado.cubierto_por_diff']).toBeUndefined();
  });

  /**
   * SIN LA LISTA, NO PASA NADA. Es el mismo hallazgo y las mismas tablas: lo
   * único que cambia es que la traza no llega. Fija que el efecto viene de la
   * lista y no de otra cosa del camino.
   */
  it('sin la lista de la 3ª puerta, el mismo hallazgo NO se descarta', async () => {
    const r = parDeTerceraPuerta();

    const out = await correrCascada(
      r.nueva.rows[0], r.existente.rows[0], ['Precio'],
      [], r.nueva.rows, r.existente.rows,
      [],
    );

    expect(out.judgment.discarded?.['descartado.emparejamiento_invalido']).toBeUndefined();
  });
});
