import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to authenticate session and verify membership in the active workspace
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

// PATCH /api/qr-codes/[id] - Update name, isActive, or destinationUrl (dynamic only)
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

    // Verify QR code exists and belongs to active organization
    const existingQr = await prisma.qrCode.findUnique({
      where: { id },
    });

    if (!existingQr || existingQr.organizationId !== activeOrgId) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, isActive, destinationUrl } = body;

    const dataToUpdate: {
      name?: string;
      isActive?: boolean;
      destinationUrl?: string;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      }
      dataToUpdate.name = name.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean.' }, { status: 400 });
      }
      dataToUpdate.isActive = isActive;
    }

    if (destinationUrl !== undefined) {
      if (existingQr.type === 'STATIC') {
        return NextResponse.json(
          { error: 'Static QR code destination URLs cannot be edited once created.' },
          { status: 400 }
        );
      }

      if (typeof destinationUrl !== 'string' || !destinationUrl.trim()) {
        return NextResponse.json({ error: 'Destination URL cannot be empty.' }, { status: 400 });
      }

      try {
        const parsedUrl = new URL(destinationUrl.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
        dataToUpdate.destinationUrl = parsedUrl.toString();
      } catch {
        return NextResponse.json(
          { error: 'Invalid destination URL. Must be a valid http or https URL.' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.qrCode.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ qrCode: updated });
  } catch (error) {
    console.error('Failed to update QR code:', error);
    return NextResponse.json({ error: 'Failed to update QR code.' }, { status: 500 });
  }
}

// DELETE /api/qr-codes/[id] - Delete a QR code
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

    const existingQr = await prisma.qrCode.findUnique({
      where: { id },
    });

    if (!existingQr || existingQr.organizationId !== activeOrgId) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
    }

    await prisma.qrCode.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'QR code deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete QR code:', error);
    return NextResponse.json({ error: 'Failed to delete QR code.' }, { status: 500 });
  }
}
