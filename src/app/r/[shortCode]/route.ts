import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const EXPIRED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link Expired</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      box-shadow: 0 4px 24px 0 rgba(15,23,42,0.08);
      max-width: 400px;
      width: 100%;
      padding: 2.5rem 2rem;
      text-align: center;
    }
    .icon {
      width: 3rem;
      height: 3rem;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
    }
    .icon svg { width: 1.5rem; height: 1.5rem; color: #ef4444; }
    h1 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }
    p  { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.6; }
    a  {
      display: inline-block;
      background: #4f46e5;
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.5rem 1.25rem;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.15s;
    }
    a:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <h1>This link has expired</h1>
    <p>The QR code you scanned is no longer active. Please contact the link owner for an updated code.</p>
    <a href="/">Go back home</a>
  </div>
</body>
</html>`;

export async function GET(
  req: Request,
  { params }: { params: { shortCode: string } }
) {
  /**
   * Redirect precedence (evaluated in order, first match wins):
   *  1. isActive check       — inactive/not-found → 404
   *  2. scheduledStart check — not yet live        → 404
   *  3. expiresAt check      — expired             → 410 Gone
   *  4. geoRules[country]    — country-specific URL (Vercel header, DYNAMIC only)
   *  5. routingRules         — device/OS URL (P4.2, DYNAMIC only)
   *  6. destinationUrl       — default fallback (always present)
   *
   * After resolving the target URL (step 4–6), one ScanEvent row is written
   * (awaited) before the 302 response. If the insert fails, the error is logged
   * and the redirect proceeds — analytics must never block a scan.
   *
   * NOTE: Geo detection uses the `x-vercel-ip-country` request header injected
   * by Vercel's edge network. This header is absent during local `npm run dev`,
   * so geoRules matching ONLY works when deployed on Vercel. Locally, execution
   * always falls through to routingRules / destinationUrl.
   * Runtime: Node (not edge) — standard PrismaClient is fully compatible.
   */
  try {
    const { shortCode } = params;

    if (!shortCode) {
      return new NextResponse('Shortcode is required', { status: 400 });
    }

    const qrCode = await prisma.qrCode.findUnique({
      where: { shortCode },
      select: {
        id: true,
        destinationUrl: true,
        isActive: true,
        scheduledStart: true,
        expiresAt: true,
        routingRules: true,
        geoRules: true,
      },
    });

    // 1. Inactive or not found → 404 (unchanged behaviour)
    if (!qrCode || !qrCode.isActive) {
      return new NextResponse('QR code not found or inactive', { status: 404 });
    }

    const now = new Date();

    // 2. Not yet live: scheduledStart is in the future → 404
    if (qrCode.scheduledStart && qrCode.scheduledStart > now) {
      return new NextResponse('QR code not found or inactive', { status: 404 });
    }

    // 3. Expired: expiresAt is in the past → 410 Gone with branded page
    if (qrCode.expiresAt && qrCode.expiresAt < now) {
      return new NextResponse(EXPIRED_HTML, {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // --- Hoist all signal resolution so values are available for both routing and scan capture ---

    // Country: Vercel injects x-vercel-ip-country on Node and Edge runtimes when deployed.
    // Absent locally (npm run dev) → empty string → geo rules skipped.
    const country = req.headers.get('x-vercel-ip-country') ?? '';

    // Device type: derived from User-Agent, same regex as P4.2.
    const ua = (req.headers.get('user-agent') ?? '').toLowerCase();
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const deviceType: string = isIOS ? 'ios' : isAndroid ? 'android' : ua ? 'desktop' : 'unknown';

    // Referrer: read the standard Referer header (browsers spell it with one 'r').
    const referrer = req.headers.get('referer') ?? null;

    // --- Safe redirect helper ---
    // Validates that a URL's protocol is http or https before using it as a
    // redirect target. Prevents open-redirect / XSS via javascript:, data:,
    // or file: schemes that could be stored in routing/geo rule JSON objects.
    function safeRedirectUrl(url: string, fallback: string): string {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return url;
        }
      } catch {
        // unparseable URL — fall through to fallback
      }
      console.warn(`Unsafe redirect URL blocked in QR rule: ${url.slice(0, 80)}`);
      return fallback;
    }

    // --- Resolve target URL (first matching rule wins) ---

    let targetUrl = qrCode.destinationUrl; // 6. default

    // 4. Geo-based redirect
    const geoRules = qrCode.geoRules as Record<string, string> | null;
    if (geoRules && typeof geoRules === 'object' && country && geoRules[country]) {
      targetUrl = safeRedirectUrl(geoRules[country], qrCode.destinationUrl);
    } else {
      // 5. Device/OS-based redirect rules
      const rules = qrCode.routingRules as { ios?: string; android?: string; desktop?: string } | null;
      if (rules && typeof rules === 'object') {
        if (isIOS && rules.ios) {
          targetUrl = safeRedirectUrl(rules.ios, qrCode.destinationUrl);
        } else if (isAndroid && rules.android) {
          targetUrl = safeRedirectUrl(rules.android, qrCode.destinationUrl);
        } else if (!isIOS && !isAndroid && rules.desktop) {
          targetUrl = safeRedirectUrl(rules.desktop, qrCode.destinationUrl);
        }
      }
    }

    // --- Write scan event (P5.1) ---
    // Awaited for correctness; wrapped in its own try/catch so an analytics failure
    // never blocks or errors the redirect response.
    try {
      await prisma.scanEvent.create({
        data: {
          qrCodeId: qrCode.id,
          country: country || null,
          deviceType,
          referrer,
        },
      });
    } catch (scanError) {
      // Log but do not rethrow — scan capture must never fail the redirect.
      console.error('ScanEvent insert failed (redirect will proceed):', scanError);
    }

    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
