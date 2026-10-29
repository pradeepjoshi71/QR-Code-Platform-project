import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit-log';
import {
  addDomainToProject,
  getDomainStatus,
  removeDomainFromProject,
} from '@/lib/vercel-domains';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

function cleanDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  // Strip protocol if user inadvertently typed http:// or https://
  domain = domain.replace(/^https?:\/\//i, '');
  // Strip any trailing slashes or path segments
  domain = domain.split('/')[0].split('?')[0].split('#')[0];
  // Strip port if present
  domain = domain.split(':')[0];
  return domain;
}

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// ---------------------------------------------------------------------------
// GET /api/organizations/domain
// Returns current custom domain + live verification and DNS status from Vercel.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;

    let customDomain = await prisma.customDomain.findUnique({
      where: { organizationId: activeOrgId },
    });

    if (!customDomain) {
      return NextResponse.json({ customDomain: null });
    }

    // Attempt to query live Vercel status to sync verification state
    try {
      const liveStatus = await getDomainStatus(customDomain.domain);
      if (
        liveStatus.verified !== customDomain.verified ||
        liveStatus.vercelConfigured !== customDomain.vercelConfigured
      ) {
        customDomain = await prisma.customDomain.update({
          where: { id: customDomain.id },
          data: {
            verified: liveStatus.verified,
            vercelConfigured: liveStatus.vercelConfigured,
          },
        });
      }
    } catch (vercelError: unknown) {
      // If Vercel API check fails (e.g. unconfigured token locally), fall back to DB state
      console.warn('Unable to refresh live domain status from Vercel:', vercelError);
    }

    return NextResponse.json({
      customDomain,
      dnsInstructions: {
        type: 'CNAME',
        host: customDomain.domain,
        value: 'cname.vercel-dns.com',
      },
    });
  } catch (error: unknown) {
    console.error('Failed to retrieve custom domain:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve custom domain.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/organizations/domain
// Adds a custom domain for the active organization (OWNER only).
// Body: { domain: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    // Strict OWNER-only authorization
    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can configure custom domains.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawDomain = body.domain;

    if (!rawDomain || typeof rawDomain !== 'string') {
      return NextResponse.json({ error: 'A domain name is required.' }, { status: 400 });
    }

    const domain = cleanDomain(rawDomain);
    if (!DOMAIN_REGEX.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Example: qr.yourbrand.com or links.company.org' },
        { status: 400 }
      );
    }

    // Rule: One custom domain per organization
    const existingOrgDomain = await prisma.customDomain.findUnique({
      where: { organizationId: activeOrgId },
    });

    if (existingOrgDomain) {
      return NextResponse.json(
        { error: 'This workspace already has a custom domain attached. Remove it first before adding a new one.' },
        { status: 400 }
      );
    }

    // Rule: Domain must not be claimed by another workspace
    const domainConflict = await prisma.customDomain.findUnique({
      where: { domain },
    });

    if (domainConflict) {
      return NextResponse.json(
        { error: 'This domain is already registered to an organization.' },
        { status: 409 }
      );
    }

    // Add domain to Vercel project via REST API
    const vercelResult = await addDomainToProject(domain);

    // Save in database
    const customDomain = await prisma.customDomain.create({
      data: {
        organizationId: activeOrgId,
        domain,
        verified: vercelResult.verified,
        vercelConfigured: vercelResult.vercelConfigured,
      },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'domain.added',
      targetType: 'CustomDomain',
      targetId: customDomain.id,
      metadata: {
        domain: customDomain.domain,
      },
    });

    return NextResponse.json(
      {
        customDomain,
        dnsInstructions: {
          type: 'CNAME',
          host: domain,
          value: 'cname.vercel-dns.com',
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Failed to attach custom domain:', error);
    const message = error instanceof Error ? error.message : 'Failed to attach custom domain.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/organizations/domain
// Removes the custom domain for the active organization (OWNER only).
// ---------------------------------------------------------------------------
export async function DELETE() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    // Strict OWNER-only authorization
    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can remove custom domains.' },
        { status: 403 }
      );
    }

    const customDomain = await prisma.customDomain.findUnique({
      where: { organizationId: activeOrgId },
    });

    if (!customDomain) {
      return NextResponse.json(
        { error: 'No custom domain found for this workspace.' },
        { status: 404 }
      );
    }

    // Remove from Vercel project
    try {
      await removeDomainFromProject(customDomain.domain);
    } catch (vercelError: unknown) {
      // Log warning but proceed with DB deletion if Vercel removal fails (e.g. absent token or already removed)
      console.warn('Warning: Vercel domain removal error:', vercelError);
    }

    // Delete from database
    await prisma.customDomain.delete({
      where: { id: customDomain.id },
    });

    // Fire-and-forget audit log
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'domain.removed',
      targetType: 'CustomDomain',
      targetId: customDomain.id,
      metadata: {
        domain: customDomain.domain,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom domain removed successfully.',
    });
  } catch (error: unknown) {
    console.error('Failed to remove custom domain:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove custom domain.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
