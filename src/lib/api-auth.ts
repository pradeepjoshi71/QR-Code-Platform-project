import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/api-keys';

export interface AuthenticatedApiKey {
  organizationId: string;
  apiKeyId: string;
  createdByUserId: string;
  keyHash: string;
}

/**
 * Authenticates an incoming HTTP request using a Bearer API key.
 * Expected header: `Authorization: Bearer qrp_<token>`
 * Hashes the incoming key with SHA-256 and searches for an active (non-revoked) ApiKey record.
 * Returns { organizationId, apiKeyId, createdByUserId } or null.
 * On success, updates `lastUsedAt` to now() (fire-and-forget, non-blocking).
 */
export async function authenticateApiKey(
  req: Request
): Promise<AuthenticatedApiKey | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const rawKey = parts[1];
  if (!rawKey.startsWith('qrp_')) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      organizationId: true,
      createdByUserId: true,
      revokedAt: true,
    },
  });

  if (!apiKey || apiKey.revokedAt !== null) {
    return null;
  }

  // Fire-and-forget: update lastUsedAt timestamp without blocking response
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err: unknown) => {
      console.error('Failed to update API key lastUsedAt:', err);
    });

  return {
    organizationId: apiKey.organizationId,
    apiKeyId: apiKey.id,
    createdByUserId: apiKey.createdByUserId,
    keyHash,
  };
}
