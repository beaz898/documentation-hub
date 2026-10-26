import type { Definicion } from '../herramientas/mutar';

// 3.4, fase 2: el bloque en el prompt del juez. node claude/herramientas/mutar-cli.mts claude/mutantes/fase2-juez.ts
const ORO = 'REGLA DE ORO: Si puedes imaginar un contexto razonable en el que ambas afirmaciones sean verdaderas simultáneamente, NO es contradicción. Puede ser inconsistencia menor.';
export const definicion: Definicion = {
  fichero: 'lib/analysis/judge.ts',
  arnes: 'lib/analysis/excepcion-de-las-reglas.test.ts',
  proyecto: 'suite',
  tests: 4,
  mutantes: [
    { nombre: 'el bloque no entra en el prompt', ancla: ORO + '\n\n${EXCEPCION_DE_LAS_REGLAS}\n\nREGLAS DE FORMATO:', cambio: ORO + '\n\nREGLAS DE FORMATO:' },
    { nombre: 'el bloque va ANTES de la regla de oro', ancla: ORO + '\n\n${EXCEPCION_DE_LAS_REGLAS}\n\nREGLAS DE FORMATO:', cambio: '${EXCEPCION_DE_LAS_REGLAS}\n\n' + ORO + '\n\nREGLAS DE FORMATO:' },
  ],
};
