import type { Definicion } from '../herramientas/mutar';

// 28/10: el juez guarda en su lectura los parámetros que le llegan, sin calcularlos él.
// node claude/herramientas/mutar-cli.mts claude/mutantes/parametros-juez.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/judge.ts',
  arnes: 'lib/analysis/modelo-del-juez.test.ts',
  proyecto: 'suite',
  tests: 3,
  mutantes: [
    { nombre: 'la lectura no guarda los parámetros', ancla: ' lectura.parametros = uso.parametros; },', cambio: ' },' },
  ],
};
