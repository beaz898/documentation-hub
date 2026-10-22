import { buildUnits, indiceDelAnalizado, selectUnitsWithinBudget } from './retrieval';
import { buildAnalyzedDocumentText, montarBloqueDelCandidato, parejaEnteraEnEsteModo } from './judge';
import { repartoDeLaPareja, type RepartoElegido } from './reparto-de-la-pareja';
import type { DocumentFragment, RerankedCandidate } from './types';
import type { StoredChunk } from '@/lib/read-chunks';

/**
 * LA SEGUNDA SELECCIÓN — el interino del 3.1.3 (arquitecto, 21/10/2026: la opción (a)).
 *
 * La recuperación sigue eligiendo los trozos de cada candidato con 3.000 caracteres de texto,
 * EXACTAMENTE como antes: de esa selección leen el rerank (su prompt), los solapamientos estructurales,
 * los avisos de tablas recortadas y el log del presupuesto por candidato, y nada de eso cambia. Esto
 * corre DESPUÉS del rerank, sólo para las parejas que llegan al juez —que es cuando se sabe qué pareja
 * va—, y vuelve a elegir entre los MISMOS fragmentos que devolvió Pinecone con el resto del reparto
 * (`repartoDeLaPareja`). Esa selección es la que monta el bloque del juez. Es lo que el estado vivo llama
 * el 3.1.3 de verdad (F-127 P9.3): no recablear un parámetro, sino mover dónde se decide.
 *
 * Sólo con el interruptor de la pareja entera encendido y en el rápido (`parejaEnteraEnEsteModo`), y
 * sólo si los dos lados tienen trozos: fuera de ahí el juez lee con la tijera vieja y esto no hace nada.
 *
 * ⚠️ CON LA VENTANA DE 150.000 (22/10/2026) Y ESTE CORPUS, LA AMPLIACIÓN DEJA DE EJECUTARSE EN PRODUCCIÓN: todas
 * las parejas caben enteras y salen 'entero'. NO SE BORRA. Es lo que necesitará la 3.1.5, cuando una pareja no
 * quepa, y es lo que hizo posible la medida del 22/10 (los 12 trozos de CLI-12 con 80.000). Sus pruebas la
 * ejercen con la ventana de 80.000, el caso medido, a través de `ventana`; producción no lo pasa y usa la de
 * `repartoDeLaPareja`, `TAMANO_VENTANA`. Es la misma lectura que hace `repartoDeLaPareja` (`a.ventana ??
 * TAMANO_VENTANA`): las dos funciones aceptan la ventana del mismo modo.
 *
 * LAS CABECERAS SE CUENTAN: el resto es lo máximo que puede ocupar el bloque YA MONTADO, y cada
 * selección se mide con la misma función que lo monta para el juez (`montarBloqueDelCandidato`). El
 * selector cuenta texto, así que se le da el resto y, si el bloque montado se pasa, se le quita lo que se
 * pasó y se vuelve a elegir, hasta que cabe.
 *
 * LA GARANTÍA, que vigila `segunda-seleccion.test.ts`: el bloque ampliado cabe en su resto y representa
 * TODOS los trozos que representaba el de la recuperación. Si no se consigue las dos cosas, se queda el de
 * la recuperación, que es la reserva y ya cabe: el candidato nunca recibe menos que con la tijera vieja.
 *
 * El límite declarado del interino, en la cabecera de `reparto-de-la-pareja.ts`: esto no hace aparecer
 * trozos que Pinecone no trajo.
 */
const MAXIMO_DE_AJUSTES = 8;

export interface SegundaSeleccion {
  /** Los candidatos, con `fragments` sustituidos por la segunda selección donde la hubo. */
  candidates: RerankedCandidate[];
  /** Por candidato, el reparto decidido y de dónde salió su bloque. Vacío si no aplica. */
  repartos: Map<string, RepartoElegido>;
  /** Si corrió: interruptor encendido, rápido y el analizado con trozos. */
  aplica: boolean;
}

/**
 * LAS LÍNEAS DEL LOG DE LA SEGUNDA SELECCIÓN (arquitecto, 22/10/2026). Se AÑADEN a la del presupuesto por
 * candidato de la recuperación, que sigue diciendo 3.000 porque la primera selección sigue eligiendo con
 * 3.000: no es falsa, es incompleta, y esto la completa. Una por pareja —el resto que le tocó y de dónde salió
 * su bloque— y el AGREGADO, que todo registro por unidad imprime; y si no corrió, lo dice, para que su
 * ausencia no se lea como «no había nada que ampliar».
 */
export function lineasDeLaSegundaSeleccion(s: SegundaSeleccion): string[] {
  if (!s.aplica) return ['[segunda-seleccion] no aplica (interruptor apagado, exhaustivo o el analizado sin trozos): el juez lee el bloque de la recuperación'];
  const cuenta = { entero: 0, ampliada: 0, la_de_la_recuperacion: 0, sin_trozos: 0 };
  const lineas = s.candidates.map(c => {
    const e = s.repartos.get(c.documentId);
    if (!e) { cuenta.sin_trozos++; return `[segunda-seleccion] "${c.documentName}": sin trozos, el juez lee con la tijera vieja`; }
    cuenta[e.seleccion]++;
    const r = e.reparto;
    const trozos = new Set(c.fragments.filter(f => !f.isContext).map(f => f.chunkIndex)).size;
    return `[segunda-seleccion] "${c.documentName}": ${r.parejaEntera ? 'pareja entera' : `resto ${r.paraElCandidato} de ${r.ventana}`}, bloque ${e.seleccion}, ${trozos} trozos`;
  });
  lineas.push(`[segunda-seleccion] ${s.candidates.length} parejas: ${cuenta.entero} entero, ${cuenta.ampliada} ampliada, ${cuenta.la_de_la_recuperacion} la_de_la_recuperacion, ${cuenta.sin_trozos} sin trozos`);
  return lineas;
}

export function segundaSeleccion(a: {
  candidates: RerankedCandidate[];
  newDocumentName: string;
  newDocumentChunks: StoredChunk[];
  chunksByDocument: Map<string, StoredChunk[]>;
  fragmentosOrdenados: Map<string, DocumentFragment[]>;
  exhaustivo: boolean;
  /** La ventana del reparto. Producción no la pasa: `TAMANO_VENTANA`. Las pruebas, la del caso medido. */
  ventana?: number;
  /** Pone a cada fragmento su contexto (`loadFragmentContexts`, en el pipeline): sin él, una fila de
   *  tabla se monta como texto suelto y el bloque se mediría mal. Se aplica antes de elegir y a lo
   *  elegido, como el pipeline hace con la selección de la recuperación. */
  conContexto?: (f: DocumentFragment[]) => DocumentFragment[];
}): SegundaSeleccion {
  const conContexto = a.conContexto ?? ((f: DocumentFragment[]) => f);
  const repartos = new Map<string, RepartoElegido>();
  if (!parejaEnteraEnEsteModo(a.exhaustivo) || a.newDocumentChunks.length === 0) return { candidates: a.candidates, repartos, aplica: false };

  const analizado = buildAnalyzedDocumentText(a.newDocumentChunks, a.newDocumentName).length;
  const { analyzedValueIndex, analyzedRows } = indiceDelAnalizado(a.newDocumentChunks);

  const candidates = a.candidates.map(c => {
    const docChunks = a.chunksByDocument.get(c.documentId) ?? [];
    if (docChunks.length === 0) return c;                                   // sin trozos: el juez lee con la tijera vieja
    const candidato = buildAnalyzedDocumentText(docChunks, c.documentName).length;
    const bloqueDeLaRecuperacion = montarBloqueDelCandidato(c.fragments, c.documentName, docChunks);
    const reparto = repartoDeLaPareja({ analizado, candidato, reservaMontada: bloqueDeLaRecuperacion.length, ventana: a.ventana });
    if (reparto.parejaEntera || reparto.candidatoEntero) {
      repartos.set(c.documentId, { reparto, seleccion: 'entero' });
      return c;
    }
    const ampliada = ampliar(c, docChunks, conContexto(a.fragmentosOrdenados.get(c.documentId) ?? []), reparto.paraElCandidato, analyzedValueIndex, analyzedRows, conContexto);
    if (!ampliada) {
      repartos.set(c.documentId, { reparto, seleccion: 'la_de_la_recuperacion' });
      return c;
    }
    repartos.set(c.documentId, { reparto, seleccion: 'ampliada' });
    return { ...c, fragments: ampliada };
  });
  return { candidates, repartos, aplica: true };
}

/** La selección con el resto, o null si no cabe en él o pierde algún trozo del bloque de la recuperación. */
function ampliar(
  c: RerankedCandidate, docChunks: StoredChunk[], ordenados: DocumentFragment[], resto: number,
  analyzedValueIndex: Map<string, Set<string>>, analyzedRows: StoredChunk[],
  conContexto: (f: DocumentFragment[]) => DocumentFragment[],
): DocumentFragment[] | null {
  if (ordenados.length === 0) return null;
  const units = buildUnits(ordenados, docChunks);
  const antes = new Set(c.fragments.filter(f => !f.isContext).map(f => f.chunkIndex));
  let presupuestoDeTexto = resto;
  for (let i = 0; i < MAXIMO_DE_AJUSTES && presupuestoDeTexto > 0; i++) {
    const selected = conContexto(selectUnitsWithinBudget(units, docChunks, ordenados[0], analyzedValueIndex, analyzedRows, presupuestoDeTexto).selected);
    const montado = montarBloqueDelCandidato(selected, c.documentName, docChunks).length;
    if (montado <= resto) {
      const ahora = new Set(selected.filter(f => !f.isContext).map(f => f.chunkIndex));
      return [...antes].every(k => ahora.has(k)) ? selected : null;
    }
    presupuestoDeTexto -= montado - resto;                                 // lo que se pasó, fuera, y otra vez
  }
  return null;
}
