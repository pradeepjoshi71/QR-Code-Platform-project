import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

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
