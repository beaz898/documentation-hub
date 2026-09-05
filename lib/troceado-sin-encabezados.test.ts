import { describe, it, expect } from 'vitest';
import { chunkText } from './chunking';

/**
 * EL «CASO 4» DE `chunkText` — el troceado de todo lo que no trae encabezados.
 *
 * B.181. Hasta hoy `chunkText` no tenía NI UN SOLO test, y es por donde pasa
 * todo lo que no es una hoja de cálculo. Su rama sin encabezados
 * —`chunking.ts:378`, «sin estructura detectable, corte por longitud de
 * siempre»— no es la rama rara: es la de cualquier documento sin `#`, en
 * cualquier formato. Un PDF de tablas, un `.txt` corrido, un `.docx` cuyos
 * títulos no case `normalizeNumberedHeadings`, y los tres formatos de la rama
 * cruda (`csv`, `json`, `html`).
 *
 * ⚠️ EL CRITERIO VA ANTES QUE LOS CASOS, y por un motivo que la ficha de B.181
 * señala: sin criterio escrito, un primer test sobre código viejo no prueba
 * nada — CONGELA lo que hoy hace, que puede estar mal y quedar bendecido. Las
 * cinco primeras son criterio; la sexta es heurística y se marca como tal.
 *
 *   C1 · COBERTURA — todo el contenido del original aparece en algún trozo.
 *        Un troceado que pierde texto pierde recuperación para siempre, y sin
 *        avisar: lo que no está en un chunk no está en el índice.
 *   C2 · TAMAÑO — ningún trozo supera CHUNK_SIZE (1200).
 *   C3 · SOLAPE — dos trozos consecutivos comparten texto, que es lo que hace
 *        que una frase partida siga siendo recuperable desde los dos lados.
 *   C4 · ÍNDICES — chunkIndex = 0..n-1 y totalChunks = n en todos.
 *   C5 · TERMINACIÓN — sin bucle infinito y sin trozos vacíos.
 *   C6 · FRONTERA (HEURÍSTICA, no criterio) — se prefiere cortar en `\n\n`, si
 *        no en `. `, si no en `\n`, y solo si el corte cae en la segunda mitad.
 *        Se comprueba porque es lo que decide si un CSV se parte por la mitad
 *        de una fila; no se eleva a criterio porque es una preferencia, y
 *        cambiarla no sería un fallo.
 *
 * Y SE PRUEBAN LAS DOS RAMAS VECINAS, no solo la de dentro: el mismo texto con
 * un `#` delante tiene que irse por secciones, y uno de 1200 tiene que salir de
 * una pieza. Una frontera que solo se mira por dentro no se ha mirado.
 */

const ORG = 'org-test';
const DOC = 'doc-test';

/** Filas de CSV de longitud realista, sin `.` ni línea en blanco. */
function csvDeFilas(n: number): string {
  const filas = ['clinica,especialidad,turno,tarifa,cobertura'];
  for (let i = 0; i < n; i++) {
    filas.push(`Clinica ${i},Odontologia general,Manana,${100 + i},Parcial ${i}`);
  }
  return filas.join('\n');
}

/**
 * Prosa corrida sin un solo encabezado markdown.
 *
 * ⚠️ CADA FRASE LLEVA SU NÚMERO, y no es un detalle de estilo: la primera
 * versión repetía el mismo párrafo, y con eso el caso del SOLAPE pasaba por la
 * razón equivocada — la cola de un trozo reaparecía en el siguiente **por la
 * repetición del texto**, no por el solape. La mutación que puso
 * `CHUNK_OVERLAP` a cero no lo mató, y ahí se vio. Texto irrepetible: si el
 * solape desaparece, el caso cae.
 */
function prosaSinTitulos(frases: number): string {
  const partes: string[] = [];
  for (let i = 0; i < frases; i++) {
    partes.push(
      `Incidencia ${i}: el personal de guardia registro el parte numero ${i} ` +
      `y la direccion lo archivo en la carpeta ${i} sin requerir accion adicional. `
    );
  }
  return partes.join('');
}

/** Documento con secciones markdown de tamaño suficiente para no fusionarse. */
function conSeccionesMarkdown(n: number): string {
  const partes: string[] = [];
  for (let i = 0; i < n; i++) {
    partes.push(`# Seccion ${i}\n\n${prosaSinTitulos(4)}`);
  }
  return partes.join('\n\n');
}

describe('caso 4 — texto sin encabezados markdown', () => {
  // C2, C4 y C5 van en casos SEPARADOS a propósito: metidos en uno solo, una
  // mutación mata el caso entero y no se sabe cuál de las tres propiedades
  // estaba viva. Separados, cada mutación señala la suya.
  it('C2: ningún trozo supera CHUNK_SIZE', () => {
    const chunks = chunkText(prosaSinTitulos(60), DOC, 'prosa.txt', ORG);

    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.text.length).toBeLessThanOrEqual(1200);
  });

  it('C4/C5: índices coherentes y ningún trozo vacío', () => {
    const chunks = chunkText(prosaSinTitulos(60), DOC, 'prosa.txt', ORG);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => {
      expect(c.text.trim().length).toBeGreaterThan(0);   // C5
      expect(c.metadata.chunkIndex).toBe(i);             // C4
      expect(c.metadata.totalChunks).toBe(chunks.length);
    });
  });

  it('C1: no se pierde ni una fila del original', () => {
    const filas = 120;
    const csv = csvDeFilas(filas);
    const chunks = chunkText(csv, DOC, 'tarifas.csv', ORG);
    const todo = chunks.map(c => c.text).join('\n');

    expect(chunks.length).toBeGreaterThan(1);
    for (const fila of csv.split('\n')) {
      expect(todo).toContain(fila);
    }
  });

  it('C3: cada trozo comparte texto con el siguiente', () => {
    const chunks = chunkText(prosaSinTitulos(60), DOC, 'prosa.txt', ORG);

    for (let i = 0; i < chunks.length - 1; i++) {
      const cola = chunks[i].text.slice(-60);
      expect(chunks[i + 1].text).toContain(cola);
    }
  });

  it('C6: la COLA de cada trozo es siempre un fin de fila', () => {
    const csv = csvDeFilas(120);
    const filas = new Set(csv.split('\n'));
    const chunks = chunkText(csv, DOC, 'tarifas.csv', ORG);

    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      const lineas = c.text.split('\n');
      expect(filas.has(lineas[lineas.length - 1])).toBe(true);
    }
  });

  /**
   * ⚠️ ESTE CASO DOCUMENTA UN DEFECTO, NO UNA PROPIEDAD DESEADA — B.182.
   *
   * La predicción escrita antes de ejecutar decía que un CSV se cortaría en fin
   * de fila por los DOS lados. Falló, y el fallo se cuenta: la COLA sí es
   * limpia —el corte se mueve al `\n` (`chunking.ts:190`)— pero la CABEZA no,
   * porque el trozo siguiente arranca en `end - CHUNK_OVERLAP` y esos 200
   * caracteres hacia atrás caen donde caen. Medido: 6 de 7 trozos empiezan a
   * media fila.
   *
   * No es pérdida —la fila entera está en el trozo anterior, y C1 lo comprueba—:
   * es que CADA trozo menos el primero se abre con un trozo de fila que PARECE
   * una fila entera con el primer campo cambiado. En un CSV cuya primera
   * columna es el nombre de la entidad, eso es una fila con la entidad
   * equivocada.
   *
   * SE FIJA AQUÍ PARA QUE EL DÍA QUE SE ARREGLE ESTE CASO ROMPA y mande a leer
   * B.182, en vez de que el arreglo pase inadvertido. Si estás leyendo esto
   * porque el test ha fallado: probablemente has arreglado B.182 — invierte la
   * expectativa y borra este comentario.
   */
  it('⚠️ B.182: la CABEZA de los trozos siguientes NO lo es — defecto fijado', () => {
    const csv = csvDeFilas(120);
    const filas = new Set(csv.split('\n'));
    const chunks = chunkText(csv, DOC, 'tarifas.csv', ORG);

    expect(chunks.length).toBeGreaterThan(1);
    expect(filas.has(chunks[0].text.split('\n')[0])).toBe(true);
    for (const c of chunks.slice(1)) {
      expect(filas.has(c.text.split('\n')[0])).toBe(false);
    }
  });
});

describe('caso 4 — las ramas vecinas, para que la frontera se vea', () => {
  /**
   * ⚠️ LA PRIMERA VERSIÓN DE ESTE CASO NO SERVÍA, y lo dijo una mutación.
   * Comparaba el troceado del mismo texto con y sin un `#` delante y solo
   * exigía que fueran DISTINTOS. Con `HAS_ANY_HEADING_RE` mutada para no casar
   * nunca —o sea, con la bifurcación muerta— el caso seguía en verde: los dos
   * resultados diferían igualmente porque uno llevaba el título pegado.
   * Un caso que no puede distinguir las dos ramas no está mirando la frontera.
   *
   * Ahora se afirma la PROPIEDAD que solo la rama de secciones produce: cada
   * trozo empieza en su encabezado. Por el caso 4 los cortes caen por longitud
   * y no hay razón para que coincidan con los títulos.
   */
  it('con encabezados, cada trozo empieza en su sección', () => {
    const chunks = chunkText(conSeccionesMarkdown(5), DOC, 'a.md', ORG);

    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.text.startsWith('# Seccion ')).toBe(true);
  });

  it('un texto de 1200 o menos sale en un trozo único', () => {
    const justo = 'a'.repeat(1200);
    expect(chunkText(justo, DOC, 'a.txt', ORG)).toHaveLength(1);
  });

  it('el vacío y lo diminuto no revientan ni inventan trozos', () => {
    expect(chunkText('', DOC, 'a.txt', ORG)).toHaveLength(1);
    expect(chunkText('diez chars', DOC, 'a.txt', ORG)).toHaveLength(1);
  });
});
