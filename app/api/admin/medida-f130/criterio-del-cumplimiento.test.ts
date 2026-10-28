import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { EXCEPCION_DE_LAS_REGLAS } from '@/lib/analysis/excepcion-de-las-reglas';
import { CRITERIO_DEL_CUMPLIMIENTO, recortarElCriterio } from './criterio-del-cumplimiento';

/**
 * EL RECORTE DEL CRITERIO DEL CUMPLIMIENTO (29/10/2026). Temporal: se borra con la carpeta.
 *   · el resultado de hoy, fijado por su huella: lo aprobó el arquitecto mirándolo, y si el bloque del juez cambia, esto
 *     se pone en rojo en vez de cambiar E3 en silencio;
 *   · lo que se quita no está, lo que se queda está literal, y las remisiones al formato viejo apuntan a la pregunta 1;
 *   · un corte que no casa, o que casa dos veces, no arma nada.
 */
const huella = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 16);

describe('el criterio del cumplimiento, recortado del bloque del juez', () => {
  it('EL DE HOY, por su huella: 5.395 caracteres', () => {
    expect(CRITERIO_DEL_CUMPLIMIENTO.ok).toBe(true);
    if (!CRITERIO_DEL_CUMPLIMIENTO.ok) return;
    expect(CRITERIO_DEL_CUMPLIMIENTO.texto.length).toBe(5395);
    expect(huella(CRITERIO_DEL_CUMPLIMIENTO.texto)).toBe('a29a3e97e1504b6c');
  });

  it('LO QUE SE QUITA no está; LO QUE SE QUEDA está; y el formato viejo ya no se nombra', () => {
    if (!CRITERIO_DEL_CUMPLIMIENTO.ok) throw new Error('sin recorte');
    const t = CRITERIO_DEL_CUMPLIMIENTO.texto;
    for (const fuera of ['EXCEPCIÓN, SÓLO CUANDO', 'Todo lo anterior vale para DATOS', 'Ese hallazgo lleva el campo', 'ORDEN OBLIGATORIO', 'CUANDO EMITAS', '"severity"', 'NO lleva el campo', 'contradicción normal', 'CONTRADICCIÓN NORMAL']) {
      expect(t).not.toContain(fuera);
    }
    for (const dentro of [
      '    ¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?',
      'Y ten cuidado con un atajo que la haría inútil.',
      '    SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?',
      '- "norma_contra_norma": las dos son reglas, y no se pueden cumplir las dos.',
      '- "norma_contra_practica": una es una regla y la otra describe lo que se',
      'EJEMPLO DE "norma_contra_practica":',
      '    SI UN TEXTO ENUNCIA UN PRINCIPIO Y EL OTRO PERMITE JUSTO LO QUE ESE',
      'EJEMPLO, el mismo taller y el principio SOLO:',
      'Y ESTO VALE PARA CUALQUIERA DE LOS CASOS DE ARRIBA:',
      'CÓMO SE DISTINGUE DE UN HALLAZGO DE LA PREGUNTA 1: mira SOBRE QUÉ manda cada',
      '  prohíbe, es un hallazgo de la PREGUNTA 1, no de la 2. Es el caso de',
      '  eso SÍ es un dato con dos valores. Es un hallazgo de la PREGUNTA 1, no de\n  la 2.',
    ]) {
      expect(t).toContain(dentro);
    }
    expect(t.endsWith('NO\n  HAY HALLAZGO.')).toBe(true);
  });

  it('UN CORTE O UNA SUSTITUCIÓN QUE NO CASA, o QUE CASA DOS VECES, no arma nada', () => {
    expect(recortarElCriterio('otro texto').ok).toBe(false);
    // sólo UN corte repetido, con todo lo demás casando una vez
    expect(recortarElCriterio(EXCEPCION_DE_LAS_REGLAS + '\n\nEse hallazgo lleva el campo "conflictoNormativo", con uno de estos dos\nvalores:\n\n').ok).toBe(false);
    // sólo UNA sustitución repetida
    expect(recortarElCriterio(EXCEPCION_DE_LAS_REGLAS + '\n\nCÓMO SE DISTINGUE DE UNA CONTRADICCIÓN NORMAL: mira SOBRE QUÉ manda cada').ok).toBe(false);
  });
});
