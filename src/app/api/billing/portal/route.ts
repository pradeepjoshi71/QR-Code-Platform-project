import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

// ---------------------------------------------------------------------------
// POST /api/billing/portal
// OWNER only. Opens Stripe Customer Portal session for managing active subscription.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
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

    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can manage subscription settings.' },
        { status: 403 }
      );
    }

    const org = membership.organization;
    const customerId: string | null = org.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer associated with this workspace.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      req.nextUrl.origin ||
      'http://localhost:3000';

    const portalSession: Stripe.BillingPortal.Session =
      await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/app/billing`,
      });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error('Stripe billing portal error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create customer portal session.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
