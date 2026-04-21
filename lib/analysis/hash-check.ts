import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fase 2 del análisis exhaustivo — Hash exacto del contenido.
 *
 * Genera un SHA-256 del texto normalizado para detección determinista
 * de duplicados literales. Coste: cero. Precisión: 100% en duplicados exactos.
 *
 * La normalización elimina diferencias de formato irrelevantes:
 * espacios extra, saltos de línea duplicados, mayúsculas/minúsculas,
 * tabulaciones, retornos de carro, BOM, etc.
 */

/** Resultado de la comprobación de hash. */
export interface HashCheckResult {
  /** Hash SHA-256 del texto normalizado (hex, 64 chars). */
  contentHash: string;
  /** true si ya existe un documento con el mismo hash en la organización. */
  isDuplicateExact: boolean;
  /** Nombre del documento existente con el mismo hash (si existe). */
  duplicateOfName: string | null;
  /** ID del documento existente con el mismo hash (si existe). */
  duplicateOfId: string | null;
}

/**
 * Normaliza el texto para que variaciones de formato irrelevantes
 * no afecten al hash. Dos documentos con el mismo contenido real
 * pero formato ligeramente distinto deben dar el mismo hash.
 */
export function normalizeTextForHash(text: string): string {
  return text
    .replace(/\uFEFF/g, '')           // Eliminar BOM
    .replace(/\r\n/g, '\n')           // CRLF → LF
    .replace(/\r/g, '\n')             // CR suelto → LF
    .replace(/\t/g, ' ')              // Tabs → espacios
    .replace(/[^\S\n]+/g, ' ')        // Múltiples espacios (no saltos) → uno
    .replace(/\n{3,}/g, '\n\n')       // 3+ saltos → 2
    .replace(/ +\n/g, '\n')           // Espacios antes de salto
    .replace(/\n +/g, '\n')           // Espacios después de salto
    .trim()
    .toLowerCase();
}

/** Genera el hash SHA-256 del texto normalizado. */
export function generateContentHash(text: string): string {
  const normalized = normalizeTextForHash(text);
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Comprueba si ya existe un documento con el mismo contenido en la organización.
 * Busca en la columna `content_hash` de la tabla `documents`.
 *
 * Si la columna no existe aún (migración pendiente), no falla:
 * devuelve isDuplicateExact = false y deja que el pipeline continúe.
 */
export async function checkContentHash(
  supabase: SupabaseClient,
  text: string,
  orgId: string,
  excludeDocumentId?: string,
): Promise<HashCheckResult> {
  const contentHash = generateContentHash(text);

  try {
    let query = supabase
      .from('documents')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('content_hash', contentHash)
      .limit(1);

    if (excludeDocumentId) {
      query = query.neq('id', excludeDocumentId);
    }

    const { data, error } = await query;

    // Si la columna no existe, Supabase devuelve un error 400.
    // No rompemos el pipeline: simplemente no tenemos hash check.
    if (error) {
      console.warn('[hash-check] Query failed (columna content_hash sin crear?):', error.message);
      return { contentHash, isDuplicateExact: false, duplicateOfName: null, duplicateOfId: null };
    }

    if (data && data.length > 0) {
      return {
        contentHash,
        isDuplicateExact: true,
        duplicateOfName: data[0].name,
        duplicateOfId: data[0].id,
      };
    }

    return { contentHash, isDuplicateExact: false, duplicateOfName: null, duplicateOfId: null };
  } catch (err) {
    console.warn('[hash-check] Unexpected error:', err);
    return { contentHash, isDuplicateExact: false, duplicateOfName: null, duplicateOfId: null };
  }
}
