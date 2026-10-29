import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { logAction } from '@/lib/audit-log';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

// ---------------------------------------------------------------------------
// GET /api/organizations/invites
// List pending (not accepted, not expired) invites for the active org.
// Requires OWNER or ADMIN role.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId, membership } = authResult;

    if (membership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only owners and admins can view pending invites.' },
        { status: 403 }
      );
    }

    const invites = await prisma.invite.findMany({
      where: {
        organizationId: activeOrgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Failed to list invites:', error);
    return NextResponse.json({ error: 'Failed to retrieve invites.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/organizations/invites
// Create an invite + send email.
// Body: { email: string, role?: 'OWNER' | 'ADMIN' | 'MEMBER' }
// Requires OWNER or ADMIN role.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    // Role guard: only OWNER or ADMIN can send invites
    if (membership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, role } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate role
    const validRoles = ['OWNER', 'ADMIN', 'MEMBER'] as const;
    const inviteRole: 'OWNER' | 'ADMIN' | 'MEMBER' =
      role && validRoles.includes(role as (typeof validRoles)[number])
        ? (role as 'OWNER' | 'ADMIN' | 'MEMBER')
        : 'MEMBER';

    // Guard: ADMIN cannot grant OWNER role
    if (membership.role === 'ADMIN' && inviteRole === 'OWNER') {
      return NextResponse.json(
        { error: 'Admins cannot invite members with the OWNER role.' },
        { status: 403 }
      );
    }

    // Check if the email already has membership in this org
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_orgId: { userId: existingUser.id, orgId: activeOrgId },
        },
      });
      if (existingMembership) {
        return NextResponse.json(
          { error: 'This person is already a member of your workspace.' },
          { status: 409 }
        );
      }
    }

    // Check for a live pending invite to same email in same org
    const existingInvite = await prisma.invite.findFirst({
      where: {
        organizationId: activeOrgId,
        email: normalizedEmail,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: 'A pending invite for this email already exists.' },
        { status: 409 }
      );
    }

    // Generate unique token + 7-day expiry
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create invite row
    const invite = await prisma.invite.create({
      data: {
        organizationId: activeOrgId,
        email: normalizedEmail,
        role: inviteRole,
        token,
        invitedByUserId: userId,
        expiresAt,
      },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'member.invited',
      targetType: 'Invite',
      targetId: invite.id,
      metadata: {
        email: invite.email,
        role: invite.role,
      },
    });

    // Build accept link
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const acceptUrl = `${appUrl}/invites/accept?token=${token}`;
    const orgName = membership.organization.name;

    // Send invite email — wrap in try/catch so a Resend failure doesn't roll back the invite row
    let emailError: string | null = null;
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: normalizedEmail,
        subject: `You've been invited to join ${orgName} on QR Platform`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:100%">

        <!-- Header -->
        <tr><td style="background:#4f46e5;padding:28px 32px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px">📲 QR Platform</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px">
            You&rsquo;ve been invited to join <span style="color:#4f46e5">${orgName}</span>
          </h1>
          <p style="margin:0 0 8px;font-size:15px;color:#475569;line-height:1.6">
            You have been invited to join <strong>${orgName}</strong> as a
            <strong style="text-transform:capitalize">${inviteRole.toLowerCase()}</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#94a3b8">
            This invite expires in 7 days.
          </p>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0">
            <tr><td>
              <a href="${acceptUrl}"
                 style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                        font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;
                        letter-spacing:0.1px">
                Accept Invitation →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
            Or paste this link in your browser:<br>
            <span style="color:#4f46e5;word-break:break-all">${acceptUrl}</span>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:11px;color:#94a3b8">
            If you didn&rsquo;t expect this invitation, you can safely ignore this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch (sendErr) {
      // Email failed — log but don't fail the request. The invite row is committed.
      console.error('Resend email delivery failed:', sendErr);
      emailError =
        'Invite created but email delivery failed. Check RESEND_API_KEY and FROM_EMAIL configuration.';
    }

    return NextResponse.json(
      {
        invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
        ...(emailError ? { warning: emailError } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create invite:', error);
    return NextResponse.json({ error: 'Failed to create invite.' }, { status: 500 });
  }
}
