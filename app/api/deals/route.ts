import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDeals, createDeal } from '@/lib/db/queries/deals';
import { dealSchema } from '@/lib/validations/deal';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage') || undefined;
    const assigned_to = searchParams.get('assigned_to') ? parseInt(searchParams.get('assigned_to')!, 10) : undefined;

    const deals = await getDeals(session, { stage, assigned_to });
    return NextResponse.json(deals);
  } catch (error) {
    console.error('GET /api/deals Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = dealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const deal = await createDeal(session, parsed.data);
    return NextResponse.json({ message: 'Deal created successfully', deal }, { status: 201 });
  } catch (error) {
    console.error('POST /api/deals Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
