import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';

// Use URL-safe alphanumeric characters without confusing lookalikes (0/O, 1/I/l)
const alphabet = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const generateNanoId = customAlphabet(alphabet, 8);

/**
 * Generates an 8-character unique short code with collision check and retry logic.
 */
export async function generateUniqueShortCode(maxRetries = 5): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidate = generateNanoId();
    const existing = await prisma.qrCode.findUnique({
      where: { shortCode: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Failed to generate a unique short code after multiple attempts.');
}
