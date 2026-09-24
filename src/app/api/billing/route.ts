import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// GET /api/billing
// Returns current subscription status and workspace billing information.
// ---------------------------------------------------------------------------
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
        return NextResponse.json({ error: 'No workspace found for this user' }, { status: 403 });
      }
      activeOrgId = firstMembership.orgId;
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId: activeOrgId } },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access to the specified workspace is forbidden' }, { status: 403 });
    }

    const org = membership.organization;

    return NextResponse.json({
      organizationId: org.id,
      organizationName: org.name,
      subscriptionStatus: org.subscriptionStatus,
      stripeCustomerId: org.stripeCustomerId,
      stripeSubscriptionId: org.stripeSubscriptionId,
      role: membership.role,
      isOwner: membership.role === 'OWNER',
    });
  } catch (error: unknown) {
    console.error('Failed to get billing status:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve billing status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
