import { useState, useCallback, useMemo } from 'react';
import type { Problem } from './problems';
import { clasificarRespuestaDeEstilo, type ResultadoDelReanalisisDeEstilo } from './resultado-reanalisis-estilo';

type StyleApiProblem = {
  type: Problem['type'];
  title: string;
  description: string;
  textRef: string;
};

interface UseStyleAnalysisArgs {
  initialText: string;
  fileName: string;
  /** F-100 — DE QUIÉN es el análisis de estilo: el documento EN REVISIÓN.
   *  Ausente en el camino del chat, donde el documento todavía no existe.
   *  ⚠️ Es `reviewedDocumentId` y JAMÁS `existingDocWithSameName`: desde el chat
   *  aquélla es OTRO documento que casualmente comparte nombre (B.163). */
  reviewedDocumentId?: string;
  /** F-101: la ruta del fichero en almacenamiento — el propietario PRIMARIO del
   *  análisis mientras se revisa. Ausente en la bandeja, donde manda el documento. */
  storagePath?: string;
  /**
   * Problemas de estilo precargados (vienen del análisis exhaustivo previo).
   * Si se proporcionan, se mapean al tipo Problem y se usan como estado inicial,
   * para que el usuario los vea al abrir el modal sin tener que pulsar
   * "Reanalizar estilo".
   */
  initialStyleProblems?: StyleApiProblem[];
}

function mapStyleProblems(raw: StyleApiProblem[]): Problem[] {
  return raw.map((p, i) => ({
    id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    type: p.type,
    title: p.title,
    description: p.description,
    textRef: p.textRef,
    relatedDoc: undefined,
  }));
}

export function useStyleAnalysis({
  initialText,
  fileName,
  initialStyleProblems,
  reviewedDocumentId,
  storagePath,
}: UseStyleAnalysisArgs) {
  // Mapeamos los problemas iniciales una sola vez (no en cada render),
  // así los IDs no cambian con cada render y React no se confunde.
  const initialMapped = useMemo(
    () => (initialStyleProblems && initialStyleProblems.length > 0)
      ? mapStyleProblems(initialStyleProblems)
      : [],
    // Sólo en el primer render: los problemas iniciales no cambian durante
    // la vida del modal (vienen como prop al abrirlo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [styleProblems, setStyleProblems] = useState<Problem[]>(initialMapped);
  const [styleLoading, setStyleLoading] = useState(false);

  void initialText;
  void fileName;

  const reanalyzeStyle = useCallback(
    async (currentText: string, currentFileName: string): Promise<ResultadoDelReanalisisDeEstilo<Problem>> => {
      setStyleLoading(true);
      try {
        const res = await fetch('/api/analyze-style', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          // F-100: DE QUIÉN es este análisis. Es `reviewedDocumentId` —el
          // documento EN REVISIÓN— y jamás `existingDocWithSameName`, que desde
          // el chat es OTRO documento que comparte nombre (B.163). Ausente en el
          // camino del chat: allí el documento todavía no existe.
          body: JSON.stringify({
            text: currentText,
            fileName: currentFileName,
            documentoPropietario: reviewedDocumentId ?? null,
            // F-101: desde el chat no hay documento, pero sí fichero — y el
            // análisis es suyo. Sin esto la fila no tendría propietario ninguno.
            storagePath: storagePath ?? null,
          }),
        });
        // ⚠️ B.237, PUERTA 3 (17/09/2026) — YA NO ES `return []`. La lista vacía
        // se leía en el modal como «no hay cambios», y un 402, un 429 o un fallo
        // del modelo decían haber reanalizado. Ahora se devuelve QUÉ PASÓ, y la
        // lista sólo se toca cuando de verdad se reanalizó.
        // (La rama `data?.styleError` se retira: ningún servidor la emite.)
        const cuerpo: unknown = await res.json().catch(() => null);
        const clase = clasificarRespuestaDeEstilo(res.status, cuerpo);
        if (clase.estado !== 'ok') {
          console.warn('[useStyleAnalysis] sin reanálisis', res.status, clase.estado);
          return clase;
        }
        const mapped = mapStyleProblems((cuerpo as { problems?: StyleApiProblem[] } | null)?.problems || []);
        setStyleProblems(mapped);
        return { estado: 'ok', problemas: mapped };
      } catch (err) {
        console.warn('[useStyleAnalysis] fetch failed', err);
        return { estado: 'error' };
      } finally {
        setStyleLoading(false);
      }
    },
    []
  );

  return { styleProblems, styleLoading, reanalyzeStyle, setStyleProblems };
}
