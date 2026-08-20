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

/**
 * Versión del extractor (extractText/extractSegments/chunkText). Se sube a
 * mano cada vez que cambia cómo se lee o trocea un documento. Subirla marca
 * TODOS los documentos ya indexados (con una versión anterior o sin ninguna)
 * como desactualizados frente al lector actual — es la señal que permite
 * saber cuáles habría que reprocesar.
 */
export const EXTRACTOR_VERSION = 1;

/** Línea de encabezado Markdown individual (sin flag 'm': para probar una línea suelta). */
const HEADING_LINE_RE = /^(#{1,6})\s/;
/** Detección de si el texto completo tiene ALGÚN encabezado, en cualquier línea. */
const HAS_ANY_HEADING_RE = /^#{1,6}\s/m;

/**
 * Separador entre piezas ya decididas por el extractor.
 * Las hojas de cálculo llegan con sus cortes hechos (una fila = una pieza) y
 * chunkText no debe volver a decidirlos: si se reagrupan, cada chunk mezcla
 * registros distintos y deja de parecerse a nada concreto en la búsqueda.
 * Es un marcador técnico, no texto presentable: se elimina antes de indexar.
 * No se usa '\n\n' porque una celda con saltos de línea internos lo
 * reproduciría y partiría la fila.
 */
const PRE_SEGMENTED_SEPARATOR = '\u241E';

/**
 * Elimina el marcador de segmentación del texto que se persiste o se envía a
 * un LLM (full_text, contenido del documento nuevo en el análisis, hash de
 * contenido). El marcador es una señal interna para chunkText, no texto
 * presentable: nunca debe llegar a Supabase ni a un prompt. Se sustituye por
 * '\n\n' porque es la separación visual equivalente que tendría el texto si
 * no existiera el marcador.
 */
export function stripSegmentationMarkers(text: string): string {
  return text.split(PRE_SEGMENTED_SEPARATOR).join('\n\n');
}

/**
 * Segmento tipado de la extracción. extractText sigue devolviendo un string
 * plano (join de segments[].text) para no romper a ningún llamante; esto es
 * la forma estructurada, todavía sin consumidores, pensada para cuando el
 * análisis necesite razonar sobre "esto es una fila de la tabla X" en vez de
 * un fragmento de texto suelto.
 */
export type ExtractedSegment =
  | { type: 'text'; text: string }
  | { type: 'table_summary'; text: string; sheetName: string; tableId: string }
  | {
      type: 'table_row';
      text: string;
      sheetName: string;
      tableId: string;
      /** Posición de la fila DENTRO de los datos de la tabla (0-based), no el número de fila de Excel. */
      rowIndex: number;
      cells: Record<string, string>;
    };

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
  // Camino 0: el extractor ya decidió las piezas (hojas de cálculo).
  // Se respetan tal cual; solo se subdividen las que por sí solas superen
  // MAX_CHUNK_SIZE.
  if (text.includes(PRE_SEGMENTED_SEPARATOR)) {
    const pieces: string[] = [];
    for (const raw of text.split(PRE_SEGMENTED_SEPARATOR)) {
      const piece = raw.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
      if (!piece) continue;
      if (piece.length > MAX_CHUNK_SIZE) {
        pieces.push(...splitByLength(piece, CHUNK_SIZE, CHUNK_OVERLAP));
      } else {
        pieces.push(piece);
      }
    }
    return buildChunks(pieces, documentId, documentName, orgId);
  }

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

/**
 * Elimina el bloque de portada (empresa, departamento, título, versión) antes
 * del primer encabezado, si tiene FORMA de rótulo (líneas cortas sin oraciones)
 * y no de prosa. Es metadato del documento, no contenido: si se indexa, compite
 * como candidato en el análisis y genera solapamientos y contradicciones
 * espurias entre documentos que solo comparten membrete.
 */
export function stripDocumentFrontMatter(text: string): string {
  if (!HAS_ANY_HEADING_RE.test(text)) return text;

  const lines = text.split('\n');
  const firstHeadingIndex = lines.findIndex(line => /^#{1,6}\s/.test(line));
  if (firstHeadingIndex <= 0) return text;

  const preamble = lines.slice(0, firstHeadingIndex);
  const body = lines.slice(firstHeadingIndex);
  const meaningful = preamble.filter(line => line.trim().length > 0);

  if (meaningful.length === 0) return text;

  // Regla de FORMA, no de vocabulario: un rótulo son etiquetas cortas sin
  // frases. Prosa real tiene oraciones. Si el preámbulo parece prosa, se queda.
  const MAX_PREAMBLE_CHARS = 400;
  const MAX_PREAMBLE_LINES = 8;
  const MAX_LINE_CHARS = 120;

  const totalChars = meaningful.join('\n').length;
  if (totalChars > MAX_PREAMBLE_CHARS) return text;
  if (meaningful.length > MAX_PREAMBLE_LINES) return text;

  const looksLikeLabels = meaningful.every(line => {
    const t = line.trim();
    if (t.length > MAX_LINE_CHARS) return false;
    if (/\.\s/.test(t)) return false;  // contiene fin de oración interno
    return !/\.$/.test(t);             // termina en punto = oración
  });
  if (!looksLikeLabels) return text;

  const stripped = body.join('\n').trim();
  // Red de seguridad: nunca dejar el documento sin contenido.
  if (stripped.length < 200) return text;

  console.log('[stripDocumentFrontMatter] preámbulo eliminado', {
    lineas: meaningful.length,
    caracteres: totalChars,
  });
  return stripped;
}

/** Nº mínimo de celdas rellenas para considerar que una fila es de tabla. */
const MIN_TABLE_COLUMNS = 2;

/** Filas contiguas no vacías. Una fila vacía separa islas. */
function splitSheetIntoIslands(rows: string[][]): Array<{ rowNumber: number; cells: string[] }[]> {
  const islands: Array<{ rowNumber: number; cells: string[] }[]> = [];
  let current: { rowNumber: number; cells: string[] }[] = [];
  rows.forEach((cells, index) => {
    const isBlank = cells.every(cell => cell === '');
    if (isBlank) {
      if (current.length > 0) { islands.push(current); current = []; }
      return;
    }
    current.push({ rowNumber: index + 1, cells });
  });
  if (current.length > 0) islands.push(current);
  return islands;
}

/** Nombres de columna limpios y sin duplicados. */
function normalizeColumnNames(headerCells: string[]): string[] {
  const used = new Map<string, number>();
  return headerCells.map((raw, index) => {
    const base = raw.replace(/\s+/g, ' ').trim() || `Columna ${index + 1}`;
    const seen = used.get(base);
    if (seen === undefined) { used.set(base, 1); return base; }
    used.set(base, seen + 1);
    return `${base} (${seen + 1})`;
  });
}

function countFilledCells(cells: string[]): number {
  return cells.filter(cell => cell !== '').length;
}

function extractSegmentsFromExcel(buffer: Buffer): ExtractedSegment[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const xlsx = require('xlsx') as typeof import('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  if (!workbook.SheetNames.length) return [];

  const segments: ExtractedSegment[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    const rows = rawRows.map(row =>
      (row ?? []).map(cell => String(cell ?? '').trim())
    );
    const prefix = `[Hoja "${sheetName}"]`;
    // Cuenta solo islas con forma de tabla, en orden de aparición dentro de
    // la hoja: mismo fichero -> mismo orden siempre -> mismo tableId siempre.
    let tableIndex = 0;

    for (const island of splitSheetIntoIslands(rows)) {
      const headerPosition = island.findIndex(
        row => countFilledCells(row.cells) >= MIN_TABLE_COLUMNS
      );
      const dataRows =
        headerPosition === -1
          ? []
          : island
              .slice(headerPosition + 1)
              .filter(row => countFilledCells(row.cells) >= MIN_TABLE_COLUMNS);

      // Isla sin forma de tabla (título, leyenda, totales): se emite tal cual.
      // Nunca se descarta texto: en el peor caso se indexa con menos estructura.
      if (headerPosition === -1 || dataRows.length === 0) {
        for (const row of island) {
          const line = row.cells.filter(cell => cell !== '').join(' · ');
          if (line) segments.push({ type: 'text', text: `${prefix} ${line}` });
        }
        continue;
      }

      const headerCells = island[headerPosition].cells;
      let width = headerCells.length;
      while (width > 0 && headerCells[width - 1] === '') width--;
      const columns = normalizeColumnNames(headerCells.slice(0, width));

      const tableId = `${sheetName}#${tableIndex}`;
      tableIndex++;

      segments.push({
        type: 'table_summary',
        text:
          `${prefix} Tabla con ${dataRows.length} filas y ${columns.length} columnas. ` +
          `Columnas: ${columns.join(', ')}.`,
        sheetName,
        tableId,
      });

      dataRows.forEach((row, rowIndex) => {
        const cells: Record<string, string> = {};
        const pairs: string[] = [];
        columns.forEach((column, index) => {
          const value = row.cells[index] ?? '';
          if (value === '') return;
          cells[column] = value;
          pairs.push(`${column}: ${value}`);
        });
        if (pairs.length > 0) {
          segments.push({
            type: 'table_row',
            text: `${prefix} ${pairs.join(' | ')}`,
            sheetName,
            tableId,
            rowIndex,
            cells,
          });
        }
      });
    }
  }

  return segments;
}

/**
 * Extrae los segmentos tipados de un documento. extractText (debajo) se
 * construye encima de esta función y sigue devolviendo un string plano para
 * no romper a ningún llamante existente — esta es la forma estructurada,
 * todavía sin consumidores.
 * Soporta: .txt, .md, .pdf, .docx, .xlsx, .xlsm
 */
export async function extractSegments(
  buffer: Buffer,
  filename: string
): Promise<ExtractedSegment[]> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'md':
    case 'csv':
    case 'json':
    case 'html':
      return [{ type: 'text', text: buffer.toString('utf-8') }];

    case 'txt':
      return [{ type: 'text', text: stripDocumentFrontMatter(normalizeNumberedHeadings(buffer.toString('utf-8'))) }];

    case 'pdf':
      return [{ type: 'text', text: stripDocumentFrontMatter(normalizeNumberedHeadings(await extractPdfText(buffer))) }];

    case 'docx': {
      const mammoth = await import('mammoth');
      try {
        const result = await mammoth.convertToMarkdown({ buffer });
        return [{ type: 'text', text: stripDocumentFrontMatter(normalizeNumberedHeadings(unescapeMarkdown(result.value))) }];
      } catch (err) {
        console.warn('[extractSegments] convertToMarkdown falló, usando extractRawText de reserva:', err);
        const fallback = await mammoth.extractRawText({ buffer });
        return [{ type: 'text', text: stripDocumentFrontMatter(normalizeNumberedHeadings(fallback.value)) }];
      }
    }

    case 'xlsx':
    case 'xlsm':
      return extractSegmentsFromExcel(buffer);

    default:
      // Intentar como texto plano
      return [{ type: 'text', text: buffer.toString('utf-8') }];
  }
}

/**
 * Extrae texto de diferentes formatos de archivo, como string plano.
 * Envoltorio delgado sobre extractSegments: une segments[].text con el mismo
 * separador y limpieza que usaba la extracción de Excel, de forma que el
 * resultado es idéntico al de antes de existir extractSegments para los
 * nueve formatos soportados.
 * Soporta: .txt, .md, .pdf, .docx, .xlsx, .xlsm
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const segments = await extractSegments(buffer, filename);
  return segments
    .map(s => s.text)
    .join(PRE_SEGMENTED_SEPARATOR)
    .replace(/\u0000/g, '');
}
