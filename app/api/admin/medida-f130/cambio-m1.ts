import { callLLM, callLLMJson } from '@/lib/analysis/llm-client';
import { INSTRUCCION_DE_SALIDA_DEL_JUEZ, huellaDelPrompt, type JudgeResponse, type ObtenerRespuestaDelJuez } from '@/lib/analysis/judge';
import { EXCEPCION_DE_LAS_REGLAS } from '@/lib/analysis/excepcion-de-las-reglas';

/**
 * LA RUTA m1: EL BORRADOR EN PROSA Y LUEGO LA CASILLA (arquitecto, 11/11/2026). UN CAMBIO CANDIDATO DECLARADO, no un diagnóstico
 * (convención de la carpeta, cabecera de `medida-f130.ts`). TEMPORAL como toda la carpeta. Sobre los documentos enteros, en dos
 * llamadas, por la costura del juez (`ObtenerRespuestaDelJuez`, lib/analysis/judge.ts): la frontera, la puerta de citas y la
 * lectura son las del producto, sin copiarlas, y se cuenta en el mismo sitio que d4 (después de la puerta, antes del verificador).
 *   · LLAMADA 1: EL PROMPT DEL PRODUCTO CON SUPRESIONES (`SUPRESIONES`), no un texto nuevo: cada supresión borra un trozo LITERAL
 *     de las instrucciones (nunca de los documentos), y el bloque final (`INSTRUCCION_DE_SALIDA_DEL_JUEZ`) se sustituye por
 *     `INSTRUCCION_DE_PROSA`, que es el ÚNICO texto añadido. Se llama con `callLLM`, en texto, así que tampoco va el sufijo de JSON
 *     que añade `callLLMJson`. FUERA: los nombres de los campos, los nombres de las categorías, los topes (10/5/10/10), el ejemplo
 *     JSON y el sufijo. DENTRO, tal cual: la REGLA PRINCIPAL, el RAZONAMIENTO de `EXCEPCION_DE_LAS_REGLAS` (es lo que autoriza a D;
 *     sólo se van su nombre de campo, sus nombres de valor y su ejemplo JSON) y la exigencia de citas literales (el detector es la
 *     puerta de citas). Corte completo, no «sólo la instrucción de salida»: arquitecto, 11/11.
 *   · LLAMADA 2: la prosa de la llamada 1 y el esquema JSON del producto (`promptDeExtraccion`). Extraer, no volver a juzgar.
 * Las dos con el modelo y las opciones del juez del producto, etiqueta incluida, que la costura le pasa.
 * ⚠️ LO QUE NO CUBRE: `INSTRUCCION_DE_PROSA` y `promptDeExtraccion` son NUESTROS, no de Fable. Si m1 sale plano, esta versión de M1
 * no sirve; no que M1 no sirva.
 */

/** Lo que sustituye al bloque final del producto en la llamada 1. Texto nuestro, el único añadido. */
export const INSTRUCCION_DE_PROSA = `Responde en PROSA, sin listas, sin JSON y sin ningún esquema. Escribe un párrafo por cada hallazgo —cada contradicción, inconsistencia menor, solapamiento o contenido exclusivo del documento nuevo—, diciendo de qué tipo es y con sus citas copiadas literalmente entre comillas, como piden las reglas de formato. Termina con un párrafo que diga cuánto del documento nuevo ya está en el existente y cuál es tu veredicto. Si no hay ningún hallazgo, dilo.`;

/** Dónde empiezan las instrucciones: después de los dos documentos. Las supresiones sólo se buscan de aquí en adelante. */
export const INICIO_DE_LAS_INSTRUCCIONES = '\n\nREGLA PRINCIPAL, POR ENCIMA DE TODAS LAS DEMAS:\n';

/** Las supresiones, en orden. Cada texto tiene que salir UNA vez en las instrucciones del producto en ese momento. */
export const SUPRESIONES: ReadonlyArray<{ nombre: string; texto: string }> = [
  { nombre: 'instrucción 4: el nombre de la lista de exclusivos', texto: ' (la lista uniqueToNewDoc)' },
  { nombre: 'instrucción 4: el nombre de la lista de contradicciones', texto: ' y va en contradictions' },
  { nombre: 'instrucción 6: el veredicto y el porcentaje', texto: ', veredicto = "tema_similar", overlapPercent < 20' },
  { nombre: 'instrucción 7: el veredicto y el porcentaje', texto: 'veredicto = "sin_relacion", overlapPercent = 0, y ' },
  { nombre: 'instrucción 8 entera: la categoría duplicado_exacto', texto: '8. Solo marca "duplicado_exacto" si el contenido es prácticamente idéntico (>85% del nuevo ya está en el existente).\n' },
  { nombre: 'reglas de formato: los campos del lado nuevo', texto: 'En newDocSays y evidenceInNewDoc: ' },
  { nombre: 'reglas de formato: los campos del lado existente', texto: 'En existingDocSays y evidenceInExistingDoc: ' },
  { nombre: 'reglas de formato: el campo description', texto: 'En description: ' },
  { nombre: 'reglas de formato: los topes', texto: '- Máximo 10 contradicciones, 5 inconsistencias menores, 10 solapamientos y 10 exclusivos del nuevo.\n' },
  { nombre: 'reglas de formato: el campo severity y sus dos valores', texto: '- El campo "severity" es obligatorio en cada contradicción: "contradiction" si son incompatibles, "minor_inconsistency" si son diferencias de enfoque o matiz.\n' },
  { nombre: 'excepción: el campo conflictoNormativo', texto: 'Ese hallazgo lleva el campo "conflictoNormativo", con uno de estos dos\nvalores:\n\n' },
  { nombre: 'excepción: el nombre del valor norma_contra_norma, en la lista', texto: '"norma_contra_norma": ' },
  { nombre: 'excepción: el nombre del valor norma_contra_practica, en la lista', texto: '"norma_contra_practica": ' },
  { nombre: 'excepción, orden obligatorio: «no lleva el campo»', texto: ' y NO\nlleva el campo' },
  { nombre: 'excepción, cómo se distingue: «no lleva el campo»', texto: ' y NO lleva el campo' },
  { nombre: 'excepción, lo que no es conflicto: «no lleva el campo»', texto: ' y NO lleva el\n  campo' },
  { nombre: 'excepción: el nombre del valor en el primer ejemplo', texto: ' DE "norma_contra_norma"' },
  { nombre: 'excepción: el nombre del valor en el segundo ejemplo', texto: ' DE "norma_contra_practica"' },
  { nombre: 'excepción: el nombre del valor al final del ejemplo del principio', texto: ' Es "norma_contra_norma".' },
  { nombre: 'excepción: el ejemplo JSON', texto: '\n\nCUANDO EMITAS UN HALLAZGO DE ESTE TIPO, el elemento del JSON lleva el\ncampo así:\n{ "topic": "…", "newDocSays": "…", "existingDocSays": "…",\n  "severity": "contradiction", "conflictoNormativo": "norma_contra_norma" }' },
];

export interface PromptDeProsa {
  ok: true; prompt: string; huella: string;
  /** El registro de la dosis: qué se quitó, con sus caracteres, y qué se sustituyó. */
  supresiones: Array<{ nombre: string; caracteres: number }>;
  caracteresSuprimidos: number;
  sustitucion: { quitado: number; puesto: number };
}

/** La llamada 1. Se niega si las instrucciones no empiezan una vez, si una supresión no sale exactamente una vez, o si el bloque
 *  final no está una vez y al final. */
export function promptDeProsa(promptDelProducto: string): PromptDeProsa | { ok: false; motivo: string } {
  const i = promptDelProducto.indexOf(INICIO_DE_LAS_INSTRUCCIONES);
  if (i === -1 || promptDelProducto.indexOf(INICIO_DE_LAS_INSTRUCCIONES, i + 1) !== -1) return { ok: false, motivo: 'el principio de las instrucciones (la REGLA PRINCIPAL) no sale exactamente una vez en el prompt del producto' };
  const documentos = promptDelProducto.slice(0, i);
  let instrucciones = promptDelProducto.slice(i);
  if (!instrucciones.endsWith(INSTRUCCION_DE_SALIDA_DEL_JUEZ) || instrucciones.split(INSTRUCCION_DE_SALIDA_DEL_JUEZ).length !== 2) {
    return { ok: false, motivo: 'el bloque final de la instrucción de salida no está una vez y al final del prompt del producto' };
  }
  instrucciones = instrucciones.slice(0, -INSTRUCCION_DE_SALIDA_DEL_JUEZ.length);
  const supresiones: PromptDeProsa['supresiones'] = [];
  for (const s of SUPRESIONES) {
    const veces = instrucciones.split(s.texto).length - 1;
    if (veces !== 1) return { ok: false, motivo: `la supresión «${s.nombre}» sale ${veces} veces en las instrucciones del producto, y tiene que salir una` };
    instrucciones = instrucciones.replace(s.texto, () => '');
    supresiones.push({ nombre: s.nombre, caracteres: s.texto.length });
  }
  const prompt = documentos + instrucciones + INSTRUCCION_DE_PROSA;
  return {
    ok: true, prompt, huella: huellaDelPrompt(prompt), supresiones,
    caracteresSuprimidos: supresiones.reduce((n, s) => n + s.caracteres, 0),
    sustitucion: { quitado: INSTRUCCION_DE_SALIDA_DEL_JUEZ.length, puesto: INSTRUCCION_DE_PROSA.length },
  };
}

/** Del bloque de la excepción, sin copiarlo: la definición del campo conflictoNormativo y su ejemplo, para la llamada 2. */
function trozoDeLaExcepcion(desde: string, hasta: string | null): string {
  const i = EXCEPCION_DE_LAS_REGLAS.indexOf(desde);
  const j = hasta === null ? EXCEPCION_DE_LAS_REGLAS.length : EXCEPCION_DE_LAS_REGLAS.indexOf(hasta, i);
  if (i === -1 || j === -1) throw new Error(`la excepción ya no contiene «${i === -1 ? desde : hasta}»: m1 extraería mal el campo conflictoNormativo`);
  return EXCEPCION_DE_LAS_REGLAS.slice(i, j).trim();
}
export const CAMPO_NORMATIVO = trozoDeLaExcepcion('Ese hallazgo lleva el campo "conflictoNormativo"', 'ORDEN OBLIGATORIO');
export const EJEMPLO_NORMATIVO = trozoDeLaExcepcion('CUANDO EMITAS UN HALLAZGO DE ESTE TIPO', null);

/** La llamada 2: la prosa de la llamada 1 y el esquema del producto. Texto nuestro, salvo las tres piezas citadas del producto. */
export function promptDeExtraccion(prosa: string): string {
  return `Más abajo va el informe de un auditor que ha comparado dos documentos —un DOCUMENTO NUEVO y un DOCUMENTO EXISTENTE—, escrito en prosa. Tu tarea es EXTRAER, NO VOLVER A JUZGAR: pasar al formato pedido exactamente los hallazgos que el informe describe.

- Ni uno más ni uno menos: no añadas hallazgos que el informe no tenga, no quites ninguno y no cambies su tipo.
- Las citas se copian LITERALMENTE del informe, tal como aparecen entre comillas, sin cambiar una letra. Si un hallazgo no trae cita de uno de los dos documentos, deja ese campo vacío ("").
- Cada contradicción o inconsistencia menor va en contradictions, con "severity": "contradiction" si el informe dice que son incompatibles y "minor_inconsistency" si dice que es una diferencia de enfoque o de matiz.
- Cada solapamiento va en overlappingContent, y cada contenido exclusivo del documento nuevo, en uniqueToNewDoc.
- Si el informe dice que un hallazgo es un conflicto entre dos reglas, o entre una regla y lo que se hace:
${CAMPO_NORMATIVO}
${EJEMPLO_NORMATIVO}
- Si el informe no da un porcentaje o un veredicto, dedúcelo de lo que dice.

INFORME:
"""
${prosa}
"""

${INSTRUCCION_DE_SALIDA_DEL_JUEZ}`;
}

/** Lo que se guarda de cada vez de m1: la prosa CRUDA (el crudo que el producto no guarda) y las huellas de los dos prompts. */
export interface RastroDeM1 { prosa?: string; huellaDeLaProsaEnviada?: string; huellaDeLaExtraccionEnviada?: string }

/** La sustitución de la llamada del producto: prosa y luego extracción, con las opciones del juez. Escribe en `rastro`. */
export function respuestaEnDosLlamadas(rastro: RastroDeM1): ObtenerRespuestaDelJuez {
  return async (promptDelProducto, opciones) => {
    const p = promptDeProsa(promptDelProducto);
    if (!p.ok) throw new Error(p.motivo);
    rastro.huellaDeLaProsaEnviada = p.huella;
    rastro.prosa = await callLLM(p.prompt, opciones);
    const extraccion = promptDeExtraccion(rastro.prosa);
    rastro.huellaDeLaExtraccionEnviada = huellaDelPrompt(extraccion);
    return callLLMJson<JudgeResponse>(extraccion, opciones);
  };
}
