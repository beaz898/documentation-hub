import type { Definicion } from './mutar';

// La herramienta, mutada con ella misma: cada mutante quita una de las cosas que mutar.ts promete, y su prueba
// (mutar.test.ts, en la suite) tiene que ponerse roja. Se lanza con:
// node claude/herramientas/mutar-cli.mts claude/herramientas/mutantes-de-mutar.ts
export const definicion: Definicion = {
  fichero: 'claude/herramientas/mutar.ts',
  arnes: 'claude/herramientas/mutar.test.ts',
  proyecto: 'suite',
  tests: 7,
  mutantes: [
    { nombre: 'acepta un ancla repetida', ancla: 'if (k !== 1) problemas.push', cambio: 'if (k < 1) problemas.push' },
    { nombre: 'acepta un cambio que contiene al ancla', ancla: 'if (ancla.length > 0 && cambio.includes(ancla))', cambio: 'if (false)' },
    { nombre: 'no adapta los saltos de línea', ancla: "original.includes('\\r\\n') ? texto.split", cambio: "false ? texto.split" },
    { nombre: 'cuenta un rojo sin todos los tests cargados', ancla: 'const rojo = /\\bfailed\\b/.test(linea) && cargados &&', cambio: 'const rojo = /\\bfailed\\b/.test(linea) &&' },
    { nombre: 'cuenta un rojo con tests saltados', ancla: ' && !/\\bskipped\\b/.test(linea);', cambio: ';' },
    { nombre: 'no restaura si el arnés revienta', ancla: '  } finally {\n    d.escribir(def.fichero, original);\n  }', cambio: '  } finally {\n    /* sin restaurar */\n  }' },
    { nombre: 'acepta una definición vacía', ancla: "if (mutantes.length === 0) problemas.push('la definición no tiene ningún mutante');", cambio: '' },
  ],
};
