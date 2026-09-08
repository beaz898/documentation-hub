/**
 * ¿HAY UN ORIGINAL EN LA NUBE QUE PUEDA PISAR ESTE DOCUMENTO? — B.202.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * UNA PREGUNTA, UNA FUNCIÓN, DOS LADOS. La contesta el servidor para vetar el
 * guardado (`index-text`) y para decírselo al cliente, que con eso decide si
 * pinta el botón. **Dos criterios para la misma pregunta es la forma que este
 * frente lleva la semana retirando**, y aquí se corrige antes de crearla: el
 * botón y el veto no pueden discrepar si preguntan a la misma línea.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ SE PREGUNTA POR `provider_file_id`, NO POR `source` — Y ESTO ANULA A
 * PROPÓSITO LA RAZÓN DECLARADA DE F-15.
 *
 * Aquel veto usaba una lista explícita —`google_drive`, `onedrive`— con este
 * argumento escrito al lado: *«Lista explícita (no "!== manual") para que un
 * proveedor futuro no quede vetado sin revisión»*. Es decir, falla ABIERTA a
 * propósito: un proveedor nuevo podría guardarse desde el modal hasta que
 * alguien se acordara de añadirlo a la lista.
 *
 * Se cambia, y la razón es la que este proyecto ya aprendió con la reparación
 * (`estado-de-reparacion.ts`: «EL ORIGEN NO DECIDE NADA AQUÍ»): **la condición
 * que importa no es de qué marca vino, sino si existe algo aguas arriba que
 * pueda pisarlo.** Un proveedor nuevo trae `provider_file_id` desde su primer
 * documento, así que queda protegido el día uno en vez de esperar a que alguien
 * revise una lista.
 *
 * El coste del cambio es real y se declara: si algún día existiera un documento
 * con `provider_file_id` cuyo original NO puede volver a pisarlo, este criterio
 * lo vetaría de más. Entre vetar de más —el usuario descarga y sube, que es un
 * rodeo— y vetar de menos —la corrección se pierde en el siguiente sync, en
 * silencio—, se veta de más.
 */

/** Lo mínimo que hace falta saber de una fila para contestar. */
export interface FilaConOrigen {
  provider_file_id?: string | null;
}

export function tieneOriginalEnLaNube(fila: FilaConOrigen | null | undefined): boolean {
  return typeof fila?.provider_file_id === 'string' && fila.provider_file_id.length > 0;
}
