import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Cifrado y descifrado de tokens OAuth con AES-256-GCM.
 *
 * Usa la variable de entorno DRIVE_ENCRYPTION_KEY (32 bytes hex = 64 chars).
 * El texto cifrado incluye el IV y el auth tag, así que cada cifrado
 * produce un resultado distinto aunque el texto sea el mismo.
 *
 * Formato del texto cifrado: iv:authTag:ciphertext (todo en hex).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits, recomendado para GCM

/**
 * Obtiene la clave de cifrado de la variable de entorno.
 * Falla con error claro si no está configurada.
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.DRIVE_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('DRIVE_ENCRYPTION_KEY no está configurada en las variables de entorno');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('DRIVE_ENCRYPTION_KEY debe ser de 32 bytes (64 caracteres hex)');
  }
  return key;
}

/**
 * Cifra un texto plano. Devuelve el resultado en formato iv:authTag:ciphertext.
 * Si el texto está vacío, lo devuelve tal cual (no hay nada que cifrar).
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descifra un texto cifrado con el formato iv:authTag:ciphertext.
 * Si el texto no tiene el formato esperado (no está cifrado), lo devuelve
 * tal cual — esto permite compatibilidad con tokens guardados antes del cifrado.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';

  // Detectar si el texto está cifrado (formato iv:authTag:encrypted)
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    // No está cifrado (token legacy guardado en texto plano)
    return ciphertext;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  // Validación adicional: los campos deben ser hex válido
  if (!/^[0-9a-f]+$/i.test(ivHex) || !/^[0-9a-f]+$/i.test(authTagHex) || !/^[0-9a-f]+$/i.test(encryptedHex)) {
    // No parece un token cifrado, devolver tal cual
    return ciphertext;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('[crypto] Decrypt failed, returning raw value:', err instanceof Error ? err.message : err);
    return ciphertext;
  }
}
