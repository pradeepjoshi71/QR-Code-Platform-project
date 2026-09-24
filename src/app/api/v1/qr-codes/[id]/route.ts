import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { getQrCodeById, updateQrCode, deleteQrCode } from '@/lib/qr-service';

// ---------------------------------------------------------------------------
// GET /api/v1/qr-codes/[id]
// Public API v1: Retrieve a specific QR code by ID for the authenticated org.
// Requires `Authorization: Bearer qrp_...`
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApiKey(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API key.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const qrCode = await getQrCodeById(id, auth.organizationId);

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR Code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ qrCode });
  } catch (error: unknown) {
    console.error('API v1 GET /qr-codes/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/qr-codes/[id]
// Public API v1: Update a specific QR code by ID for the authenticated org.
// Requires `Authorization: Bearer qrp_...`
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApiKey(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API key.' },
        { status: 401 }
      );
    }

    const { id } = params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const result = await updateQrCode(id, auth.organizationId, {
      name: body.name,
      isActive: body.isActive,
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

    return NextResponse.json({ qrCode: result.qrCode });
  } catch (error: unknown) {
    console.error('API v1 PATCH /qr-codes/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/qr-codes/[id]
// Public API v1: Delete a specific QR code by ID for the authenticated org.
// Requires `Authorization: Bearer qrp_...`
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApiKey(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API key.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const result = await deleteQrCode(id, auth.organizationId);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ message: 'QR code deleted successfully.' });
  } catch (error: unknown) {
    console.error('API v1 DELETE /qr-codes/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
