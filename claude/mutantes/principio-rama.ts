import type { Definicion } from '../herramientas/mutar';

// 3.4, el principio (27/10): el CONTENIDO de la rama del verificador.
// node claude/herramientas/mutar-cli.mts claude/mutantes/principio-rama.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/rama-de-las-reglas.ts',
  arnes: 'lib/analysis/rama-de-las-reglas.test.ts',
  proyecto: 'suite',
  tests: 10,
  mutantes: [
    { nombre: 'vuelve el «una de las dos no manda nada»', ancla: 'o ninguna de las dos manda nada, describe una práctica\n  NI ENUNCIA UN PRINCIPIO.', cambio: 'o una de las dos no manda nada ni describe ninguna\n  práctica.' },
    { nombre: 'sin la pregunta del principio', ancla: '      ¿PERMITE LA OTRA JUSTO LO QUE ESE PRINCIPIO EXCLUYE?\n', cambio: '' },
    { nombre: 'la razón de otra regla vuelve a quedar fuera', ancla: 'otra regla, y que lo sea NO la deja fuera.', cambio: 'otra regla, y entonces queda fuera.' },
    { nombre: 'sin el principio en «confirmado»', ancla: ' O, si una enuncia un principio: la otra\n  permite justo lo que ese principio excluye.', cambio: '' },
    { nombre: 'sin el principio en «cumplibles»', ancla: ' O, si una\n  enuncia un principio: lo que la otra permite no es lo que ese principio\n  excluye.', cambio: '' },
    { nombre: 'la introducción sigue diciendo tres', ancla: 'que corresponda de estas cuatro:', cambio: 'que corresponda de estas tres:' },
  ],
};
