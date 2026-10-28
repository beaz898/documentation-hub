import type { Definicion } from '../herramientas/mutar';

// 28/10: cada entrada del registro por llamada copia los parámetros. node claude/herramientas/mutar-cli.mts claude/mutantes/parametros-registro.ts
export const definicion: Definicion = {
  fichero: 'lib/observability/registro-de-llamadas.ts',
  arnes: 'lib/llm/parametros-enviados.test.ts',
  proyecto: 'suite',
  tests: 3,
  mutantes: [
    { nombre: 'la entrada no copia los parámetros', ancla: '    ...(datos.parametros ? { parametros: { ...datos.parametros } } : {}),\n', cambio: '' },
  ],
};
