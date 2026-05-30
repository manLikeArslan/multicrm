if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'multicrm_dev_secret_key_2026_do_not_use_in_production';
}
if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = 'true';
}

import { auth } from './auth';

export default auth;

export const config = {
  // Protect all dashboard and api paths except static assets
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/login',
    '/register'
  ],
};
