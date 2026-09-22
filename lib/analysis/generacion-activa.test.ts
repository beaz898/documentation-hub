import { describe, expect, it } from 'vitest';

import { generacionesMuertas, soloGeneracionActiva } from './generacion-activa';

/**
 * F-102 — LA SEGUNDA CAPA: que las generaciones muertas no SE VEAN.
 *
 * ⚠️ LO QUE NO PRUEBAN: que el retrieval construya bien el mapa de generaciones
 * activas — eso consulta Supabase. Lo que sí prueban es el criterio, que es
 * donde equivocarse cuesta candidatos.
 */

const f = (documentId: string, generation: number) => ({ documentId, generation });

describe('solo lo que el documento sirve hoy', () => {
  const activas = new Map([['doc-a', 2], ['doc-b', 1]]);

  it('conserva la generación activa', () => {
    expect(soloGeneracionActiva([f('doc-a', 2), f('doc-b', 1)], activas))
      .toEqual([f('doc-a', 2), f('doc-b', 1)]);
  });

  /**
   * ⚠️ LA MITAD CONTRARIA, y es el incidente entero: un fragmento de la
   * generación anterior entraba en la recuperación como si fuera el contenido
   * actual, y el diff lo comparaba contra el presente del mismo documento.
   */
  it('descarta una generación anterior', () => {
    expect(soloGeneracionActiva([f('doc-a', 1), f('doc-a', 2)], activas)).toEqual([f('doc-a', 2)]);
  });

  /** Y una posterior tampoco: no debería existir, y si existe no es la servida. */
  it('descarta una generación posterior', () => {
    expect(soloGeneracionActiva([f('doc-b', 2)], activas)).toEqual([]);
  });
});

describe('⚠️ LO QUE NO ESTÁ EN EL MAPA NO EXISTE — cambiado el 22/09/2026 (F-115)', () => {
  /**
   * ⚠️ ESTE BLOQUE SE LLAMABA «LO QUE NO SE SABE NO SE TIRA» Y AFIRMABA LO
   * CONTRARIO: que un documento ausente del mapa CONSERVABA sus fragmentos,
   * porque la ausencia podía venir de un fallo de lectura.
   *
   * La razón era buena y la premisa se cayó. Ahora el mapa lo construye
   * `documentosVivos`, que devuelve `{estado:'no_leido'}` cuando no pudo leer —
   * y entonces el análisis PARA antes de llegar aquí. Así que a esta función
   * sólo llega un mapa LEÍDO, donde la ausencia significa una cosa: **ese
   * documento no tiene fila**. Conservar sus fragmentos era servir un documento
   * borrado, que es F-115 (CLI-05, 21/09/2026).
   *
   * ⚠️ Estos tres casos son el MUTANTE de la regla vieja: si alguien devolviera
   * el `return true` de la ausencia, los tres se pondrían rojos.
   */
  it('⚠️ un documento que no está en el mapa NO TIENE FILA: se descarta', () => {
    expect(soloGeneracionActiva([f('doc-x', 1), f('doc-x', 7)], new Map([['doc-a', 2]])))
      .toEqual([]);
  });

  it('⚠️ con el mapa vacío se descarta TODO: ninguno tiene fila', () => {
    expect(soloGeneracionActiva([f('doc-a', 1)], new Map())).toEqual([]);
  });

  it('sin fragmentos no hay nada que decidir', () => {
    expect(soloGeneracionActiva([], new Map([['doc-a', 2]]))).toEqual([]);
  });

  it('y el que SÍ está con su generación sigue pasando: el otro lado del caso', () => {
    expect(soloGeneracionActiva([f('doc-a', 2)], new Map([['doc-a', 2]])))
      .toEqual([f('doc-a', 2)]);
  });
});

describe('la caída no es muda', () => {
  const activas = new Map([['doc-a', 2]]);

  /** ⚠️ ESPERADO CERO EN RÉGIMEN NORMAL: si esto se mueve, hay vectores de
   *  generaciones muertas vivos en el índice — lo que contaminó una medición y
   *  nadie vio, porque no había quien lo contara. */
  it('cuenta los descartados por documento', () => {
    expect(generacionesMuertas([f('doc-a', 1), f('doc-a', 1), f('doc-a', 2)], activas))
      .toEqual(new Map([['doc-a', 2]]));
  });

  it('en régimen normal no cuenta nada', () => {
    expect(generacionesMuertas([f('doc-a', 2)], activas).size).toBe(0);
  });

  /**
   * ⚠️ LO AUSENTE SE CUENTA, y el caso decía lo contrario hasta el 22/09/2026.
   *
   * No porque pueda ocurrir —quien llama hace el reparto por fila viva ANTES
   * (`criba-de-matches.ts`), así que aquí no llega ningún ausente— sino porque
   * las DOS funciones tienen que usar el mismo predicado. Si `soloGeneracionActiva`
   * descartara al ausente y ésta no lo contara, el fragmento desaparecería sin
   * dejar rastro y el cuadre del termómetro no cerraría. Un descarte mal
   * etiquetado se ve; uno silencioso, no.
   */
  it('⚠️ lo ausente del mapa se cuenta: descartar sin contar sería el fallo', () => {
    expect(generacionesMuertas([f('doc-z', 9)], activas)).toEqual(new Map([['doc-z', 1]]));
  });
});

describe('los vectores anteriores a C.4b no llevan generación', () => {
  /** ⚠️ AUSENTE = generación 1 implícita, igual que en `parseVectorId`. Tratarla
   *  como desconocida sacaría del corpus a documentos por no tener un campo que
   *  nunca tuvieron — y eso es pérdida de candidatos, no higiene. */
  it('sin generación cuenta como la 1', () => {
    const sinGen = { documentId: 'doc-viejo' } as { documentId: string; generation?: number };
    expect(soloGeneracionActiva([sinGen], new Map([['doc-viejo', 1]]))).toEqual([sinGen]);
    expect(soloGeneracionActiva([sinGen], new Map([['doc-viejo', 2]]))).toEqual([]);
  });
});
