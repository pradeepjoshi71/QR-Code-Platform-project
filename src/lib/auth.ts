import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // NextAuth v5 JWT session for fast edge verification and database-backed provider interoperability
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase().trim() },
          include: { accounts: true },
        });

        if (existingUser) {
          const isGoogleLinked = existingUser.accounts.some(
            (acc) => acc.provider === 'google' && acc.providerAccountId === account.providerAccountId
          );

          if (!isGoogleLinked && !existingUser.emailVerified) {
            return `/sign-in?error=${encodeURIComponent(
              'Security restriction: Cannot link Google sign-in to an account with an unverified email address. Please verify your email first.'
            )}`;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // If user logs in via OAuth for the first time, make sure they have a default Organization and Membership
      if (token.id && !token.activeOrgId) {
        const memberships = await prisma.membership.findMany({
          where: { userId: token.id as string },
          include: { organization: true },
          orderBy: { createdAt: 'asc' },
        });

        if (memberships.length > 0) {
          token.activeOrgId = memberships[0].orgId;
          token.activeOrgName = memberships[0].organization.name;
          token.activeOrgRole = memberships[0].role;
        } else {
          // Create initial workspace for OAuth user
          const defaultName = (token.name as string) || 'Personal Workspace';
          const baseSlug = defaultName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'workspace';
          const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

          const newOrg = await prisma.organization.create({
            data: {
              name: defaultName,
              slug: uniqueSlug,
              memberships: {
                create: {
                  userId: token.id as string,
                  role: 'OWNER',
                },
              },
            },
          });

          token.activeOrgId = newOrg.id;
          token.activeOrgName = newOrg.name;
          token.activeOrgRole = 'OWNER';
        }
      }

      if (trigger === 'update' && session?.activeOrgId) {
        token.activeOrgId = session.activeOrgId;
        token.activeOrgName = session.activeOrgName;
        token.activeOrgRole = session.activeOrgRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.activeOrgId = token.activeOrgId as string;
        session.user.activeOrgName = token.activeOrgName as string;
        session.user.activeOrgRole = token.activeOrgRole as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
