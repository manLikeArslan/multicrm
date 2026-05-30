import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getInvoices, createInvoice } from '@/lib/db/queries/invoices';
import { invoiceSchema } from '@/lib/validations/invoice';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const deal_id = searchParams.get('deal_id') ? parseInt(searchParams.get('deal_id')!, 10) : undefined;

    const invoices = await getInvoices(session, { status, deal_id });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('GET /api/invoices Error:', error);
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
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const invoice = await createInvoice(session, parsed.data as any);
    return NextResponse.json({ message: 'Invoice created successfully', invoice }, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
