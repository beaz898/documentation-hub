import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { applyDeterministicRules, destinoSinClave } from './finding-rules';
import { groupChunksByTable, type TableGroup } from './table-structure';

/**
 * EL ANCLA DE R2, Y LA AMBIGÜEDAD QUE ESTUVO A PUNTO DE COSTAR UN HALLAZGO
 * VERDADERO (F-90 P3 → F-91 P1).
 *
 * F-90 P3 dictó «si todas las columnas COMUNES difieren, R2 no confirma».
 * «Comunes» admitía dos lecturas:
 *
 *   Lectura A — las columnas que EL JUEZ CITÓ y las dos filas comparten.
 *   Lectura B — todas las columnas que LAS DOS FILAS comparten. ← es ésta.
 *
 * Leídas de corrido las dos suenan igual de razonables, y NO SE DISTINGUEN
 * MIRÁNDOLAS: se distinguen con un número. Por eso este fichero existe y por eso
 * sus casos usan filas del corpus con sus cifras medidas, no ejemplos
 * inventados — un ejemplo inventado se construye, sin querer, para que salga
 * bien la lectura que uno ya tenía en la cabeza.
 *
 * ⚠️ LA PROPIEDAD QUE MATA A LA LECTURA A, y es la que hay que conservar: EL
 * ANCLA NO DEPENDE DE LO QUE EL JUEZ CITÓ. Las mismas dos filas dan el mismo
 * ancla se cite una columna o nueve. Bajo la lectura A eso es falso, y ahí
 * estaba el daño: el juez, cuando ACIERTA, cita solo la columna que difiere, así
 * que su acierto típico salía con cero anclas y se descartaba.
 *
 * Los casos son deterministas y no tocan ningún modelo: `applyDeterministicRules`
 * es una función pura sobre celdas.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

async function tabla(file: string): Promise<TableGroup> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'd', file, 'o')))[0];
}

async function corpus(): Promise<{ nueva: TableGroup; existente: TableGroup }> {
  return { nueva: await tabla(OPE11), existente: await tabla(OPE10) };
}

function celdas(t: TableGroup, codigo: string): Record<string, string> {
  const f = t.rows.find(r => r.cells?.['Código'] === codigo);
  if (!f?.cells) throw new Error(`no existe la fila ${codigo}`);
  return f.cells;
}

/** R2 tal como lo llama la cascada, con las columnas que el juez citó. */
function r2(
  newCells: Record<string, string>,
  existingCells: Record<string, string>,
  citadas: string[],
) {
  return applyDeterministicRules({
    newDocSays: 'da igual: con celdas, R2 no mira el texto',
    existingDocSays: 'da igual',
    newCells,
    existingCells,
    newColumns: citadas,
    existingColumns: citadas,
  });
}

describe('el ancla de R2 — la ambigüedad de F-90 P3, resuelta por F-91', () => {
  /**
   * EL PAR QUE DECIDIÓ LA LECTURA, con sus dos mitades enfrentadas.
   *
   * EST-02 contra EST-03 es el emparejamiento FALSO de B.124 — el juez enfrentó
   * dos tratamientos distintos. EST-03 contra EST-03 es el hallazgo LEGÍTIMO de
   * la misma pasada: la discrepancia real de precio, sembrada.
   *
   * Las cifras son las que se midieron el 30/08 y las que viajaron en la
   * consulta: nueve columnas comunes, una igual en el falso (`Categoría`, los
   * dos son estética) y ocho en el legítimo.
   */
  it('el falso tiene UN ancla y el legítimo OCHO — las cifras que decidieron F-91', async () => {
    const { nueva, existente } = await corpus();
    const comunes = Object.keys(celdas(nueva, 'EST-02'))
      .filter(c => celdas(existente, 'EST-03')[c] !== undefined);

    const falso = r2(celdas(nueva, 'EST-02'), celdas(existente, 'EST-03'), comunes);
    const legitimo = r2(celdas(nueva, 'EST-03'), celdas(existente, 'EST-03'), comunes);

    expect(comunes).toHaveLength(9);
    expect(falso.outcome).toBe('confirm');
    expect(legitimo.outcome).toBe('confirm');
    if (falso.outcome !== 'confirm' || legitimo.outcome !== 'confirm') return;

    expect(falso.anclas).toEqual(['Categoría']);
    expect(legitimo.anclas).toHaveLength(8);
  });

  /**
   * ⚠️ EL CASO FIJO DE LA AMBIGÜEDAD RESUELTA. Si alguien vuelve a calcular el
   * ancla sobre las columnas citadas, ESTE es el que se pone rojo.
   *
   * Se ejerce con la cita REAL de producción: el 30/08 el juez confirmó el
   * hallazgo legítimo de EST-03 citando UNA SOLA columna, `Precio base`, que es
   * lo que se le pide —señalar la oposición—. Bajo la lectura A eso da cero
   * anclas y el hallazgo verdadero se va a la basura sin que nadie lo juzgue.
   */
  it('EL ANCLA NO DEPENDE DE LA CITA: una columna o nueve, el mismo ancla', async () => {
    const { nueva, existente } = await corpus();
    const n = celdas(nueva, 'EST-03');
    const e = celdas(existente, 'EST-03');
    const comunes = Object.keys(n).filter(c => e[c] !== undefined);

    const citandoUna = r2(n, e, ['Precio base']);
    const citandoTodas = r2(n, e, comunes);

    if (citandoUna.outcome !== 'confirm' || citandoTodas.outcome !== 'confirm') {
      throw new Error('R2 debería confirmar en los dos: el precio difiere');
    }

    // Lo que la lectura A rompía: citando solo la columna que difiere, el ancla
    // se quedaba vacía. Aquí valen ocho las dos veces.
    expect(citandoUna.anclas).toEqual(citandoTodas.anclas);
    expect(citandoUna.anclas).toHaveLength(8);
    expect(citandoUna.anclas).not.toContain('Precio base');
  });

  /**
   * EL DESCARTE, que es lo ÚNICO que el ancla ejecuta desde F-90: dos filas sin
   * un solo valor compartido no exhiben identidad ninguna, y no hay nada que
   * oponer. Hay 807 pares así entre OPE-11 y OPE-10; éste es uno.
   *
   * Y lo que el ancla NO hace, dicho aquí porque es donde se leerá: tener ancla
   * NO asciende nada. Con una sola, la estructura no dice «son la misma
   * entidad» — dice «no puedo descartar que lo sean», y el hallazgo baja a la
   * llamada corta. Por eso una basta y no hay umbral proporcional: no hay nada
   * que el umbral mediría (F-91 P1).
   */
  it('SEG-01 contra HIG-05: ni un valor en común, cero anclas', async () => {
    const { nueva, existente } = await corpus();
    const n = celdas(nueva, 'SEG-01');
    const e = celdas(existente, 'HIG-05');
    const comunes = Object.keys(n).filter(c => e[c] !== undefined);

    const v = r2(n, e, comunes);

    expect(comunes).toHaveLength(9);
    expect(v.outcome).toBe('confirm');
    if (v.outcome !== 'confirm') return;
    expect(v.anclas).toEqual([]);
  });


  /**
   * ⚠️ EL TERCER ESTADO DEL CONJUNTO: AUSENTE, no vacío (F-93, la cuarta pieza).
   *
   * `alignQuoteToCells` devuelve `null` —no una lista vacía— cuando la cita no
   * casa segmento a segmento contra las celdas. R2 sale entonces por `pass`: no
   * calculó `differingColumns`, así que NO EXISTE, y la supresión no puede
   * afirmar que el diff cubriera nada.
   *
   * LAS TRES FORMAS, y las tres decididas:
   *   · no vacío → se suprime (hay oposición y el diff la comparó)
   *   · vacío    → NO se suprime (`equivalentes` / `sin_columna_comun`)
   *   · ausente  → NO se suprime (esto)
   *
   * EL CABLEADO NO SE PRUEBA AQUÍ Y QUEDA DECLARADO: un `pass` sobrevive hasta
   * `toVerify`, o sea alcanza el modelo, y la guarda de red rompe cualquier
   * caso de la batería que llame fuera (B.126). Lo que se prueba es que R2
   * devuelve `pass` —la entrada de la decisión—; que la cascada no lo suprima,
   * no.
   */
  it('listas NULL: R2 sale por «pass» y no hay differingColumns que consumir', async () => {
    const { nueva, existente } = await corpus();
    const n = celdas(nueva, 'EST-03');
    const e = celdas(existente, 'EST-03');

    expect(applyDeterministicRules({
      newDocSays: 'da igual', existingDocSays: 'da igual',
      newCells: n, existingCells: e,
      newColumns: null, existingColumns: null,
    }).outcome).toBe('pass');

    // Y con UN solo lado nulo, igual: hacen falta las dos listas.
    expect(applyDeterministicRules({
      newDocSays: 'da igual', existingDocSays: 'da igual',
      newCells: n, existingCells: e,
      newColumns: ['Precio base'], existingColumns: null,
    }).outcome).toBe('pass');
  });
  /**
   * LA MISMA FILA CONTRA SÍ MISMA no llega a `confirm`: R2 la reclasifica como
   * equivalente antes. Se deja escrito porque es la frontera de arriba del
   * ancla —el máximo posible— y explica por qué no hay ningún caso con nueve.
   */
  it('la frontera de arriba: si NADA difiere, R2 ni siquiera llega al ancla', async () => {
    const { nueva } = await corpus();
    const n = celdas(nueva, 'EST-03');
    const comunes = Object.keys(n);

    expect(r2(n, n, comunes).outcome).toBe('reclassify');
  });
});

describe('B.130 — «equivalentes» deja de afirmar sobre las filas enteras', () => {
  /**
   * ⚠️ QUÉ SE PRUEBA AQUÍ Y QUÉ NO, y hay que leerlo antes de apoyarse.
   *
   * F-93 P2 pide que estos casos verifiquen EL DESTINO —«llega a la llamada
   * corta»— y no la puerta. NO SE PUEDE, y por la misma razón que la
   * degradación: llegar a la llamada corta es SOBREVIVIR, y sobrevivir alcanza
   * el modelo, que la guarda de red rompe (B.126).
   * Lo que se prueba es LA DECISIÓN: que R2 devuelve `pass` en vez de
   * `equivalentes`, y CON QUÉ columnas asimétricas. El contador
   * `a_juicio.columna_no_comparada` y su motivo viven en la rama `pass` de la
   * cascada y quedan DECLARADOS SIN PROBAR — es el mismo hueco que el punto 4
   * dejó abierto, no uno nuevo.
   */

  /**
   * BELMONTE, el hallazgo que destapó B.128 y que hoy moriría callado.
   *
   * El juez cita las filas enteras. Las compartidas son `Empleado` y `Puesto`,
   * y las dos COINCIDEN — es la misma persona con el mismo puesto. Con la regla
   * vieja eso era 'equivalentes' y el hallazgo desaparecía; y desaparecía
   * afirmando que las dos filas dicen lo mismo, cuando de las dieciocho
   * columnas restantes la estructura no miró ni una.
   */
  it('Belmonte: las compartidas coinciden, pero hay asimétricas citadas → pass', async () => {
    const rrhh = await tabla('RRHH-06_evaluacion-del-desempeno.xlsx');
    const ope02 = await tabla('OPE-02_agenda-y-gestion-de-citas.xlsx');
    const n = rrhh.rows.find(r => (r.cells?.['Empleado'] ?? '').includes('Belmonte'))!.cells!;
    const e = ope02.rows.find(r => (r.cells?.['Empleado'] ?? '').includes('Belmonte'))!.cells!;

    const v = applyDeterministicRules({
      newDocSays: 'da igual', existingDocSays: 'da igual',
      newCells: n, existingCells: e,
      newColumns: rrhh.columns, existingColumns: ope02.columns,
    });

    expect(v.outcome).toBe('pass');
    if (v.outcome !== 'pass') return;
    // Y nombra las asimétricas, que es lo que el motivo del log tiene que decir.
    expect(v.asimetricasCitadas).toContain('Horas semana');
    expect(v.asimetricasCitadas).toContain('Puntualidad (1-5)');
    expect(v.asimetricasCitadas).not.toContain('Empleado');
    expect(v.asimetricasCitadas).not.toContain('Puesto');
  });

  /**
   * ⚠️ EL CASO QUE DE VERDAD IMPORTA, y es construido porque el corpus no lo
   * tiene: LA MISMA EMPLEADA CON 44 HORAS EN UNA COLUMNA Y 40 EN OTRA DE NOMBRE
   * DISTINTO.
   *
   * Es una contradicción REAL. El diff no la ve nunca —empareja columnas por
   * igualdad de nombre (F-78, sin fuzzy, deliberado)— y con la regla vieja R2
   * la enterraba bajo 'equivalentes' porque lo único compartido, el nombre de
   * la empleada, coincide.
   * Es el territorio que F-92 le reservó al juez: el emparejador de esquemas de
   * último recurso. Sin este caso, la corrección de B.130 no tiene sentido —
   * Belmonte sola se arregla «por accidente», porque era un hallazgo malo.
   */
  it('44 contra 40 horas bajo nombres de columna distintos: NO es equivalencia', () => {
    const v = applyDeterministicRules({
      newDocSays: 'da igual', existingDocSays: 'da igual',
      newCells: { 'Empleado': 'Dra. Ana Belmonte', 'Horas semana': '44' },
      existingCells: { 'Empleado': 'Dra. Ana Belmonte', 'Jornada semanal': '40' },
      newColumns: ['Empleado', 'Horas semana'],
      existingColumns: ['Empleado', 'Jornada semanal'],
    });

    expect(v.outcome).toBe('pass');
    if (v.outcome !== 'pass') return;
    expect(v.asimetricasCitadas).toEqual(['Horas semana', 'Jornada semanal']);
  });

  /**
   * ⚠️ Y EL QUE PROTEGE LO QUE YA FUNCIONABA. Sin este caso, la corrección se
   * lleva por delante 'equivalentes' entero.
   *
   * Todas las columnas citadas de los dos lados son compartidas y todas
   * coinciden: aquí la estructura SÍ vio todo lo que el hallazgo trata, y
   * afirmar equivalencia es legítimo.
   */
  it('todo compartido y todo igual SIGUE siendo equivalentes', async () => {
    const { nueva, existente } = await corpus();
    // `Categoría` coincide entre EST-03 y EST-03 — medido.
    const v = r2(celdas(nueva, 'EST-03'), celdas(existente, 'EST-03'), ['Categoría']);

    expect(v.outcome).toBe('reclassify');
    if (v.outcome !== 'reclassify') return;
    expect(v.reason).toBe('equivalentes');
  });
});

describe('el destino en territorio SIN CLAVE — la decisión, partida de la junta', () => {
  /**
   * ⚠️ POR QUÉ ESTOS CASOS EXISTEN, y qué límite levantan.
   *
   * El 31/08, al mutar el punto 4, la mutación «con ancla se DESCARTA en vez de
   * degradar» SOBREVIVIÓ: ningún caso podía distinguirlo, porque degradar es
   * sobrevivir y sobrevivir alcanza el modelo. Se declaró como límite.
   * Extraída la decisión a `destinoSinClave`, esa mutación PASA A CAER — y ése
   * es el único motivo de la extracción: no cambia comportamiento ninguno,
   * cambia lo que el instrumento alcanza.
   *
   * LO QUE SIGUE SIN PROBARSE, declarado: que la cascada, con el destino
   * `degradar_a_juicio`, empuje de verdad el hallazgo hasta la llamada corta.
   * Eso es LA JUNTA, y sigue en B.131 con las otras dos ramas.
   */
  it('sin ancla se DESCARTA — el conjunto vacío decide, y decide fuera', () => {
    expect(destinoSinClave([])).toBe('descartar_sin_ancla');
  });

  /**
   * UNA BASTA, y no es un umbral perezoso: con un ancla la estructura no dice
   * «son la misma entidad», dice «no puedo descartar que lo sean», y para bajar
   * a juicio eso sobra (F-91 P1). Por eso no hay ancla proporcional.
   */
  it('con UNA sola ancla ya se degrada, no se descarta', () => {
    expect(destinoSinClave(['Categoría'])).toBe('degradar_a_juicio');
  });

  /**
   * EL CASO REAL, con las cifras del corpus: el falso de B.124 tiene UN ancla
   * —`Categoría`, los dos son tratamientos de estética— así que en territorio
   * sin clave se degradaría, no se descartaría. Es la medición que hizo que
   * F-91 retirara la pretensión en vez de reforzar la guarda: el ancla no caza
   * este caso, y no tiene por qué.
   */
  it('EST-02 contra EST-03 en territorio sin clave: se DEGRADA, con su único ancla', async () => {
    const { nueva, existente } = await corpus();
    const comunes = Object.keys(celdas(nueva, 'EST-02'))
      .filter(c => celdas(existente, 'EST-03')[c] !== undefined);
    const v = r2(celdas(nueva, 'EST-02'), celdas(existente, 'EST-03'), comunes);

    if (v.outcome !== 'confirm') throw new Error('R2 debería confirmar: ocho columnas difieren');
    expect(v.anclas).toEqual(['Categoría']);
    expect(destinoSinClave(v.anclas)).toBe('degradar_a_juicio');
  });

  /**
   * Y EL PAR SIN NI UN VALOR EN COMÚN, que es el caso que el ancla sí ejecuta:
   * SEG-01 contra HIG-05, nueve columnas comunes y ninguna igual — uno de los
   * 807 pares así que hay en el corpus.
   */
  it('SEG-01 contra HIG-05: cero anclas, se descarta sin gastar modelo', async () => {
    const { nueva, existente } = await corpus();
    const comunes = Object.keys(celdas(nueva, 'SEG-01'))
      .filter(c => celdas(existente, 'HIG-05')[c] !== undefined);
    const v = r2(celdas(nueva, 'SEG-01'), celdas(existente, 'HIG-05'), comunes);

    if (v.outcome !== 'confirm') throw new Error('R2 debería confirmar');
    expect(v.anclas).toEqual([]);
    expect(destinoSinClave(v.anclas)).toBe('descartar_sin_ancla');
  });
});
