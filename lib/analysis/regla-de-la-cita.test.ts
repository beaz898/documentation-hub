import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * PUESTO 2 (02/10/2026, B.313) — LA REGLA DE LA CITA, EN EL PROMPT DEL JUEZ.
 * El juez no copia: ESCULPE. Elige la frase que rima y le pega el final de otra
 * (Chamberí), o borra lo que no rima (el autoclave). La regla «Máximo 1 frase
 * por cita» ya existía; lo que faltaba era prohibir el recorte por dentro y la
 * unión de trozos.
 *
 * ⚠️ ES LA PRIMERA PRUEBA QUE LEE EL TEXTO DEL PROMPT, y es deliberada: guarda
 * la regla que decide si una cita publicada existe en el documento del cliente.
 * El día que se cambie esta regla, esta prueba cambia con ella. Lee disco (el
 * fuente de judge.ts): es de la clase que nombra vitest.config.mts.
 */
const juez = readFileSync('lib/analysis/judge.ts', 'utf8');

describe('puesto 2 · cada cita es UNA frase, copiada entera', () => {
  it('ROJO antes, VERDE después: la regla exige una sola frase ENTERA, de principio a fin', () => {
    expect(juez).toContain('UNA sola frase del documento, copiada ENTERA, de principio a fin de frase');
  });

  it('ROJO antes, VERDE después: prohíbe cortar por dentro, resumir, quitar palabras del medio y los puntos suspensivos', () => {
    expect(juez).toContain('PROHIBIDO cortarla por dentro, resumirla, quitarle palabras del medio o usar puntos suspensivos');
  });

  it('ROJO antes, VERDE después: prohíbe unir trozos de sitios distintos, y dice qué hacer si el dato está en otra frase', () => {
    expect(juez).toContain('PROHIBIDO unir trozos que vengan de sitios distintos del documento');
    expect(juez).toContain('usa esa frase aunque no se parezca a la del otro documento');
  });

  it('ROJO antes, VERDE después: dice para qué — la cita se busca tal cual en el documento del cliente y se enseña', () => {
    expect(juez).toContain('se va a buscar LITERALMENTE en el documento del cliente y se va a mostrar en pantalla');
  });

  it('CONTROL (B.312): el orden y los nombres de los campos de los solapamientos no se tocan', () => {
    expect(juez).toContain('"evidenceInNewDoc": "cita literal del nuevo", "evidenceInExistingDoc": "cita literal del existente"');
    expect(juez).toContain('- En existingDocSays y evidenceInExistingDoc: copia literalmente un fragmento del DOCUMENTO EXISTENTE.');
  });
});
