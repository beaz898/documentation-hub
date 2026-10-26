import type { Definicion } from '../herramientas/mutar';

// 3.4: el texto de la rama, corregido el 26/10. node claude/herramientas/mutar-cli.mts claude/mutantes/fase23-rama.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/rama-de-las-reglas.ts',
  arnes: 'lib/analysis/rama-de-las-reglas.test.ts',
  proyecto: 'suite',
  tests: 9,
  mutantes: [
    { nombre: 'sin la pregunta de la práctica', ancla: '¿LO QUE SE HACE CUMPLE LA REGLA?', cambio: '¿QUÉ SE HACE?' },
    { nombre: 'vuelve el «no son reglas» que descartaba la práctica', ancla: '- "sin_relacion": no se refieren al mismo procedimiento', cambio: '- "sin_relacion": no son reglas, o no se refieren al mismo procedimiento' },
    { nombre: 'la marca sin su paréntesis', ancla: 'return `MARCADO COMO CONFLICTO NORMATIVO (${especie})`;', cambio: 'return `MARCADO COMO CONFLICTO NORMATIVO ${especie}`;' },
  ],
};
