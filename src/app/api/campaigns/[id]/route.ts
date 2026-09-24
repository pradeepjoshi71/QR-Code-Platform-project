import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

// PATCH /api/campaigns/[id] — rename or update description
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;
    const { id } = params;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== activeOrgId) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description } = body;

    const dataToUpdate: { name?: string; description?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      }
      dataToUpdate.name = name.trim();
    }

    if (description !== undefined) {
      dataToUpdate.description =
        description && typeof description === 'string' && description.trim()
          ? description.trim()
          : null;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: dataToUpdate,
      include: { _count: { select: { qrCodes: true } } },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign.' }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] — delete campaign; QR codes are NOT deleted (SetNull via FK)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;
    const { id } = params;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== activeOrgId) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    // The DB FK (onDelete: SetNull) nulls qr_codes.campaignId automatically.
    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ message: 'Campaign deleted. QR codes were not affected.' });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign.' }, { status: 500 });
  }
}
