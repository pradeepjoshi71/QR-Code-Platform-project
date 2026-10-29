import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

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
