import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 3.1.3 (21/10/2026): EL CABLEADO DE LA SEGUNDA SELECCIÓN. El pipeline entero no corre en la suite (necesita
 * Supabase y Pinecone de verdad), así que esto vigila en el código lo que `segunda-seleccion.test.ts` no puede
 * ver: que la recuperación GUARDA los fragmentos ordenados de cada candidato, y que el pipeline le pasa al
 * juez los candidatos de la segunda selección y sus repartos —no los del rerank—. Si se cae cualquiera de las
 * tres piezas, el juez vuelve en silencio al bloque de 3.000 y la lectura lo diría como 'la_de_la_recuperacion'
 * o sin `seleccion` — el control en producción es ése, en `lecturaDeLasParejas`.
 */
const pipeline = readFileSync('lib/analysis/pipeline.ts', 'utf8');
const retrieval = readFileSync('lib/analysis/retrieval.ts', 'utf8');

describe('la segunda selección, cableada', () => {
  it('la recuperación guarda los fragmentos ordenados de cada candidato y los devuelve', () => {
    expect(retrieval).toMatch(/const sorted = unique\.sort\(\(a, b\) => b\.score - a\.score\);\s*fragmentosOrdenados\.set\(documentId, sorted\);/);
    expect(retrieval).toMatch(/presupuestoPorCandidato: budgetChars,\s*fragmentosOrdenados,/);
  });
  it('el pipeline corre la segunda selección con ellos, y el juez recibe SUS candidatos y SUS repartos', () => {
    expect(pipeline).toMatch(/const segunda = segundaSeleccion\(\{[^}]*fragmentosOrdenados,/);
    const llamada = pipeline.slice(pipeline.indexOf('await judgeAllDocuments({'));
    const args = llamada.slice(0, llamada.indexOf('});'));
    expect(args).toMatch(/candidates: segunda\.candidates,/);
    expect(args).toMatch(/repartos: segunda\.repartos,/);
  });
});
