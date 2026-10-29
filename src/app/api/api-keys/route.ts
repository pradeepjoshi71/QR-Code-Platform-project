import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-keys';
import { logAction } from '@/lib/audit-log';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

// ---------------------------------------------------------------------------
// GET /api/api-keys
// List all API keys for active organization (OWNER/ADMIN only).
// Never returns keyHash or raw key.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId, membership } = authResult;

    if (membership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can view API keys.' },
        { status: 403 }
      );
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId: activeOrgId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apiKeys });
  } catch (error: unknown) {
    console.error('Failed to list API keys:', error);
    const message = error instanceof Error ? error.message : 'Failed to list API keys.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/api-keys
// Create a new API key (OWNER/ADMIN only).
// Returns the raw key exactly once; hash is stored in DB.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    if (membership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can create API keys.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'A key name is required.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Key name must be 50 characters or fewer.' },
        { status: 400 }
      );
    }

    const { raw, hash, prefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: activeOrgId,
        name: trimmedName,
        keyHash: hash,
        keyPrefix: prefix,
        createdByUserId: userId,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
      },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'apikey.created',
      targetType: 'ApiKey',
      targetId: apiKey.id,
      metadata: {
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
      },
    });

    // Return the raw key once — never retrievable again
    return NextResponse.json({ apiKey, rawKey: raw }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create API key:', error);
    const message = error instanceof Error ? error.message : 'Failed to create API key.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
