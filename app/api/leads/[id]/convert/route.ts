import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { convertLeadToDeal } from '@/lib/db/queries/leads';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const body = await req.json();
    const { deal_title, value } = body;

    if (!deal_title) {
      return NextResponse.json({ error: 'Deal title is required' }, { status: 400 });
    }

    const numericValue = value ? parseFloat(value) : 0;

    const deal = await convertLeadToDeal(session, leadId, deal_title, numericValue);
    return NextResponse.json({ message: 'Lead successfully converted to deal', deal }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/leads/[id]/convert Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
