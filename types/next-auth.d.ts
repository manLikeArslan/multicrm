import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      userId: number;
      companyId: number;
      companyName: string;
      roleId: number;
      roleName: 'admin' | 'manager' | 'sales_rep';
      fullName: string;
      email: string;
    } & DefaultSession['user'];
  }

  interface User {
    userId: number;
    companyId: number;
    companyName: string;
    roleId: number;
    roleName: 'admin' | 'manager' | 'sales_rep';
    fullName: string;
    email: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: number;
    companyId: number;
    companyName: string;
    roleId: number;
    roleName: 'admin' | 'manager' | 'sales_rep';
    fullName: string;
  }
}
