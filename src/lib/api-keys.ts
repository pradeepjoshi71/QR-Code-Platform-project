import { createHash } from 'crypto';
import { nanoid } from 'nanoid';

export interface GeneratedApiKey {
  raw: string;
  hash: string;
  prefix: string;
}

/**
 * Computes the SHA-256 hash of an API key.
 * Only the hash is stored in the database; the raw key is never stored.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generates a new API key with the "qrp_" prefix followed by 32 random characters.
 * Returns the raw key (shown once), its SHA-256 hash (stored in DB), and an 8-char display prefix.
 */
export function generateApiKey(): GeneratedApiKey {
  const raw = `qrp_${nanoid(32)}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 8); // e.g. "qrp_a1b2"
  return { raw, hash, prefix };
}
