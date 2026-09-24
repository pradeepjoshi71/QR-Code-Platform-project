import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// POST /api/invites/accept
// Body: { token: string }
//
// Validates the invite token (not expired, not already accepted),
// creates a Membership for the authenticated user,
// and marks acceptedAt on the invite.
//
// The caller must be authenticated — the accept page redirects to sign-in
// with callbackUrl if the user is not signed in yet.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in to accept an invitation.' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invite token is required.' }, { status: 400 });
    }

    // Fetch invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { organization: { select: { id: true, name: true } } },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or unknown invite token.' }, { status: 404 });
    }

    // Already accepted?
    if (invite.acceptedAt !== null) {
      return NextResponse.json({ error: 'This invitation has already been accepted.' }, { status: 409 });
    }

    // Expired?
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 });
    }

    // Check email match — the signed-in user's email must match the invite email.
    // This prevents accepting someone else's invite.
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Authenticated user not found.' }, { status: 500 });
    }

    if (currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invite was sent to ${invite.email}. Please sign in with that email address to accept it.`,
        },
        { status: 403 }
      );
    }

    // Already a member?
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId: invite.organizationId } },
    });

    if (existingMembership) {
      // Mark accepted anyway so the token can't be replayed
      await prisma.invite.update({ where: { token }, data: { acceptedAt: new Date() } });
      return NextResponse.json(
        {
          message: 'You are already a member of this workspace.',
          orgId: invite.organizationId,
          orgName: invite.organization.name,
        },
        { status: 200 }
      );
    }

    // Create membership + mark invite accepted in a transaction
    await prisma.$transaction([
      prisma.membership.create({
        data: {
          userId,
          orgId: invite.organizationId,
          role: invite.role,
        },
      }),
      prisma.invite.update({
        where: { token },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json(
      {
        message: `You have joined ${invite.organization.name} as ${invite.role.toLowerCase()}.`,
        orgId: invite.organizationId,
        orgName: invite.organization.name,
        role: invite.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to accept invite:', error);
    return NextResponse.json({ error: 'Failed to accept invitation.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/invites/accept?token=... (used by the accept page to preview invite details)
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or unknown invite token.' }, { status: 404 });
    }

    if (invite.acceptedAt !== null) {
      return NextResponse.json({ error: 'This invitation has already been accepted.' }, { status: 409 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 });
    }

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      orgName: invite.organization.name,
      invitedBy: invite.invitedBy.name || invite.invitedBy.email,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Failed to fetch invite:', error);
    return NextResponse.json({ error: 'Failed to load invite.' }, { status: 500 });
  }
}
