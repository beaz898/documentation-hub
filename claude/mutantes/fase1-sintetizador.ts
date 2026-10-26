import type { Definicion } from '../herramientas/mutar';

// 3.4, fase 1: los mutantes del sintetizador. node claude/herramientas/mutar-cli.mts claude/mutantes/fase1-sintetizador.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/synthesize.ts',
  arnes: 'lib/analysis/conflicto-normativo.test.ts',
  proyecto: 'suite',
  tests: 6,
  mutantes: [
    { nombre: 'asignación directa: toda discrepancia gana la clave con undefined', ancla: '...(c.conflictoNormativo ? { conflictoNormativo: c.conflictoNormativo } : {}),', cambio: 'conflictoNormativo: c.conflictoNormativo,' },
    { nombre: 'el sintetizador lo tira', ancla: '      ...(c.conflictoNormativo ? { conflictoNormativo: c.conflictoNormativo } : {}),\n', cambio: '' },
  ],
};
