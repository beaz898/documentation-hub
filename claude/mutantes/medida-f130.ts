import type { Definicion } from '../herramientas/mutar';

// Las herramientas temporales de F-130 (28/10). Se borra con app/api/admin/medida-f130/.
// node claude/herramientas/mutar-cli.mts claude/mutantes/medida-f130.ts
export const definicion: Definicion = {
  fichero: 'app/api/admin/medida-f130/medida-f130.ts',
  arnes: 'app/api/admin/medida-f130/medida-f130.test.ts',
  proyecto: 'suite',
  tests: 9,
  mutantes: [
    { nombre: 'no caduca nunca', ancla: 'return ahora.getTime() >= new Date(CADUCA_EL).getTime();', cambio: 'return false;' },
    { nombre: 'caduca un instante tarde', ancla: 'return ahora.getTime() >= new Date(CADUCA_EL).getTime();', cambio: 'return ahora.getTime() > new Date(CADUCA_EL).getTime();' },
    { nombre: 'un tercer criterio inventado en vez de vacío', ancla: "export const CRITERIO_TRES = '';", cambio: "export const CRITERIO_TRES = '¿Se contradicen?';" },
    { nombre: 'el criterio vacío no se rechaza', ancla: "  if (criterioTres.trim() === '') return { ok: false, motivo: 'el tercer criterio está vacío: pendiente de moverlo literal desde excepcion-de-las-reglas.ts' };\n", cambio: '' },
    { nombre: 'sin las frases que obligan a contestar las tres', ancla: ' CONTESTAR «SÍ» A UNA NO TE EXIME DE CONTESTAR A LAS OTRAS DOS. CONTESTAR «NO» A UNA NO TE EXIME DE CONTESTAR A LAS OTRAS DOS.', cambio: '' },
    { nombre: 'sin la pregunta del cumplimiento', ancla: "  '¿Se pueden CUMPLIR LAS DOS A LA VEZ?',\n", cambio: '' },
    { nombre: 'las marcas se sustituyen una tras otra (una marca dentro del texto del cliente se sustituiría)', ancla: 'PREGUNTA_CERRADA.replace(/\\{\\{[A-Z_0-9]+\\}\\}/g, m => valores[m] ?? m)', cambio: 'Object.entries(valores).reduce((t, [k, v]) => t.split(k).join(v), PREGUNTA_CERRADA)' },
    { nombre: 'una sola pareja', ancla: "  { analizado: 'nor10_4', candidato: 'cli12_6' },\n", cambio: '' },
    { nombre: 'la primera pareja sin A (el trozo 6 dos veces)', ancla: "  { analizado: 'nor10_4', candidato: 'cli12_3' },\n", cambio: "  { analizado: 'nor10_4', candidato: 'cli12_6' },\n" },
    { nombre: 'seis veces y no siete', ancla: 'export const VECES_DE_E3 = 7;', cambio: 'export const VECES_DE_E3 = 6;' },
    { nombre: 'las figuras sin quitar encabezados', ancla: "const cuerpo = texto.split('\\n').filter(l => !l.startsWith('#')).join('\\n');", cambio: 'const cuerpo = texto;' },
    { nombre: 'el coseno con un vector nulo da un número', ancla: 'return aa === 0 || bb === 0 ? null : ab / Math.sqrt(aa * bb);', cambio: 'return ab / Math.sqrt(aa * bb || 1);' },
    { nombre: 'la correspondencia no dice dónde se separan', ancla: "return { estado: 'distinto', separaEn: i,", cambio: "return { estado: 'distinto', separaEn: 0," },
    { nombre: 'los puestos desde 0', ancla: 'return [o, i === -1 ? null : i + 1];', cambio: 'return [o, i === -1 ? null : i];' },
  ],
};
