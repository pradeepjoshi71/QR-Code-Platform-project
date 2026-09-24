import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/organizations/members
// Returns all members of the active org, plus the calling user's own role (myRole).
// Accessible by all members (no role guard — everyone can see the team list).
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let activeOrgId = session.user.activeOrgId;

    if (!activeOrgId) {
      const firstMembership = await prisma.membership.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (!firstMembership) {
        return NextResponse.json({ error: 'No workspace found for this user.' }, { status: 403 });
      }
      activeOrgId = firstMembership.orgId;
    }

    const callerMembership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId: activeOrgId } },
    });

    if (!callerMembership) {
      return NextResponse.json({ error: 'Access to the specified workspace is forbidden.' }, { status: 403 });
    }

    const members = await prisma.membership.findMany({
      where: { orgId: activeOrgId },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      members,
      myRole: callerMembership.role,
      myMembershipId: callerMembership.id,
      currentUserId: userId,
    });
  } catch (error) {
    console.error('Failed to list members:', error);
    return NextResponse.json({ error: 'Failed to retrieve members.' }, { status: 500 });
  }
}
