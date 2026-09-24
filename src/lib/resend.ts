import { Resend } from 'resend';

// Lazy-init singleton — client is created on first use inside a request handler,
// not at module scope. This means the build succeeds even when RESEND_API_KEY is
// absent from .env.local; the error is thrown only if a request actually tries to
// send email without the key configured.
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY is not set. Add it to .env.local — see .env.example for instructions.'
      );
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Verified "from" domain configured in the Resend dashboard.
// Change to your own domain once you verify it. The resend.dev sandbox domain
// works for testing without verification.
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'invites@resend.dev';
