import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getContacts, createContact } from '@/lib/db/queries/contacts';
import { contactSchema } from '@/lib/validations/contact';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const contacts = await getContacts(session, { source, search, limit, offset });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('GET /api/contacts Error:', error);
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
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const contact = await createContact(session, parsed.data);
    return NextResponse.json({ message: 'Contact created successfully', contact }, { status: 201 });
  } catch (error) {
    console.error('POST /api/contacts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
