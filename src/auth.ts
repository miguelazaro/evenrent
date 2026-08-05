import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, 
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = z
            .object({
              email: z.string().email(),
              password: z.string().min(6),
            })
            .parse(credentials);

          const user = await db.user.findFirst({
            where: {
              email: email.toLowerCase(),
            },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  plan: true,
                  status: true,
                },
              },
            },
          });

          if (!user || !user.password) {
            return null;
          }

          if (user.organization.status !== 'ACTIVE') {
            throw new Error('Organización suspendida o cancelada');
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            organizationId: user.organization.id,
            organizationName: user.organization.name,
            organizationSlug: user.organization.slug,
            organizationPlan: user.organization.plan,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.organizationSlug = (user as any).organizationSlug;
        token.organizationPlan = (user as any).organizationPlan;
        token.name = user.name;
      }
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).organizationName = token.organizationName;
        (session.user as any).organizationSlug = token.organizationSlug;
        (session.user as any).organizationPlan = token.organizationPlan;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
