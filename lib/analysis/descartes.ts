import type { SupabaseClient } from '@supabase/supabase-js';
import { huellaDeProsa } from './huella-hallazgo';

/**
 * LOS DESCARTES DEL USUARIO, POR ORGANIZACIÓN Y PERMANENTES (F-86 paso 3).
 *
 * QUÉ ARREGLA. Hasta hoy el «No es error» vivía en un `useRef<Set<string>>` del
 * cliente y moría al recargar. F-67 dice que la legitimidad de una divergencia
 * la decide el usuario y **su decisión vale**; sin esto valía hasta que cerrara
 * la pestaña. No lo rompimos nosotros: nunca estuvo entero.
 *
 * LA HUELLA SE CALCULA SOLO AQUÍ, en servidor, como manda F-86. El cliente
 * manda las COORDENADAS del hallazgo —las dos citas y el id del documento del
 * corpus— y el servidor las convierte en identidad. Que el cliente no pueda
 * fabricar huellas es lo que impide que se invente descartes ajenos.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SOLO LA ESPECIE PROSA, HOY, y no por olvido.
 *
 * `huellaDeHallazgo` (la tabular) exige `tabla` y `claveCruda` POR LADO, y la
 * discrepancia que sale del pipeline no las lleva: transporta `columns`,
 * `comparedValues` y las dos filas en crudo (F-69/F-70), pero ni el `tableId`
 * ni la clave. Su productor natural es la emisión del diff, que es el commit
 * siguiente. La tabla ya admite `kind='tabular'` para que ese día no haya que
 * migrar nada.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** La tabla. Un solo sitio: si cambia el nombre, cambia aquí. */
const TABLA = 'finding_dismissals';

/**
 * Lo que hace falta para identificar un descarte de PROSA. Son las coordenadas
 * que el cliente sí tiene sin necesitar ningún id del documento nuevo — que es
 * la propiedad entera del diseño de F-87 P2.
 */
export interface CoordenadasDeProsa {
  /** `documents.id` del documento del corpus (el lado «existente»). */
  existingDocumentId: string;
  /** La cita del documento en revisión, en crudo. */
  newDocSays: string;
  /** La cita del documento del corpus, en crudo. */
  existingDocSays: string;
}

/**
 * La huella de un descarte de prosa, o `null` si falta algo para calcularla.
 *
 * DEVUELVE null EN VEZ DE LANZAR, y es deliberado: quien llama está en mitad de
 * un análisis o de una indexación, y tumbarlos porque un hallazgo viejo no
 * traiga `existingDocumentId` sería peor que el fallo. Un `null` significa «de
 * este no se puede tener memoria», no «esto ha ido mal».
 *
 * LOS DOS ids SON OBLIGATORIOS, y ahí está el límite conocido de este commit:
 * en la subida desde el chat el documento en revisión NO TIENE id hasta que se
 * indexa, así que durante esa revisión no hay huella que calcular. Es lo que
 * F-87 P2 llama la identidad «pendiente de nacer», y por eso la persistencia
 * entra por la indexación en ese camino.
 */
export function huellaDeDescarte(params: {
  documentoEnRevision: string | null | undefined;
  coordenadas: CoordenadasDeProsa;
}): string | null {
  const { documentoEnRevision, coordenadas } = params;
  if (!documentoEnRevision) return null;
  if (!coordenadas.existingDocumentId) return null;
  if (!coordenadas.newDocSays || !coordenadas.existingDocSays) return null;

  return huellaDeProsa({
    a: { id: documentoEnRevision, textoCitado: coordenadas.newDocSays },
    b: { id: coordenadas.existingDocumentId, textoCitado: coordenadas.existingDocSays },
  });
}

/**
 * Los descartes vivos de una organización, como conjunto de huellas.
 *
 * DEVUELVE UN CONJUNTO VACÍO SI FALLA LA CONSULTA, y se loguea. El criterio es
 * el mismo que arriba: no poder leer los descartes degrada la experiencia
 * —vuelven a aparecer hallazgos ya juzgados— pero tumbar el análisis entero por
 * ello sería peor. Se avisa para que la caída no sea muda.
 */
export async function leerDescartes(
  supabase: SupabaseClient,
  orgId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(TABLA)
    .select('fingerprint')
    .eq('org_id', orgId);

  if (error) {
    console.warn(`[descartes] no se pudieron leer los de la org: ${error.message}`);
    return new Set();
  }

  return new Set((data ?? []).map(r => r.fingerprint as string));
}

/**
 * Registra un descarte. IDEMPOTENTE por `(org_id, fingerprint)`: descartar dos
 * veces el mismo hallazgo es UNA decisión, no dos filas. La entrada de
 * indexación puede reenviar lo mismo si el usuario indexa dos veces.
 */
export async function registrarDescartes(
  supabase: SupabaseClient,
  params: { orgId: string; userId: string; huellas: string[] },
): Promise<{ ok: boolean; insertadas: number; error?: string }> {
  const { orgId, userId, huellas } = params;
  const unicas = [...new Set(huellas)];
  if (unicas.length === 0) return { ok: true, insertadas: 0 };

  const { error } = await supabase
    .from(TABLA)
    .upsert(
      unicas.map(fingerprint => ({
        org_id: orgId,
        fingerprint,
        kind: 'prosa',
        dismissed_by: userId,
      })),
      { onConflict: 'org_id,fingerprint', ignoreDuplicates: true },
    );

  if (error) {
    console.error(`[descartes] no se pudieron registrar: ${error.message}`);
    return { ok: false, insertadas: 0, error: error.message };
  }
  return { ok: true, insertadas: unicas.length };
}

/**
 * Deshace un descarte. El usuario puede desmarcar «No es error», y si eso no
 * borrase la fila el sistema seguiría ocultándole el hallazgo para siempre —
 * que es el mismo fallo que F-67 persigue, con el signo cambiado.
 */
export async function borrarDescarte(
  supabase: SupabaseClient,
  params: { orgId: string; huella: string },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(TABLA)
    .delete()
    .eq('org_id', params.orgId)
    .eq('fingerprint', params.huella);

  if (error) {
    console.error(`[descartes] no se pudo borrar: ${error.message}`);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── EL MARCADO, que es lo que ve el usuario al volver ──────────────────────

/** La forma mínima de una discrepancia para poder marcarla. Deliberadamente
 *  laxa: esto opera sobre el jsonb guardado, que puede ser de hace meses. */
interface DiscrepanciaMarcable {
  newDocSays?: string;
  existingDocSays?: string;
  existingDocumentId?: string;
  dismissed?: boolean;
}

/**
 * MARCA, NO FILTRA — y la diferencia es la que pidió el encargo: este commit
 * cambia DÓNDE viven los descartes, no qué se hace con ellos.
 *
 * Al reabrir un análisis guardado desde la bandeja, las discrepancias que el
 * usuario ya juzgó vuelven con `dismissed: true` y el cliente las pinta
 * tachadas, exactamente como durante la sesión en la que las marcó. No se le
 * quita nada de la lista: quitarlas le impediría cambiar de opinión.
 *
 * FUNCIÓN PURA A PROPÓSITO: es el único eslabón de esta cadena que vitest puede
 * ejecutar —los tres endpoints están fuera de su alcance— y es donde el
 * descarte se convierte en algo que el usuario ve.
 */
export function marcarDescartadas<T extends DiscrepanciaMarcable>(
  discrepancias: T[],
  params: { documentoEnRevision: string | null | undefined; descartes: Set<string> },
): T[] {
  if (params.descartes.size === 0) return discrepancias;

  return discrepancias.map(d => {
    if (!d.newDocSays || !d.existingDocSays || !d.existingDocumentId) return d;

    const huella = huellaDeDescarte({
      documentoEnRevision: params.documentoEnRevision,
      coordenadas: {
        existingDocumentId: d.existingDocumentId,
        newDocSays: d.newDocSays,
        existingDocSays: d.existingDocSays,
      },
    });

    if (huella && params.descartes.has(huella)) return { ...d, dismissed: true };
    return d;
  });
}

/**
 * QUÉ HUELLA PIDE UN DESCARTE — la decisión, separada de la ruta (F-94, ficha B).
 *
 * ⚠️ VIVE AQUÍ Y NO EN EL ENDPOINT POR LA MISMA RAZÓN QUE `destinoSinClave`:
 * dentro de una ruta de API no hay nada que la vigile —el alcance de Vitest
 * prohíbe Supabase y las rutas—, así que una mitad de la bifurcación podría
 * entrar sin prueba. Extraída, se muta y se comprueba. Es la lección de la
 * plantilla 4 aplicada antes de tropezar, no después.
 *
 * LA BIFURCACIÓN, y el tipo es quien decide:
 *   · `tabular` → la huella VIENE HECHA. La calculó el diff con la clave cruda
 *     de los dos lados, sus tablas y la columna; aquí solo se comprueba la
 *     FORMA. No se recalcula: sería una segunda implementación del mismo
 *     criterio (CLAUDE.md) y exigiría más datos que la propia huella.
 *   · `prosa` → se construye con las citas, como hasta hoy.
 *   · sin tipo → PROSA. Es el cuerpo de un cliente anterior al despliegue, y
 *     es exactamente lo que hacía antes. Declarado para que la compatibilidad
 *     no sea un accidente.
 *
 * Y ES LO QUE CIERRA EL CAMINO ACCIDENTAL: con `tipo: 'tabular'` NO se acepta
 * texto. Un hallazgo de tabla no puede registrarse con una identidad de prosa
 * ni aunque alguien mande las tres cadenas.
 * No se intenta DETECTAR «texto de fila», que era como estaba escrito el
 * encargo: no tiene frontera nítida —desde el saneo del prefijo una fila
 * emitida es `valor | valor` y una cita de prosa puede llevar barras—, así que
 * cualquier detección sería una adivinanza con falsos positivos sobre citas
 * legítimas. El tipo lo sabe el cliente sin adivinar.
 */
export type HuellaSolicitada =
  | { ok: true; huella: string }
  | { ok: false; error: string };

export function huellaSolicitada(params: {
  tipo: unknown;
  huella: unknown;
  documentoEnRevision: string;
  existingDocumentId: unknown;
  newDocSays: unknown;
  existingDocSays: unknown;
}): HuellaSolicitada {
  const { tipo, huella, documentoEnRevision } = params;

  if (tipo === 'tabular') {
    if (typeof huella !== 'string' || !/^[0-9a-f]{64}$/.test(huella)) {
      return { ok: false, error: 'Huella tabular ausente o mal formada.' };
    }
    return { ok: true, huella };
  }

  const { existingDocumentId, newDocSays, existingDocSays } = params;
  if (
    typeof existingDocumentId !== 'string' ||
    typeof newDocSays !== 'string' ||
    typeof existingDocSays !== 'string'
  ) {
    return { ok: false, error: 'Coordenadas incompletas del hallazgo.' };
  }

  const deProsa = huellaDeDescarte({
    documentoEnRevision,
    coordenadas: { existingDocumentId, newDocSays, existingDocSays },
  });
  if (!deProsa) return { ok: false, error: 'No se pudo identificar el hallazgo.' };
  return { ok: true, huella: deProsa };
}
