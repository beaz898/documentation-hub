import { describe, it, expect } from 'vitest';
import {
  matchesContables,
  acumularVecinos,
  resumirVecindario,
  UMBRALES_DEL_CENSO,
  distribucionDeScores,
  topKPedido,
  poblacionPedida,
  TOPK_MAXIMO_DEL_SERVICIO,
  parejaDelMinimo,
  tramoPedido,
  acumularParejaDelMinimo,
  parejaMenorDeDos,
  muestraDeTexto,
  CARACTERES_DE_MUESTRA,
  type Vecino,
  type ObservacionDeScore,
} from './vecindario';
import { SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE } from './retrieval';
import { pasaElUmbral } from './umbral-de-recuperacion';
import type { VectorMatch } from '@/lib/pinecone/types';
import { clasificarTrozo, clasificarPar, reparteVacio } from './clase-de-trozo';

const PROPIO = 'doc-propio';
/** El fantasma de F-115: sin fila, y servido igual por las consultas. */
const FANTASMA = 'c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6';

function match(documentId: string, score: number, extra?: { generation?: number; documentName?: string; text?: string }): VectorMatch {
  return {
    id: `${documentId}-0`,
    score,
    metadata: {
      text: extra?.text ?? 'prosa cualquiera',
      documentId,
      documentName: extra?.documentName ?? `nombre de ${documentId}`,
      chunkIndex: 0,
      totalChunks: 1,
      orgId: 'org',
      ...(extra?.generation !== undefined ? { generation: extra.generation } : {}),
    },
  };
}

describe('matchesContables — qué entra en el censo', () => {
  /**
   * ⚠️ EL MAPA DE ESTE CENSO CUBRE TODAS LAS FILAS DE LA ORGANIZACIÓN, y su
   * lectura falla CERRADA (503 en la ruta). Por eso desde el 22/09/2026 estos
   * casos lo pasan LLENO: con la criba de fila viva dentro de `matchesContables`
   * (F-115), un mapa vacío significa «ningún documento existe» y el censo no
   * contaría nada — que es el comportamiento correcto y no el de estos casos,
   * que miden otras cosas.
   */
  const CENSADOS = new Map([['otro', 1], ['y', 1], [PROPIO, 1]]);

  it('excluye el documento propio, que siempre se encuentra a si mismo', () => {
    const { contables } = matchesContables(
      [match(PROPIO, 0.99), match('otro', 0.8)],
      PROPIO,
      CENSADOS,
    );
    expect(contables.map(c => c.documentId)).toEqual(['otro']);
  });

  it('descarta los matches sin metadata utilizable', () => {
    const sinMeta: VectorMatch = { id: 'x-0', score: 0.9 };
    const { contables } = matchesContables([sinMeta, match('otro', 0.8)], PROPIO, CENSADOS);
    expect(contables).toHaveLength(1);
  });

  it('descarta los matches sin score — sin score no se puede contar contra un umbral', () => {
    const sinScore: VectorMatch = {
      id: 'y-0',
      metadata: {
        text: 'x', documentId: 'y', documentName: 'y', chunkIndex: 0, totalChunks: 1, orgId: 'org',
      },
    };
    const { contables } = matchesContables([sinScore, match('otro', 0.8)], PROPIO, CENSADOS);
    expect(contables.map(c => c.documentId)).toEqual(['otro']);
  });

  it('descarta generaciones muertas Y LAS CUENTA — la caída no puede ser muda', () => {
    const activas = new Map([['viejo', 2]]);
    const { contables, deGeneracionMuerta } = matchesContables(
      [match('viejo', 0.9, { generation: 1 }), match('viejo', 0.8, { generation: 2 })],
      PROPIO,
      activas,
    );
    expect(contables.map(c => c.generation)).toEqual([2]);
    expect(deGeneracionMuerta).toBe(1);
  });

  it('la generacion ausente es la 1 implicita, no una exclusion', () => {
    const activas = new Map([['antiguo', 1]]);
    const { contables, deGeneracionMuerta } = matchesContables(
      [match('antiguo', 0.9)],
      PROPIO,
      activas,
    );
    expect(contables).toHaveLength(1);
    expect(deGeneracionMuerta).toBe(0);
  });

  /**
   * ⚠️ CASO DECISIVO DEL CENSO, Y ES EL CONTRARIO DEL QUE HABÍA AQUÍ — F-115.
   *
   * Hasta el 22/09/2026 este caso afirmaba que un vecino AUSENTE del mapa «se
   * CONSERVA — la ausencia de dato no es dato». Con el mapa completo de este
   * censo, ausente significa **no tiene fila**, y conservarlo era medir
   * contaminación como si fuera vecindario: la matriz completa del 21/09 contó
   * +6 scores de CLI-05 en 3 de 41 documentos y nada lo dijo.
   *
   * Ahora se descarta Y SE CUENTA aparte, que es la mitad que faltaba.
   */
  it('⚠️ un vecino SIN FILA se descarta y se cuenta en su propio contador', () => {
    const { contables, sinFilaViva, deGeneracionMuerta } = matchesContables(
      [match(FANTASMA, 0.866, { generation: 2 }), match('otro', 0.8)],
      PROPIO,
      CENSADOS,
    );
    expect(contables.map(c => c.documentId)).toEqual(['otro']);
    expect(sinFilaViva).toBe(1);
    // ⚠️ Y NO se le atribuye a la generación muerta, que es la causa vecina.
    expect(deGeneracionMuerta).toBe(0);
  });

  it('en régimen normal el contador de fila viva no se mueve', () => {
    const { sinFilaViva } = matchesContables([match('otro', 0.8)], PROPIO, CENSADOS);
    expect(sinFilaViva).toBe(0);
  });
});

describe('acumularVecinos — un vecino se cuenta una vez, con su mejor parecido', () => {
  it('se queda con el score MAXIMO, no con el ultimo', () => {
    const mejores = new Map<string, Vecino>();
    acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.91, texto: 'prosa', vectorId: 'a-1-0', chunkIndex: 0 }], 'prosa');
    acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.62, texto: 'prosa', vectorId: 'a-1-1', chunkIndex: 1 }], 'prosa');
    expect(mejores.get('a')!.scoreMax).toBeCloseTo(0.91);
  });

  it('ocho trozos que encuentran al mismo vecino son UN vecino', () => {
    const mejores = new Map<string, Vecino>();
    for (let i = 0; i < 8; i++) {
      acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.5 + i / 100, texto: 'prosa', vectorId: `a-1-${i}`, chunkIndex: i }], 'prosa');
    }
    expect(mejores.size).toBe(1);
    expect(mejores.get('a')!.scoreMax).toBeCloseTo(0.57);
  });
});

describe('resumirVecindario — los dos umbrales', () => {
  function mapaDe(pares: Array<[string, number]>): Map<string, Vecino> {
    const m = new Map<string, Vecino>();
    for (const [id, score] of pares) m.set(id, { documentId: id, documentName: id.toUpperCase(), scoreMax: score, clasePar: 'prosa_x_prosa', muestraPropia: '', muestraVecina: '' });
    return m;
  }

  it('cuenta por encima de 0,50 en `vecinos` y de 0,45 en `vecinos_045`', () => {
    const r = resumirVecindario(mapaDe([['a', 0.95], ['b', 0.61], ['c', 0.30]]));
    expect(r.vecinos).toBe(2);
    expect(r.vecinos_045).toBe(2);
  });

  it('⚠️ CONTROL POSITIVO: un vecino entre 0,45 y 0,50 sale SOLO en vecinos_045 — es exactamente lo que el exhaustivo compra', () => {
    const r = resumirVecindario(mapaDe([['a', 0.95], ['soloExhaustivo', 0.47]]));
    expect(r.vecinos).toBe(1);
    expect(r.vecinos_045).toBe(2);
    // La resta es la cifra que da sentido al censo: si esto deja de ser 1, el
    // censo ya no mide lo que dice medir.
    expect(r.vecinos_045 - r.vecinos).toBe(1);
  });

  it('el umbral es INCLUSIVO: un vecino clavado en 0,50 cuenta en los dos', () => {
    const r = resumirVecindario(mapaDe([['justo', UMBRALES_DEL_CENSO.vecinos]]));
    expect(r.vecinos).toBe(1);
    expect(r.vecinos_045).toBe(1);
  });

  it('y clavado en 0,45 cuenta solo en vecinos_045', () => {
    const r = resumirVecindario(mapaDe([['justo', UMBRALES_DEL_CENSO.vecinos_045]]));
    expect(r.vecinos).toBe(0);
    expect(r.vecinos_045).toBe(1);
  });

  it('sin vecinos: ceros y scoreMax 0, no undefined', () => {
    const r = resumirVecindario(new Map());
    expect(r).toEqual({ vecinos: 0, vecinos_045: 0, scoreMax: 0, detalle: [], porClase: reparteVacio() });
  });

  it('scoreMax es el mayor AUNQUE no llegue a ningun umbral — distingue «no se parece a nadie» de «se parece poco»', () => {
    const r = resumirVecindario(mapaDe([['a', 0.31], ['b', 0.22]]));
    expect(r.vecinos_045).toBe(0);
    expect(r.scoreMax).toBeCloseTo(0.31);
  });

  it('el detalle va de mayor a menor y solo trae los que pasan 0,45', () => {
    const r = resumirVecindario(mapaDe([['bajo', 0.2], ['medio', 0.55], ['alto', 0.9]]));
    expect(r.detalle.map(v => v.documentId)).toEqual(['alto', 'medio']);
  });

  it('los umbrales publicados son los del retrieval, no una copia', () => {
    expect(UMBRALES_DEL_CENSO.vecinos).toBe(0.5);
    expect(UMBRALES_DEL_CENSO.vecinos_045).toBe(0.45);
    expect(UMBRALES_DEL_CENSO.vecinos).toBeGreaterThan(UMBRALES_DEL_CENSO.vecinos_045);
  });
});

// ════════════════════════════════════════════════════════════════════════
// B.246 — LA CLASE DEL PAR. Los textos de ejemplo son los que `chunking.ts`
// produce de verdad (`:846`, `:882-884`, `:902`), no inventados: si la
// plantilla cambia, estas pruebas caen, que es justo lo que se quiere.
// ════════════════════════════════════════════════════════════════════════

const RESUMEN_TARIFAS =
  '[Hoja "Tarifas"] Tabla con 60 filas y 7 columnas. Columnas: Tratamiento, Precio, Duracion, Mutua, Codigo, Sede, Notas.';
const RESUMEN_GUARDIAS =
  '[Hoja "Guardias"] Tabla con 31 filas y 5 columnas. Columnas: Dia, Profesional, Turno, Sede, Telefono.';
const FILA_TARIFAS =
  '[Hoja "Tarifas"] Tratamiento: Implante unitario | Precio: 1.250 EUR | Duracion: 90 min';
const PROSA =
  'El consentimiento informado debe firmarse antes de cualquier intervencion quirurgica.';

describe('clasificarTrozo — se lee de la plantilla, no de un campo', () => {
  it('reconoce el resumen de tabla por su frase hecha', () => {
    expect(clasificarTrozo(RESUMEN_TARIFAS)).toBe('resumen_tabla');
    expect(clasificarTrozo(RESUMEN_GUARDIAS)).toBe('resumen_tabla');
  });

  it('una fila de tabla NO es un resumen, aunque venga de la misma hoja', () => {
    expect(clasificarTrozo(FILA_TARIFAS)).toBe('otro_de_hoja');
  });

  it('la prosa no lleva prefijo de hoja', () => {
    expect(clasificarTrozo(PROSA)).toBe('prosa');
  });

  it('un texto vacio es prosa, no revienta', () => {
    expect(clasificarTrozo('')).toBe('prosa');
  });

  it('⚠️ LA PRUEBA DEL HALLAZGO: dos resumenes de temas AJENOS comparten la frase hecha', () => {
    // Tarifas de tratamientos y cuadrante de guardias no tienen nada que ver.
    // Lo que comparten es el envoltorio, y se puede contar:
    const plantilla = 'Tabla con 60 filas y 7 columnas. Columnas:'.length;
    expect(RESUMEN_TARIFAS).toContain('Tabla con');
    expect(RESUMEN_GUARDIAS).toContain('Tabla con');
    // Ambos son de la misma clase pese a no compartir NI UNA columna.
    const columnasTarifas = RESUMEN_TARIFAS.split('Columnas: ')[1];
    const columnasGuardias = RESUMEN_GUARDIAS.split('Columnas: ')[1];
    const comunes = columnasTarifas.split(', ').filter(c => columnasGuardias.includes(c));
    expect(comunes.filter(c => c !== 'Sede.' && c !== 'Sede')).toHaveLength(0);
    expect(plantilla).toBeGreaterThan(40);
    expect(clasificarPar(clasificarTrozo(RESUMEN_TARIFAS), clasificarTrozo(RESUMEN_GUARDIAS)))
      .toBe('resumen_x_resumen');
  });
});

describe('clasificarPar — las cinco clases', () => {
  it('resumen con resumen es la clase que acusa', () => {
    expect(clasificarPar('resumen_tabla', 'resumen_tabla')).toBe('resumen_x_resumen');
  });

  it('resumen con cualquier otra cosa se separa: no es lo mismo y no se mezcla', () => {
    expect(clasificarPar('resumen_tabla', 'prosa')).toBe('resumen_x_otro');
    expect(clasificarPar('otro_de_hoja', 'resumen_tabla')).toBe('resumen_x_otro');
  });

  it('prosa con prosa es el caso limpio: si aqui hay vecinos, el parecido es de contenido', () => {
    expect(clasificarPar('prosa', 'prosa')).toBe('prosa_x_prosa');
  });

  it('hoja con hoja sin resumenes: filas contra filas', () => {
    expect(clasificarPar('otro_de_hoja', 'otro_de_hoja')).toBe('hoja_x_hoja');
  });

  it('hoja con prosa', () => {
    expect(clasificarPar('otro_de_hoja', 'prosa')).toBe('hoja_x_prosa');
    expect(clasificarPar('prosa', 'otro_de_hoja')).toBe('hoja_x_prosa');
  });

  it('es SIMETRICA: el orden de los dos lados no cambia la clase', () => {
    const clases = ['resumen_tabla', 'otro_de_hoja', 'prosa'] as const;
    for (const a of clases) {
      for (const b of clases) {
        expect(clasificarPar(a, b)).toBe(clasificarPar(b, a));
      }
    }
  });
});

describe('el reparto por clase llega hasta el resumen', () => {
  it('cuenta SOLO los vecinos que pasan 0,50 — los que llegarian al rerank', () => {
    const m = new Map<string, Vecino>();
    m.set('a', { documentId: 'a', documentName: 'A', scoreMax: 0.97, clasePar: 'resumen_x_resumen', muestraPropia: '', muestraVecina: '' });
    m.set('b', { documentId: 'b', documentName: 'B', scoreMax: 0.46, clasePar: 'resumen_x_resumen', muestraPropia: '', muestraVecina: '' });
    const r = resumirVecindario(m);
    expect(r.vecinos).toBe(1);
    expect(r.porClase.resumen_x_resumen).toBe(1);
  });

  it('⚠️ EL CASO QUE DECIDE B.246: todos los vecinos por envoltorio', () => {
    const m = new Map<string, Vecino>();
    for (const id of ['a', 'b', 'c']) {
      m.set(id, { documentId: id, documentName: id, scoreMax: 0.96, clasePar: 'resumen_x_resumen', muestraPropia: '', muestraVecina: '' });
    }
    const r = resumirVecindario(m);
    expect(r.vecinos).toBe(3);
    expect(r.porClase.resumen_x_resumen).toBe(3);
    expect(r.porClase.prosa_x_prosa).toBe(0);
  });

  it('las cinco clases se escriben SIEMPRE, incluidos los ceros', () => {
    const r = resumirVecindario(new Map());
    expect(Object.keys(r.porClase).sort()).toEqual(
      ['hoja_x_hoja', 'hoja_x_prosa', 'prosa_x_prosa', 'resumen_x_otro', 'resumen_x_resumen'],
    );
  });

  it('acumularVecinos clasifica el par con los DOS lados, no solo el vecino', () => {
    const mejores = new Map<string, Vecino>();
    acumularVecinos(
      mejores,
      [{ documentId: 'v', documentName: 'V', score: 0.97, texto: RESUMEN_GUARDIAS, vectorId: 'v-1-0', chunkIndex: 0 }],
      RESUMEN_TARIFAS,
    );
    expect(mejores.get('v')!.clasePar).toBe('resumen_x_resumen');
    expect(mejores.get('v')!.muestraPropia).toContain('Tarifas');
    expect(mejores.get('v')!.muestraVecina).toContain('Guardias');
  });

  it('un resumen contra prosa NO es un cruce de envoltorio', () => {
    const mejores = new Map<string, Vecino>();
    acumularVecinos(
      mejores,
      [{ documentId: 'v', documentName: 'V', score: 0.8, texto: PROSA, vectorId: 'v-1-0', chunkIndex: 0 }],
      RESUMEN_TARIFAS,
    );
    expect(mejores.get('v')!.clasePar).toBe('resumen_x_otro');
  });
});

describe('el reconocedor no se puede aflojar — lo cazo una mutacion superviviente', () => {
  /** ⚠️ ESTA PRUEBA NACE DE UN MUTANTE QUE SOBREVIVIO. Aflojar el reconocedor a
   *  /Tabla con/ dejaba pasar las 32 pruebas: prosa que hablase de tablas se
   *  habria contado como resumen, y el reparto de B.246 habria acusado a la
   *  plantilla de cruces que no eran suyos. Un caso verde que no puede fallar
   *  por su propio motivo es un adorno. */
  it('prosa que MENCIONA una tabla no es un resumen de tabla', () => {
    expect(clasificarTrozo(
      'La Tabla con los precios vigentes se revisa cada trimestre por el comite.',
    )).toBe('prosa');
    expect(clasificarTrozo(
      'Tabla con los turnos: ver el anexo II del manual de acogida.',
    )).toBe('prosa');
  });

  it('hace falta la frase COMPLETA, con sus dos numeros y la palabra Columnas', () => {
    expect(clasificarTrozo('Tabla con 60 filas.')).toBe('prosa');
    expect(clasificarTrozo('Tabla con 60 filas y 7 columnas.')).toBe('prosa');
    expect(clasificarTrozo('Tabla con 60 filas y 7 columnas. Columnas: A, B.')).toBe('resumen_tabla');
  });
});

/**
 * ⚠️ EL TERMÓMETRO DEL OPERANDO REAL — medición F-111.
 *
 * El resto de este fichero prueba el censo por DOCUMENTO (el máximo). Esto
 * prueba lo otro: la distribución por FRAGMENTO, que es lo que el umbral de
 * `retrieval.ts:498` compara y lo que nunca se había medido.
 */
describe('distribucionDeScores — el rango del operando que el umbral juzga', () => {
  it('sin fragmentos, el mínimo es AUSENTE y no cero: son cosas distintas', () => {
    const d = distribucionDeScores([]);
    expect(d.n).toBe(0);
    expect(d.minimo).toBeNull();
    expect(d.maximo).toBeNull();
    expect(d.p1).toBeNull();
    expect(d.p50).toBeNull();
    expect(d.histograma).toHaveLength(20);
    expect(d.histograma.every(c => c === 0)).toBe(true);
    expect(d.bajo_umbral_rapido).toBe(0);
  });

  it('n, mínimo, máximo y el histograma reparten cada score en su cubo de 0,05', () => {
    const d = distribucionDeScores([0.02, 0.33, 0.34, 0.79, 1.0]);
    expect(d.n).toBe(5);
    expect(d.minimo).toBe(0.02);
    expect(d.maximo).toBe(1.0);
    expect(d.histograma[0]).toBe(1);   // [0,00 · 0,05)
    expect(d.histograma[6]).toBe(2);   // [0,30 · 0,35)
    expect(d.histograma[15]).toBe(1);  // [0,75 · 0,80)
    // ⚠️ El 1,00 EXACTO no se sale de la escala: cae en el último cubo.
    expect(d.histograma[19]).toBe(1);
    expect(d.histograma.reduce((a, b) => a + b, 0)).toBe(d.n);
  });

  it('los percentiles son el borde inferior del cubo donde cae la acumulada', () => {
    // 100 fragmentos: uno en [0,10·0,15) y noventa y nueve en [0,90·0,95).
    const scores = [0.12, ...Array.from({ length: 99 }, () => 0.93)];
    const d = distribucionDeScores(scores);
    expect(d.n).toBe(100);
    expect(d.p1).toBe(0.1);   // el primer elemento ya está en ese cubo
    expect(d.p5).toBe(0.9);   // el 5.º ya está arriba
    expect(d.p50).toBe(0.9);
  });

  /**
   * ⚠️ CASO DECISIVO. Los dos scores están ENTRE los dos umbrales (0,45 y 0,50),
   * así que cada recuento sale distinto — y mover CUALQUIERA de las dos
   * constantes cambia una de las dos cifras:
   *   · subir 0,50 a 0,55 → `bajo_umbral_rapido` pasaría de 2 a 4;
   *   · bajar 0,50 a 0,45 → pasaría de 2 a 0;
   *   · subir 0,45 a 0,50 → `bajo_umbral_exhaustivo` pasaría de 0 a 2;
   *   · bajar 0,45 a 0,40 → seguiría en 0 sólo porque no hay nada ahí abajo,
   *     y por eso el caso mete además un 0,41 que SÍ lo mueve.
   */
  it('⚠️ los dos recuentos separan los dos umbrales, y mover cualquiera los cambia', () => {
    const d = distribucionDeScores([0.41, 0.46, 0.48, 0.52, 0.93]);

    // Por debajo de 0,50: el 0,41, el 0,46 y el 0,48 — tres.
    expect(d.bajo_umbral_rapido).toBe(3);
    // Por debajo de 0,45: sólo el 0,41 — uno.
    expect(d.bajo_umbral_exhaustivo).toBe(1);

    // Y la separación es el dato: es lo que el exhaustivo compra con su umbral.
    expect(d.bajo_umbral_rapido - d.bajo_umbral_exhaustivo).toBe(2);

    // Los recuentos se derivan de las constantes REALES, no de literales.
    expect(SCORE_THRESHOLD_QUICK).toBeGreaterThan(SCORE_THRESHOLD_EXHAUSTIVE);
  });

  /**
   * ⚠️ LA FRONTERA, CON EL MISMO OPERADOR QUE DECIDE EN PRODUCCIÓN.
   * `pasaElUmbral` (`lib/analysis/umbral-de-recuperacion.ts:22`) es
   * `score >= umbral`, así que el score EXACTAMENTE igual al umbral **pasa** y
   * no se cuenta como descartado. Se comprueba contra la función real para que
   * el día que alguien cambie `>=` por `>` esto se ponga rojo.
   */
  it('⚠️ un score EXACTAMENTE igual al umbral pasa, y no se cuenta como descartado', () => {
    const d = distribucionDeScores([SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE]);

    // El de 0,50 pasa el rápido; el de 0,45 no lo pasa.
    expect(pasaElUmbral(SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_QUICK)).toBe(true);
    expect(pasaElUmbral(SCORE_THRESHOLD_EXHAUSTIVE, SCORE_THRESHOLD_QUICK)).toBe(false);
    expect(d.bajo_umbral_rapido).toBe(1);

    // Los dos pasan el exhaustivo: el 0,45 por igualdad.
    expect(pasaElUmbral(SCORE_THRESHOLD_EXHAUSTIVE, SCORE_THRESHOLD_EXHAUSTIVE)).toBe(true);
    expect(d.bajo_umbral_exhaustivo).toBe(0);

    // El complemento, dicho como invariante y no como dos números sueltos.
    const scores = [SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE, 0.1, 0.99];
    const esperadoRapido = scores.filter(s => !pasaElUmbral(s, SCORE_THRESHOLD_QUICK)).length;
    expect(distribucionDeScores(scores).bajo_umbral_rapido).toBe(esperadoRapido);
  });
});

/**
 * ⚠️ LOS DOS PARÁMETROS DE LA MEDICIÓN DEL SUELO — F-113.
 *
 * Con `topK = 25` el mínimo observado no es el suelo: es el puesto 25. Medir el
 * suelo exige pedir más que el fondo, y el tope lo pone el servicio. Estos casos
 * vigilan que el parseo falle hacia el comportamiento de hoy y que el tope se
 * declare en vez de recortar en silencio.
 */
describe('topKPedido — el parseo, y el tope que no pone esta casa', () => {
  const POR_DEFECTO = 25;

  it('sin parámetro, se usa el del pipeline y no se declara nada', () => {
    for (const raw of [null, undefined, '', '   ']) {
      expect(topKPedido(raw, POR_DEFECTO)).toEqual({ valor: 25, acotado: false, ignorado: false });
    }
  });

  it('un entero válido se usa tal cual', () => {
    expect(topKPedido('100', POR_DEFECTO)).toEqual({ valor: 100, acotado: false, ignorado: false });
    expect(topKPedido('1', POR_DEFECTO)).toEqual({ valor: 1, acotado: false, ignorado: false });
    expect(topKPedido('1000', POR_DEFECTO)).toEqual({ valor: 1000, acotado: false, ignorado: false });
  });

  it('⚠️ el 0 y los negativos se IGNORAN: no se recortan a 1 ni tumban el censo', () => {
    expect(topKPedido('0', POR_DEFECTO)).toEqual({ valor: 25, acotado: false, ignorado: true });
    expect(topKPedido('-5', POR_DEFECTO)).toEqual({ valor: 25, acotado: false, ignorado: true });
  });

  it('el texto y los decimales se ignoran, y se dice', () => {
    // `10e3`, `0x10` y `+5` son enteros para Number() y NO son un tope escrito a
    // mano: se ignoran a propósito, porque «entero» aquí significa sólo dígitos.
    for (const basura of ['abc', 'cien', '10e3', '0x10', '+5', '1,5', '1.5', 'NaN', 'Infinity', '25px']) {
      const r = topKPedido(basura, POR_DEFECTO);
      expect(r.ignorado, `"${basura}" no se ignoró`).toBe(true);
      expect(r.valor).toBe(POR_DEFECTO);
    }
  });

  /**
   * ⚠️ CASO DECISIVO DEL TOPE. Mover `TOPK_MAXIMO_DEL_SERVICIO` cambia el
   * resultado de las tres aserciones: el valor acotado, el borde que aún pasa y
   * el primero que se recorta. No hay ningún 10000 escrito a mano en este caso —
   * todo se deriva de la constante, así que el día que el servicio cambie su
   * límite, esto sigue midiendo lo que dice medir.
   */
  it('⚠️ por encima del tope del servicio se ACOTA y se declara', () => {
    const r = topKPedido(String(TOPK_MAXIMO_DEL_SERVICIO + 1), POR_DEFECTO);
    expect(r).toEqual({ valor: TOPK_MAXIMO_DEL_SERVICIO, acotado: true, ignorado: false });

    // El borde exacto NO se acota: el tope es el máximo admitido, no el primero prohibido.
    expect(topKPedido(String(TOPK_MAXIMO_DEL_SERVICIO), POR_DEFECTO))
      .toEqual({ valor: TOPK_MAXIMO_DEL_SERVICIO, acotado: false, ignorado: false });

    // Y un valor absurdamente alto cae en el mismo sitio, no en un error.
    expect(topKPedido('999999', POR_DEFECTO).valor).toBe(TOPK_MAXIMO_DEL_SERVICIO);

    // El tope es el del servicio, con su fuente en el comentario de la constante.
    expect(TOPK_MAXIMO_DEL_SERVICIO).toBe(10000);
  });
});

describe('poblacionPedida — falla hacia el censo de hoy', () => {
  it('sólo `real` cambia la población', () => {
    expect(poblacionPedida('real')).toBe('real');
    expect(poblacionPedida('REAL')).toBe('real');
    expect(poblacionPedida('  real  ')).toBe('real');
  });

  it('⚠️ cualquier otra cosa deja el censo como está: sin filtro, todo el namespace', () => {
    for (const raw of [null, undefined, '', 'todos', 'corpus', 'true', '1', 'reales']) {
      expect(poblacionPedida(raw), `"${raw}" cambió la población`).toBe('todos');
    }
  });
});

/**
 * ⚠️ LA PAREJA DEL MÍNIMO — F-114.
 *
 * Un suelo de 0,696 sin su pareja es una cifra que no se puede examinar ni
 * sembrar. Estos casos vigilan las dos cosas que decide la función: que gana la
 * de MENOR score, y que un empate se DECLARA en vez de convertir una
 * coincidencia en un hecho.
 */
function lado(vectorId: string, documentId: string, texto: string, chunkIndex: number | null = 0) {
  return { vectorId, documentId, documentName: documentId.toUpperCase(), chunkIndex, texto };
}
function obs(score: number, a: string, b: string): ObservacionDeScore {
  return { score, consulta: lado(`${a}-1-0`, a, `texto de ${a}`), devuelto: lado(`${b}-1-0`, b, `texto de ${b}`) };
}

describe('parejaDelMinimo — gana la menor, y el empate se dice', () => {
  it('sin observaciones no hay pareja: null, no un cero', () => {
    expect(parejaDelMinimo([])).toBeNull();
    expect(acumularParejaDelMinimo(null, obs(NaN, 'a', 'b'))).toBeNull();
  });

  /** ⚠️ CASO DECISIVO: con varias parejas gana la de menor score, y no la
   *  primera ni la última. Mover el `<` a `<=` o el orden del recorrido cambia
   *  el resultado de las tres aserciones. */
  it('⚠️ con varias parejas gana la de MENOR score, venga en cualquier posición', () => {
    const p = parejaDelMinimo([obs(0.91, 'a', 'b'), obs(0.696, 'new12', 'ope11'), obs(0.83, 'c', 'd')]);
    expect(p!.score).toBeCloseTo(0.696);
    expect(p!.consulta.documentId).toBe('new12');
    expect(p!.devuelto.documentId).toBe('ope11');
    expect(p!.empate).toBe(false);
    expect(p!.empatados).toBe(1);

    // Y si la menor viene primera, el resultado es el mismo.
    const q = parejaDelMinimo([obs(0.696, 'new12', 'ope11'), obs(0.91, 'a', 'b')]);
    expect(q!.consulta.documentId).toBe('new12');
  });

  it('⚠️ un empate se DECLARA, y se conserva la PRIMERA', () => {
    const p = parejaDelMinimo([obs(0.7, 'x', 'y'), obs(0.7, 'z', 'w'), obs(0.9, 'a', 'b')]);
    expect(p!.score).toBeCloseTo(0.7);
    expect(p!.empate).toBe(true);
    expect(p!.empatados).toBe(2);
    // La primera es la que queda: quedarse con una y callar convertiría una
    // coincidencia en un hecho.
    expect(p!.consulta.documentId).toBe('x');
  });

  it('una sola observación no es un empate', () => {
    const p = parejaDelMinimo([obs(0.5, 'a', 'b')]);
    expect(p!.empate).toBe(false);
    expect(p!.empatados).toBe(1);
  });

  it('el acumulador no muta lo que recibe: es puro', () => {
    const primera = parejaDelMinimo([obs(0.8, 'a', 'b')])!;
    const copia = { ...primera };
    acumularParejaDelMinimo(primera, obs(0.4, 'c', 'd'));
    expect(primera).toEqual(copia);
  });

  it('⚠️ dos TRAMOS se combinan por la menor, y los empates se suman', () => {
    const tramo1 = parejaDelMinimo([obs(0.72, 'a', 'b')]);
    const tramo2 = parejaDelMinimo([obs(0.696, 'new12', 'ope11')]);
    expect(parejaMenorDeDos(tramo1, tramo2)!.consulta.documentId).toBe('new12');
    expect(parejaMenorDeDos(tramo2, tramo1)!.consulta.documentId).toBe('new12');
    expect(parejaMenorDeDos(null, tramo2)).toBe(tramo2);
    expect(parejaMenorDeDos(tramo1, null)).toBe(tramo1);

    // Mismo score en dos tramos: son observaciones distintas, así que empatan.
    const a = parejaDelMinimo([obs(0.7, 'x', 'y')]);
    const b = parejaDelMinimo([obs(0.7, 'z', 'w')]);
    const combinado = parejaMenorDeDos(a, b)!;
    expect(combinado.empate).toBe(true);
    expect(combinado.empatados).toBe(2);
  });

  it('la muestra se recorta a 120 caracteres, en un solo sitio', () => {
    expect(CARACTERES_DE_MUESTRA).toBe(120);
    const largo = 'x'.repeat(500);
    expect(muestraDeTexto(largo)).toHaveLength(120);
    expect(muestraDeTexto('corto')).toBe('corto');
  });
});

/**
 * ⚠️ EL TRAMO — F-114. La matriz completa puede no caber en los 300 s de
 * `maxDuration`, así que se puede partir. Estos casos vigilan que la partición
 * sea una partición: sin solapes, sin huecos, y fallando hacia la pasada entera.
 */
describe('tramoPedido — partir la matriz sin solapes ni huecos', () => {
  const TOTAL = 41;

  it('sin parámetros es la pasada ENTERA, y no se declara tramo', () => {
    expect(tramoPedido(null, null, TOTAL)).toEqual({ desde: 0, cuantos: 41, aplicado: false, ignorado: false });
    expect(tramoPedido('', '   ', TOTAL).aplicado).toBe(false);
  });

  it('⚠️ dos tramos consecutivos son una PARTICIÓN: ni se solapan ni dejan hueco', () => {
    const a = tramoPedido('0', '10', TOTAL);
    const b = tramoPedido('10', '10', TOTAL);
    expect(a).toEqual({ desde: 0, cuantos: 10, aplicado: true, ignorado: false });
    expect(b).toEqual({ desde: 10, cuantos: 10, aplicado: true, ignorado: false });
    // El primero cubre [0,10) y el segundo [10,20): el borde no se repite.
    expect(a.desde + a.cuantos).toBe(b.desde);
  });

  it('⚠️ el último tramo se RECORTA al total: no se piden documentos que no existen', () => {
    expect(tramoPedido('40', '10', TOTAL)).toEqual({ desde: 40, cuantos: 1, aplicado: true, ignorado: false });
    expect(tramoPedido('41', '10', TOTAL).cuantos).toBe(0);
    expect(tramoPedido('500', '10', TOTAL)).toEqual({ desde: 41, cuantos: 0, aplicado: true, ignorado: false });
  });

  it('sólo `desde` va hasta el final; sólo `cuantos` empieza en 0', () => {
    expect(tramoPedido('30', null, TOTAL)).toEqual({ desde: 30, cuantos: 11, aplicado: true, ignorado: false });
    expect(tramoPedido(null, '5', TOTAL)).toEqual({ desde: 0, cuantos: 5, aplicado: true, ignorado: false });
  });

  it('⚠️ un parámetro mal escrito NO parte a medias: se ignora y se declara', () => {
    for (const [d, c] of [['abc', '10'], ['0', 'x'], ['-1', '10'], ['0', '0'], ['1.5', '2'], ['0x10', '1']]) {
      const t = tramoPedido(d, c, TOTAL);
      expect(t.ignorado, `desde=${d} cuantos=${c} no se ignoró`).toBe(true);
      expect(t.aplicado).toBe(false);
      // Y falla hacia la pasada entera, que es la medición correcta aunque tarde.
      expect(t.desde).toBe(0);
      expect(t.cuantos).toBe(TOTAL);
    }
  });

  it('los tramos cubren el total exactamente, recorriéndolos en bucle', () => {
    let cubiertos = 0;
    for (let desde = 0; desde < TOTAL; desde += 10) {
      cubiertos += tramoPedido(String(desde), '10', TOTAL).cuantos;
    }
    expect(cubiertos).toBe(TOTAL);
  });
});
