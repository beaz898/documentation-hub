import type { StoredChunk } from '@/lib/read-chunks';
import { claveSegura } from './normalize';
import type { TableGroup } from './table-structure';

/**
 * FASE 1 DEL DIFF DE TABLAS — descubrimiento de clave y emparejamiento por
 * consenso (F-78, con la enmienda de F-81 P1).
 *
 * QUÉ HACE. Dadas dos tablas COMPLETAS, decide con qué columna(s) se
 * corresponden sus filas y las reparte en cuatro clases: emparejadas, solo en
 * la nueva, solo en la existente, y AMBIGUAS. La fase 2 (el diff columna a
 * columna) consume `pairs`; la fase 3 lo integra con el reparto.
 *
 * EL CRITERIO, en cuatro escalones:
 *   1. NOMINACIÓN — una columna es candidata si tiene >= 90% de valores
 *      únicos EN SU PROPIA TABLA (medido por separado en cada una) y está
 *      presente en la otra.
 *   2. EMPAREJAMIENTO POR CONSENSO, no elección de clave — se empareja bajo
 *      CADA candidata y se conserva lo que coincide bajo TODAS. Donde las
 *      candidatas discrepan no se adivina: la fila sale como ambigua, con su
 *      motivo, para que la fase 3 la marque para revisión.
 *   3. Si ninguna simple pasa: PARES de columnas (no triples), mismo criterio.
 *   4. Si ni las compuestas: sin clave, contado, y quien llama sigue por el
 *      camino actual.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️ EL LÍMITE DE LA EVIDENCIA, dicho donde se lea y no enterrado:
 *
 *   NINGUNO DE LOS DOS PARES REALES DEL CORPUS EJERCITA EL CONSENSO.
 *
 * OPE-10/OPE-11 nomina dos candidatas (Código y Tratamiento) que son
 * BIYECTIVAS: no pueden discrepar, así que su acuerdo es gratis y sus 35
 * parejas no prueban que el consenso funcione. Y OPE-02/RRHH-06 nomina UNA
 * SOLA candidata (Empleado), así que allí no hay consenso que ejercitar. Son
 * las dos formas distintas de que el consenso sea vacuo, y el corpus tiene una
 * de cada.
 *
 * CONSECUENCIA: el mecanismo central de esta función —qué hace cuando dos
 * candidatas NO están de acuerdo— se valida ÚNICAMENTE con casos construidos,
 * en table-key.test.ts. Quien lea un log con 35 parejas y cero ambiguas no
 * debe concluir que el consenso está medido en producción: `consensoVacuo` es
 * el campo que dice si hubo algo que decidir.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * LA COMPARACIÓN, y la regla que la gobierna. Se usa `claveSegura` —el nivel
 * seguro del comparador de tres niveles (normalize.ts)— en LOS DOS sitios: al
 * contar únicos para nominar y al comparar valores para emparejar. Con la MISMA
 * función, y eso es una regla, no una casualidad:
 *
 *   NOMINAR Y EMPAREJAR SE HACEN CON LA MISMA COMPARACIÓN. SIEMPRE.
 *
 * El fallo no es normalizar o no normalizar: es MEZCLARLOS. Nominar en crudo
 * (una columna con 100% de valores distintos) y emparejar normalizado
 * emparejaría filas cuyas claves eran DISTINTAS en el momento de nominarlas —
 * se anula la garantía que la hizo clave, justo en el punto donde se usa.
 *
 * POR QUÉ EL NIVEL SEGURO Y NO `normalize` (F-84 1b, 28/08). Hasta este commit
 * la comparación era `normalize`, que además de caja y espacios borra 24
 * caracteres de puntuación. Se bajó al nivel seguro por la ASIMETRÍA DEL ERROR,
 * no por una medición:
 *
 *   emparejar de MÁS   enfrenta dos filas que no son la misma cosa y publica la
 *                      diferencia como discrepancia VERIFICADA POR ESTRUCTURA —
 *                      un falso positivo con el sello más fuerte del producto,
 *                      y el usuario no tiene cómo saber que las filas no eran
 *                      la misma.
 *   emparejar de MENOS manda la fila a la sección de cobertura, donde el
 *                      usuario la ve y decide.
 *
 * Cuando una dirección del error es catastrófica e invisible y la otra benigna
 * y visible, el criterio se pega a la benigna. Con `normalize`, «IMP-01» e
 * «IMP01» eran la misma fila; con el nivel seguro son dos.
 *
 * Y LA MEDICIÓN DICE QUE DA IGUAL, que es justo por qué esto va escrito: sobre
 * los 12 pares ordenados del corpus, CERO parejas de 90 dependían de la
 * normalización agresiva y las candidatas nominadas son las mismas (F-84 1a,
 * fijado en table-key.test.ts). El cambio no entró porque el corpus lo pidiera:
 * entró porque la dirección del riesgo lo pide.
 *
 * `counts.discrepanciaPorNormalizar` (condición 3 de la regla de entrada del
 * protocolo) cuenta en cuántas filas el emparejamiento cambiaría comparando en
 * CRUDO. Desde este commit mide lo que separa el nivel seguro del crudo —caja y
 * espacios internos—, no la puntuación. Sobre el corpus es 0, que es justo por
 * qué existe: con cincuenta documentos de un cliente esa pregunta tendrá
 * respuesta con datos en vez de opiniones.
 *
 * SOBRE LA LONGITUD DE ESTE FICHERO. Pasa de las 400 líneas que fija la regla
 * del proyecto, y lo hace A PROPÓSITO: unas 90 son esta cabecera de doctrina,
 * y el corte natural que quedaría —separar la nominación del consenso— es
 * precisamente el que NO debe hacerse. Son las dos mitades de una misma
 * decisión, y leerlas en ficheros distintos es cómo se acaba nominando con una
 * comparación y emparejando con otra, que es el fallo contra el que avisa la
 * regla de normalización de aquí arriba.
 */

/** Umbral de nominación. Exportado porque el test lo cita al explicar por qué
 *  una columna al 71,7% no es candidata: si un día se baja, el test dice cuál
 *  entra. */
export const MIN_UNIQUE_PCT = 90;

/**
 * Junta los valores de una clave compuesta. `␟` (SYMBOL FOR UNIT SEPARATOR) es
 * un carácter de dibujo de control: ninguna celda de hoja de cálculo lo
 * contiene, así que ("A", "B|C") y ("A|B", "C") no pueden colisionar en la
 * misma clave. Misma familia que el `␞` que chunking.ts ya usa como marcador
 * de segmentación, y por el mismo motivo.
 */
const KEY_SEPARATOR = '␟';

/** Una candidata a clave: una columna (simple) o dos (compuesta). */
export interface KeyCandidate {
  columns: string[];
  /** % de valores distintos en la tabla nueva, sobre el total de sus filas. */
  uniqueNueva: number;
  uniqueExistente: number;
}

export interface RowPair {
  nueva: StoredChunk;
  existente: StoredChunk;
  /** Los valores CRUDOS que emparejaron, en el orden de candidates[0].columns. */
  keyValues: string[];
}

export type AmbiguityReason =
  | 'valor_repetido_en_su_tabla'
  | 'valor_repetido_enfrente'
  | 'valor_vacio'
  | 'candidatas_discrepan'
  | 'candidatas_parciales';

/**
 * Prioridad de motivos, para que el motivo reportado no dependa del orden en
 * que se nominaron las candidatas. Los tres primeros son propiedades DE LOS
 * DATOS —romperían cualquier emparejamiento, con consenso o sin él—; los dos
 * últimos son desacuerdos ENTRE candidatas. Se reporta la causa antes que el
 * síntoma.
 */
const REASON_PRIORITY: AmbiguityReason[] = [
  'valor_repetido_en_su_tabla',
  'valor_repetido_enfrente',
  'valor_vacio',
  'candidatas_discrepan',
  'candidatas_parciales',
];

export interface AmbiguousRow {
  side: 'nueva' | 'existente';
  row: StoredChunk;
  reason: AmbiguityReason;
  /** Las filas implicadas, para que la fase 3 pueda enseñarlas al marcar la
   *  revisión. Vacío cuando el motivo no señala a ninguna (valor_vacio,
   *  candidatas_parciales). */
  rivals: StoredChunk[];
}

export interface KeyCounts {
  candidatasSimples: number;
  candidatasCompuestas: number;
  /** El consenso no tuvo nada que decidir: una sola candidata, o candidatas
   *  biyectivas (que no pueden discrepar). Ver el límite de evidencia arriba. */
  consensoVacuo: boolean;
  biyectivas: boolean;
  pares: number;
  soloNueva: number;
  soloExistente: number;
  ambiguas: Record<AmbiguityReason, number>;
  /** Filas cuyo emparejamiento cambiaría comparando en crudo. */
  discrepanciaPorNormalizar: number;
}

export type TableKeyResult =
  | {
      status: 'emparejado';
      candidates: KeyCandidate[];
      pairs: RowPair[];
      onlyNueva: StoredChunk[];
      onlyExistente: StoredChunk[];
      ambiguous: AmbiguousRow[];
      counts: KeyCounts;
    }
  | {
      status: 'sin_clave';
      reason: 'sin_columnas_comunes' | 'ninguna_supera_el_umbral' | 'tabla_incompleta' | 'tabla_vacia';
      counts: KeyCounts;
    };

type Mode = 'seguro' | 'crudo';

function emptyCounts(): KeyCounts {
  return {
    candidatasSimples: 0,
    candidatasCompuestas: 0,
    consensoVacuo: false,
    biyectivas: false,
    pares: 0,
    soloNueva: 0,
    soloExistente: 0,
    ambiguas: {
      valor_repetido_en_su_tabla: 0,
      valor_repetido_enfrente: 0,
      valor_vacio: 0,
      candidatas_discrepan: 0,
      candidatas_parciales: 0,
    },
    discrepanciaPorNormalizar: 0,
  };
}

function cellValue(row: StoredChunk, column: string): string {
  return row.cells?.[column] ?? '';
}

function compare(raw: string, mode: Mode): string {
  return mode === 'seguro' ? claveSegura(raw) : raw.trim();
}

/** Clave de una fila bajo una candidata. Cadena vacía = la fila no tiene clave
 *  utilizable (todas sus componentes vacías): no empareja con nada, ni siquiera
 *  con otras filas igual de vacías. */
function keyOf(row: StoredChunk, columns: string[], mode: Mode): string {
  const parts = columns.map(c => compare(cellValue(row, c), mode));
  return parts.every(p => p === '') ? '' : parts.join(KEY_SEPARATOR);
}

function buildIndex(rows: StoredChunk[], columns: string[], mode: Mode): Map<string, StoredChunk[]> {
  const index = new Map<string, StoredChunk[]>();
  for (const row of rows) {
    const k = keyOf(row, columns, mode);
    if (k === '') continue;
    const list = index.get(k) ?? [];
    list.push(row);
    index.set(k, list);
  }
  return index;
}

/**
 * % de valores distintos de una columna sobre el TOTAL de filas. Las celdas
 * vacías cuentan como un valor más (todas el mismo), así que una columna con
 * muchos blancos cae sola por debajo del umbral sin necesitar una regla aparte.
 */
function uniquePct(rows: StoredChunk[], columns: string[], mode: Mode): number {
  if (rows.length === 0) return 0;
  const seen = new Set(
    rows.map(r => columns.map(c => compare(cellValue(r, c), mode)).join(KEY_SEPARATOR)),
  );
  return (seen.size / rows.length) * 100;
}

/**
 * % de valores distintos de CADA columna de una tabla, en el orden de
 * `table.columns`. Es la aritmética que decide la nominación, expuesta para
 * poder responder «¿por qué esta columna no es candidata?» — la usa la batería
 * (que fija los porcentajes del corpus como canario de la extracción) y es lo
 * que un diagnóstico tendría que enseñar. Mismo `uniquePct` que nomina: si un
 * día divergieran, el número del log dejaría de explicar la decisión.
 */
export function columnUniqueness(table: TableGroup): Array<{ column: string; uniquePct: number }> {
  return table.columns.map(column => ({
    column,
    uniquePct: uniquePct(table.rows, [column], 'seguro'),
  }));
}

type Outcome =
  | { kind: 'match'; row: StoredChunk }
  | { kind: 'none' }
  | { kind: 'ambigua'; reason: AmbiguityReason; rivals: StoredChunk[] };

/** Resultado de UNA candidata para UNA fila. */
function resolveOne(
  row: StoredChunk,
  columns: string[],
  ownIndex: Map<string, StoredChunk[]>,
  otherIndex: Map<string, StoredChunk[]>,
  mode: Mode,
): Outcome {
  const k = keyOf(row, columns, mode);
  if (k === '') return { kind: 'ambigua', reason: 'valor_vacio', rivals: [] };

  // El umbral es 90%, no 100%: dos filas del MISMO lado pueden compartir clave
  // sin dejar de ser candidata. Sin esta comprobación, las dos apuntarían a la
  // misma fila de enfrente y la fase 2 la contaría dos veces.
  const mine = ownIndex.get(k) ?? [];
  if (mine.length > 1) {
    return { kind: 'ambigua', reason: 'valor_repetido_en_su_tabla', rivals: mine.filter(r => r !== row) };
  }

  const hits = otherIndex.get(k) ?? [];
  if (hits.length === 0) return { kind: 'none' };
  if (hits.length > 1) return { kind: 'ambigua', reason: 'valor_repetido_enfrente', rivals: hits };
  return { kind: 'match', row: hits[0] };
}

/** Consenso de TODAS las candidatas para UNA fila. */
function consensusFor(
  row: StoredChunk,
  candidates: KeyCandidate[],
  ownIndexes: Array<Map<string, StoredChunk[]>>,
  otherIndexes: Array<Map<string, StoredChunk[]>>,
  mode: Mode,
): Outcome {
  const outcomes = candidates.map((cand, i) =>
    resolveOne(row, cand.columns, ownIndexes[i], otherIndexes[i], mode));

  const ambiguas = outcomes.filter((o): o is Extract<Outcome, { kind: 'ambigua' }> => o.kind === 'ambigua');
  if (ambiguas.length > 0) {
    const reason = REASON_PRIORITY.find(r => ambiguas.some(a => a.reason === r)) ?? ambiguas[0].reason;
    const first = ambiguas.find(a => a.reason === reason) ?? ambiguas[0];
    return { kind: 'ambigua', reason, rivals: first.rivals };
  }

  const matches = outcomes.filter((o): o is Extract<Outcome, { kind: 'match' }> => o.kind === 'match');
  if (matches.length === 0) return { kind: 'none' };
  if (matches.length < outcomes.length) {
    return { kind: 'ambigua', reason: 'candidatas_parciales', rivals: matches.map(m => m.row) };
  }

  const distinct = [...new Set(matches.map(m => m.row))];
  if (distinct.length > 1) {
    return { kind: 'ambigua', reason: 'candidatas_discrepan', rivals: distinct };
  }
  return { kind: 'match', row: distinct[0] };
}

function nominate(nueva: TableGroup, existente: TableGroup, columnSets: string[][]): KeyCandidate[] {
  const out: KeyCandidate[] = [];
  for (const columns of columnSets) {
    const uniqueNueva = uniquePct(nueva.rows, columns, 'seguro');
    const uniqueExistente = uniquePct(existente.rows, columns, 'seguro');
    if (uniqueNueva >= MIN_UNIQUE_PCT && uniqueExistente >= MIN_UNIQUE_PCT) {
      out.push({ columns, uniqueNueva, uniqueExistente });
    }
  }
  return out;
}

/**
 * ¿Son biyectivas entre sí TODAS las candidatas, sobre la UNIÓN de las dos
 * tablas? (P1.a de F-81.) Dos candidatas lo son cuando el mapeo valor-a-valor
 * es 1:1 en los dos sentidos: entonces no pueden discrepar, y su acuerdo no es
 * evidencia de nada. No sirve para decidir — sirve para que el log no presuma
 * de una evidencia que no tiene.
 */
function allBijective(candidates: KeyCandidate[], rows: StoredChunk[]): boolean {
  if (candidates.length < 2) return false;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const forward = new Map<string, string>();
      const backward = new Map<string, string>();
      for (const row of rows) {
        const a = keyOf(row, candidates[i].columns, 'seguro');
        const b = keyOf(row, candidates[j].columns, 'seguro');
        if (a === '' || b === '') continue;
        if (forward.has(a) && forward.get(a) !== b) return false;
        if (backward.has(b) && backward.get(b) !== a) return false;
        forward.set(a, b);
        backward.set(b, a);
      }
    }
  }
  return true;
}

export function discoverTableKey(nueva: TableGroup, existente: TableGroup): TableKeyResult {
  const counts = emptyCounts();

  if (nueva.totalRows === 0 || existente.totalRows === 0) {
    return { status: 'sin_clave', reason: 'tabla_vacia', counts };
  }
  // Una tabla parcial no se puede medir: un 90% sobre 6 de 60 filas no
  // significa nada. Hoy groupChunksByTable hace totalRows === rows.length por
  // construcción, así que por esa vía no puede dispararse; la guarda existe
  // para el camino que abre la fase 3, donde el reparto entrega subconjuntos.
  if (nueva.rows.length !== nueva.totalRows || existente.rows.length !== existente.totalRows) {
    return { status: 'sin_clave', reason: 'tabla_incompleta', counts };
  }

  // Solo los NOMBRES importan aquí: el orden de getOrderedColumns (y su
  // respaldo alfabético) es irrelevante para descubrir una clave.
  const common = nueva.columns.filter(c => existente.columns.includes(c));
  if (common.length === 0) {
    return { status: 'sin_clave', reason: 'sin_columnas_comunes', counts };
  }

  let candidates = nominate(nueva, existente, common.map(c => [c]));
  counts.candidatasSimples = candidates.length;

  if (candidates.length === 0) {
    const columnPairs: string[][] = [];
    for (let i = 0; i < common.length; i++) {
      for (let j = i + 1; j < common.length; j++) columnPairs.push([common[i], common[j]]);
    }
    candidates = nominate(nueva, existente, columnPairs);
    counts.candidatasCompuestas = candidates.length;
  }

  if (candidates.length === 0) {
    return { status: 'sin_clave', reason: 'ninguna_supera_el_umbral', counts };
  }

  counts.biyectivas = allBijective(candidates, [...nueva.rows, ...existente.rows]);
  counts.consensoVacuo = candidates.length === 1 || counts.biyectivas;

  const indexesFor = (rows: StoredChunk[], mode: Mode) =>
    candidates.map(c => buildIndex(rows, c.columns, mode));
  const idxNueva = indexesFor(nueva.rows, 'seguro');
  const idxExistente = indexesFor(existente.rows, 'seguro');

  const forward = new Map<StoredChunk, Outcome>();
  for (const row of nueva.rows) {
    forward.set(row, consensusFor(row, candidates, idxNueva, idxExistente, 'seguro'));
  }
  const backward = new Map<StoredChunk, Outcome>();
  for (const row of existente.rows) {
    backward.set(row, consensusFor(row, candidates, idxExistente, idxNueva, 'seguro'));
  }

  const pairs: RowPair[] = [];
  const onlyNueva: StoredChunk[] = [];
  const ambiguous: AmbiguousRow[] = [];
  const pairedExistente = new Set<StoredChunk>();

  for (const row of nueva.rows) {
    const out = forward.get(row);
    if (!out || out.kind === 'ambigua') {
      if (out) ambiguous.push({ side: 'nueva', row, reason: out.reason, rivals: out.rivals });
      continue;
    }
    if (out.kind === 'none') {
      onlyNueva.push(row);
      continue;
    }
    // ACUERDO MUTUO. El consenso nueva -> existente no garantiza el de vuelta:
    // sin esta comprobación una fila de la existente podría quedar emparejada
    // y a la vez contada como "solo en la existente".
    const back = backward.get(out.row);
    if (back?.kind !== 'match' || back.row !== row) {
      ambiguous.push({ side: 'nueva', row, reason: 'candidatas_discrepan', rivals: [out.row] });
      continue;
    }
    pairs.push({
      nueva: row,
      existente: out.row,
      keyValues: candidates[0].columns.map(c => cellValue(row, c)),
    });
    pairedExistente.add(out.row);
  }

  const onlyExistente: StoredChunk[] = [];
  for (const row of existente.rows) {
    if (pairedExistente.has(row)) continue;
    const out = backward.get(row);
    if (out && out.kind === 'ambigua') {
      ambiguous.push({ side: 'existente', row, reason: out.reason, rivals: out.rivals });
      continue;
    }
    onlyExistente.push(row);
  }

  // Condición 3 de la regla de entrada: qué cambiaría comparando en CRUDO, con
  // las MISMAS candidatas — se mueve una variable, no dos.
  const rawNueva = indexesFor(nueva.rows, 'crudo');
  const rawExistente = indexesFor(existente.rows, 'crudo');
  for (const row of nueva.rows) {
    const conNormalize = forward.get(row);
    const enCrudo = consensusFor(row, candidates, rawNueva, rawExistente, 'crudo');
    if (!conNormalize) continue;
    const igual =
      conNormalize.kind === enCrudo.kind &&
      (conNormalize.kind !== 'match' || enCrudo.kind !== 'match' || conNormalize.row === enCrudo.row);
    if (!igual) counts.discrepanciaPorNormalizar++;
  }

  counts.pares = pairs.length;
  counts.soloNueva = onlyNueva.length;
  counts.soloExistente = onlyExistente.length;
  for (const a of ambiguous) counts.ambiguas[a.reason]++;

  return { status: 'emparejado', candidates, pairs, onlyNueva, onlyExistente, ambiguous, counts };
}
