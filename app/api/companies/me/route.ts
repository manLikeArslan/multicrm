import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db/client';
import { tq } from '@/lib/db/tenant';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const companies = await tq(
      session,
      `SELECT c.*, s.plan_name, s.price_per_month, s.max_users, s.max_contacts 
       FROM companies c
       JOIN subscription_plans s ON c.plan_id = s.plan_id
       WHERE c.company_id = $1 LIMIT 1`,
      [companyId]
    );

    if (companies.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(companies[0]);
  } catch (error) {
    console.error('GET /api/companies/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const { company_name, industry, email, phone, address, city, country } = body;

    if (!company_name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const companyId = session.user.companyId;

    const result = await tq(
      session,
      `UPDATE companies 
       SET company_name = $1, industry = $2, email = $3, phone = $4, address = $5, city = $6, country = $7
       WHERE company_id = $8
       RETURNING *`,
      [company_name, industry || null, email, phone || null, address || null, city || null, country || null, companyId]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Company update failed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Company settings updated successfully', company: result[0] });
  } catch (error) {
    console.error('PATCH /api/companies/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
