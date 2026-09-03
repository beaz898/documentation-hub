import { describe, expect, it } from 'vitest';

import {
  planDeReemplazo,
  vectoresARetirar,
  versionAnterior,
  type DocumentoExistente,
} from './plan-de-reemplazo';

/**
 * EL REEMPLAZO SIN VENTANA (frente 3, paso 1).
 *
 * ⚠️ LO QUE ESTOS CASOS NO PUEDEN PROBAR, DECLARADO: `ingest` es una ruta y
 * todos sus pasos necesitan red, así que aquí se prueba EL PLAN —a quién se
 * versiona, con qué generación, qué se retira y qué se borra entero— y NO que la
 * ruta lo ejecute en ese orden. Eso se comprueba por lectura, y por eso el orden
 * va escrito como comentario numerado en la propia ruta.
 */

const viejo = (over: Partial<DocumentoExistente> = {}): DocumentoExistente => ({
  id: 'doc-viejo',
  active_generation: 1,
  chunk_count: 12,
  created_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('alta normal: no hay nada que reemplazar', () => {
  it('sin colisiones es un alta en generación 1', () => {
    expect(planDeReemplazo([])).toEqual({ tipo: 'alta', generacion: 1 });
  });

  /** MITAD CONTRARIA de la anterior: con una colisión ya NO es un alta. */
  it('con una colisión deja de ser un alta', () => {
    expect(planDeReemplazo([viejo()]).tipo).toBe('reemplazo');
  });

  it('en un alta no hay versión anterior que retirar', () => {
    expect(versionAnterior(planDeReemplazo([]), [])).toBeNull();
  });
});

describe('UN REEMPLAZO QUE VA BIEN DEJA UN DOCUMENTO, NO DOS', () => {
  /**
   * La propiedad entera del commit está en esta igualdad: el id del plan es el
   * id del viejo. Si fuera uno nuevo no habría nada que conmutar — serían dos
   * documentos distintos y el patrón crear→conmutar→borrar no se sostendría.
   */
  it('reutiliza el id del documento reemplazado', () => {
    const plan = planDeReemplazo([viejo({ id: 'el-mismo' })]);
    expect(plan.tipo === 'reemplazo' && plan.documentId).toBe('el-mismo');
  });

  it('un solo homónimo no deja sobrantes que borrar', () => {
    const plan = planDeReemplazo([viejo()]);
    expect(plan.tipo === 'reemplazo' && plan.sobrantes).toEqual([]);
  });
});

describe('LA GENERACIÓN NUEVA NO PISA A LA VIEJA', () => {
  /**
   * ⚠️ ES EL CASO QUE IMPIDE EL PEOR FALLO POSIBLE DE ESTE COMMIT. Al reutilizar
   * el id, los ids de vector se derivan de `documentId` + generación. Si la
   * generación nueva coincidiera con la activa, el upsert PISARÍA los vectores
   * de la versión que todavía se está sirviendo — y entonces el orden
   * crear→conmutar→borrar no protegería nada, porque crear ya sería destruir.
   */
  it('la generación nueva es la activa + 1', () => {
    const plan = planDeReemplazo([viejo({ active_generation: 3 })]);
    expect(plan.tipo === 'reemplazo' && plan.generacion).toBe(4);
  });

  /** MITAD CONTRARIA: nunca es 1 cuando ya hay algo. */
  it('nunca reutiliza la generación activa', () => {
    for (const activa of [1, 2, 7]) {
      const plan = planDeReemplazo([viejo({ active_generation: activa })]);
      expect(plan.tipo === 'reemplazo' && plan.generacion).toBeGreaterThan(activa);
    }
  });

  /** Filas anteriores a C.4: `active_generation` puede venir null. */
  it('una fila sin generación se lee como 1, así que la nueva es 2', () => {
    for (const sinGen of [null, undefined]) {
      const plan = planDeReemplazo([viejo({ active_generation: sinGen })]);
      expect(plan.tipo === 'reemplazo' && plan.generacion).toBe(2);
    }
  });
});

describe('la versión anterior queda localizable para retirarla DESPUÉS', () => {
  /**
   * ⚠️ EL FANTASMA DE B.152 SE CIERRA AQUÍ. La generación vieja se retira por
   * IDS, y para construirlos hacen falta su generación y su `chunk_count`. Si el
   * plan no los conservara, tras conmutar la fila ya no habría de dónde sacarlos
   * —la fila ya lleva los datos NUEVOS— y los vectores viejos quedarían vivos y
   * fuera de alcance. Que se lea del plan y no de la fila es lo que lo evita.
   */
  it('conserva generación y chunk_count del que se versiona', () => {
    const colisiones = [viejo({ active_generation: 2, chunk_count: 40 })];
    expect(versionAnterior(planDeReemplazo(colisiones), colisiones)).toEqual({
      documentId: 'doc-viejo',
      generacion: 2,
      chunkCount: 40,
    });
  });

  /** La generación a retirar es la VIEJA, no la nueva: retirar la nueva dejaría
   *  al usuario sin ninguna de las dos, que es justo el fallo de B.140. */
  it('la generación a retirar es anterior a la que se acaba de crear', () => {
    const colisiones = [viejo({ active_generation: 5 })];
    const plan = planDeReemplazo(colisiones);
    const anterior = versionAnterior(plan, colisiones);
    expect(anterior!.generacion).toBeLessThan(plan.tipo === 'reemplazo' ? plan.generacion : 0);
  });

  it('un chunk_count ausente o absurdo no inventa ids que retirar', () => {
    for (const malo of [null, undefined, 0, -3]) {
      const colisiones = [viejo({ chunk_count: malo })];
      expect(versionAnterior(planDeReemplazo(colisiones), colisiones)!.chunkCount).toBe(0);
    }
  });
});

describe('homónimos: se versiona el más reciente y los demás se borran enteros', () => {
  const tres = (): DocumentoExistente[] => [
    viejo({ id: 'a', created_at: '2026-01-01T00:00:00Z', chunk_count: 3 }),
    viejo({ id: 'c', created_at: '2026-03-01T00:00:00Z', chunk_count: 9, active_generation: 2 }),
    viejo({ id: 'b', created_at: '2026-02-01T00:00:00Z', chunk_count: 5 }),
  ];

  it('versiona el de created_at más alto, venga en el orden que venga', () => {
    const plan = planDeReemplazo(tres());
    expect(plan.tipo === 'reemplazo' && plan.documentId).toBe('c');
    expect(plan.tipo === 'reemplazo' && plan.generacion).toBe(3);
  });

  /**
   * ⚠️ CONSERVA EL COMPORTAMIENTO DE HOY, que borra TODOS los homónimos. Si los
   * sobrantes dejaran de borrarse, este camino empezaría a dejar duplicados
   * donde hoy los limpia — una decisión de producto que este commit no toma.
   */
  it('los que no se versionan siguen borrándose, con lo necesario para hacerlo', () => {
    const plan = planDeReemplazo(tres());
    expect(plan.tipo === 'reemplazo' && plan.sobrantes).toEqual([
      { documentId: 'b', generacion: 1, chunkCount: 5 },
      { documentId: 'a', generacion: 1, chunkCount: 3 },
    ]);
  });

  /** MITAD CONTRARIA: el que se versiona NO está entre los que se borran. */
  it('el versionado nunca aparece entre los sobrantes', () => {
    const plan = planDeReemplazo(tres());
    const ids = plan.tipo === 'reemplazo' ? plan.sobrantes.map(s => s.documentId) : [];
    expect(ids).not.toContain('c');
  });

  it('sin created_at en ninguno sigue eligiendo uno solo y borrando el resto', () => {
    const plan = planDeReemplazo([
      viejo({ id: 'x', created_at: null }),
      viejo({ id: 'y', created_at: null }),
    ]);
    expect(plan.tipo === 'reemplazo' && plan.sobrantes).toHaveLength(1);
  });
});

describe('el plan no toca lo que le dan', () => {
  it('no reordena el array de colisiones del llamador', () => {
    const colisiones = [
      viejo({ id: 'a', created_at: '2026-01-01T00:00:00Z' }),
      viejo({ id: 'c', created_at: '2026-03-01T00:00:00Z' }),
    ];
    planDeReemplazo(colisiones);
    expect(colisiones.map(d => d.id)).toEqual(['a', 'c']);
  });
});

describe('LO QUE SE RETIRA ES LO ANTERIOR, NUNCA LO RECIÉN CREADO', () => {
  const idsDeTres = [
    'doc-0', 'doc-1',                 // generación 1 (implícita en el id)
    'doc-g2-0', 'doc-g2-1',           // generación 2
    'doc-g3-0', 'doc-g3-1',           // generación 3, la recién subida
  ];

  /**
   * ⚠️ EL CASO MÁS IMPORTANTE DEL FICHERO. Si esta comparación dejara de ser
   * estrictamente menor, el reemplazo borraría la generación que acaba de crear
   * y la organización se quedaría sin ninguna de las dos versiones — que es
   * exactamente el fallo que este camino vino a cerrar (B.140).
   */
  it('retira las generaciones anteriores', () => {
    expect(vectoresARetirar(idsDeTres, 3)).toEqual(['doc-0', 'doc-1', 'doc-g2-0', 'doc-g2-1']);
  });

  /** MITAD CONTRARIA: la generación nueva NO está entre las retiradas. */
  it('nunca retira la generación recién subida', () => {
    expect(vectoresARetirar(idsDeTres, 3)).not.toContain('doc-g3-0');
    expect(vectoresARetirar(idsDeTres, 3)).not.toContain('doc-g3-1');
  });

  /** Y tampoco lo que venga por encima: no debería existir, y si existe no es
   *  de este reemplazo, así que no se toca. */
  it('deja intacto lo posterior a la generación nueva', () => {
    expect(vectoresARetirar(idsDeTres, 2)).toEqual(['doc-0', 'doc-1']);
  });

  it('en la primera generación no hay nada anterior que retirar', () => {
    expect(vectoresARetirar(['doc-0', 'doc-1'], 1)).toEqual([]);
  });

  /** Un id ilegible no se toca: no borrar de más importa más que limpiar del
   *  todo. Mismo criterio que el swap con los ids anómalos. */
  it('un id que no se puede leer se queda donde está', () => {
    expect(vectoresARetirar(['basura', 'doc-0'], 5)).toEqual(['doc-0']);
  });

  it('sin vectores no retira nada', () => {
    expect(vectoresARetirar([], 4)).toEqual([]);
  });
});
