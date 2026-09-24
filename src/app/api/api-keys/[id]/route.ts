import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit-log';

// ---------------------------------------------------------------------------
// Auth helper — verifies user and retrieves active organization membership
// ---------------------------------------------------------------------------
async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const userId = session.user.id;
  let activeOrgId = session.user.activeOrgId;

  if (!activeOrgId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!firstMembership) {
      return { error: 'No workspace found for this user', status: 403 } as const;
    }
    activeOrgId = firstMembership.orgId;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: activeOrgId } },
    include: { organization: true },
  });

  if (!membership) {
    return { error: 'Access to the specified workspace is forbidden', status: 403 } as const;
  }

  return { userId, activeOrgId, membership };
}

// ---------------------------------------------------------------------------
// DELETE /api/api-keys/[id]
// Revoke an API key (soft-revoke: sets revokedAt, does not hard-delete).
// Requires OWNER or ADMIN role.
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    if (membership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can revoke API keys.' },
        { status: 403 }
      );
    }

    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required.' }, { status: 400 });
    }

    const existingKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!existingKey || existingKey.organizationId !== activeOrgId) {
      return NextResponse.json(
        { error: 'API key not found in this workspace.' },
        { status: 404 }
      );
    }

    if (existingKey.revokedAt) {
      return NextResponse.json(
        { error: 'This API key has already been revoked.' },
        { status: 400 }
      );
    }

    // Soft-revoke key for audit trail
    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        revokedAt: true,
      },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'apikey.revoked',
      targetType: 'ApiKey',
      targetId: keyId,
      metadata: {
        name: existingKey.name,
        keyPrefix: existingKey.keyPrefix,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully.',
      apiKey: updatedKey,
    });
  } catch (error: unknown) {
    console.error('Failed to revoke API key:', error);
    const message = error instanceof Error ? error.message : 'Failed to revoke API key.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
