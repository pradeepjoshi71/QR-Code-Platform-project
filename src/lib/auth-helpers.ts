import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Authenticates the current NextAuth session and verifies membership
 * in the user's active workspace organization.
 * Returns { userId, activeOrgId, membership, sessionUser } or { error, status }.
 */
export async function getAuthenticatedUserWithActiveOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const userId = session.user.id;
  let activeOrgId = session.user.activeOrgId;

  // Fallback to primary membership if activeOrgId not set in session
  if (!activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      return { error: 'No workspace found for this user', status: 403 } as const;
    }
    activeOrgId = membership.orgId;
  }

  // Verify membership in this active organization, including organization details
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: activeOrgId,
      },
    },
    include: { organization: true },
  });

  if (!membership) {
    return { error: 'Access to the specified workspace is forbidden', status: 403 } as const;
  }

  return { userId, activeOrgId, membership, sessionUser: session.user };
}
