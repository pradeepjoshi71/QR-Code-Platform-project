import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List all workspaces the logged-in user belongs to
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const workspaces = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      isActive: m.organization.id === session.user.activeOrgId,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Workspaces list error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve workspaces.' },
      { status: 500 }
    );
  }
}

// POST: Switch active workspace or create new workspace
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, orgId, name } = body;

    if (action === 'switch') {
      if (!orgId) {
        return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 });
      }

      // Verify membership
      const membership = await prisma.membership.findUnique({
        where: {
          userId_orgId: {
            userId: session.user.id,
            orgId,
          },
        },
        include: { organization: true },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this workspace.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        message: 'Workspace switched successfully.',
        activeOrg: {
          id: membership.organization.id,
          name: membership.organization.name,
          role: membership.role,
        },
      });
    }

    if (action === 'create') {
      if (!name || !String(name).trim()) {
        return NextResponse.json({ error: 'Workspace name is required.' }, { status: 400 });
      }

      const orgName = String(name).trim();
      const baseSlug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'workspace';
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

      const newOrg = await prisma.organization.create({
        data: {
          name: orgName,
          slug: uniqueSlug,
          memberships: {
            create: {
              userId: session.user.id,
              role: 'OWNER',
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: 'Workspace created successfully.',
          organization: newOrg,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Workspace action error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
