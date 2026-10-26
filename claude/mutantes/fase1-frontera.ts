import type { Definicion } from '../herramientas/mutar';

// 3.4: los mutantes de la frontera (fase 1, y el contador de vacío de las fases 2+3).
// node claude/herramientas/mutar-cli.mts claude/mutantes/fase1-frontera.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/llm-boundary.ts',
  arnes: 'lib/analysis/conflicto-normativo.test.ts',
  proyecto: 'suite',
  tests: 7,
  mutantes: [
    { nombre: 'el valor desconocido no se cuenta', ancla: "    else if (conflictoRaw !== undefined && !conflictoValido) bump('conflicto_normativo_desconocido');\n", cambio: '' },
    { nombre: 'el vacío no se cuenta como vacío', ancla: "if (conflictoVacio) bump('conflicto_normativo_vacio');", cambio: "if (false) bump('conflicto_normativo_vacio');" },
    { nombre: 'una cadena de espacios no cuenta como vacía', ancla: "conflictoRaw.trim() === ''", cambio: "conflictoRaw === ''" },
    { nombre: 'se cuenta también la ausencia', ancla: 'else if (conflictoRaw !== undefined && !conflictoValido)', cambio: 'else if (!conflictoValido)' },
    { nombre: 'se copia cualquier valor', ancla: '...(conflictoValido ? { conflictoNormativo: conflictoRaw } : {}),', cambio: '...(conflictoRaw ? { conflictoNormativo: conflictoRaw as never } : {}),' },
    { nombre: 'no se copia nunca', ancla: '...(conflictoValido ? { conflictoNormativo: conflictoRaw } : {}),', cambio: '...({}),' },
  ],
};
