import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit-log';
import { getWorkOS, getAdminPortalLink } from '@/lib/workos';

// ---------------------------------------------------------------------------
// Auth helper — verifies user and retrieves active organization membership
// ---------------------------------------------------------------------------
async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const userId = session.user.id;
  let activeOrgId = session.user.activeOrgId;

  if (!activeOrgId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!firstMembership) {
      return { error: 'No workspace found for this user', status: 403 } as const;
    }
    activeOrgId = firstMembership.orgId;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: activeOrgId } },
    include: { organization: true },
  });

  if (!membership) {
    return { error: 'Access to the specified workspace is forbidden', status: 403 } as const;
  }

  return { userId, activeOrgId, membership };
}

// ---------------------------------------------------------------------------
// GET /api/organizations/sso/setup
// Returns current SSO configuration status for the active organization.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { membership } = authResult;
    const org = membership.organization;

    return NextResponse.json({
      ssoEnabled: org.ssoEnabled,
      workosOrganizationId: org.workosOrganizationId,
    });
  } catch (error: unknown) {
    console.error('Failed to get SSO status:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve SSO configuration.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/organizations/sso/setup
// OWNER only: Provisions or retrieves a WorkOS Organization, generates a
// WorkOS Admin Portal link for IT admin self-configuration, enables SSO, and logs the action.
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, activeOrgId, membership } = authResult;

    // Strict OWNER-only authorization
    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can configure Enterprise SSO.' },
        { status: 403 }
      );
    }

    const org = membership.organization;
    let workosOrgId = org.workosOrganizationId;

    // If organization is not yet registered in WorkOS, create it via WorkOS API
    if (!workosOrgId) {
      const workos = getWorkOS();
      const workosOrg = await workos.organizations.createOrganization({
        name: org.name,
      });
      workosOrgId = workosOrg.id;

      await prisma.organization.update({
        where: { id: activeOrgId },
        data: {
          workosOrganizationId: workosOrgId,
          ssoEnabled: true,
        },
      });
    } else if (!org.ssoEnabled) {
      await prisma.organization.update({
        where: { id: activeOrgId },
        data: { ssoEnabled: true },
      });
    }

    // Generate Admin Portal link
    const portalUrl = await getAdminPortalLink(workosOrgId);

    // Fire-and-forget audit log: "sso.enabled"
    logAction({
      organizationId: activeOrgId,
      actorUserId: userId,
      action: 'sso.enabled',
      targetType: 'Organization',
      targetId: activeOrgId,
      metadata: {
        workosOrganizationId: workosOrgId,
      },
    });

    return NextResponse.json({
      portalUrl,
      ssoEnabled: true,
      workosOrganizationId: workosOrgId,
    });
  } catch (error: unknown) {
    console.error('Failed to setup Enterprise SSO:', error);
    const message = error instanceof Error ? error.message : 'Failed to configure Enterprise SSO.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
