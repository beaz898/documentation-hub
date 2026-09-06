import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * EL SELLO SE ESCRIBE DONDE SE ESCRIBEN LOS CHUNKS — el caso que lo vigila.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LO QUE ENSEÑÓ B.184, Y VA MÁS ALLÁ DE SU CASO: **la firma del extractor no se
 * escribe al CREAR un documento — se escribe allí donde los chunks que describe
 * pasan a ser los servidos.** Por eso `document-swap.ts` la escribe sin trocear
 * nada, y por eso la rama *staged* de `drive/sync` trocea sin escribirla: allí
 * los chunks todavía no sirven, y el sello llega con la conmutación.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ POR QUÉ ESTE CASO Y NO UNA NOTA. Hoy son cuatro los sitios que persisten
 * chunks. El día que alguien añada un quinto —un reprocesado en lote, un
 * reindexado desde otra puerta— **tiene que acordarse otra vez**, y acordarse no
 * es un mecanismo. Un sello que se olvida no falla: se queda callado, y el lector
 * del corpus empieza a decir que está sano lo que no lo está. Eso ya pasó una vez
 * —dos días entre `f401390e` y `8c0675d3`, quince días de mentira silenciosa— y
 * la única razón de que no doliera es que entonces nadie leía el sello. Ahora sí.
 *
 * ESTE CASO ES LO ÚNICO QUE LO VIGILA. Si se pone rojo, la pregunta no es «cómo
 * lo callo»: es «¿este camino nuevo deja el sello puesto?».
 */

const RAICES = ['app', 'lib', 'worker'];
const LLAMADA = 'saveDocumentChunks(';

/**
 * Quien persiste chunks, o sella él mismo, o entrega la promoción al swap.
 *
 * ⚠️ EL DOS PUNTOS NO SOBRA: la primera versión buscaba `extractor_version` a
 * secas y **casaba también dentro de un comentario**. Lo destapó una mutación
 * que retiró el sello de una ruta y dejó su nombre en el comentario de retirada:
 * el caso siguió en verde. Un vigilante que se conforma con que la palabra
 * APAREZCA no vigila que el sello se ESCRIBA. Con los dos puntos, solo cuenta la
 * asignación real del campo.
 */
const SELLA = 'extractor_version:';
const DELEGA = 'swapDocumentVectors(';

function ficherosTs(raiz: string): string[] {
  const salida: string[] = [];
  const pila = [raiz];
  while (pila.length > 0) {
    const dir = pila.pop()!;
    for (const entrada of readdirSync(dir)) {
      if (entrada === 'node_modules' || entrada.startsWith('.')) continue;
      const ruta = join(dir, entrada);
      if (statSync(ruta).isDirectory()) { pila.push(ruta); continue; }
      if (!ruta.endsWith('.ts') && !ruta.endsWith('.tsx')) continue;
      if (ruta.endsWith('.test.ts') || ruta.endsWith('.test.tsx')) continue;
      salida.push(ruta.replace(/\\/g, '/'));
    }
  }
  return salida;
}

/**
 * ⚠️ SE EXCLUYE EL SITIO DONDE LA FUNCIÓN SE DEFINE, y esto lo aprendió el propio
 * caso al estrenarse: la primera versión marcó en rojo `lib/persist-chunks.ts`,
 * que es quien EXPORTA `saveDocumentChunks`. No persiste los chunks de nadie —
 * es la herramienta, no el camino— y exigirle el sello no tiene sentido.
 * Era un fallo del instrumento, no del código, y es la misma forma que ya costó
 * media hora con la consulta del parque: **una medida que contaba algo distinto
 * de lo que su nombre decía.**
 */
const escritores = RAICES
  .flatMap(ficherosTs)
  .filter(ruta => {
    const fuente = readFileSync(ruta, 'utf8');
    return fuente.includes(LLAMADA) && !fuente.includes(`export async function ${LLAMADA}`);
  });

describe('el sello acompaña a cada escritura de chunks', () => {
  /**
   * ⚠️ EL CONTROL POSITIVO VA PRIMERO, y no es ceremonia: si el barrido se
   * rompiera —una ruta mal montada, una raíz renombrada— la lista saldría vacía
   * y **todos los casos de abajo pasarían sin comprobar nada**. Un caso que no
   * puede fallar por la razón que vigila es exactamente lo que la regla del cero
   * prohíbe. Aquí el cero se mata antes de empezar.
   */
  it('el barrido encuentra escritores de chunks', () => {
    expect(escritores.length).toBeGreaterThanOrEqual(3);
  });

  it.each(escritores)('%s deja el sello puesto o lo entrega al swap', ruta => {
    const fuente = readFileSync(ruta, 'utf8');
    const sella = fuente.includes(SELLA);
    const delega = fuente.includes(DELEGA);

    expect(
      sella || delega,
      `${ruta} persiste chunks y no escribe \`${SELLA}\` ni entrega la promoción a ` +
      `\`${DELEGA}\`. Un camino que trocea sin dejar sello deja el corpus mezclado ` +
      `en silencio: el lector dirá que esos documentos están al día. Ver B.184.`,
    ).toBe(true);
  });
});
