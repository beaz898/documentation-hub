import type { Definicion } from '../herramientas/mutar';

// 3.4, fase 1: los mutantes de la frontera. node claude/herramientas/mutar-cli.mts claude/mutantes/fase1-frontera.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/llm-boundary.ts',
  arnes: 'lib/analysis/conflicto-normativo.test.ts',
  proyecto: 'suite',
  tests: 6,
  mutantes: [
    { nombre: 'el valor desconocido no se cuenta', ancla: "    if (conflictoRaw !== undefined && conflictoRaw !== null && !conflictoValido) bump('conflicto_normativo_desconocido');\n", cambio: '' },
    { nombre: 'se cuenta también la ausencia', ancla: 'if (conflictoRaw !== undefined && conflictoRaw !== null && !conflictoValido)', cambio: 'if (!conflictoValido)' },
    { nombre: 'se copia cualquier valor', ancla: '...(conflictoValido ? { conflictoNormativo: conflictoRaw } : {}),', cambio: '...(conflictoRaw ? { conflictoNormativo: conflictoRaw as never } : {}),' },
    { nombre: 'no se copia nunca', ancla: '...(conflictoValido ? { conflictoNormativo: conflictoRaw } : {}),', cambio: '...({}),' },
  ],
};
