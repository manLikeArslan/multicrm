import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getLeads, createLead } from '@/lib/db/queries/leads';
import { leadSchema } from '@/lib/validations/lead';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const assigned_to = searchParams.get('assigned_to') ? parseInt(searchParams.get('assigned_to')!, 10) : undefined;
    const contact_id = searchParams.get('contact_id') ? parseInt(searchParams.get('contact_id')!, 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const leads = await getLeads(session, { status, assigned_to, contact_id, limit, offset });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('GET /api/leads Error:', error);
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
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const lead = await createLead(session, parsed.data);
    return NextResponse.json({ message: 'Lead created successfully', lead }, { status: 201 });
  } catch (error) {
    console.error('POST /api/leads Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
