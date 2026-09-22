import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueShortCode } from '@/lib/shortcode';

// Helper to authenticate session and verify membership in the active workspace
async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
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
      return { error: 'No workspace found for this user', status: 403 };
    }
    activeOrgId = membership.orgId;
  }

  // Verify membership in this active organization
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

// GET /api/qr-codes - List all QR codes for the active organization
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;

    const qrCodes = await prisma.qrCode.findMany({
      where: { organizationId: activeOrgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ qrCodes });
  } catch (error) {
    console.error('Failed to list QR codes:', error);
    return NextResponse.json({ error: 'Failed to retrieve QR codes.' }, { status: 500 });
  }
}

// POST /api/qr-codes - Create a new QR code (STATIC or DYNAMIC) scoped to the active organization
export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId } = authResult;

    const body = await req.json();
    const { name, type, destinationUrl, styleConfig, scheduledStart, expiresAt, routingRules, geoRules } = body;

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
        ...(validatedStyleConfig ? { styleConfig: validatedStyleConfig } : {}),
        ...(validatedRoutingRules ? { routingRules: validatedRoutingRules } : {}),
        ...(validatedGeoRules ? { geoRules: validatedGeoRules } : {}),
        ...(parsedScheduledStart ? { scheduledStart: parsedScheduledStart } : {}),
        ...(parsedExpiresAt ? { expiresAt: parsedExpiresAt } : {}),
      },
    });

    return NextResponse.json({ qrCode }, { status: 201 });
  } catch (error) {
    console.error('Failed to create QR code:', error);
    return NextResponse.json({ error: 'Failed to create QR code.' }, { status: 500 });
  }
}
