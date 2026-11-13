import { marcasDe } from './brazos';
import { OPCIONES, POSITIVO, opcionLaxa, type BrazoDeClaridad } from './regla-laxa';
import { puertaDeValidez } from './regla-de-validez';

// la regla laxa, CONGELADA en su propio fichero (regla-laxa.ts, con su huella fijada por regla-laxa.test.ts)
export { OPCIONES, POSITIVO, opcionLaxa, primeraLineaSinSignos, positivoLaxo, type BrazoDeClaridad } from './regla-laxa';

/**
 * LA TANDA DE CLARIDAD, EL PASO 1 DEL PLAN DE FABLE (adenda 3, 12/11/2026; `claude/consultas-fable/F-130_2026-11-12_adenda-3-y-respuesta.md`).
 * ⚠️⚠️ DESDE EL 13/11 YA NO DECIDE LA CLARIDAD: LA DECIDIERON LOS LECTORES. Las tres lecturas en papel coinciden en que NO es una
 * contradicción (el §3.1 asigna a un cargo y explica el motivo; no prohíbe acumular los dos cargos). La tanda pasa a ser una
 * COMPROBACIÓN DE CALIBRACIÓN: ¿marca el modelo lo que tres profesionales dicen que no es un problema? UN SOLO DÍA, 42 por brazo; la
 * decisión sobre 84 se retiró. Y un TERCER BRAZO PRIMARIO, `tres_parrafos` (`textosTresParrafos`): con el §3.5 delante, lo que ve el
 * producto. Lo de abajo sobre «decide N» y los umbrales de 84 queda como historia de cómo se montó.
 * TEMPORAL como toda la carpeta. NO ES UN DIAGNÓSTICO NI UN CAMBIO CANDIDATO: mide una propiedad del CASO, no del juez. Mide si D
 * se deduce sin duda con las dos frases delante, no si el juez la encuentra. Regla del director, la del producto desde el 01/11:
 * sólo se firma lo que se deduce sin duda leyendo las dos frases; en caso de duda, no se marca.
 * MONTAJE (Fable): el mismo modelo y el mismo esfuerzo que el juez (`modeloDelJuez`), SIN el prompt del juez, una llamada nueva por
 * tirada; sólo dos párrafos, el Texto 1 (NOR-10 §2.4) sin las frases de A. CUATRO BRAZOS (arquitecto, 12/11; ver `textosPrimarios`):
 *   · PRIMARIOS, los que deciden: §2.4 (sin A) ↔ CLI-12 §3.1 ENTERO; N y R, dos días cada uno, decisión sobre 84.
 *   · SECUNDARIOS: §2.4 (sin A) ↔ CLI-12 §3.5 (`textosDeClaridad`); N y R, UN SOLO DÍA, 42; puntúan P-A3-4 y P-A3-5 de Fable.
 *   · Brazo N, neutro: `PREGUNTA_N`. Positivo: CONFLICTO. Brazo R, con la regla del producto: `PREGUNTA_R`. Positivo: NO PUEDE.
 * ⚠️ LA ETIQUETA DE D, corregida el 12/11 (corrección de etiqueta, no de medida): la pareja operativa es §2.4 ↔ §3.1; el §3.5 la remite
 * («la separación de funciones descrita en el apartado 3.1»). Las cadenas de medida decían «§2.4 ↔ §3.5».
 * LAS DOS PREGUNTAS SON DE FABLE, LITERALES, SIN TOCAR UNA PALABRA (una prueba las busca en el texto archivado).
 * ⚠️ LO QUE ES NUESTRO, y se declara: el encuadre de los dos textos («Texto 1:» y «Texto 2:», entre comillas triples; el brazo R
 * habla de «Texto 1» y «Texto 2», así que las etiquetas hacen falta, y el Texto 1 es el permiso); que de cada sección va SÓLO EL
 * PÁRRAFO que contiene el ancla de D, sin el título; y la regla con que se quitan las frases de A (`sinFrasesDeA`).
 * LA CUENTA (Fable): sólo la primera línea. Positivo es CONFLICTO en N y NO PUEDE en R; todo lo demás cuenta en contra, incluidos
 * DEPENDE y cualquier respuesta sin la palabra. No se piden citas. ⚠️ SE CUENTA DE DOS MANERAS Y SE PUBLICAN LAS DOS, prerregistrado
 * por el arquitecto el 12/11 antes de pulsar («medir así mide obediencia al formato, no claridad»):
 *   · PRIMARIA, LAXA: la primera línea no vacía, en mayúsculas, sin tildes y sin signos, EMPIEZA por una de las palabras permitidas
 *     (como palabra entera) y NO CONTIENE ninguna de las otras dos. «CONFLICTO: el texto 1 permite…» cuenta como CONFLICTO;
 *     «CONFLICTO o DEPENDE» es indecidible y cuenta en contra.
 *   · SECUNDARIA, ESTRICTA (la de Fable): la primera línea, sin formato, comillas ni la puntuación del final, es EXACTAMENTE la palabra.
 * ⚠️ DECIDE N, R ES CONTROL (arquitecto, 12/11): con la pregunta R corregida, R pregunta si la lógica se sostiene una vez enmarcada, y
 * queda casi en el techo por construcción; un brazo en el techo no decide. Así que DECIDE el brazo N primario sobre 84, con los umbrales
 * de abajo y la cuenta laxa, más las lecturas humanas; R es CONTROL (`controlDeR`, sobre el día 1 y antes del día 2): menos de 30 de 42
 * y el control FALLA, N no se lee y no se pulsa el día 2; de 30 a 37, ALTO, NO TECHO: no requiere explicación, sólo se publica; 38 o más, lo previsto. R no sube
 * ni baja la decisión. Y EN N, PRIMERO LA PUERTA DE VALIDEZ (`regla-de-validez.ts`): si más de uno de cada cinco
 * CONFLICTO se explica por otra cosa que D, N no se lee, diga lo que diga; DESPUÉS, la cuenta.
 * LA DECISIÓN (arquitecto, 12/11, con los umbrales de Fable), SÓLO CON EL N PRIMARIO: se pulsan DOS DÍAS SIEMPRE, 42 cada día, y se decide
 * UNA SOLA VEZ, sobre 84 por brazo, con la cuenta laxa: ≥68 clara (el 81,0 %, el umbral de segunda etapa de Fable), ≤60 no clara (el
 * 71,4 %, su tasa de un día escalada), en medio ZONA GRIS. Un día solo no decide nada. La zona gris NO se repite y queda A JUICIO DEL
 * DIRECTOR (su decisión, 12/11 13:05), con el procedimiento prerregistrado: elige entre CERRAR y SEGUIR AL PASO 2, sin tercera opción,
 * con los dos brazos sobre 84, las lecturas en papel y la tabla del prerregistro delante (Predicciones_34_Conflicto_Normativo.md).
 * ⚠️ LA LECTURA EN PAPEL VA ANTES DE LA PRIMERA PULSACIÓN CON MODELO, no sólo antes de ver el resultado: las respuestas en papel se
 * archivan ANTES de que se pulse Claridad N o R con modelo. Si el juicio del director viene anclado por un número del modelo, ya no es
 * independiente, y es lo que decide.
 * ⚠️ El 74 que hubo aquí (el 88,1 %) fue un error del arquitecto, corregido por él el 12/11: exigir la misma tasa con el doble de datos
 * es una prueba más dura, no igual; con más datos se puede aceptar una tasa observada menor para la misma confianza.
 */

export const PREGUNTA_N = 'Los dos textos son de la misma organización y están vigentes a la vez. ¿Hay un conflicto entre lo que establecen? Responde en la primera línea con una sola palabra: CONFLICTO, COMPATIBLES o DEPENDE. Después explica tu respuesta en tres frases como máximo.';
export const PREGUNTA_R = 'El Texto 1 permite algo. Si una clínica hace uso de ese permiso, ¿puede cumplir al mismo tiempo lo que establece el Texto 2? No vale responder que basta con no usar el permiso. Responde en la primera línea con una sola de estas opciones: NO PUEDE, SÍ PUEDE o DEPENDE. Después explica tu respuesta en tres frases como máximo.';

export const TIRADAS_POR_BRAZO = 42;

/** Las anclas de D, una por lado: el párrafo que la contiene es el que entra. */
export const ANCLAS = { texto1: 'puede recaer en el propio Director Clínico', texto2: 'nunca por el Director Clínico del propio centro' } as const;

/** El párrafo (lo que va entre dos saltos de línea) que contiene el ancla. Tiene que salir una vez. */
export function parrafoQueContiene(texto: string, ancla: string): { ok: true; parrafo: string } | { ok: false; motivo: string } {
  const parrafos = texto.split(/\n+/).map(p => p.trim()).filter(p => p.includes(ancla));
  if (parrafos.length !== 1) return { ok: false, motivo: `«${ancla}» sale en ${parrafos.length} párrafos, y tiene que salir en uno` };
  return { ok: true, parrafo: parrafos[0] };
}

/** El párrafo sin las frases que llevan una marca de A (`brazos.ts`). Una frase acaba en punto seguido de espacio, o al final. */
export function sinFrasesDeA(parrafo: string): { texto: string; quitadas: string[] } {
  // se corta sólo en el espacio que sigue a un punto: «apartado 3.1.» no parte la frase en «3.» y «1.»
  const frases = parrafo.split(/(?<=\.)\s+/).map(f => f.trim()).filter(Boolean);
  const deA = (f: string) => marcasDe(f).some(m => m.startsWith('A:'));
  return { texto: frases.filter(f => !deA(f)).join(' '), quitadas: frases.filter(deA) };
}

/** Los dos textos de la tanda, o la negativa: cada uno con su ancla de D y SIN ninguna marca de A. */
export function textosDeClaridad(trozoNor: string, trozoCli: string):
  { ok: true; texto1: string; texto2: string; quitadas: string[] } | { ok: false; motivo: string } {
  const p1 = parrafoQueContiene(trozoNor, ANCLAS.texto1), p2 = parrafoQueContiene(trozoCli, ANCLAS.texto2);
  if (!p1.ok) return { ok: false, motivo: `Texto 1: ${p1.motivo}` };
  if (!p2.ok) return { ok: false, motivo: `Texto 2: ${p2.motivo}` };
  const t1 = sinFrasesDeA(p1.parrafo), t2 = sinFrasesDeA(p2.parrafo);
  for (const [n, t, ancla] of [['Texto 1', t1.texto, ANCLAS.texto1], ['Texto 2', t2.texto, ANCLAS.texto2]] as const) {
    if (!t.includes(ancla)) return { ok: false, motivo: `${n}: al quitar las frases de A se ha ido el ancla de D` };
    const deA = marcasDe(t).filter(m => m.startsWith('A:'));
    if (deA.length) return { ok: false, motivo: `${n}: sigue llevando marcas de A (${deA.join(', ')})` };
  }
  return { ok: true, texto1: t1.texto, texto2: t2.texto, quitadas: [...t1.quitadas, ...t2.quitadas] };
}

/**
 * LAS DOS PAREJAS (arquitecto, 12/11). PRIMARIA, la que decide: §2.4 (sin A) ↔ §3.1 ENTERO, porque es la pareja por la que publica el
 * producto (las 6 D medidas con su prompt citan el §3.1). SECUNDARIA: §2.4 (sin A) ↔ §3.5, la de `textosDeClaridad`, que NO SE TOCA (las
 * predicciones P-A3-4 y P-A3-5 de Fable se escribieron sobre ella, y sobre 42). La cirugía va SÓLO en el Texto 1: el §3.1 entra con sus
 * dos frases, la de A del lado CLI-12 incluida, porque A sigue sin poder formarse (su lado NOR-10, el §2.1, no se entrega, y la frase
 * del §2.4 que lo traía por referencia es la que se quita). Con las dos frases del §3.1, D está entera: el responsable es «el Coordinador
 * de Calidad, no el Director Clínico», el Coordinador «puede recaer en el propio Director Clínico», y la frase 2 da el principio.
 */
export type ParejaDeClaridad = 'primaria' | 'secundaria' | 'tres_parrafos';
export const ANCLA_DEL_3_1 = 'separar la responsabilidad';
/** Lo que delata el §2.1 de NOR-10 (el lado NOR de A), que no puede entrar en ningún texto. */
export const RASTROS_DEL_2_1 = ['responsable último del cumplimiento de este protocolo', 'no es delegable', 'retirar del servicio', 'apartado 2.1'] as const;

/** Los dos textos de la pareja PRIMARIA, o la negativa. NEGATIVAS (arquitecto): el Texto 2 contiene la frase con «no el Director
 *  Clínico» y la de «separar la responsabilidad»; el Texto 1, ninguna marca de A; ninguno de los dos, nada del §2.1 de NOR-10. */
export function textosPrimarios(trozoNor: string, trozoCli31: string):
  { ok: true; texto1: string; texto2: string; quitadas: string[] } | { ok: false; motivo: string } {
  const p1 = parrafoQueContiene(trozoNor, ANCLAS.texto1), p2 = parrafoQueContiene(trozoCli31, ANCLA_DEL_3_1);
  if (!p1.ok) return { ok: false, motivo: `Texto 1: ${p1.motivo}` };
  if (!p2.ok) return { ok: false, motivo: `Texto 2: ${p2.motivo}` };
  // Dos de las negativas del arquitecto se cumplen POR CONSTRUCCIÓN y no se vuelven a comprobar (una comprobación que no puede saltar
  // decora; lo cazaron dos mutantes vivos): el Texto 1 no lleva marcas de A porque `sinFrasesDeA` quita toda frase que tenga una, con la
  // misma `marcasDe`; y el Texto 2 contiene «separar la responsabilidad» porque es el párrafo que se eligió por contenerla.
  const t1 = sinFrasesDeA(p1.parrafo), texto2 = p2.parrafo;
  if (!t1.texto.includes(ANCLAS.texto1)) return { ok: false, motivo: 'Texto 1: al quitar las frases de A se ha ido el ancla de D' };
  if (!texto2.includes('no el Director Clínico')) return { ok: false, motivo: 'Texto 2: no contiene la frase con «no el Director Clínico» (A del lado CLI-12)' };
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  for (const [n, t] of [['Texto 1', t1.texto], ['Texto 2', texto2]] as const) {
    const del21 = RASTROS_DEL_2_1.filter(r => norm(t).includes(norm(r)));
    if (del21.length) return { ok: false, motivo: `${n}: lleva rastros del §2.1 de NOR-10 (${del21.join(', ')})` };
  }
  return { ok: true, texto1: t1.texto, texto2, quitadas: t1.quitadas };
}

/**
 * EL TERCER BRAZO PRIMARIO, LOS TRES PÁRRAFOS (arquitecto, 13/11): §2.4 (sin A) ↔ §3.1 entero + §3.5 entero, que es lo que ve el producto
 * y lo que los lectores NO vieron. El §3.1 y el §3.5 son del mismo documento (CLI-12), así que van juntos en el Texto 2, en ese orden y
 * separados por una línea en blanco. Sólo con la pregunta N. Si con el §3.5 delante el modelo cambia de respuesta, el caso D en producción
 * se apoya en esa prohibición («nunca por el Director Clínico del propio centro», acotada a las sustituciones) y no en el principio, y hay
 * que volver a preguntar a los lectores con los tres párrafos. NEGATIVAS: las de la primaria; que el §3.5 entre; y que siga sin entrar
 * nada del §2.1 de NOR-10.
 */
export function textosTresParrafos(trozoNor: string, trozoCli31: string, trozoCli35: string):
  { ok: true; texto1: string; texto2: string; quitadas: string[] } | { ok: false; motivo: string } {
  const p = textosPrimarios(trozoNor, trozoCli31);
  if (!p.ok) return p;
  const p35 = parrafoQueContiene(trozoCli35, ANCLAS.texto2);
  if (!p35.ok) return { ok: false, motivo: `Texto 2 (§3.5): ${p35.motivo}` };
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const del21 = RASTROS_DEL_2_1.filter(r => norm(p35.parrafo).includes(norm(r)));
  if (del21.length) return { ok: false, motivo: `Texto 2 (§3.5): lleva rastros del §2.1 de NOR-10 (${del21.join(', ')})` };
  return { ok: true, texto1: p.texto1, texto2: `${p.texto2}\n\n${p35.parrafo}`, quitadas: p.quitadas };
}

/**
 * LA PREGUNTA R DE LA PAREJA PRIMARIA, CORREGIDA. El defecto (Fable, 12/11): la original dice «el Texto 1 permite algo», y el Texto 1
 * permite DOS cosas (el propio Director o otro profesional designado), así que «DEPENDE de a quién se designe» sería correcta y contaría
 * en contra. LA PROCEDENCIA (arquitecto, 13/11): Fable escribió SÓLO la primera frase («El Texto 1 permite que el Coordinador de Calidad
 * sea el propio Director Clínico. Si una clínica hace uso de ese permiso, ¿puede cumplir…?», con puntos suspensivos, en su respuesta
 * rápida del 12/11). Así que la pregunta es SU PRIMERA FRASE, literal, más EL RESTO DE `PREGUNTA_R` SIN TOCAR UNA LETRA; la unión es
 * nuestra, y es la única parte nuestra. Se construye sustituyendo la primera frase, para que el resto no pueda separarse, y una prueba
 * lo fija. La secundaria conserva la original (`PREGUNTA_R`): P-A3-4 se escribió sobre ella.
 */
export const FRASE_1_DE_FABLE_PARA_R = 'El Texto 1 permite que el Coordinador de Calidad sea el propio Director Clínico.';
export const FRASE_1_DE_PREGUNTA_R = 'El Texto 1 permite algo.';
export const PREGUNTA_R_PRIMARIA = PREGUNTA_R.replace(FRASE_1_DE_PREGUNTA_R, FRASE_1_DE_FABLE_PARA_R);

/** EL CONTROL DEL BRAZO R PRIMARIO (arquitecto, 13/11), sobre EL DÍA 1, sobre 42, con la cuenta laxa, antes de gastar el día 2. No es
 *  la predicción de Fable: salta sólo si el montaje está roto. < 30 FALLA (N no se lee y no se pulsa el día 2); 30 a 37, ALTO, NO
 *  TECHO: no requiere explicación, sólo se publica (13/11: un montaje perfecto cae ahí el 41 % de las veces con una tasa real del 90 %
 *  y el 88 % con una del 80 %; no es una anomalía, es variación normal); ≥ 38, lo previsto (P-A3-7). Al final, también sobre 84. */
export function controlDeR(positivosDelDia1: number): 'falla' | 'alto_no_techo' | 'previsto' {
  return positivosDelDia1 < 30 ? 'falla' : positivosDelDia1 < 38 ? 'alto_no_techo' : 'previsto';
}

/** El prompt de una tirada: los dos textos y la pregunta del brazo; la R depende de la pareja. La N es la misma en las dos. */
export function promptDeClaridad(brazo: BrazoDeClaridad, texto1: string, texto2: string, pareja: ParejaDeClaridad): string {
  const pregunta = brazo === 'n' ? PREGUNTA_N : pareja === 'primaria' ? PREGUNTA_R_PRIMARIA : PREGUNTA_R;
  return `Texto 1:\n"""\n${texto1}\n"""\n\nTexto 2:\n"""\n${texto2}\n"""\n\n${pregunta}`;
}

/** La primera línea no vacía, limpia como dice la cabecera. */
export function primeraLinea(respuesta: string): string {
  const linea = respuesta.split('\n').map(l => l.trim()).find(l => l !== '') ?? '';
  return linea.replace(/[*_#`>«»"'“”]/g, '').trim().replace(/[.:;,!]+$/, '').trim()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().replace(/\s+/g, ' ');
}

/** El veredicto de una tirada, con las dos cuentas: la laxa (primaria) y la estricta (la de Fable). */
export function veredicto(brazo: BrazoDeClaridad, respuesta: string) {
  const linea = primeraLinea(respuesta), laxa = opcionLaxa(brazo, respuesta);
  const estricta = OPCIONES[brazo].includes(linea) ? linea : 'OTRA';
  return { linea, laxa, positivoLaxo: laxa === POSITIVO[brazo], estricta, positivoEstricto: linea === POSITIVO[brazo] };
}


/** La cuenta de una tanda (un día): las dos cuentas y por opción. Un día no decide: la decisión es sobre los dos (`decisionSobre84`). */
export function contarClaridad(brazo: BrazoDeClaridad, respuestas: string[], pareja?: ParejaDeClaridad) {
  const v = respuestas.map(r => veredicto(brazo, r));
  const porOpcion = (k: 'laxa' | 'estricta') => { const o: Record<string, number> = {}; for (const x of v) o[x[k]] = (o[x[k]] ?? 0) + 1; return o; };
  const laxos = v.filter(x => x.positivoLaxo).length, estrictos = v.filter(x => x.positivoEstricto).length;
  return {
    tiradas: v.length,
    // en el brazo N, la PUERTA DE VALIDEZ (regla-de-validez.ts) va primero: se lee antes que la cuenta, y si no es válida, N no se lee
    ...(brazo === 'n' ? { puertaDeValidez: puertaDeValidez(respuestas.filter((_, i) => v[i].positivoLaxo)) } : {}),
    // en el brazo R PRIMARIO, el control del día (`controlDeR`): si falla, N no se lee y no se pulsa el día 2
    ...(brazo === 'r' && pareja === 'primaria' ? { controlDeR: v.length === TIRADAS_POR_BRAZO ? controlDeR(laxos) : 'tanda_incompleta' as const } : {}),
    primaria: { regla: 'laxa', positivos: laxos, porOpcion: porOpcion('laxa') },
    secundaria: { regla: 'estricta (Fable)', positivos: estrictos, porOpcion: porOpcion('estricta') },
  };
}
