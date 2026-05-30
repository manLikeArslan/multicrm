import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPayments, createPayment } from '@/lib/db/queries/payments';
import { paymentSchema } from '@/lib/validations/payment';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const invoice_id = searchParams.get('invoice_id') ? parseInt(searchParams.get('invoice_id')!, 10) : undefined;

    const payments = await getPayments(session, { invoice_id });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('GET /api/payments Error:', error);
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
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const payment = await createPayment(session, parsed.data as any);
    return NextResponse.json({ message: 'Payment recorded successfully', payment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/payments Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
