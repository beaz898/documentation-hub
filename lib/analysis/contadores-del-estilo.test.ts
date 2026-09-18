import { describe, it, expect } from 'vitest';
import { conContadoresDelEstilo } from './contadores-del-estilo';
import type { PipelineCounters } from './counters';
import type { ResultadoDelEstilo } from './style-check';

/**
 * ⚠️ EL CASO VA DONDE FALLÓ: SOBRE EL OBJETO QUE SE PERSISTE.
 *
 * `style-check` tenía su prueba y estaba verde — emitía las tres claves siempre,
 * también en cero, desde el 15/09. Lo que nadie comprobaba es que llegaran al
 * análisis que `saveAnalysisResult` escribe, y el exhaustivo las tiraba. Así que
 * esta batería no mira al emisor: mira lo que queda en `pipelineCounters`, que
 * es lo que acaba en la columna `pipeline_counters`.
 */

const LAS_TRES = [
  'averia.estilo_descartado_por_tipo',
  'averia.estilo_descartado_sin_ancla',
  'averia.estilo_cita_no_encontrada',
] as const;

/** El estilo miró y no descartó nada: el caso que el fallo hacía invisible. */
const MIRADO_EN_CERO: ResultadoDelEstilo = {
  estado: 'mirado',
  problemas: [],
  contadores: {
    'averia.estilo_descartado_por_tipo': 0,
    'averia.estilo_descartado_sin_ancla': 0,
    'averia.estilo_cita_no_encontrada': 0,
  },
  tiposDescartados: [],
};

const NO_MIRADO: ResultadoDelEstilo = { estado: 'no_se_pudo_mirar', motivo: 'el modelo no contestó' };

/** Lo que el núcleo ya había contado, para comprobar que no se pisa. */
const DEL_NUCLEO: PipelineCounters = { 'seleccion.candidatos_recuperados': 5 };

describe('⚠️ los contadores del estilo llegan al objeto que se persiste', () => {
  it('con el estilo mirado, las tres claves están y valen 0, y lo del núcleo sigue ahí', () => {
    const guardado = conContadoresDelEstilo({ pipelineCounters: { ...DEL_NUCLEO } }, MIRADO_EN_CERO);

    for (const clave of LAS_TRES) {
      expect(clave in (guardado.pipelineCounters ?? {}), `${clave} no llegó al objeto persistido`).toBe(true);
      expect(guardado.pipelineCounters?.[clave]).toBe(0);
    }
    expect(guardado.pipelineCounters?.['seleccion.candidatos_recuperados']).toBe(5);
  });

  it('si el estilo NO se pudo mirar, las tres quedan AUSENTES — no en cero', () => {
    const guardado = conContadoresDelEstilo({ pipelineCounters: { ...DEL_NUCLEO } }, NO_MIRADO);

    for (const clave of LAS_TRES) {
      expect(clave in (guardado.pipelineCounters ?? {}), `${clave} presente: diría que la etapa corrió`).toBe(false);
    }
    expect(guardado.pipelineCounters?.['seleccion.candidatos_recuperados']).toBe(5);
  });

  it('y no fabrica un `{}` donde no había contadores: ausencia y «conté y salió vacío» no son lo mismo', () => {
    const sinContadores: { pipelineCounters?: PipelineCounters } = {};
    const guardado = conContadoresDelEstilo(sinContadores, NO_MIRADO);
    expect('pipelineCounters' in guardado).toBe(false);
  });
});
