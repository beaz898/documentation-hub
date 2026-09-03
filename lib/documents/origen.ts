/**
 * DE DÓNDE VIENE UN DOCUMENTO, Y QUÉ SE PUEDE HACER CON ÉL (B.162).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. `ingest` decidía qué documentos son «reemplazables a mano» DOS
 * VECES y en dos lenguajes —`.or('source.is.null,source.neq.google_drive')` en
 * PostgREST y `.filter(d => d.source !== 'google_drive')` en JavaScript—, y la
 * interfaz lo decidía una TERCERA vez con OTRA lista: `{'google_drive',
 * 'onedrive'}`.
 * Resultado: un documento de OneDrive se pinta bajo «Drive» y el reemplazo lo
 * trata como manual — se queda con su id y le vacía la procedencia, o lo borra
 * entero. Y el aviso que el usuario acepta antes de reemplazar dice literalmente
 * que los documentos de Drive con el mismo nombre no se tocan.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL FALLO NO ERA «FALTA UN VALOR EN LA LISTA», ERA QUE HABÍA TRES LISTAS.
 * Añadir `'onedrive'` a las dos primeras habría arreglado el caso de hoy y
 * dejado la forma intacta: el día que el registro de proveedores gane un
 * tercero, vuelve. Por eso el criterio se implementa UNA VEZ y aquí, y los tres
 * sitios preguntan.
 *
 * ⚠️ ESTE MÓDULO NO IMPORTA NADA, y es a propósito: lo usa también el cliente
 * (`DocumentsSidebar`), y la alternativa —derivar la lista de
 * `lib/drive/registry.ts`— arrastraría al navegador los proveedores enteros y
 * los extractores que ellos importan. La lista se ATA al registro desde los
 * casos, que sí pueden importar los dos: si alguien añade un proveedor y no toca
 * esta lista, el caso se pone rojo. Es F-96 P3 — dos sistemas que deben
 * coincidir necesitan un punto que compruebe que coinciden.
 */

/**
 * Los orígenes SINCRONIZADOS: los que tienen una fuente de verdad fuera de esta
 * aplicación. Espejo de las claves de `providers` en `lib/drive/registry.ts`.
 */
export const ORIGENES_SINCRONIZADOS = ['google_drive', 'onedrive'] as const;

/**
 * ¿Viene este documento de un proveedor externo?
 *
 * ⚠️ LO DESCONOCIDO CUENTA COMO NO SINCRONIZADO —`null`, la cadena vacía, un
 * valor con errata—, y eso es FALLO ABIERTO en el camino de una operación
 * destructiva, que es lo que esta casa prohíbe por defecto. Se declara y va con
 * su razón:
 * el criterio tiene que ser EL MISMO que el de la pantalla, y la pantalla enseña
 * como manual todo lo que no está en la lista, incluido el `null` de las filas
 * viejas. Un criterio que fallara cerrado protegería documentos que la interfaz
 * llama manuales y que el usuario espera poder reemplazar — y volveríamos a
 * tener dos verdades, que es exactamente el fallo del que sale este módulo.
 * EL ACUERDO CON LO QUE EL USUARIO VE PESA MÁS QUE LA GUARDA, aquí y solo aquí.
 */
export function esOrigenSincronizado(source: string | null | undefined): boolean {
  return typeof source === 'string'
    && (ORIGENES_SINCRONIZADOS as readonly string[]).includes(source);
}

/**
 * ¿Puede una subida manual con el mismo nombre REEMPLAZAR a este documento?
 *
 * NO para los sincronizados: su fuente de verdad está fuera, coexisten con los
 * manuales del mismo nombre, y su corrección vuelve POR el proveedor. Es la
 * promesa que el aviso de reemplazo le hace al usuario.
 */
export function esReemplazableAMano(source: string | null | undefined): boolean {
  return !esOrigenSincronizado(source);
}
