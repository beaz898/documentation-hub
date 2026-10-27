import type { Definicion } from '../herramientas/mutar';

// 3.4, el principio (27/10): el CONTENIDO del bloque del juez. Las huellas quitan el bloque entero y no lo ven.
// node claude/herramientas/mutar-cli.mts claude/mutantes/principio-juez.ts
const CLAUSULA_NUEVA = '- Una regla y SU PROPIA razón no son dos reglas: que un texto explique por\n  qué él mismo manda lo que manda NO LA PONE EN CONFLICTO CON SU PROPIA\n  REGLA.';
const CLAUSULA_VIEJA = '- Una regla y la razón por la que existe no son dos reglas: que un texto\n  explique su propio criterio no lo pone en conflicto con nada.';
export const definicion: Definicion = {
  fichero: 'lib/analysis/excepcion-de-las-reglas.ts',
  arnes: 'lib/analysis/excepcion-de-las-reglas.test.ts',
  proyecto: 'suite',
  tests: 5,
  mutantes: [
    { nombre: 'vuelve la cláusula vieja', ancla: CLAUSULA_NUEVA, cambio: CLAUSULA_VIEJA },
    { nombre: 'sin la frase del principio', ancla: '    SI UN TEXTO ENUNCIA UN PRINCIPIO Y EL OTRO PERMITE JUSTO LO QUE ESE\n', cambio: '' },
    { nombre: 'sin el ejemplo del principio solo', ancla: 'EJEMPLO, el mismo taller y el principio SOLO:', cambio: 'EJEMPLO:' },
    { nombre: 'vuelve el párrafo que repetía «suponer un hecho»', ancla: 'excluye. Es "norma_contra_norma".\n\n- SI PARA VER', cambio: 'excluye. Es "norma_contra_norma".\n\nLO QUE SIGUE SIN SER CONFLICTO: si hay que suponer un hecho, NO HAY HALLAZGO.\n\n- SI PARA VER' },
    { nombre: 'el último punto deja de cerrar', ancla: '- SI PARA VER EL CONFLICTO TIENES QUE SUPONER UN HECHO', cambio: '- SI PARA VER EL CONFLICTO TIENES QUE IMAGINAR UN HECHO' },
  ],
};
