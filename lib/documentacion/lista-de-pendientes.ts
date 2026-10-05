/**
 * LA OTRA MITAD DE LA NUMERACIÓN B.n (06/10/2026).
 *
 * La numeración es UNA sola repartida en dos ficheros: B.1 a B.194 viven en
 * `Puntos_Pendientes_Doclity.txt` y B.195 en adelante en
 * `claude/Estado_Del_MVP.md` (cabecera de la lista, v53). El chequeo de forma
 * solo conocía el segundo, así que toda cita a una entrada del primero contaba
 * como `ficha_sin_casa`: un defecto del instrumento, no del documento.
 *
 * ⚠️ NO HAY RANGO DE NÚMEROS, a propósito: un «n <= 194» se pudriría el día que
 * alguien escriba una entrada en el fichero equivocado. Se busca la ENTRADA de
 * verdad, con el mismo formato con que la lista las escribe.
 */

import type { Violacion } from './invariantes-de-estado';

export const RUTA_DE_LA_LISTA_DE_PENDIENTES = 'Puntos_Pendientes_Doclity.txt';

/**
 * UNA ENTRADA de la lista: la línea que la abre. La marca de estado es opcional
 * (`[ ]`, `[✓]` hasta B.50; ninguna desde B.51), luego el número y, antes de la
 * raya, como mucho un prefijo corto que puede nombrar otro número
 * («[✓] B.3 Fase 2 + B.10 — …»: la entrada es de las dos).
 * Las menciones en prosa, en viñetas («· B.82 — …») o en el orden de trabajo
 * («B.122 → Frente 2») NO son entradas: apuntan, no declaran.
 */
const ENTRADA = /^\s*(?:\[[^\]]{1,2}\]\s*)?(B\.\d{1,4}\b.{0,40}?)\s—\s/;
const NUMERO = /\bB\.(\d{1,4})\b/g;

/** Las fichas que tienen ENTRADA en la lista, como `B.86`. */
export function fichasConEntradaEnLaLista(texto: string): Set<string> {
  const fichas = new Set<string>();
  for (const linea of texto.split(/\r?\n/)) {
    const m = ENTRADA.exec(linea);
    if (!m) continue;
    for (const n of m[1].matchAll(NUMERO)) fichas.add(`B.${n[1]}`);
  }
  return fichas;
}

/**
 * Lo que el chequeo recibe de la lista. `texto` undefined = se intentó leer y no
 * se pudo: entonces NO concede casa a nadie, y lo dice (falla cerrada).
 */
export interface ListaDePendientes {
  ruta: string;
  texto: string | undefined;
}

/**
 * LA REGLA (I1 ampliado, 06/10/2026): una cita «B.n» en el documento de estado
 * tiene casa si tiene su título allí, O si existe una entrada con ese número en
 * la lista. La lista solo se consulta cuando NO hay casa en el documento: si
 * contara como una casa más, cada fila del tablero que indexa una entrada de la
 * lista (B.187, B.190…) se volvería «dos casas» de golpe.
 *
 * ⚠️ B.112 SE ACEPTA SIN RESOLVER. El número se usó dos veces, una en cada
 * fichero —es el choque escrito en la cabecera de la lista—, y una cita a B.112
 * encuentra casa en el documento de estado y no llega a mirar la lista. El
 * chequeo no puede saber cuál de las dos se quiso decir, y no lo finge: el
 * choque está declarado allí, no resuelto aquí.
 *
 * Devuelve las fichas con entrada. Si la lista no se pudo leer, anota UNA
 * violación que lo dice y devuelve vacío: ninguna cita se da por buena por ella.
 */
export function fichasDeLaLista(
  lista: ListaDePendientes | undefined,
  violaciones: Violacion[],
): Set<string> {
  if (!lista) return new Set();
  if (lista.texto === undefined) {
    violaciones.push({
      clase: 'casa_externa_ausente',
      linea: 1,
      texto: `no se pudo leer ${lista.ruta}: ninguna cita se da por buena por la lista`,
    });
    return new Set();
  }
  return fichasConEntradaEnLaLista(lista.texto);
}
