import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, organizationName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const orgName = (organizationName && String(organizationName).trim()) || `${name || 'Personal'}'s Workspace`;

    // Generate unique slug
    const baseSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // Create User, Organization, and Membership (OWNER) in a single atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name ? String(name).trim() : null,
          email: normalizedEmail,
          hashedPassword,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug: uniqueSlug,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          orgId: organization.id,
          role: 'OWNER',
        },
      });

      return { user, organization, membership };
    });

    return NextResponse.json(
      {
        message: 'Account and workspace created successfully.',
        userId: result.user.id,
        orgId: result.organization.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating your account.' },
      { status: 500 }
    );
  }
}
