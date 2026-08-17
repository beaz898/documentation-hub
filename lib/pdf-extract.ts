/**
 * Extracción de texto de PDF con motor primario + motor de reserva.
 *
 * Motor primario: pdf-parse (pdf.js antiguo empaquetado). Es el que se ha
 * usado siempre; los PDFs que ya funcionaban siguen yendo por aquí.
 * Motor de reserva: unpdf (pdf.js moderno). Solo se activa si el primario
 * lanza (p. ej. "bad XRef entry") o devuelve texto vacío. pdf-parse no
 * expone opciones de tolerancia, por eso hace falta un segundo motor.
 */

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  let primaryFailure: string;

  // 1) Motor primario — camino de siempre
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data.text ?? '';
    if (text.trim().length > 0) return text;
    primaryFailure = 'devolvió texto vacío';
  } catch (err) {
    primaryFailure = describeError(err);
  }

  // 2) Motor de reserva — tolerante a XRef dañado
  try {
    const { extractText: unpdfExtractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await unpdfExtractText(pdf, { mergePages: true });
    const merged = Array.isArray(text) ? text.join('\n') : text;
    console.warn(
      `[PDF EXTRACT] Motor primario falló (${primaryFailure}); reserva unpdf OK, ${merged.length} chars`
    );
    return merged;
  } catch (fallbackErr) {
    const fallbackFailure = describeError(fallbackErr);
    console.error(
      `[PDF EXTRACT] Ambos motores fallaron. primario=${primaryFailure} reserva=${fallbackFailure}`
    );
    throw new Error(
      `No se pudo extraer texto del PDF (motor principal: ${primaryFailure}; motor de reserva: ${fallbackFailure})`
    );
  }
}
