if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'multicrm_dev_secret_key_2026_do_not_use_in_production';
}
if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = 'true';
}

import NextAuth from 'next-auth';
import { authConfig } from './lib/auth/config';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
