import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { huellaDeHallazgo, unirClave } from './huella-hallazgo';
import { discoverTableKey } from './table-key';
import { groupChunksByTable, type TableGroup } from './table-structure';

/**
 * BATERÍA DE LA HUELLA (F-84 paso 2).
 *
 * El caso que justifica el módulo entero es LA INVARIANTE DE DIRECCIÓN, y se
 * mide recorriendo el camino completo —emparejar en las dos direcciones y
 * hashear— y no llamando a la función con datos a mano. Con datos a mano sería
 * una tautología: la función ordena, luego el resultado no depende del orden.
 * Lo que hay que demostrar es que eso SOBREVIVE al pipeline, donde los lados
 * llegan por rol y el rol se invierte.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

/** Los ids son sintéticos: en producción los pone la emisión, que es quien los
 *  tiene. Aquí solo hace falta que sean estables y distintos. */
const ID_10 = 'f0000000-0000-0000-0000-0000000000aa';
const ID_11 = 'a0000000-0000-0000-0000-0000000000ff';

async function tablaDeCorpus(file: string): Promise<TableGroup> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  const groups = groupChunksByTable(toStoredChunks(chunkSegments(segments, 'doc-test', file, 'org-test')));
  expect(groups).toHaveLength(1);
  return groups[0];
}

/**
 * Recorre el camino real: empareja `nueva` contra `existente` —que es como
 * llega desde el pipeline, por rol— y devuelve la huella de cada pareja
 * indexada por su código, pasando los lados EN EL ORDEN DEL ROL, que es como se
 * los pasaría la emisión.
 */
function huellasPorCodigo(
  nueva: TableGroup, idNueva: string,
  existente: TableGroup, idExistente: string,
  columna: string,
): Map<string, string> {
  const key = discoverTableKey(nueva, existente);
  expect(key.status).toBe('emparejado');
  if (key.status !== 'emparejado') throw new Error('inalcanzable');

  const out = new Map<string, string>();
  for (const p of key.pairs) {
    const huella = huellaDeHallazgo({
      a: { id: idNueva, tabla: nueva.tableId, claveCruda: unirClave(p.keyValues.nueva) },
      b: { id: idExistente, tabla: existente.tableId, claveCruda: unirClave(p.keyValues.existente) },
      columna,
    });
    out.set(p.nueva.cells?.['Código'] ?? '?', huella);
  }
  return out;
}

describe('la invariante de dirección, sobre el corpus real', () => {
  it('OPE-10 → OPE-11 y OPE-11 → OPE-10 dan la MISMA huella para cada fila', async () => {
    const a = await tablaDeCorpus(OPE10);
    const b = await tablaDeCorpus(OPE11);

    const ida = huellasPorCodigo(a, ID_10, b, ID_11, 'Precio base');
    const vuelta = huellasPorCodigo(b, ID_11, a, ID_10, 'Precio base');

    expect(ida.size).toBe(35);
    expect(vuelta.size).toBe(35);
    // Las mismas 35 filas por código, y la misma huella en cada una pese a que
    // el rol de cada documento se invirtió entre las dos pasadas.
    expect([...vuelta.keys()].sort()).toEqual([...ida.keys()].sort());
    for (const [codigo, huella] of ida) {
      expect(vuelta.get(codigo), `la fila ${codigo} cambia de huella al invertir la dirección`).toBe(huella);
    }
  });

  /** GUARDA CONTRARIA: si todas las huellas fueran iguales entre sí, la
   *  invariante de arriba se cumpliría igual y no valdría nada. */
  it('dos filas distintas no comparten huella', async () => {
    const a = await tablaDeCorpus(OPE10);
    const b = await tablaDeCorpus(OPE11);
    const huellas = [...huellasPorCodigo(a, ID_10, b, ID_11, 'Precio base').values()];
    expect(new Set(huellas).size).toBe(35);
  });

  /** Y la otra guarda: la misma fila en DOS columnas distintas son dos
   *  hallazgos distintos. Si compartieran huella, aceptar uno silenciaría el
   *  otro — que es el motivo por el que la columna entra en la tupla. */
  it('la misma fila en dos columnas distintas da huellas distintas', async () => {
    const a = await tablaDeCorpus(OPE10);
    const b = await tablaDeCorpus(OPE11);
    const precio = huellasPorCodigo(a, ID_10, b, ID_11, 'Precio base');
    const duracion = huellasPorCodigo(a, ID_10, b, ID_11, 'Duración (min)');
    for (const [codigo, h] of precio) expect(duracion.get(codigo)).not.toBe(h);
  });
});

describe('el límite conocido y aceptado', () => {
  /**
   * SI EL CLIENTE RENOMBRA UNA COLUMNA ENTRE RESUBIDAS, LA HUELLA CAMBIA y la
   * adjudicación que el usuario hubiera hecho sobre esas filas se pierde:
   * vuelven a aparecer como hallazgos nuevos.
   *
   * Se acepta a conciencia. La alternativa —no incluir la columna en la tupla—
   * haría que dos discrepancias distintas de la misma fila compartieran
   * identidad, y entonces aceptar una borraría la otra. Entre perder una
   * adjudicación al renombrar y borrar hallazgos en silencio, se elige lo
   * primero. Este caso lo fija como propiedad DECLARADA, no como sorpresa.
   */
  it('renombrar la columna cambia la huella', () => {
    const base = { a: { id: 'A', tabla: 'T#0', claveCruda: 'k1' }, b: { id: 'B', tabla: 'T#0', claveCruda: 'k1' } };
    expect(huellaDeHallazgo({ ...base, columna: 'Precio base' }))
      .not.toBe(huellaDeHallazgo({ ...base, columna: 'Precio' }));
  });

  /**
   * Y LA TABLA VA ATADA A SU LADO, no suelta en la cabecera. La primera versión
   * de este módulo la tomaba una sola vez para el hallazgo entero, y eso ROMPÍA
   * la invariante de dirección: OPE-10 es «Tarifas#0» y OPE-11 es «Tarifas
   * concertadas#0», así que pasar la tabla del lado «nuevo» hacía que la huella
   * cambiara al invertir el análisis. Lo cazó el primer caso de esta batería.
   */
  it('cambiar de tabla también cambia la huella', () => {
    const conTarifas = huellaDeHallazgo({
      a: { id: 'A', tabla: 'Tarifas#0', claveCruda: 'k1' },
      b: { id: 'B', tabla: 'Tarifas#0', claveCruda: 'k1' },
      columna: 'C',
    });
    const conOtra = huellaDeHallazgo({
      a: { id: 'A', tabla: 'Tarifas#1', claveCruda: 'k1' },
      b: { id: 'B', tabla: 'Tarifas#0', claveCruda: 'k1' },
      columna: 'C',
    });
    expect(conTarifas).not.toBe(conOtra);
  });
});

describe('el orden canónico y sus extremos', () => {
  it('la clave viaja atada a su id: invertir los lados no cambia nada', () => {
    const x = { id: 'zzz', tabla: 'T', claveCruda: 'clave-de-zzz' };
    const y = { id: 'aaa', tabla: 'T', claveCruda: 'clave-de-aaa' };
    expect(huellaDeHallazgo({ a: x, b: y, columna: 'C' }))
      .toBe(huellaDeHallazgo({ a: y, b: x, columna: 'C' }));
  });

  /** Si las claves se reordenaran por su cuenta —o no se reordenaran con su
   *  id— esta pareja daría la misma huella que la de arriba, y son hallazgos
   *  distintos: mismos documentos, otras filas. */
  it('cruzar las claves entre los ids SÍ cambia la huella', () => {
    const bien = huellaDeHallazgo({
      a: { id: 'zzz', tabla: 'T', claveCruda: 'clave-de-zzz' },
      b: { id: 'aaa', tabla: 'T', claveCruda: 'clave-de-aaa' },
      columna: 'C',
    });
    const cruzado = huellaDeHallazgo({
      a: { id: 'zzz', tabla: 'T', claveCruda: 'clave-de-aaa' },
      b: { id: 'aaa', tabla: 'T', claveCruda: 'clave-de-zzz' },
      columna: 'C',
    });
    expect(cruzado).not.toBe(bien);
  });

  /**
   * EL EXTREMO: los dos ids iguales significa comparar un documento consigo
   * mismo, que el pipeline no debería producir. No se lanza —tumbar un análisis
   * por esto sería peor que el fallo— pero tampoco se deja al azar: se desempata
   * por clave, así que sigue siendo determinista Y simétrico, y se avisa.
   */
  it('con los dos ids iguales desempata por clave, avisa y sigue siendo simétrico', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const x = { id: 'mismo', tabla: 'T', claveCruda: 'b' };
    const y = { id: 'mismo', tabla: 'T', claveCruda: 'a' };

    const uno = huellaDeHallazgo({ a: x, b: y, columna: 'C' });
    const otro = huellaDeHallazgo({ a: y, b: x, columna: 'C' });
    expect(uno).toBe(otro);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).toContain('id_repetido');
    warn.mockRestore();
  });
});

describe('la codificación es inyectiva: no depende de ningún separador', () => {
  /**
   * El caso que un separador no puede resolver. Con un `|` entre componentes,
   * («a|b», «c») y («a», «b|c») producirían la misma cadena y por tanto la
   * misma huella — dos hallazgos distintos con una sola identidad, y aceptar
   * uno borraría el otro. Con prefijo de longitud no hace falta suponer que el
   * cliente no escribe ese carácter en una celda.
   */
  it('dos repartos distintos entre componentes CONTIGUOS dan huellas distintas', () => {
    // Los dos componentes tienen que ser VECINOS en la tupla para que un
    // separador los pueda confundir. La primera versión de este caso ponía la
    // ambigüedad entre las dos claves, que están separadas por el id y la tabla
    // del segundo lado — así que no colisionaba ni con separador, y la mutación
    // «usa un `|` en vez de prefijo de longitud» SOBREVIVIÓ a la batería.
    // Aquí la ambigüedad va entre `tabla` y `clave` del MISMO lado, que sí son
    // contiguos: con un `|` las dos tuplas darían "A|T|X|Y|B|U|k|C".
    //
    // Y el desplazamiento mueve un carácter de un componente al otro, sin dejar
    // ninguno vacío: un componente vacío METE un separador de más y volvería a
    // salvar la mutación por accidente.
    const uno = huellaDeHallazgo({
      a: { id: 'A', tabla: 'T', claveCruda: 'X|Y' },
      b: { id: 'B', tabla: 'U', claveCruda: 'k' },
      columna: 'C',
    });
    const otro = huellaDeHallazgo({
      a: { id: 'A', tabla: 'T|X', claveCruda: 'Y' },
      b: { id: 'B', tabla: 'U', claveCruda: 'k' },
      columna: 'C',
    });
    expect(uno).not.toBe(otro);
  });

  it('unirClave tampoco depende de un separador', () => {
    // Mismo criterio: la ambigüedad, entre componentes contiguos.
    expect(unirClave(['a', 'b'])).not.toBe(unirClave(['a|b']));
    expect(unirClave(['a', 'b'])).not.toBe(unirClave(['ab']));
    expect(unirClave(['a'])).toBe(unirClave(['a']));
  });

  it('la huella es sha256 en hexadecimal', () => {
    const h = huellaDeHallazgo({ a: { id: 'A', tabla: 'T', claveCruda: 'k' }, b: { id: 'B', tabla: 'T', claveCruda: 'k' }, columna: 'C' });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  /** Los valores van EN CRUDO: dos claves que el emparejamiento considera
   *  distintas (F-84 1b) tienen que dar hallazgos distintos. Normalizar antes
   *  de hashear las fundiría y juzgar una silenciaría la otra. */
  it('no normaliza: «IMP-01» e «IMP01» son hallazgos distintos', () => {
    const base = { b: { id: 'B', tabla: 'T', claveCruda: 'x' }, columna: 'C' };
    expect(huellaDeHallazgo({ ...base, a: { id: 'A', tabla: 'T', claveCruda: 'IMP-01' } }))
      .not.toBe(huellaDeHallazgo({ ...base, a: { id: 'A', tabla: 'T', claveCruda: 'IMP01' } }));
  });
});
