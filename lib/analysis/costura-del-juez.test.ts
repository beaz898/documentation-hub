import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * LA COSTURA DEL JUEZ NO ES UNA PUERTA TRASERA (11/11/2026, arquitecto, F-130 m1). `judgeAllDocuments` acepta `obtenerRespuesta`
 * para sustituir la llamada del producto (`ObtenerRespuestaDelJuez`, judge.ts). NINGÚN FICHERO DEL PRODUCTO LA PASA: sólo la
 * carpeta de medida (`app/api/admin/medida-f130/`). El censo es por capacidad: todo fichero de código que nombre
 * `obtenerRespuesta`, y todo fichero que llame a `judgeAllDocuments`. Si M1 se rechaza, la costura se retira, y esto con ella.
 */
const MEDIDA = 'app/api/admin/medida-f130/';

function codigo(dir: string, fuera: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) codigo(ruta, fuera);
    else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) fuera.push(ruta.replace(/\\/g, '/'));
  }
  return fuera;
}
const sinComentarios = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

describe('la costura del juez', () => {
  const todos = ['app', 'lib', 'components', 'worker'].flatMap(d => codigo(d)).map(f => ({ f, t: sinComentarios(readFileSync(f, 'utf8')) }));

  it('⚠️ NINGÚN FICHERO DEL PRODUCTO NOMBRA obtenerRespuesta: sólo judge.ts, que la declara, y la carpeta de medida', () => {
    const quienes = todos.filter(x => /\bobtenerRespuesta\b/.test(x.t)).map(x => x.f);
    expect(quienes.filter(f => f !== 'lib/analysis/judge.ts' && !f.startsWith(MEDIDA))).toEqual([]);
    // control positivo: el censo sabe encontrarla, porque la carpeta de medida la pasa
    expect(quienes.some(f => f.startsWith(MEDIDA))).toBe(true);
    expect(quienes).toContain('lib/analysis/judge.ts');
  });

  it('los que llaman a judgeAllDocuments fuera de la carpeta de medida (el producto) son los conocidos, y ninguno pasa la costura', () => {
    const llaman = todos.filter(x => /\bjudgeAllDocuments\s*\(/.test(x.t) && !x.f.startsWith(MEDIDA) && x.f !== 'lib/analysis/judge.ts');
    expect(llaman.map(x => x.f).sort()).toEqual(['lib/analysis/pipeline.ts']);
    for (const x of llaman) expect(x.t).not.toMatch(/\bobtenerRespuesta\b/);
  });

  it('el worker y la ruta del análisis no la nombran (los dos sitios donde corre el juez del producto)', () => {
    const delWorkerYAnalyze = todos.filter(x => x.f.startsWith('worker/') || x.f.startsWith('app/api/analyze'));
    expect(delWorkerYAnalyze.length).toBeGreaterThan(0);
    expect(delWorkerYAnalyze.filter(x => /\bobtenerRespuesta\b/.test(x.t)).map(x => x.f)).toEqual([]);
  });
});
