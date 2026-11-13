import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { marcasDe } from './brazos';
import {
  ANCLAS, PREGUNTA_N, PREGUNTA_R, TIRADAS_POR_BRAZO, TIRADAS_DE_LA_DECISION, contarClaridad, decisionSobre84, primeraLinea, promptDeClaridad, sinFrasesDeA,
  textosDeClaridad, veredicto, textosPrimarios, ANCLA_DEL_3_1, RASTROS_DEL_2_1, PREGUNTA_R_PRIMARIA, FRASE_1_DE_FABLE_PARA_R, FRASE_1_DE_PREGUNTA_R, controlDeR,
} from './tanda-de-claridad';
import { createHash } from 'node:crypto';

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
    // ⚠️ LA PAREJA SECUNDARIA, CONGELADA: los dos prompts son los de la lectura en papel y los ensayos del 12/11 (huellas comprobadas)
    const h = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
    expect([h(promptDeClaridad('n', t.texto1, t.texto2, 'secundaria')), h(promptDeClaridad('r', t.texto1, t.texto2, 'secundaria'))]).toEqual(['cef15935b2973843', 'b8c3cca016783273']);
  });

  it('LA PAREJA PRIMARIA, SOBRE EL CORPUS: el Texto 1 igual que en la secundaria, y el §3.1 ENTERO, las dos frases, la de A incluida', async () => {
    const nor = await trozo('NOR-10_protocolo-esterilizacion-instrumental.docx', 4);
    const p = textosPrimarios(nor, await trozo('CLI-12_manual-calidad-clinica.docx', 3));
    const s = textosDeClaridad(nor, await trozo('CLI-12_manual-calidad-clinica.docx', 6));
    if (!p.ok || !s.ok) throw new Error('no se armó');
    expect(p.texto1).toBe(s.texto1);
    expect(p.texto2).toBe('El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.');
    expect(p.quitadas).toEqual(s.quitadas);
    expect(marcasDe(p.texto2)).toEqual(expect.arrayContaining(['A:responsable ultimo', 'A:no el director clinico', 'D:separar la responsabilidad']));
    // ⚠️ CONGELADA: los dos prompts son los de la lectura en papel de la pareja primaria (claude/F-130_lectura_en_papel_D.md)
    const h = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
    expect([h(promptDeClaridad('n', p.texto1, p.texto2, 'primaria')), h(promptDeClaridad('r', p.texto1, p.texto2, 'primaria'))]).toEqual(['a053c1bbeb1b0ade', 'e8add83ec7be14a1']);
  });

  it('LAS NEGATIVAS DE LA PRIMARIA (arquitecto): el Texto 2 sin la frase de A o sin el principio; el montaje invertido; un rastro del §2.1', () => {
    const t1 = `Cada clínica tiene un Coordinador de Calidad, figura que ${ANCLAS.texto1}.`;
    const frase1 = 'El responsable es el Coordinador de Calidad, no el Director Clínico.', frase2 = `El criterio es ${ANCLA_DEL_3_1} de un proceso crítico.`;
    expect(textosPrimarios(t1, `${frase1} ${frase2}`)).toMatchObject({ ok: true });
    expect(textosPrimarios(t1, frase2)).toMatchObject({ ok: false, motivo: expect.stringContaining('no el Director Clínico') });
    expect(textosPrimarios(t1, `${frase1} Y nada más.`)).toMatchObject({ ok: false, motivo: expect.stringContaining('0 párrafos') });
    // el montaje invertido: el §3.1 como Texto 1 y el §2.4 como Texto 2
    expect(textosPrimarios(`${frase1} ${frase2}`, t1)).toMatchObject({ ok: false });
    expect(textosPrimarios(t1, `${frase1} ${frase2} Esa decisión no es delegable.`)).toMatchObject({ ok: false, motivo: expect.stringContaining('§2.1') });
    expect(textosPrimarios(`${t1} Véase el apartado 2.1.`, `${frase1} ${frase2}`)).toMatchObject({ ok: false, motivo: expect.stringContaining('§2.1') });
    expect(RASTROS_DEL_2_1).toContain('apartado 2.1');
    // las dos negativas que se cumplen por construcción: el Texto 1 sale sin marcas de A aunque el párrafo las traiga, y un Texto 2 sin
    // el principio ni siquiera se elige
    const conA = textosPrimarios(`Cada clínica tiene un Coordinador de Calidad, figura que ${ANCLAS.texto1}. Su responsabilidad última no cambia.`, `${frase1} ${frase2}`);
    if (!conA.ok) throw new Error(conA.motivo);
    expect(marcasDe(conA.texto1).filter(m => m.startsWith('A:'))).toEqual([]);
    expect(conA.quitadas).toEqual(['Su responsabilidad última no cambia.']);
    expect(textosPrimarios(t1, frase1)).toMatchObject({ ok: false, motivo: expect.stringContaining('separar la responsabilidad') });
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
    const n = promptDeClaridad('n', 'UNO', 'DOS', 'secundaria'), r = promptDeClaridad('r', 'UNO', 'DOS', 'secundaria');
    expect(n).toBe(`Texto 1:\n"""\nUNO\n"""\n\nTexto 2:\n"""\nDOS\n"""\n\n${PREGUNTA_N}`);
    expect(r.endsWith(PREGUNTA_R)).toBe(true);
    // la pareja primaria: la misma N, y la R corregida
    expect(promptDeClaridad('n', 'UNO', 'DOS', 'primaria')).toBe(n);
    expect(promptDeClaridad('r', 'UNO', 'DOS', 'primaria').endsWith(PREGUNTA_R_PRIMARIA)).toBe(true);
    expect(PREGUNTA_R_PRIMARIA).not.toBe(PREGUNTA_R);
  });

  it('⚠️ LA PROCEDENCIA DE LA R CORREGIDA: la primera frase de Fable, y el RESTO, idéntico carácter a carácter al de la original', () => {
    expect(PREGUNTA_R_PRIMARIA.startsWith(`${FRASE_1_DE_FABLE_PARA_R} `)).toBe(true);
    expect(PREGUNTA_R.startsWith(`${FRASE_1_DE_PREGUNTA_R} `)).toBe(true);
    expect(PREGUNTA_R_PRIMARIA.slice(FRASE_1_DE_FABLE_PARA_R.length)).toBe(PREGUNTA_R.slice(FRASE_1_DE_PREGUNTA_R.length));
    // la primera frase de Fable, y el arranque de la segunda que también escribió («Si una clínica hace uso de ese permiso, ¿puede cumplir»)
    expect(PREGUNTA_R_PRIMARIA).toContain(`${FRASE_1_DE_FABLE_PARA_R} Si una clínica hace uso de ese permiso, ¿puede cumplir`);
    // y es la de la cita del arquitecto del 12/11, archivada
    const p = leer('claude/Predicciones_34_Conflicto_Normativo.md').replace(/\r\n/g, '\n');
    expect(p).toContain(`\n«${PREGUNTA_R_PRIMARIA}»\n`);
  });

  it('EL CONTROL DE R (arquitecto, 13/11), en sus bordes: < 30 falla, 30 a 37 anomalía, ≥ 38 lo previsto; sólo en el R primario', () => {
    expect([0, 29, 30, 37, 38, 42].map(controlDeR)).toEqual(['falla', 'falla', 'anomalia', 'anomalia', 'previsto', 'previsto']);
    const r29 = [...Array(29).fill('NO PUEDE\nporque…'), ...Array(13).fill('DEPENDE')];
    expect(contarClaridad('r', r29, 'primaria').controlDeR).toBe('falla');
    expect(contarClaridad('r', r29, 'secundaria')).not.toHaveProperty('controlDeR');
    expect(contarClaridad('n', r29, 'primaria')).not.toHaveProperty('controlDeR');
    expect(contarClaridad('r', ['NO PUEDE'], 'primaria').controlDeR).toBe('tanda_incompleta');
    // el control va con la cuenta LAXA: «NO PUEDE: porque…» es positivo laxo y no estricto; con la estricta saldría «falla»
    const laxos30 = [...Array(30).fill('NO PUEDE: porque…'), ...Array(12).fill('DEPENDE')];
    expect(contarClaridad('r', laxos30, 'primaria').controlDeR).toBe('anomalia');
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

  it('LA DECISIÓN, UNA SOLA, SOBRE 84 Y CON LOS UMBRALES DE FABLE, en sus bordes: ≥68 clara, ≤60 no clara, y la zona gris en medio', () => {
    expect([84, 68, 67, 61, 60, 0].map(decisionSobre84)).toEqual(['clara', 'clara', 'zona_gris', 'zona_gris', 'no_clara', 'no_clara']);
    expect([TIRADAS_POR_BRAZO, TIRADAS_DE_LA_DECISION]).toEqual([42, 84]);
    const c = contarClaridad('n', [...Array(41).fill('CONFLICTO: porque…'), 'DEPENDE']);
    expect(c).toEqual({
      tiradas: 42,
      // la puerta de validez, sólo en N y sólo sobre los CONFLICTO: «CONFLICTO: porque…» no trae explicación, así que va a otra cosa
      puertaDeValidez: { conflictos: 41, porD: 0, porOtraCosa: 41, valida: false },
      primaria: { regla: 'laxa', positivos: 41, porOpcion: { CONFLICTO: 41, DEPENDE: 1 } },
      secundaria: { regla: 'estricta (Fable)', positivos: 0, porOpcion: { OTRA: 41, DEPENDE: 1 } },
    });
    expect(contarClaridad('r', ['NO PUEDE\nLa misma persona.'])).not.toHaveProperty('puertaDeValidez');
    expect(contarClaridad('n', ['CONFLICTO\nLa misma persona no puede.', 'DEPENDE\nLas funciones difieren.']).puertaDeValidez)
      .toEqual({ conflictos: 1, porD: 1, porOtraCosa: 0, valida: true });
  });

  it('LA RUTA: las negativas antes del ensayo y del modelo, una sola llamada, el sondeo de una, y la cuenta sobre las que trajeron texto', () => {
    const r = leer('app/api/admin/medida-f130/claridad/route.ts');
    const i = (s: string) => { const k = r.indexOf(s); expect(k).toBeGreaterThan(-1); return k; };
    const brazo = i("if (brazo !== 'n' && brazo !== 'r') return NextResponse.json("), trozos = i('if (!leidos.ok) return NextResponse.json('),
      textos = i('if (!textos.ok) return NextResponse.json('), ensayo = i("if (req.nextUrl.searchParams.get('ensayo') === '1')"), modelo = i('await callLLM(prompt, {');
    const pareja = i("if (cualPareja !== '31' && cualPareja !== '35') return NextResponse.json(");
    expect(brazo).toBeLessThan(pareja); expect(pareja).toBeLessThan(trozos);
    expect(trozos).toBeLessThan(textos); expect(textos).toBeLessThan(ensayo); expect(ensayo).toBeLessThan(modelo);
    // la primaria lee el trozo del §3.1 y arma con textosPrimarios; la secundaria, el del §3.5 con textosDeClaridad
    expect(r).toContain("candidato = pareja === 'primaria' ? 'cli12_3' : PAREJA_DE_D.candidato;");
    // el prompt con su pareja (la R cambia entre las dos), y cada CONFLICTO de N con su clase (la puerta de validez, auditable)
    expect(r).toContain('const prompt = promptDeClaridad(brazo as BrazoDeClaridad, textos.texto1, textos.texto2, pareja);');
    expect(r).toContain("...(brazo === 'n' && v.positivoLaxo ? { claseDelConflicto: claseDelConflicto(texto) } : {}),");
    expect(r).toContain("const pareja: ParejaDeClaridad = cualPareja === '31' ? 'primaria' : 'secundaria';");
    expect(r).toContain("const textos = pareja === 'primaria'\n    ? textosPrimarios(");
    expect(r.split('callLLM(').length - 1).toBe(1);
    expect(r).toContain('{ length: sondeo ? 1 : TIRADAS_POR_BRAZO }');
    expect(r).toContain('modeloExacto: delJuez.modelo,');
    expect(r).toContain('cuenta: { ...contarClaridad(brazo as BrazoDeClaridad, conTexto.map(r => r.texto), pareja), fallidas: respuestas.length - conTexto.length },');
  });
});
