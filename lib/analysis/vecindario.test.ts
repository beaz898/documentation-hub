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
  type Vecino,
} from './vecindario';
import { SCORE_THRESHOLD_QUICK, SCORE_THRESHOLD_EXHAUSTIVE } from './retrieval';
import { pasaElUmbral } from './umbral-de-recuperacion';
import type { VectorMatch } from '@/lib/pinecone/types';
import { clasificarTrozo, clasificarPar, reparteVacio } from './clase-de-trozo';

const PROPIO = 'doc-propio';

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
  it('excluye el documento propio, que siempre se encuentra a si mismo', () => {
    const { contables } = matchesContables(
      [match(PROPIO, 0.99), match('otro', 0.8)],
      PROPIO,
      new Map(),
    );
    expect(contables.map(c => c.documentId)).toEqual(['otro']);
  });

  it('descarta los matches sin metadata utilizable', () => {
    const sinMeta: VectorMatch = { id: 'x-0', score: 0.9 };
    const { contables } = matchesContables([sinMeta, match('otro', 0.8)], PROPIO, new Map());
    expect(contables).toHaveLength(1);
  });

  it('descarta los matches sin score — sin score no se puede contar contra un umbral', () => {
    const sinScore: VectorMatch = {
      id: 'y-0',
      metadata: {
        text: 'x', documentId: 'y', documentName: 'y', chunkIndex: 0, totalChunks: 1, orgId: 'org',
      },
    };
    const { contables } = matchesContables([sinScore, match('otro', 0.8)], PROPIO, new Map());
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

  it('un vecino del que no se sabe la generacion activa se CONSERVA — la ausencia de dato no es dato', () => {
    const { contables } = matchesContables([match('desconocido', 0.9, { generation: 7 })], PROPIO, new Map());
    expect(contables).toHaveLength(1);
  });
});

describe('acumularVecinos — un vecino se cuenta una vez, con su mejor parecido', () => {
  it('se queda con el score MAXIMO, no con el ultimo', () => {
    const mejores = new Map<string, Vecino>();
    acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.91, texto: 'prosa' }], 'prosa');
    acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.62, texto: 'prosa' }], 'prosa');
    expect(mejores.get('a')!.scoreMax).toBeCloseTo(0.91);
  });

  it('ocho trozos que encuentran al mismo vecino son UN vecino', () => {
    const mejores = new Map<string, Vecino>();
    for (let i = 0; i < 8; i++) {
      acumularVecinos(mejores, [{ documentId: 'a', documentName: 'A', score: 0.5 + i / 100, texto: 'prosa' }], 'prosa');
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
      [{ documentId: 'v', documentName: 'V', score: 0.97, texto: RESUMEN_GUARDIAS }],
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
      [{ documentId: 'v', documentName: 'V', score: 0.8, texto: PROSA }],
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
