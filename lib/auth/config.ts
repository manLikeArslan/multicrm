if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'multicrm_dev_secret_key_2026_do_not_use_in_production';
}
if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = 'true';
}

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from '../db/client';
import { SessionUser } from '../../types';

export const authConfig = {
  secret: process.env.AUTH_SECRET || 'multicrm_dev_secret_key_2026_do_not_use_in_production',
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user object is populated from authorize() return
        const u = user as unknown as SessionUser;
        token.userId = u.userId;
        token.companyId = u.companyId;
        token.companyName = u.companyName;
        token.roleId = u.roleId;
        token.roleName = u.roleName;
        token.fullName = u.fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          userId: token.userId as number,
          companyId: token.companyId as number,
          companyName: token.companyName as string,
          roleId: token.roleId as number,
          roleName: token.roleName as 'admin' | 'manager' | 'sales_rep',
          fullName: token.fullName as string,
        } as any;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnApi = nextUrl.pathname.startsWith('/api');
      const isPublicApi = nextUrl.pathname === '/api/register' || nextUrl.pathname === '/api/plans' || nextUrl.pathname.startsWith('/api/auth');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isOnApi && !isPublicApi) {
        if (isLoggedIn) return true;
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // If user is logged in and tries to access login/register, redirect to dashboard
      if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Fetch user and company name using raw SQL
          const users = await sql.query(
            `SELECT u.*, r.role_name, c.company_name 
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             JOIN companies c ON u.company_id = c.company_id
             WHERE u.email = $1 AND u.status = 'active'
             LIMIT 1`,
            [email]
          );

          if (users.length === 0) return null;

          const user = users[0];
          const isPasswordValid = await bcrypt.compare(password, user.password_hash);

          if (!isPasswordValid) return null;

          // Return session user properties mapped to authorize
          return {
            id: user.user_id.toString(),
            userId: user.user_id,
            companyId: user.company_id,
            companyName: user.company_name,
            roleId: user.role_id,
            roleName: user.role_name,
            fullName: user.full_name,
            email: user.email,
          } as any;
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
