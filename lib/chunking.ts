/**
 * Trocea documentos en fragmentos (chunks) para indexación.
 *
 * Estrategia: chunks de ~500 tokens (~2000 chars) con overlap de 200 chars.
 * Esto asegura que el contexto no se corte en mitad de una idea.
 */

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

const CHUNK_SIZE = 2000;     // ~500 tokens
const CHUNK_OVERLAP = 200;   // solapamiento entre chunks

/**
 * Divide un texto en chunks con overlap.
 * Intenta cortar en saltos de línea o puntos para no romper frases.
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

  const chunks: Chunk[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + CHUNK_SIZE;

    if (end < cleaned.length) {
      // Intentar cortar en un salto de línea doble (fin de párrafo)
      const doubleNewline = cleaned.lastIndexOf('\n\n', end);
      if (doubleNewline > start + CHUNK_SIZE * 0.5) {
        end = doubleNewline;
      } else {
        // Intentar cortar en un punto seguido de espacio
        const period = cleaned.lastIndexOf('. ', end);
        if (period > start + CHUNK_SIZE * 0.5) {
          end = period + 1;
        } else {
          // Intentar cortar en un salto de línea simple
          const newline = cleaned.lastIndexOf('\n', end);
          if (newline > start + CHUNK_SIZE * 0.5) {
            end = newline;
          }
        }
      }
    } else {
      end = cleaned.length;
    }

    const chunkText = cleaned.slice(start, end).trim();
    if (chunkText.length > 50) { // ignorar chunks muy pequeños
      chunks.push({
        text: chunkText,
        metadata: {
          documentId,
          documentName,
          chunkIndex: chunks.length,
          totalChunks: 0, // se actualiza después
          orgId,
        },
      });
    }

    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    // Evitar bucle infinito
    if (end >= cleaned.length) break;
  }

  // Actualizar totalChunks
  chunks.forEach(c => { c.metadata.totalChunks = chunks.length; });

  return chunks;
}

/**
 * Extrae texto de diferentes formatos de archivo.
 * Soporta: .txt, .md, .pdf, .docx
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'txt':
    case 'md':
    case 'csv':
    case 'json':
    case 'html':
      return buffer.toString('utf-8');

    case 'pdf': {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    }

    case 'docx': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default:
      // Intentar como texto plano
      return buffer.toString('utf-8');
  }
}
