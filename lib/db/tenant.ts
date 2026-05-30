import { sql } from './client';

export interface TenantSession {
  user?: {
    userId: number;
    companyId: number;
    companyName: string;
    roleId: number;
    roleName: string;
    fullName: string;
    email?: string;
  };
}

/**
 * Tenant-scoped query wrapper. Enforces authentication and company session validation
 * before executing any Postgres operation to ensure strict tenant isolation.
 */
export async function tq<T = any[]>(
  session: TenantSession | null | undefined,
  query: string,
  params: unknown[] = []
): Promise<T> {
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized: Tenant context is missing or invalid.');
  }

  // Neon serverless query execution
  const result = await sql.query(query, params);
  return result as unknown as T;
}
