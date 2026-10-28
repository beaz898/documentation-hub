import type { Definicion } from '../herramientas/mutar';

// El recorte del criterio del cumplimiento para E3 (29/10). Se borra con app/api/admin/medida-f130/.
// node claude/herramientas/mutar-cli.mts claude/mutantes/criterio-del-cumplimiento.ts
export const definicion: Definicion = {
  fichero: 'app/api/admin/medida-f130/criterio-del-cumplimiento.ts',
  arnes: 'app/api/admin/medida-f130/criterio-del-cumplimiento.test.ts',
  proyecto: 'suite',
  tests: 3,
  mutantes: [
    { nombre: 'se queda el arranque y «Todo lo anterior…»', ancla: "  'EXCEPCIÓN, SÓLO CUANDO LOS DOS TEXTOS SON REGLAS:\\n\\n' +\n  'Todo lo anterior vale para DATOS: cifras, plazos, nombres, precios,\\n' +\n  'frecuencias. Un dato tiene un valor, y hay contradicción cuando los dos\\n' +\n  'textos le dan valores distintos.\\n\\n',\n", cambio: '' },
    { nombre: 'se queda la frase del campo', ancla: "  'Ese hallazgo lleva el campo \"conflictoNormativo\", con uno de estos dos\\n' +\n  'valores:\\n\\n',\n", cambio: '' },
    { nombre: 'se queda el ORDEN OBLIGATORIO', ancla: "  'ORDEN OBLIGATORIO: primero aplicas todo lo de arriba. Si los dos textos\\n' +", cambio: "  'ORDEN OBLIGATORIO QUE NO CASA\\n' +" },
    { nombre: 'se queda el JSON del final', ancla: "  '\\n\\nCUANDO EMITAS UN HALLAZGO DE ESTE TIPO, el elemento del JSON lleva el\\n' +", cambio: "  '\\n\\nCUANDO EMITAS (NO CASA)\\n' +" },
    { nombre: 'el título sigue diciendo «CONTRADICCIÓN NORMAL»', ancla: "   'CÓMO SE DISTINGUE DE UN HALLAZGO DE LA PREGUNTA 1: mira SOBRE QUÉ manda cada'],", cambio: "   'CÓMO SE DISTINGUE DE UNA CONTRADICCIÓN NORMAL: mira SOBRE QUÉ manda cada'],"},
    { nombre: 'el teletrabajo sigue sin destino', ancla: "   '  prohíbe, es un hallazgo de la PREGUNTA 1, no de la 2. Es el caso de'],", cambio: "   '  prohíbe, es una CONTRADICCIÓN NORMAL y NO lleva el campo. Es el caso de'],"},
    { nombre: 'el semanal frente al mensual sigue sin destino', ancla: "   '  eso SÍ es un dato con dos valores. Es un hallazgo de la PREGUNTA 1, no de\\n  la 2.'],", cambio: "   '  eso SÍ es un dato con dos valores. Es contradicción normal y NO lleva el\\n  campo.'],"},
    { nombre: 'un corte que casa dos veces se acepta', ancla: "    if (n !== 1) return { ok: false, motivo: `un corte casa", cambio: "    if (n < 1) return { ok: false, motivo: `un corte casa" },
    { nombre: 'una sustitución que casa dos veces se acepta', ancla: "    if (n !== 1) return { ok: false, motivo: `una sustitución casa", cambio: "    if (n < 1) return { ok: false, motivo: `una sustitución casa" },
  ],
};
