import { ESTADO_DEL_CORPUS } from '@/lib/documents/estado';

/**
 * ¿Entra este documento en el FONDO del termómetro? (26/09/2026)
 *
 * Es el predicado de `contarElFondo`, sacado a función pura para que tenga caso
 * decisivo: `contarElFondo` necesita Supabase y el alcance de vitest no la
 * cubre, pero lo que decide la pertenencia es sólo esto. Batería en
 * `es-del-fondo.test.ts`.
 *
 * ⚠️ RECIBE EL MISMO DATO QUE `elegirFiltroDeCorpus` (`retrieval.ts`) y tiene que
 * responder lo mismo que el filtro que ese dato elige. Si el fondo y la búsqueda
 * miran corpus distintos, el denominador miente — 44 documentos de fondo para
 * una búsqueda de 2.
 *   · sin `exacto`: `analizado` o de la tanda — `buildCorpusFilter`.
 *   · con `exacto`: EXACTAMENTE esa lista, sin mirar el estado — `buildCorpusExacto`.
 * En los dos, menos el documento que se analiza.
 */
export function esDelFondo(
  doc: { id: string; estado: string | null },
  args: {
    exacto: ReadonlySet<string> | null;
    deLaTanda: ReadonlySet<string>;
    excludeDocumentId?: string;
  },
): boolean {
  if (doc.id === args.excludeDocumentId) return false;
  if (args.exacto) return args.exacto.has(doc.id);
  return doc.estado === ESTADO_DEL_CORPUS || args.deLaTanda.has(doc.id);
}
