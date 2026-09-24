import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Reuse same org-membership auth pattern from all other API routes
async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const userId = session.user.id;
  let activeOrgId = session.user.activeOrgId;

  if (!activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      return { error: 'No workspace found for this user', status: 403 };
    }
    activeOrgId = membership.orgId;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: activeOrgId,
      },
    },
  });

  if (!membership) {
    return { error: 'Access to the specified workspace is forbidden', status: 403 };
  }

  return { userId, activeOrgId, membership };
}

// GET /api/campaigns — list all campaigns for the active org
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId: activeOrgId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { qrCodes: true } },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Failed to list campaigns:', error);
    return NextResponse.json({ error: 'Failed to retrieve campaigns.' }, { status: 500 });
  }
}

// POST /api/campaigns — create a new campaign scoped to active org
export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'A valid campaign name is required.' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: activeOrgId,
        name: name.trim(),
        description:
          description && typeof description === 'string' && description.trim()
            ? description.trim()
            : null,
      },
      include: {
        _count: { select: { qrCodes: true } },
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 });
  }
}
