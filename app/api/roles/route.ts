import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Missing tenant context' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const roles = await sql.query(
      'SELECT role_id, role_name, description, company_id FROM roles WHERE company_id IS NULL OR company_id = $1 ORDER BY role_id ASC',
      [companyId]
    );
    return NextResponse.json(roles);
  } catch (error) {
    console.error('GET /api/roles Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const isAdmin = user.roleName === 'admin' || user.roleId === 1;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const body = await req.json();
    const { role_name, description } = body;

    if (!role_name || role_name.trim().length < 2) {
      return NextResponse.json({ error: 'Role name must be at least 2 characters' }, { status: 400 });
    }

    const formattedRoleName = role_name.trim().toLowerCase();

    // Check for duplicate within the same company
    const existing = await sql.query(
      'SELECT role_id FROM roles WHERE LOWER(role_name) = $1 AND (company_id = $2 OR company_id IS NULL)',
      [formattedRoleName, user.companyId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A role with this name already exists inside this organization' }, { status: 409 });
    }

    // Insert the new custom role
    const newRole = await sql.query(
      `INSERT INTO roles (role_name, description, company_id)
       VALUES ($1, $2, $3)
       RETURNING role_id, role_name, description, company_id`,
      [role_name.trim(), description || null, user.companyId]
    );

    return NextResponse.json(newRole[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/roles Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
