// Shared types and helpers for problem detection in ImprovementModal.

export type ProblemType =
  | 'contradiccion'
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
}

export interface RawAnalysis {
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateConfidence?: number;
  overlaps?: Array<{ existingDocument: string; description: string; severity: string }>;
  discrepancies?: Array<{ topic: string; newDocSays: string; existingDocSays: string; existingDocument: string }>;
  newInformation?: string;
  recommendation?: string;
  suggestedActions?: Array<{ action: string; target: string; reason: string }>;
  summary?: string;
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
        relatedDoc: o.existingDocument,
      });
    });
  }

  if (analysis.discrepancies) {
    analysis.discrepancies.forEach((d, i) => {
      out.push({
        id: `disc-${i}`,
        type: 'contradiccion',
        title: d.topic || `Contradicción con "${d.existingDocument}"`,
        description: `En este documento: "${d.newDocSays}". En "${d.existingDocument}": "${d.existingDocSays}".`,
        textRef: d.newDocSays,
        relatedDoc: d.existingDocument,
      });
    });
  }

  return out;
}
