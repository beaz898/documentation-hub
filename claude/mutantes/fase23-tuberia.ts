import type { Definicion } from '../herramientas/mutar';

// 3.4, fase 3: los dos sitios de la tubería que pasan la marca al verificador.
// node claude/herramientas/mutar-cli.mts claude/mutantes/fase23-tuberia.ts
const LINEA = '// 3.4, fase 3: la marca del juez llega al verificador; sin ella, el objeto es el de antes';
const CAMPO = '...(c.conflictoNormativo ? { conflictoNormativo: c.conflictoNormativo } : {}),';
export const definicion: Definicion = {
  fichero: 'lib/analysis/pipeline.ts',
  arnes: 'lib/analysis/rama-de-las-reglas.test.ts',
  proyecto: 'suite',
  tests: 9,
  mutantes: [
    { nombre: 'el primer sitio no pasa la marca', ancla: "'existing'),\n          " + LINEA + '\n          ' + CAMPO + '\n', cambio: "'existing'),\n" },
    { nombre: 'el segundo sitio no pasa la marca', ancla: "'existing'),\n        " + LINEA + '\n        ' + CAMPO + '\n', cambio: "'existing'),\n" },
  ],
};
