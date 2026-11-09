import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { construirPrompt } from './medida-f130';
import { CRITERIO_DEL_CUMPLIMIENTO } from './criterio-del-cumplimiento';
import { LINEAS_DE_HALLAZGO, construirPromptConLineas } from './lineas-de-hallazgo';

// LAS DOS LÍNEAS DE HALLAZGO (09/11/2026): la ruta `d` no cambia, y la `d2` es exactamente la `d` más el bloque aprobado.
const leer = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const huella = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// EL ENSAYO DE D DEL 04/11, archivado literal: los dos trozos tal como estaban guardados y el prompt que la ruta `d` armó con ellos.
// Es la referencia de las tandas del 06/11 y del 09/11, las dos con 4.155 tokens de entrada en las 84 llamadas.
function ensayoArchivado(): { pareja: Parameters<typeof construirPrompt>[0]; prompt: string } {
  const md = leer('claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md');
  const i = md.indexOf('## LA D SEMBRADA · EL ENSAYO, LITERAL');
  const a = md.indexOf('```json\n', i) + '```json\n'.length, b = md.indexOf('\n```', a);
  if (i < 0 || a < i || b < a) throw new Error('no encuentro el ensayo de D archivado');
  const j = JSON.parse(md.slice(a, b));
  const x = j.trozos.analizado, y = j.trozos.candidato;
  return { pareja: { documento1: x.documento, trozoA: x.trozo, textoA: x.texto, documento2: y.documento, trozoB: y.trozo, textoB: y.texto }, prompt: j.prompt };
}

describe('las dos líneas de hallazgo (09/11)', () => {
  it('(a) ⚠️ LA RUTA d NO CAMBIA: con los trozos del ensayo archivado, construirPrompt da el MISMO prompt, byte a byte', () => {
    if (!CRITERIO_DEL_CUMPLIMIENTO.ok) throw new Error(CRITERIO_DEL_CUMPLIMIENTO.motivo);
    const e = ensayoArchivado();
    const hoy = construirPrompt(e.pareja, CRITERIO_DEL_CUMPLIMIENTO.texto);
    expect(hoy.ok).toBe(true);
    if (hoy.ok) expect(huella(hoy.prompt)).toBe(huella(e.prompt));
    if (hoy.ok) expect(hoy.prompt).toBe(e.prompt);
  });

  it('(a) la ruta d sigue llamando a construirPrompt y no conoce las líneas', () => {
    const d = leer('app/api/admin/medida-f130/d/route.ts');
    expect(d).toContain('const armado = construirPrompt(');
    expect(d).not.toContain('lineas-de-hallazgo');
    expect(d).not.toContain('construirPromptConLineas');
  });

  it('(b) d2 es EXACTAMENTE el prompt de d, una línea en blanco y el bloque aprobado, y nada más', () => {
    if (!CRITERIO_DEL_CUMPLIMIENTO.ok) throw new Error(CRITERIO_DEL_CUMPLIMIENTO.motivo);
    const e = ensayoArchivado();
    const d2 = construirPromptConLineas(e.pareja, CRITERIO_DEL_CUMPLIMIENTO.texto);
    expect(d2.ok).toBe(true);
    if (d2.ok) expect(d2.prompt).toBe(`${e.prompt}\n\n${LINEAS_DE_HALLAZGO}`);
  });

  it('(b) el bloque es el texto aprobado por el arquitecto: tres líneas, las dos de formato con su hueco entre corchetes', () => {
    const l = LINEAS_DE_HALLAZGO.split('\n');
    expect(l).toHaveLength(3);
    expect(l[1]).toBe('HALLAZGO EN LA 1: [escribe SÍ o escribe NO]');
    expect(l[2]).toBe('HALLAZGO EN LA 2: [escribe SÍ o escribe NO]');
    expect(l[0]).toContain('en la 1, «SÍ» quiere decir que los dos textos dicen cosas distintas sobre el mismo dato');
    expect(l[0]).toContain('en la 2, «SÍ» quiere decir que NO se pueden cumplir las dos a la vez');
    expect(huella(LINEAS_DE_HALLAZGO)).toBe('ae20948d748edca0');
  });

  it('(b) sin criterio, d2 tampoco arma nada', () => {
    const e = ensayoArchivado();
    expect(construirPromptConLineas(e.pareja, '  ').ok).toBe(false);
  });

  it('(c) la ruta d2 usa construirPromptConLineas, con su propia medida, y la negativa dura de d', () => {
    const d2 = leer('app/api/admin/medida-f130/d2/route.ts');
    expect(d2).toContain('const armado = construirPromptConLineas(');
    expect(d2).not.toMatch(/construirPrompt\(/);
    // la MEDIDA, no el comentario: es lo que separa en la salida una tanda de d de una de d2
    expect(d2).toContain('const medida = `F-130 · la pregunta cerrada CON LAS DOS LÍNEAS DE HALLAZGO sobre');
    expect(d2).toContain("if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });");
  });

  it('(c) la página tiene los dos botones de d2, y los de d siguen igual', () => {
    const p = leer('app/api/admin/medida-f130/page.tsx');
    expect(p).toContain("medir('d2?ensayo=1')");
    expect(p).toContain("medir('d2')");
    expect(p).toContain("medir('d')}>D · la tanda: NOR-10 §2.4 ↔ CLI-12 §3.5, 21 veces (gasta en la API)");
  });
});
