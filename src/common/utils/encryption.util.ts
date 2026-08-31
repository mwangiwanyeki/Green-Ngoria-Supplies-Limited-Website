/**
 * AES-256-GCM encryption helpers for at-rest encryption of sensitive
 * secrets (e.g. TOTP/MFA secrets) stored in the database.
 *
 * Keyed off `ENCRYPTION_KEY` (validated as required, min 32 chars, in
 * `src/config/validation.schema.ts`). The raw env var is hashed with
 * SHA-256 to derive a stable 32-byte AES-256 key regardless of the exact
 * length/encoding of the configured secret.
 *
 * Ciphertext format (base64 of the concatenated buffer):
 *   [12-byte IV][16-byte GCM auth tag][ciphertext]
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV, recommended for GCM
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string, secret: string): string {
  const key = deriveKey(secret);
  const data = Buffer.from(ciphertext, 'base64');

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}
