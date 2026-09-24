import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createQrCode, listQrCodes } from '@/lib/qr-service';

// ---------------------------------------------------------------------------
// GET /api/v1/qr-codes
// Public API v1: List all QR codes for the authenticated organization.
// Requires `Authorization: Bearer qrp_...`
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiKey(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API key.' },
        { status: 401 }
      );
    }

    const qrCodes = await listQrCodes(auth.organizationId);
    return NextResponse.json({ qrCodes });
  } catch (error: unknown) {
    console.error('API v1 GET /qr-codes error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/qr-codes
// Public API v1: Create a QR code scoped to the authenticated organization.
// Enforces plan limits and input validation.
// Requires `Authorization: Bearer qrp_...`
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateApiKey(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API key.' },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const result = await createQrCode({
      organizationId: auth.organizationId,
      userId: auth.createdByUserId,
      name: body.name,
      type: body.type,
      destinationUrl: body.destinationUrl,
      styleConfig: body.styleConfig,
      scheduledStart: body.scheduledStart,
      expiresAt: body.expiresAt,
      routingRules: body.routingRules,
      geoRules: body.geoRules,
      campaignId: body.campaignId,
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ qrCode: result.qrCode }, { status: 201 });
  } catch (error: unknown) {
    console.error('API v1 POST /qr-codes error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
