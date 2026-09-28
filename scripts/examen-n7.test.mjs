import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import N7 from '../examen/casos/N7_metadatos_del_documento.mjs';
import { marcarPasada } from '../lib/examen/marcador.mjs';
import { normalize } from '../lib/analysis/normalize-core.mjs';

/**
 * N7 · EL CASO DECISIVO DE SU DISCRIMINANTE (28/09/2026).
 *
 * Tres comprobaciones, y cada una caza un discriminante mal escrito:
 *   1. el falso real de la pasada 1 de P2 (c39397e7) cuenta como N7-FECHA;
 *   2. una contradicción LEGÍTIMA sobre fechas del mundo entre los mismos
 *      documentos NO cuenta como metadato;
 *   3. cada valor aparece 1 vez en su .docx y 0 en el otro — la premisa que
 *      hace que una cita con ese valor sólo pueda venir de la cabecera.
 * Mutantes medidos el 28/09: un discriminante «2026», «de 2026» o «febrero de
 * 2026» lo caza la 3 (aparece en los dos documentos). La 2 no los caza por sí
 * sola —la otra cita sigue exigiendo «16 de febrero de 2026»—: vigila que una
 * contradicción entre fechas del mundo no se lea como metadato.
 */

const texto = f => normalize(execFileSync('unzip', ['-p', `corpus-pruebas/${f}`, 'word/document.xml'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).replace(/<\/w:p>/g, '\n').replace(/<[^>]*>/g, ''));
const veces = (t, s) => t.split(normalize(s)).length - 1;

describe('N7 · metadatos del documento', () => {
  it('1 · el falso real de la tanda c39397e7 (P2, pasada 1) cuenta como N7-FECHA', () => {
    const crudo = JSON.parse(readFileSync('examen/resultados/2026-09-27_c39397e7/P2_pasada1.json', 'utf8'));
    const m = marcarPasada(N7, { pasada: 1, hallazgos: crudo.cuerpo.analisis.discrepancies, solapamientos: [] });
    expect(m.falsos).toEqual(['N7-FECHA']);
  });

  it('2 · una contradicción legítima sobre una fecha del mundo NO es un metadato', () => {
    const legitima = {
      severity: 'contradiction', topic: 'Fecha de retirada del contenedor',
      newDocSays: 'El gestor retira los contenedores el 19 de febrero de 2026',
      existingDocSays: 'La retirada centralizada está fijada para el 26 de febrero de 2026',
    };
    expect(marcarPasada(N7, { pasada: 1, hallazgos: [legitima] }).falsos).toEqual([]);
  });

  it('3 · cada valor de la cabecera aparece una vez en su documento y ninguna en el otro', () => {
    const analizado = texto(N7.analizado);
    const corpus = texto(N7.corpusExacto[0]);
    for (const f of N7.noDebenSalir) {
      expect(veces(analizado, f.citaEnElAnalizado.discriminante), `${f.id} en el analizado`).toBe(1);
      expect(veces(corpus, f.citaEnElAnalizado.discriminante), `${f.id} del analizado en el corpus`).toBe(0);
      expect(veces(corpus, f.citaEnElCorpus.discriminante), `${f.id} en el corpus`).toBe(1);
      expect(veces(analizado, f.citaEnElCorpus.discriminante), `${f.id} del corpus en el analizado`).toBe(0);
    }
  });
});
