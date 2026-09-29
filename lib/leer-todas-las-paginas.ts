/**
 * LEER TODAS LAS FILAS DE UNA CONSULTA, PÁGINA A PÁGINA (B.297, 29/09/2026).
 *
 * Supabase corta cada respuesta en el tope de filas del proyecto (Max Rows, en el
 * panel: 1.000 el 29/09) y lo hace SIN ERROR: una consulta que pase del tope
 * vuelve incompleta y nadie se entera. El tope vive fuera del código y puede
 * cambiar sin tocar el repositorio, así que no se supone: se hace irrelevante.
 *
 * Por eso el bucle avanza por las filas RECIBIDAS y se para en una página VACÍA,
 * no en una «corta». Si el tope bajara por debajo de `tamano`, una página llena
 * vendría corta, y parar ahí dejaría filas sin leer. Cuesta una ida más, la de
 * la página vacía.
 *
 * Quien llama pone un orden ÚNICO (una clave única): con un orden que se repite,
 * las páginas por desplazamiento pueden saltarse o repetir filas.
 *
 * Un error en CUALQUIER página devuelve el error, nunca lo leído hasta ahí: medio
 * resultado es justo lo que esto existe para no devolver.
 */

/** Tamaño de página pedido. Da igual que el tope sea menor: el bucle avanza por lo recibido. */
export const TAMANO_DE_PAGINA = 1000;

/** Freno contra un servidor que ignorase `range` y devolviera siempre lo mismo. */
export const MAXIMO_DE_PAGINAS = 10_000;

type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function leerTodasLasPaginas<T>(
  pedir: (desde: number, hasta: number) => Pagina<T>,
  tamano: number = TAMANO_DE_PAGINA,
): Promise<{ data: T[]; error: null } | { data: null; error: { message: string } }> {
  const todas: T[] = [];
  for (let paginas = 0; paginas < MAXIMO_DE_PAGINAS; paginas++) {
    const desde = todas.length;
    const { data, error } = await pedir(desde, desde + tamano - 1);
    if (error) return { data: null, error };
    if (!data || data.length === 0) return { data: todas, error: null };
    todas.push(...data);
  }
  return { data: null, error: { message: `más de ${MAXIMO_DE_PAGINAS} páginas: la consulta no avanza` } };
}
