import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

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
