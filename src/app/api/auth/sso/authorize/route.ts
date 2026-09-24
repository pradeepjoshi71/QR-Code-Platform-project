import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/workos';

// ---------------------------------------------------------------------------
// POST /api/auth/sso/authorize
// Initiates the WorkOS SSO flow by resolving the domain from the provided email
// and returning the WorkOS authorization URL.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid corporate email address is required.' },
        { status: 400 }
      );
    }

    const authorizationUrl = await getAuthorizationUrl(email);

    return NextResponse.json({ authorizationUrl });
  } catch (error: unknown) {
    console.error('WorkOS SSO authorization error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate SSO login.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
