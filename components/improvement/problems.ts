// Shared types and helpers for problem detection in ImprovementModal.

import type { ComparedValue, GrupoDeTablas } from '@/lib/analysis/types';

export type { ComparedValue };

export type ProblemType =
  | 'contradiccion'
  | 'inconsistencia_menor'
  | 'duplicidad'
  | 'ortografia'
  | 'ambiguedad'
  | 'sugerencia';

export interface Problem {
  id: string;
  type: ProblemType;
  title: string;
  description: string;
  textRef?: string;
  relatedDoc?: string;
  /**
   * F-86 paso 0 — el ID del documento relacionado, HERMANO de `relatedDoc`.
   *
   * `relatedDoc` (el nombre) sigue siendo lo que se pinta y lo que entra en los
   * prompts de ImprovementModal; esto NO se enseña ni se le da a ningún modelo.
   *
   * ES EL FINAL DEL RECORRIDO de este commit: aquí es donde el id tiene que
   * llegar para que el commit siguiente —la persistencia de descartes— pueda
   * pedirle al servidor una huella bidireccional en vez de calcularla en el
   * cliente con el nombre, que es lo que hace hoy `makeDiscrepancyFingerprint`
   * en useCrossDocAnalysis.ts.
   *
   * OPCIONAL PARA SIEMPRE: los análisis del jsonb anteriores a este commit no
   * lo traen, y la bandeja los relee meses después.
   */
  relatedDocId?: string;
  /**
   * F-86 paso 3 — LO QUE DICE EL OTRO DOCUMENTO, en crudo.
   *
   * Hasta ahora esto solo existía EMBEBIDO dentro de `description` («En "X":
   * "…"»), o sea inseparable de una frase pensada para leerse. La huella de
   * prosa lo necesita SUELTO: `huellaDeProsa` se construye con las citas de
   * los DOS lados, y sacarlo de la descripción a base de expresiones regulares
   * habría hecho la identidad dependiente del formato de una frase.
   *
   * HERMANO, como `relatedDocId`: `description` no cambia y sigue siendo lo
   * que el usuario lee y lo que leen los tres prompts de ImprovementModal.
   */
  relatedDocSays?: string;
  /**
   * F-88 paso 2 — DE QUÉ MATERIA ES ESTE HALLAZGO.
   *
   * `diff_tabular` = viene del diff de tablas. Su única consecuencia HOY es
   * que se le SUPRIMEN LAS ACCIONES POR FILA, y el motivo no es estético: la
   * tarjeta actual trae el botón de descarte respaldado por la maquinaria de
   * huella de PROSA. Un usuario que lo pulsara sobre una fila tabular
   * registraría el juicio con una identidad de texto — el desajuste exacto que
   * F-86 acaba de matar.
   *
   * Las acciones de verdad llegan con la ficha (commit siguiente), sobre huella
   * TABULAR. Mientras tanto el hallazgo se ve, que es lo que importa: verdad
   * sin promesa de memoria, y es un intervalo de obra, no un estado del
   * producto (F-88 P2).
   */
  origen?: 'diff_tabular';
  /**
   * F-88 ficha A — CON QUÉ TARJETA SE JUNTA ESTA FILA.
   *
   * OPACO, y su oficio es ensamblar dentro de UN resultado: la huella
   * recuerda, el groupId ensambla (F-88 P3). Lo genera el servidor al emitir y
   * lo comparten las filas de una misma pareja de tablas con su entrada en
   * `tableDiffs`.
   *
   * NO SE USA COMO MEMORIA. Si algún día alguien lo guarda para reconocer un
   * hallazgo entre análisis, tendrá dos memorias que divergen — para eso está
   * la huella, que sí es estable.
   */
  groupId?: string;
  /** Nivel de confianza de la contradicción (solo para type 'contradiccion'). */
  confidence?: 'alta' | 'posible';
  /** Si el usuario marcó este problema como "no es un error". */
  dismissed?: boolean;
  /**
   * F-94 — LA HUELLA TABULAR DE ESTA FILA, tal como la calculó el diff.
   *
   * ⚠️ NO SE RECALCULA EN NINGÚN SITIO, y ésa es toda la decisión: la calcula
   * `huellaDeFila` en `diff-emision.ts` con la clave cruda de los dos lados, sus
   * dos `tableId` y la columna, y viaja hasta aquí por `synthesize.ts`. El
   * cliente la DEVUELVE al descartar; el servidor comprueba que es un sha256
   * bien formado y la registra.
   *
   * POR QUÉ ASÍ Y NO MANDANDO COORDENADAS, que es lo que F-94 P1 proponía:
   * recalcularla en el servidor sería una SEGUNDA implementación del mismo
   * criterio —lo que CLAUDE.md prohíbe y lo que costó B.124— y exigiría mandar
   * las dos claves crudas, los dos tableId y la columna, o sea MÁS datos que la
   * propia huella. Y no gana nada en confianza: una huella inventada registra un
   * descarte que no casa con nada, igual que unas coordenadas inventadas.
   * Lo que Fable decidió —una identidad por especie, calculada en UN sitio— se
   * cumple mejor así, porque el sitio es el diff.
   *
   * AUSENTE en los hallazgos de prosa (usan la huella de prosa) y en los
   * tabulares del camino PRE-INDEXADO, donde no hay id del documento analizado
   * y no se puede construir (F-87 P1). Su ausencia decide: sin huella no hay
   * acciones por fila — ver `mostrarAccionesDeFila`.
   */
  huella?: string;
  /** F-70: valores enfrentados por columna. Solo en contradicciones
   *  confirmadas por estructura. Es material de PRESENTACIÓN: no entra en
   *  `description` ni en nada que lea un modelo. */
  comparedValues?: ComparedValue[];
  newDocRow?: string;
  existingDocRow?: string;
}

export interface RawAnalysis {
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateConfidence?: number;
  /** F-86 paso 0: `existingDocumentId` en las tres listas — hermano del nombre,
   *  undefined en los análisis guardados antes de este commit. */
  overlaps?: Array<{ existingDocument: string; existingDocumentId?: string; description: string; severity: string; textRef?: string }>;
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
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Tries to find `find` inside `text` using progressively more tolerant strategies.
 * Returns the match range in the ORIGINAL text, or null if nothing works.
 */
export function findMatchRange(text: string, find: string): { start: number; end: number } | null {
  if (!find) return null;

  // 1. Exact match
  const exactIdx = text.indexOf(find);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + find.length };
  }

  // 2. Whitespace-normalized match
  const normFind = normalizeWhitespace(find);
  if (!normFind) return null;

  const mapping: number[] = [];
  let normText = '';
  let lastWasSpace = false;
  let started = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isSpace = /\s/.test(ch);
    if (isSpace) {
      if (!started) continue;
      if (!lastWasSpace) {
        normText += ' ';
        mapping.push(i);
        lastWasSpace = true;
      }
    } else {
      normText += ch;
      mapping.push(i);
      lastWasSpace = false;
      started = true;
    }
  }
  while (normText.endsWith(' ')) {
    normText = normText.slice(0, -1);
    mapping.pop();
  }

  const normIdx = normText.indexOf(normFind);
  if (normIdx !== -1 && mapping[normIdx] !== undefined) {
    const start = mapping[normIdx];
    const lastNormCharIdx = normIdx + normFind.length - 1;
    const endInOriginal = (mapping[lastNormCharIdx] ?? start) + 1;
    return { start, end: endInOriginal };
  }

  // 3. Fuzzy match: head + tail anchors
  if (normFind.length >= 30) {
    const head = normFind.slice(0, 15);
    const tail = normFind.slice(-15);
    const headIdx = normText.indexOf(head);
    if (headIdx !== -1) {
      const tailIdx = normText.indexOf(tail, headIdx + head.length);
      if (tailIdx !== -1) {
        const start = mapping[headIdx];
        const endInOriginal = (mapping[tailIdx + tail.length - 1] ?? start) + 1;
        if (endInOriginal - start < find.length * 2.5) {
          return { start, end: endInOriginal };
        }
      }
    }
  }

  return null;
}

export function problemsFromAnalysis(analysis: RawAnalysis): Problem[] {
  const out: Problem[] = [];

  if (analysis.isDuplicate && analysis.duplicateOf) {
    out.push({
      id: `dup-main`,
      type: 'duplicidad',
      title: `Posible duplicado de "${analysis.duplicateOf}"`,
      description: `Confianza ${analysis.duplicateConfidence ?? 0}%. Gran parte del contenido ya existe en el otro documento.`,
      relatedDoc: analysis.duplicateOf,
    });
  }

  if (analysis.overlaps) {
    analysis.overlaps.forEach((o, i) => {
      out.push({
        id: `ovl-${i}`,
        type: 'duplicidad',
        title: `Solapamiento con "${o.existingDocument}"`,
        description: `${o.description} (severidad: ${o.severity})`,
        textRef: o.textRef || undefined,
        relatedDoc: o.existingDocument,
        relatedDocId: o.existingDocumentId,
      });
    });
  }

  if (analysis.discrepancies) {
    analysis.discrepancies
      .filter(d => d.confidence !== 'posible')
      .forEach((d, i) => {
        out.push({
          id: `disc-${i}`,
          type: 'contradiccion',
          title: d.topic || `Contradicción con "${d.existingDocument}"`,
          description: `En este documento: "${d.newDocSays}". En "${d.existingDocument}": "${d.existingDocSays}".`,
          textRef: d.newDocSays,
          relatedDoc: d.existingDocument,
          // F-86 paso 0: hermano de relatedDoc. NO entra en `description` ni en
          // `title` — no se enseña y ningún prompt lo lee.
          relatedDocId: d.existingDocumentId,
          // F-86 paso 3: los dos hermanos que la huella de prosa necesita, más
          // el veredicto que el servidor ya dio sobre este hallazgo.
          relatedDocSays: d.existingDocSays,
          dismissed: d.dismissed,
          origen: d.origen,
          groupId: d.groupId,
          confidence: d.confidence,
          // F-70: solo para pintar. `description` (arriba) queda intacta, y con
          // ella lo que leen los tres prompts de ImprovementModal.
          // F-94: se TRANSPORTA, no se recalcula. Es la identidad con la que
          // el descarte tabular se recordará.
          huella: d.huella,
          comparedValues: d.comparedValues,
          newDocRow: d.newDocRow,
          existingDocRow: d.existingDocRow,
        });
      });
  }

  if (analysis.minorInconsistencies) {
    analysis.minorInconsistencies.forEach((d, i) => {
      out.push({
        id: `minor-${i}`,
        type: 'inconsistencia_menor',
        title: d.topic || `Inconsistencia con "${d.existingDocument}"`,
        description: `En este documento: "${d.newDocSays}". En "${d.existingDocument}": "${d.existingDocSays}".`,
        textRef: d.newDocSays,
        relatedDoc: d.existingDocument,
        relatedDocId: d.existingDocumentId,
        relatedDocSays: d.existingDocSays,
        dismissed: d.dismissed,
      });
    });
  }

  return out;
}

/**
 * ¿LLEVA ESTA FILA SUS ACCIONES (descartar y resolver)?
 *
 * VIVE AQUÍ, AL LADO DEL TIPO DEL QUE HABLA, y no en el módulo de la pantalla
 * que la usa hoy: decide sobre un `Problem`, así que sobrevive a cualquier
 * reorganización de cómo se pinten los problemas — y ya ha sobrevivido a una.
 *
 * SALIÓ DEL JSX por una mutación que sobrevivió: mientras la condición vivía
 * dentro del pintado, devolverle los botones a una fila tabular NO ROMPÍA
 * NINGÚN CASO, porque el alcance de la suite prohíbe React y ahí dentro no hay
 * nada que vigile.
 *
 * POR QUÉ SE LAS QUITAMOS A LAS TABULARES (F-88 P2): el botón de descarte que
 * pinta la tarjeta actual va respaldado por la maquinaria de huella de PROSA.
 * Pulsarlo sobre una fila de tabla registraría el juicio con una identidad de
 * texto — el desajuste exacto que F-86 mató. Y «resolver» propondría un
 * reemplazo de párrafo sobre una fila de hoja de cálculo.
 *
 * NO SIRVE MIRAR `confirmedBy` NI EL TIPO: R2 emite hallazgos estructurales
 * sobre PROSA y ésos SÍ conservan sus acciones. Lo que decide es la MATERIA,
 * que es lo que `origen` dice.
 *
 * ES TEMPORAL Y ESTÁ FECHADO: la ficha B trae las acciones de verdad, sobre
 * huella TABULAR. Hasta entonces, verdad sin promesa de memoria.
 */
/**
 * ¿ESTA TARJETA LLEVA ACCIONES POR FILA (descartar, resolver)?
 *
 * VIVE FUERA DEL JSX A PROPÓSITO, y no es estilo: dentro no hay nada que la
 * vigile, porque el alcance de Vitest prohíbe React. Salió de ahí por una
 * mutación que sobrevivió, y ya le ha valido la pena una vez — sobrevivió a la
 * reorganización de la ficha A sin que nadie la mirara.
 *
 * ⚠️ CAMBIÓ EL 01/09 (F-94, ficha B) Y CONVIENE LEER LAS DOS ÉPOCAS:
 *
 * ANTES devolvía `origen !== 'diff_tabular'`: NINGÚN hallazgo del diff llevaba
 * acciones. Era correcto y deliberado (F-88 P2) — el botón de descarte estaba
 * respaldado por la maquinaria de huella de PROSA, y pulsarlo sobre una fila
 * habría registrado el juicio con una identidad de texto, el desajuste que F-86
 * mató. La cláusula PAGÓ: durante todo el frente 1 no se registró ni un juicio
 * tabular con la identidad equivocada, porque el botón no existía.
 *
 * AHORA la condición es OTRA y más estrecha: lo que decide no es la materia del
 * hallazgo sino SI TIENE IDENTIDAD CON LA QUE RECORDARSE.
 *   · prosa → sí, siempre: su identidad son las citas, que siempre están.
 *   · tabular CON huella → sí: la huella tabular ya viajó desde el diff.
 *   · tabular SIN huella → NO. Es el camino pre-indexado de F-87 P1: sin id del
 *     documento analizado no hay huella, el hallazgo se emite igual —«justo ahí
 *     es donde más vale»— pero no se puede recordar. Un botón que promete
 *     memoria sin poder cumplirla es peor que no tener botón.
 */
export function mostrarAccionesDeFila(p: Problem): boolean {
  if (p.origen !== 'diff_tabular') return true;
  return typeof p.huella === 'string' && p.huella.length > 0;
}
