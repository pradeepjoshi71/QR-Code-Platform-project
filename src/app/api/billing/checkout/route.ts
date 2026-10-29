import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

// ---------------------------------------------------------------------------
// POST /api/billing/checkout
// OWNER only. Creates or retrieves Stripe Customer, creates Checkout Session
// for STRIPE_PRICE_ID_PRO, returns session URL for redirect.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership, sessionUser } = authResult;

    // OWNER-only authorization guard
    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can initiate checkout or manage subscriptions.' },
        { status: 403 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      return NextResponse.json(
        { error: 'STRIPE_PRICE_ID_PRO is not configured in server environment.' },
        { status: 500 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: activeOrgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const stripe = getStripe();

    // Create a Stripe Customer if the organization doesn't have one yet
    let customerId: string | null = org.stripeCustomerId;
    if (!customerId) {
      const customer: Stripe.Customer = await stripe.customers.create({
        email: sessionUser.email ?? undefined,
        name: org.name,
        metadata: {
          organizationId: org.id,
        },
      });

      customerId = customer.id;

      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Determine return base URL
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      req.nextUrl.origin ||
      'http://localhost:3000';

    // Create Stripe Checkout Session in subscription mode
    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/app/billing?canceled=true`,
        metadata: {
          organizationId: org.id,
          userId,
        },
        subscription_data: {
          metadata: {
            organizationId: org.id,
            userId,
          },
        },
      });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Stripe failed to return a checkout session URL.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate Stripe checkout.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
