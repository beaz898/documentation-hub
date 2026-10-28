import type { Definicion } from '../herramientas/mutar';

// Las herramientas temporales de F-130 (29/10). Se borra con app/api/admin/medida-f130/.
// node claude/herramientas/mutar-cli.mts claude/mutantes/medida-f130.ts
export const definicion: Definicion = {
  fichero: 'app/api/admin/medida-f130/medida-f130.ts',
  arnes: 'app/api/admin/medida-f130/medida-f130.test.ts',
  proyecto: 'suite',
  tests: 8,
  mutantes: [
    { nombre: 'no caduca nunca', ancla: 'return ahora.getTime() >= new Date(CADUCA_EL).getTime();', cambio: 'return false;' },
    { nombre: 'caduca un instante tarde', ancla: 'return ahora.getTime() >= new Date(CADUCA_EL).getTime();', cambio: 'return ahora.getTime() > new Date(CADUCA_EL).getTime();' },
    { nombre: 'una pregunta inventada en vez de vacía', ancla: "export const PREGUNTA_CERRADA = '';", cambio: "export const PREGUNTA_CERRADA = '{{TEXTO_1}} {{TEXTO_2}}';" },
    { nombre: 'la pregunta vacía no se rechaza', ancla: "  if (pregunta.trim() === '') return { ok: false, motivo: 'la pregunta cerrada está vacía: pendiente del arquitecto' };\n", cambio: '' },
    { nombre: 'una marca repetida pasa', ancla: 'if (n !== 1) return', cambio: 'if (n < 1) return' },
    { nombre: 'el texto entra como patrón de reemplazo', ancla: "pregunta.replace('{{TEXTO_1}}', () => texto1)", cambio: "pregunta.replace('{{TEXTO_1}}', texto1)" },
    { nombre: 'E3 con la condición limpia (el trozo 6, sin A)', ancla: "{ analizado: 'nor10_4', candidato: 'cli12_3' }", cambio: "{ analizado: 'nor10_4', candidato: 'cli12_6' }" },
    { nombre: 'seis veces y no siete', ancla: 'export const VECES_DE_E3 = 7;', cambio: 'export const VECES_DE_E3 = 6;' },
    { nombre: 'las figuras sin quitar encabezados', ancla: "const cuerpo = texto.split('\\n').filter(l => !l.startsWith('#')).join('\\n');", cambio: 'const cuerpo = texto;' },
    { nombre: 'el coseno con un vector nulo da un número', ancla: 'return aa === 0 || bb === 0 ? null : ab / Math.sqrt(aa * bb);', cambio: 'return ab / Math.sqrt(aa * bb || 1);' },
    { nombre: 'la correspondencia no dice dónde se separan', ancla: "return { estado: 'distinto', separaEn: i,", cambio: "return { estado: 'distinto', separaEn: 0," },
    { nombre: 'los puestos desde 0', ancla: 'return [o, i === -1 ? null : i + 1];', cambio: 'return [o, i === -1 ? null : i];' },
  ],
};
