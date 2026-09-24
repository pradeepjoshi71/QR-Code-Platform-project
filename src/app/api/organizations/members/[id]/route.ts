import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit-log';

// ---------------------------------------------------------------------------
// Auth helper — verifies user and retrieves active organization membership
// ---------------------------------------------------------------------------
async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const userId = session.user.id;
  let activeOrgId = session.user.activeOrgId;

  if (!activeOrgId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!firstMembership) {
      return { error: 'No workspace found for this user', status: 403 } as const;
    }
    activeOrgId = firstMembership.orgId;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: activeOrgId } },
    include: { organization: true },
  });

  if (!membership) {
    return { error: 'Access to the specified workspace is forbidden', status: 403 } as const;
  }

  return { userId, activeOrgId, membership };
}

// ---------------------------------------------------------------------------
// PATCH /api/organizations/members/[id]
// Updates a member's role within the active organization.
// Body: { role: 'ADMIN' | 'MEMBER' }
// Protected by OWNER / ADMIN roles with strict hierarchy checks.
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership: callerMembership } = authResult;

    // Caller role guard: only OWNER or ADMIN can modify members
    if (callerMembership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can modify member roles.' },
        { status: 403 }
      );
    }

    const targetMembershipId = params.id;
    if (!targetMembershipId) {
      return NextResponse.json({ error: 'Membership ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const { role } = body;

    // OWNER role cannot be granted via this endpoint
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json(
        { error: "Invalid role. Role can only be changed to 'ADMIN' or 'MEMBER'." },
        { status: 400 }
      );
    }

    // Look up target membership
    const targetMembership = await prisma.membership.findUnique({
      where: { id: targetMembershipId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMembership || targetMembership.orgId !== activeOrgId) {
      return NextResponse.json(
        { error: 'Member not found in this workspace.' },
        { status: 404 }
      );
    }

    // Rule 1: Cannot change your own membership role (prevents self-lockout)
    if (targetMembership.id === callerMembership.id || targetMembership.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role. Please ask another owner or admin to update your permissions.' },
        { status: 400 }
      );
    }

    // Rule 2: Cannot demote the last remaining OWNER
    if (targetMembership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { orgId: activeOrgId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change the role of the last remaining owner in the workspace.' },
          { status: 400 }
        );
      }
    }

    // Rule 3: ADMIN cannot change another member's role to/from OWNER or modify other ADMINs
    if (callerMembership.role === 'ADMIN') {
      if (targetMembership.role === 'OWNER' || targetMembership.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Admins can only manage Member-level memberships. Only owners can modify owners or admins.' },
          { status: 403 }
        );
      }
    }

    // Execute update
    const updated = await prisma.membership.update({
      where: { id: targetMembership.id },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'member.role_changed',
      targetType: 'Membership',
      targetId: targetMembership.id,
      metadata: {
        targetUserId: targetMembership.userId,
        oldRole: targetMembership.role,
        newRole: role,
      },
    });

    return NextResponse.json({ membership: updated });
  } catch (error: unknown) {
    console.error('Failed to update member role:', error);
    const message = error instanceof Error ? error.message : 'Failed to update member role.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/organizations/members/[id]
// Removes a member from the active organization.
// Protected by OWNER / ADMIN roles with strict hierarchy checks.
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership: callerMembership } = authResult;

    // Caller role guard: only OWNER or ADMIN can remove members
    if (callerMembership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can remove members.' },
        { status: 403 }
      );
    }

    const targetMembershipId = params.id;
    if (!targetMembershipId) {
      return NextResponse.json({ error: 'Membership ID is required.' }, { status: 400 });
    }

    // Look up target membership
    const targetMembership = await prisma.membership.findUnique({
      where: { id: targetMembershipId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMembership || targetMembership.orgId !== activeOrgId) {
      return NextResponse.json(
        { error: 'Member not found in this workspace.' },
        { status: 404 }
      );
    }

    // Rule 1: Cannot remove your own membership (prevents self-lockout)
    if (targetMembership.id === callerMembership.id || targetMembership.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot remove your own membership through this endpoint.' },
        { status: 400 }
      );
    }

    // Rule 2: Cannot remove the last remaining OWNER
    if (targetMembership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { orgId: activeOrgId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last remaining owner in the workspace.' },
          { status: 400 }
        );
      }
    }

    // Rule 3: ADMIN cannot remove an OWNER or another ADMIN
    if (callerMembership.role === 'ADMIN') {
      if (targetMembership.role === 'OWNER' || targetMembership.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Admins can only remove Member-level memberships. Only owners can remove owners or admins.' },
          { status: 403 }
        );
      }
    }

    // Execute deletion of membership row
    await prisma.membership.delete({
      where: { id: targetMembership.id },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'member.removed',
      targetType: 'Membership',
      targetId: targetMembership.id,
      metadata: {
        targetUserId: targetMembership.userId,
        role: targetMembership.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from workspace successfully.',
    });
  } catch (error: unknown) {
    console.error('Failed to remove member:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove member.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
