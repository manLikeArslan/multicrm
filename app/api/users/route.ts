import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { tq } from '@/lib/db/tenant';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Fetch team users scoped to company, joining roles for role names
    const users = await tq(
      session,
      `SELECT u.user_id, u.company_id, u.role_id, u.full_name, u.email, u.phone, u.status, u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.company_id = $1 AND u.status = 'active'
       ORDER BY u.created_at DESC`,
      [companyId]
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.roleName !== 'admin' && user.roleId !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const body = await req.json();
    const { full_name, email, password, role_id, phone } = body;

    if (!full_name || !email || !password || !role_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // Verify if user email already exists globally
    const existing = await tq(
      session,
      'SELECT user_id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash user password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await tq(
      session,
      `INSERT INTO users (company_id, role_id, full_name, email, password_hash, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING user_id, company_id, role_id, full_name, email, phone, status, created_at`,
      [companyId, role_id, full_name, email, passwordHash, phone || null]
    );

    return NextResponse.json({ message: 'User created successfully', user: result[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
