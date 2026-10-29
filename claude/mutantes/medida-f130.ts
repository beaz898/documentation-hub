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
    { nombre: 'el criterio vacío no se rechaza', ancla: "  if (criterioDelCumplimiento.trim() === '') return { ok: false, motivo: 'el criterio del cumplimiento está vacío' };\n", cambio: '' },
    { nombre: 'sin «CONTESTAR A UNA NO TE EXIME…»', ancla: "  'CONTESTAR A UNA NO TE EXIME DE CONTESTAR A LA OTRA, ni cuando tu respuesta señale un hallazgo ni cuando no lo señale.',\n", cambio: '' },
    { nombre: 'el «no te exime» sin su «ni cuando… ni cuando…»', ancla: ', ni cuando tu respuesta señale un hallazgo ni cuando no lo señale.', cambio: '.' },
    { nombre: 'la pregunta 1 sin decir qué respuesta es el hallazgo', ancla: 'HAY HALLAZGO SI LA RESPUESTA ES «SÍ». ', cambio: '' },
    { nombre: 'la pregunta 2 sin decir qué respuesta es el hallazgo', ancla: 'HAY HALLAZGO SI LA RESPUESTA ES «NO»: si NO se pueden cumplir las dos a la vez. ', cambio: '' },
    { nombre: 'la pregunta 2 sin pedir la cita', ancla: 'Si es «no», cita la frase literal de cada lado y di', cambio: 'Si es «no», di' },
    { nombre: 'la pregunta 2 sin pedir la etiqueta', ancla: ' y di cuál de las dos etiquetas es, "norma_contra_norma" o "norma_contra_practica".', cambio: '.' },
    { nombre: 'sin la línea del mismo par de frases', ancla: "  'LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE FRASES.", cambio: "  'LAS DOS RESPUESTAS PUEDEN CITAR LO QUE QUIERAN." },
    { nombre: 'la pregunta 2 con la polaridad invertida', ancla: 'HAY HALLAZGO SI LA RESPUESTA ES «NO»: si NO se pueden', cambio: 'HAY HALLAZGO SI LA RESPUESTA ES «SÍ»: si se pueden' },
    { nombre: 'las marcas se sustituyen una tras otra (una marca dentro del texto del cliente se sustituiría)', ancla: 'PREGUNTA_CERRADA.replace(/\\{\\{[A-Z_0-9]+\\}\\}/g, m => valores[m] ?? m)', cambio: 'Object.entries(valores).reduce((t, [k, v]) => t.split(k).join(v), PREGUNTA_CERRADA)' },
    { nombre: 'la repetición con la pareja de §3.5 y no la de §3.1', ancla: "  { analizado: 'nor10_4', candidato: 'cli12_3' },\n", cambio: "  { analizado: 'nor10_4', candidato: 'cli12_6' },\n" },
    { nombre: 'la línea del mismo par vuelve a leerse como «mismo asunto»', ancla: ' Esto se refiere A LAS FRASES, NO AL ASUNTO: que las dos preguntas traten del mismo asunto es NORMAL y no quita el hallazgo.', cambio: '' },
    { nombre: 'sin «si puedes apoyarlo en otro par de frases, HAY HALLAZGO»', ancla: ' Si puedes apoyar el cumplimiento en OTRO par de frases, aunque vaya del mismo asunto, HAY HALLAZGO y lo citas.', cambio: '' },
    { nombre: 'el texto 1 sin su documento delante', ancla: "  'TEXTO 1 · {{DOC_1}}, trozo {{TROZO_A}}:',\n", cambio: '' },
    { nombre: 'el texto 2 sin su documento delante', ancla: "  'TEXTO 2 · {{DOC_2}}, trozo {{TROZO_B}}:',\n", cambio: '' },
    { nombre: 'seis veces y no siete', ancla: 'export const VECES_DE_E3 = 7;', cambio: 'export const VECES_DE_E3 = 6;' },
    { nombre: 'las figuras sin quitar encabezados', ancla: "const cuerpo = texto.split('\\n').filter(l => !l.startsWith('#')).join('\\n');", cambio: 'const cuerpo = texto;' },
    { nombre: 'el coseno con un vector nulo da un número', ancla: 'return aa === 0 || bb === 0 ? null : ab / Math.sqrt(aa * bb);', cambio: 'return ab / Math.sqrt(aa * bb || 1);' },
    { nombre: 'la correspondencia no dice dónde se separan', ancla: "return { estado: 'distinto', separaEn: i,", cambio: "return { estado: 'distinto', separaEn: 0," },
    { nombre: 'los puestos desde 0', ancla: 'return [o, i === -1 ? null : i + 1];', cambio: 'return [o, i === -1 ? null : i];' },
  ],
};
