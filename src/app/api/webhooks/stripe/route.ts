import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { logAction } from '@/lib/audit-log';

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// Verifies Stripe signature using raw text payload, processes subscription
// lifecycle events to update organization status.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured in environment.');
    return NextResponse.json(
      { error: 'Webhook secret is not configured on the server.' },
      { status: 500 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header.' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // IMPORTANT: raw body as text is required for Stripe signature verification
    const rawBody = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Stripe webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // 1. Checkout session completed — customer subscribed via checkout
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        let orgId = session.metadata?.organizationId;
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (orgId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              subscriptionStatus: 'ACTIVE',
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
              ...(customerId ? { stripeCustomerId: customerId } : {}),
            },
          });
        } else if (customerId) {
          const matchedOrg = await prisma.organization.findFirst({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          });
          if (matchedOrg) {
            orgId = matchedOrg.id;
          }
          await prisma.organization.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: 'ACTIVE',
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            },
          });
        }

        // Fire-and-forget audit log: "billing.upgraded"
        if (orgId) {
          let actorUserId = session.metadata?.userId;
          if (!actorUserId) {
            const ownerMembership = await prisma.membership.findFirst({
              where: { orgId, role: 'OWNER' },
              select: { userId: true },
            });
            actorUserId = ownerMembership?.userId;
          }

          if (actorUserId) {
            logAction({
              organizationId: orgId,
              actorUserId,
              action: 'billing.upgraded',
              targetType: 'Subscription',
              targetId: subscriptionId ?? null,
              metadata: {
                stripeCustomerId: customerId ?? null,
                stripeSubscriptionId: subscriptionId ?? null,
              },
            });
          }
        }
        break;
      }

      // 2. Subscription updated — renewals, status changes (e.g. past_due, active)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;
        const subscriptionId = subscription.id;

        let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' = 'ACTIVE';
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = 'ACTIVE';
        } else if (subscription.status === 'past_due') {
          status = 'PAST_DUE';
        } else if (
          subscription.status === 'canceled' ||
          subscription.status === 'unpaid' ||
          subscription.status === 'incomplete_expired'
        ) {
          status = 'CANCELED';
        }

        // Try updating by subscriptionId first, fallback to customerId
        const updated = await prisma.organization.updateMany({
          where: {
            OR: [
              { stripeSubscriptionId: subscriptionId },
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
          data: {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
          },
        });

        if (updated.count === 0 && customerId) {
          console.warn(`No organization found matching subscription ${subscriptionId} or customer ${customerId}`);
        }
        break;
      }

      // 3. Subscription deleted — customer or owner canceled subscription
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;
        const subscriptionId = subscription.id;

        await prisma.organization.updateMany({
          where: {
            OR: [
              { stripeSubscriptionId: subscriptionId },
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
          data: {
            subscriptionStatus: 'CANCELED',
          },
        });
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error handling Stripe webhook event:', error);
    const message = error instanceof Error ? error.message : 'Error processing webhook event';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
