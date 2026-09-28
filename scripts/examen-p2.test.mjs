import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import P2 from '../examen/casos/P2_residuos_prosa.mjs';
import { marcarPasada } from '../lib/examen/marcador.mjs';
import { normalize } from '../lib/analysis/normalize-core.mjs';

/**
 * P2-3 Y SU OTRA FORMA (28/09/2026). Con la auditoría completa de P2, una
 * contradicción que ningún esperado reclama cuenta como FALSO: si P2-3-AMARILLO
 * no emparejara la ruta del contenedor amarillo, el examen castigaría un acierto.
 */

const texto = f => normalize(execFileSync('unzip', ['-p', `corpus-pruebas/${f}`, 'word/document.xml'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).replace(/<\/w:p>/g, '\n').replace(/<[^>]*>/g, ''));
const veces = (t, s) => t.split(normalize(s)).length - 1;

const CLI13 = 'Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado en cada gabinete';
const contr = (nor11) => ({ severity: 'contradiction', topic: 'Color del contenedor para residuos grupo III no punzantes', newDocSays: nor11, existingDocSays: CLI13 });

describe('P2-3 · las dos formas de la misma contradicción', () => {
  it('la ruta del amarillo (como la emitió el juez el 28/09) es un acierto de P2-3-AMARILLO, no un falso', () => {
    const h = contr('el resto de residuos biosanitarios especiales no punzantes (gasas, guantes, apósitos), que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada gabinete');
    const m = marcarPasada(P2, { pasada: 1, hallazgos: [h] });
    expect(m.aciertos).toEqual(['P2-3-AMARILLO']);
    expect(m.falsos).toEqual([]);
  });

  it('la ruta de la negación sigue siendo P2-3, y no P2-3-AMARILLO', () => {
    const h = contr('En ningún caso se depositan en el contenedor negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I');
    expect(marcarPasada(P2, { pasada: 1, hallazgos: [h] }).aciertos).toEqual(['P2-3']);
  });

  it('otra frase sobre contenedores no es ninguna de las dos: con auditoría completa, falso', () => {
    const h = contr('Se depositan en contenedor rígido de color azul y se gestionan aparte');
    const m = marcarPasada(P2, { pasada: 1, hallazgos: [h] });
    expect(m.aciertos).toEqual([]);
    expect(m.falsos.length).toBe(1);
  });

  it('el discriminante del amarillo aísla: 1 vez en NOR-11, 0 en CLI-13', () => {
    const e = P2.debenSalir.find(x => x.id === 'P2-3-AMARILLO');
    expect(veces(texto(P2.analizado), e.citaEnElAnalizado.discriminante)).toBe(1);
    expect(veces(texto(P2.corpusExacto[0]), e.citaEnElAnalizado.discriminante)).toBe(0);
  });
});
