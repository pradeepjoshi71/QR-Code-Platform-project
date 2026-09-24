import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { handleSsoCallback } from '@/lib/workos';

// ---------------------------------------------------------------------------
// GET /api/auth/sso/callback
// Handles the redirect from WorkOS after successful IdP authentication.
// 1. Exchanges the authorization code for the user profile.
// 2. Finds or creates the User and Membership record (reusing P1.0's transaction pattern).
// 3. Issues the standard NextAuth JWT session cookie and redirects to /app.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const errorParam = req.nextUrl.searchParams.get('error_description') || req.nextUrl.searchParams.get('error');

  if (errorParam) {
    console.error('WorkOS SSO callback error parameter:', errorParam);
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('error', encodeURIComponent(errorParam));
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('error', 'Missing authorization code from SSO provider.');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const profile = await handleSsoCallback(code);
    const { email, firstName, lastName, workosOrgId } = profile;

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

    // Atomic transaction: Find or create User and Membership
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name: fullName,
            emailVerified: new Date(),
          },
        });
      } else if (!user.name && fullName) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { name: fullName },
        });
      }

      // Match Organization by WorkOS Organization ID
      let org = null;
      if (workosOrgId) {
        org = await tx.organization.findFirst({
          where: { workosOrganizationId: workosOrgId },
        });
      }

      // Fallback: check if user already has an existing membership in any workspace
      if (!org) {
        const existingMembership = await tx.membership.findFirst({
          where: { userId: user.id },
          include: { organization: true },
          orderBy: { createdAt: 'asc' },
        });
        if (existingMembership) {
          org = existingMembership.organization;
        }
      }

      let membership = null;
      if (org) {
        membership = await tx.membership.findUnique({
          where: { userId_orgId: { userId: user.id, orgId: org.id } },
        });

        if (!membership) {
          membership = await tx.membership.create({
            data: {
              userId: user.id,
              orgId: org.id,
              role: 'MEMBER',
            },
          });
        }
      } else {
        // If no organization match exists, create initial workspace
        const orgName = `${fullName || 'Personal'}'s Workspace`;
        const baseSlug =
          orgName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'workspace';
        const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

        org = await tx.organization.create({
          data: {
            name: orgName,
            slug: uniqueSlug,
            ...(workosOrgId ? { workosOrganizationId: workosOrgId } : {}),
            ssoEnabled: Boolean(workosOrgId),
          },
        });

        membership = await tx.membership.create({
          data: {
            userId: user.id,
            orgId: org.id,
            role: 'OWNER',
          },
        });
      }

      return { user, org, membership };
    });

    // Create NextAuth JWT session token
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '';
    const isProduction = process.env.NODE_ENV === 'production';
    const primaryCookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const legacyCookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    const sessionPayload = {
      id: result.user.id,
      sub: result.user.id,
      name: result.user.name,
      email: result.user.email,
      activeOrgId: result.org.id,
      activeOrgName: result.org.name,
      activeOrgRole: result.membership.role,
    };

    const sessionToken = await encode({
      token: sessionPayload,
      secret,
      salt: primaryCookieName,
    });

    const response = NextResponse.redirect(new URL('/app', req.url));

    response.cookies.set(primaryCookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    });

    response.cookies.set(legacyCookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    });

    return response;
  } catch (err: unknown) {
    console.error('WorkOS SSO callback processing error:', err);
    const message = err instanceof Error ? err.message : 'Authentication failed.';
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('error', encodeURIComponent(message));
    return NextResponse.redirect(redirectUrl);
  }
}
