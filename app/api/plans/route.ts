import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET() {
  try {
    const plans = await sql.query(
      'SELECT plan_id, plan_name, price_per_month, max_users, max_contacts, features FROM subscription_plans ORDER BY price_per_month ASC'
    );
    return NextResponse.json(plans);
  } catch (error) {
    console.error('GET /api/plans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
