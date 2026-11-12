import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { marcasDe } from './brazos';
import {
  ANCLAS, PREGUNTA_N, PREGUNTA_R, TIRADAS_POR_BRAZO, contarClaridad, decisionDeUnDia, decisionSobre84, primeraLinea, promptDeClaridad, sinFrasesDeA,
  textosDeClaridad, veredicto,
} from './tanda-de-claridad';

const leer = (f: string) => readFileSync(f, 'utf8');
const trozo = async (f: string, i: number) => toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o')).find(c => c.chunkIndex === i)!.text;

describe('la tanda de claridad (paso 1 de Fable, 12/11)', () => {
  it('⚠️ LAS DOS PREGUNTAS SON LAS DE FABLE, PALABRA POR PALABRA: están tal cual en el texto archivado', () => {
    const fable = leer('claude/consultas-fable/F-130_2026-11-12_adenda-3-y-respuesta.md').replace(/\r\n/g, '\n');
    expect(fable).toContain(`\n${PREGUNTA_N}\n`);
    expect(fable).toContain(`\n${PREGUNTA_R}\n`);
  });

  it('LOS DOS TEXTOS, SOBRE EL CORPUS: el párrafo de §2.4 sin la frase de A, y el de §3.5 entero; con las anclas de D y sin marcas de A', async () => {
    const t = textosDeClaridad(await trozo('NOR-10_protocolo-esterilizacion-instrumental.docx', 4), await trozo('CLI-12_manual-calidad-clinica.docx', 6));
    if (!t.ok) throw new Error(t.motivo);
    expect(t.texto1).toBe('Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.');
    expect(t.texto2).toBe('En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado.');
    expect(t.quitadas).toEqual(['El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.']);
    for (const x of [t.texto1, t.texto2]) expect(marcasDe(x).filter(m => m.startsWith('A:'))).toEqual([]);
  });

  it('las negativas: el ancla en ningún párrafo o en dos; el ancla dentro de una frase de A; una marca de A que queda', () => {
    const p2 = `Otra cosa.\n${ANCLAS.texto2} y más.`;
    expect(textosDeClaridad('sin nada', p2)).toMatchObject({ ok: false, motivo: expect.stringContaining('0 párrafos') });
    expect(textosDeClaridad(`${ANCLAS.texto1}.\n${ANCLAS.texto1}.`, p2)).toMatchObject({ ok: false, motivo: expect.stringContaining('2 párrafos') });
    expect(textosDeClaridad(`La responsabilidad última ${ANCLAS.texto1}.`, p2)).toMatchObject({ ok: false, motivo: expect.stringContaining('se ha ido el ancla') });
    expect(sinFrasesDeA('Una. La responsabilidad última es suya. Otra.')).toEqual({ texto: 'Una. Otra.', quitadas: ['La responsabilidad última es suya.'] });
    // un número con punto dentro de la frase no la parte (el caso de «apartado 3.1.» en CLI-12 §3.5)
    expect(sinFrasesDeA('Según el apartado 3.1. Otra cosa.')).toEqual({ texto: 'Según el apartado 3.1. Otra cosa.', quitadas: [] });
  });

  it('el prompt: Texto 1 (el permiso), Texto 2, y la pregunta del brazo al final', () => {
    const n = promptDeClaridad('n', 'UNO', 'DOS'), r = promptDeClaridad('r', 'UNO', 'DOS');
    expect(n).toBe(`Texto 1:\n"""\nUNO\n"""\n\nTexto 2:\n"""\nDOS\n"""\n\n${PREGUNTA_N}`);
    expect(r.endsWith(PREGUNTA_R)).toBe(true);
  });

  it('LAS DOS CUENTAS DE LA PRIMERA LÍNEA: la laxa (primaria) y la estricta (la de Fable), caso a caso', () => {
    // [brazo, respuesta, laxa, positivo laxo, estricta, positivo estricto]
    const casos: Array<[('n' | 'r'), string, string, boolean, string, boolean]> = [
      ['n', 'CONFLICTO\nPorque…', 'CONFLICTO', true, 'CONFLICTO', true],
      ['n', '**CONFLICTO**\n…', 'CONFLICTO', true, 'CONFLICTO', true],
      ['n', 'Conflicto.', 'CONFLICTO', true, 'CONFLICTO', true],
      ['n', '\n\n  CONFLICTO  \n…', 'CONFLICTO', true, 'CONFLICTO', true],
      ['n', '«CONFLICTO»', 'CONFLICTO', true, 'CONFLICTO', true],
      ['n', 'CONFLICTO: el texto 1 permite…', 'CONFLICTO', true, 'OTRA', false],
      ['n', 'CONFLICTO o DEPENDE', 'INDECIDIBLE', false, 'OTRA', false],
      ['n', 'CONFLICTO, aunque depende del caso', 'INDECIDIBLE', false, 'OTRA', false],
      ['n', 'Respuesta: CONFLICTO', 'OTRA', false, 'OTRA', false],
      ['n', 'CONFLICTOS', 'OTRA', false, 'OTRA', false],
      ['n', 'DEPENDE\n…', 'DEPENDE', false, 'DEPENDE', false],
      ['n', 'COMPATIBLES', 'COMPATIBLES', false, 'COMPATIBLES', false],
      ['n', '', 'OTRA', false, 'OTRA', false],
      ['r', 'NO PUEDE\n…', 'NO PUEDE', true, 'NO PUEDE', true],
      ['r', 'No puede.', 'NO PUEDE', true, 'NO PUEDE', true],
      ['r', '**NO  PUEDE**', 'NO PUEDE', true, 'NO PUEDE', true],
      ['r', 'NO PUEDE: si el Director Clínico es Coordinador…', 'NO PUEDE', true, 'OTRA', false],
      ['r', 'NO PUEDE, salvo que sí puede si…', 'INDECIDIBLE', false, 'OTRA', false],
      ['r', 'SÍ PUEDE', 'SI PUEDE', false, 'SI PUEDE', false],
      ['r', 'NO', 'OTRA', false, 'OTRA', false],
      ['r', 'DEPENDE', 'DEPENDE', false, 'DEPENDE', false],
      ['r', 'CONFLICTO', 'OTRA', false, 'OTRA', false],
    ];
    for (const [b, texto, laxa, pl, estricta, pe] of casos) {
      const v = veredicto(b, texto);
      expect([b, texto, v.laxa, v.positivoLaxo, v.estricta, v.positivoEstricto]).toEqual([b, texto, laxa, pl, estricta, pe]);
    }
    expect(primeraLinea('# Sí puede.')).toBe('SI PUEDE');
  });

  it('LAS DECISIONES DEL ARQUITECTO, en sus bordes: un día, ≥41 clara y ≤25 no clara; sobre 84, ≥74 clara, ≤60 no clara, y la zona gris', () => {
    expect([42, 41, 40, 26, 25, 0].map(decisionDeUnDia)).toEqual(['clara', 'clara', 'segundo_dia', 'segundo_dia', 'no_clara', 'no_clara']);
    expect([84, 74, 73, 61, 60, 0].map(decisionSobre84)).toEqual(['clara', 'clara', 'zona_gris', 'zona_gris', 'no_clara', 'no_clara']);
    expect(TIRADAS_POR_BRAZO).toBe(42);
    const c = contarClaridad('n', [...Array(41).fill('CONFLICTO: porque…'), 'DEPENDE']);
    expect(c).toEqual({
      tiradas: 42,
      primaria: { regla: 'laxa', positivos: 41, porOpcion: { CONFLICTO: 41, DEPENDE: 1 }, decisionDelDia: 'clara' },
      secundaria: { regla: 'estricta (Fable)', positivos: 0, porOpcion: { OTRA: 41, DEPENDE: 1 } },
    });
    expect(contarClaridad('n', ['CONFLICTO']).primaria.decisionDelDia).toBe('tanda_incompleta');
  });

  it('LA RUTA: las negativas antes del ensayo y del modelo, una sola llamada, el sondeo de una, y la cuenta sobre las que trajeron texto', () => {
    const r = leer('app/api/admin/medida-f130/claridad/route.ts');
    const i = (s: string) => { const k = r.indexOf(s); expect(k).toBeGreaterThan(-1); return k; };
    const brazo = i("if (brazo !== 'n' && brazo !== 'r') return NextResponse.json("), trozos = i('if (!leidos.ok) return NextResponse.json('),
      textos = i('if (!textos.ok) return NextResponse.json('), ensayo = i("if (req.nextUrl.searchParams.get('ensayo') === '1')"), modelo = i('await callLLM(prompt, {');
    expect(brazo).toBeLessThan(trozos); expect(trozos).toBeLessThan(textos); expect(textos).toBeLessThan(ensayo); expect(ensayo).toBeLessThan(modelo);
    expect(r.split('callLLM(').length - 1).toBe(1);
    expect(r).toContain('{ length: sondeo ? 1 : TIRADAS_POR_BRAZO }');
    expect(r).toContain('modeloExacto: delJuez.modelo,');
    expect(r).toContain('cuenta: { ...contarClaridad(brazo as BrazoDeClaridad, conTexto.map(r => r.texto)), fallidas: respuestas.length - conTexto.length },');
  });
});
