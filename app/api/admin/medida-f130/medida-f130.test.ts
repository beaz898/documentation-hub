import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CADUCA_EL, FRASES_DE_D, FRASES_DEL_QUINTO, MARCAS_DE_A, PAREJAS_DE_E3, PAREJA_DE_D, PAREJA_DE_LA_VARIANTE_LIMPIA, PAREJA_DEL_QUINTO,
  PREGUNTA_CERRADA, TROZOS, VECES_DE_D, VECES_DE_E3, VECES_DE_LA_VARIANTE_LIMPIA, VECES_DEL_QUINTO,
  construirPrompt, contarFiguras, correspondencia, coseno, estaCaducada, fraseQueContiene, puestos, trozoConSuFrase,
} from './medida-f130';

/**
 * LAS DOS HERRAMIENTAS TEMPORALES DE F-130 (28/10/2026): lo que se puede comprobar sin red. Se borra con la carpeta.
 */
const PAREJA = { documento1: 'NOR-10_x.docx', trozoA: 4, textoA: 'a', documento2: 'CLI-12_x.docx', trozoB: 3, textoB: 'b' };

describe('las medidas temporales de F-130', () => {
  it('CADUCAN SOLAS: antes de la fecha funcionan, desde la fecha no', () => {
    const fecha = new Date(CADUCA_EL).getTime();
    expect(estaCaducada(new Date(fecha - 1))).toBe(false);
    expect(estaCaducada(new Date(fecha))).toBe(true);
  });

  it('SIN CRITERIO DEL CUMPLIMIENTO no se arma ningún prompt', () => {
    expect(construirPrompt(PAREJA, '  ')).toEqual({ ok: false, motivo: 'el criterio del cumplimiento está vacío' });
  });

  it('LA PREGUNTA, literal del arquitecto: DOS preguntas, lo que obliga a contestar las dos, y QUÉ RESPUESTA ES EL HALLAZGO en cada una', () => {
    expect(PREGUNTA_CERRADA).toContain('Contesta a LAS DOS preguntas. Las dos son obligatorias.\n');
    expect(PREGUNTA_CERRADA).toContain('CONTESTAR A UNA NO TE EXIME DE CONTESTAR A LA OTRA, ni cuando tu respuesta señale un hallazgo ni cuando no lo señale.');
    expect(PREGUNTA_CERRADA).toContain('PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nHAY HALLAZGO SI LA RESPUESTA ES «SÍ». Si es sí, cita la frase literal de cada lado. Si es no, contesta «no» y pasa a la 2.');
    expect(PREGUNTA_CERRADA).toContain('PREGUNTA 2 · EL CUMPLIMIENTO\n{{CRITERIO_DEL_CUMPLIMIENTO}}\nHAY HALLAZGO SI LA RESPUESTA ES «NO»: si NO se pueden cumplir las dos a la vez. Si es «no», cita la frase literal de cada lado y di cuál de las dos etiquetas es, "norma_contra_norma" o "norma_contra_practica". Si se pueden cumplir, contesta «sí» y no cites nada.');
    expect(PREGUNTA_CERRADA).not.toContain('TRES');
    // 29/10, tras la segunda tanda: la línea del mismo par se BORRA (va al validador de la pasada 2, en código) y la 2 se
    // DESACOPLA de la 1, justo detrás de su «HAY HALLAZGO»; es una sola cosa, quitar el acoplamiento entre las preguntas
    expect(PREGUNTA_CERRADA).not.toContain('MISMO PAR DE FRASES');
    // corregida antes de la tercera tanda: la 2 se pregunta SOBRE FRASES, y ya no dice «aunque las frases sean las mismas»
    expect(PREGUNTA_CERRADA.endsWith('Si se pueden cumplir, contesta «sí» y no cites nada.\nESTA PREGUNTA SE CONTESTA SOLA, COMO SI LA 1 NO EXISTIERA, Y SE PREGUNTA SOBRE FRASES, NO SOBRE LOS DOS TEXTOS EN BLOQUE. Un mismo par de trozos puede mandar a la vez sobre la misma cosa y sobre cosas distintas, así que no decidas eso del par entero: la distinción de arriba se aplica AL PAR DE FRASES que estés considerando. Recorre las frases y busca si hay ALGUNA de un texto y ALGUNA del otro que no se puedan cumplir a la vez. NO VALE RESPONDER «ya queda recogido en la pregunta 1» NI «no encuentro otro par de frases».')).toBe(true);
    expect(PREGUNTA_CERRADA).not.toContain('aunque las frases sean las mismas');
  });

  it('EL PROMPT: cada marca en su sitio, los textos tal cual (también con «$» o con una marca dentro), y la pareja siempre la 1', () => {
    const r = construirPrompt({ ...PAREJA, textoA: 'uno $& dos', textoB: 'trae {{CRITERIO_DEL_CUMPLIMIENTO}} dentro' }, 'EL CRITERIO');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // cada texto con su documento y su trozo delante (29/10): sin etiqueta, la pasada 2 intercambiaría quién dice qué
    expect(r.prompt.startsWith('PAREJA 1: NOR-10_x.docx, trozo 4 ↔ CLI-12_x.docx, trozo 3\n\nTEXTO 1 · NOR-10_x.docx, trozo 4:\nuno $& dos\n\nTEXTO 2 · CLI-12_x.docx, trozo 3:\ntrae {{CRITERIO_DEL_CUMPLIMIENTO}} dentro\n\n')).toBe(true);
    expect(r.prompt).toContain('PREGUNTA 2 · EL CUMPLIMIENTO\nEL CRITERIO\nHAY HALLAZGO SI LA RESPUESTA ES «NO»');
    expect(r.prompt).not.toMatch(/\{\{(N|DOC_1|TROZO_A|DOC_2|TROZO_B|TEXTO_A|TEXTO_B)\}\}/);
  });

  it('LA REPETICIÓN DE E3 (29/10): sólo la pareja de §3.1, NOR-10·4 ↔ CLI-12·3, en la condición realista, veinte veces (30/10)', () => {
    expect(PAREJAS_DE_E3.map(p => [TROZOS[p.analizado], TROZOS[p.candidato]].map(t => `${t.codigo}·${t.trozo}`))).toEqual([['NOR-10·4', 'CLI-12·3']]);
    expect(VECES_DE_E3).toBe(20);
  });

  it('LAS FIGURAS, contadas con y sin encabezados', () => {
    expect(contarFiguras('## 2.4. Coordinador de Calidad\nEl Coordinador de Calidad y el Director Clínico.')).toEqual({
      'Coordinador de Calidad': { total: 2, fueraDeEncabezados: 1 },
      'Director Clínico': { total: 1, fueraDeEncabezados: 1 },
    });
  });

  it('EL COSENO, y nulo cuando no se puede calcular', () => {
    expect(coseno([1, 0], [1, 0])).toBe(1);
    expect(coseno([1, 0], [0, 1])).toBe(0);
    expect(coseno([], [])).toBeNull();
    expect(coseno([1, 2], [1])).toBeNull();
    expect(coseno([0, 0], [1, 1])).toBeNull();
  });

  it('LA CORRESPONDENCIA POR TEXTO: igual, sin texto, o dónde se separan', () => {
    expect(correspondencia('abc', 'abc')).toEqual({ estado: 'igual' });
    expect(correspondencia(undefined, 'abc')).toEqual({ estado: 'sin_texto_en_el_vector' });
    expect(correspondencia('abX', 'abcd')).toEqual({ estado: 'distinto', separaEn: 2, largoVector: 3, largoBase: 4 });
  });

  it('LOS PUESTOS, desde 1, y nulo si no salió', () => {
    expect(puestos(['x', 'y', 'z'], ['z', 'w'])).toEqual({ z: 3, w: null });
  });

  it('LA VARIANTE LIMPIA: la pareja de §3.1, veinte veces (30/10), cada lado con la frase de D de su trozo', () => {
    expect(PAREJA_DE_LA_VARIANTE_LIMPIA).toEqual({ analizado: 'nor10_4', candidato: 'cli12_3' });
    expect(VECES_DE_LA_VARIANTE_LIMPIA).toBe(20);
    expect(MARCAS_DE_A).toEqual(['responsabilidad última', 'responsable último']);
  });

  it('LA FRASE QUE CONTIENE EL ANCLA: de punto a punto, sin cortar en «2.1», y hasta el salto de línea', () => {
    const t = 'Primera frase. Según el apartado 2.1, el cargo puede recaer en X. Tercera frase.';
    expect(fraseQueContiene(t, 'puede recaer')).toEqual({ ok: true, frase: 'Según el apartado 2.1, el cargo puede recaer en X.' });
    expect(fraseQueContiene('## 2.4 Cargo\nEl cargo puede recaer en X\nOtra línea.', 'puede recaer')).toEqual({ ok: true, frase: 'El cargo puede recaer en X' });
    expect(fraseQueContiene('El cargo puede recaer en X.', 'puede recaer')).toEqual({ ok: true, frase: 'El cargo puede recaer en X.' });
    expect(fraseQueContiene('Uno. El cargo puede recaer', 'puede recaer')).toEqual({ ok: true, frase: 'El cargo puede recaer' });
  });

  it('EL PASO 3: la pareja del quinto, NOR-11·13 ↔ CLI-12·13, veintiuna veces, con la frase de NOR-11 y las DOS de CLI-12', () => {
    expect([TROZOS[PAREJA_DEL_QUINTO.analizado], TROZOS[PAREJA_DEL_QUINTO.candidato]].map(t => `${t.codigo}·${t.trozo}`)).toEqual(['NOR-11·13', 'CLI-12·13']);
    expect(TROZOS.nor11_13.frase).toBe('revisa trimestralmente el cumplimiento');
    expect(TROZOS.cli12_13.frase).toBe('Las auditorías internas las realiza siempre');
    expect(VECES_DEL_QUINTO).toBe(21);
    expect(FRASES_DEL_QUINTO).toEqual({ analizado: ['revisa trimestralmente el cumplimiento'], candidato: ['personal ajeno al área auditada', 'no como auditor de su propia área'] });
  });

  it('LA D DE VERDAD: NOR-10·4 (§2.4) ↔ CLI-12·6 (§3.5), veintiuna veces, con las dos anclas de la siembra; NO es la pareja de E3', () => {
    expect([TROZOS[PAREJA_DE_D.analizado], TROZOS[PAREJA_DE_D.candidato]].map(t => `${t.codigo}·${t.trozo}`)).toEqual(['NOR-10·4', 'CLI-12·6']);
    expect(TROZOS.cli12_6.frase).toBe('nunca por el Director Clínico del propio centro');
    expect(VECES_DE_D).toBe(21);
    expect(FRASES_DE_D).toEqual({ analizado: ['puede recaer en el propio Director Clínico'], candidato: ['nunca por el Director Clínico del propio centro'] });
    // la del 36 de 40 es otra pareja (el principio del §3.1), y no se vuelve a llamar D
    expect(PAREJAS_DE_E3.map(p => p.candidato)).not.toContain(PAREJA_DE_D.candidato);
  });

  it('⚠️ LA NEGATIVA DURA: sin trozos, sin el número pedido o sin su frase, NO hay trozo; y con todo, sí', () => {
    const pedido = TROZOS.cli12_13;
    const bueno = { chunkIndex: 13, text: 'Las auditorías internas las realiza siempre personal ajeno al área auditada.' };
    expect(trozoConSuFrase([], pedido)).toEqual({ ok: false, error: 'CLI-12: la lectura de sus trozos vino vacía (o falló)' });
    expect(trozoConSuFrase([{ chunkIndex: 12, text: bueno.text }], pedido)).toEqual({ ok: false, error: 'CLI-12: no tiene trozo 13 (tiene 1)' });
    expect(trozoConSuFrase([{ chunkIndex: 13, text: 'El §4, el glosario.' }], pedido)).toEqual({ ok: false, error: 'CLI-12 trozo 13 NO contiene «Las auditorías internas las realiza siempre»: el número de trozo no corresponde al texto que se quería medir' });
    // control positivo: con el trozo bueno, lo devuelve
    expect(trozoConSuFrase([{ chunkIndex: 12, text: 'otro' }, bueno], pedido)).toEqual({ ok: true, trozo: bueno });
  });

  it.each(['quinto', 'd', 'd2', 'd3'])('⚠️ LA NEGATIVA DURA ES DURA: en la ruta %s, el 409 de los trozos va ANTES del ensayo y antes de llamar al modelo', nombre => {
    // los finales de línea, normalizados: con core.autocrlf el disco tiene CRLF y el repositorio LF (03/11, el commit de
    // esta prueba la puso en rojo al reescribir el fichero en CRLF)
    const leer = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    const ruta = leer(`app/api/admin/medida-f130/${nombre}/route.ts`);
    const negativa = ruta.indexOf("if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });");
    const ensayo = ruta.indexOf("if (req.nextUrl.searchParams.get('ensayo') === '1')");
    const modelo = ruta.indexOf('await preguntarAlJuez(');
    expect(negativa).toBeGreaterThan(-1);
    expect(ruta.indexOf('await leerTrozos(')).toBeGreaterThan(-1);
    expect(ruta.indexOf('await leerTrozos(')).toBeLessThan(negativa);
    expect(negativa).toBeLessThan(ensayo);
    expect(ensayo).toBeLessThan(modelo);
    // y la única llamada al modelo es ésa: ninguna antes de la negativa
    expect(ruta.split('preguntarAlJuez(').length - 1).toBe(1);
    // y `leerTrozos` pasa de verdad por la negativa: es lo que hace que el 409 de arriba exista
    const lectura = leer('app/api/admin/medida-f130/leer-de-la-base.ts');
    expect(lectura).toContain('const elegido = trozoConSuFrase(todos, pedido);\n    if (!elegido.ok) return { ok: false, error: elegido.error };');
  });

  it('LA FRASE NO SE ADIVINA: sin el ancla, con el ancla dos veces, o con A dentro, no hay frase', () => {
    expect(fraseQueContiene('Nada aquí.', 'puede recaer')).toEqual({ ok: false, motivo: 'el texto no contiene «puede recaer»' });
    expect(fraseQueContiene('Puede: puede recaer. Y puede recaer.', 'puede recaer')).toEqual({ ok: false, motivo: '«puede recaer» sale más de una vez' });
    expect(fraseQueContiene('Es el responsable último y puede recaer en X.', 'puede recaer')).toEqual({ ok: false, motivo: 'la frase de «puede recaer» lleva «responsable último»: A iría delante' });
    expect(fraseQueContiene('Lleva la responsabilidad última y puede recaer en X.', 'puede recaer').ok).toBe(false);
    // la marca de A en OTRA frase del trozo no la quita: eso es justo lo que se recorta
    expect(fraseQueContiene('El responsable último es Y. El cargo puede recaer en X.', 'puede recaer')).toEqual({ ok: true, frase: 'El cargo puede recaer en X.' });
  });
});
