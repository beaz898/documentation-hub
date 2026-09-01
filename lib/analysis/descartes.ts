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
 * LAS DOS ESPECIES, desde F-94 (ficha B). Antes solo prosa.
 *
 * `huellaDeProsa` se construye AQUÍ con las dos citas; `huellaDeHallazgo` —la
 * tabular— NO se construye aquí: la calcula la emisión del diff con la clave
 * cruda de los dos lados, y llega hecha. Es la misma decisión en los dos
 * sentidos del viaje: quien necesita la identidad se la PREGUNTA a quien la
 * decidió en vez de rederivarla (CLAUDE.md, F-89 P2).
 *
 * QUIÉN DECIDE LA ESPECIE: `origen === 'diff_tabular'`, y nada más. NO «tiene
 * huella o no la tiene» — un hallazgo tabular del camino PRE-INDEXADO no lleva
 * huella (F-87 P1), y si la especie se dedujera de la presencia, ése caería a
 * la rama de prosa y se le calcularía una identidad sobre el texto de la fila.
 * Que es EXACTAMENTE la identidad accidental que F-94 vino a matar, resucitada
 * por el lado de la lectura. Un hallazgo tabular sin huella no tiene memoria, y
 * eso es lo correcto: le falta la identidad, no le sobra otra.
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

/** Las dos especies del contrato de `huella-hallazgo.ts`, que son también los
 *  dos valores que admite `finding_dismissals.kind`. */
export type EspecieDeHuella = 'tabular' | 'prosa';

/**
 * Registra un descarte. IDEMPOTENTE por `(org_id, fingerprint)`: descartar dos
 * veces el mismo hallazgo es UNA decisión, no dos filas. La entrada de
 * indexación puede reenviar lo mismo si el usuario indexa dos veces.
 *
 * LA ESPECIE SE PIDE, NO SE ADIVINA (F-94, ficha B). Hasta hoy escribía
 * `'prosa'` fijo, y era verdad porque solo había prosa. Ahora quien llama ya ha
 * decidido la especie —`huellaSolicitada` la devuelve— y la pasa: rederivarla
 * aquí a partir de la huella sería imposible (las dos son sha256 de 64 hex,
 * indistinguibles) y adivinarla sería peor que no guardarla.
 * La columna admite las dos desde F-86 paso 3, así que no hay migración.
 */
export async function registrarDescartes(
  supabase: SupabaseClient,
  params: { orgId: string; userId: string; huellas: string[]; especie: EspecieDeHuella },
): Promise<{ ok: boolean; insertadas: number; error?: string }> {
  const { orgId, userId, huellas, especie } = params;
  const unicas = [...new Set(huellas)];
  if (unicas.length === 0) return { ok: true, insertadas: 0 };

  const { error } = await supabase
    .from(TABLA)
    .upsert(
      unicas.map(fingerprint => ({
        org_id: orgId,
        fingerprint,
        kind: especie,
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
  /** F-88 paso 2: la especie del hallazgo. Ausente = prosa. */
  origen?: 'diff_tabular';
  /** F-88 paso 2: la huella tabular, YA CALCULADA por la emisión del diff.
   *  Ausente en el camino pre-indexado, y ahí no hay memoria posible. */
  huella?: string;
}

/**
 * LA IDENTIDAD DE UN HALLAZGO GUARDADO, o `null` si no tiene ninguna.
 *
 * UN SOLO SITIO, que es la regla: la rama por especie está aquí y no repartida
 * por el `map`, para que la lea entera quien venga a cambiarla. Ver la cabecera
 * del fichero sobre por qué decide `origen` y no la presencia de la huella.
 */
function identidadDeDescarte(
  d: DiscrepanciaMarcable,
  documentoEnRevision: string | null | undefined,
): string | null {
  if (d.origen === 'diff_tabular') {
    // VIENE HECHA O NO VIENE. No se recalcula ni se sustituye por otra cosa.
    return typeof d.huella === 'string' && d.huella.length > 0 ? d.huella : null;
  }

  if (!d.newDocSays || !d.existingDocSays || !d.existingDocumentId) return null;

  return huellaDeDescarte({
    documentoEnRevision,
    coordenadas: {
      existingDocumentId: d.existingDocumentId,
      newDocSays: d.newDocSays,
      existingDocSays: d.existingDocSays,
    },
  });
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
 * LAS DOS ESPECIES EN LA MISMA PASADA, y no hacen falta dos conjuntos:
 * `finding_dismissals` tiene una sola clave `(org_id, fingerprint)`, así que
 * `descartes` es un espacio MEZCLADO. Cada hallazgo pregunta por su identidad y
 * el conjunto contesta sin saber de qué especie era.
 *
 * ⚠️ UNA ASIMETRÍA REAL ENTRE LAS RAMAS, declarada porque no es evidente: sin
 * `documentoEnRevision` la prosa no puede identificar nada, pero LO TABULAR
 * SIGUE MARCANDO —su huella no necesita ese id, ya viene hecha—. En la práctica
 * los dos caminos sin id coinciden con el pre-indexado, que tampoco trae huella;
 * el predicado no los ata, y por eso se escribe.
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
    const identidad = identidadDeDescarte(d, params.documentoEnRevision);
    if (identidad && params.descartes.has(identidad)) return { ...d, dismissed: true };
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
 * DEVUELVE TAMBIÉN LA ESPECIE, y no es un extra: `registrarDescartes` tiene que
 * escribirla en `kind` y NO PUEDE DEDUCIRLA —las dos huellas son sha256 de 64
 * hex, indistinguibles—. Aquí es donde se decide, luego aquí es donde se
 * pregunta (CLAUDE.md: un criterio se implementa una vez).
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
  | { ok: true; huella: string; especie: EspecieDeHuella }
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
    return { ok: true, huella, especie: 'tabular' };
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
  return { ok: true, huella: deProsa, especie: 'prosa' };
}
