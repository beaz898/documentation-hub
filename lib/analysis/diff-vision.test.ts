import { readFileSync } from 'node:fs';

import { describe, it, expect } from 'vitest';
import { chunkSegments, extractSegments, joinSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import {
  visionDeUnLado, clasificarVision, elCeroEsInterpretable, contadoresDeVision,
} from './diff-vision';
import type { VisionDelPar } from './diff-vision';
import { puedeUsarLaEstructura } from './estructura-del-modal';
import { emparejarTablas } from './table-pairing';
import { groupChunksByTable } from './table-structure';
import type { TableGroup } from './table-structure';

/**
 * LOS DENOMINADORES DE LOS CEROS DEL DIFF — pieza 2 de F-103 P3.
 *
 * ⚠️ EL CRITERIO QUE ESTOS CASOS DEFIENDEN, escrito antes que ellos: **un cero
 * solo confirma cuando los dos lados vieron.** Todo lo demás de este fichero sale
 * de ahí — que los lados se cuenten por separado, que la asimetría se conserve, y
 * que las siete cifras salgan aunque valgan cero.
 *
 * Los dos casos reales que lo pidieron están en el mismo registro con una semana
 * de diferencia y eran indistinguibles: «0 parejas» del 04/09 (una medición: no
 * había clave) y «0 sobre 0 parejas» de B.175 (ceguera: no llegó ni una tabla).
 */

function tabla(filas: number, id = 't1'): TableGroup {
  return { tableId: id, sheetName: 'H1', columns: ['a', 'b'], totalRows: filas, rows: [] };
}

const CIEGO: VisionDelPar = { analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 2, filas: 60 } };
const VIDENTE: VisionDelPar = { analizado: { tablas: 1, filas: 30 }, candidato: { tablas: 2, filas: 60 } };

describe('visionDeUnLado', () => {
  it('cuenta tablas y filas de lo que el agrupador produjo', () => {
    expect(visionDeUnLado([tabla(30), tabla(12, 't2')])).toEqual({ tablas: 2, filas: 42 });
  });

  it('sin tablas, cero y cero — no undefined ni NaN', () => {
    expect(visionDeUnLado([])).toEqual({ tablas: 0, filas: 0 });
  });

  /**
   * ⚠️ LAS FILAS SALEN DE `totalRows`, que es lo que el agrupador contó, y no de
   * `rows.length`. Contarlas otra vez aquí sería una segunda cuenta de lo mismo,
   * y dos cuentas de lo mismo se separan el día que una cambie — sin avisar,
   * porque las dos seguirían pareciendo correctas.
   */
  it('las filas las dice el agrupador, no se recuentan', () => {
    const t: TableGroup = { ...tabla(0), totalRows: 7, rows: [] };
    expect(visionDeUnLado([t]).filas).toBe(7);
  });
});

describe('clasificarVision — la asimetría se conserva', () => {
  it('los cuatro casos tienen nombre propio', () => {
    expect(clasificarVision(VIDENTE)).toBe('ambos');
    expect(clasificarVision(CIEGO)).toBe('solo_candidato');
    expect(clasificarVision({ analizado: { tablas: 3, filas: 9 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe('solo_analizado');
    expect(clasificarVision({ analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe('ninguno');
  });

  /**
   * ⚠️ POR QUÉ NO SE FUNDEN EN «alguno»: que el analizado no traiga tablas es un
   * fallo NUESTRO —es B.175, la estructura no llegó— y que no las traiga el
   * candidato es un caso normal del corpus. Fundirlos perdería justo la mitad que
   * distingue una avería de un día cualquiera.
   */
  it('quién es el ciego importa: los dos casos no son el mismo', () => {
    const analizadoCiego = { analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 1, filas: 5 } };
    const candidatoCiego = { analizado: { tablas: 1, filas: 5 }, candidato: { tablas: 0, filas: 0 } };
    expect(clasificarVision(analizadoCiego)).not.toBe(clasificarVision(candidatoCiego));
  });
});

describe('elCeroEsInterpretable — LA pregunta', () => {
  /**
   * ⚠️⚠️ EL CASO CENTRAL DEL FICHERO. Si esto se pusiera en verde para un par
   * ciego, el sistema volvería a poder decir «no hay contradicciones» sin haber
   * mirado — que es exactamente B.175 y lo que costó semanas destapar.
   */
  it('solo cuando los DOS lados vieron', () => {
    expect(elCeroEsInterpretable(VIDENTE)).toBe(true);
    expect(elCeroEsInterpretable(CIEGO)).toBe(false);
    expect(elCeroEsInterpretable({ analizado: { tablas: 2, filas: 8 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe(false);
    expect(elCeroEsInterpretable({ analizado: { tablas: 0, filas: 0 }, candidato: { tablas: 0, filas: 0 } }))
      .toBe(false);
  });

  /**
   * ⚠️ LO QUE DECIDE ES LA TABLA, NO LA FILA. Una tabla con cero filas SE MIRÓ:
   * el emparejador la tuvo delante y pudo decidir. Exigir filas confundiría «no
   * me llegó nada» con «me llegó una tabla vacía», que son cosas distintas — la
   * segunda es un resultado y la primera es una pantalla apagada.
   */
  it('una tabla vacía es visión: se miró, y no había filas', () => {
    expect(elCeroEsInterpretable({
      analizado: { tablas: 1, filas: 0 },
      candidato: { tablas: 1, filas: 0 },
    })).toBe(true);
  });
});

describe('contadoresDeVision — las siete cifras', () => {
  it('reparte los pares entre videntes y ciegos, y suman el total', () => {
    const c = contadoresDeVision([VIDENTE, CIEGO, VIDENTE]);
    expect(c.pares_con_vision).toBe(2);
    expect(c.pares_ciegos).toBe(1);
    expect(c.pares_con_vision + c.pares_ciegos).toBe(3);
  });

  it('señala cuándo el ciego fue el documento analizado', () => {
    expect(contadoresDeVision([CIEGO, CIEGO, VIDENTE]).ciegos_por_el_analizado).toBe(2);
    expect(contadoresDeVision([{ analizado: { tablas: 1, filas: 2 }, candidato: { tablas: 0, filas: 0 } }])
      .ciegos_por_el_analizado).toBe(0);
  });

  /**
   * ⚠️ EL ANALIZADO NO SE SUMA SOBRE LOS PARES: es el mismo documento en todos,
   * así que sumarlo lo multiplicaría por el número de candidatos y daría una
   * cifra que parece un total y es un producto. Es la misma forma del «5» que
   * pasó por dato media hora el 06/09.
   */
  it('las tablas del analizado no se multiplican por el número de candidatos', () => {
    const c = contadoresDeVision([VIDENTE, VIDENTE, VIDENTE]);
    expect(c.tablas_analizado).toBe(1);
    expect(c.filas_analizado).toBe(30);
    // Y las de los candidatos SÍ se suman: son documentos distintos.
    expect(c.tablas_candidatos).toBe(6);
    expect(c.filas_candidatos).toBe(180);
  });

  /**
   * ⚠️ LAS SIETE SALEN SIEMPRE, aunque valgan cero. Es la regla del cero aplicada
   * al propio instrumento: una cifra que desaparece cuando vale cero es
   * indistinguible de una que nadie calculó, y entonces el denominador tampoco se
   * puede leer.
   */
  it('sin un solo par, las siete cifras están y valen cero', () => {
    expect(contadoresDeVision([])).toEqual({
      pares_con_vision: 0,
      pares_ciegos: 0,
      ciegos_por_el_analizado: 0,
      tablas_analizado: 0,
      filas_analizado: 0,
      tablas_candidatos: 0,
      filas_candidatos: 0,
    });
  });

  /**
   * EL CASO DE B.175, RECONSTRUIDO. Un documento analizado como texto plano
   * —sin celdas— contra cuatro candidatos con tablas: el diff no emitirá nada, y
   * hasta hoy eso salía como «0 parejas» a secas.
   */
  it('el caso de B.175 se lee de un vistazo', () => {
    const c = contadoresDeVision([CIEGO, CIEGO, CIEGO, CIEGO]);
    expect(c.pares_con_vision).toBe(0);
    expect(c.pares_ciegos).toBe(4);
    expect(c.ciegos_por_el_analizado).toBe(4);
    expect(c.tablas_analizado).toBe(0);
    // Y el dato que lo delata: el corpus SÍ tenía tablas que mirar.
    expect(c.tablas_candidatos).toBe(8);
  });
});

/**
 * ⚠️ EL CONTROL NEGATIVO DE LA PUERTA DE A5, EN SUITE — F-106 P3, y no como se
 * propuso allí.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA PROPUESTA DE F-106 P3 NO SE PODÍA ESCRIBIR: decía que la guarda
 * «chunks tabulares + cero tablas vistas = incompleto visible» y su centinela
 * `diff.ceguera_estructural` ya existían con sus tests. **No existen** — F-103
 * los PROPUSO (`F-103.md:194`) y lo implantado fue la pieza 2, las siete claves
 * `diff.vision.*`. Comprobado el 09/09/2026: `ceguera_estructural` no aparece en
 * un solo `.ts` del repositorio. Queda anotado en `INDICE.md`.
 *
 * Así que el negativo se escribe contra lo que SÍ hay, que basta: la guarda de
 * estructura (`puedeUsarLaEstructura`) y los contadores de visión.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * QUÉ DEMUESTRA, que es lo que una medición gemela no puede demostrar: que la
 * PUERTA es capaz de producir otra cosa. A6 demostró que A6 ve; que A5 dé la
 * misma cifra demuestra que entregó material equivalente, no que sepa
 * distinguir. Esto último solo lo demuestra romper la puerta a propósito y ver
 * que el instrumento lo canta.
 *
 * ⚠️ SOBRE OPE-10/OPE-11 Y NO SOBRE OPE-14, y hay que decir por qué: **el
 * `.xlsx` de OPE-14 no está en el repositorio.** Solo están su registro de
 * siembra (`corpus-pruebas/SIEMBRA_OPE-14.md`) y su verificador
 * (`scripts/verificar-ope14.mjs`); el fichero se hizo a mano y vive en OneDrive.
 * `git log` sobre `corpus-pruebas/OPE-14*` no devuelve NADA. El negativo no
 * necesita ese par —lo que ejercita es la ceguera, no la cifra sembrada—, pero
 * la consecuencia hay que tenerla escrita: **el negativo en suite no puede ir
 * sobre el mismo par que la gemela.**
 *
 * LO QUE ESTO NO CUBRE, y por lo que la pasada real sigue valiendo una vez:
 * que `analyze-v2` entre de verdad por la rama `storagePath`, que el temporal
 * siga en Storage en ese momento, que `new_document_chunks` sobreviva al viaje
 * por `analysis_jobs` (JSON de ida y vuelta, en una tubería que ya borró cuatro
 * campos en tránsito) y que los contadores queden PERSISTIDOS — que es la cifra
 * que vale (F-102).
 */
describe('CONTROL NEGATIVO DE LA PUERTA — texto editado, estructura perdida', () => {
  const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

  async function segmentosDe(file: string) {
    return extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  }

  async function tablasDe(file: string): Promise<TableGroup[]> {
    const segments = await segmentosDe(file);
    return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'doc-test', file, 'org-test')));
  }

  it('CONTROL POSITIVO: sin editar, la guarda deja pasar y el analizado VE', async () => {
    const texto = joinSegments(await segmentosDe(OPE11));
    // Es la comparación exacta que hace `analyze-v2:295`: el texto que manda el
    // modal contra el que se reconstruye del fichero. `extractText` ES
    // `joinSegments(extractSegments(...))`, así que sin editar son idénticos.
    expect(puedeUsarLaEstructura(texto, texto)).toBe(true);

    const vision = visionDeUnLado(await tablasDe(OPE11));
    expect(vision.tablas).toBeGreaterThan(0);
    expect(vision.filas).toBeGreaterThan(0);
  });

  /**
   * ⚠️ ESTE CASO CORRIGIÓ EL DISEÑO DE LA PASADA REAL, Y POR ESO SE ESCRIBE
   * PRIMERO. El negativo redactado para producción decía «tocar un carácter»;
   * con un ESPACIO no habría disparado, la pasada habría dado la misma cifra que
   * la buena, y la lectura tranquilizadora habría sido «da igual, el instrumento
   * es robusto» — cuando lo que pasaba es que el negativo no era negativo.
   * Treinta créditos para no medir nada, cazados por 0 en suite.
   */
  it('la guarda NO se rompe con espacios ni mayúsculas: `normalizeTextForHash` los borra', async () => {
    const texto = joinSegments(await segmentosDe(OPE11));
    // `hash-check.ts:32-44` colapsa espacios, unifica saltos, hace `trim()` y
    // `toLowerCase()`. Nada de eso es contenido, así que nada de eso cierra.
    expect(puedeUsarLaEstructura(`${texto}   `, texto)).toBe(true);
    expect(puedeUsarLaEstructura(texto.toUpperCase(), texto)).toBe(true);
  });

  it('EL NEGATIVO: con UN carácter de CONTENIDO cambiado, la guarda cierra', async () => {
    const texto = joinSegments(await segmentosDe(OPE11));
    const editado = texto.replace(/\d/, d => (d === '9' ? '8' : '9'));
    // Que la edición haya ocurrido de verdad: sin esto, un fichero sin dígitos
    // dejaría `editado === texto` y el caso pasaría diciendo lo contrario de lo
    // que cree decir.
    expect(editado).not.toBe(texto);
    expect(puedeUsarLaEstructura(editado, texto)).toBe(false);
  });

  it('y con la guarda cerrada el analizado queda CIEGO, no vacío', async () => {
    // Cuando la guarda dice que no, `analyze-v2` no rellena `extractedSegments`,
    // así que `newDocChunks` es null y el lado analizado llega SIN tablas. El
    // candidato sigue viéndose: esa asimetría es todo el hallazgo.
    const par: VisionDelPar = {
      analizado: { tablas: 0, filas: 0 },
      candidato: visionDeUnLado(await tablasDe(OPE11)),
    };

    expect(clasificarVision(par)).toBe('solo_candidato');
    expect(elCeroEsInterpretable(par)).toBe(false);

    const c = contadoresDeVision([par]);
    expect(c.tablas_analizado).toBe(0);
    expect(c.pares_ciegos).toBe(1);
    expect(c.ciegos_por_el_analizado).toBe(1);
    // ⚠️ Y EL DENOMINADOR, que es lo que separa esto de una pantalla apagada:
    // el corpus SÍ tenía tablas. Sin esta línea, un cero de los dos lados —un
    // fixture roto, un fichero que no se lee— pasaría por «ceguera detectada».
    expect(c.tablas_candidatos).toBeGreaterThan(0);
  });

  it('el emparejador no inventa parejas con un lado ciego', async () => {
    const { pares } = emparejarTablas([], await tablasDe(OPE11));
    expect(pares).toEqual([]);
  });
});
