import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db/client';
import { registerSchema } from '@/lib/validations/register';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body against schema
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if user email already exists
    const existingUsers = await sql.query(
      'SELECT user_id FROM users WHERE email = $1 LIMIT 1',
      [data.work_email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if company email already exists
    const existingCompanies = await sql.query(
      'SELECT company_id FROM companies WHERE email = $1 LIMIT 1',
      [data.company_email]
    );

    if (existingCompanies.length > 0) {
      return NextResponse.json(
        { error: 'Company email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Atomic Insertion of Company and Admin User
    const result = await sql.query(
      `WITH new_company AS (
         INSERT INTO companies (plan_id, company_name, industry, email, phone, country, status)
         VALUES (1, $1, $2, $3, $4, $5, 'active')
         RETURNING company_id
       )
       INSERT INTO users (company_id, role_id, full_name, email, password_hash, status)
       SELECT company_id, 1, $6, $7, $8, 'active' FROM new_company
       RETURNING user_id, company_id;`,
      [
        data.company_name,
        data.industry || null,
        data.company_email,
        data.phone || null,
        data.country || null,
        data.full_name,
        data.work_email,
        passwordHash,
      ]
    );

    if (result.length === 0) {
      throw new Error('Registration failed, database did not return created records.');
    }

    return NextResponse.json(
      { message: 'Registration successful', userId: result[0].user_id, companyId: result[0].company_id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
