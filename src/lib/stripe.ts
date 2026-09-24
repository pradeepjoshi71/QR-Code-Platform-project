import Stripe from 'stripe';

// Lazy-init singleton — client is created on first use inside a request handler,
// not at module scope. This ensures that `next build` passes even when
// STRIPE_SECRET_KEY is absent from .env.local; an error is thrown only if a
// request actually invokes Stripe operations without a configured key.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set. Add it to .env.local — see .env.example for instructions.'
      );
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}
