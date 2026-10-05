// El análisis tal como llega a ImprovementModal (del servidor o del jsonb
// guardado). Sacado de problems.ts el 05/10/2026 sin cambio de comportamiento,
// antes de B.314 commit B: problems.ts estaba en 400 líneas justas, y lo que
// había que añadir era de aquí. problems.ts lo reexporta.

import type { ComparedValue, GrupoDeTablas, PuntoDeSolapamiento } from '@/lib/analysis/types';
import type { CoberturaDeCandidatos } from '@/lib/analysis/cobertura-de-candidatos';

export interface RawAnalysis {
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateConfidence?: number;
  /** F-86 paso 0: `existingDocumentId` en las tres listas — hermano del nombre,
   *  undefined en los análisis guardados antes de este commit. */
  overlaps?: Array<{
    existingDocument: string; existingDocumentId?: string; description: string; severity: string; textRef?: string;
    /** F-45: presente en las entradas estructurales, que no llevan lista. */
    confirmedBy?: string;
    /** B.314: los puntos de la entrada del juez. Ausente en los análisis
     *  guardados antes del 05/10/2026, que se pintan como siempre. */
    puntos?: PuntoDeSolapamiento[];
  }>;
  discrepancies?: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
    existingDocumentId?: string;
    /** F-88 paso 2: ver `Problem.origen`. */
    origen?: 'diff_tabular';
    /** F-88 ficha A: ver `Problem.groupId`. */
    groupId?: string;
    /** F-86 paso 3: lo pone el SERVIDOR al releer un análisis guardado, cuando
     *  su huella está entre los descartes de la organización. El cliente no lo
     *  calcula —la huella es de servidor— y en el jsonb guardado no existe:
     *  es estado del usuario, no del análisis. */
    dismissed?: boolean;
    confidence?: 'alta' | 'posible';
    severity?: 'contradiction' | 'minor_inconsistency';
    /** F-70: presentes desde d384a315; undefined en análisis anteriores. */
    /** F-94: la huella tabular que calculó el diff. Ver `Problem.huella`. */
    huella?: string;
    comparedValues?: ComparedValue[];
    newDocRow?: string;
    existingDocRow?: string;
  }>;
  minorInconsistencies?: Array<{
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocument: string;
    existingDocumentId?: string;
    /** F-86 paso 3: igual que en `discrepancies`. */
    dismissed?: boolean;
  }>;
  /**
   * F-88 ficha A — LAS TARJETAS AGRUPADAS que emitió el servidor.
   *
   * Opcional PARA SIEMPRE: los análisis guardados antes de la emisión no las
   * traen, y la bandeja los relee meses después. Un análisis sin `tableDiffs`
   * se pinta exactamente como antes.
   */
  tableDiffs?: GrupoDeTablas[];
  newInformation?: string;
  recommendation?: string;
  suggestedActions?: Array<{ action: string; target: string; reason: string }>;
  summary?: string;
  /** F-71: etapas que cayeron a su fallback por fallo del LLM. No vacío = el
   *  resultado está incompleto y la lista de problemas no es exhaustiva. */
  stageFailures?: Array<{ stage: string; detail?: string }>;
  /** F-74 P2: alcance del análisis. NO se convierte en Problem — no es un
   *  hallazgo sobre el documento, es una nota sobre qué no se llegó a
   *  comparar. Lo pinta ChatPanel aparte, como el aviso de incompleto. */
  selectionLimits?: Array<{
    documentName: string;
    sheetName: string | null;
    tableId: string;
    rowsLeftOut: number;
    rowsRecovered: number;
  }>;
  /** B.244 paso 2: contra cuántos se comparó, de los afines que hubo.
   *  Tampoco se convierte en Problem, por el mismo motivo.
   *  ⚠️ EL TIPO SE IMPORTA, NO SE COPIA (16/09/2026). Aquí había una copia
   *  literal `{ comparados; afines }` que, al ganar el aviso el campo `reparto`,
   *  lo habría dejado fuera del tipo sin que `tsc` dijera nada — la prop es
   *  opcional y los datos llegan igual por el JSON. */
  coberturaDeCandidatos?: CoberturaDeCandidatos;
}
