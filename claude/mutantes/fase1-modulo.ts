import type { Definicion } from '../herramientas/mutar';

// 3.4, fase 1: los mutantes del módulo del criterio. node claude/herramientas/mutar-cli.mts claude/mutantes/fase1-modulo.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/conflicto-normativo.ts',
  arnes: 'lib/analysis/conflicto-normativo.test.ts',
  proyecto: 'suite',
  tests: 6,
  mutantes: [
    { nombre: 'un valor de severity pasa por conflicto normativo', ancla: "['norma_contra_norma', 'norma_contra_practica'] as const", cambio: "['norma_contra_norma', 'norma_contra_practica', 'contradiction'] as const" },
    { nombre: 'sólo uno de los dos subtipos', ancla: "['norma_contra_norma', 'norma_contra_practica'] as const", cambio: "['norma_contra_norma'] as const" },
    { nombre: 'cualquier cadena vale', ancla: "return typeof valor === 'string' && (CONFLICTOS_NORMATIVOS as readonly string[]).includes(valor);", cambio: "return typeof valor === 'string';" },
  ],
};
