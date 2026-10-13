import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * LA REGLA DE LA CITA, EN EL PROMPT DEL JUEZ.
 *
 * ⚠️ ES LA PRIMERA PRUEBA QUE LEE EL TEXTO DEL PROMPT, y es deliberada: guarda
 * la regla que decide si una cita publicada existe en el documento del cliente.
 * El día que se cambie esta regla, esta prueba cambia con ella. Lee disco (el
 * fuente de judge.ts): es de la clase que nombra vitest.config.mts.
 *
 * HISTORIA, para que el cambio de hoy no parezca un olvido:
 *   · PUESTO 2 (02/10/2026, B.313): «UNA sola frase, copiada ENTERA, de
 *     principio a fin de frase», y la prohibición de cortar y de unir trozos.
 *   · F-126 (13/10/2026, dictamen de Fable): SUSTITUIDA. El juez incumplía «frase
 *     entera» 7 de 7 incluso cuando acertaba —PLAZO y NEGACIÓN se copian como
 *     tramos de mitad de frase—, y en LUGAR, donde el dato vive en una
 *     subordinada lejos del sujeto, soldaba para fabricarse una frase con sujeto.
 *     La regla nueva pide el tramo CONTIGUO más corto que contenga el dato, puede
 *     empezar y acabar a mitad de frase, y conserva la prohibición de unir trozos.
 */
const juez = readFileSync('lib/analysis/judge.ts', 'utf8');

/** El bloque de la regla, el ejemplo y el molde del JSON: lo que el modelo lee. */
const reglas = juez.slice(juez.indexOf('REGLAS DE FORMATO:'), juez.indexOf('"uniqueToNewDoc": ["aspecto 1", "aspecto 2"]'));

describe('F-126 · cada cita es el tramo CONTIGUO más corto que contenga el dato', () => {
  it('la regla nueva, tal cual la dictaminó Fable', () => {
    expect(reglas).toContain('Cada cita es un tramo de texto CONTIGUO del documento, copiado tal cual. Elige el tramo más CORTO que contenga el dato en conflicto.');
    expect(reglas).toContain('Puede empezar y acabar a mitad de frase: no hace falta que tenga sujeto ni que se entienda sola.');
    expect(reglas).toContain('Normalmente entre 40 y 200 caracteres.');
    expect(reglas).toContain('Si el dato está en una subordinada, copia la subordinada y lo justo que la rodea.');
  });

  it('conserva las prohibiciones: unir trozos de sitios distintos, resumir, quitar palabras del medio, puntos suspensivos', () => {
    expect(reglas).toContain('PROHIBIDO unir trozos de sitios distintos, resumir, quitar palabras del medio o poner puntos suspensivos.');
  });

  it('la regla vieja ya no está: ni «frase entera de principio a fin» ni «no copies párrafos enteros»', () => {
    expect(juez).not.toContain('de principio a fin de frase');
    expect(juez).not.toContain('NO copies párrafos enteros');
  });

  it('dice para qué — la cita se busca tal cual en el documento del cliente y se enseña', () => {
    expect(juez).toContain('se va a buscar LITERALMENTE en el documento del cliente y se va a mostrar en pantalla');
  });

  it('lo que NO se toca hoy (F-126): «si no puedes copiar una frase literal, no emitas»', () => {
    expect(juez).toContain('- Si no puedes copiar una frase literal que sustente el hallazgo, no emitas ese hallazgo.');
  });

  it('el ejemplo: una cita de mitad de frase, de unos 80 caracteres, que empieza en minúscula y está DENTRO de su frase', () => {
    const m = reglas.match(/Si el documento dice "([^"]+)", una cita correcta del dato de la edad es "([^"]+)"/);
    expect(m).not.toBeNull();
    const [, frase, cita] = m as RegExpMatchArray;
    expect(frase).toContain(cita);
    expect(frase.startsWith(cita)).toBe(false);
    expect(frase.endsWith(cita)).toBe(false);
    expect(cita[0]).toBe(cita[0].toLowerCase());
    expect(cita.length).toBeGreaterThanOrEqual(70);
    expect(cita.length).toBeLessThanOrEqual(90);
  });

  it('el molde de las contradicciones: valores realistas de unos 100 caracteres, no «cita literal del nuevo»', () => {
    const molde = reglas.slice(reglas.indexOf('"contradictions": ['), reglas.indexOf('"overlappingContent": ['));
    expect(molde).not.toContain('cita literal del nuevo');
    const valores = [...molde.matchAll(/"(?:newDocSays|existingDocSays)": "([^"]+)"/g)].map(x => x[1]);
    expect(valores).toHaveLength(4);
    for (const v of valores) {
      expect(v.length).toBeGreaterThanOrEqual(90);
      expect(v.length).toBeLessThanOrEqual(130);
    }
  });

  // ⚠️ REGLA DE MÉTODO (12/10/2026, la que mordió con Chamberí/Retiro en la fase
  // 1.0): UN EJEMPLO DEL PROMPT NO PUEDE CONTENER LA RESPUESTA DEL CASO QUE SE VA
  // A MEDIR. El ejemplo y el molde hablan de alquilar bicicletas, un dominio que
  // no está en corpus-pruebas/ (comprobado el 13/10/2026 sobre el texto extraído
  // de sus 28 ficheros). Si alguien lo cambia por algo del corpus, esto se pone rojo.
  it('ni el ejemplo ni el molde nombran nada de los casos que se miden', () => {
    const ejemploYMolde = reglas.slice(reglas.indexOf('- Ejemplo de cita correcta'), reglas.indexOf('"overlappingContent": ['))
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const prohibidas = ['residuo', 'contenedor', 'clinica', 'color', 'amarill', 'negro', 'grupo', 'almacen', 'gestor',
      'retirada', 'chamberi', 'retiro', 'salamanca', 'dentavia', 'plazo', '72 horas', '7 dias'];
    for (const p of prohibidas) expect(ejemploYMolde).not.toContain(p);
  });

  it('CONTROL (B.312): el orden y los nombres de los campos de los solapamientos no se tocan', () => {
    expect(juez).toContain('"evidenceInNewDoc": "cita literal del nuevo", "evidenceInExistingDoc": "cita literal del existente"');
    expect(juez).toContain('- En existingDocSays y evidenceInExistingDoc: copia literalmente un fragmento del DOCUMENTO EXISTENTE.');
  });
});
