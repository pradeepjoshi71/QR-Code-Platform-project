import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueShortCode } from '@/lib/shortcode';
import { PLAN_LIMITS } from '@/lib/plan-limits';

// Helper to authenticate session and verify membership in the active workspace
async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const userId = session.user.id;
  let activeOrgId = session.user.activeOrgId;

  // Fallback to primary membership if activeOrgId not set in session
  if (!activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      return { error: 'No workspace found for this user', status: 403 } as const;
    }
    activeOrgId = membership.orgId;
  }

  // Verify membership in this active organization, including organization details
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: activeOrgId,
      },
    },
    include: { organization: true },
  });

  if (!membership) {
    return { error: 'Access to the specified workspace is forbidden', status: 403 } as const;
  }

  return { userId, activeOrgId, membership };
}

// GET /api/qr-codes - List all QR codes for the active organization
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId, membership } = authResult;

    const qrCodes = await prisma.qrCode.findMany({
      where: { organizationId: activeOrgId },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    const effectiveStatus = membership.organization.subscriptionStatus;
    const limits = PLAN_LIMITS[effectiveStatus] ?? PLAN_LIMITS.FREE;

    return NextResponse.json({
      qrCodes,
      subscriptionStatus: effectiveStatus,
      maxQrCodes: limits.maxQrCodes,
      totalCount: qrCodes.length,
    });
  } catch (error: unknown) {
    console.error('Failed to list QR codes:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve QR codes.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/qr-codes - Create a new QR code (STATIC or DYNAMIC) scoped to the active organization
export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    // Feature Gating: Check QR code plan limits before creating
    const effectiveStatus = membership.organization.subscriptionStatus;
    const limits = PLAN_LIMITS[effectiveStatus] ?? PLAN_LIMITS.FREE;

    if (limits.maxQrCodes !== null) {
      const existingQrCount = await prisma.qrCode.count({
        where: { organizationId: activeOrgId },
      });

      if (existingQrCount >= limits.maxQrCodes) {
        return NextResponse.json(
          { error: 'Free plan limited to 5 QR codes — upgrade to Pro for unlimited' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      name,
      type,
      destinationUrl,
      styleConfig,
      scheduledStart,
      expiresAt,
      routingRules,
      geoRules,
      campaignId,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'A valid name is required.' }, { status: 400 });
    }

    if (type !== 'STATIC' && type !== 'DYNAMIC') {
      return NextResponse.json(
        { error: 'Type must be either STATIC or DYNAMIC.' },
        { status: 400 }
      );
    }

    if (!destinationUrl || typeof destinationUrl !== 'string' || !destinationUrl.trim()) {
      return NextResponse.json({ error: 'A destination URL is required.' }, { status: 400 });
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(destinationUrl.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid destination URL. Must be a valid http or https URL.' },
        { status: 400 }
      );
    }

    // Validate optional campaignId — must belong to the same active org
    let validatedCampaignId: string | null = null;
    if (campaignId && typeof campaignId === 'string') {
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
      validatedCampaignId = campaign.id;
    }

    let shortCode: string | null = null;
    if (type === 'DYNAMIC') {
      shortCode = await generateUniqueShortCode();
    }

    // Validate styleConfig if provided
    const validatedStyleConfig =
      styleConfig && typeof styleConfig === 'object' && !Array.isArray(styleConfig)
        ? styleConfig
        : null;

    // Parse optional scheduling fields (DYNAMIC only; silently ignored for STATIC)
    let parsedScheduledStart: Date | null = null;
    let parsedExpiresAt: Date | null = null;
    // Validate optional routingRules (DYNAMIC only; silently ignored for STATIC)
    let validatedRoutingRules: Record<string, string> | null = null;
    if (type === 'DYNAMIC') {
      if (scheduledStart) {
        const d = new Date(scheduledStart);
        if (!isNaN(d.getTime())) parsedScheduledStart = d;
      }
      if (expiresAt) {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) parsedExpiresAt = d;
      }
      if (routingRules && typeof routingRules === 'object' && !Array.isArray(routingRules)) {
        validatedRoutingRules = routingRules as Record<string, string>;
      }
    }
    // Validate optional geoRules (DYNAMIC only; silently ignored for STATIC)
    let validatedGeoRules: Record<string, string> | null = null;
    if (type === 'DYNAMIC') {
      if (geoRules && typeof geoRules === 'object' && !Array.isArray(geoRules)) {
        validatedGeoRules = geoRules as Record<string, string>;
      }
    }

    const qrCode = await prisma.qrCode.create({
      data: {
        name: name.trim(),
        type,
        destinationUrl: parsedUrl.toString(),
        shortCode,
        organizationId: activeOrgId,
        createdByUserId: userId,
        isActive: true,
        ...(validatedCampaignId ? { campaignId: validatedCampaignId } : {}),
        ...(validatedStyleConfig ? { styleConfig: validatedStyleConfig } : {}),
        ...(validatedRoutingRules ? { routingRules: validatedRoutingRules } : {}),
        ...(validatedGeoRules ? { geoRules: validatedGeoRules } : {}),
        ...(parsedScheduledStart ? { scheduledStart: parsedScheduledStart } : {}),
        ...(parsedExpiresAt ? { expiresAt: parsedExpiresAt } : {}),
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ qrCode }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create QR code:', error);
    const message = error instanceof Error ? error.message : 'Failed to create QR code.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
