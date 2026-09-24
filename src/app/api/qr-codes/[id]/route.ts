import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logAction } from '@/lib/audit-log';

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

// PATCH /api/qr-codes/[id] - Update name, isActive, destinationUrl, styleConfig, scheduling, routing, geoRules, campaignId
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
    const {
      name,
      isActive,
      destinationUrl,
      styleConfig,
      scheduledStart,
      expiresAt,
      routingRules,
      geoRules,
      campaignId,
    } = body;

    const dataToUpdate: {
      name?: string;
      isActive?: boolean;
      destinationUrl?: string;
      styleConfig?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
      routingRules?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
      geoRules?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
      scheduledStart?: Date | null;
      expiresAt?: Date | null;
      campaignId?: string | null;
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

    if (styleConfig !== undefined) {
      if (styleConfig === null) {
        dataToUpdate.styleConfig = Prisma.JsonNull;
      } else if (typeof styleConfig === 'object' && !Array.isArray(styleConfig)) {
        dataToUpdate.styleConfig = styleConfig as Prisma.InputJsonValue;
      } else {
        return NextResponse.json(
          { error: 'styleConfig must be an object or null.' },
          { status: 400 }
        );
      }
    }

    // scheduledStart and expiresAt — only allowed on DYNAMIC QR codes
    if (scheduledStart !== undefined || expiresAt !== undefined) {
      if (existingQr.type === 'STATIC') {
        return NextResponse.json(
          { error: 'Static QR codes do not support scheduling fields.' },
          { status: 400 }
        );
      }
      if (scheduledStart !== undefined) {
        if (scheduledStart === null) {
          dataToUpdate.scheduledStart = null;
        } else {
          const d = new Date(scheduledStart);
          if (isNaN(d.getTime())) {
            return NextResponse.json({ error: 'Invalid scheduledStart date.' }, { status: 400 });
          }
          dataToUpdate.scheduledStart = d;
        }
      }
      if (expiresAt !== undefined) {
        if (expiresAt === null) {
          dataToUpdate.expiresAt = null;
        } else {
          const d = new Date(expiresAt);
          if (isNaN(d.getTime())) {
            return NextResponse.json({ error: 'Invalid expiresAt date.' }, { status: 400 });
          }
          dataToUpdate.expiresAt = d;
        }
      }
    }

    // routingRules — only allowed on DYNAMIC QR codes
    if (routingRules !== undefined) {
      if (existingQr.type === 'STATIC') {
        return NextResponse.json(
          { error: 'Static QR codes do not support routing rules.' },
          { status: 400 }
        );
      }
      if (routingRules === null) {
        dataToUpdate.routingRules = Prisma.JsonNull;
      } else if (typeof routingRules === 'object' && !Array.isArray(routingRules)) {
        dataToUpdate.routingRules = routingRules as Prisma.InputJsonValue;
      } else {
        return NextResponse.json(
          { error: 'routingRules must be an object or null.' },
          { status: 400 }
        );
      }
    }

    // geoRules — only allowed on DYNAMIC QR codes
    if (geoRules !== undefined) {
      if (existingQr.type === 'STATIC') {
        return NextResponse.json(
          { error: 'Static QR codes do not support geo rules.' },
          { status: 400 }
        );
      }
      if (geoRules === null) {
        dataToUpdate.geoRules = Prisma.JsonNull;
      } else if (typeof geoRules === 'object' && !Array.isArray(geoRules)) {
        dataToUpdate.geoRules = geoRules as Prisma.InputJsonValue;
      } else {
        return NextResponse.json(
          { error: 'geoRules must be an object or null.' },
          { status: 400 }
        );
      }
    }

    // campaignId — null clears the assignment; string must belong to the same active org
    if (campaignId !== undefined) {
      if (campaignId === null) {
        dataToUpdate.campaignId = null;
      } else if (typeof campaignId === 'string') {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, organizationId: true },
        });
        if (!campaign || campaign.organizationId !== activeOrgId) {
          return NextResponse.json(
            { error: 'Campaign not found or does not belong to this workspace.' },
            { status: 403 }
          );
        }
        dataToUpdate.campaignId = campaign.id;
      } else {
        return NextResponse.json(
          { error: 'campaignId must be a string or null.' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.qrCode.update({
      where: { id },
      data: dataToUpdate,
      include: {
        campaign: { select: { id: true, name: true } },
      },
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

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: authResult.userId,
      action: 'qrcode.deleted',
      targetType: 'QrCode',
      targetId: id,
      metadata: {
        name: existingQr.name,
        shortCode: existingQr.shortCode,
        type: existingQr.type,
      },
    });

    return NextResponse.json({ message: 'QR code deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete QR code:', error);
    return NextResponse.json({ error: 'Failed to delete QR code.' }, { status: 500 });
  }
}
