// B.314 commit B (05/10/2026): cómo se pintan los solapamientos de un documento.
//
// Vive fuera del JSX por lo mismo que `mostrarAccionesDeFila`: el alcance de
// Vitest no admite React, y lo que decide la pantalla tiene que poder probarse.
//
// ⚠️ SÓLO PANTALLA. La unidad sigue siendo la ENTRADA (un `Problem` por
// pareja): lo que leen los tres prompts de ImprovementModal es su `description`,
// que no cambia, y «No es error» y «Solventar» actúan sobre la entrada entera.
// Por eso sus botones se quedan en la entrada y no se repiten en cada punto: un
// botón dentro de un punto parecería actuar sobre ese punto, y actuaría sobre
// todos. Descartar punto a punto es otra decisión (B.327).

import type { PuntoDeSolapamiento } from '@/lib/analysis/types';
import type { Problem } from './problems';

export type Severidad = 'alta' | 'media' | 'baja';

const ORDEN: Record<Severidad, number> = { baja: 0, media: 1, alta: 2 };

export interface CabeceraDelDocumento {
  /** Cuántas tarjetas hay debajo. `null` = no se pone número: hay una entrada
   *  sin lista que no es estructural (un análisis anterior al commit A, o el
   *  duplicado), y contarla como «1 punto» sería falso. */
  puntos: number | null;
  /** La más alta de sus entradas: el juez da una por pareja, y la estructural
   *  es «alta» de fábrica. `null` si ninguna la trae (el duplicado). */
  severidad: Severidad | null;
  /** Plegado por defecto salvo severidad alta. Sin severidad, desplegado: no
   *  hay con qué decidir esconderlo. */
  abiertoPorDefecto: boolean;
}

export function cabeceraDelDocumento(entradas: Problem[]): CabeceraDelDocumento {
  let puntos: number | null = 0;
  let severidad: Severidad | null = null;
  for (const e of entradas) {
    if (e.puntos && e.puntos.length > 0) { if (puntos !== null) puntos += e.puntos.length; }
    else if (e.estructural) { if (puntos !== null) puntos += 1; }
    else puntos = null;
    if (e.severidad && (severidad === null || ORDEN[e.severidad] > ORDEN[severidad])) severidad = e.severidad;
  }
  return { puntos, severidad, abiertoPorDefecto: severidad === null || severidad === 'alta' };
}

export interface TarjetaDePunto extends PuntoDeSolapamiento {
  clave: string;
  /** Lo que recibe el salto del editor: la misma entrada con la cita de ESTE
   *  punto. `goToProblem` sólo lee `textRef`, así que el tercer punto lleva al
   *  tercer sitio sin tocar el editor. `null` si el punto no trae cita de este
   *  lado: entonces no hay nada que clicar. */
  salto: Problem | null;
  /** B.328: hay cita, pero no se encontró en el texto. La tarjeta la enseña y
   *  dice que no se puede señalar, sin nada que clicar. */
  noSenalable: boolean;
}

/** Lo que hace un clic en el CUERPO de la tarjeta de un punto (05/10/2026: la
 *  tarjeta entera se clica, como la de una contradicción). `undefined` = no
 *  se clica: sin cita, o `noSenalable`. Un solo disparo, y es éste. */
export function clicDeLaTarjeta(tarjeta: TarjetaDePunto, onGoToProblem: (p: Problem) => void): (() => void) | undefined {
  const salto = tarjeta.salto;
  return salto ? () => onGoToProblem(salto) : undefined;
}

/** Las tarjetas de una entrada, en el orden del juez. `null` = la entrada no
 *  trae lista y se pinta como siempre, en un bloque. */
export function tarjetasDeLaEntrada(p: Problem): TarjetaDePunto[] | null {
  if (!p.puntos || p.puntos.length === 0) return null;
  return p.puntos.map((punto, i) => {
    const hayCita = punto.citaNuevo.trim().length > 0;
    const { localizable, ...elPunto } = punto;
    return {
      ...elPunto,
      clave: `${p.id}-p${i}`,
      salto: hayCita && localizable !== false ? { ...p, textRef: punto.citaNuevo } : null,
      noSenalable: hayCita && localizable === false,
    };
  });
}
