/**
 * Trocea documentos en fragmentos (chunks) para indexación.
 *
 * Estrategia: si el texto tiene encabezados Markdown, corta por SECCIÓN
 * (cada encabezado abre una sección que dura hasta el siguiente encabezado
 * del mismo nivel o superior). Las secciones grandes se subdividen por
 * longitud conservando su título; las pequeñas se fusionan con la
 * siguiente. Sin encabezados detectables, corta por longitud como siempre
 * (párrafo, punto, salto de línea) — formatos sin estructura no se quedan
 * sin trocear.
 */

import { extractPdfText } from './pdf-extract';

export interface Chunk {
  text: string;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
    orgId: string;
  };
}

const CHUNK_SIZE = 1200;      // objetivo de tamaño por trozo (caso sin estructura y subdivisiones)
const CHUNK_OVERLAP = 200;    // solapamiento; solo dentro de un trozo por longitud, nunca entre secciones
const MAX_CHUNK_SIZE = 1500;  // por encima de esto, una sección se subdivide
const MIN_CHUNK_SIZE = 300;   // por debajo de esto, una sección se fusiona con la siguiente

/** Línea de encabezado Markdown individual (sin flag 'm': para probar una línea suelta). */
const HEADING_LINE_RE = /^(#{1,6})\s/;
/** Detección de si el texto completo tiene ALGÚN encabezado, en cualquier línea. */
const HAS_ANY_HEADING_RE = /^#{1,6}\s/m;

interface Section {
  /** Línea de encabezado que abre la sección (incluida en `text`). null = preámbulo sin título antes del primer encabezado. */
  title: string | null;
  text: string;
}

/**
 * Corte por longitud con los criterios de siempre (párrafo, punto, salto de
 * línea). Usado tanto para documentos sin estructura como para subdividir
 * secciones que superan MAX_CHUNK_SIZE.
 */
function splitByLength(text: string, maxSize: number, overlap: number): string[] {
  if (text.length <= maxSize) return [text.trim()];

  const pieces: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;

    if (end < text.length) {
      // Intentar cortar en un salto de línea doble (fin de párrafo)
      const doubleNewline = text.lastIndexOf('\n\n', end);
      if (doubleNewline > start + maxSize * 0.5) {
        end = doubleNewline;
      } else {
        // Intentar cortar en un punto seguido de espacio
        const period = text.lastIndexOf('. ', end);
        if (period > start + maxSize * 0.5) {
          end = period + 1;
        } else {
          // Intentar cortar en un salto de línea simple
          const newline = text.lastIndexOf('\n', end);
          if (newline > start + maxSize * 0.5) {
            end = newline;
          }
        }
      }
    } else {
      end = text.length;
    }

    pieces.push(text.slice(start, end).trim());

    start = end - overlap;
    if (start < 0) start = 0;
    // Evitar bucle infinito
    if (end >= text.length) break;
  }

  return pieces;
}

/**
 * Parte el texto en secciones por línea de encabezado. Cada sección incluye
 * su propia línea de título y todo el texto hasta el siguiente encabezado
 * del MISMO nivel o superior (un encabezado de nivel más profundo, p. ej.
 * un "##" dentro de una sección abierta por "#", se queda dentro).
 */
function splitIntoSections(text: string): Section[] {
  const lines = text.split('\n');
  const headings: Array<{ lineIndex: number; level: number }> = [];
  lines.forEach((line, i) => {
    const m = line.match(HEADING_LINE_RE);
    if (m) headings.push({ lineIndex: i, level: m[1].length });
  });

  if (headings.length === 0) return [];

  const sections: Section[] = [];

  // Preámbulo: texto antes del primer encabezado, sin línea de título propia.
  if (headings[0].lineIndex > 0) {
    const preamble = lines.slice(0, headings[0].lineIndex).join('\n').trim();
    if (preamble) sections.push({ title: null, text: preamble });
  }

  let sectionStartLine = headings[0].lineIndex;
  let currentLevel = headings[0].level;

  for (let i = 1; i < headings.length; i++) {
    const h = headings[i];
    if (h.level <= currentLevel) {
      const sectionText = lines.slice(sectionStartLine, h.lineIndex).join('\n').trim();
      sections.push({ title: lines[sectionStartLine], text: sectionText });
      sectionStartLine = h.lineIndex;
      currentLevel = h.level;
    }
    // h.level > currentLevel: subtítulo anidado, se queda dentro de la sección abierta.
  }

  const lastText = lines.slice(sectionStartLine).join('\n').trim();
  sections.push({ title: lines[sectionStartLine], text: lastText });

  return sections;
}

/**
 * Fusiona secciones por debajo de MIN_CHUNK_SIZE con la siguiente. La
 * última sección, si queda pequeña, se fusiona con la anterior.
 */
function mergeSmallSections(sections: Section[]): Section[] {
  const merged: Section[] = [];
  let pending: Section | null = null;

  for (const section of sections) {
    const current: Section = pending
      ? { title: pending.title, text: `${pending.text}\n\n${section.text}` }
      : section;
    pending = null;

    if (current.text.length < MIN_CHUNK_SIZE) {
      pending = current;
    } else {
      merged.push(current);
    }
  }

  if (pending) {
    if (merged.length > 0) {
      const prev = merged.pop()!;
      merged.push({ title: prev.title, text: `${prev.text}\n\n${pending.text}` });
    } else {
      merged.push(pending);
    }
  }

  return merged;
}

/** Subdivide una sección que supera MAX_CHUNK_SIZE, conservando su línea de título al principio de cada subtrozo. */
function subdivideSection(section: Section): string[] {
  if (!section.title) {
    return splitByLength(section.text, CHUNK_SIZE, CHUNK_OVERLAP);
  }

  const body = section.text.slice(section.title.length).replace(/^\n+/, '');
  if (!body) return [section.title];

  return splitByLength(body, CHUNK_SIZE, CHUNK_OVERLAP)
    .map(piece => `${section.title}\n\n${piece}`);
}

function buildChunks(
  pieces: string[],
  documentId: string,
  documentName: string,
  orgId: string,
): Chunk[] {
  const chunks: Chunk[] = [];
  for (const piece of pieces) {
    if (piece.length > 50) { // ignorar chunks muy pequeños
      chunks.push({
        text: piece,
        metadata: {
          documentId,
          documentName,
          chunkIndex: chunks.length,
          totalChunks: 0, // se actualiza después
          orgId,
        },
      });
    }
  }
  chunks.forEach(c => { c.metadata.totalChunks = chunks.length; });
  return chunks;
}

/**
 * Divide un texto en chunks. Corta por sección si hay encabezados Markdown;
 * si no, por longitud (párrafo, punto, salto de línea), como antes.
 */
export function chunkText(
  text: string,
  documentId: string,
  documentName: string,
  orgId: string
): Chunk[] {
  // Limpiar texto
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (cleaned.length <= CHUNK_SIZE) {
    return [{
      text: cleaned,
      metadata: {
        documentId,
        documentName,
        chunkIndex: 0,
        totalChunks: 1,
        orgId,
      },
    }];
  }

  if (!HAS_ANY_HEADING_RE.test(cleaned)) {
    // Caso 4: sin estructura detectable, corte por longitud de siempre.
    const pieces = splitByLength(cleaned, CHUNK_SIZE, CHUNK_OVERLAP);
    return buildChunks(pieces, documentId, documentName, orgId);
  }

  const sections = mergeSmallSections(splitIntoSections(cleaned));

  const pieces: string[] = [];
  for (const section of sections) {
    if (section.text.length > MAX_CHUNK_SIZE) {
      pieces.push(...subdivideSection(section));
    } else {
      pieces.push(section.text);
    }
  }

  return buildChunks(pieces, documentId, documentName, orgId);
}

/**
 * Deshace el escapado de caracteres especiales que mammoth.convertToMarkdown
 * aplica al texto (p. ej. "\." -> ".", "\(" -> "("). Sin esto, las citas
 * literales que el judge copia del documento no coinciden con el texto real
 * (findBestMatch busca "1. Introducción", no "1\. Introducción").
 */
function unescapeMarkdown(text: string): string {
  return text.replace(/\\([.()[\]{}\-_*#+!`>~|])/g, '$1');
}

/**
 * Detecta líneas de título numerado ("1. Introducción", "3.1 Menores e
 * incapacitados") y las convierte en encabezados Markdown. Verificado en
 * muestras reales de PDF y DOCX: estos documentos numeran sus secciones a
 * mano sin usar estilos de encabezado reconocibles por el extractor.
 * Un nivel de numeración ("1.") -> "#". Dos niveles ("3.1") -> "##".
 */
function normalizeNumberedHeadings(text: string): string {
  const HEADING_LINE = /^(\d+(?:\.\d+)?)\.?\s+\S/;
  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('#')) return line;
      if (line.length >= 80) return line;
      if (line.trim().endsWith('.')) return line;

      const match = line.match(HEADING_LINE);
      if (!match) return line;

      // Se conserva la línea original tal cual (solo se antepone el marcador):
      // reescribir el separador numérico alteraría el texto literal que
      // findBestMatch necesita encontrar verbatim en el documento.
      const level = match[1].includes('.') ? '##' : '#';
      return `${level} ${line}`;
    })
    .join('\n');
}

/** Presupuesto de caracteres por bloque de tabla (cabecera de hoja + fila de
 *  cabecera de columnas + separador + filas acumuladas). Con margen por
 *  debajo de MAX_CHUNK_SIZE para que subdivideSection nunca llegue a
 *  trocear un bloque ya construido: si lo hiciera, los subtrozos
 *  posteriores al primero perderían la fila de cabecera de columnas. */
const EXCEL_BLOCK_CHAR_BUDGET = MAX_CHUNK_SIZE - 300;

function extractTextFromExcel(buffer: Buffer): string {
  // Dynamic import avoided here — xlsx is a sync library, require works fine.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const xlsx = require('xlsx') as typeof import('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  if (!workbook.SheetNames.length) return '';

  return workbook.SheetNames
    .map((name: string) => {
      const sheet = workbook.Sheets[name];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      if (rows.length < 2) return '';

      const header = rows[0].map(cell => String(cell ?? ''));
      const dataRows = rows.slice(1).map(row =>
        header.map((_, i) => String((row as unknown[])[i] ?? ''))
      );

      const toMdRow = (cells: string[]) => `| ${cells.join(' | ')} |`;
      const headerBlock = [toMdRow(header), toMdRow(header.map(() => '---'))].join('\n');

      // Bloques por presupuesto de caracteres, no por número fijo de filas:
      // el ancho de una fila depende del contenido, así que un número fijo
      // puede superar MAX_CHUNK_SIZE y perder la cabecera al subdividirse.
      const blocks: string[] = [];
      let blockRows: string[][] = [];
      let blockCharCount = headerBlock.length;
      let blockFirstRow = 1;

      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 1;
        const rowLength = toMdRow(dataRows[i]).length + 1; // + salto de línea

        // Solo cerramos el bloque si YA tiene alguna fila: una fila que por
        // sí sola supere el presupuesto se emite igualmente, en su propio
        // bloque con cabecera, en vez de descartarla o partirla.
        if (blockRows.length > 0 && blockCharCount + rowLength > EXCEL_BLOCK_CHAR_BUDGET) {
          const table = [headerBlock, ...blockRows.map(toMdRow)].join('\n');
          blocks.push(`## Hoja: ${name} (filas ${blockFirstRow}-${rowNumber - 1})\n\n${table}`);
          blockRows = [];
          blockCharCount = headerBlock.length;
          blockFirstRow = rowNumber;
        }

        blockRows.push(dataRows[i]);
        blockCharCount += rowLength;
      }

      if (blockRows.length > 0) {
        const table = [headerBlock, ...blockRows.map(toMdRow)].join('\n');
        blocks.push(`## Hoja: ${name} (filas ${blockFirstRow}-${blockFirstRow + blockRows.length - 1})\n\n${table}`);
      }

      return blocks.join('\n\n');
    })
    .filter(Boolean)
    .join('\n\n')
    // PostgreSQL rejects null bytes in text columns; strip them.
    .replace(/\u0000/g, '');
}

/**
 * Extrae texto de diferentes formatos de archivo.
 * Soporta: .txt, .md, .pdf, .docx, .xlsx, .xlsm
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'md':
    case 'csv':
    case 'json':
    case 'html':
      return buffer.toString('utf-8');

    case 'txt':
      return normalizeNumberedHeadings(buffer.toString('utf-8'));

    case 'pdf':
      return normalizeNumberedHeadings(await extractPdfText(buffer));

    case 'docx': {
      const mammoth = await import('mammoth');
      try {
        const result = await mammoth.convertToMarkdown({ buffer });
        return normalizeNumberedHeadings(unescapeMarkdown(result.value));
      } catch (err) {
        console.warn('[extractText] convertToMarkdown falló, usando extractRawText de reserva:', err);
        const fallback = await mammoth.extractRawText({ buffer });
        return normalizeNumberedHeadings(fallback.value);
      }
    }

    case 'xlsx':
    case 'xlsm':
      return extractTextFromExcel(buffer);

    default:
      // Intentar como texto plano
      return buffer.toString('utf-8');
  }
}
