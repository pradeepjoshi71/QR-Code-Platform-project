import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
// GET /api/audit-logs
// List paginated audit logs for active organization (OWNER only).
// Query params: page (default 1), limit (default 20).
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId, membership } = authResult;

    // Strict OWNER-only authorization guard
    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can view the audit log.' },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { organizationId: activeOrgId },
        include: {
          actorUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({
        where: { organizationId: activeOrgId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to list audit logs:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve audit logs.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
